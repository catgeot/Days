import React from 'react';
import { collectUniqueEditorialReviewImageCredits } from '../../../utils/editorialReviewImageCredit';
import { EditorialStockPhotoCreditLine } from '../../../components/PlaceCard/common/StockPhotoCreditLine';

export default function EditorialLogbookImageCredits({ images, className = '' }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  if (credits.length === 0) return null;

  return (
    <p className={`text-[10px] text-gray-400 leading-snug ${className}`} translate="no">
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
  );
}