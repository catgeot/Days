import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  consumeThemeNavBack,
  formatThemeNavBackLabel,
  peekThemeNavBack,
  resolveThemeNavBack,
} from '../Home/lib/koreaThemeNavBack';

const BTN_CLASS =
  'flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100';

function useThemeNavBackAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const back = resolveThemeNavBack(location.state);

  const goBack = useCallback(() => {
    const entry = resolveThemeNavBack(location.state);
    if (!entry?.path) {
      navigate('/korea/theme/scenic');
      return;
    }
    const top = peekThemeNavBack();
    if (top?.path === entry.path) consumeThemeNavBack();
    navigate(entry.path);
  }, [location.state, navigate]);

  return { back, goBack };
}

/** 모듈 헤더 좌측 복귀 — 크로스 이동 후엔 「이전」, 아니면 「명승」 */
export default function ThemeModuleBackButton() {
  const { back, goBack } = useThemeNavBackAction();

  if (back?.path) {
    const label = formatThemeNavBackLabel(back);
    return (
      <button
        type="button"
        onClick={goBack}
        aria-label={label ? `이전 · ${label}` : '이전'}
        title={label || '이전'}
        className={BTN_CLASS}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        이전
      </button>
    );
  }

  return (
    <Link
      to="/korea/theme/scenic"
      aria-label="한국의 명승으로"
      title="한국의 명승"
      className={BTN_CLASS}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      명승
    </Link>
  );
}

/** 이전 상태 표기 (축제 from=theme 힌트와 동일 톤) */
export function ThemeNavBackHint() {
  const { back, goBack } = useThemeNavBackAction();
  if (!back?.path) return null;
  const label = formatThemeNavBackLabel(back);
  if (!label) return null;

  return (
    <p className="mt-1.5 text-xs leading-relaxed text-stone-600 break-keep">
      <button
        type="button"
        onClick={goBack}
        className="font-bold text-amber-800 hover:underline"
      >
        ← {label}
      </button>
      <span className="text-stone-400"> · </span>
      이전 탐색으로 돌아갑니다
    </p>
  );
}

/** 축제 `/korea?from=theme` — 가능하면 직전 테마 상세로 복귀 */
export function ThemeFestivalBackLink() {
  const { back, goBack } = useThemeNavBackAction();
  const label = formatThemeNavBackLabel(back);

  if (back?.path) {
    return (
      <button
        type="button"
        onClick={goBack}
        className="font-bold text-amber-800 hover:underline"
      >
        ← {label || '이전 명승으로'}
      </button>
    );
  }

  return (
    <Link
      to="/korea/theme/scenic"
      className="font-bold text-amber-800 hover:underline"
    >
      ← 명승으로
    </Link>
  );
}
