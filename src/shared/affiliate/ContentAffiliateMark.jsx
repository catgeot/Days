import { useTranslation } from 'react-i18next';

/** Inline 「제휴광고」 mark — same copy and weight as planner checklist CTAs. */
export default function ContentAffiliateMark() {
  const { t } = useTranslation();
  return (
    <span className="ml-1.5 text-[10px] font-bold text-gray-500 opacity-75">
      {t('place.planner.banners.affiliateBadge')}
    </span>
  );
}
