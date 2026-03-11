// src/pages/Home/lib/geocoding.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Fix] 영문 강제 변환(For Unsplash) 및 재시도(Retry) 로직 유지.
// 2. 🚨 [Fix/New] 역지오코딩(Reverse Geocoding) 로케일 강제: accept-language를 'en,ko'로 변경하여 영문명을 최우선으로 확보.
// 3. 🚨 [Fix/New] name_en 강제 추출: 라우팅에 사용할 수 있도록 응답 데이터에서 영문명을 명시적으로 파싱하여 반환 객체에 추가.

import { KEYWORD_SYNONYMS } from '../data/keywordData';

const RETRY_FILTERS = ["고원", "섬", "산", "해변", "폭포", "마을", "대륙", "반도", "시", "군", "구"];

// 1. 내부 통역 함수
const standardizeName = (rawName) => {
  if (!rawName) return "";
  // 불필요한 공백 제거 및 소문자화
  const lowerName = rawName.toLowerCase().trim();
  if (KEYWORD_SYNONYMS[lowerName]) return KEYWORD_SYNONYMS[lowerName];
  return rawName;
};

// 한국어 입력 -> 사전에서 영어 Key 찾아내기 (역추적)
const findEnglishKey = (koreanName) => {
  const entry = Object.entries(KEYWORD_SYNONYMS).find(([en, ko]) => ko === koreanName);
  return entry ? entry[0] : null;
};

// 🚨 [New] 딜레이 유틸리티 (API 차단 방지용)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. 좌표 찾기 (Forward)
export const getCoordinatesFromAddress = async (query) => {
  
  // 🚨 [Fix] Accept-Language를 'en'으로 강제하여 결과값을 영문으로 받음 (Unsplash 호환성)
  const fetchOptions = {
    headers: {
      'User-Agent': 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)', 
      'Accept-Language': 'en' 
    }
  };

  // 🚨 [New] 재시도 로직이 포함된 Fetcher
  const fetchCoords = async (searchQuery, attempt = 1) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=3&addressdetails=1`;
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        // 429(Too Many Requests)나 5xx 에러 시 재시도
        if (attempt < 3) {
          console.warn(`⚠️ Network error (${response.status}). Retrying... (${attempt}/3)`);
          await delay(1000 * attempt); // 점진적 딜레이
          return fetchCoords(searchQuery, attempt + 1);
        }
        return null;
      }

      const data = await response.json();
      return (data && data.length > 0) ? data : null;

    } catch (e) { 
      // 네트워크 끊김(ERR_INTERNET_DISCONNECTED) 등 잡기
      console.warn(`⚠️ Connection failed. Retrying... (${attempt}/3)`);
      if (attempt < 3) {
        await delay(1000 * attempt);
        return fetchCoords(searchQuery, attempt + 1);
      }
      return null; 
    }
  };

  try {
    const cleanQuery = standardizeName(query); 
    
    // 1차 패스
    let data = await fetchCoords(cleanQuery);

    // 2차 패스: 수식어 제거
    if (!data) {
      let retryQuery = cleanQuery;
      RETRY_FILTERS.forEach(filter => {
        if (retryQuery.endsWith(filter)) retryQuery = retryQuery.replace(filter, "").trim();
      });
      if (retryQuery !== cleanQuery) {
        console.log(`🔄 Pass 2: Retrying with "${retryQuery}"`);
        data = await fetchCoords(retryQuery);
      }
    }

    // 3차 패스: 사전 역추적
    if (!data) {
      const englishKey = findEnglishKey(cleanQuery);
      if (englishKey) {
        console.log(`🔄 Pass 3: Reverse Mapping found! Retrying with "${englishKey}"`);
        data = await fetchCoords(englishKey);
      }
    }

    if (!data) return null;

    const topResult = data[0];
    const address = topResult.address || {};
    
    // 🚨 [Fix] 영문 우선 추출 로직
    // Nominatim이 'en' 헤더 덕분에 영문 데이터를 주지만, 확실하게 city/town/village 등에서 가져옴
    const englishName = address.city || address.town || address.village || address.island || address.state || address.country || cleanQuery;
    const countryName = address.country || "";

    return {
      lat: parseFloat(topResult.lat),
      lng: parseFloat(topResult.lon),
      name: englishName, // 이제 여기가 "Lombok"이 됨
      country: countryName,
      country_en: countryName,
      display_name: topResult.display_name
    };
  } catch (error) {
    console.error("Forward Geocoding error:", error);
    return null;
  }
};

// 3. 주소 찾기 (Reverse)
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    // 🚨 [Fix/New] Pessimistic First: 역지오코딩 언어 타겟팅 변경
    // accept-language를 'en,ko'으로 지정하여 영문을 최우선으로 확보. (없으면 한글 Fallback)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en,ko`,
      { 
        headers: { 
          'User-Agent': 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)' 
        } 
      }
    );
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    
    // 비관적 방어: 데이터가 없거나 바다 클릭 시
    if (!data || !data.address) return null;

    const cityRaw = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.island || data.address.state || "";
    const countryRaw = data.address.country || "";
    
    return {
      fullAddress: data.display_name,
      city: standardizeName(cityRaw) || standardizeName(countryRaw),
      country: standardizeName(countryRaw),
      country_en: countryRaw,
      name_en: cityRaw || countryRaw // 🚨 [Fix/New] URL 정규화를 위한 영문명 적재
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};