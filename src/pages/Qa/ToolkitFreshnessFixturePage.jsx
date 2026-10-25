import React, { useMemo } from 'react';
import { FileText, Car } from 'lucide-react';
import ToolkitCard from '../../components/PlaceCard/tabs/planner/components/ToolkitCard.jsx';
import ToolkitFreshnessBanner from '../../components/PlaceCard/tabs/planner/components/ToolkitFreshnessBanner.jsx';
import { getFreshnessToday } from '../../data/placeVerifiedFacts/freshness.js';

const MOCK_LOCATION = {
  slug: 'okinawa-fixture',
  name: '오키나와',
  name_en: 'Okinawa',
  country: '일본',
  country_en: 'Japan',
};

function buildMeta() {
  const today = getFreshnessToday();
  const y = today.slice(0, 4);
  return {
    visa: { checked_at: `${y}-10-12T00:00:00Z`, source_urls: ['일본 외무성', '주한일본대사관'] },
    airport_transfer: { checked_at: '2026-08-16T00:00:00Z' },
  };
}

/**
 * Flag-on QA surface — deterministic badges for WebKit 390 captures.
 * Mounted only when `import.meta.env.DEV` or `VITE_GATEO_TOOLKIT_FRESHNESS=1`.
 */
export default function ToolkitFreshnessFixturePage({ variant = 'on' }) {
  const freshnessOn = variant !== 'off';
  const sectionMeta = useMemo(() => buildMeta(), []);
  const toolkitUpdatedAt = '2026-04-09T00:00:00Z';
  const freshnessProps = freshnessOn
    ? {
        toolkitFreshnessEnabled: true,
        sectionMeta,
        toolkitUpdatedAt,
        placeId: 'okinawa-fixture',
      }
    : {};

  return (
    <div
      className="min-h-screen bg-[#f8f9fa] pb-8"
      data-toolkit-freshness-fixture=""
      data-toolkit-freshness-variant={freshnessOn ? 'on' : 'off'}
    >
      <header className="bg-[#0f4c81] text-white px-4 py-4">
        <h1 className="text-lg font-black">오키나와 여행 툴킷</h1>
        <p className="text-xs opacity-85 mt-1">
          섹션별 확인일을 확인하고 출발 전 공식 정보를 다시 확인하세요
        </p>
      </header>
      <div className="px-3 pt-3 max-w-lg mx-auto flex flex-col gap-4">
        {freshnessOn ? <ToolkitFreshnessBanner variant="warn" /> : null}
        <ToolkitCard
          icon={FileText}
          title="비자 및 서류"
          type="visa"
          data={{ advice: '한국 여권 90일 무비자 체류' }}
          isOfficial
          location={MOCK_LOCATION}
          essentialGuide={{ categories: { visa: {} } }}
          themeColor="warning"
          {...freshnessProps}
        />
        <ToolkitCard
          icon={Car}
          title="공항 → 항구/목적지 이동"
          type="airport_transfer"
          data={{ advice: '유이레일 나하공항역 → 겐초마에 약 12분' }}
          isSponsored
          location={MOCK_LOCATION}
          essentialGuide={{ categories: { airport_transfer: {} } }}
          themeColor="default"
          {...freshnessProps}
        />
      </div>
    </div>
  );
}
