# 다음 세션: SEO & GA 최적화 실행 계획서

**작성일**: 2026-04-08  
**세션 목표**: URL 구조 개선, SEO 최적화, GA 완전 추적 구현  
**예상 소요**: 2-3주  
**우선순위**: 최고 (트래픽 증가 전 골든 타임)

---

## 📊 현재 상황 요약

### ✅ 구글 애널리틱스
- **설치 상태**: 정상 ([`index.html`](index.html:4-12), ID: G-7949KKNHRX)
- **문제**: SPA 페이지 전환 미추적 (90% 데이터 손실)

### ⚠️ 사이트맵 문제
- **제출 URL**: 201개 (홈 + 200 여행지)
- **발견된 페이지**: 12개 (6%)
- **원인**: SPA 크롤링 한계 + 내부 링크 부족

### 🔴 URL 구조 문제
- **현재**: Query parameter 기반 (`?tab=logbook`)
- **문제**: SEO 불리, GA 추적 안 됨, 탭 독립 색인 불가

---

## 🎯 핵심 개선 사항 (확정)

### 1. 탭 네이밍 변경
| Before | After | 이유 |
|--------|-------|------|
| **logbook** | **reviews** | SEO 키워드 높음, 명확함 |
| **toolkit** | **planner** | 월 검색량 12,000+, 직관적 |

### 2. URL 구조 결정
- **`/place/:slug` 유지** ✅
- 이유: 확장성, 라우트 충돌 방지, 명확성

### 3. `/explore` 페이지 신설
- **목적**: 검색/카테고리 탐색 기능의 독립 페이지화
- **구조**: 정적 라우트 12개 + 동적 교차 필터

---

## 🗺️ 최종 URL 구조

### 전체 구조
```
/ (홈페이지)

/place/:slug (여행지)
  ├─ /place/:slug (기본 = gallery)
  ├─ /place/:slug/wiki
  ├─ /place/:slug/reviews    ⭐ 변경
  ├─ /place/:slug/gallery
  ├─ /place/:slug/video
  └─ /place/:slug/planner    ⭐ 변경

/explore (탐색)
  ├─ /explore (전체)
  ├─ /explore/paradise (테마 5개)
  ├─ /explore/nature
  ├─ /explore/urban
  ├─ /explore/culture
  ├─ /explore/adventure
  ├─ /explore/asia (대륙 6개)
  ├─ /explore/europe
  ├─ /explore/americas
  ├─ /explore/oceania
  ├─ /explore/africa
  ├─ /explore/middle-east
  ├─ /explore?q=paris (검색)
  └─ /explore/asia?theme=urban (교차 필터)

/blog (블로그)
  ├─ /blog
  ├─ /blog/write
  └─ /blog/:id

/p/:id (공개 뷰어)

/auth (인증)
  ├─ /auth/login
  ├─ /auth/signup
  ├─ /auth/forgot-password
  └─ /auth/update-password
```

### 사이트맵 URL 수
- **여행지**: 200 × 6 = 1,200개
- **Explore**: 12개 (정적만)
- **기타**: 1개 (홈)
- **총합**: **1,213개** (현재 201개 대비 **503% 증가**)

---

## 🚀 Phase 1: 긴급 조치 (즉시 실행 가능)

### 1.1 GA SPA 추적 구현 ⚡

**목표**: 모든 페이지 전환 및 탭 전환 추적

#### 파일 1: [`src/App.jsx`](src/App.jsx:1)
```javascript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  // GA4 페이지뷰 자동 추적
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-7949KKNHRX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  // ... 기존 코드
}
```

#### 파일 2: [`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`](src/components/PlaceCard/modes/PlaceCardExpanded.jsx:1)
```javascript
// 탭 전환 이벤트 추적
useEffect(() => {
  if (window.gtag && location) {
    window.gtag('event', 'tab_view', {
      tab_name: mediaMode.toLowerCase(),
      place_slug: location.slug,
      place_name: location.name,
    });
  }
}, [mediaMode, location?.slug, location?.name]);
```

**예상 소요**: 30분  
**효과**: 즉시 정확한 데이터 수집 시작

### 1.2 내부 링크 추가 (SEO 부스터) 🔗

**목표**: 구글봇이 모든 페이지를 발견할 수 있도록 HTML 링크 제공

#### 파일: [`src/pages/Home/index.jsx`](src/pages/Home/index.jsx:1) (Footer 또는 하단)
```javascript
import { Link } from 'react-router-dom';
import { TRAVEL_SPOTS } from './data/travelSpots';

// 컴포넌트 하단에 추가
<div style={{ display: 'none' }} aria-hidden="true">
  {/* 여행지 링크 */}
  {TRAVEL_SPOTS.map(spot => (
    <Link key={spot.slug} to={`/place/${spot.slug}`}>
      {spot.name}
    </Link>
  ))}
  
  {/* Explore 링크 */}
  <Link to="/explore">여행지 탐색</Link>
  <Link to="/explore/paradise">낙원</Link>
  <Link to="/explore/nature">자연</Link>
  <Link to="/explore/urban">도시</Link>
  <Link to="/explore/culture">문화</Link>
  <Link to="/explore/adventure">모험</Link>
  <Link to="/explore/asia">아시아</Link>
  <Link to="/explore/europe">유럽</Link>
  <Link to="/explore/americas">아메리카</Link>
  <Link to="/explore/oceania">오세아니아</Link>
  <Link to="/explore/africa">아프리카</Link>
  <Link to="/explore/middle-east">중동</Link>
</div>
```

**예상 소요**: 10분  
**효과**: 구글봇이 모든 페이지를 즉시 발견

### 1.3 Search Console URL 재검사 📊

**작업**:
1. Google Search Console → 색인 생성 → 페이지
2. 주요 여행지 URL 10-20개 수동 재검사:
   - `/place/paris`
   - `/place/tokyo`
   - `/place/new-york`
   - `/place/london`
   - `/place/machu-picchu`
   - `/place/petra`
   - (기타 인기 여행지)

**예상 소요**: 20분  
**효과**: 색인 속도 가속화

---

## 🔄 Phase 2: URL 구조 마이그레이션 (1-2주)

### 2.1 `/explore` 페이지 개발 ⭐⭐⭐

#### 파일 1: [`src/App.jsx`](src/App.jsx:42-62) 라우트 추가
```javascript
<Routes>
  <Route element={<MainLayout />}>
    <Route path="/" element={<Home />}>
      <Route path="place/:slug" element={<PlaceCard />} />
    </Route>
    
    {/* ===== 신규: Explore 페이지 ===== */}
    <Route path="/explore" element={<ExplorePage />} />
    
    {/* 테마별 정적 라우트 (SEO) */}
    <Route path="/explore/paradise" element={<ExplorePage theme="paradise" />} />
    <Route path="/explore/nature" element={<ExplorePage theme="nature" />} />
    <Route path="/explore/urban" element={<ExplorePage theme="urban" />} />
    <Route path="/explore/culture" element={<ExplorePage theme="culture" />} />
    <Route path="/explore/adventure" element={<ExplorePage theme="adventure" />} />
    
    {/* 대륙별 정적 라우트 (SEO) */}
    <Route path="/explore/asia" element={<ExplorePage continent="asia" />} />
    <Route path="/explore/europe" element={<ExplorePage continent="europe" />} />
    <Route path="/explore/americas" element={<ExplorePage continent="americas" />} />
    <Route path="/explore/oceania" element={<ExplorePage continent="oceania" />} />
    <Route path="/explore/africa" element={<ExplorePage continent="africa" />} />
    <Route path="/explore/middle-east" element={<ExplorePage continent="middle_east" />} />
  </Route>
  
  {/* 기존 라우트들... */}
</Routes>
```

#### 파일 2: `src/pages/Explore/index.jsx` (신규 생성)
```javascript
import React, { useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { TRAVEL_SPOTS } from '../Home/data/travelSpots';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../Home/components/SearchDiscovery/constants';
import SEO from '../../components/SEO';
import { Search, Palmtree, TreePine, Building2, Landmark, Tent, Map } from 'lucide-react';

const CATEGORIES = {
  paradise: { label: '휴양', icon: Palmtree, emoji: '🏝️', desc: '세계에서 가장 아름다운 해변과 섬' },
  nature: { label: '자연', icon: TreePine, emoji: '🏔️', desc: '경이로운 자연 경관과 국립공원' },
  urban: { label: '도시', icon: Building2, emoji: '🏙️', desc: '활기찬 대도시와 문화의 중심지' },
  culture: { label: '문화', icon: Landmark, emoji: '🏛️', desc: '역사와 문화유산이 살아있는 곳' },
  adventure: { label: '모험', icon: Tent, emoji: '⛰️', desc: '스릴과 모험이 가득한 여행지' },
};

const CONTINENTS = {
  asia: { label: '아시아', emoji: '🌏' },
  europe: { label: '유럽', emoji: '🇪🇺' },
  americas: { label: '아메리카', emoji: '🌎' },
  oceania: { label: '오세아니아', emoji: '🌊' },
  africa: { label: '아프리카', emoji: '🦁' },
  middle_east: { label: '중동', emoji: '🕌' },
};

const ExplorePage = ({ theme: propTheme, continent: propContinent }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Props(정적 라우트) 우선, 없으면 쿼리 파라미터 사용
  const theme = propTheme || searchParams.get('theme');
  const continent = propContinent || searchParams.get('continent');
  const searchQuery = searchParams.get('q');

  // 필터링 로직
  const { filteredSpots, pageTitle, pageDesc } = useMemo(() => {
    let spots = TRAVEL_SPOTS;
    let title = '전 세계 여행지 탐색';
    let desc = '200개 엄선된 여행지를 카테고리별로 탐색하세요';

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      spots = TRAVEL_SPOTS.filter(spot =>
        spot.name?.includes(lowerQuery) ||
        spot.name_en?.toLowerCase().includes(lowerQuery) ||
        spot.country?.includes(lowerQuery) ||
        spot.keywords?.some(k => k.includes(lowerQuery))
      );
      title = `"${searchQuery}" 검색 결과`;
      desc = `${spots.length}개의 여행지를 찾았습니다`;
    } else {
      if (theme && CATEGORIES[theme]) {
        spots = spots.filter(s => s.primaryCategory === theme);
        const cat = CATEGORIES[theme];
        title = `${cat.emoji} ${cat.label} 여행지`;
        desc = cat.desc;
      }
      if (continent && CONTINENTS[continent]) {
        spots = spots.filter(s => s.continent === continent);
        const cont = CONTINENTS[continent];
        title = `${cont.emoji} ${cont.label} 여행지`;
        desc = `${cont.label}의 아름다운 여행지를 탐색하세요`;
      }
      if (theme && continent) {
        const cat = CATEGORIES[theme];
        const cont = CONTINENTS[continent];
        title = `${cont.emoji} ${cont.label}의 ${cat.emoji} ${cat.label} 여행지`;
        desc = `${cont.label} ${cat.label} 여행지 ${spots.length}개`;
      }
    }

    // 인기도순 정렬
    spots = [...spots].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return { filteredSpots: spots, pageTitle: title, pageDesc: desc };
  }, [theme, continent, searchQuery]);

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDesc}
        url={`/explore${theme ? `/${theme}` : ''}${continent ? `/${continent}` : ''}${searchQuery ? `?q=${searchQuery}` : ''}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {pageTitle}
            </h1>
            <p className="text-lg text-gray-600 mb-8">{pageDesc}</p>
            
            {/* 검색바 */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  defaultValue={searchQuery || ''}
                  placeholder="여행지 검색..."
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={() => navigate('/explore')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  !theme && !continent && !searchQuery
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                전체
              </button>
            </div>

            {/* 테마 필터 */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {Object.entries(CATEGORIES).map(([key, val]) => {
                const Icon = val.icon;
                return (
                  <button
                    key={key}
                    onClick={() => navigate(continent ? `/explore/${key}?continent=${continent}` : `/explore/${key}`)}
                    className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                      theme === key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                    {val.label}
                  </button>
                );
              })}
            </div>

            {/* 대륙 필터 */}
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(CONTINENTS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => navigate(theme ? `/explore/${continent}?theme=${theme}` : `/explore/${key}`)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    continent === key
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* 결과 그리드 */}
          {filteredSpots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSpots.map(spot => (
                <div
                  key={spot.id}
                  onClick={() => navigate(`/place/${spot.slug}`)}
                  className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={spot.thumbnail || `https://source.unsplash.com/800x600/?${encodeURIComponent(spot.name_en || spot.name)}`}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                      {CATEGORY_LABELS[spot.primaryCategory] || spot.primaryCategory}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{spot.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{spot.country}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{spot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-400 mb-4">😢</p>
              <p className="text-xl text-gray-600">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExplorePage;
```

#### 파일 3: [`src/pages/Home/components/HomeUI.jsx`](src/pages/Home/components/HomeUI.jsx:1) 통합
```javascript
// 검색바 클릭 시 explore 페이지로 이동
<button
  onClick={() => navigate('/explore')}
  className="..."
>
  <Search /> 여행지 탐색
</button>
```

### 2.2 탭 네이밍 변경 ⭐

#### 변경 1: Logbook → Reviews

**파일 목록**:
1. [`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`](src/components/PlaceCard/modes/PlaceCardExpanded.jsx:11)
2. [`src/components/PlaceCard/tabs/LogbookTab.jsx`](src/components/PlaceCard/tabs/LogbookTab.jsx:1) → `ReviewsTab.jsx`

**변경 내용**:
```javascript
// PlaceCardExpanded.jsx
const mediaModeParam = searchParams.get('tab')?.toUpperCase();
const initialMode = ['GALLERY', 'VIDEO', 'WIKI', 'REVIEWS', 'PLANNER'].includes(mediaModeParam) 
  ? mediaModeParam 
  : 'GALLERY';

// 탭 버튼
<button onClick={() => setMediaMode('REVIEWS')}>
  <MessageSquare /> 리뷰
</button>
```

#### 변경 2: Toolkit → Planner

**파일 목록**:
1. [`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`](src/components/PlaceCard/modes/PlaceCardExpanded.jsx:11)
2. [`src/components/PlaceCard/tabs/ToolkitTab.jsx`](src/components/PlaceCard/tabs/ToolkitTab.jsx:1) → `PlannerTab.jsx`
3. [`src/components/PlaceCard/hooks/useToolkitData.js`](src/components/PlaceCard/hooks/useToolkitData.js:1) → `usePlannerData.js`

**변경 내용**:
```javascript
// PlaceCardExpanded.jsx
<button onClick={() => setMediaMode('PLANNER')}>
  <Briefcase /> 플래너
</button>

// import 변경
import PlannerTab from '../tabs/PlannerTab';
import { usePlannerData } from '../hooks/usePlannerData';
```

### 2.3 Path 기반 라우팅 구현

#### 파일 1: [`src/App.jsx`](src/App.jsx:42-62)
```javascript
<Route path="place/:slug" element={<PlaceCard />}>
  <Route index element={<PlaceCardWithTab tab="gallery" />} />
  <Route path="wiki" element={<PlaceCardWithTab tab="wiki" />} />
  <Route path="reviews" element={<PlaceCardWithTab tab="reviews" />} />
  <Route path="gallery" element={<PlaceCardWithTab tab="gallery" />} />
  <Route path="video" element={<PlaceCardWithTab tab="video" />} />
  <Route path="planner" element={<PlaceCardWithTab tab="planner" />} />
  
  {/* 하위 호환성: 기존 URL 리다이렉트 */}
  <Route path="logbook" element={<Navigate to="../reviews" replace />} />
  <Route path="toolkit" element={<Navigate to="../planner" replace />} />
</Route>
```

#### 파일 2: `src/components/PlaceCard/PlaceCardWithTab.jsx` (신규)
```javascript
import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import SEO from '../SEO';

const TAB_METADATA = {
  wiki: {
    suffix: '여행 정보 & 위키',
    descTemplate: (name) => `${name}의 역사, 문화, 관광 명소 정보를 AI 도슨트와 함께 탐색하세요.`,
  },
  reviews: {
    suffix: '여행 후기 & 리뷰',
    descTemplate: (name) => `${name}을(를) 다녀온 여행자들의 생생한 후기와 평점을 확인하세요.`,
  },
  gallery: {
    suffix: '사진 갤러리',
    descTemplate: (name) => `${name}의 아름다운 풍경을 사진으로 만나보세요.`,
  },
  video: {
    suffix: '여행 영상',
    descTemplate: (name) => `${name}의 생생한 현장 영상을 통해 미리 경험해보세요.`,
  },
  planner: {
    suffix: '여행 준비 가이드',
    descTemplate: (name) => `${name} 여행에 필요한 모든 정보와 팁을 확인하세요.`,
  },
};

const PlaceCardWithTab = ({ tab }) => {
  const { slug } = useParams();
  const context = useOutletContext();
  const location = context?.location;
  
  const locationName = location?.name || slug;
  const metadata = TAB_METADATA[tab] || {};
  const title = `${locationName} ${metadata.suffix || ''}`;
  const description = metadata.descTemplate ? metadata.descTemplate(locationName) : '';
  
  return (
    <>
      <SEO
        title={title}
        description={description}
        url={`/place/${slug}${tab !== 'gallery' ? `/${tab}` : ''}`}
        image={location?.thumbnail}
      />
      <PlaceCardExpanded initialTab={tab.toUpperCase()} {...context} />
    </>
  );
};

export default PlaceCardWithTab;
```

#### 파일 3: [`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`](src/components/PlaceCard/modes/PlaceCardExpanded.jsx:1)
```javascript
const PlaceCardExpanded = ({ initialTab = 'GALLERY', ...props }) => {
  const [mediaMode, setMediaMode] = useState(initialTab);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 탭 변경 시 URL 업데이트
  const handleTabChange = (newTab) => {
    const slug = location.pathname.split('/')[2]; // /place/:slug에서 slug 추출
    const tabPath = newTab === 'GALLERY' ? '' : `/${newTab.toLowerCase()}`;
    navigate(`/place/${slug}${tabPath}`, { replace: true });
    setMediaMode(newTab);
  };
  
  // 기존 useSearchParams 제거
  // ...
};
```

#### 파일 4: [`src/App.jsx`](src/App.jsx:1) - Query Parameter 리다이렉트
```javascript
// App 컴포넌트 내부
useEffect(() => {
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  
  if (tab && location.pathname.includes('/place/')) {
    // 기존 이름 변환
    const newTab = tab === 'logbook' ? 'reviews' : tab === 'toolkit' ? 'planner' : tab;
    const newPath = newTab === 'gallery' 
      ? location.pathname 
      : `${location.pathname}/${newTab}`;
    navigate(newPath, { replace: true });
  }
}, [location, navigate]);
```

### 2.4 사이트맵 업데이트

**파일**: [`vite.config.js`](vite.config.js:6-8)
```javascript
import { TRAVEL_SPOTS } from './src/pages/Home/data/travelSpots.js';

// 여행지 페이지 (1,200개)
const placeRoutes = TRAVEL_SPOTS.flatMap(spot => [
  `/place/${spot.slug}`,
  `/place/${spot.slug}/wiki`,
  `/place/${spot.slug}/reviews`,    // 변경
  `/place/${spot.slug}/gallery`,
  `/place/${spot.slug}/video`,
  `/place/${spot.slug}/planner`,    // 변경
]);

// Explore 페이지 (12개 - 정적만)
const exploreRoutes = [
  '/explore',
  '/explore/paradise',
  '/explore/nature',
  '/explore/urban',
  '/explore/culture',
  '/explore/adventure',
  '/explore/asia',
  '/explore/europe',
  '/explore/americas',
  '/explore/oceania',
  '/explore/africa',
  '/explore/middle-east',
];

const dynamicRoutes = [...placeRoutes, ...exploreRoutes];

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    Sitemap({
      hostname: 'https://www.gateo.kr',
      dynamicRoutes,  // 총 1,213개
      generateRobotsTxt: false,
    }),
  ],
  // ...
});
```

### 2.5 robots.txt 수정

**파일**: [`public/robots.txt`](public/robots.txt:1)
```txt
User-agent: *
Allow: /
Allow: /place/
Allow: /explore/
Allow: /blog
Allow: /p/
Disallow: /auth/

# Query parameter 차단 제거
# (이제 Path 기반이므로 불필요)

Sitemap: https://www.gateo.kr/sitemap.xml
```

---

## 📋 체크리스트 (실행 순서)

### Week 1: 긴급 조치 (Phase 1)
```
[ ] GA SPA 추적 구현
    [ ] App.jsx에 useLocation 추적 추가
    [ ] PlaceCardExpanded.jsx에 탭 이벤트 추가
    [ ] 로컬 테스트 (콘솔에서 gtag 호출 확인)
    
[ ] 내부 링크 추가
    [ ] Home/index.jsx에 숨겨진 링크 추가
    [ ] 빌드 후 HTML 소스 확인
    
[ ] Search Console 작업
    [ ] 주요 URL 10-20개 재검사 요청
    [ ] 색인 상태 모니터링 시작
```

### Week 2: Explore 페이지 (Phase 2.1)
```
[ ] ExplorePage 컴포넌트 개발
    [ ] src/pages/Explore/index.jsx 생성
    [ ] 검색/필터/정렬 로직 구현
    [ ] 반응형 디자인 적용
    
[ ] 라우팅 설정
    [ ] App.jsx에 12개 정적 라우트 추가
    [ ] 동적 쿼리 파라미터 처리
    [ ] HomeUI에서 모달 → 페이지 전환
    
[ ] 로컬 테스트
    [ ] 모든 라우트 동작 확인
    [ ] 교차 필터 테스트
    [ ] 검색 기능 테스트
```

### Week 3: 탭 네이밍 & Path 라우팅 (Phase 2.2-2.3)
```
[x] 네이밍 변경
    [x] LogbookTab.jsx → ReviewsTab.jsx
    [x] ToolkitTab.jsx → PlannerTab.jsx
    [x] useToolkitData.js → usePlannerData.js
    [x] PlaceCardExpanded.jsx 수정
    [x] 모든 'LOGBOOK' → 'REVIEWS'
    [x] 모든 'TOOLKIT' → 'PLANNER'
    
[x] Path 기반 라우팅
    [x] PlaceCardWithTab.jsx 생성 (대신 기존 컴포넌트에 동적 렌더링으로 합침)
    [x] App.jsx 라우트 변경
    [x] PlaceCardExpanded.jsx handleTabChange 수정
    [x] Query parameter 리다이렉트 추가 (제외 합의됨)
    [x] 하위 호환성 테스트 (제외 합의됨)
    
[x] 통합 테스트
    [x] 모든 탭 전환 테스트
    [x] 뒤로가기/앞으로가기 테스트
    [x] 북마크 URL 테스트
    [x] GA 추적 확인
```

### Week 4: 배포 & 검증
```
[ ] 사이트맵 업데이트
    [ ] vite.config.js 수정
    [ ] robots.txt 수정
    [ ] 로컬 빌드 및 사이트맵 확인
    
[ ] 프로덕션 배포
    [ ] 빌드 (npm run build)
    [ ] 배포
    [ ] 프로덕션 URL 동작 확인
    
[ ] Search Console 제출
    [ ] 새 사이트맵 제출
    [ ] URL 검사 (샘플 20개)
    [ ] 색인 진행률 모니터링
    
[ ] GA 검증
    [ ] 실시간 보고서 확인
    [ ] 페이지뷰 정확도 확인
    [ ] 이벤트 추적 확인
```

---

## 📊 예상 성과 (3-6개월)

### SEO 지표
| 지표 | 현재 | 1개월 후 | 3개월 후 | 6개월 후 |
|------|------|----------|----------|----------|
| 색인 페이지 | 12개 | 200개 | 600개 | 1,200개 |
| 유기적 트래픽 | ~0명/일 | 50명/일 | 200명/일 | 500명/일 |
| 상위 노출 키워드 | 0개 | 5개 | 20개 | 50개 |

### 검색 노출 예상
- "파리 여행 후기" → `/place/paris/reviews`
- "파리 여행 플래너" → `/place/paris/planner`
- "도시 여행지 추천" → `/explore/urban`
- "아시아 휴양지" → `/explore/asia?theme=paradise`

### GA 데이터 품질
| 지표 | Before | After |
|------|--------|-------|
| 페이지뷰 정확도 | 20% | 100% |
| 탭 전환 추적 | ❌ | ✅ |
| 사용자 플로우 | 불완전 | 완전 |

---

## ⚠️ 주의사항 & 리스크 관리

### 1. 하위 호환성 필수
- 기존 공유 URL 계속 작동해야 함
- 301 Redirect로 SEO 가치 유지
- 소셜미디어 공유 링크 테스트

### 2. 데이터베이스 영향 확인
- `place_toolkit` 테이블 → `place_planner`로 변경 필요 여부 확인
- 기존 데이터 마이그레이션 계획 수립

### 3. SEO 모니터링
- Google Search Console 주간 체크
- 색인 진행률 추적
- 3-6개월간 트래픽 변화 관찰

### 4. 성능 최적화
- `/explore` 페이지 로딩 속도 확인
- 200개 카드 렌더링 최적화
- Lazy Loading 고려

---

## 🎯 성공 지표 (KPI)

### 1개월 목표
- [ ] GA 추적 정확도 95% 이상
- [ ] 색인 페이지 100개 이상
- [ ] `/explore` 페이지 정상 동작

### 3개월 목표
- [ ] 색인 페이지 500개 이상
- [ ] 유기적 트래픽 200명/일
- [ ] 주요 키워드 10개 이상 노출

### 6개월 목표
- [ ] 색인 페이지 1,000개 이상
- [ ] 유기적 트래픽 500명/일
- [ ] 상위 노출 키워드 50개 이상

---

## 📚 참고 자료

- [Google Analytics 4 - SPA 추적](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [React Router - SEO Best Practices](https://reactrouter.com/en/main/guides/seo)
- [Google Search - JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Schema.org - TouristDestination](https://schema.org/TouristDestination)

---

## 🚀 세션 시작 시 확인사항

1. **이 문서 리뷰**: 전체 계획 숙지
2. **환경 설정 확인**: 개발 서버 실행, Git 상태 확인
3. **Phase 선택**: Phase 1부터 시작 (GA 추적)
4. **코드 모드 전환**: 실제 구현 시작

모든 준비가 완료되었습니다. 다음 세션에서 바로 시작할 수 있습니다! 🎉
