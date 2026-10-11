import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  FESTIVAL_PAGE_EVENT,
  festivalContentIdFromGateoHref,
  gateoKoreaFestivalDetailUrl,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  mergeDeepLinkListItems,
  projectFestivalDeepLink,
} from '../../src/pages/Korea/festivalDeepLinkItem.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('festivalContentIdFromGateoHref parses GATEO korea festival URLs', () => {
  assert.equal(
    festivalContentIdFromGateoHref('https://www.gateo.kr/korea/?festival=638576'),
    '638576',
  );
  assert.equal(
    festivalContentIdFromGateoHref(
      `${gateoKoreaFestivalDetailUrl('2930716')}#festival-lodging`,
    ),
    '2930716',
  );
  assert.equal(festivalContentIdFromGateoHref('https://www.gateo.kr/korea/theme/scenic'), '');
  assert.equal(festivalContentIdFromGateoHref('https://example.com/korea/?festival=1'), '');
});

test('supplemental promo rows resolve deeplink without detail fetch phase', () => {
  const supplemental = [
    {
      contentId: '638576',
      title: '대한민국 국향대전',
      eventEndDate: '20261108',
    },
  ];
  const items = [{ contentId: '637693', title: '마산', eventEndDate: '20261108' }];
  const merged = mergeDeepLinkListItems(items, supplemental);
  assert.equal(merged.length, 2);

  const opened = projectFestivalDeepLink({
    festivalId: '638576',
    items,
    supplementalItems: supplemental,
    listLoading: false,
    phase: 'idle',
  });
  assert.equal(opened.sheet, 'open');
  assert.equal(opened.fetch, false);
  assert.equal(opened.selected.contentId, '638576');
});

test('MOONi markdown and Korea hub wire in-app festival page links', () => {
  const markdown = readFileSync(
    join(root, 'src/components/chat/MooniChatMarkdown.jsx'),
    'utf8',
  );
  assert.match(markdown, /FESTIVAL_PAGE_EVENT/);
  assert.match(markdown, /festivalContentIdFromGateoHref/);

  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /FESTIVAL_PAGE_EVENT/);
  assert.match(hub, /supplementalItems: deepLinkSupplementalItems/);
  assert.match(hub, /deepLinkInflightRef/);

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chat, /FESTIVAL_PAGE_EVENT/);
  assert.equal(FESTIVAL_PAGE_EVENT, 'gateo-festival-page');
});
