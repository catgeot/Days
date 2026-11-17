/**
 * Hub attraction blurbs with no travel-spot row and no place_chat_intro row.
 * Keys are place URL slugs. Sources are official pages only.
 */
const OVERVIEWS = {
  'nang-thong-beach': {
    desc:
      '낭통 해변은 팡아주 따꾸아빠군 크억칵(Khuekkhak)의 카오락 해안입니다. 태국관광청은 고운 검은 모래가 드물어 이 해변을 ‘검은 모래 해변’으로 부르며, 검은색은 따꾸아빠 해안의 주석 광석이 파도에 밀려 쌓인 것이라고 설명합니다. 카오락 등대는 이 해변 앞 바위섬에 있고, 간조 때 모래톱이 이어져 등대까지 갈 수 있는 노을 전망 지점으로 소개됩니다. 관광청은 낭통 해변을 쇼핑·식사·밤 거리가 가까운 카오락의 중심 해안으로도 안내합니다.',
    desc_en:
      'Nang Thong Beach is on the Khao Lak shore in Khuekkhak, Takua Pa District, Phang Nga. The Tourism Authority of Thailand calls it a rare fine black-sand beach and explains that the dark color is tin ore washed up along the Takua Pa coast. The Khao Lak lighthouse stands on a rock off this beach, and at low tide a sandbar links the shore to the lighthouse, which TAT describes as a sunset viewpoint. TAT also places the beach beside Khao Lak’s main shopping, dining, and nightlife streets.',
    sources: [
      'https://thai.tourismthailand.org/Articles/amazing-phang-nga',
      'https://www.phangngapao.go.th/travel/detail/241',
      'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
    ],
  },
  'bang-sak-beach': {
    desc:
      '방삭 해변은 팡아주 따꾸아빠군 방무앙 면, 페차카셈 도로(타이무앙–따꾸아빠) 약 76–77km 근처에 있습니다. 팡아주청은 해안 도로를 따라 수풀 그늘이 있고, 고운 모래가 길게 휘어지며 물이 맑고 한적한 해변으로 소개합니다. 피크닉과 비교적 저렴한 해산물 식당이 있다고 적습니다. 태국관광청은 책을 읽거나 수영하고 산책하며 노을을 보기 좋은 한적한 해변으로 안내합니다.',
    desc_en:
      'Bang Sak Beach is in Bang Muang subdistrict, Takua Pa, Phang Nga, beside the Phetkasem road between Thai Mueang and Takua Pa around kilometers 76–77. The Phang Nga provincial office describes a quiet, long curving beach of fine sand and clear water, with casuarina shade along the beach road. It notes picnics and modestly priced seafood restaurants. The Tourism Authority of Thailand presents it as a calm place to read, swim, walk, and watch the sunset away from busier Khao Lak.',
    sources: [
      'https://www.phangngapao.go.th/travel/detail/95',
      'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
    ],
  },
  'bang-niang-market': {
    desc:
      '방니앙은 팡아주 카오락 해안의 마을 이름입니다. 태국관광청은 방니앙 해변을 숙소와 식당이 늘어선 곳으로 낭통 해변과 함께 소개합니다. 방니앙 시장의 영업일을 적은 태국관광청, 팡아주청, 태국 국립공원청 문서는 확인하지 못했습니다.',
    desc_en:
      'Bang Niang is the name of a Khao Lak coastal village in Phang Nga. The Tourism Authority of Thailand describes Bang Niang Beach, next to Nang Thong, as a shore where places to stay and restaurants have grown up. No Tourism Authority of Thailand, Phang Nga provincial, or Thai national park page found for this guide lists this market’s opening days.',
    sources: [
      'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
    ],
  },
  'ton-chong-fa-waterfall': {
    desc:
      '똔총파 폭포는 카오락–람루 국립공원 안에 있으며, 국립공원청 안내의 레인저 구역 이름이기도 합니다. 팡아주청은 서로 다른 7단으로 가파른 바위를 따라 물이 내려와 웅덩이를 이루고, 수영과 숲길, 캠핑이 가능하다고 소개합니다. 물이 많고 가장 보기 좋은 시기는 12월에서 1월이라고 적습니다. 태국관광청과 주청은 카오락에서 약 9km 거리의 산책 코스로 안내합니다.',
    desc_en:
      'Ton Chong Fa Waterfall is inside Khao Lak–Lam Ru National Park and names a park ranger unit in the Department of National Parks guide. The Phang Nga provincial office describes seven different tiers, water sliding down steep rock into pools, with swimming, forest walks, and camping. It says the falls carry the most water and look their best from December to January. The Tourism Authority of Thailand and the provincial office both describe a walk of about 9 km from Khao Lak.',
    sources: [
      'https://www.phangngapao.go.th/travel/detail/96',
      'https://portal.dnp.go.th/Content/nationalpark?contentId=992',
      'https://www.phangngapao.go.th/travel/detail/93',
      'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
    ],
  },
  'ban-nam-khem-tsunami-memorial-park': {
    desc:
      '반남켐 쓰나미 추모공원은 팡아주 따꾸아빠군 방무앙 면 반남켐 바닷가에 있습니다. 팡아주청은 2004년 쓰나미로 피해를 입은 반남켐을 기억하려고 만든 곳이라고 소개합니다. 파도를 닮은 곡선 건축과 기울어진 벽, 사망자 이름이 새겨진 황동 명판, 바닷가 정원, 해변의 큰 불상, 춤폰 왕자 동상이 있다고 적습니다. 태국관광청은 이 추모공원을, 해안에서 밀려온 경비정을 남겨 둔 다른 추모지와 구분해서 안내합니다.',
    desc_en:
      'Ban Nam Khem Tsunami Memorial Park stands on the shore at Ban Nam Khem, Bang Muang, Takua Pa, Phang Nga. The provincial office says it was built to remember the 2004 tsunami, which also struck Ban Nam Khem. It describes curved, wave-like architecture, a slanted wall with brass plaques of the names of the dead, a seaside garden, a large Buddha on the beach, and a statue of Prince Abhakara of Chumphon. The Tourism Authority of Thailand lists this park separately from another memorial where a police patrol boat was left inland.',
    sources: [
      'https://www.phangngapao.go.th/travel/detail/91',
      'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
    ],
  },
  'takua-pa-old-town': {
    desc:
      '따꾸아빠 올드타운은 주석 채굴이 번성하던 시절 중국, 인도, 아라비아와 거래하던 남부 항구 마을입니다. 태국관광청과 팡아주청은 서쪽과 동쪽이 섞인 시노포르투기즈 양식의 2층 상가, 아치형 입면과 색색의 장식을 특징으로 소개합니다. 일요일 저녁에는 스리따꾸아빠 거리에서 지역 먹거리를 파는 걷기 거리가 열리고, 관우 사당이 있습니다.',
    desc_en:
      'Takua Pa Old Town is a small southern port that traded with China, India, and Arabia during the tin-mining boom. The Tourism Authority of Thailand and the Phang Nga provincial office describe two-storey Sino-Portuguese shophouses with arched fronts and colorful decoration. On Sunday evenings a walking street opens on Sri Takua Pa Road with local food, and the provincial guide also notes the Guan Yu shrine.',
    sources: [
      'https://thai.tourismthailand.org/Articles/amazing-phang-nga',
      'https://www.phangngapao.go.th/travel/detail/89',
    ],
  },
};

export function hubAttractionOverview(slug) {
  const key = String(slug || '').trim().toLowerCase();
  return OVERVIEWS[key] || null;
}

export function listHubAttractionOverviewSlugs() {
  return Object.keys(OVERVIEWS);
}
