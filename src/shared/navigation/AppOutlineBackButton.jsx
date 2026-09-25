import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from 'lucide-react';

const BASE_CLASS =
  'fixed top-[max(1.25rem,env(safe-area-inset-top,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))] sm:top-8 sm:right-8 z-[60] flex items-center justify-center min-w-11 min-h-11 w-11 h-11 sm:min-w-12 sm:min-h-12 sm:w-12 sm:h-12 rounded-full border-2 backdrop-blur-[2px] shadow-sm transition-colors touch-manipulation pointer-events-auto';

const VARIANT_CLASS = {
  default:
    'border-gray-600/55 bg-white/15 text-gray-800 hover:bg-white/35 hover:border-gray-700/70',
  onDark:
    'border-white/55 bg-white/15 text-white hover:bg-white/30 hover:border-white/75',
};

/**
 * Fixed top-right outline back (`icon="back"`) or close (`icon="close"`) — LogBook (#311) parity.
 * Portaled to document.body so ancestor transform/filter does not break position:fixed.
 */
export default function AppOutlineBackButton({
  onClick,
  ariaLabel,
  title,
  variant = 'default',
  icon = 'back',
  className = '',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toneClass = VARIANT_CLASS[variant] || VARIANT_CLASS.default;
  const Icon = icon === 'close' ? X : ArrowLeft;

  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={`${BASE_CLASS} ${toneClass} ${className}`.trim()}
    >
      <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(button, document.body);
}
