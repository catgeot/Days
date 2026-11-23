import React from 'react';
import LocaleToggle from '../../../i18n/LocaleToggle';

/**
 * 장소 페이지 언어 전환 — 모바일·데스크톱 공통, 상단 헤더 액션 행 밖에 둔다.
 * @param {{ className?: string; hideWhenMooniOpen?: boolean; isMooniChatOpen?: boolean }} props
 */
export default function PlaceSurfaceLocaleToggle({
  className = '',
  hideWhenMooniOpen = true,
  isMooniChatOpen = false,
} = {}) {
  if (hideWhenMooniOpen && isMooniChatOpen) return null;
  return (
    <div data-testid="place-surface-locale-toggle" className={className}>
      <LocaleToggle compact className="shrink-0" />
    </div>
  );
}