import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Home,
  Landmark,
  LayoutGrid,
  Map,
  Mountain,
  Package,
  Route,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { listKoreaThemeModules } from '../Home/lib/koreaThemeModules';
import { clearThemeNavBack } from '../Home/lib/koreaThemeNavBack';

const MODULE_ICONS = {
  calendar: CalendarDays,
  mountain: Mountain,
  landmark: Landmark,
  route: Route,
  map: Map,
  package: Package,
};

const MODULE_I18N = {
  festivals: {
    label: 'korea.theme.moduleFestivals',
    blurb: 'korea.theme.moduleFestivalsBlurb',
  },
  scenic: {
    label: 'korea.theme.moduleScenic',
    blurb: 'korea.theme.moduleScenicBlurb',
  },
};

const MODULES = listKoreaThemeModules();

export default function KoreaThemeLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    clearThemeNavBack();
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title={t('korea.theme.landingTitle')}
        description={t('korea.theme.landingSeoDescription')}
        url="/korea/theme"
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Korea · Scenic
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  {t('korea.theme.landingHeading')}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/korea?from=theme"
                  aria-label={t('korea.theme.festivalsLinkAria')}
                  title={t('korea.theme.festivalsLink')}
                  className="flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <CalendarDays size={14} aria-hidden="true" />
                  {t('korea.theme.festivalsLink')}
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  aria-label={t('korea.common.home')}
                  title={t('korea.common.home')}
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Home size={14} aria-hidden="true" />
                  {t('korea.common.home')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="page-scroll-end-pad mx-auto w-full max-w-3xl px-3 pt-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-theme-modules-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <LayoutGrid size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-theme-modules-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                {t('korea.theme.landingSection')}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">
              {t('korea.theme.landingBlurb')}
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((mod) => {
                const Icon = MODULE_ICONS[mod.icon] || LayoutGrid;
                const i18n = MODULE_I18N[mod.id];
                const label = i18n ? t(i18n.label) : mod.label;
                const blurb = i18n ? t(i18n.blurb) : mod.blurb;
                return (
                  <li key={mod.id}>
                    <Link
                      to={
                        mod.id === 'festivals'
                          ? '/korea?from=theme'
                          : mod.path
                      }
                      className="flex h-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold tracking-tight text-stone-900 break-keep">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep">
                          {blurb}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
