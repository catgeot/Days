import React from 'react';
import { Compass } from 'lucide-react';
import { usePlaceGallery } from '../../../../components/PlaceCard/hooks/usePlaceGallery';
import { resolveListImageUrl } from '../../../../utils/listImageUrl';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './constants';

function pickGalleryUrl(images) {
  if (!images?.length) return '';
  const first = images[0];
  const raw = first.urls?.regular || first.urls?.small || first.url || '';
  return resolveListImageUrl(raw, { role: 'list', width: 640 });
}

const ExploreMonthlyPickMedia = ({ spot, className = '' }) => {
  const categoryKey = spot?.primaryCategory || spot?.category || 'culture';
  const categoryStyle = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.culture;
  const CategoryIcon = CATEGORY_ICONS[categoryKey] || Compass;
  const { images, isImgLoading } = usePlaceGallery(spot, { thumbnailOnly: true });
  const src = pickGalleryUrl(images);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br from-white/[0.08] to-black/40 ${categoryStyle.split(' ')[0]} ${className}`}
      aria-hidden
    >
      {isImgLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        </div>
      ) : (
        <CategoryIcon size={72} className="absolute -bottom-2 -right-2 opacity-25 text-white" />
      )}
    </div>
  );
};

export default ExploreMonthlyPickMedia;
