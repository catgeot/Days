import { Map, Globe2, Layers, Palmtree, TreePine, Building2, Landmark, Tent } from 'lucide-react';

export const CONTINENTS = [
  { id: 'all', label: '추천 여행지', icon: Globe2 },
  { id: 'asia', label: '아시아', icon: Map },
  { id: 'europe', label: '유럽', icon: Map },
  { id: 'north_america', label: '북미', icon: Map },
  { id: 'south_america', label: '남미', icon: Map },
  { id: 'oceania', label: '오세아니아', icon: Map },
  { id: 'africa', label: '아프리카', icon: Map },
  { id: 'middle_east', label: '중동', icon: Map },
  { id: 'unknown', label: '특수 지역', icon: Map },
];

export const THEMES = [
  { id: 'all', label: '에디터스 픽', icon: Layers },
  { id: 'paradise', label: '휴양', icon: Palmtree },
  { id: 'nature', label: '자연', icon: TreePine },
  { id: 'urban', label: '도심', icon: Building2 },
  { id: 'culture', label: '문화', icon: Landmark },
  { id: 'adventure', label: '모험', icon: Tent },
];

export const CATEGORY_COLORS = {
  paradise: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  nature: 'bg-green-500/20 text-green-400 border-green-500/30',
  urban: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  culture: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  adventure: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const CATEGORY_LABELS = {
  paradise: '휴양',
  nature: '자연',
  urban: '도심',
  culture: '문화',
  adventure: '모험',
};

export const CATEGORY_ICONS = {
  paradise: Palmtree,
  nature: TreePine,
  urban: Building2,
  culture: Landmark,
  adventure: Tent,
};

export const TRIPLINK_DYNAMIC_BANNERS = {
  vietnam: 'hbxakj', // 하노이/다낭/나트랑/푸꾸옥
  hokkaido: 'iosw2r', // 홋카이도/북해도
  default: 'hbxakj', // 임시로 베트남 배너를 기본으로 사용 (추후 변경 가능)
};

/** 탐색 첫 큐레이션 맨 앞 썸네일 — 트립닷컴 문구 + 제휴 링크(Unsplash 세로·호텔 톤 이미지) */
export const TRIPCOM_EXPLORE_LEADING_CARD = {
  id: 'tripcom-explore-hotel-sale',
  title: '단기 여행',
  subtitle: '호텔 최대 80% 할인',
  image:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=560&h=746&fit=crop&q=80',
  imageAlt: '호텔·리조트 풀 — Trip.com 프로모션',
  imageObjectPosition: 'center center',
  badge: '호텔 세일',
  affiliateSource: '트립닷컴',
  url: 'https://kr.trip.com/sale/w/28065/everydayescape.html?locale=ko-KR&promo_referer=3364_28065_1&Allianceid=8182427&SID=309563143&trip_sub1=%ED%83%90%EC%83%89%ED%8E%98%EC%9D%B4%EC%A7%80&trip_sub3=P16551334',
};
