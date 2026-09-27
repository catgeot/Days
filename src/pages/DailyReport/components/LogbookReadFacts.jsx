import React from 'react';
import { Clock, Eye, Files } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Fact({ icon: Icon, label, title, href, tone }) {
  const className =
    tone === 'article'
      ? 'text-gray-500 text-sm flex items-center gap-1 font-medium'
      : 'flex items-center gap-1 text-gray-500';
  const icon = <Icon size={tone === 'article' ? 14 : 12} className="text-gray-400 shrink-0" />;
  if (href) {
    return (
      <Link
        to={href}
        className={`${className} hover:text-blue-600`}
        title={title}
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <span className={className} title={title} aria-label={title}>
      {icon}
      {label}
    </span>
  );
}

/** Card footer and article header share one row of read facts. */
export default function LogbookReadFacts({
  minutes = null,
  placeCount = null,
  viewCount = null,
  tone = 'card',
  placeHref = '',
}) {
  const { t } = useTranslation();
  const items = [];

  if (minutes != null) {
    items.push({
      key: 'read',
      icon: Clock,
      label:
        tone === 'article'
          ? t('logbook.meta.readingMinutes', { count: minutes })
          : t('logbook.meta.readingMinutesShort', { count: minutes }),
      title: t('logbook.meta.readingAria', { count: minutes }),
    });
  }

  if (placeCount != null && tone === 'article') {
    items.push({
      key: 'place',
      icon: Files,
      label: t('logbook.meta.samePlace', { count: placeCount }),
      title: t('logbook.meta.samePlaceAria', { count: placeCount }),
      href: placeHref,
    });
  }

  if (viewCount != null) {
    items.push({
      key: 'views',
      icon: Eye,
      label: viewCount.toLocaleString(),
      title: t('logbook.recentList.readCount', { count: viewCount }),
    });
  }

  if (!items.length) return null;

  return (
    <>
      {items.map((item) => (
        <Fact key={item.key} tone={tone} {...item} />
      ))}
    </>
  );
}
