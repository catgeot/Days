import React from 'react';
import { useTranslation } from 'react-i18next';

const ProfilePhotoCount = ({ count, tone = 'badge', className = '' }) => {
  const { t } = useTranslation();
  const n = Number(count) || 0;
  if (n < 1) return null;
  const label = t('authPage.account.photoCountLabel', { count: n });
  if (tone === 'text') {
    return (
      <span className={`shrink-0 text-[10px] font-bold tabular-nums text-gray-500 ${className}`} aria-label={label}>
        {n}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-black/75 px-1.5 text-[10px] font-bold leading-4 tabular-nums text-white ${className}`}
      aria-label={label}
    >
      {n}
    </span>
  );
};

export default ProfilePhotoCount;
