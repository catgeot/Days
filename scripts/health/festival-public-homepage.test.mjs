import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FESTIVAL_HOMEPAGE_OVERRIDES,
  preferHttpsFestivalHomepage,
  resolveFestivalPublicHomepage,
} from '../../src/pages/Korea/lib/festivalPublicHomepage.js';

test('1095732 override — HTTPS stolantern', () => {
  assert.equal(FESTIVAL_HOMEPAGE_OVERRIDES['1095732'].url, 'https://www.stolantern.com/');
  assert.equal(
    resolveFestivalPublicHomepage('1095732', 'http://www.stolantern.com/'),
    'https://www.stolantern.com/',
  );
});

test('preferHttpsFestivalHomepage — known host upgrades scheme', () => {
  assert.equal(
    preferHttpsFestivalHomepage('http://www.stolantern.com/path'),
    'https://www.stolantern.com/path',
  );
  assert.equal(
    preferHttpsFestivalHomepage('http://unknown-http-only.example/'),
    'http://unknown-http-only.example/',
  );
});