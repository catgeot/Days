// 🎨 [Phase 6-4] 카테고리별 색상 테마 정의
export const THEME_COLORS = {
    default: {
        bg: 'bg-white',
        border: 'border-blue-100',
        icon: 'bg-blue-50 text-blue-600',
        hover: 'hover:border-blue-200 hover:shadow-blue-100/50'
    },
    warning: {
        bg: 'bg-amber-50/30',
        border: 'border-amber-200',
        icon: 'bg-amber-100 text-amber-700',
        hover: 'hover:border-amber-300 hover:shadow-amber-100/50'
    },
    danger: {
        bg: 'bg-red-50/30',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-700',
        hover: 'hover:border-red-300 hover:shadow-red-100/50'
    }
};

// 🆕 [Phase 8-4] 검증된 공식 비자/입국 서류 URL 매핑 (AI 할루시네이션 방지용)
export const OFFICIAL_VISA_LINKS = [
    { keywords: ['ESTA', '미국', '하와이', '괌', '사이판', '뉴욕', '로스앤젤레스'], url: 'https://esta.cbp.dhs.gov/', label: '미국 ESTA 공식 신청' },
    { keywords: ['K-ETA', '한국', '대한민국', '서울', '제주'], url: 'https://www.k-eta.go.kr/', label: '한국 K-ETA 공식 신청' },
    { keywords: ['NZeTA', '뉴질랜드', '오클랜드', '쿡 제도', '라로통가'], url: 'https://nzeta.immigration.govt.nz/', label: '뉴질랜드 NZeTA 신청' },
    { keywords: ['eTA', '캐나다', '밴쿠버', '토론토'], url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html', label: '캐나다 eTA 신청' },
    { keywords: ['ETA', '호주', '시드니', '멜버른', '브리즈번'], url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601', label: '호주 ETA 신청 앱 안내' },
    { keywords: ['SG Arrival', 'SG카드', '싱가포르', '싱가폴'], url: 'https://eservices.ica.gov.sg/sgarrivalcard/', label: '싱가포르 입국 신고서' },
    { keywords: ['MDAC', '말레이시아', '코타키나발루', '쿠알라룸푸르'], url: 'https://imigresen-online.imi.gov.my/mdac/main', label: '말레이시아 MDAC 등록' },
    { keywords: ['Visit Japan', 'VJW', '일본', '도쿄', '오사카', '후쿠오카', '삿포로', '오키나와'], url: 'https://vjw-lp.digital.go.jp/ko/', label: 'Visit Japan Web (빠른 입국)' },
    { keywords: ['e-Visa', '베트남', '다낭', '나트랑', '하노이', '호치민', '푸꾸옥'], url: 'https://evisa.xuatnhapcanh.gov.vn/', label: '베트남 e-Visa 공식 신청' },
    { keywords: ['e-VOA', '인도네시아', '발리', '자카르타', '롬복', '길리'], url: 'https://molina.imigresi.go.id/', label: '인도네시아 e-VOA 공식 신청' },
    { keywords: ['eTravel', '이트래블', '필리핀', '세부', '보라카이', '마닐라', '보홀'], url: 'https://etravel.gov.ph/', label: '필리핀 eTravel (필수)' },
    { keywords: ['대만', '타이완', '타이베이', '가오슝', '온라인 입국신고서'], url: 'https://niaspeedy.immigration.gov.tw/webacard/', label: '대만 온라인 입국신고서' },
    { keywords: ['e-Arrival', '캄보디아', '씨엠립', '프놈펜'], url: 'https://www.arrival.gov.kh/', label: '캄보디아 e-Arrival (도착비자)' },
    { keywords: ['이집트', '카이로', '다합', '후르가다'], url: 'https://www.visa2egypt.gov.eg/eVisa/', label: '이집트 e-Visa 공식 포털' },
    { keywords: ['인도', '뉴델리', '뭄바이'], url: 'https://indianvisaonline.gov.in/evisa/', label: '인도 e-Visa 공식 신청' },
    { keywords: ['eTA', '케냐', '나이로비'], url: 'https://www.etakenya.go.ke/', label: '케냐 eTA 공식 신청' },
    { keywords: ['ETIAS', '유럽', '프랑스', '이탈리아', '스페인', '독일', '스위스', '영국', '런던', '파리', '로마'], url: 'https://travel-europe.europa.eu/etias_en', label: '유럽 ETIAS (시행 예정 확인)' },
    { keywords: ['스리랑카', '콜롬보', 'ETA'], url: 'https://eta.gov.lk/slvisa/', label: '스리랑카 ETA 공식 신청' }
];

// 🆕 [Phase 8-7] 글로벌 짐 보관소 지역별 매핑
export const LUGGAGE_STORAGE_LINKS = [
    { keywords: ['일본', '도쿄', '오사카', '후쿠오카', '삿포로', '교토'], name: 'ecbo cloak', url: 'https://cloak.ecbo.io/ko' },
    { keywords: ['프랑스', '파리', '이탈리아', '로마', '밀라노', '유럽', '스페인', '런던'], name: 'Radical Storage', url: 'https://radicalstorage.tp.st/PcdkpYln' },
    // default는 utils.js에서 Bounce 배너 연동으로 처리
];

// 🆕 [Phase 8-7] 글로벌 식당 예약 서비스 매핑 (수익화 및 지역 커버리지)
export const DINING_RESERVATION_LINKS = [
    { keywords: ['일본', '도쿄', '오사카', '후쿠오카', '삿포로', '교토', '오키나와'], url: 'https://tabelog.com/ko/', name: '타베로그(Tabelog)', type: 'direct' },
    { keywords: ['유럽', '프랑스', '파리', '이탈리아', '로마', '스페인', '바르셀로나', '독일', '영국', '런던'], url: 'https://www.thefork.com/search?cityId=', name: 'TheFork', type: 'query' },
];

// 🆕 [Phase 6-5] 로딩 메시지에 이모지 추가 및 카드 순서에 맞게 재배치
export const LOADING_MESSAGES_NEW = [
    "🗺️ 지도 및 명소를 가져오는 중...",
    "📄 비자 및 서류 정보를 확인하는 중...",
    "✈️ 최적의 항공권 및 직항 팁을 분석하는 중...",
    "🏨 가장 위치가 좋은 숙박 지역을 선정하는 중...",
    "📱 유심 및 공항 픽업 정보를 정리하는 중...",
    "🚇 교통 패스 및 렌터카 정보를 찾는 중...",
    "📲 국가별 필수 앱을 선별하는 중...",
    "🚨 안전 및 치안 정보를 스캔하는 중...",
    "✨ AI가 여행자 툴킷을 최종 완성하는 중..."
];

export const LOADING_MESSAGES_UPDATE = [
    "📦 기존 툴킷 정보를 불러오는 중...",
    "🔄 최신 비자 및 출입국 규정 변동을 확인하는 중...",
    "🛫 항공 및 교통 정보를 업데이트하는 중...",
    "🏠 숙박 및 편의 정보를 점검하는 중...",
    "📡 통신 및 연결 정보를 갱신하는 중...",
    "🛡️ 현지 치안 및 안전 상황을 스캔하는 중...",
    "📊 기존 데이터와 변경점을 비교하는 중...",
    "🔧 변경 사항을 반영하여 툴킷을 재조립하는 중...",
    "✅ AI가 최종 툴킷 검수를 마치는 중..."
];
