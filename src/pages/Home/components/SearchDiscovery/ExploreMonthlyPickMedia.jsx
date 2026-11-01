import React from 'react';

const ExploreMonthlyPickMedia = ({ imageUrl, alt = '', className = '', onError }) => {
  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={onError}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
};

export default ExploreMonthlyPickMedia;
