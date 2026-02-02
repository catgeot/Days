// src/pages/Home/lib/geocoding.js
// 🚨 [Fix/New] API 결과를 내부 키워드로 즉시 변환하는 '통역 레이어' 추가
import { KEYWORD_SYNONYMS } from '../data/keywordData';

// 1. 내부 통역 함수: 영어/오타 -> 표준 한글 키워드 변환
const standardizeName = (rawName) => {
  if (!rawName) return "";
  const lowerName = rawName.toLowerCase().trim();
  
  // A. 동의어 사전에 등록된 단어인지 확인 (예: 'vietnam' -> '베트남')
  if (KEYWORD_SYNONYMS[lowerName]) {
    return KEYWORD_SYNONYMS[lowerName];
  }
  
  // B. 등록되지 않았다면 원본 반환 (첫 글자 대문자화 등 후처리 가능)
  return rawName;
};

// 2. 좌표 찾기 (Forward)
export const getCoordinatesFromAddress = async (query) => {
  try {
    // 🚨 [Logic] 요청 전에 '벹남'을 '베트남'으로 바꿔서 검색 확률 높임
    const cleanQuery = standardizeName(query); 

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();

    if (!data || data.length === 0) return null;

    // display_name에서 앞부분만 따옴 (예: Osaka, Japan... -> Osaka)
    let extractedName = data[0].display_name.split(',')[0];
    
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      // 결과값도 다시 한 번 표준화 시도
      name: standardizeName(extractedName) 
    };
  } catch (error) {
    console.error("Forward Geocoding error:", error);
    return null;
  }
};

// 3. 주소 찾기 (Reverse) - 지구본 클릭 시 호출됨
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    // 🚨 [핵심] accept-language=en : API에게 무조건 영어로 달라고 강제함
    // 이유: 'Vietnam'으로 받아야 우리가 가진 동의어 사전('vietnam': '베트남')과 매칭하기 쉬움
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
    );
    
    if (!response.ok) throw new Error("Geocoding failed");
    
    const data = await response.json();
    
    if (!data.address) return null;

    // 🚨 [Logic] 도시 추출 우선순위 보강 (Nominatim은 지역마다 필드명이 다름)
    const cityRaw = 
      data.address.city || 
      data.address.town || 
      data.address.village || 
      data.address.municipality || // 필리핀 등 일부 국가용
      data.address.county ||       // 일부 지역용
      data.address.state ||        // 도시가 없으면 주(State)라도 가져옴
      "";

    const countryRaw = data.address.country || "";
    
    // 🚨 [New] 여기서 통역 실행! (예: "Danang" -> "다낭")
    const cleanCity = standardizeName(cityRaw);
    const cleanCountry = standardizeName(countryRaw);
    
    // 도시 이름이 없으면 국가 이름 사용
    const finalName = cleanCity ? cleanCity : cleanCountry;

    return {
      fullAddress: data.display_name,
      city: finalName,      // 이제 "다낭" or "베트남" (한글)이 나감
      country: cleanCountry // "베트남" (한글)
    };

  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};