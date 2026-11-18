import React from 'react';
import { collectUniqueEditorialReviewImageCredits } from '../../../utils/editorialReviewImageCredit';
import { EditorialStockPhotoCreditLine } from '../../../components/PlaceCard/common/StockPhotoCreditLine';
import { EditorialReviewPhotoNote } from '../../../components/PlaceCard/common/EditorialReviewPhotoNote';

export default function EditorialLogbookImageCredits({ images, className = '' }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  const image = Array.isArray(images) ? images[0] : null;
  if (!image && credits.length === 0) return null;

  return (
    <div className={className}>
      {image ? <EditorialReviewPhotoNote image={image} variant="inline" className="mb-0.5" /> : null}
      {credits.length > 0 ? (
        <p className="text-[10px] text-gray-400 leading-snug" translate="no">
          {credits.map((credit, index) => (
            <React.Fragment key={`${credit.type}-${index}`}>
              {index > 0 ? <span className="text-gray-300"> · </span> : null}
              {credit.type === 'plain' ? (
                credit.text
              ) : (
                <EditorialStockPhotoCreditLine credit={credit} allowAuthorWrap />
              )}
            </React.Fragment>
          ))}
        </p>
      ) : null}
    </div>
  );
}