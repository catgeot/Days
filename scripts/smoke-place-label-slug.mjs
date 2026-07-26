#!/usr/bin/env node
/**
 * 지구본 라벨 → slug/name_en + 무니 L2「역사」오탐 회귀.
 * 네트워크 없음. Usage: node scripts/smoke-place-label-slug.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

const LABEL_CASES = [
  {
    id: 'lesotho-ko-label-village-geo',
    label: '레소토 — 한글 labelEn + 마을 name_en → lesotho',
    clickedLabel: '레소토',
    clickedLabelEn: '레소토',
    lat: -29.6145397789916,
    lng: 28.290596492843,
    addressEn: {
      country: 'Lesotho',
      country_code: 'ls',
      village: 'Macheseng',
    },
    addressKo: {
      country: '레소토',
      country_code: 'ls',
      village: 'Macheseng',
    },
    featureNameEn: 'Macheseng',
    expect: { slug: 'lesotho', name_en: 'Lesotho' },
  },
  {
    id: 'eswatini-old-name-ko',
    label: '에스와티니 — Nominatim 구칭 스와질란드 → eswatini',
    clickedLabel: '에스와티니',
    clickedLabelEn: '',
    lat: -26.5,
    lng: 31.5,
    addressEn: {
      country: 'Eswatini',
      country_code: 'sz',
      state: 'Manzini Region',
    },
    addressKo: {
      country: '스와질란드',
      country_code: 'sz',
      state: '만지니구',
    },
    featureNameEn: 'Manzini',
    expect: { slug: 'eswatini', name_en: 'Eswatini' },
  },
];

const MOONI_L2_HISTORY = '역사나 문화적으로 특징이 뭐야?';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const { resolveTravelCountryFromAddresses } = await load(
    'src/pages/Home/lib/travelRegionCountry.js'
  );
  const { resolveGlobeLabelPinFields } = await load(
    'src/pages/Home/lib/resolveGlobeLabelPin.js'
  );
  const { getPlaceUrlParam, isEphemeralSlug } = await load(
    'src/pages/Home/lib/formatUrlName.js'
  );
  const { resolveDestinationFromChat } = await load(
    'src/utils/resolveDestinationFromChat.js'
  );

  let fail = 0;

  for (const c of LABEL_CASES) {
    try {
      const travelCountry = resolveTravelCountryFromAddresses(c.addressEn, c.addressKo);
      const fields = resolveGlobeLabelPinFields({
        clickedLabel: c.clickedLabel,
        clickedLabelEn: c.clickedLabelEn,
        address: {
          name_en: c.featureNameEn,
          country: travelCountry.country,
          country_en: travelCountry.country_en,
        },
        lat: c.lat,
        lng: c.lng,
      });
      const url = getPlaceUrlParam({
        ...fields,
        id: `label-${c.lat}-${c.lng}`,
        uiPlace: true,
      });

      assert(fields.slug === c.expect.slug, `slug ${fields.slug} !== ${c.expect.slug}`);
      assert(
        fields.name_en === c.expect.name_en,
        `name_en ${fields.name_en} !== ${c.expect.name_en}`
      );
      assert(url === c.expect.slug, `url ${url} !== ${c.expect.slug}`);
      assert(!isEphemeralSlug(fields.slug), `ephemeral slug ${fields.slug}`);
      assert(
        !/[\uAC00-\uD7A3]/.test(fields.name_en),
        `name_en still CJK: ${fields.name_en}`
      );
      console.log(`OK: ${c.id} — ${c.label}`);
    } catch (e) {
      fail += 1;
      console.error(`FAIL: ${c.id} — ${e.message}`);
    }
  }

  try {
    const resolution = resolveDestinationFromChat(MOONI_L2_HISTORY, [], '에스와티니');
    const names = (resolution.candidates || []).map((x) => x.name);
    assert(
      resolution.confidence !== 'low' || names.length === 0,
      `history L2 leaked candidates: ${names.join(', ')}`
    );
    assert(
      !names.some((n) => ['로마', '베를린', '델리'].includes(n)),
      `history L2 false destinations: ${names.join(', ')}`
    );
    console.log('OK: mooni-history-l2 — no Rome/Berlin/Delhi candidates');
  } catch (e) {
    fail += 1;
    console.error(`FAIL: mooni-history-l2 — ${e.message}`);
  }

  if (fail) {
    console.error(`SMOKE FAIL (${fail})`);
    process.exit(1);
  }
  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
