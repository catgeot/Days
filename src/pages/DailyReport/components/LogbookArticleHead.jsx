import React from 'react';
import {
  LOGBOOK_DETAIL_DEK_CLASS,
  LOGBOOK_DETAIL_TITLE_CLASS,
  LOGBOOK_READER_DEK_CLASS,
  resolveLogbookDek,
} from '../../../utils/logbookDek.js';

export default function LogbookArticleHead({ report, title, readerDek = false }) {
  const headline = title ?? report?.title ?? '';
  const dek = resolveLogbookDek(report);
  const dekClass = readerDek ? LOGBOOK_READER_DEK_CLASS : LOGBOOK_DETAIL_DEK_CLASS;

  return (
    <header className="mb-2">
      <h1 className={`${LOGBOOK_DETAIL_TITLE_CLASS} ${dek ? '' : 'mb-6 sm:mb-8'}`}>{headline}</h1>
      {dek ? <p className={dekClass}>{dek}</p> : null}
    </header>
  );
}
