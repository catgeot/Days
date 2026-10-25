import React from 'react';
import { EditorialReviewText } from '../components/PlaceCard/tabs/EditorialReviewText.jsx';
import { ReviewLinkChips } from '../components/PlaceCard/tabs/ReviewLinkChips.jsx';
import EditorialLogbookImageCredits from '../pages/DailyReport/components/EditorialLogbookImageCredits.jsx';
import { resolveEditorialReviewDisclosure } from '../utils/placeReviewEditorial.js';
import {
  dedupeReviewLinkItems,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
  resolveReviewImageSrc,
  reviewBodyLinkUrlKeys,
} from '../utils/placeReviewContentBlocks.js';

function EditorialInlineImage({ img, blockKey }) {
  const src = resolveReviewImageSrc(img);
  if (!src) return null;
  return (
    <div key={blockKey} className="mt-4">
      <img
        src={src}
        alt=""
        className="w-full rounded-lg object-cover max-h-80 bg-gray-100 border border-gray-200"
        loading="lazy"
        decoding="async"
      />
      <EditorialLogbookImageCredits images={[img]} />
    </div>
  );
}

export function LogbookEditorialReviewBody({ review }) {
  if (!review) return null;

  const disclosure = resolveEditorialReviewDisclosure(review);
  const usesContentBlocks = hasReviewContentBlocks(review.content_blocks);
  const contentBlocks = normalizeReviewContentBlocks(review.content_blocks);

  return (
    <>
      {disclosure ? (
        <p
          className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1.5 mb-3 leading-snug"
          data-testid="logbook-official-review-hub-editorial-notice"
        >
          {disclosure}
        </p>
      ) : null}

      {usesContentBlocks ? (
        contentBlocks.map((block, blockIdx) => {
          if (block.type === 'text') {
            return (
              <EditorialReviewText
                key={`text-${blockIdx}`}
                text={block.text}
                className="mt-3 first:mt-0 text-sm text-gray-800 leading-relaxed"
              />
            );
          }
          if (block.type === 'links') {
            const chipItems = dedupeReviewLinkItems(
              block.items,
              reviewBodyLinkUrlKeys(contentBlocks),
            );
            if (chipItems.length === 0) return null;
            return <ReviewLinkChips key={`links-${blockIdx}`} items={chipItems} />;
          }
          if (block.type === 'image') {
            const images = review.images || [];
            if (block.image_index >= images.length) return null;
            return (
              <EditorialInlineImage
                key={`image-${blockIdx}`}
                blockKey={`image-${blockIdx}`}
                img={images[block.image_index]}
              />
            );
          }
          return null;
        })
      ) : review.content ? (
        <EditorialReviewText
          text={review.content}
          className="text-sm text-gray-800 leading-relaxed"
        />
      ) : null}
    </>
  );
}
