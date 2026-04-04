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
