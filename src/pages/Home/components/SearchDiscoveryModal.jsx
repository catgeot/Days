import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Compass, Globe2, Layers, Map, ArrowUp, Users, Palmtree } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { TRIPLINK_PACKAGES } from '../data/tripLinkPackages';

// 분리된 컴포넌트 및 유틸리티 import
import { CONTINENTS, THEMES, CATEGORY_LABELS, CATEGORY_COLORS, TRIPCOM_EXPLORE_LEADING_CARD } from './SearchDiscovery/constants';
import { getDailySeed, shuffleWithSeed } from './SearchDiscovery/utils';
import SpotThumbnailCard from './SearchDiscovery/SpotThumbnailCard';
import CurationSection from './SearchDiscovery/CurationSection';
import TripLinkModal from '../../../components/PlaceCard/modals/TripLinkModal';

const RECENT_SEARCH_KEY = 'gateo_recent_search_keywords';
const RECENT_VISITED_KEY = 'gateo_recent_visited_destinations';
const RECENT_KEYWORD_VISITS_KEY = 'gateo_recent_keyword_visits';
/** 로컬 최근 검색·방문 등 최대 보관 개수 (목록이 길어도 패널 높이로 스크롤 처리) */
const MAX_RECENT_ITEMS = 30;

const safeLoadRecentList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim() !== '') : [];
  } catch {
    return [];
  }
};

const pushRecentItem = (key, value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return [];

  const nextItems = [trimmed, ...safeLoadRecentList(key).filter((item) => item !== trimmed)].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(key, JSON.stringify(nextItems));
  return nextItems;
};

const removeRecentItem = (key, value) => {
  const nextItems = safeLoadRecentList(key).filter((item) => item !== value);
  localStorage.setItem(key, JSON.stringify(nextItems));
  return nextItems;
};

const pickVisibleElementRect = (...refs) => {
  for (const ref of refs) {
    const el = ref?.current;
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= 16 && r.height >= 8) return r;
  }
  return null;
};

const safeLoadKeywordVisits = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEYWORD_VISITS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item &&
      typeof item.keyword === 'string' &&
      Array.isArray(item.destinations)
    );
  } catch {
    return [];
  }
};

const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, onSearch, initialQuery = '', isFromPlaceCard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState('theme');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentVisitedDestinations, setRecentVisitedDestinations] = useState([]);
  const [keywordVisitHistory, setKeywordVisitHistory] = useState([]);
  const [activeQuickSection, setActiveQuickSection] = useState(null);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  /** fixed 오버레이 위치 (페이지 레이아웃을 밀지 않음) */
  const [popoverLayout, setPopoverLayout] = useState(null);

  const searchBarRowRefPc = useRef(null);
  const searchBarRowRefMobile = useRef(null);
  const quickMenuRowRefPc = useRef(null);
  const quickMenuRowRefMobile = useRef(null);

  // URL Path 분석하여 상태 동기화
  useEffect(() => {
    if (!isOpen) return;

    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'explore') {
      const primaryParam = pathParts[2]; // /explore/:primaryParam
      const secondaryParam = pathParts[3]; // /explore/:primaryParam/:secondaryParam

      if (primaryParam) {
        const isContinent = CONTINENTS.some(c => c.id === primaryParam);
        const isTheme = THEMES.some(t => t.id === primaryParam);

        if (isContinent) {
          setFilterMode('continent');
          setSelectedContinent(primaryParam);
          setSelectedTheme('all');
          if (secondaryParam && THEMES.some(t => t.id === secondaryParam)) {
            setSelectedSubGroup(secondaryParam);
          } else {
            setSelectedSubGroup(null);
          }
        } else if (isTheme) {
          setFilterMode('theme');
          setSelectedTheme(primaryParam);
          setSelectedContinent('all');
          if (secondaryParam && CONTINENTS.some(c => c.id === secondaryParam)) {
            setSelectedSubGroup(secondaryParam);
          } else {
            setSelectedSubGroup(null);
          }
        }
      } else {
        // 기본 /explore 접속 시
        setSelectedContinent('all');
        setSelectedTheme('all');
        setSelectedSubGroup(null);
      }
    }
  }, [location.pathname, isOpen]);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';
  const trimmedQuery = query.trim();

  const searchGuideText = useMemo(() => {
    if (!trimmedQuery) {
      return '여행지를 몰라도 괜찮아요. 지금 감정, 분위기, 떠오르는 단어를 입력하면 AI가 어울리는 목적지를 찾아드립니다.';
    }
    if (trimmedQuery.length <= 2) {
      return '조금만 더 길게 적어보세요. 예: "멍하니 쉬고 싶다", "설레는 밤바다", "도망가고 싶은 금요일"';
    }
    return `Enter를 누르면 "${trimmedQuery}" 감정을 바탕으로 AI가 실재 여행지를 매칭하고 이유와 함께 안내합니다.`;
  }, [trimmedQuery]);

  useEffect(() => {
    if (isOpen) {
      setQuery(''); // 모달 열릴 때마다 항상 검색어 초기화
      setRecentSearches(safeLoadRecentList(RECENT_SEARCH_KEY));
      setRecentVisitedDestinations(safeLoadRecentList(RECENT_VISITED_KEY));
      setKeywordVisitHistory(safeLoadKeywordVisits());
      setActiveQuickSection(null);
      setIsSearchHistoryOpen(false);
      // 모바일 키보드 자동 올림 방지를 위해 focus() 제거
      document.body.style.overflow = 'hidden';
      setSelectedSubGroup(null);
      setSelectedPackage(null);
    } else {
      document.body.style.overflow = '';
      setFilterMode('theme');
      setSelectedContinent('all');
      setSelectedTheme('all');
      setSelectedSubGroup(null);
      setSelectedPackage(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /** 검색/섹션 확장 패널 바깥 클릭 시 닫기 (앵커·패널 내부는 유지) */
  useEffect(() => {
    if (!isOpen || (!isSearchHistoryOpen && !activeQuickSection)) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-search-popover]') || target.closest('[data-quick-section-popover]')) return;
      if (target.closest('[data-search-bar-anchor]') || target.closest('[data-quick-menu-root]')) return;
      setIsSearchHistoryOpen(false);
      setActiveQuickSection(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, isSearchHistoryOpen, activeQuickSection]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverLayout(null);
      return;
    }

    // iOS Safari: 키보드가 올라와도 window.innerHeight가 줄지 않으므로
    // visualViewport.height를 우선 사용해 popover maxHeight 계산
    const getViewportSize = () => ({
      width: window.visualViewport?.width ?? window.innerWidth,
      height: window.visualViewport?.height ?? window.innerHeight,
      offsetTop: window.visualViewport?.offsetTop ?? 0,
    });

    // anchor가 화면 밖으로 완전히 스크롤된 경우(top이 viewport 위로 사라짐)
    // popover가 화면 위쪽에 어색하게 잘려 떠 있는 것을 방지
    const isAnchorOnScreen = (rect, viewportHeight) => {
      if (!rect) return false;
      return rect.bottom > 0 && rect.top < viewportHeight;
    };

    const updateLayout = () => {
      const vp = getViewportSize();
      if (isSearchHistoryOpen && recentSearches.length > 0) {
        const r = pickVisibleElementRect(searchBarRowRefPc, searchBarRowRefMobile);
        if (!r || !isAnchorOnScreen(r, vp.height + vp.offsetTop)) {
          setIsSearchHistoryOpen(false);
          setPopoverLayout(null);
          return;
        }
        // 칩 버튼 행이 보이는 경우 popover가 칩 위를 덮지 않도록 칩 행 바닥에 anchor
        const chipRect = pickVisibleElementRect(quickMenuRowRefPc, quickMenuRowRefMobile);
        const anchorBottom = chipRect ? Math.max(r.bottom, chipRect.bottom) : r.bottom;
        const gap = 8;
        const top = anchorBottom + gap;
        const maxHeight = Math.max(160, vp.height + vp.offsetTop - top - 16);
        const left = Math.min(Math.max(8, r.left), vp.width - 24);
        const width = Math.min(r.width, vp.width - left - 8);
        setPopoverLayout({ variant: 'search', top, left, width, maxHeight });
        return;
      }

      if (activeQuickSection) {
        const r = pickVisibleElementRect(quickMenuRowRefPc, quickMenuRowRefMobile);
        if (!r || !isAnchorOnScreen(r, vp.height + vp.offsetTop)) {
          setActiveQuickSection(null);
          setPopoverLayout(null);
          return;
        }
        const gap = 8;
        const top = r.bottom + gap;
        const maxHeight = Math.max(160, vp.height + vp.offsetTop - top - 16);
        const left = Math.min(Math.max(8, r.left), vp.width - 24);
        const width = Math.min(Math.max(r.width, 280), vp.width - left - 8);
        setPopoverLayout({ variant: 'quick', top, left, width, maxHeight });
        return;
      }

      setPopoverLayout(null);
    };

    updateLayout();
    const raf = requestAnimationFrame(updateLayout);

    window.addEventListener('resize', updateLayout);
    const scrollEl = scrollContainerRef.current;
    scrollEl?.addEventListener('scroll', updateLayout, { passive: true });
    // iOS 키보드 토글/회전 시 visualViewport도 변하므로 동기화
    window.visualViewport?.addEventListener('resize', updateLayout);
    window.visualViewport?.addEventListener('scroll', updateLayout);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateLayout);
      scrollEl?.removeEventListener('scroll', updateLayout);
      window.visualViewport?.removeEventListener('resize', updateLayout);
      window.visualViewport?.removeEventListener('scroll', updateLayout);
    };
  }, [isOpen, isSearchHistoryOpen, activeQuickSection, recentSearches.length, recentVisitedDestinations.length, keywordVisitHistory.length, isSearching, query]);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    navigate('/explore'); // 필터 모드를 바꾸면 일단 전체보기로 초기화
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinentSelect = (id) => {
    if (id === 'all') {
      navigate('/explore');
    } else {
      navigate(`/explore/${id}`);
    }
  };

  const handleThemeSelect = (id) => {
    if (id === 'all') {
      navigate('/explore');
    } else {
      navigate(`/explore/${id}`);
    }
  };

  const handleSpotSelect = (spot) => {
    setRecentVisitedDestinations(pushRecentItem(RECENT_VISITED_KEY, spot?.name));
    onSelect(spot);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleSearchSubmit = async (submitQuery) => {
    const finalQuery = (submitQuery ?? query).trim();
    if (finalQuery === '' || !onSearch) return;
    setQuery(finalQuery);
    setRecentSearches(pushRecentItem(RECENT_SEARCH_KEY, finalQuery));
    setIsAILoading(true);
    try {
      await onSearch(finalQuery);
    } finally {
      setIsAILoading(false);
      setIsSearchHistoryOpen(false);
    }
  };

  const handleRemoveRecentSearch = (keyword) => {
    const next = removeRecentItem(RECENT_SEARCH_KEY, keyword);
    setRecentSearches(next);
    if (next.length === 0) setIsSearchHistoryOpen(false);
  };

  const handleRemoveRecentVisited = (destination) => {
    setRecentVisitedDestinations(removeRecentItem(RECENT_VISITED_KEY, destination));
  };

  const handleRemoveKeywordVisit = (keyword, destination = null) => {
    const nextHistory = safeLoadKeywordVisits()
      .map((entry) => {
        if (entry.keyword !== keyword) return entry;
        if (!destination) return null;
        const nextDestinations = (entry.destinations || []).filter((item) => item !== destination);
        if (nextDestinations.length === 0) return null;
        return { ...entry, destinations: nextDestinations };
      })
      .filter(Boolean)
      .slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(RECENT_KEYWORD_VISITS_KEY, JSON.stringify(nextHistory));
    setKeywordVisitHistory(nextHistory);
  };

  const filteredSpots = useMemo(() => {
    let result = TRAVEL_SPOTS;
    if (isSearching) {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(spot =>
        (spot.name || '').includes(lowerQuery) ||
        (spot.name_en || '').toLowerCase().includes(lowerQuery) ||
        (spot.country || '').includes(lowerQuery) ||
        (spot.country_en || '').toLowerCase().includes(lowerQuery) ||
        (spot.keywords && spot.keywords.some(k => k.includes(lowerQuery))) ||
        (CATEGORY_LABELS[spot.primaryCategory] || '').includes(lowerQuery)
      );
      return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
      if (filterMode === 'continent' && selectedContinent !== 'all') {
        result = result.filter(spot => spot.continent === selectedContinent);
      } else if (filterMode === 'theme' && selectedTheme !== 'all') {
        result = result.filter(spot => spot.primaryCategory === selectedTheme);
      }
      return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  }, [query, filterMode, selectedContinent, selectedTheme, isSearching]);

  // 일일 무작위 셔플이 적용된 큐레이션 데이터
  const curationData = useMemo(() => {
    if (!isCurationMode) return null;
    const seed = getDailySeed();
    const shuffled = shuffleWithSeed(filteredSpots, seed);

    // 🎯 트립링크 패키지 일일 셔플 (여행지와 동일한 seed 사용)
    const shuffledFamilyPackages = shuffleWithSeed([
      ...TRIPLINK_PACKAGES.domestic, // 제주도 포함
      ...TRIPLINK_PACKAGES.family
    ], seed);
    const shuffledLonghaulPackages = shuffleWithSeed([...TRIPLINK_PACKAGES.longhaul], seed);
    const shuffledResortPackages = shuffleWithSeed([...TRIPLINK_PACKAGES.resort], seed);

    // 테마별 우선 노출 여행지 목록 (2026-04-22: 신규 25개 여행지 반영하여 대폭 확장)
    // 가족/효도 테마: 아시아 중심, 가까운 거리, 가족 친화적 (38개)
    const familyTargets = [
      '제주', '서귀포', '오사카', '교토', '도쿄', '후쿠오카', '삿포로', '나라', '고베', '나가사키',
      '요코하마', '가나자와', '대마도', '오키나와', '다낭', '나트랑', '하노이', '푸꾸옥', '호이안',
      '방콕', '푸켓', '치앙마이', '타이베이', '가오슝', '싱가포르', '마닐라', '세부', '보라카이',
      '쿠알라룸푸르', '코타키나발루', '랑카위', '홍콩', '마카오', '상하이', '장가계', '칭다오', '청도', '베이징'
    ];

    // 장거리 테마: 유럽, 북미, 오세아니아 등 장거리 여행 (42개)
    const longhaulTargets = [
      '파리', '로마', '바르셀로나', '마드리드', '런던', '암스테르담', '베니스', '피렌체', '밀라노',
      '프라하', '부다페스트', '빈', '베를린', '뮌헨', '더블린', '에딘버러', '리스본', '포르투',
      '헬싱키', '스톡홀름', '코펜하겐', '레이캬비크', '아이슬란드', '오슬로', '바르샤바', '자그레브',
      '아테네', '산토리니', '두브로브니크', '이스탄불', '두바이', '예루살렘',
      '뉴욕', '로스앤젤레스', '샌프란시스코', '라스베가스', '시애틀', '시카고', '필라델피아', '샌디에이고',
      '시드니', '멜버른', '브리즈번', '오클랜드', '퀸스타운'
    ];

    // 휴양 테마: 해변, 리조트, 휴양지 중심 (35개)
    const resortTargets = [
      '괌', '사이판', '하와이', '호놀룰루', '마우이', '발리', '길리 메노', '롬복', '팔라완', '엘니도',
      '보라카이', '세부', '코타키나발루', '쿠알라룸푸르', '랑카위', '푸켓', '피피 섬', '코사무이', '크라비',
      '다낭', '나트랑', '푸꾸옥', '몰디브', '세이셸', '모리셔스', '잔지바르', '칸쿤', '보라보라', '피지',
      '라로통가', '사모아', '팔라우', '뉴칼레도니아', '골드코스트', '그레이트 배리어 리프'
    ];

    const getSpotsByTargets = (targets, fallbackFilter) => {
      // 🚨 [New] 타겟 배열 자체를 일일 셔플하여 매일 다른 우선순위 적용
      const shuffledTargets = shuffleWithSeed([...targets], seed);

      // 1. 셔플된 타겟 순서대로 스팟 추출 (매일 다른 여행지가 우선 노출)
      const exactMatches = [];
      shuffledTargets.forEach(t => {
        const founds = shuffled.filter(s => (s.name || '').includes(t) || (s.keywords && s.keywords.includes(t)));
        founds.forEach(found => {
          if (!exactMatches.find(m => m.id === found.id)) {
            exactMatches.push(found);
          }
        });
      });

      const matched = exactMatches;

      if (matched.length < 10) {
        // 2. 10개가 안 될 경우, 셔플된 나머지 후보군으로 채움
        const fallbacks = shuffled.filter(fallbackFilter).filter(s => !matched.find(m => m.id === s.id));
        return [...matched, ...fallbacks].slice(0, 10);
      }
      return matched.slice(0, 10);
    };

    return {
      trending: getSpotsByTargets(familyTargets, s => s.continent === 'asia' || s.continent === 'oceania'),
      city: getSpotsByTargets(longhaulTargets, s => s.continent === 'europe' || s.continent === 'americas' || s.continent === 'middle-east'),
      healing: getSpotsByTargets(resortTargets, s => s.primaryCategory === 'paradise' || s.primaryCategory === 'nature'),
      // 패키지 데이터 추가 (셔플된 배열에서 4개씩 추출)
      familyPackages: shuffledFamilyPackages.slice(0, 4),
      longhaulPackages: shuffledLonghaulPackages.slice(0, 4),
      resortPackages: shuffledResortPackages.slice(0, 4)
    };
  }, [isCurationMode, filteredSpots]);

  // 사이드바용 메뉴 그룹화
  const filterGroups = useMemo(() => {
    if (isSearching || isCurationMode) return null;

    if (filterMode === 'continent' && selectedContinent !== 'all') {
      return THEMES.filter(t => t.id !== 'all').map(t => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        spots: filteredSpots.filter(s => s.primaryCategory === t.id)
      })).filter(g => g.spots.length > 0);
    }
    if (filterMode === 'theme' && selectedTheme !== 'all') {
      return CONTINENTS.filter(c => c.id !== 'all').map(c => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        spots: filteredSpots.filter(s => s.continent === c.id)
      })).filter(g => g.spots.length > 0);
    }
    return null;
  }, [isSearching, isCurationMode, filterMode, selectedContinent, selectedTheme, filteredSpots]);

  // 서브그룹 자동 선택 (전체보기 제거로 인한 로직)
  useEffect(() => {
    if (filterGroups && filterGroups.length > 0) {
      if (!selectedSubGroup || !filterGroups.find(g => g.id === selectedSubGroup)) {
        // 모달을 열거나 탭을 변경했을 때, URL 파라미터가 없으면 첫번째 그룹의 id로 자동 리다이렉트
        const firstGroupId = filterGroups[0].id;
        const currentPrimary = filterMode === 'continent' ? selectedContinent : selectedTheme;
        if (currentPrimary !== 'all') {
           navigate(`/explore/${currentPrimary}/${firstGroupId}`, { replace: true });
        }
      }
    } else if (!filterGroups) {
      // 큐레이션 모드나 검색 모드일 때는 서브그룹 선택 해제
      if (selectedSubGroup !== null) setSelectedSubGroup(null);
    }
  }, [filterGroups, selectedSubGroup, filterMode, selectedContinent, selectedTheme, navigate]);

  const handleSubGroupSelect = (id) => {
    const currentPrimary = filterMode === 'continent' ? selectedContinent : selectedTheme;
    navigate(`/explore/${currentPrimary}/${id}`);
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;

    // Top 버튼 표시 (기존 로직)
    if (scrollTop > 300) {
      setShowTopBtn(true);
    } else {
      setShowTopBtn(false);
    }
  };

  const renderContent = () => {
    if (filteredSpots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 w-full animate-fade-in">
          <div className="relative mb-6 group cursor-pointer" onClick={handleSearchSubmit}>
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
             <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
               <Globe2 size={32} className="text-blue-400" />
             </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
             <span className="text-blue-400">'{query}'</span> AI 전 세계 탐색
          </h3>
          <p className="text-gray-400 break-keep max-w-md mx-auto text-sm md:text-base leading-relaxed">
             현재 컬렉션에 없는 키워드입니다. <br/>
             <strong className="text-gray-200">엔터(Enter) 키</strong>를 누르거나 <strong className="text-gray-200 cursor-pointer hover:text-blue-400 transition-colors" onClick={handleSearchSubmit}>위의 아이콘</strong>을 누르면, <br/>
             AI가 오타/유사 지명을 보정해 전 세계 지도를 탐색하고 최적 위치로 즉시 이동합니다.
          </p>
        </div>
      );
    }

    // 1. 큐레이션 모드 (검색어 없음, 전체 선택)
    if (isCurationMode && curationData) {
      return (
        <div className="space-y-12 pb-10 w-full pt-4">
          <CurationSection
            title="가볍고 가까운, 완벽한 가족 여행"
            subtitle="가이드와 함께하는 아시아 단거리 패키지 여행"
            icon={<div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><Users className="text-yellow-400" size={24} /></div>}
            spots={curationData.trending}
            promotedPackages={curationData.familyPackages}
            leadingPackage={TRIPCOM_EXPLORE_LEADING_CARD}
            delayClass=""
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleFilterModeChange('continent')}
            onSelectPackage={handlePackageSelect}
          />
          <CurationSection
            title="유럽 & 장거리 일주"
            subtitle="교통, 언어 걱정 없는 장거리 패키지 여행"
            icon={<div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20"><Globe2 className="text-blue-400" size={24} /></div>}
            spots={curationData.city}
            promotedPackages={curationData.longhaulPackages}
            delayClass="animation-delay-100"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleThemeSelect('urban')}
            onSelectPackage={handlePackageSelect}
          />
          <CurationSection
            title="일상의 탈출, 에어텔/올인클루시브"
            subtitle="비행기, 숙소, 픽업이 포함된 휴양 패키지 여행"
            icon={<div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Palmtree className="text-cyan-400" size={24} /></div>}
            spots={curationData.healing}
            promotedPackages={curationData.resortPackages}
            delayClass="animation-delay-200"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleThemeSelect('paradise')}
            onSelectPackage={handlePackageSelect}
          />
        </div>
      );
    }

    // 2. 교차 필터 뷰
    if (!isSearching && filterGroups) {
      const activeGroup = filterGroups.find(g => g.id === selectedSubGroup) || filterGroups[0];
      const displaySpots = activeGroup?.spots || [];
      const currentLabel = activeGroup?.label || '';

      return (
        <div className="w-full animate-fade-in-up pb-20 pt-4">
          {/* 사용자 피드백: 상단 배너 노출 보류 */}
          {/* renderDynamicBanner() */}
          <div className="block">
            {/* Result Stats */}
            <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
              <Globe2 size={16} />
              <span>{displaySpots.length}개의 여행지</span>
              <span className="text-gray-700">|</span>
              <span className="text-blue-400 font-bold">{currentLabel}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
              {displaySpots.map(spot => (
                <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 3. 검색 결과 (그리드 뷰)
    return (
      <div className="w-full pb-20 pt-4">
        {/* 사용자 피드백: 상단 배너 노출 보류 */}
        {/* renderDynamicBanner() */}
        <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
           <Search size={16} />
           <span>'{query}' 검색 결과 {filteredSpots.length}건</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
          {filteredSpots.map(spot => (
            <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
          ))}
        </div>
      </div>
    );
  };

  const headerContent = (isMobileView) => (
    <div className={`relative flex flex-col md:flex-row md:items-center gap-4 px-4 md:px-6 py-4 md:py-3 border-b border-white/[0.08] shrink-0 bg-[#0b101a]/80 backdrop-blur-md transition-all duration-300 overflow-visible z-20 ${
      isMobileView
        ? 'md:hidden'
        : 'hidden md:flex md:opacity-100'
    }`}>
      {/* 상단 닫기(홈으로) 및 모바일용 필터 토글 */}
      <div className="flex items-center justify-between md:justify-start gap-4">
        <button onClick={onClose} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors group shrink-0">
          <div className="w-12 h-12 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.1] transition-all group-hover:scale-105 shadow-lg">
            <X size={24} className="md:hidden" />
            <X size={18} className="hidden md:block" />
          </div>
          <span className="font-bold hidden md:block text-base">홈으로</span>
        </button>

        {/* 모바일 전용: 필터 토글 탭 */}
        {isMobileView && !isSearching && (
          <div className="md:hidden flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => handleFilterModeChange('theme')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500'
              }`}
            >
              <Layers size={14} /> 테마
            </button>
            <button
              onClick={() => handleFilterModeChange('continent')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500'
              }`}
            >
              <Map size={14} /> 대륙
            </button>
          </div>
        )}
      </div>

      {/* PC 전용: 필터 토글 탭 */}
      {!isMobileView && !isSearching && (
        <div className="hidden md:flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] ml-2 shrink-0">
          <button
            onClick={() => handleFilterModeChange('theme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Layers size={14} /> 테마별
          </button>
          <button
            onClick={() => handleFilterModeChange('continent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Map size={14} /> 대륙별
          </button>
        </div>
      )}

      {/* Search Bar + Guide Text */}
      <div className="flex-1 md:max-w-3xl md:ml-auto flex flex-col">
        {/* 드롭다운은 바깥에 두고, 입력 줄만 overflow-hidden (아니면 목록이 잘림) */}
        <div
          data-search-history-root="true"
          data-search-bar-anchor="true"
          className="relative w-full rounded-2xl focus-within:border-blue-400/60 focus-within:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all"
        >
          <div
            ref={isMobileView ? searchBarRowRefMobile : searchBarRowRefPc}
            onMouseDownCapture={(e) => {
              if (e.button !== 0) return;
              if (e.target instanceof Element && e.target.closest('[data-search-clear]')) return;
              if (recentSearches.length === 0) return;
              setActiveQuickSection(null);
              setIsSearchHistoryOpen((prev) => !prev);
            }}
            className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-white/[0.25] bg-white/[0.12] focus-within:bg-white/[0.15] md:h-10"
          >
            <Search size={20} className="ml-4 shrink-0 text-gray-300 md:ml-3 md:h-[18px] md:w-[18px]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim() !== '') {
                  setIsSearchHistoryOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              placeholder="예: 번아웃, 설레는 밤산책, 바람 쐬고 싶다"
              className="h-full w-full bg-transparent px-4 text-[16px] font-medium text-white outline-none placeholder-gray-500 md:px-3 md:text-base"
            />
            {query && (
              <button
                type="button"
                data-search-clear
                onClick={() => {
                  setQuery('');
                  setIsSearchHistoryOpen(false);
                  inputRef.current?.focus();
                }}
                className="p-3 text-gray-400 transition-colors hover:text-white md:p-2"
              >
                <X size={20} className="md:h-[18px] md:w-[18px]" />
              </button>
            )}
          </div>
        </div>
        {/* 드롭다운·섹션 패널 열림 시 안내문은 숨겨 한 화면에 정보가 겹치지 않게 함 */}
        {!isSearchHistoryOpen && !activeQuickSection && (
          <p className="text-xs md:text-sm text-blue-200/80 px-1 pt-1.5 leading-relaxed">
            {searchGuideText}
          </p>
        )}

        {/* 검색바 클릭 후에도 칩 버튼은 그대로 노출 (popover는 칩 행 아래로 anchor) */}
        {(recentSearches.length > 0 || recentVisitedDestinations.length > 0 || keywordVisitHistory.length > 0) && (
          <div
            data-quick-menu-root="true"
            ref={isMobileView ? quickMenuRowRefMobile : quickMenuRowRefPc}
            className="relative mt-2 px-1"
          >
            <div className="flex flex-wrap items-center gap-2">
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchHistoryOpen(false);
                    setActiveQuickSection((prev) => (prev === 'searches' ? null : 'searches'));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    activeQuickSection === 'searches'
                      ? 'border-white/[0.25] bg-white/[0.15] text-white'
                      : 'border-white/[0.12] bg-white/[0.06] text-gray-200 hover:bg-white/[0.12]'
                  }`}
                >
                  최근 검색어 {recentSearches.length}
                </button>
              )}
              {recentVisitedDestinations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchHistoryOpen(false);
                    setActiveQuickSection((prev) => (prev === 'visited' ? null : 'visited'));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    activeQuickSection === 'visited'
                      ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
                      : 'border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                  }`}
                >
                  최근 방문지 {recentVisitedDestinations.length}
                </button>
              )}
              {keywordVisitHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchHistoryOpen(false);
                    setActiveQuickSection((prev) => (prev === 'keywordVisits' ? null : 'keywordVisits'));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    activeQuickSection === 'keywordVisits'
                      ? 'border-purple-400/40 bg-purple-500/20 text-purple-100'
                      : 'border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20'
                  }`}
                >
                  키워드 방문 기록 {keywordVisitHistory.length}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col bg-[#0b101a]/95 backdrop-blur-3xl overflow-hidden ${isFromPlaceCard ? '' : 'animate-fade-in'}`}>
      {/* 글로벌 스크롤바 상시 노출을 위한 인라인 스타일 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { display: block; height: 16px; width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 12px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.6); border-radius: 12px; border: 4px solid transparent; background-clip: padding-box; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.9); border: 3px solid transparent; background-clip: padding-box; }
        }
        .modal-scroll-area::-webkit-scrollbar { display: block; width: 12px; }
        .modal-scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-left: 1px solid rgba(255,255,255,0.08); }
        .modal-scroll-area::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.4); border-radius: 10px; border: 3px solid transparent; background-clip: padding-box; }
        .modal-scroll-area::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.7); }
      `}} />

      {/* PC 전용 Header */}
      {headerContent(false)}

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden w-full max-w-[1800px] mx-auto relative">

        {/* Left Sidebar (PC 전용 고정 스크롤 영역 - 플로팅 아일랜드 디자인 적용) */}
        {!isSearching && filterGroups && (
          <div className="hidden md:flex flex-col w-64 xl:w-[320px] shrink-0 py-6 pl-6 z-10">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl h-full flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="p-6 overflow-y-auto custom-scrollbar h-full pb-10">
                 <h3 className="text-gray-400 font-bold text-xs mb-5 pl-1 uppercase tracking-widest flex items-center gap-2">
                   <Layers size={14} className="text-blue-400"/> 세부 탐색
                 </h3>
                 <div className="space-y-2">
                   {filterGroups.map((g) => {
                     const Icon = g.icon || Compass;
                     return (
                       <button
                         key={g.id}
                         onClick={() => handleSubGroupSelect(g.id)}
                         className={`w-full shrink-0 flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                           selectedSubGroup === g.id
                             ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-x-1'
                             : 'bg-transparent border border-white/[0.1] hover:bg-white/[0.05] hover:border-white/[0.2] text-gray-300'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${selectedSubGroup === g.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.08] text-gray-400'}`}>
                             <Icon size={16} />
                           </div>
                           <span className={`text-sm font-medium ${selectedSubGroup === g.id ? 'font-bold' : ''}`}>{g.label}</span>
                         </div>
                         <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${selectedSubGroup === g.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.08] text-gray-400'}`}>
                           {g.spots.length}
                         </span>
                       </button>
                     )
                   })}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Content Area (독립 스크롤 영역) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto modal-scroll-area h-full relative"
        >
          {/* 모바일 전용 Header (스크롤 시 네이티브하게 자연스럽게 올라감) */}
          {headerContent(true)}

          <div className="p-4 md:p-8 xl:p-10 pb-32">
            {/* 2단 분류 탭 영역 */}
            {!isSearching && (
              <div className="-mx-4 px-4 md:mx-0 md:px-0 pb-4 mb-6 md:mb-8 border-b border-white/[0.05] md:border-white/[0.08]">

                <div className="flex overflow-x-auto custom-scrollbar gap-2 w-full pb-2 md:pb-0">
                  {filterMode === 'continent' ? (
                    CONTINENTS.map((cont) => {
                      const Icon = cont.icon;
                      return (
                        <button
                          key={cont.id}
                          onClick={() => handleContinentSelect(cont.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            selectedContinent === cont.id
                              ? 'bg-white/10 text-white border-white/20 font-bold'
                              : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={selectedContinent === cont.id ? 'text-white' : 'text-gray-400'} />
                          {cont.label}
                        </button>
                      )
                    })
                  ) : (
                    THEMES.map((theme) => {
                      const Icon = theme.icon;
                      const themeColors = CATEGORY_COLORS[theme.id];
                      const isSelected = selectedTheme === theme.id;

                      // 선택된 버튼: 카테고리별 고유 색상 적용
                      const selectedStyle = themeColors
                        ? themeColors
                        : 'bg-white/10 text-white border-white/20';

                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeSelect(theme.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            isSelected
                              ? `${selectedStyle} font-bold`
                              : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={isSelected && themeColors ? '' : isSelected ? 'text-white' : 'text-gray-400'} />
                          {theme.label}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* 모바일 전용 3열 탭: 세부 카테고리 (가장 눈에 띄는 화려한 메인 버튼 스타일로 부각) */}
                {filterGroups && (
                  <div className="flex md:hidden mt-3 pt-3 border-t border-white/[0.05] overflow-x-auto custom-scrollbar gap-3 w-full pb-2">
                    {filterGroups.map((g) => {
                      const Icon = g.icon || Compass;
                      return (
                        <button
                          key={g.id}
                          onClick={() => handleSubGroupSelect(g.id)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-extrabold transition-all shrink-0 ${
                            selectedSubGroup === g.id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/20 scale-105 origin-left'
                              : 'bg-white/[0.05] text-gray-300 border border-white/[0.2] hover:bg-white/[0.1] hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={selectedSubGroup === g.id ? 'text-white drop-shadow-md' : 'text-gray-400'} />
                          {g.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 메인 렌더링 영역 */}
            {renderContent()}

          </div>

          {/* Top 스크롤 버튼 */}
          <button
            onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 md:w-14 md:h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white transition-all duration-300 hover:-translate-y-1 z-50 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            aria-label="최상단으로 이동"
          >
            <ArrowUp size={24} />
          </button>
        </div>

      </div>

      {/* 검색·섹션 확장 popover: 구글처럼 본문(탐색 화면)을 가리거나 어둡게 하지 않고
          드롭다운만 띄움. 외부 클릭은 useEffect 내 handlePointerDown에서 닫음. */}

      {popoverLayout?.variant === 'search' && recentSearches.length > 0 && (
        <div
          data-search-popover
          className="fixed z-[215] flex flex-col overflow-hidden rounded-2xl border border-white/[0.16] bg-[#0f1625] backdrop-blur-xl shadow-[0_16px_44px_rgba(0,0,0,0.55)]"
          style={{
            top: popoverLayout.top,
            left: popoverLayout.left,
            width: popoverLayout.width,
            maxHeight: popoverLayout.maxHeight,
          }}
        >
          <div className="shrink-0 border-b border-white/[0.08] px-3 py-2 text-[11px] text-gray-400">최근 검색</div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2">
            <div className="space-y-1">
              {recentSearches.map((keyword) => (
                <div key={`popover-search-${keyword}`} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit(keyword)}
                    className="truncate text-left text-sm text-gray-100 transition-colors hover:text-white"
                  >
                    {keyword}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRecentSearch(keyword);
                    }}
                    className="shrink-0 text-gray-400 transition-colors hover:text-red-300"
                    aria-label={`${keyword} 삭제`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {popoverLayout?.variant === 'quick' && activeQuickSection && (
        <div
          data-quick-section-popover
          className="fixed z-[215] flex flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0f1625] backdrop-blur-xl shadow-[0_16px_44px_rgba(0,0,0,0.5)]"
          style={{
            top: popoverLayout.top,
            left: popoverLayout.left,
            width: popoverLayout.width,
            maxHeight: popoverLayout.maxHeight,
          }}
        >
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3">
            {activeQuickSection === 'searches' && (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((keyword) => (
                  <div key={`popover-quick-search-${keyword}`} className="inline-flex items-center gap-1 rounded-full border border-white/[0.16] bg-white/[0.08] py-1 pl-2.5 pr-1.5">
                    <button type="button" onClick={() => handleSearchSubmit(keyword)} className="text-xs text-gray-100 transition-colors hover:text-white">
                      {keyword}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRecentSearch(keyword);
                      }}
                      className="text-gray-400 transition-colors hover:text-red-300"
                      aria-label={`${keyword} 삭제`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeQuickSection === 'visited' && (
              <div className="flex flex-wrap gap-2">
                {recentVisitedDestinations.map((destination) => (
                  <div key={`popover-quick-visited-${destination}`} className="inline-flex items-center gap-1 rounded-full border border-blue-400/35 bg-blue-500/15 py-1 pl-2.5 pr-1.5">
                    <button type="button" onClick={() => handleSearchSubmit(destination)} className="text-xs text-blue-100 transition-colors hover:text-white">
                      {destination}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRecentVisited(destination);
                      }}
                      className="text-blue-200/80 transition-colors hover:text-red-200"
                      aria-label={`${destination} 삭제`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeQuickSection === 'keywordVisits' && (
              <div className="space-y-2">
                {keywordVisitHistory.map((entry) => (
                  <div key={`popover-quick-kw-${entry.keyword}`} className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex items-center gap-1 rounded-full border border-purple-400/35 bg-purple-500/15 py-1 pl-2.5 pr-1.5">
                      <button type="button" onClick={() => handleSearchSubmit(entry.keyword)} className="text-[11px] text-purple-100 transition-colors hover:text-white">
                        {entry.keyword}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveKeywordVisit(entry.keyword);
                        }}
                        className="text-purple-200/80 transition-colors hover:text-red-200"
                        aria-label={`${entry.keyword} 기록 삭제`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {(entry.destinations || []).slice(0, 5).map((destination) => (
                      <div key={`popover-quick-kw-d-${entry.keyword}-${destination}`} className="inline-flex items-center gap-1 rounded-full border border-white/[0.14] bg-white/[0.07] py-1 pl-2 pr-1.5">
                        <button type="button" onClick={() => handleSearchSubmit(destination)} className="text-[11px] text-gray-100 transition-colors hover:text-white">
                          {destination}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveKeywordVisit(entry.keyword, destination);
                          }}
                          className="text-gray-400 transition-colors hover:text-red-300"
                          aria-label={`${destination} 삭제`}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 검색 진행 로딩 오버레이 */}
      {isAILoading && (
        <div className="absolute inset-0 z-[300] bg-[#0b101a]/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
             <h3 className="text-xl font-bold text-white mb-2">AI가 목적지를 탐색하고 있습니다</h3>
             <p className="text-gray-400 text-sm">유사 지명 및 오타를 검증 중입니다...</p>
           </div>
        </div>
      )}

      {/* 트립링크 대화면 모달 */}
      {selectedPackage && (
        <TripLinkModal
          pkg={selectedPackage}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </div>
  );
};

export default SearchDiscoveryModal;
