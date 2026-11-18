import React, { useMemo } from 'react';
import GalleryAttributionLink from './GalleryAttributionLink';
import { buildGalleryPhotoCredit } from './buildGalleryPhotoCredit';
import StockPhotoCreditLine from './StockPhotoCreditLine';

const creditShellClass =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-1.5 pt-6';

function GalleryCreditLink({ href, className, children, location, image, context, title, onClick }) {
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <GalleryAttributionLink
      href={href}
      location={location}
      image={image}
      context={context}
      className={className}
      title={title}
      onClick={onClick}
    >
      {children}
    </GalleryAttributionLink>
  );
}

export default function GalleryGridPhotoCredit({ image, location, locale }) {
  const credit = useMemo(() => buildGalleryPhotoCredit(image, locale), [image, locale]);

  if (!credit) return null;

  const wikimedia = credit.kind === 'wikimedia';

  return (
    <p
      data-gallery-photo-credit=""
      data-gallery-wikimedia-credit={wikimedia ? '' : undefined}
      className={creditShellClass}
    >
      <StockPhotoCreditLine
        credit={credit}
        tone="gallery-overlay"
        interactiveLinks={false}
        allowAuthorWrap={false}
        rowClassName="min-w-0 max-w-full truncate"
        LinkComponent={GalleryCreditLink}
        linkExtraProps={{ location, image, context: 'gallery-grid' }}
      />
    </p>
  );
}