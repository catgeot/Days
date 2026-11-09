import { useEffect, useId, useRef } from 'react';
import {
  consumeGateoPhotoLightboxEscapeHandled,
  gateoModalBlocksLightboxEscape,
  isTopGateoPhotoLightboxLayer,
  markGateoPhotoLightboxEscapeHandled,
  registerGateoPhotoLightboxLayer,
  resetGateoPhotoLightboxEscapeHandled,
  unregisterGateoPhotoLightboxLayer,
} from './gateoPhotoLightboxLayer';

function focusableRestoreTarget(el) {
  if (!el || typeof el.focus !== 'function') return null;
  if (el === document.body || el === document.documentElement) return null;
  return el;
}

/**
 * Escape (top layer only), focus move on open, restore focus on close.
 * Uses capture so parent sheet Escape handlers can skip via consumeGateoPhotoLightboxEscapeHandled().
 */
export function useGateoPhotoLightboxA11y({
  open,
  onClose,
  rootRef,
  layerId: layerIdProp,
  onArrowLeft,
  onArrowRight,
  enabled = true,
}) {
  const autoId = useId();
  const layerId = layerIdProp || autoId;
  const openerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !open || typeof window === 'undefined') return undefined;

    openerRef.current = focusableRestoreTarget(document.activeElement);
    registerGateoPhotoLightboxLayer(layerId);

    const root = rootRef?.current;
    const focusTarget =
      root?.querySelector?.('[data-gateo-photo-lightbox-focus]') || root;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      if (!focusTarget.hasAttribute('tabindex')) {
        focusTarget.setAttribute('tabindex', '-1');
      }
      requestAnimationFrame(() => {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          /* ignore */
        }
      });
    }

    const onKeyDown = (event) => {
      if (event.key !== 'Escape' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }
      resetGateoPhotoLightboxEscapeHandled();

      const liveRoot = rootRef?.current;
      if (!liveRoot) return;
      if (!isTopGateoPhotoLightboxLayer(layerId)) return;

      if (event.key === 'Escape') {
        if (gateoModalBlocksLightboxEscape(liveRoot)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        markGateoPhotoLightboxEscapeHandled();
        onClose?.();
        return;
      }

      if (gateoModalBlocksLightboxEscape(liveRoot)) return;
      if (event.key === 'ArrowLeft' && onArrowLeft) {
        event.preventDefault();
        onArrowLeft(event);
      } else if (event.key === 'ArrowRight' && onArrowRight) {
        event.preventDefault();
        onArrowRight(event);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      unregisterGateoPhotoLightboxLayer(layerId);
      consumeGateoPhotoLightboxEscapeHandled();
      const restore = focusableRestoreTarget(openerRef.current);
      openerRef.current = null;
      if (restore?.isConnected) {
        requestAnimationFrame(() => {
          try {
            restore.focus({ preventScroll: true });
          } catch {
            /* ignore */
          }
        });
      }
    };
  }, [
    enabled,
    open,
    layerId,
    onClose,
    onArrowLeft,
    onArrowRight,
    rootRef,
  ]);
}
