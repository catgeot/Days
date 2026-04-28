/* eslint-disable no-case-declarations -- switch cases use const/let; wrapping each case in blocks would be very large. */
import { getKlookAffiliateUrl, getKlookRentalUrlByLocation } from '../../../../utils/affiliate';
import { OFFICIAL_VISA_LINKS, DINING_RESERVATION_LINKS, DIRECT_FERRIES_HOME_URL } from './constants';

// 🆕 [Phase 8-3] 텍스트 정제 함수 고도화 (불필요한 기호 혼합 제거 및 리스트 통일)
export const cleanAdviceText = (text) => {
    if (!text) return text;

    return text
        // 1. 콜론 뒤에 불필요하게 붙은 혼합 특수기호만 보수적으로 제거 (예: :*•, : •)
        .replace(/:\s*\*\s*•/g, ':')
        .replace(/:\s*•\s*/g, ': ')

        // 2. 닫히지 않은 시작 ** 를 - 로 치환 (오류로 인해 한쪽만 남은 볼드체를 일반 리스트로 강등)
        // (줄의 시작에 **가 있고, 같은 줄 안에 닫는 **가 없는 경우)
        .replace(/^[ \t]*\*\*(?!(?:[^\n]*\*\*))/gm, '- ')

        // 3. 모든 리스트 시작 기호(*, •)를 '-'로 통일 (볼드체 항목 앞에도 깔끔하게 - 기호 유지)
        .replace(/^[ \t]*[•*]\s+/gm, '- ')

        // 4. 문장 끝에 잉여 특수기호 단일 개체만 제거 (볼드체 종결인 **는 안전하게 보존)
        .replace(/([^*])\*[ \t]*$/gm, '$1')
        .replace(/•[ \t]*$/gm, '')

        // 5. 백틱(`) 기호 모두 제거 (AI가 남발하는 경우 방지)
        .replace(/`/g, '')

        // 6. 과도한 줄바꿈 제거
        .replace(/\n{3,}/g, '\n\n')

        // 7. 각 줄 양끝 공백 제거
        .replace(/^\s+|\s+$/gm, '')
        .trim();
};

export const getAdviceText = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.join('\n- ');
    return data.advice || data.text || data.description || null;
};

// 툴킷 카드 제휴 링크 생성 로직
export const getMultiLinks = ({ type, data, location }) => {
    const searchQuery = location?.name || location?.country || '';
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchTarget = ((location?.name || '') + ' ' + (location?.country || '')).toLowerCase();

    const links = [];

    switch (type) {
        case 'accommodation':
            let regions = [];

            // 1. AI 큐레이션 동적 지역명 파싱 ([@명칭@] 형태에서 추출)
            if (data?.advice) {
                // advice 원본 텍스트에 cleanAdviceText를 거친 후 파싱
                const cleanedAdvice = cleanAdviceText(data.advice);
                const lines = cleanedAdvice.split('\n');

                for (const line of lines) {
                    // 부정적인 내용이 포함된 줄은 숙소 추천 검색 버튼에서 제외
                    if (line.includes('피해') || line.includes('피할') || line.includes('비추천') || line.includes('주의') || line.includes('단점')) {
                        continue;
                    }

                    // 각 줄에서 가장 첫 번째 등장하는 [@ ... @] 패턴만 추출 (과도한 버튼 생성 방지)
                    const regionRegex = /\[@([^\]@]+)@\]/;
                    const match = regionRegex.exec(line);

                    if (match) {
                        const extractedName = match[1].trim();
                        // 너무 긴 텍스트(문장 전체 매칭 등) 방지 및 중복 방지
                        if (extractedName.length <= 25 && !regions.includes(extractedName)) {
                            regions.push(extractedName);
                        }
                    }
                }

                regions.forEach(region => {
                    // 상위 여행지명(searchQuery)과 겹치지 않으면 합쳐서 검색하여 마이리얼트립 검색 결과 퀄리티 상승
                    // 예: "뮤리 해변" (region) + "라로통가" (searchQuery) => "뮤리 해변 라로통가 숙소"
                    const isOverlapping = region.includes(searchQuery) || searchQuery.includes(region);
                    const finalSearchTerm = isOverlapping ? region : `${region} ${searchQuery}`;

                    links.push({
                        isMrt: true,
                        mrtQuery: `${finalSearchTerm} 숙소`,
                        text: `[${region}] 숙박 찾기`,
                        colorClass: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                    });
                });
            }

            // 2. 일반 숙소 검색 버튼 (마이리얼트립) - 세부 지역 추천이 하나도 추출되지 않았을 때만 폴백으로 노출
            if (regions.length === 0) {
                links.push({
                    isMrt: true,
                    mrtQuery: `${searchQuery} 숙소`,
                    text: `${location?.name || '현지'} 숙소 검색`,
                    colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                });
            }

            // 3. 한인민박 검색 버튼 (마이리얼트립)
            links.push({
                isMrt: true,
                mrtQuery: `${searchQuery} 한인민박`,
                text: '한인민박 검색',
                colorClass: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            });
            break;
        case 'flight':
            // 스카이스캐너, 트립닷컴 제거 (하단의 WhiteLabelWidget 통합 검색으로 완벽히 대체됨)
            break;
        case 'connectivity':
            // 유심 카드의 제휴 버튼은 별도 Airalo 배너로 대체
            break;
        case 'transport':
            // 1. 클룩 교통/레일 패스
            const klookPassTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}%20교통%20패스`;
            links.push({
                url: getKlookAffiliateUrl(klookPassTargetUrl),
                text: `${location?.name || '현지'} 교통 패스`,
                colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            });

            // 4. 오토바이/스쿠터 대여 (BikesBooking 어필리에이트)
            links.push({
                url: `https://bikesbooking.tp.st/HymHjnL8`,
                text: '오토바이 대여',
                colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
            });

            // 5. 짐 보관 서비스 (바운스 배너로 통일)
            links.push({
                url: 'https://go.bounce.com/GATEO951904439302671',
                text: 'Bounce (글로벌 짐 보관) 찾기',
                colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
                isBanner: true,
                bannerSrc: '/278x90.png'
            });
            break;
        case 'airport_transfer':
            const klookTransferTargetUrl = `https://www.klook.com/ko/airport-transfers/`;
            const klookTransferDeepLink = getKlookAffiliateUrl(klookTransferTargetUrl);

            const klookCarRentalDeepLink = getKlookRentalUrlByLocation(location?.name);

            links.push({
                url: klookTransferDeepLink,
                text: `${location?.name || '현지'} 픽업 예약`,
                colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            });

            links.push({
                url: klookCarRentalDeepLink,
                text: '렌터카 검색',
                colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            });
            break;
        case 'ferry_booking':
            // Direct Ferries는 위젯 내부에서 배너로 처리하므로 별도 버튼 불필요
            break;
        case 'map_poi':
            links.push({
                url: `https://www.google.com/maps/search/${encodedQuery}`,
                text: '구글 맵 보기',
                colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            });

            // 1. 투어 및 액티비티 검색 (클룩 - 어트랙션/패스 강점)
            const klookTourTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}%20어트랙션`;
            links.push({
                url: getKlookAffiliateUrl(klookTourTargetUrl),
                text: '어트랙션/패스 (Klook)',
                colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
            });

            // 2. 한국어 가이드 투어 (마이리얼트립 - 워킹투어/도슨트 강점)
            links.push({
                isMrt: true,
                mrtQuery: `${searchQuery} 가이드 투어`,
                text: '한국어 가이드 투어 (MRT)',
                colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            });

            // 3. 식당 예약 플랫폼 (지역별 동적 분기 및 수익화)
            let diningUrl = `https://www.thefork.com/`; // 기본값 홈으로 변경
            let diningText = `${location?.name || '현지'} 식당 예약`;
            let isDiningMatched = false;

            for (const item of DINING_RESERVATION_LINKS) {
                if (item.keywords.some(kw => searchTarget.includes(kw.toLowerCase()))) {
                    diningUrl = item.type === 'query' ? `${item.url}${encodedQuery}` : item.url;
                    diningText = `${item.name} 식당 예약`;
                    isDiningMatched = true;
                    break;
                }
            }

            // Klook F&B (글로벌 범용/아시아 특화 수익화)
            // 타베로그나 TheFork에 매핑되지 않은 기타 지역은 범용적으로 클룩 다이닝 검색 딥링크 제공
            if (!isDiningMatched) {
                const klookDiningTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}%20레스토랑`;
                diningUrl = getKlookAffiliateUrl(klookDiningTargetUrl);
                diningText = 'Klook 레스토랑 검색';
            }

            links.push({
                url: diningUrl,
                text: diningText,
                colorClass: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            });
            break;
        case 'safety':
            // 1. 보험 추가
            links.push({
                url: `https://www.tourmoz.com/`,
                text: '해외 여행자 보험 비교',
                colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
            });

            if (data?.official_url && data.official_url !== 'null') {
                 links.push({
                    url: data.official_url,
                    text: '공식 사이트 확인',
                    colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                });
            } else {
                 links.push({
                    url: `https://www.0404.go.kr/dev/country_search.moa`,
                    text: '외교부 안전여행',
                    colorClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                });
            }
            break;
        case 'visa':
            // 1. 키워드 매칭 기반 검증된 링크 우선 탐색 (할루시네이션 방지)
            const foundOfficialLinks = [];
            // data.advice에 "한국인 무비자" 등이 포함되어 K-ETA 등으로 오인 매칭되는 것을 방지하기 위해 예외 처리 로직 추가
            const adviceTarget = (data?.advice || '').toLowerCase();

            for (const item of OFFICIAL_VISA_LINKS) {
                // K-ETA의 경우 "한국인 무비자" 텍스트로 인한 오인식 방지: 목적지가 한국일 때만 허용
                if (item.label.includes('K-ETA') && !(searchTarget.includes('한국') || searchTarget.includes('대한민국') || searchTarget.includes('서울'))) {
                    continue;
                }

                // 첫 번째 키워드를 보통 '비자 종류(ESTA, eTA)'로 간주, 나머지를 '국가/도시명'으로 간주
                const visaTypeKeyword = item.keywords[0].toLowerCase();
                const locationKeywords = item.keywords.slice(1).map(kw => kw.toLowerCase());

                // 1. 목적지 검색어(location.name 등)에 키워드 중 하나라도 매칭되는 경우 무조건 허용
                const isLocationMatched = item.keywords.some(kw => {
                    const kwLower = kw.toLowerCase();
                    if (!searchTarget.includes(kwLower)) return false;
                    // '인도' 키워드 매칭 시, '인도네시아'의 일부로 매칭된 경우 방지
                    if (kwLower === '인도' && searchTarget.includes('인도네시아')) return false;
                    return true;
                });

                // 2. advice 텍스트에 비자 종류 키워드와 해당 국가/도시 키워드가 '동시에' 존재하는지 확인 (엄격한 매칭)
                const isAdviceMatched = adviceTarget.includes(visaTypeKeyword) && locationKeywords.some(kw => {
                    const kwLower = kw.toLowerCase();
                    if (!adviceTarget.includes(kwLower)) return false;
                    // '인도' 키워드 매칭 시, '인도네시아'의 일부로 매칭된 경우 방지
                    if (kwLower === '인도' && adviceTarget.includes('인도네시아')) return false;
                    return true;
                });

                if (isLocationMatched || isAdviceMatched) {
                    foundOfficialLinks.push(item);
                }
            }

            if (foundOfficialLinks.length > 0) {
                // 중복 제거 (라벨 기준)
                const uniqueLinks = Array.from(new Map(foundOfficialLinks.map(item => [item.label, item])).values());
                uniqueLinks.forEach(item => {
                    links.push({
                        url: item.url,
                        text: item.label,
                        colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    });
                });
            } else if (data?.official_url && data.official_url !== 'null' && data.official_url.startsWith('http')) {
                // 2. 매칭된 정적 링크가 없고 AI가 반환한 URL이 유효할 때
                 links.push({
                    url: data.official_url,
                    text: '비자/입국 정보 확인',
                    colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                });
            } else {
                // 3. 둘 다 없으면 외교부 안전여행 (가장 보수적 접근)
                 links.push({
                    url: `https://www.0404.go.kr/dev/country_search.moa`,
                    text: '외교부 안전여행',
                    colorClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                });
            }
            break;
        case 'apps':
            break; // Apps don't have a default button anymore unless specified
        default:
            break;
    }

    return links;
};


