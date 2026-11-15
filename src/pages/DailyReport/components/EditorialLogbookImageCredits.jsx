import React from 'react';
import { collectUniqueEditorialReviewImageCredits } from '../../../utils/editorialReviewImageCredit';

export default function EditorialLogbookImageCredits({ images, className = '' }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  if (credits.length === 0) return null;

  return (
    <p className={`text-[10px] text-gray-400 leading-snug ${className}`} translate="no">
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-gray-300"> · </span> : null}
          {credit.type === 'unsplash' ? (
            <>
              Photo by{' '}
              {credit.photographerHref ? (
                <a
                  href={credit.photographerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
                >
                  {credit.photographerName}
                </a>
              ) : (
                credit.photographerName
              )}
              {' on '}
              <a
                href={credit.unsplashHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
              >
                Unsplash
              </a>
            </>
          ) : (
            credit.text
          )}
        </React.Fragment>
      ))}
    </p>
  );
}
