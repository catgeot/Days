import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  readFestivalHubFilterQuery,
  writeFestivalHubFilterQuery,
} from '../../src/pages/Korea/festivalHubFilterQuery.js';

const defaults = { defaultTime: 'thisMonth', defaultArea: '1', dateChip: false };

describe('festival hub filter query', () => {
  it('keeps existing URLs on the caller defaults when the new params are absent', () => {
    const params = new URLSearchParams('festival=638576&from=theme&area=32');
    const read = readFestivalHubFilterQuery(params, defaults);
    assert.equal(read.timeTab, 'thisMonth');
    assert.equal(read.areaCode, '1');
    assert.equal(read.tasteId, 'all');
    assert.equal(read.regionExplicit, false);
    assert.equal(params.get('festival'), '638576');
    assert.equal(params.get('area'), '32');
  });

  it('reads valid params and drops invalid ones back to product defaults', () => {
    const valid = readFestivalHubFilterQuery(
      new URLSearchParams('time=weekend&region=1&taste=music&festival=638576'),
      defaults,
    );
    assert.deepEqual(
      { timeTab: valid.timeTab, areaCode: valid.areaCode, tasteId: valid.tasteId, regionExplicit: valid.regionExplicit },
      { timeTab: 'weekend', areaCode: '1', tasteId: 'music', regionExplicit: true },
    );

    const invalid = readFestivalHubFilterQuery(
      new URLSearchParams('time=nope&region=999&taste=nope&festival=638576'),
      defaults,
    );
    assert.equal(invalid.timeTab, 'thisMonth');
    assert.equal(invalid.areaCode, 'all');
    assert.equal(invalid.tasteId, 'all');
    assert.equal(invalid.regionExplicit, false);
  });

  it('writes chip changes with replace-friendly params and keeps festival unless asked', () => {
    const start = new URLSearchParams('festival=638576');
    const timed = writeFestivalHubFilterQuery(start, { defaultTime: 'thisMonth', time: 'weekend' });
    assert.equal(timed.get('time'), 'weekend');
    assert.equal(timed.get('festival'), '638576');
    assert.equal(start.get('time'), null);

    const cleared = writeFestivalHubFilterQuery(timed, {
      defaultTime: 'thisMonth',
      time: 'thisMonth',
      region: 'all',
      touchRegion: true,
      taste: 'music',
      clearFestival: true,
    });
    assert.equal(cleared.get('time'), null);
    assert.equal(cleared.get('region'), 'all');
    assert.equal(cleared.get('taste'), 'music');
    assert.equal(cleared.get('festival'), null);
  });

  it('accepts date-chip time ids only when that flag is on', () => {
    const off = readFestivalHubFilterQuery(new URLSearchParams('time=window30'), defaults);
    assert.equal(off.timeTab, 'thisMonth');
    const on = readFestivalHubFilterQuery(new URLSearchParams('time=window30'), {
      ...defaults,
      dateChip: true,
    });
    assert.equal(on.timeTab, 'window30');
  });
});
