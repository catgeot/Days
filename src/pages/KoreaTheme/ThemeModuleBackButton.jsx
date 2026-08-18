import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

/**
 * 모듈 헤더 복귀 — 크로스 이동 후엔 「이전」, 아니면 「명승」.
 * `onlyWhenBack`: 명승 홈처럼 기본 「명승」 자기 링크가 불필요할 때.
 */
export default function ThemeModuleBackButton({ onlyWhenBack = false }) {
  const { t } = useTranslation();
  const { back, goBack } = useThemeNavBackAction();

  if (back?.path) {
    const label = formatThemeNavBackLabel(back);
    return (
      <button
        type="button"
        onClick={goBack}
        aria-label={
          label
            ? t('korea.theme.navBackAria', { label })
            : t('korea.theme.navBack')
        }
        title={label || t('korea.theme.navBack')}
        className={BTN_CLASS}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {t('korea.theme.navBack')}
      </button>
    );
  }

  if (onlyWhenBack) return null;

  return (
    <Link
      to="/korea/theme/scenic"
      aria-label={t('korea.theme.navScenicAria')}
      title={t('korea.theme.navScenic')}
      className={BTN_CLASS}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {t('korea.theme.navScenic')}
    </Link>
  );
}

/** 이전 상태 표기 (축제 from=theme 힌트와 동일 톤) */
export function ThemeNavBackHint() {
  const { t } = useTranslation();
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
      {t('korea.theme.navBackHint')}
    </p>
  );
}

/** 축제 `/korea?from=theme` — 가능하면 직전 테마 상세로 복귀 */
export function ThemeFestivalBackLink() {
  const { t } = useTranslation();
  const { back, goBack } = useThemeNavBackAction();
  const label = formatThemeNavBackLabel(back);

  if (back?.path) {
    return (
      <button
        type="button"
        onClick={goBack}
        className="font-bold text-amber-800 hover:underline"
      >
        ← {label || t('korea.theme.navPrevScenic')}
      </button>
    );
  }

  return (
    <Link
      to="/korea/theme/scenic"
      className="font-bold text-amber-800 hover:underline"
    >
      ← {t('korea.theme.navScenicLink')}
    </Link>
  );
}
