import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** @param {string | null | undefined} chipId */
export function shouldShowMooniCompanionCurationLink(chipId) {
  return chipId === 'companion';
}

export default function MooniCompanionCurationLink({ chipId, variant = 'dark' }) {
  const { t } = useTranslation();
  if (!shouldShowMooniCompanionCurationLink(chipId)) return null;
  const light = variant === 'light';
  return (
    <p className="mt-3 mb-0">
      <Link
        to="/blog/curation"
        data-testid="mooni-companion-curation-link"
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