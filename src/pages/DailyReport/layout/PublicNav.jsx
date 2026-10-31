import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterPublicLogbookFeedRows } from '../../../utils/logbookPublicFeed';
import { listLogbookPlaceChips, logbookPlaceKey } from '../../../utils/logbookReadingMeta';
import { isReportsMissingColumnError } from '../../../utils/reportsSchemaFallback';

const PublicNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentLoc = searchParams.get('location');
  const activePlaceKey = logbookPlaceKey(currentLoc);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);

      const run = (columns) =>
        supabase
          .from('reports')
          .select(columns)
          .eq('is_public', true)
          .eq('is_deleted', false)
          .neq('location', null)
          .neq('location', '');

      let { data, error } = await run('location, is_editorial, status');
      if (error && isReportsMissingColumnError(error)) {
        ({ data, error } = await run('location'));
      }

      if (!error && data) {
        const rows = filterPublicLogbookFeedRows(data);
        setLocations(listLogbookPlaceChips(rows));
      } else {
        setLocations([]);
      }
      setLoading(false);
    };
    void fetchLocations();
  }, []);

  const blogPathWithParams = (mutate) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    const qs = next.toString();
    return qs ? `/blog?${qs}` : '/blog';
  };

  const handleLocationClick = (locName) => {
    const key = logbookPlaceKey(locName);
    if (activePlaceKey && activePlaceKey === key) {
      navigate(blogPathWithParams((next) => {
        next.delete('location');
      }));
    } else {
      navigate(blogPathWithParams((next) => {
        next.set('location', locName);
      }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50/50">
      <div className="space-y-1">
        <button
          onClick={() => navigate(blogPathWithParams((next) => {
            next.delete('location');
          }))}
          className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-all ${
            !activePlaceKey
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs">{t('logbook.publicNav.viewAll')}</span>
          </div>
          {!activePlaceKey && <ChevronRight size={16} className="text-blue-500" />}
        </button>

        <div className="my-4 border-t border-gray-300 dark:border-gray-600" />

        <div
          className="mb-3 box-border flex w-full max-w-full items-center justify-between gap-x-1.5 px-1.5 select-none"
          aria-hidden="true"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="text-[10px] font-normal uppercase leading-none tracking-[0.12em] text-gray-400 antialiased last:-mr-[0.12em] dark:text-gray-500"
            >
              GATEO
            </span>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : locations.length > 0 ? (
          locations.map((loc) => {
            const isSelected = activePlaceKey === logbookPlaceKey(loc.name);
            return (
              <button
                key={loc.name}
                onClick={() => handleLocationClick(loc.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <MapPin size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400 opacity-70'} />
                  <span className="text-xs truncate">{loc.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {loc.count}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">
            {t('logbook.publicNav.noPlaces')}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicNav;
