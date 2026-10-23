import React, { useMemo } from 'react';
import FestivalDetailSheet from '../Korea/FestivalDetailSheet.jsx';
import {
  festivalDateSheetWeekRangeFromYmd,
  seoulTodayYmd,
} from '../Korea/festivalDateFilter.js';

function buildFestivalRoadFixture(now = new Date()) {
  const today = seoulTodayYmd(now);
  const thisWeek = festivalDateSheetWeekRangeFromYmd(0, today);
  const later = festivalDateSheetWeekRangeFromYmd(2, today);
  const sokcho = {
    contentId: 'festival-road-fixture-sokcho',
    title: '속초 해변 축제',
    eventStartDate: thisWeek.startYmd,
    eventEndDate: thisWeek.endYmd,
    addr1: '강원특별자치도 속초시 해오름로 186',
    areaCode: '32',
    mapx: '128.5918',
    mapy: '38.207',
    contentTypeId: '15',
  };
  const gangneung = {
    contentId: 'festival-road-fixture-gangneung',
    title: '강릉 단풍 축제',
    eventStartDate: later.startYmd,
    eventEndDate: later.endYmd,
    addr1: '강원특별자치도 강릉시 강릉대로 33',
    areaCode: '32',
    mapx: '128.876',
    mapy: '37.751',
    contentTypeId: '15',
  };
  return {
    item: sokcho,
    pool: [sokcho, gangneung],
    detail: {
      ok: true,
      contentId: sokcho.contentId,
      intro: {
        contentId: sokcho.contentId,
        eventstartdate: sokcho.eventStartDate,
        eventenddate: sokcho.eventEndDate,
        eventplace: '속초해수욕장',
        playtime: '10:00~18:00',
        usetimefestival: '무료',
      },
      common: {
        contentId: sokcho.contentId,
        title: sokcho.title,
        addr1: sokcho.addr1,
        overview: '속초 해변에서 여는 축제.',
      },
    },
  };
}

/** Flag-on preview for the road draft. Not mounted when the flag is off. */
export default function FestivalRoadFixturePage() {
  const model = useMemo(() => buildFestivalRoadFixture(), []);
  return (
    <FestivalDetailSheet
      item={model.item}
      prefetchedTourDetail={model.detail}
      festivalPool={model.pool}
      onClose={() => {}}
    />
  );
}
