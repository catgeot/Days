import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('feature flag VITE_GATEO_PLACE_DESKTOP_LEFT_INFO is registered default off', () => {
  const flags = readFileSync(join(root, 'src/shared/gateoFeatureFlags.js'), 'utf8');
  assert.match(flags, /PLACE_DESKTOP_LEFT_INFO:\s*'VITE_GATEO_PLACE_DESKTOP_LEFT_INFO'/);
  assert.match(flags, /isGateoPlaceDesktopLeftInfoEnabled/);
  assert.match(flags, /Default off/);
});

test('single mount — PlaceGalleryFactsAndStories gates empty wrapper', () => {
  const bundle = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceGalleryFactsAndStories.jsx'),
    'utf8',
  );
  assert.match(bundle, /if \(!hasFacts && !showStoriesBlock\) return null/);
  assert.match(bundle, /PlaceVerifiedFacts/);
  assert.match(bundle, /PlaceVisitStories/);
});

test('desktop left panel wiring — single mount via viewport hook', () => {
  const gallery = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
  const info = readFileSync(join(root, 'src/components/PlaceCard/views/GalleryInfoView.jsx'), 'utf8');
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/common/usePlaceDesktopLeftInfoLayout.js'),
    'utf8',
  );
  assert.match(hook, /useSyncExternalStore/);
  assert.match(hook, /mountInGallery/);
  assert.match(gallery, /mountInGallery/);
  assert.match(info, /mountInLeftOverview/);
  assert.match(
    gallery,
    /\{mountInGallery \? \(\s*\n\s*<PlaceGalleryFactsAndStories location=\{location\} \/>/,
    'desktop-left-info bundle must stay visible at lg when flag on (no lg:hidden on mount)',
  );
  assert.doesNotMatch(
    gallery,
    /mountInGallery[\s\S]{0,120}lg:hidden[\s\S]{0,120}PlaceGalleryFactsAndStories/,
  );
});

test('hash scroll uses overview scrollTo only when flag on and section in left overview', () => {
  const focus = readFileSync(join(root, 'src/utils/placeGallerySectionFocus.js'), 'utf8');
  assert.match(focus, /isGateoPlaceDesktopLeftInfoEnabled/);
  assert.match(focus, /data-place-overview-scroll/);
  assert.match(focus, /overviewScroller\.scrollTo/);
  assert.match(focus, /el\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.doesNotMatch(focus, /data-place-gallery-scroll/);
});

test('PlaceVisitStories receives visit stories from PlaceGalleryFactsAndStories only', () => {
  const bundle = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceGalleryFactsAndStories.jsx'),
    'utf8',
  );
  const overview = readFileSync(
    join(root, 'src/components/PlaceCard/views/GalleryInfoOverviewScrollContent.jsx'),
    'utf8',
  );
  const gallery = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
  const storiesUi = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'),
    'utf8',
  );
  assert.match(bundle, /useVisitStories\(location\)/);
  assert.doesNotMatch(storiesUi, /useVisitStories/);
  assert.match(bundle, /storiesLoadingShellInLeftOverview/);
  assert.match(overview, /storiesLoadingShellInLeftOverview/);
  assert.doesNotMatch(gallery, /storiesLoadingShellInLeftOverview/);
  assert.match(bundle, /showStoriesLoadingShell/);
  assert.match(bundle, /showLoadingShell=\{showStoriesLoadingShell\}/);
  assert.match(storiesUi, /if \(isLoading && !showLoadingShell\) return null/);
});
