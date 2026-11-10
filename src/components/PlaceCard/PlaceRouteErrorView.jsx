import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../SEO';
import { useLocale } from '../../i18n/LocaleProvider';

export default function PlaceRouteErrorView({ onRetry }) {
  const { slug, tab } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();

  const seoPath = tab ? `/place/${slug}/${tab}` : `/place/${slug}`;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center px-6 text-center font-sans"
      data-testid="place-route-error"
    >
      <SEO
        title={t('place.loadError.seoTitle')}
        description={t('place.loadError.body')}
        url={seoPath}
        robotsNoIndex
      />
      <p className="text-lg font-semibold text-white mb-2" lang={locale}>
        {t('place.loadError.title')}
      </p>
      <p className="text-sm text-gray-400 mb-8 max-w-sm" lang={locale}>
        {t('place.loadError.body')}
      </p>
      <button
        type="button"
        className="rounded-full bg-white text-black text-sm font-semibold py-3 px-8 hover:bg-gray-100 transition-colors"
        onClick={() => onRetry?.()}
      >
        {t('place.loadError.retry')}
      </button>
    </div>
  );
}
