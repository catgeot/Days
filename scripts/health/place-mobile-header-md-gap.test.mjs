import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('mobile header spacer stays until lg (PlaceCard column layout)', () => {
  const inset = read('src/components/PlaceCard/common/mobilePlaceHeaderInset.js');
  assert.match(inset, /mobilePlaceHeaderSpacerClass[\s\S]*lg:hidden/);
  assert.doesNotMatch(
    inset,
    /mobilePlaceHeaderSpacerClass[\s\S]*md:hidden/,
    'md:hidden on spacer leaves 768px gap vs max-md fixed header',
  );
});

test('landscape immersive chrome uses landscape-phone variant (short height only)', () => {
  const inset = read('src/components/PlaceCard/common/mobilePlaceHeaderInset.js');
  assert.match(inset, /mobileLandscapeChromeHidden = 'landscape-phone:hidden'/);
  assert.doesNotMatch(inset, /max-lg:landscape:hidden/);
  const tw = read('tailwind.config.js');
  assert.match(tw, /landscape-phone/);
  assert.match(tw, /max-height: 500px/);
});

test('PlaceChatPanel fixed header matches spacer lg breakpoint', () => {
  const chat = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.match(chat, /max-lg:fixed max-lg:inset-x-0 max-lg:top-0/);
  assert.doesNotMatch(chat, /max-md:fixed max-md:inset-x-0 max-md:top-0/);
});

test('PlaceChatPanel keeps overlay z-index until lg (768px header not under media z-10)', () => {
  const chat = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.match(chat, /absolute top-0 left-0 w-full z-\[180\][\s\S]*lg:relative[\s\S]*lg:z-auto/);
  assert.doesNotMatch(
    chat,
    /md:relative md:w-\[35%\][\s\S]*md:z-auto/,
    'md sidebar drops chat below media panel while header stays fixed',
  );
  assert.match(chat, /hidden lg:flex w-full shrink-0 flex-col/);
});

const TAB_VIEWS = [
  ['PlaceGalleryView.jsx', 'src/components/PlaceCard/views/PlaceGalleryView.jsx'],
  ['PlaceWikiDetailsView.jsx', 'src/components/PlaceCard/views/PlaceWikiDetailsView.jsx'],
  ['YouTubePlayerView.jsx', 'src/components/PlaceCard/views/YouTubePlayerView.jsx'],
  ['ReviewsTab.jsx', 'src/components/PlaceCard/tabs/ReviewsTab.jsx'],
  ['PlannerTab.jsx', 'src/components/PlaceCard/tabs/PlannerTab.jsx'],
  ['PlaceWorldEventsTabView.jsx', 'src/components/PlaceCard/views/PlaceWorldEventsTabView.jsx'],
];

for (const [label, rel] of TAB_VIEWS) {
  test(`${label} in-scroll tab chips use lg:hidden not md:hidden`, () => {
    const src = read(rel);
    assert.doesNotMatch(
      src,
      /mobileSecondaryNav[\s\S]{0,400}md:hidden shrink-0 px-2 pb-2/,
      '768–1023 loses tab chips when md:hidden',
    );
  });
}

test('gallery scroll desktop inset uses lg not md', () => {
  const gallery = read('src/components/PlaceCard/views/PlaceGalleryView.jsx');
  assert.match(gallery, /lg:pt-10[\s\S]*lg:pb-6/);
  assert.doesNotMatch(gallery, /data-place-gallery-scroll[\s\S]{0,120}md:pt-10/);
});

test('PlaceChatPanel xl header keeps bookmark–MOONi chip gutter (1280 overlap)', () => {
  const chat = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.doesNotMatch(chat, /xl:flex-row xl:items-center/);
  assert.match(chat, /2xl:flex-row[\s\S]{0,60}2xl:justify-between/);
  assert.match(chat, /2xl:w-auto 2xl:flex-none 2xl:ml-auto[\s\S]{0,500}place-header-mooni-btn/);
});
