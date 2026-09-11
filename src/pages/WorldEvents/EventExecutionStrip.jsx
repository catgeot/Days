import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, ExternalLink, Luggage, Ticket } from 'lucide-react';
import KlookCarBannerWidget from '../../components/PlaceCard/tabs/planner/components/KlookCarBannerWidget';
import GetYourGuideActivitiesWidget from '../../components/PlaceCard/tabs/planner/components/GetYourGuideActivitiesWidget';
import { buildGygActivitiesSearchQuery } from '../../components/PlaceCard/tabs/planner/locationRules';
import { getKlookRentalUrlByLocation, GYG_PLANNER_ACTIVITIES_ITEM_COUNT } from '../../utils/affiliate';
import {
  buildMrtPkcUrlForLocation,
  formatMrtPackageProductCtaLabel,
} from '../../utils/mrtPackageLinks';
import {
  canShowMrtPackageStrip,
  resolveMrtPackageDisplayKeyword,
  resolveMrtPackageSearchKeyword,
} from '../../utils/mrtPackageQuery';

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   location: Record<string, unknown>,
 *   locale?: string,
 * }} props
 */
export default function EventExecutionStrip({ event, location }) {
  const { t, i18n } = useTranslation();

  const klookRentalUrl = useMemo(
    () => getKlookRentalUrlByLocation(location),
    [location?.slug, location?.name, location?.name_en, location?.country],
  );

  const gygQuery = useMemo(() => buildGygActivitiesSearchQuery(location), [
    location?.slug,
    location?.name,
    location?.name_en,
    location?.curation_data?.locationEn,
  ]);

  const showKlook = Boolean(klookRentalUrl);
  const showGyg = Boolean(gygQuery);
  const showPkc = canShowMrtPackageStrip(location);
  const pkcKeyword = resolveMrtPackageSearchKeyword(location);
  const pkcDisplayKeyword = resolveMrtPackageDisplayKeyword(location, i18n.language);
  const pkcHref = showPkc
    ? buildMrtPkcUrlForLocation(location, { utmContent: 'event-detail-execution' })
    : null;

  if (!showKlook && !showGyg && !showPkc) return null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Ticket size={16} className="text-amber-700" aria-hidden />
        <h2 className="text-sm font-extrabold text-stone-900">
          {t('worldEventDetail.executionStrip.title')}
        </h2>
      </div>
      <p className="mt-1 text-xs text-stone-500">{t('worldEventDetail.executionStrip.hint')}</p>

      {showKlook ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Car size={14} className="shrink-0 text-amber-700" aria-hidden />
            <h3 className="text-xs font-extrabold text-stone-800">
              {t('worldEventDetail.executionStrip.rentalTitle')}
            </h3>
          </div>
          <KlookCarBannerWidget
            targetUrl={klookRentalUrl}
            className="mt-0"
            footerHint={t('worldEventDetail.executionStrip.rentalHint')}
          />
        </div>
      ) : null}

      {showGyg ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Ticket size={14} className="shrink-0 text-orange-700" aria-hidden />
            <h3 className="text-xs font-extrabold text-stone-800">
              {t('worldEventDetail.executionStrip.tourTitle')}
            </h3>
          </div>
          <GetYourGuideActivitiesWidget
            key={`${event?.id || 'event'}-gyg`}
            location={location}
            query={gygQuery}
            itemCount={GYG_PLANNER_ACTIVITIES_ITEM_COUNT}
            showMoreLink
            linkSponsoredLabel
            className="mt-0"
          />
        </div>
      ) : null}

      {showPkc && pkcHref ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Luggage size={14} className="shrink-0 text-teal-700" aria-hidden />
            <h3 className="text-xs font-extrabold text-stone-800">
              {t('worldEventDetail.executionStrip.packageTitle')}
            </h3>
          </div>
          <a
            href={pkcHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-[13px] font-semibold text-teal-900 transition-colors hover:border-teal-300 hover:bg-teal-100 active:scale-[0.98]"
          >
            <Luggage size={16} className="shrink-0 text-teal-700" strokeWidth={2.25} aria-hidden />
            <span className="break-keep">
              {formatMrtPackageProductCtaLabel(pkcKeyword, { displayKeyword: pkcDisplayKeyword })}
            </span>
            <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden />
          </a>
          <p className="mt-1.5 text-[11px] text-stone-500">
            {t('worldEventDetail.executionStrip.packageHint')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
