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
    { keywords: ['ESTA', '미국', '하와이', '괌', '사이판', '뉴욕', '로스앤젤레스', '샌프란시스코', '라스베가스', '시카고', '시애틀'], url: 'https://esta.cbp.dhs.gov/', label: '미국 ESTA 공식 신청' },
    { keywords: ['K-ETA', '한국', '대한민국', '서울', '제주'], url: 'https://www.k-eta.go.kr/', label: '한국 K-ETA 공식 신청' },
    { keywords: ['NZeTA', '뉴질랜드', '오클랜드', '쿡 제도', '라로통가', '퀸스타운', '크라이스트처치', '웰링턴'], url: 'https://nzeta.immigration.govt.nz/', label: '뉴질랜드 NZeTA 신청' },
    { keywords: ['eTA', '캐나다', '밴쿠버', '토론토', '몬트리올', '캘거리', '퀘벡', '옐로나이프'], url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html', label: '캐나다 eTA 신청' },
    { keywords: ['ETA', '호주', '시드니', '멜버른', '브리즈번', '퍼스', '골드코스트', '케언즈'], url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601', label: '호주 ETA 신청 앱 안내' },
    { keywords: ['SG Arrival', 'SG카드', '싱가포르', '싱가폴'], url: 'https://eservices.ica.gov.sg/sgarrivalcard/', label: '싱가포르 입국 신고서' },
    { keywords: ['MDAC', '말레이시아', '코타키나발루', '쿠알라룸푸르', '페낭', '랑카위'], url: 'https://imigresen-online.imi.gov.my/mdac/main', label: '말레이시아 MDAC 등록' },
    { keywords: ['Visit Japan', 'VJW', '일본', '도쿄', '오사카', '후쿠오카', '삿포로', '오키나와', '교토', '나고야', '홋카이도'], url: 'https://vjw-lp.digital.go.jp/ko/', label: 'Visit Japan Web (빠른 입국)' },
    { keywords: ['e-Visa', '베트남', '다낭', '나트랑', '하노이', '호치민', '푸꾸옥', '사파', '달랏', '무이네'], url: 'https://evisa.xuatnhapcanh.gov.vn/', label: '베트남 e-Visa 공식 신청' },
    { keywords: ['e-VOA', '인도네시아', '발리', '자카르타', '롬복', '길리', '족자카르타'], url: 'https://molina.imigresi.go.id/', label: '인도네시아 e-VOA 공식 신청' },
    { keywords: ['eTravel', '이트래블', '필리핀', '세부', '보라카이', '마닐라', '보홀', '팔라완', '클락'], url: 'https://etravel.gov.ph/', label: '필리핀 eTravel (필수)' },
    { keywords: ['대만', '타이완', '타이베이', '가오슝', '온라인 입국신고서', '타이중', '타이난', '화롄'], url: 'https://niaspeedy.immigration.gov.tw/webacard/', label: '대만 온라인 입국신고서' },
    { keywords: ['e-Arrival', '캄보디아', '씨엠립', '프놈펜'], url: 'https://www.arrival.gov.kh/', label: '캄보디아 e-Arrival (도착비자)' },
    { keywords: ['이집트', '카이로', '다합', '후르가다', '룩소르', '아스완'], url: 'https://www.visa2egypt.gov.eg/eVisa/', label: '이집트 e-Visa 공식 포털' },
    { keywords: ['인도', '뉴델리', '뭄바이', '바라나시', '자이푸르'], url: 'https://indianvisaonline.gov.in/evisa/', label: '인도 e-Visa 공식 신청' },
    { keywords: ['eTA', '케냐', '나이로비', '마사이마라'], url: 'https://www.etakenya.go.ke/', label: '케냐 eTA 공식 신청' },
    { keywords: ['ETIAS', '유럽', '프랑스', '이탈리아', '스페인', '독일', '스위스', '파리', '로마', '밀라노', '피렌체', '베네치아', '바르셀로나', '마드리드', '뮌헨', '프랑크푸르트', '취리히', '인터라켄', '체르마트'], url: 'https://travel-europe.europa.eu/etias_en', label: '유럽 ETIAS (시행 예정 확인)' },
    { keywords: ['스리랑카', '콜롬보', 'ETA', '캔디', '갈레'], url: 'https://eta.gov.lk/slvisa/', label: '스리랑카 ETA 공식 신청' },
    { keywords: ['탄자니아', '잔지바르', '세렝게티', '다르에스살람', '아루샤', '킬리만자로'], url: 'https://visa.immigration.go.tz/', label: '탄자니아 e-Visa 공식 신청' },
    { keywords: ['러시아', '블라디보스톡', '모스크바', '상트페테르부르크', '이르쿠츠크', '하바롭스크'], url: 'https://electronic-visa.kdmid.ru/', label: '러시아 e-Visa 공식 신청' },
    { keywords: ['볼리비아', '라파스', '우유니', '코파카바나'], url: 'https://visas.cancilleria.gob.bo/', label: '볼리비아 온라인 비자(SIV) 신청' },
    { keywords: ['KAZA', '잠비아', '짐바브웨', '빅토리아 폭포', '리빙스턴', '루사카', '하라레'], url: 'https://eservices.zambiaimmigration.gov.zm/', label: 'KAZA 유니비자 (잠비아 e-Visa)' },
    { keywords: ['요르단', '암만', '페트라', '와디 럼', '아카바', '사해'], url: 'https://jordanpass.jo/', label: '요르단 패스 (비자 면제) 공식 구매' },
    { keywords: ['세이셸', '마에', '프랄린', '라디그', 'ETA'], url: 'https://seychelles.govtas.com/', label: '세이셸 공식 ETA 신청' },
    { keywords: ['영국', '런던', '에든버러', 'ETA', '맨체스터', '코츠월드', '옥스퍼드', '스코틀랜드'], url: 'https://www.gov.uk/eta', label: '영국 UK ETA 공식 신청' },
    { keywords: ['사우디', '사우디아라비아', '리야드', '제다', '메카', '메디나'], url: 'https://visa.visitsaudi.com/', label: '사우디아라비아 e-Visa 신청' },
    { keywords: ['라오스', '비엔티안', '루앙프라방', '방비엥'], url: 'https://laoevisa.gov.la/', label: '라오스 e-Visa 공식 신청' },
    { keywords: ['네팔', '카트만두', '포카라', '안나푸르나', '히말라야', '룸비니', '에베레스트', 'EBC', '베이스캠프'], url: 'https://nepaliport.immigration.gov.np/', label: '네팔 온라인 비자 사전 작성' },
    { keywords: ['쿠바', '아바나', '바라데로', '트리니다드', '산티아고데쿠바'], url: 'https://evisacuba.cu/', label: '쿠바 e-Visa(투어리스트 카드) 신청' },
    { keywords: ['마다가스카르', '안타나나리보', '노시베', '이파티', '모론다바'], url: 'https://evisamada.gov.mg/', label: '마다가스카르 e-Visa 공식 신청' }
];

// 🆕 [Phase 8-7] 글로벌 식당 예약 서비스 매핑 (수익화 및 지역 커버리지)
export const DINING_RESERVATION_LINKS = [
    { keywords: ['일본', '도쿄', '오사카', '후쿠오카', '삿포로', '교토', '오키나와'], url: 'https://tabelog.com/ko/', name: '타베로그(Tabelog)', type: 'direct' },
    { keywords: ['유럽', '프랑스', '파리', '이탈리아', '로마', '스페인', '바르셀로나', '독일', '영국', '런던'], url: 'https://www.thefork.com/', name: 'TheFork', type: 'direct' },
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
