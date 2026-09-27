import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProfilePhotoLightbox = ({ src, name, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('authPage.account.viewPhoto', { name })}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label={t('authPage.account.closePhoto')}
      >
        <X size={20} />
      </button>
      <figure className="max-w-full" onClick={(event) => event.stopPropagation()}>
        <img
          src={src}
          alt={name || ''}
          className="h-auto w-auto max-h-[82vh] max-w-[min(100vw-2rem,56rem)] rounded-2xl object-contain"
        />
        {name ? (
          <figcaption className="mt-3 text-center text-sm font-semibold text-white/90">{name}</figcaption>
        ) : null}
      </figure>
    </div>,
    document.body,
  );
};

export default ProfilePhotoLightbox;
