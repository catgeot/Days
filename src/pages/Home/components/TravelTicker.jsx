import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane } from 'lucide-react';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay';

function formatViewCount(score, locale) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return '–';
  return score.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export default function TravelTicker({ data = [], onCityClick, isExpanded: externalExpanded, onToggle }) {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const displayName = (city) =>
    getLocalizedPlaceName(city, i18n.language) || city?.name || '';

  const metricLabel = t('home.explore.trendingMetric');

  const isControlled = externalExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isControlled ? externalExpanded : internalExpanded;

  const cities = data.length > 0 ? data : [];

  useEffect(() => {
    if (cities.length === 0) return;

    let interval;
    if (!isExpanded) {
      interval = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % cities.length);
          setFade(true);
        }, 500);
      }, 4000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isExpanded, cities.length]);

  const currentCity = cities[currentIndex] || cities[0];

  const handleMouseLeave = () => {
    if (isExpanded) {
      if (onToggle) onToggle(false);
      else setInternalExpanded(false);
    }
  };

  const handleToggle = () => {
    if (onToggle) onToggle(!isExpanded);
    else setInternalExpanded((prev) => !prev);
  };

  const handleCityClick = (e, city) => {
    e.stopPropagation();
    if (onCityClick) {
      onCityClick(city);
    }
  };

  if (!currentCity) return null;

  return (
    <div
      className={`
        bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-60 hover:bg-black/30' : 'w-48 hover:bg-black/30 cursor-pointer'}
        group
      `}
      onMouseLeave={handleMouseLeave}
      onClick={!isExpanded ? handleToggle : undefined}
    >
      <div
        className="flex justify-between items-center mb-2 border-b border-white/5 pb-2"
        onClick={isExpanded ? handleToggle : undefined}
      >
        <div className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
          <Plane size={10} className="text-blue-400" />
          {t('home.ticker.topTen')}
        </div>
        <span className="text-[8px] text-gray-500 font-medium">{metricLabel}</span>
      </div>

      {isExpanded ? (
        <div className="flex flex-col gap-1">
          {cities.map((city) => (
            <div
              key={city.rank}
              onClick={(e) => handleCityClick(e, city)}
              className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold font-mono w-4 text-center ${
                    city.rank <= 3 ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  {city.rank}
                </span>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors truncate">
                    {displayName(city)}
                  </span>
                  <span className="text-[8px] text-gray-500">{metricLabel}</span>
                </div>
              </div>

              <span className="text-xs font-medium text-gray-300 group-hover:text-white font-mono tabular-nums shrink-0">
                {formatViewCount(city.score, i18n.language)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            className={`flex justify-between items-center transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-lg font-bold text-white/40 leading-none shrink-0">
                {String(currentCity.rank).padStart(2, '0')}
              </span>

              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white/90 tracking-wide truncate">
                  {displayName(currentCity)}
                </span>
                <span className="text-[10px] text-gray-400">{metricLabel}</span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs font-medium text-white/80 font-mono tabular-nums">
                {formatViewCount(currentCity.score, i18n.language)}
              </span>
            </div>
          </div>

          <div className="w-full h-0.5 bg-white/5 mt-3 rounded-full overflow-hidden">
            <div
              key={currentIndex}
              className="h-full bg-blue-500/50 w-full animate-progress-bar origin-left"
            />
          </div>
          <style>{`
            @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            .animate-progress-bar { animation: progress 4s linear; }
          `}</style>
        </>
      )}

      {isExpanded && (
        <div className="text-[8px] text-center text-gray-600 font-mono tracking-[0.2em] border-t border-white/5 pt-2 mt-2">
          {t('home.ticker.gateSystem')}
        </div>
      )}
    </div>
  );
}
