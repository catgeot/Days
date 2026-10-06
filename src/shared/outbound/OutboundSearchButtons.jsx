import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

export function NaverOutboundButton({ href, labelKey, ariaKey }) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;
  const aria = ariaKey || labelKey;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria ? t(aria) : undefined}
      className="inline-flex max-w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#03C75A]/50 bg-white px-2.5 py-2 text-xs font-bold text-[#027A38] shadow-sm transition-colors hover:border-[#03C75A]/75 hover:bg-[#E8F9EF] sm:min-w-0 sm:flex-1 sm:justify-start sm:py-1.5"
    >
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[#03C75A] text-[9px] font-black leading-none text-white"
        aria-hidden="true"
      >
        N
      </span>
      <span className="whitespace-nowrap text-center leading-none sm:text-left">{t(labelKey)}</span>
      <ExternalLink size={12} className="shrink-0 text-[#03C75A]" aria-hidden="true" />
    </a>
  );
}

export function GoogleOutboundButton({ href, labelKey, ariaKey }) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;
  const aria = ariaKey || labelKey;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria ? t(aria) : undefined}
      className="inline-flex max-w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#4285F4]/40 bg-white px-2.5 py-2 text-xs font-bold text-[#174EA6] shadow-sm transition-colors hover:border-[#4285F4]/70 hover:bg-[#E8F0FE] sm:min-w-0 sm:flex-1 sm:justify-start sm:py-1.5"
    >
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[#4285F4] text-[9px] font-black leading-none text-white"
        aria-hidden="true"
      >
        G
      </span>
      <span className="whitespace-nowrap text-center leading-none sm:text-left">{t(labelKey)}</span>
      <ExternalLink size={12} className="shrink-0 text-[#4285F4]" aria-hidden="true" />
    </a>
  );
}

export function OutboundSearchButtons({
  naverHref,
  googleHref,
  naverLabelKey,
  googleLabelKey,
  naverAriaKey,
  googleAriaKey,
}) {
  const naver = String(naverHref || '').trim();
  const google = String(googleHref || '').trim();
  if (!naver && !google) return null;
  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 sm:gap-1.5">
      {naver ? (
        <NaverOutboundButton
          href={naver}
          labelKey={naverLabelKey}
          ariaKey={naverAriaKey}
        />
      ) : null}
      {google ? (
        <GoogleOutboundButton
          href={google}
          labelKey={googleLabelKey}
          ariaKey={googleAriaKey}
        />
      ) : null}
    </div>
  );
}
