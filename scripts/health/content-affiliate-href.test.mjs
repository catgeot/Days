import assert from 'node:assert/strict';
import test from 'node:test';

import { MRT_HOME_MYLINK_ID } from '../../src/pages/Home/data/mrtPackageThemeLinks.js';
import { TRIPCOM_KR_PARTNER, buildMrtMylinkUrl } from '../../src/utils/affiliate.js';
import {
  KLOOK_AID,
  KLOOK_DEFAULT_AD_ID,
  buildKlookAffiliateUrl,
} from '../../src/utils/klookAffiliateUrl.js';
import {
  contentAffiliateSubTag,
  rewriteContentAffiliateHref,
} from '../../src/utils/contentAffiliateHref.js';

const BLOG_TAG = contentAffiliateSubTag('blog', 'rome-travelogue');
const REVIEW_TAG = contentAffiliateSubTag('review', 'e2e-review-1');

test('plain trip.com URL gains Allianceid, SID, and trip_sub1', () => {
  const before = 'https://www.trip.com/hotels/list?city=248';
  const after = rewriteContentAffiliateHref(before, { subTag: BLOG_TAG });
  const url = new URL(after);
  assert.equal(url.hostname, 'www.trip.com');
  assert.equal(url.pathname, '/hotels/list');
  assert.equal(url.searchParams.get('city'), '248');
  assert.equal(url.searchParams.get('Allianceid'), TRIPCOM_KR_PARTNER.allianceId);
  assert.equal(url.searchParams.get('SID'), TRIPCOM_KR_PARTNER.sid);
  assert.equal(url.searchParams.get('trip_sub1'), 'blog-rome-travelogue');
  assert.equal(url.searchParams.get('locale'), null);
  assert.equal(url.searchParams.get('curr'), null);
});

test('kr.trip.com keeps the original query and hash', () => {
  const before = 'https://kr.trip.com/hotels/list?city=248&foo=1#stay';
  const after = rewriteContentAffiliateHref(before, { subTag: BLOG_TAG });
  const url = new URL(after);
  assert.equal(url.hostname, 'kr.trip.com');
  assert.equal(url.pathname, '/hotels/list');
  assert.equal(url.searchParams.get('city'), '248');
  assert.equal(url.searchParams.get('foo'), '1');
  assert.equal(url.hash, '#stay');
  assert.equal(url.searchParams.get('Allianceid'), TRIPCOM_KR_PARTNER.allianceId);
  assert.equal(url.searchParams.get('SID'), TRIPCOM_KR_PARTNER.sid);
  assert.equal(url.searchParams.get('trip_sub1'), BLOG_TAG);
});

test('klook.com/ko reuses the web affiliate builder and keeps path, query, and hash', () => {
  const before = 'https://www.klook.com/ko/activity/42?foo=1#map';
  const after = rewriteContentAffiliateHref(before, { subTag: BLOG_TAG });
  const expected = new URL(buildKlookAffiliateUrl(before));
  expected.searchParams.set('utm_content', BLOG_TAG);
  assert.equal(after, expected.href);
  const url = new URL(after);
  assert.equal(url.hostname, 'www.klook.com');
  assert.equal(url.pathname, '/ko/activity/42');
  assert.equal(url.searchParams.get('foo'), '1');
  assert.equal(url.hash, '#map');
  assert.equal(url.searchParams.get('aid'), KLOOK_AID);
  assert.equal(url.searchParams.get('aff_adid'), KLOOK_DEFAULT_AD_ID);
  assert.equal(url.searchParams.get('utm_content'), BLOG_TAG);
});

test('apex klook.com is a consumer host', () => {
  const after = rewriteContentAffiliateHref('https://klook.com/ko/', { subTag: REVIEW_TAG });
  const url = new URL(after);
  assert.equal(url.hostname, 'klook.com');
  assert.equal(url.pathname, '/ko/');
  assert.equal(url.searchParams.get('aid'), KLOOK_AID);
  assert.equal(url.searchParams.get('utm_content'), REVIEW_TAG);
});

test('myrealtrip.com reuses the mylink helper and keeps query and hash', () => {
  const before = 'https://www.myrealtrip.com/search?q=rome#list';
  const after = rewriteContentAffiliateHref(before, { subTag: REVIEW_TAG });
  assert.equal(after, buildMrtMylinkUrl(before, { utmContent: REVIEW_TAG }));
  const url = new URL(after);
  assert.equal(url.hostname, 'www.myrealtrip.com');
  assert.equal(url.pathname, '/search');
  assert.equal(url.searchParams.get('q'), 'rome');
  assert.equal(url.hash, '#list');
  assert.equal(url.searchParams.get('mylink_id'), MRT_HOME_MYLINK_ID);
  assert.equal(url.searchParams.get('utm_source'), 'mktpartner');
  assert.equal(url.searchParams.get('utm_content'), 'review-e2e-review-1');
});

test('an already-affiliated trip.com URL is unchanged', () => {
  const before = 'https://KR.TRIP.COM/hotels?Allianceid=111&SID=222&trip_sub1=other#room';
  assert.equal(rewriteContentAffiliateHref(before, { subTag: BLOG_TAG }), before);
});

test('an already-affiliated klook URL is unchanged', () => {
  const before = 'https://www.klook.com/ko/activity/9?aid=555&foo=2#kept';
  assert.equal(rewriteContentAffiliateHref(before, { subTag: BLOG_TAG }), before);
});

test('an already-affiliated myrealtrip URL is unchanged', () => {
  const before = 'https://www.myrealtrip.com/accommodations?q=rome&mylink_id=1&utm_source=other#top';
  assert.equal(rewriteContentAffiliateHref(before, { subTag: REVIEW_TAG }), before);
});

test('other domains, including lookalike hosts, stay unchanged', () => {
  const samples = [
    'https://www.google.com/maps/search/?api=1&query=rome#place',
    'https://trip.com.example/hotels?city=1#h',
    'https://notklook.com/ko/activity/1',
    'https://klook.com.evil.test/ko',
    'https://myrealtrip.com.evil.net/search?q=rome',
    'https://myrealt.rip/fOey96',
    'https://affiliate.klook.com/redirect?k_site=https%3A%2F%2Fwww.klook.com%2Fko%2F',
  ];
  for (const before of samples) {
    assert.equal(rewriteContentAffiliateHref(before, { subTag: BLOG_TAG }), before, before);
  }
});

test('a malformed URL is unchanged', () => {
  for (const before of ['https://', 'https://%', 'not a url', 'http://[', '']) {
    assert.equal(rewriteContentAffiliateHref(before, { subTag: BLOG_TAG }), before);
  }
});

test('relative and mailto links are unchanged', () => {
  assert.equal(rewriteContentAffiliateHref('/place/rome?q=1#map', { subTag: BLOG_TAG }), '/place/rome?q=1#map');
  assert.equal(rewriteContentAffiliateHref('mailto:hi@gateo.kr', { subTag: BLOG_TAG }), 'mailto:hi@gateo.kr');
  assert.equal(rewriteContentAffiliateHref('#section', { subTag: REVIEW_TAG }), '#section');
});

test('sub tags distinguish blog slugs from review ids', () => {
  assert.equal(contentAffiliateSubTag('blog', 'paris-travelogue'), 'blog-paris-travelogue');
  assert.equal(contentAffiliateSubTag('review', 'abc-123'), 'review-abc-123');
  assert.equal(contentAffiliateSubTag('blog', ''), '');
  assert.equal(contentAffiliateSubTag('note', 'paris'), '');
});
