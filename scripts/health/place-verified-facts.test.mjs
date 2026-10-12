import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  CAIRO_ATTRACTION_FACTS,
  CAIRO_CITY_FACTS,
  resolveOfficialMention,
  resolveVerifiedFacts,
} from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  AI_GENERATED_LABEL,
  ATTRACTION_SLOT_IDS,
  CITY_SLOT_IDS,
  presentFactText,
  publicSourceName,
  renderAiGeneratedLabel,
  slotLooksEmpty,
  unverifiedItemsLabel,
  UNVERIFIED_LABEL,
} from '../../src/data/placeVerifiedFacts/schema.js';
import { splitItineraryPlaceMentions } from '../../src/data/placeVerifiedFacts/itineraryLinks.js';
import {
  checkedAtForLocale,
  extractFactTokens,
  hangulOutsideEnglishProperNounParens,
  factValueForLocale,
  linkLabelForLocale,
  sourceNameForLocale,
  splitFactTimeRanges,
} from '../../src/data/placeVerifiedFacts/cairoEn.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function assertSlotSchema(slot) {
  assert.equal(typeof slot.value, 'string');
  assert.equal(typeof slot.checkedAt, 'string');
  assert.ok('source' in slot);
  if (slot.source) {
    assert.equal(typeof slot.source.name, 'string');
    assert.equal(typeof slot.source.url, 'string');
  }
  assert.ok(Array.isArray(slot.sources));
  for (const source of slot.sources) {
    assert.equal(typeof source.name, 'string');
    assert.equal(typeof source.url, 'string');
    assert.equal(source.url.includes('google.com/search'), false);
    assert.equal(/drafts\/|\.md\b/.test(source.name), false);
    assert.equal(/drafts\/|\.md\b/.test(source.url), false);
  }
}

test('cairo city has 6 slots and attractions have 7', () => {
  assert.deepEqual(CAIRO_CITY_FACTS.slots.map((slot) => slot.id), CITY_SLOT_IDS);
  assert.equal(CAIRO_ATTRACTION_FACTS.length, 4);
  for (const card of CAIRO_ATTRACTION_FACTS) {
    assert.deepEqual(card.slots.map((slot) => slot.id), ATTRACTION_SLOT_IDS);
    for (const slot of card.slots) assertSlotSchema(slot);
  }
  for (const slot of CAIRO_CITY_FACTS.slots) assertSlotSchema(slot);
});

test('empty cells stay empty and render as unverified', () => {
  const cityEmpty = ['stay-area', 'season'];
  for (const id of cityEmpty) {
    const slot = CAIRO_CITY_FACTS.slots.find((item) => item.id === id);
    assert.equal(slot.value, '');
    assert.equal(slot.source, null);
    assert.equal(slot.checkedAt, '');
    assert.equal(slotLooksEmpty(slot), true);
    assert.equal(presentFactText(slot.value), UNVERIFIED_LABEL);
    assert.equal(presentFactText(slot.checkedAt), UNVERIFIED_LABEL);
    assert.doesNotMatch(presentFactText(slot.value), /겨울|봄|더위|성수기|10월/);
  }
  for (const card of CAIRO_ATTRACTION_FACTS) {
    for (const id of ['duration', 'nearby-food']) {
      const slot = card.slots.find((item) => item.id === id);
      assert.equal(slot.value, '');
      assert.equal(presentFactText(slot.value), UNVERIFIED_LABEL);
    }
  }
});

test('public source labels and one unverified line', () => {
  assert.equal(publicSourceName('drafts/blog-2026-cairo-travelogue.md «사흘의 윤곽»'), 'GATEO 로그북 (2026-10-03)');
  const citySources = CAIRO_CITY_FACTS.slots.flatMap((slot) => slot.sources);
  assert.ok(citySources.some((source) => source.name === 'GATEO 로그북 (2026-10-03)' && source.url === ''));
  const entry = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'entry');
  assert.match(entry.value, /^한국 여권은 전자비자\(e-Visa\) 대상이에요/);
  assert.match(entry.value, /25달러, 복수 60달러/);
  const airport = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'airport');
  assert.match(airport.value, /흰색 택시/);
  assert.equal(airport.sources[0].url, '');
  assert.equal(airport.sources[0].name, '카이로국제공항 교통 안내');
  assert.equal(/접속 불가/.test(airport.sources[0].name), false);
  const itinerary = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'itinerary');
  assert.equal(airport.value.startsWith('CAI 공식 안내예요'), false);
  assert.match(itinerary.value, /^D1 도착하면 위 ‘공항→시내’ 방법으로 시내에 들어가 쉬어요/);
  assert.equal(itinerary.value.includes('(위 칸)'), false);
  assert.equal(itinerary.value.split('\n').filter((line) => /^D[123] /.test(line)).length, 3);
  assert.equal(airport.sources[1].url, 'https://www.uber.com/global/en/r/airports/cai/pickup/');
  assert.equal(unverifiedItemsLabel(CAIRO_CITY_FACTS.slots), '확인 안 된 항목: 머물 지역, 시즌');

  const gem = resolveVerifiedFacts('grand-egyptian-museum');
  const booking = gem.slots.find((slot) => slot.id === 'booking');
  const map = gem.slots.find((slot) => slot.id === 'map');
  assert.match(gem.slots.find((slot) => slot.id === 'fee').value, /^외국인 성인은 1,590 EGP/);
  assert.equal(gem.slots.find((slot) => slot.id === 'hours').value.split('\n').length, 2);
  assert.ok(gem.slots.find((slot) => slot.id === 'notes').value.includes('\n'));
  assert.equal(booking.linkLabel, 'GEM 공식 예매');
  assert.equal(map.source.name, 'Google 지도');
  assert.equal(map.linkLabel, 'Google 지도');
  assert.equal(unverifiedItemsLabel(gem.slots), '확인 안 된 항목: 소요 시간, 주변 식당');

  const hassan = resolveVerifiedFacts('sultan-hassan-mosque');
  const notes = hassan.slots.find((slot) => slot.id === 'notes');
  assert.ok(notes.sources.some((source) => source.name === 'GATEO 로그북 (2026-10-03)'));
  assert.equal(notes.sources.some((source) => /drafts\/|\.md/.test(source.name)), false);

  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  const header = readFileSync(join(root, 'src/components/PlaceCard/panels/PlaceChatPanel.jsx'), 'utf8');
  assert.match(factsUi, /data-unverified-items/);
  assert.match(header, /line-clamp-2/);
  assert.match(header, /\[word-break:keep-all\]/);
  assert.match(header, /\[overflow-wrap:break-word\]/);
  assert.equal(header.includes('[overflow-wrap:anywhere]'), false);
  assert.match(header, /line-clamp-2 whitespace-normal/);
  assert.match(factsUi, /data-itinerary-place/);
  assert.match(header, /clamp\(0\.8125rem,3\.8vw,1rem\)/);

  const links = splitItineraryPlaceMentions(itinerary.value).filter((part) => part.type === 'link');
  assert.deepEqual(
    links.map((part) => [part.text, part.href]),
    [
      ['GEM', '/place/grand-egyptian-museum'],
      ['술탄 하산 모스크', '/place/sultan-hassan-mosque'],
    ],
  );
  assert.equal(itinerary.value.includes('GEM은'), true);
  assert.equal(itinerary.value.includes('술탄 하산 모스크에'), true);
});

test('pilot booking and map links are used and search buttons are not', () => {
  const gem = resolveVerifiedFacts('grand-egyptian-museum');
  assert.equal(gem.bookingUrl, 'https://tickets.gem.eg/');
  assert.match(gem.mapUrl, /query_place_id=ChIJ0YpKmDRFWBQRGibsxFtMdkU/);
  const hassan = resolveVerifiedFacts({ name: '카이로 술탄하산모스크' });
  assert.equal(hassan.bookingUrl, 'https://egymonuments.com/details/Mosque-MadrassaSultanHassan');
  assert.match(hassan.mapUrl, /query_place_id=ChIJdRfpCqxAWBQR5IwPTJC5xnQ/);

  const giza = resolveOfficialMention('기자 피라미드', '카이로');
  assert.equal(giza.links[0].label, '관광유물부 공식 예매');
  assert.equal(giza.links[0].url, 'https://egymonuments.com/details/Pyramids');
  assert.equal(giza.links[1].label, 'Google 지도');
  assert.match(giza.links[1].url, /query_place_id=ChIJ1-7Ki31PWBQRbbfEc4MNCJk/);
  assert.equal(giza.links.some((link) => link.url.includes('google.com/search')), false);

  const unnamed = resolveOfficialMention('칸 엘칼릴리', 'cairo');
  assert.equal(unnamed.plain, true);
  assert.equal(unnamed.links, undefined);

  assert.equal(resolveOfficialMention('에펠탑', '파리'), null);
});

test('AI generated label is present on verified-fact cards', () => {
  assert.equal(AI_GENERATED_LABEL, 'AI 생성 · 출처 없음');
  assert.equal(renderAiGeneratedLabel(''), AI_GENERATED_LABEL);
  assert.equal(renderAiGeneratedLabel('2026-10-11'), 'AI 생성 · 출처 없음 · 2026-10-11');
  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  const wiki = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceWikiDetailsView.jsx'), 'utf8');
  const gallery = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
  assert.match(factsUi, /data-ai-generated-label/);
  assert.match(factsUi, /data-verified-facts/);
  assert.match(wiki, /AiGeneratedBanner/);
  assert.match(gallery, /PlaceVerifiedFacts/);
});

test('GEM and Sultan Hassan hub cards exist', () => {
  const hubs = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/cityAttractionHubs.json'), 'utf8'));
  const cairo = hubs.find((hub) => hub.hubId === 'cairo');
  const names = cairo.attractions.map((item) => item.name_en);
  assert.ok(names.includes('Grand Egyptian Museum'));
  assert.ok(names.includes('Sultan Hassan Mosque'));
  assert.equal(resolveVerifiedFacts('Grand Egyptian Museum')?.slug, 'grand-egyptian-museum');
  assert.equal(resolveVerifiedFacts('Sultan Hassan Mosque')?.kind, 'attraction');
});

test('english fact headings are localized and values stay Korean', async () => {
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  assert.equal(en.place.facts.title, 'Verified facts');
  assert.equal(en.place.facts.slots.hours, 'Hours');
  assert.equal(en.place.facts.slots.entry, 'Entry');
  assert.equal(ko.place.facts.title, '확인된 사실');
  assert.equal(ko.place.facts.slots.hours, '운영시간');
  assert.equal(en.place.nav.planner, 'Planner');
  const entry = CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'entry');
  assert.match(entry.value, /25달러, 복수 60달러/);
  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  assert.match(factsUi, /place\.facts\.title/);
  assert.match(factsUi, /place\.facts\.slots\./);
  const header = readFileSync(join(root, 'src/components/PlaceCard/panels/PlaceChatPanel.jsx'), 'utf8');
  assert.match(header, /whitespace-nowrap">\{t\('place\.nav\.planner'\)\}/);
  assert.match(header, /flex flex-col flex-1 min-w-0 justify-center overflow-hidden/);
  assert.equal(header.includes('min-w-[11rem]'), false);
  assert.equal(header.includes("locale === 'en' ? 'min-w-0 shrink'"), false);
});

test('english fact values keep Korean numbers, times, amounts, and URLs', () => {
  const cards = [
    CAIRO_CITY_FACTS,
    CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'grand-egyptian-museum'),
    CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'sultan-hassan-mosque'),
  ];
  for (const card of cards) {
    for (const slot of card.slots) {
      const ko = factValueForLocale(card.slug, slot, 'ko');
      const en = factValueForLocale(card.slug, slot, 'en');
      assert.equal(ko, slot.value);
      const enTokens = extractFactTokens(en);
      const comparable = (card.slug === 'grand-egyptian-museum' && slot.id === 'fee'
        ? enTokens.map((token) => (token === 'num:6' ? 'unit:6:years' : token))
        : enTokens).slice().sort();
      assert.deepEqual(comparable, extractFactTokens(ko));
      assert.deepEqual(hangulOutsideEnglishProperNounParens(en), []);
      for (const source of slot.sources || []) {
        assert.equal(sourceNameForLocale(source.name, 'ko'), source.name);
        const enName = sourceNameForLocale(source.name, 'en');
        if (/[가-힣]/.test(source.name)) assert.equal(/[가-힣]/.test(enName), false);
        else assert.equal(enName, source.name);
      }
      if (slot.linkLabel) {
        assert.equal(linkLabelForLocale(slot.linkLabel, 'ko'), slot.linkLabel);
        if (/[가-힣]/.test(slot.linkLabel)) {
          assert.equal(/[가-힣]/.test(linkLabelForLocale(slot.linkLabel, 'en')), false);
        }
      }
      assert.equal(checkedAtForLocale(slot.checkedAt, 'ko'), slot.checkedAt);
      assert.deepEqual(
        extractFactTokens(checkedAtForLocale(slot.checkedAt, 'en')),
        extractFactTokens(slot.checkedAt),
      );
    }
  }

  const entry = factValueForLocale('cairo', CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'entry'), 'en');
  assert.match(CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'entry').value, /한국 여권은 전자비자/);
  assert.equal(entry.includes('한국'), false);
  assert.equal(/Korean passport/i.test(entry), false);
  assert.match(entry, /depends on nationality/i);
  assert.match(entry, /visa2egypt\.gov\.eg/);
  assert.equal(entry.includes('United States'), false);
  assert.equal(entry.includes('British'), false);

  const itinerary = factValueForLocale(
    'cairo',
    CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'itinerary'),
    'en',
  );
  const links = splitItineraryPlaceMentions(itinerary).filter((part) => part.type === 'link');
  assert.deepEqual(
    links.map((part) => [part.text, part.href]),
    [
      ['GEM', '/place/grand-egyptian-museum'],
      ['Sultan Hassan Mosque', '/place/sultan-hassan-mosque'],
    ],
  );
  assert.equal(
    checkedAtForLocale('2026-10-11(시간) · 2026-10-03(동선)', 'en'),
    '2026-10-11(hours) · 2026-10-03(itinerary)',
  );
  assert.equal(linkLabelForLocale('GEM 공식 예매', 'en'), 'Official GEM tickets');
  assert.equal(linkLabelForLocale('Google 지도', 'en'), 'Google Maps');
  assert.equal(sourceNameForLocale('카이로국제공항 교통 안내', 'en'), 'Cairo International Airport transport guide');
  assert.equal(sourceNameForLocale('GATEO 로그북 (2026-10-03)', 'en'), 'GATEO logbook (2026-10-03)');
  assert.equal(sourceNameForLocale('외교부 여행경보', 'en'), 'MOFA travel alert');
  assert.equal(sourceNameForLocale('대사관 공지', 'en'), 'Embassy notice');
  assert.deepEqual(hangulOutsideEnglishProperNounParens('See Cairo (카이로).'), []);
  assert.ok(hangulOutsideEnglishProperNounParens('25달러').length > 0);
  assert.ok(hangulOutsideEnglishProperNounParens('(한국)').length > 0);
  assert.match(entry, /USD 25/);
  assert.match(entry, /USD 60/);
  assert.match(entry, /6 months/);

  const airport = factValueForLocale(
    'cairo',
    CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'airport'),
    'en',
  );
  assert.match(airport, /Uber has a CAI pickup guide page/);
  const safety = factValueForLocale(
    'cairo',
    CAIRO_CITY_FACTS.slots.find((slot) => slot.id === 'money-safety'),
    'en',
  );
  assert.match(safety, /have a 'leave the country' advisory/);
  assert.match(itinerary, /For dinner, try Koshary Abou Tarek downtown/);

  const gem = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'grand-egyptian-museum');
  const gemFee = factValueForLocale('grand-egyptian-museum', gem.slots.find((slot) => slot.id === 'fee'), 'en');
  assert.match(gemFee, /Children under 6 enter free/);
  assert.match(gemFee, /11:00–13:00/);

  const sultan = CAIRO_ATTRACTION_FACTS.find((card) => card.slug === 'sultan-hassan-mosque');
  const sultanFee = factValueForLocale('sultan-hassan-mosque', sultan.slots.find((slot) => slot.id === 'fee'), 'en');
  const sultanNotes = factValueForLocale('sultan-hassan-mosque', sultan.slots.find((slot) => slot.id === 'notes'), 'en');
  assert.match(sultanFee, /Admission includes the Al-Rifa'i Mosque across the street/);
  assert.match(sultanNotes, /It is on Salah al-Din Square, opposite the Al-Rifa'i Mosque/);
  const sultanInfo = sultan.slots.find((slot) => slot.id === 'fee').sources.find((source) => source.url.includes('sultan-hasan'));
  assert.equal(sultanInfo.name, '관광유물부');
  assert.equal(sourceNameForLocale(sultanInfo.name, 'en'), 'Ministry of Tourism and Antiquities');
  assert.match(sultanInfo.url, /mosque-and-madrasa-of-sultan-hasan/);

  assert.deepEqual(
    splitFactTimeRanges('windows 08:30–11:00, 11:00–13:00 and 09:00~18:00').filter((part) => part.type === 'time').map((part) => part.text),
    ['08:30–11:00', '11:00–13:00', '09:00~18:00'],
  );
  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  assert.match(factsUi, /splitFactTimeRanges/);
  assert.match(factsUi, /whitespace-nowrap/);
});
