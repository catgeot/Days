import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../SEO';
import { useLocale } from '../../i18n/LocaleProvider';

export default function PlaceNotFoundView({ onGoHome }) {
  const { slug, tab } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocale();

  const seoPath = tab ? `/place/${slug}/${tab}` : `/place/${slug}`;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center px-6 text-center font-sans"
      data-testid="place-not-found"
    >
      <SEO
        title={t('place.notFound.seoTitle')}
        description={t('place.notFound.body')}
        url={seoPath}
        robotsNoIndex
      />
      <p className="text-lg font-semibold text-white mb-2" lang={locale}>
        {t('place.notFound.title')}
      </p>
      <p className="text-sm text-gray-400 mb-8 max-w-sm" lang={locale}>
        {t('place.notFound.body')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          className="flex-1 rounded-full bg-white text-black text-sm font-semibold py-3 px-5 hover:bg-gray-100 transition-colors"
          onClick={() => (onGoHome ? onGoHome() : navigate('/'))}
        >
          {t('place.nav.home')}
        </button>
        <button
          type="button"
          className="flex-1 rounded-full border border-white/30 text-white text-sm font-semibold py-3 px-5 hover:bg-white/10 transition-colors"
          onClick={() => navigate('/explore')}
        >
          {t('place.notFound.search')}
        </button>
      </div>
    </div>
  );
}
