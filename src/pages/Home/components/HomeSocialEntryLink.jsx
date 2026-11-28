import React from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isGateoSocialLinksEnabled } from '../../../shared/gateoFeatureFlags.js';

export default function HomeSocialEntryLink() {
  const { t } = useTranslation();
  if (!isGateoSocialLinksEnabled()) return null;

  const label = t('home.socialEntry.label');

  return (
    <Link
      to="/social"
      data-testid="home-social-entry-link"
      className="group relative flex w-auto max-w-[14rem] min-h-11 items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-[#130f18] px-2.5 py-2 shadow-[0_0_14px_rgba(232,121,249,0.16)] transition-colors touch-manipulation hover:border-fuchsia-300/60 hover:bg-[#18121f] active:scale-[0.98]"
      aria-label={t('home.socialEntry.aria', { label })}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-200 group-hover:bg-fuchsia-500/25">
        <Clapperboard size={15} aria-hidden="true" />
      </span>
      <span className="truncate text-[12px] font-bold tracking-wide text-white break-keep">
        {label}
      </span>
    </Link>
  );
}