// src/lib/geocoding.js

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    // 🚨 [수정] accept-language=en 추가 (영문 주소 강제)
    // 🚨 [수정] zoom=10 (도시 단위까지만 가져오기 위해 줌 레벨 조정)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
    );
    
    if (!response.ok) throw new Error("Geocoding failed");
    
    const data = await response.json();
    
    // 데이터가 없으면 null
    if (!data.address) return null;

    // 🚨 [수정] 복잡한 주소 대신 도시/국가만 깔끔하게 추출
    const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
    const country = data.address.country || "";
    
    // 도시 이름이 없으면 국가 이름만이라도 반환
    const cleanName = city ? city : country;

    return {
      fullAddress: data.display_name, // 디버깅용
      city: cleanName,
      country: country
    };

  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};