import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BLOCKED_VIDEO_IDS,
  BLOCK_PATTERN_PROBE_CASES,
  filterBlockedPlaceVideos,
  shouldBlockPlaceVideo,
  snippetLooksLikeShorts,
} from '../../supabase/functions/_shared/videoBlocklist.mjs';

const PROBE_ID_PREFIX = 'pattern-probe-';

test('blocked video IDs are removed', () => {
  for (const id of BLOCKED_VIDEO_IDS) {
    assert.equal(shouldBlockPlaceVideo({ id, title: 'ok travel vlog' }), true);
  }
  const list = filterBlockedPlaceVideos([
    { id: 'BATsLpppQms', title: 'accident' },
    { id: 'keep123', title: '발리 여행 브이로그' },
  ]);
  assert.deepEqual(list.map((v) => v.id), ['keep123']);
});

test('each title pattern blocks a dedicated probe (no blocked id, no cross-pattern tags)', () => {
  const qaTitles = [
    '얼마전 발리에서 생긴 사망사고 현장',
    '#발리사고 #사망',
    '귀신 #공포',
    '#괴담 모음',
  ];
  for (const title of qaTitles) {
    assert.equal(
      shouldBlockPlaceVideo({ id: `${PROBE_ID_PREFIX}qa`, title }),
      true,
      title,
    );
  }

  for (const { key, title } of BLOCK_PATTERN_PROBE_CASES) {
    assert.equal(
      shouldBlockPlaceVideo({ id: `${PROBE_ID_PREFIX}${key}`, title }),
      true,
      `pattern ${key}: ${title}`,
    );
  }
  assert.equal(BLOCK_PATTERN_PROBE_CASES.length, 17);
});

test('shorts tag detection matches #shorts and #short', () => {
  assert.equal(snippetLooksLikeShorts({ title: 'clip #shorts travel' }), true);
  assert.equal(snippetLooksLikeShorts({ title: 'clip #short clip' }), true);
  assert.equal(snippetLooksLikeShorts({ title: 'short story' }), false);
});

test('false positives from QA scan are kept', () => {
  const keeps = [
    {
      id: 'v9CcnRb0_AE',
      title: '살인적인 인플레이션의 아르헨티나 부에노스아이레스',
    },
    {
      id: 'BnXLR_VQg24',
      title: 'Andaman vlog missing mummy & papa',
    },
    {
      id: 'aLeZ_CmT1rk',
      title: '혼자 도쿄 또 갔는데 캐리어 실종 실화?',
    },
    {
      id: 'fAVjJ4KQ5d8',
      title: '이집트 룩소르 여행 벌룬투어 사건까지',
    },
  ];
  for (const video of keeps) {
    assert.equal(shouldBlockPlaceVideo(video), false, video.title);
  }
});

test('pending-review IDs are not blocked by ID list', () => {
  const pending = [
    'OC948Uq6A90',
    'r7TXD8M7ZaU',
    'zl8atdSvWCo',
    'Kn6Ib3W5QBA',
    'YL9d9YCmqkA',
    'LsebF9t1HrA',
    '1yOS4vIGDRI',
  ];
  for (const id of pending) {
    assert.equal(shouldBlockPlaceVideo({ id, title: 'travel vlog ep 1' }), false, id);
  }
});
