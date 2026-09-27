import React, { useMemo, useState } from 'react';
import { MapPin, ChevronRight, Image as ImageIcon, PenTool, ClipboardList, Search, LayoutGrid, List as ListIcon, XCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MOBILE_INPUT_TEXT_CLASS,
  useDeferredViewportSyncOnBlur,
} from '../../../shared/hooks/useMobileInputViewport';
import { resolveLogbookFeedExcerpt } from '../../../utils/logbookDek.js';
import { isEditorialLogbook, publicLogbookDetailPath } from '../../../utils/logbookEditorial';
import { logbookHeroImageUrl } from '../../../utils/logbookImageSrc';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import { readLogbookViewCount } from '../../../utils/logbookViewCount';
import { countReportsByPlace, logbookReadingMinutes, samePlaceCount } from '../../../utils/logbookReadingMeta';
import EditorialLogbookBadge from './EditorialLogbookBadge';
import LogbookReadFacts from './LogbookReadFacts';

const GATEO_PUBLIC_SOURCE_URL = 'https://www.gateo.kr/';

const RecentList = ({ reports, loading, isPublicMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchBlur = useDeferredViewportSyncOnBlur();

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Search narrows cards; same-place counts stay on the loaded feed.
  const placeCounts = useMemo(() => countReportsByPlace(reports), [reports]);

  const isCompact = filteredReports.length > 5;

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-50/50 rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-all">

      <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent sticky top-0 z-10">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 self-start sm:self-center tracking-tight">
          <ClipboardList className="text-blue-500" size={20} />
          {isCompact ? t('logbook.recentList.titleCompact') : t('logbook.recentList.title')}
        </h3>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.currentTarget.querySelector('input')?.blur();
            }}
            className="relative flex-1 sm:w-56 group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={16} />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              placeholder={t('logbook.recentList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={handleSearchBlur}
              className={`w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t('logbook.recentList.clearSearch')}
              >
                <XCircle size={14} />
              </button>
            )}
          </form>

          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 flex-shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-blue-600 shadow-sm border border-gray-100 rounded-lg transition-all hover:bg-gray-50"
            >
              {viewMode === 'list' ? <LayoutGrid size={16} /> : <ListIcon size={16} />}
              <span className="text-xs font-medium hidden sm:block">{viewMode === 'list' ? t('logbook.recentList.viewGrid') : t('logbook.recentList.viewList')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 bg-transparent">
        {reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-10 mt-10">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400 border border-gray-200"><ClipboardList size={40} /></div>
            <p className="text-gray-900 font-bold text-xl mb-2">{t('logbook.recentList.emptyTitle')}</p>
            <p className="text-gray-500 text-sm mb-8 font-medium">{t('logbook.recentList.emptyBody')}</p>
            <button
              onClick={() => navigate('/blog/write')}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-8 py-4 rounded-full font-bold border border-blue-200 transition-all shadow-sm hover:shadow-md"
            >
              <PenTool size={18} /> {t('logbook.recentList.emptyCta')}
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Search size={40} className="mx-auto mb-4 opacity-30" /><p className="text-lg">{t('logbook.recentList.noResults', { term: searchTerm })}</p><button onClick={() => setSearchTerm('')} className="text-blue-500 text-sm mt-3 hover:text-blue-600 underline underline-offset-4 transition-colors">{t('logbook.recentList.showAll')}</button></div>
        ) : (
          <div className={viewMode === 'grid'
            ? (isCompact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-5')
            : `flex flex-col ${isCompact ? 'gap-3' : 'gap-5'}`
          }>

            {filteredReports.map((report) => {
              const editorial = isEditorialLogbook(report);
              const thumbUrl = logbookHeroImageUrl(report.images, { thumbnail: true });
              const detailPath = isPublicMode
                ? publicLogbookDetailPath(report)
                : `/blog/${report.id}`;
              const cardDate = formatLogbookDisplayDate(report);
              const cardExcerpt = resolveLogbookFeedExcerpt(report);
              const editorialPublicFeed = isPublicMode && editorial;
              const viewCount = isPublicMode ? readLogbookViewCount(report) : null;
              const readingMinutes = logbookReadingMinutes(report.content);
              const placeCount = samePlaceCount(placeCounts, report.location);

              return (
              <div
                key={report.id}
                onClick={() => navigate(detailPath)}
                className={`
                  group bg-white border rounded-2xl transition-all cursor-pointer overflow-hidden hover:shadow-md
                  ${editorial ? 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'}
                  ${viewMode === 'grid' ? 'flex flex-col h-full' : (isCompact ? 'p-3 flex gap-4 items-center' : 'p-5 flex gap-5 items-start')}
                `}
              >
                <div className={`
                  bg-gray-100 flex-shrink-0 overflow-hidden relative
                  ${
                    viewMode === 'grid'
                      ? editorialPublicFeed
                        ? 'w-full aspect-[16/10] min-h-[7.25rem] sm:min-h-[8.5rem] border-b border-indigo-100'
                        : 'w-full aspect-[16/10] border-b border-gray-200'
                      : editorialPublicFeed
                        ? isCompact
                          ? 'w-[4.25rem] h-[4.25rem] rounded-xl border border-indigo-100'
                          : 'w-28 h-28 rounded-2xl border border-indigo-100'
                        : isCompact
                          ? 'w-16 h-16 rounded-xl border border-gray-200'
                          : 'w-24 h-24 rounded-2xl border border-gray-200'
                  }
                `}>
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon size={viewMode === 'grid' ? (isCompact ? 24 : 32) : (isCompact ? 16 : 24)} />
                    </div>
                  )}
                  {report.images && report.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                      <ImageIcon size={10} /> +{report.images.length - 1}
                    </div>
                  )}
                </div>

                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? (isCompact ? 'p-3 sm:p-4 flex flex-col h-full' : 'p-4 sm:p-5 flex flex-col h-full') : ''}`}>
                  {/* 상단 메타 행: 에디터 뱃지 / 작성자 + 발행일 */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      {editorialPublicFeed ? (
                        <EditorialLogbookBadge report={report} />
                      ) : isPublicMode && report.author_label ? (
                        <span className="flex items-center gap-1 text-gray-600 font-semibold truncate" title={t('logbook.common.author')}>
                          <User size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{report.author_label}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400">
                          {t('logbook.common.traveler')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 font-medium">
                      {cardDate}
                    </span>
                  </div>

                  <div className={`flex justify-between gap-2 ${isCompact && viewMode === 'list' ? 'items-center' : 'items-start mb-1.5'}`}>
                    <h4
                      title={report.title}
                      className={`font-semibold text-gray-900 transition-colors tracking-tight min-w-0 flex-1 break-keep break-words ${editorial ? 'group-hover:text-indigo-700' : 'group-hover:text-blue-600'} ${
                        viewMode === 'grid'
                          ? `line-clamp-2 leading-snug ${isCompact ? 'text-sm' : 'text-sm sm:text-base'}`
                          : viewMode === 'list' && isCompact
                            ? 'line-clamp-1 text-sm'
                            : 'line-clamp-2 text-sm sm:text-base'
                      }`}
                    >
                      {report.title}
                    </h4>
                  </div>

                  {cardExcerpt && (
                    <p
                      className={`leading-relaxed break-keep break-words ${
                        editorialPublicFeed
                          ? 'text-indigo-950/85 font-medium text-xs sm:text-[13px] line-clamp-2'
                          : 'text-gray-500 font-normal'
                      } ${
                        viewMode === 'grid'
                          ? isCompact
                            ? 'line-clamp-2 mb-3 flex-1 text-xs'
                            : 'line-clamp-2 mb-4 flex-1 text-xs sm:text-sm'
                          : isCompact
                            ? 'line-clamp-1 mt-1 text-xs'
                            : 'line-clamp-2 mt-1 text-xs sm:text-sm'
                      }`}
                    >
                      {cardExcerpt}
                    </p>
                  )}

                  {/* 하단 단일화 메타 행: 좌측 장소 / 우측 읽는 시간 및 통계 (향후 좋아요/댓글 확장 대비) */}
                  <div className={`flex items-center justify-between gap-2 text-xs text-gray-400 font-medium ${viewMode === 'list' ? (isCompact ? 'mt-1' : 'mt-3') : (isCompact ? 'mt-auto pt-2.5 border-t border-gray-100' : 'mt-auto pt-3 border-t border-gray-100')}`}>
                    <span className="flex items-center gap-1 truncate text-gray-500 shrink min-w-0" title={report.location}>
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </span>

                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                      <LogbookReadFacts
                        minutes={readingMinutes}
                        placeCount={placeCount}
                        viewCount={viewCount}
                      />
                    </div>
                  </div>

                  {isPublicMode && !editorial && (
                    <div
                      className={`flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 ${
                        viewMode === 'grid'
                          ? isCompact
                            ? 'mt-2 pt-2 border-t border-dashed border-gray-100'
                            : 'mt-2 pt-2 border-t border-dashed border-gray-100'
                          : isCompact
                            ? 'mt-1.5'
                            : 'mt-2'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gray-500">
                        출처 · GATEO
                      </span>
                      <a
                        href={GATEO_PUBLIC_SOURCE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 max-w-full truncate text-[10px] text-blue-600 hover:text-blue-700 hover:underline sm:text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {GATEO_PUBLIC_SOURCE_URL}
                      </a>
                    </div>
                  )}
                </div>

                {viewMode === 'list' && !isCompact && (
                  <div className="self-center text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1.5 transition-all hidden sm:block pr-2">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-3.5 text-center flex-shrink-0 text-xs text-gray-500 font-medium tracking-wide">
          {t('logbook.recentList.footer', { count: filteredReports.length })} {isCompact && <span className="text-gray-400 ml-1">{t('logbook.recentList.footerCompact')}</span>}
        </div>
      )}
    </div>
  );
};

export default RecentList;
