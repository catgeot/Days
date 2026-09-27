import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProfilePhotoCount from './ProfilePhotoCount';

const ProfilePhotoLightbox = ({ src, photos, name, onClose }) => {
  const { t } = useTranslation();
  const list = (photos?.length ? photos : src ? [src] : []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = list[index] || list[0] || '';

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && list.length > 1) {
        setIndex((prev) => (prev + 1) % list.length);
      }
      if (event.key === 'ArrowLeft' && list.length > 1) {
        setIndex((prev) => (prev - 1 + list.length) % list.length);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, list.length]);

  if (!current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center overflow-hidden bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('authPage.account.viewPhoto', { name })}
      onClick={onClose}
    >
      <button
        type="button"
        data-profile-close
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation hover:bg-white/20 active:opacity-80"
        aria-label={t('authPage.account.closePhoto')}
      >
        <X size={22} className="pointer-events-none" />
      </button>
      <figure className="max-w-full" onClick={(event) => event.stopPropagation()}>
        <img
          src={current}
          alt={name || ''}
          className="h-auto w-auto max-h-[82vh] max-w-[min(100vw-2rem,56rem)] rounded-2xl object-contain"
        />
        <figcaption className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-white/90">
          {name ? <span>{name}</span> : null}
          <ProfilePhotoCount count={list.length} />
        </figcaption>
      </figure>
      {list.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((prev) => (prev - 1 + list.length) % list.length);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label={t('authPage.account.prevPhoto')}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((prev) => (prev + 1) % list.length);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label={t('authPage.account.nextPhoto')}
          >
            <ChevronRight size={22} />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
};

export default ProfilePhotoLightbox;
