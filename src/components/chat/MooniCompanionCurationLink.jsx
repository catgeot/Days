import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isQuicklinkReviewTabActive } from '../../shared/gateoFeatureFlags.js';
import { trackMooniCurationLinkClick } from '../../shared/analytics/quicklinkAnalytics.js';

/**
 * @param {string | null | undefined} chipId
 * @param {string | null | undefined} search
 */
export function shouldShowMooniCompanionCurationLink(chipId, search) {
  return chipId === 'companion' && isQuicklinkReviewTabActive(search);
}

/**
 * One text link at the end of a MOONi «동행별 추천» answer. No new chip.
 * @param {{ chipId?: string | null, variant?: 'light' | 'dark' }} props
 */
export default function MooniCompanionCurationLink({ chipId, variant = 'dark' }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  if (!shouldShowMooniCompanionCurationLink(chipId, search)) return null;
  const light = variant === 'light';
  return (
    <p className="mt-3 mb-0">
      <Link
        to="/blog/curation"
        data-testid="mooni-companion-curation-link"
        onClick={() => {
          trackMooniCurationLinkClick();
        }}
        className={
          light
            ? 'inline text-[13px] font-semibold leading-snug text-cyan-900 underline decoration-cyan-700/70 underline-offset-2 break-keep'
            : 'inline text-[13px] font-semibold leading-snug text-sky-200 underline decoration-sky-300/70 underline-offset-2 break-keep'
        }
      >
        {t('mooni.chat.companionCurationLink')}
      </Link>
    </p>
  );
}
