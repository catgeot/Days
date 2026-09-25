import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetIosZoomAfterInput } from '../lib/mobileViewport';
import { navigateAppBack } from './navigateAppBack';

/** 축제·명승 홈 등 Korea 모듈 이탈 — iOS 줌 리셋 + history-aware `/` 폴백 */
export function useKoreaModuleExit(fallback = '/') {
  const navigate = useNavigate();

  return useCallback(() => {
    try {
      sessionStorage.setItem('gateo_reset_viewport', '1');
    } catch {
      /* quota / private mode */
    }
    resetIosZoomAfterInput();
    navigateAppBack(navigate, { fallback });
  }, [navigate, fallback]);
}
