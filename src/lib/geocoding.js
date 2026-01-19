// OpenStreetMap(Nominatim) API를 사용하여 좌표 -> 주소 변환
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    // 줌 레벨 10은 '도시' 단위까지 식별하기 적당합니다.
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=ko`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Gate0/1.0 (Project for Portfolio)' // API 사용 매너 (필수)
      }
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();

    if (data.error) {
      return null; // 바다나 주소가 없는 곳을 클릭함
    }

    // 주소 정보 정제 (도시, 국가 위주)
    const address = data.address;
    const city = address.city || address.town || address.village || address.county || address.state;
    const country = address.country;
    
    // 전체 주소 반환
    return {
      fullAddress: data.display_name,
      city: city || '알 수 없는 도시',
      country: country || '알 수 없는 국가'
    };

  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};