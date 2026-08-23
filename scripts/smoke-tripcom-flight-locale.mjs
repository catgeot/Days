#!/usr/bin/env node
/**
 * Trip.com 항공 ad URL locale — ?lang=en 시 en-US 쿼리 주입 회귀.
 * iframe UI 언어는 Trip.com ad 템플릿에 따름(Preview 수동 확인).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const {
    resolveTripcomPartnerLocale,
    resolveTripcomSiteOrigin,
  } = await load('src/utils/tripcomPartnerLocale.js');

  assert(resolveTripcomPartnerLocale('ko') === 'ko-KR', 'ko locale');
  assert(resolveTripcomPartnerLocale('en') === 'en-US', 'en locale');
  assert(
    resolveTripcomSiteOrigin('en-US') === 'https://www.trip.com',
    'en site origin',
  );
  assert(
    resolveTripcomSiteOrigin('ko-KR') === 'https://kr.trip.com',
    'ko site origin',
  );

  const enParams = new URLSearchParams({
    locale: resolveTripcomPartnerLocale('en'),
    curr: 'KRW',
    dAirportCode: 'ICN',
    aAirportCode: 'FUK',
  });
  assert(enParams.get('locale') === 'en-US', 'en query locale');

  const koParams = new URLSearchParams({
    locale: resolveTripcomPartnerLocale('ko'),
  });
  assert(koParams.get('locale') === 'ko-KR', 'ko query locale');

  const enPackages = new URL(
    `${resolveTripcomSiteOrigin('en-US')}/packages/?${enParams.toString()}&sourceFrom=IBUBundle_home`,
  );
  assert(enPackages.hostname === 'www.trip.com', 'en packages host');
  assert(enPackages.searchParams.get('locale') === 'en-US', 'en packages locale');

  console.log('OK: tripcom-flight-locale — en-US query + www.trip.com when app locale en');
  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
