import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, PenLine, Sparkles, ClipboardList } from 'lucide-react';

const BENEFIT_ITEMS = [
  { key: 'bucket', Icon: Star },
  { key: 'logbook', Icon: PenLine },
  { key: 'ai', Icon: Sparkles },
  { key: 'planner', Icon: ClipboardList },
];

export default function AuthBenefits() {
  const { t } = useTranslation();

  return (
    <aside className="w-full lg:w-72 shrink-0" aria-label={t('authPage.benefits.title')}>
      <p className="mb-2 text-center text-[11px] font-bold tracking-widest text-white/70 lg:text-left">
        {t('authPage.benefits.title')}
      </p>
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {BENEFIT_ITEMS.map(({ key, Icon }) => (
          <li
            key={key}
            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-white backdrop-blur-md"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Icon size={13} className="text-sky-200" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-snug break-keep">
                  {t(`authPage.benefits.${key}.title`)}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/75 break-keep">
                  {t(`authPage.benefits.${key}.body`)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
