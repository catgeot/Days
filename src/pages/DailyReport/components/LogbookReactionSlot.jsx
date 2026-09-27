import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function stop(event) {
  event.stopPropagation();
}

/** Inline like and comment counts for the public feed card footer and article meta. */
export default function LogbookReactionSlot({
  likeCount = null,
  commentCount = null,
  liked = false,
  pending = false,
  commentHref = '',
  onToggleLike,
}) {
  const { t } = useTranslation();
  if (likeCount == null && commentCount == null) return null;

  const likeLabel = liked
    ? t('logbook.reactions.unlikeAria')
    : t('logbook.reactions.likeAria', { count: likeCount ?? 0 });
  const commentLabel = t('logbook.reactions.commentAria', { count: commentCount ?? 0 });
  const iconClass = 'text-gray-400 shrink-0';
  const itemClass = 'flex items-center gap-1 text-gray-500';

  return (
    <div className="flex items-center gap-2.5" onClick={stop}>
      {likeCount != null ? (
        <button
          type="button"
          className={`${itemClass} hover:text-red-500 disabled:opacity-60`}
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
          <Heart size={12} className={liked ? 'fill-red-500 text-red-500 shrink-0' : iconClass} />
          {likeCount.toLocaleString()}
        </button>
      ) : null}
      {commentCount != null ? (
        commentHref ? (
          <Link
            to={commentHref}
            className={`${itemClass} hover:text-blue-600`}
            aria-label={commentLabel}
            title={commentLabel}
            onClick={stop}
          >
            <MessageCircle size={12} className={iconClass} />
            {commentCount.toLocaleString()}
          </Link>
        ) : (
          <span className={itemClass} aria-label={commentLabel} title={commentLabel}>
            <MessageCircle size={12} className={iconClass} />
            {commentCount.toLocaleString()}
          </span>
        )
      ) : null}
    </div>
  );
}
