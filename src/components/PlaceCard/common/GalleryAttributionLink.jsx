import React from 'react';
import {
  getGalleryAttributionLinkTarget,
  navigateGalleryAttributionLink,
  resolveGalleryPlaceKey,
} from './galleryAttributionNavigation';

const GalleryAttributionLink = ({
  href,
  location,
  placeKey: placeKeyProp,
  image,
  context = 'gallery',
  lightboxIndex,
  className,
  title,
  children,
  onClick,
}) => {
  const placeKey = placeKeyProp || resolveGalleryPlaceKey(location);

  return (
    <a
      href={href}
      target={getGalleryAttributionLinkTarget()}
      rel="noopener noreferrer"
      className={className}
      title={title}
      onClick={(e) => {
        onClick?.(e);
        navigateGalleryAttributionLink(e, {
          placeKey,
          image,
          href,
          context,
          lightboxIndex,
        });
      }}
    >
      {children}
    </a>
  );
};

export default GalleryAttributionLink;
