import React, { useLayoutEffect, useRef } from 'react';

const ExploreMonthlyPickMedia = ({
  imageUrl,
  alt = '',
  className = '',
  objectPosition = '50% 50%',
  onError,
  onNaturalSize,
}) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const img = ref.current;
    if (!img || !onNaturalSize) return;
    const report = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        onNaturalSize(img.naturalWidth, img.naturalHeight);
      }
    };
    report();
    if (!img.complete) {
      img.addEventListener('load', report, { once: true });
      return () => img.removeEventListener('load', report);
    }
    return undefined;
  }, [imageUrl, onNaturalSize]);

  if (!imageUrl) return null;

  return (
    <img
      ref={ref}
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e?.currentTarget?.removeAttribute('src');
        onError?.(e);
      }}
      style={{ objectPosition }}
      className={`absolute inset-0 z-[1] h-full w-full object-cover ${className}`}
    />
  );
};

export default ExploreMonthlyPickMedia;
