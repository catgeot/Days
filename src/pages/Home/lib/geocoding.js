// src/pages/Home/lib/geocoding.js
// 🚨 [Fix/New] 3단계 영문 역추적(Reverse Mapping) 및 정책 헤더 추가

import { KEYWORD_SYNONYMS } from '../data/keywordData';

const RETRY_FILTERS = ["고원", "섬", "산", "해변", "폭포", "마을", "대륙", "반도"];

// 1. 내부 통역 함수
const standardizeName = (rawName) => {
  if (!rawName) return "";
  const lowerName = rawName.toLowerCase().trim();
  if (KEYWORD_SYNONYMS[lowerName]) return KEYWORD_SYNONYMS[lowerName];
  return rawName;
};

// 🚨 [New] 한국어 입력 -> 사전에서 영어 Key 찾아내기 (역추적)
const findEnglishKey = (koreanName) => {
  const entry = Object.entries(KEYWORD_SYNONYMS).find(([en, ko]) => ko === koreanName);
  return entry ? entry[0] : null;
};

// 2. 좌표 찾기 (Forward)
export const getCoordinatesFromAddress = async (query) => {
  // 🚨 [Fix] API 정책 준수를 위한 전용 헤더 설정
  const fetchOptions = {
    headers: {
      'User-Agent': 'ProjectDays/1.0 (Travel Platform Project)',
      'Accept-Language': 'ko,en'
    }
  };

  const fetchCoords = async (searchQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=3`,
        fetchOptions
      );
      if (!response.ok) return null;
      const data = await response.json();
      return (data && data.length > 0) ? data : null;
    } catch (e) { return null; }
  };

  try {
    const cleanQuery = standardizeName(query); 
    
    // 1차 패스: 정제된 쿼리 (예: "길리 메노")
    let data = await fetchCoords(cleanQuery);

    // 2차 패스: 실패 시 수식어 제거 (예: "파미르 고원" -> "파미르")
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

    // 3차 패스: 🚨 [New] 최후의 수단 - 사전 역추적 영문 검색 (예: "길리 메노" -> "gili meno")
    if (!data) {
      const englishKey = findEnglishKey(cleanQuery);
      if (englishKey) {
        console.log(`🔄 Pass 3: Reverse Mapping found! Retrying with "${englishKey}"`);
        data = await fetchCoords(englishKey);
      }
    }

    if (!data) return null;

    const topResult = data[0];
    const addressParts = topResult.display_name.split(',');
    const extractedName = addressParts[0].trim();
    const countryName = addressParts[addressParts.length - 1].trim();

    return {
      lat: parseFloat(topResult.lat),
      lng: parseFloat(topResult.lon),
      name: standardizeName(extractedName),
      country: standardizeName(countryName),
      display_name: topResult.display_name
    };
  } catch (error) {
    console.error("Forward Geocoding error:", error);
    return null;
  }
};

// 3. 주소 찾기 (Reverse) - 생략 없이 유지
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'ProjectDays/1.0' } }
    );
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    if (!data.address) return null;

    const cityRaw = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || data.address.state || "";
    const countryRaw = data.address.country || "";
    
    return {
      fullAddress: data.display_name,
      city: standardizeName(cityRaw) || standardizeName(countryRaw),
      country: standardizeName(countryRaw)
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};