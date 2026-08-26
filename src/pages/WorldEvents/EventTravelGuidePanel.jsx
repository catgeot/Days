import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { isCloudPreviewSurface } from '../../shared/cloudPreview/isCloudPreviewSurface';

function isDevQaSurface() {
  return isCloudPreviewSurface() || import.meta.env.DEV;
}

/**
 * Tier3 AI EventTravelGuide — parsed sections for users; raw JSON in dev/Preview QA.
 *
 * @param {{
 *   guide: Record<string, unknown> | null,
 *   rawRow?: Record<string, unknown> | null,
 *   locale?: string,
 * }} props
 */
export default function EventTravelGuidePanel({ guide, rawRow = null, locale = 'ko' }) {
  const { t } = useTranslation();

  const parsed = useMemo(() => {
    if (!guide || typeof guide !== 'object') return null;

    const summary = String(guide.summary ?? '').trim();
    const recommendedNights = guide.recommended_nights;
    const tripPresets = Array.isArray(guide.trip_presets) ? guide.trip_presets : [];
    const sections = Array.isArray(guide.sections) ? guide.sections : [];
    const bookingTips = Array.isArray(guide.booking_tips) ? guide.booking_tips : [];
    const cautions = Array.isArray(guide.cautions) ? guide.cautions : [];

    if (!summary && sections.length === 0) return null;

    return { summary, recommendedNights, tripPresets, sections, bookingTips, cautions };
  }, [guide]);

  if (!parsed) return null;

  const showRaw = isDevQaSurface();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-700" aria-hidden />
          <h2 className="text-sm font-extrabold text-violet-950">
            {t('worldEventDetail.aiGuide.title')}
          </h2>
          <span className="rounded-full border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-800">
            {t('worldEventDetail.aiGuide.tierLabel')}
          </span>
        </div>

        {parsed.summary ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{parsed.summary}</p>
        ) : null}

        {parsed.recommendedNights != null ? (
          <p className="mt-2 rounded-xl border border-violet-200 bg-white/80 px-3 py-2 text-sm text-violet-950">
            {t('worldEventDetail.aiGuide.recommendedNights', {
              nights: parsed.recommendedNights,
            })}
          </p>
        ) : null}

        {parsed.tripPresets.length > 0 ? (
          <div className="mt-3 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-violet-800">
              {t('worldEventDetail.aiGuide.tripPresets')}
            </h3>
            <ul className="space-y-2">
              {parsed.tripPresets.map((preset) => (
                <li
                  key={String(preset.id || preset.label)}
                  className="rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm text-stone-700"
                >
                  <p className="font-bold text-stone-900">
                    {preset.label}
                    {preset.nights != null ? (
                      <span className="ml-1 text-xs font-semibold text-violet-700">
                        · {t('worldEventDetail.aiGuide.nights', { count: preset.nights })}
                      </span>
                    ) : null}
                  </p>
                  {preset.timing_hint ? (
                    <p className="mt-0.5 text-xs font-semibold text-stone-500">{preset.timing_hint}</p>
                  ) : null}
                  {preset.rationale ? (
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{preset.rationale}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {parsed.sections.map((section) => (
          <div key={String(section.id || section.title)} className="mt-3">
            <h3 className="text-sm font-extrabold text-stone-900">{section.title}</h3>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">
              {section.content}
            </p>
          </div>
        ))}

        {parsed.bookingTips.length > 0 ? (
          <div className="mt-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-violet-800">
              {t('worldEventDetail.aiGuide.bookingTips')}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-stone-700">
              {parsed.bookingTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {parsed.cautions.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
            <h3 className="text-xs font-extrabold text-amber-900">
              {t('worldEventDetail.aiGuide.cautions')}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-amber-950">
              {parsed.cautions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {showRaw ? (
        <section className="rounded-2xl border border-stone-300 bg-stone-900 p-3 text-xs text-stone-100">
          <p className="mb-2 font-bold text-amber-300">{t('worldEventDetail.aiGuide.rawJson')}</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(rawRow?.guide ?? guide, null, 2)}
          </pre>
          {rawRow?.model ? (
            <p className="mt-2 text-stone-400">
              model: {rawRow.model} · {rawRow.guide_updated_at || ''}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
