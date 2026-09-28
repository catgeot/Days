import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function stop(event) {
  event.stopPropagation();
}

/** Card keeps compact icons. Article meta uses the action words. */
export default function LogbookReactionSlot({
  likeCount = null,
  commentCount = null,
  liked = false,
  pending = false,
  commentHref = '',
  onToggleLike,
  tone = 'card',
}) {
  const { t } = useTranslation();
  if (likeCount == null && commentCount == null) return null;

  const article = tone === 'article';
  const likeLabel = liked
    ? t('logbook.reactions.unlikeAria')
    : t('logbook.reactions.likeAria', { count: likeCount ?? 0 });
  const commentLabel = t('logbook.reactions.commentAria', { count: commentCount ?? 0 });
  const iconClass = 'text-gray-400 shrink-0';
  const itemClass = article
    ? 'flex items-center gap-1 text-sm font-medium'
    : 'flex items-center gap-1 text-gray-500';
  const likeClass = article
    ? `${itemClass} ${liked ? 'text-red-600' : 'text-gray-700 hover:text-red-600'} disabled:opacity-60`
    : `${itemClass} hover:text-red-500 disabled:opacity-60`;
  const commentClass = article
    ? `${itemClass} text-gray-700 hover:text-blue-600`
    : `${itemClass} hover:text-blue-600`;

  return (
    <div className={`flex items-center ${article ? 'gap-3' : 'gap-2.5'}`} onClick={stop}>
      {likeCount != null ? (
        <button
          type="button"
          className={likeClass}
          aria-pressed={liked}
          aria-label={likeLabel}
          title={likeLabel}
          disabled={pending}
          onClick={(event) => {
            stop(event);
            event.preventDefault();
            onToggleLike?.();
          }}
        >
          {article ? (
            t('logbook.reactions.like')
          ) : (
            <Heart
              size={12}
              strokeWidth={2}
              className={liked ? 'fill-red-500 text-red-500 shrink-0' : 'fill-none text-red-500 shrink-0'}
            />
          )}
          {likeCount.toLocaleString()}
        </button>
      ) : null}
      {commentCount != null ? (
        commentHref ? (
          <Link
            to={commentHref}
            className={commentClass}
            aria-label={commentLabel}
            title={commentLabel}
            onClick={stop}
          >
            {article ? t('logbook.reactions.comment') : <MessageCircle size={12} className={iconClass} />}
            {commentCount.toLocaleString()}
          </Link>
        ) : (
          <span className={article ? `${itemClass} text-gray-700` : itemClass} aria-label={commentLabel} title={commentLabel}>
            {article ? t('logbook.reactions.comment') : <MessageCircle size={12} className={iconClass} />}
            {commentCount.toLocaleString()}
          </span>
        )
      ) : null}
    </div>
  );
}
