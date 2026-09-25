import React from 'react';
import { collectUniqueEditorialReviewImageCredits } from '../../../utils/editorialReviewImageCredit';

export default function EditorialLogbookImageCredits({ images, className = '' }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  if (credits.length === 0) return null;

  return (
    <p className={`text-[10px] text-gray-400 leading-snug ${className}`}>
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-gray-300"> · </span> : null}
          {credit.type === 'plain' ? (
            credit.text
          ) : (
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
          )}
        </React.Fragment>
      ))}
    </p>
  );
}
