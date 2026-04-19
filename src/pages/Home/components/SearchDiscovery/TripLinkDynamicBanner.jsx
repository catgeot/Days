import React from 'react';

const TripLinkDynamicBanner = ({ adKey, width = 728, height = 90, className = '' }) => {
  if (!adKey) return null;

  return (
    <div className={`flex justify-center items-center overflow-hidden ${className}`} style={{ width: '100%', maxWidth: width, height }}>
      <iframe
        src={`https://info.triplink.kr/d/${adKey}`}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        style={{ display: 'block', maxWidth: '100%', objectFit: 'contain' }}
        title="TripLink Package Banner"
      />
    </div>
  );
};

export default TripLinkDynamicBanner;
