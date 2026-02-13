// src/pages/Home/data/citiesData.js
// 🚨 [Fix/New] Ultimate Atlas Edition: Hyper-Mesh(채움) + Explorer(탐험) 통합 데이터셋 (180+ Locations)
// Priority 1: 대륙/대양 (거대 뼈대)
// Priority 2: 글로벌 거점 + 오지 등대 + 숨겨진 낙원 (네비게이션 & 탐험)

export const citiesData = [
  // =================================================================
  // 🌊 [Priority 1] 5대양 7대주 (The Grand Navigation)
  // =================================================================
  { name: 'Pacific Ocean', lat: 0.0, lng: -160.0, priority: 1 },
  { name: 'North Pacific', lat: 40.0, lng: -170.0, priority: 1 },
  { name: 'South Pacific', lat: -40.0, lng: -130.0, priority: 1 },
  { name: 'Atlantic Ocean', lat: 10.0, lng: -30.0, priority: 1 },
  { name: 'North Atlantic', lat: 45.0, lng: -30.0, priority: 1 },
  { name: 'South Atlantic', lat: -35.0, lng: -15.0, priority: 1 },
  { name: 'Indian Ocean', lat: -20.0, lng: 80.0, priority: 1 },
  { name: 'Arctic Ocean', lat: 85.0, lng: 0.0, priority: 1 },
  { name: 'Southern Ocean', lat: -65.0, lng: 120.0, priority: 1 },
  
  { name: 'Asia', lat: 45.0, lng: 90.0, priority: 1 },
  { name: 'Europe', lat: 50.0, lng: 20.0, priority: 1 },
  { name: 'Africa', lat: 5.0, lng: 22.0, priority: 1 },
  { name: 'North America', lat: 45.0, lng: -100.0, priority: 1 },
  { name: 'South America', lat: -15.0, lng: -60.0, priority: 1 },
  { name: 'Oceania', lat: -25.0, lng: 135.0, priority: 1 },
  { name: 'Antarctica', lat: -82.0, lng: 80.0, priority: 1 },

  // =================================================================
  // 💎 [Priority 2] The Hidden Gems (숨겨진 낙원 & 미지의 탐험)
  // =================================================================
  // 태평양
  { name: 'Rarotonga', lat: -21.2292, lng: -159.7764, priority: 2 }, // 🚨 Project Days 영감의 원천
  { name: 'Aitutaki', lat: -18.8579, lng: -159.7853, priority: 2 },
  { name: 'Bora Bora', lat: -16.5004, lng: -151.7415, priority: 2 },
  { name: 'Moorea', lat: -17.5388, lng: -149.8295, priority: 2 },
  { name: 'Fiji', lat: -17.7134, lng: 178.0650, priority: 2 },
  { name: 'Palau', lat: 7.5150, lng: 134.5825, priority: 2 },
  { name: 'Vanuatu', lat: -15.3767, lng: 166.9592, priority: 2 },
  { name: 'Samoa', lat: -13.7590, lng: -172.1046, priority: 2 },
  { name: 'Tonga', lat: -21.1790, lng: -175.1982, priority: 2 },
  { name: 'New Caledonia', lat: -20.9043, lng: 165.6180, priority: 2 },
  { name: 'Solomon Islands', lat: -9.6457, lng: 160.1562, priority: 2 },
  { name: 'Tuvalu', lat: -7.1095, lng: 177.6493, priority: 2 },
  { name: 'Kiribati', lat: 1.8709, lng: -157.3632, priority: 2 },
  { name: 'Midway Atoll', lat: 28.2072, lng: -177.3735, priority: 2 },
  { name: 'Marshall Islands', lat: 7.1315, lng: 171.1845, priority: 2 },
  { name: 'Galapagos', lat: -0.9538, lng: -90.9656, priority: 2 },
  { name: 'Easter Island', lat: -27.1127, lng: -109.3497, priority: 2 },
  { name: 'Pitcairn', lat: -25.0667, lng: -130.1000, priority: 2 },

  // 인도양 & 아시아 비경
  { name: 'Socotra', lat: 12.4634, lng: 53.8237, priority: 2 }, // 🚨 외계 행성 같은 섬 (예멘)
  { name: 'Seychelles', lat: -4.6796, lng: 55.4920, priority: 2 },
  { name: 'Zanzibar', lat: -6.1659, lng: 39.2026, priority: 2 },
  { name: 'Mauritius', lat: -20.3484, lng: 57.5522, priority: 2 },
  { name: 'Reunion', lat: -21.1151, lng: 55.5364, priority: 2 },
  { name: 'Maldives', lat: 3.2028, lng: 73.2207, priority: 2 },
  { name: 'Raja Ampat', lat: -0.2333, lng: 130.5167, priority: 2 }, // 다이버의 성지
  { name: 'Komodo', lat: -8.5569, lng: 119.4374, priority: 2 },
  { name: 'Palawan', lat: 9.8349, lng: 118.7384, priority: 2 },
  { name: 'Bagan', lat: 21.1717, lng: 94.8585, priority: 2 },
  { name: 'Andaman Islands', lat: 11.7401, lng: 92.6586, priority: 2 },
  { name: 'Christmas Island', lat: -10.4475, lng: 105.6904, priority: 2 },
  { name: 'Diego Garcia', lat: -7.3195, lng: 72.4229, priority: 2 },

  // 대서양 & 유럽/미주 비경
  { name: 'Azores', lat: 37.7412, lng: -25.6756, priority: 2 },
  { name: 'Madeira', lat: 32.7607, lng: -16.9595, priority: 2 },
  { name: 'Canary Islands', lat: 28.2916, lng: -16.6291, priority: 2 },
  { name: 'Cape Verde', lat: 16.5388, lng: -23.0418, priority: 2 },
  { name: 'Fernando de Noronha', lat: -3.8577, lng: -32.4242, priority: 2 },
  { name: 'Bermuda', lat: 32.3078, lng: -64.7505, priority: 2 },
  { name: 'Lofoten', lat: 68.2086, lng: 13.5520, priority: 2 }, // 🚨 노르웨이의 절경
  { name: 'Faroe Islands', lat: 61.8926, lng: -6.9118, priority: 2 },
  { name: 'Santorini', lat: 36.3931, lng: 25.4615, priority: 2 },
  { name: 'Meteora', lat: 39.7128, lng: 21.6266, priority: 2 },
  { name: 'Petra', lat: 30.3285, lng: 35.4444, priority: 2 },
  { name: 'Salar de Uyuni', lat: -20.1338, lng: -67.4891, priority: 2 }, // 볼리비아 소금사막
  { name: 'Patagonia', lat: -41.8102, lng: -68.9063, priority: 2 },

  // 극지방 & 오지 (Frontiers)
  { name: 'Svalbard', lat: 77.8750, lng: 20.9752, priority: 2 },
  { name: 'Greenland', lat: 71.7069, lng: -42.6043, priority: 2 },
  { name: 'Ilulissat', lat: 69.2167, lng: -51.1000, priority: 2 },
  { name: 'Ushuaia', lat: -54.8019, lng: -68.3030, priority: 2 },
  { name: 'Antarctica', lat: -90.0000, lng: 0.0000, priority: 2 },
  { name: 'McMurdo Station', lat: -77.8463, lng: 166.6682, priority: 2 },
  { name: 'Kerguelen', lat: -49.3958, lng: 70.2073, priority: 2 },
  { name: 'Ascension', lat: -7.9467, lng: -14.3733, priority: 2 },
  { name: 'St. Helena', lat: -15.9650, lng: -5.7089, priority: 2 },
  { name: 'Tristan da Cunha', lat: -37.1052, lng: -12.2777, priority: 2 },

  // =================================================================
  // 🏙️ [Priority 2] The Fillers (광활한 대륙 채우기 & 글로벌 허브)
  // =================================================================
  // 유라시아 (러시아/중앙아시아/동아시아) - 빈 공간 방어
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, priority: 2 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, priority: 2 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4073, priority: 2 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, priority: 2 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, priority: 2 },
  { name: 'Novosibirsk', lat: 55.0084, lng: 82.9357, priority: 2 }, // 시베리아 중앙
  { name: 'Yakutsk', lat: 62.0355, lng: 129.6755, priority: 2 }, // 시베리아 동부
  { name: 'Vladivostok', lat: 43.1198, lng: 131.8869, priority: 2 },
  { name: 'Irkutsk', lat: 52.2870, lng: 104.3050, priority: 2 },
  { name: 'Kamchatka', lat: 56.1327, lng: 159.5314, priority: 2 }, // 화산지대
  { name: 'Ulaanbaatar', lat: 47.9200, lng: 106.9200, priority: 2 }, // 몽골
  { name: 'Astana', lat: 51.1694, lng: 71.4491, priority: 2 },
  { name: 'Tashkent', lat: 41.2995, lng: 69.2401, priority: 2 },
  { name: 'Tehran', lat: 35.6892, lng: 51.3890, priority: 2 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, priority: 2 },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, priority: 2 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, priority: 2 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, priority: 2 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, priority: 2 },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, priority: 2 },

  // 아프리카 & 중동 (사막/정글) - 빈 공간 방어
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, priority: 2 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2707, priority: 2 },
  { name: 'Sahara Desert', lat: 23.4162, lng: 25.6628, priority: 2 },
  { name: 'Timbuktu', lat: 16.7666, lng: -3.0026, priority: 2 },
  { name: 'Dakar', lat: 14.7167, lng: -17.4677, priority: 2 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, priority: 2 },
  { name: 'Addis Ababa', lat: 9.0331, lng: 38.7444, priority: 2 },
  { name: 'Nairobi', lat: -1.2864, lng: 36.8172, priority: 2 },
  { name: 'Kinshasa', lat: -4.4419, lng: 15.2663, priority: 2 }, // 중앙 아프리카
  { name: 'Cape Town', lat: -33.9248, lng: 18.4240, priority: 2 },

  // 아메리카 (북미/남미) - 빈 공간 방어
  { name: 'New York', lat: 40.7128, lng: -74.0060, priority: 2 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, priority: 2 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, priority: 2 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, priority: 2 },
  { name: 'Alaska', lat: 64.2008, lng: -149.4937, priority: 2 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, priority: 2 },
  { name: 'Havana', lat: 23.1136, lng: -82.3666, priority: 2 },
  { name: 'Bogota', lat: 4.7110, lng: -74.0721, priority: 2 },
  { name: 'Amazon Basin', lat: -3.4653, lng: -62.2159, priority: 2 }, // 거대한 녹색 지대
  { name: 'Lima', lat: -12.0464, lng: -77.0428, priority: 2 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, priority: 2 },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693, priority: 2 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, priority: 2 },

  // 유럽 (대표 거점)
  { name: 'London', lat: 51.5074, lng: -0.1278, priority: 2 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, priority: 2 },
  { name: 'Rome', lat: 41.9027, lng: 12.4963, priority: 2 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, priority: 2 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9783, priority: 2 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, priority: 2 },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, priority: 2 },

  // 오세아니아 (내륙 & 서부)
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, priority: 2 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, priority: 2 },
  { name: 'Alice Springs', lat: -23.6980, lng: 133.8807, priority: 2 }, // 호주 중앙
  { name: 'Perth', lat: -31.9505, lng: 115.8605, priority: 2 }, // 호주 서부
  { name: 'Darwin', lat: -12.4634, lng: 130.8456, priority: 2 },
  { name: 'Auckland', lat: -36.8484, lng: 174.7633, priority: 2 },
  { name: 'Christchurch', lat: -43.5321, lng: 172.6362, priority: 2 }
];