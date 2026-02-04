// src/components/PlaceCard/PlaceMediaPanel.jsx
import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView'; // 🚨 기존 컴포넌트 재사용

const PlaceMediaPanel = ({ galleryData, isFullScreen, toggleFullScreen, showUI }) => {
  return (
    <PlaceGalleryView 
      images={galleryData.images}
      isImgLoading={galleryData.isImgLoading}
      selectedImg={galleryData.selectedImg}
      setSelectedImg={galleryData.setSelectedImg}
      isFullScreen={isFullScreen}
      toggleFullScreen={toggleFullScreen}
      closeImageKeepFullscreen={(e) => { e.stopPropagation(); galleryData.setSelectedImg(null); }}
      showUI={showUI}
    />
  );
};

export default PlaceMediaPanel;