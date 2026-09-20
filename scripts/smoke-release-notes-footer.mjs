#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert.equal(
  existsSync(join(root, 'src/shared/lib/siteUpdateStorage.js')),
  false,
  'release seen/snooze storage is removed',
);
assert.equal(
  existsSync(join(root, 'src/shared/lib/siteNoticeEvents.js')),
  false,
  'open-updates custom event is removed',
);

const hook = read(join('src/shared/hooks/useSiteUpdateBanner.js'));
assert.doesNotMatch(hook, /getLatestRelease/, 'deploy refresh does not read release notes');
assert.doesNotMatch(hook, /shouldShowRelease/, 'no auto-show of release notes');
assert.doesNotMatch(hook, /setReleaseVisible/, 'no release popup visibility');
assert.match(hook, /version\.json/, 'PROD still polls new build');
assert.match(hook, /refreshVisible/, 'refresh prompt remains');

const banner = read(join('src/shared/components/SiteUpdateBanner.jsx'));
assert.doesNotMatch(banner, /resolveReleaseNote/, 'banner is not a release-notes modal');
assert.doesNotMatch(banner, /openUpdatesList/, 'banner does not open Updates from a popup');
assert.doesNotMatch(banner, /pastNotices|dismissPermanent/, 'no dismiss-forever release CTA');
assert.match(banner, /refreshTitle/, 'deploy refresh copy remains');

const home = read(join('src/pages/Home/index.jsx'));
assert.match(home, /<SiteUpdateBanner\s*\/>/, 'home still mounts deploy-refresh banner');

const footer = read(join('src/pages/Home/components/FooterModal.jsx'));
assert.match(footer, /ReleaseNotesList/, 'Updates tab still lists history');
assert.match(footer, /id: 'updates'/, 'footer keeps Updates tab');

const logo = read(join('src/pages/Home/components/LogoPanel.jsx'));
assert.match(logo, /handleOpenFooter\('updates'\)/, 'logo footer still opens Updates');
assert.doesNotMatch(logo, /OPEN_UPDATES_LIST_EVENT/, 'logo panel is not opened by popup event');

const notes = read(join('src/data/releaseNotes.js'));
assert.match(notes, /FooterModal \*\*Updates\*\*/, 'SSOT comment points at footer Updates');
assert.doesNotMatch(notes, /홈 팝업/, 'SSOT no longer describes a home popup');

const ko = JSON.parse(read(join('src/i18n/locales/ko.json')));
const en = JSON.parse(read(join('src/i18n/locales/en.json')));
assert.equal(ko.layout.siteNotice.pastNotices, undefined);
assert.equal(en.layout.siteNotice.dismissPermanent, undefined);
assert.equal(typeof ko.home.footerModal.tab.updates, 'string');
assert.equal(typeof en.home.footerModal.updatesTitle, 'string');
assert.ok(ko.home.footerModal.updatesIntro.length > 0);
assert.ok(en.home.releaseNotes.latest.length > 0);

const vercel = read(join('vercel.json'));
assert.match(vercel, /\/qa\/updates/, 'vercel.json has /qa/updates');
assert.match(
  vercel,
  /days-git-cursor-updates-0e16-catgeots-projects\.vercel\.app\/?/,
  'qa/updates points at this feature Preview home',
);

const qa = read(join('src/shared/cloudPreview/cloudQaShareLinks.js'));
assert.match(qa, /slug:\s*'updates'/, 'qa share slug updates');
assert.match(qa, /branch:\s*'cursor\/updates-0e16'/, 'qa share branch is updates-0e16');

console.log('smoke:release-notes-footer PASS');
