const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/pages/Home/data/citiesData.js');
let data = fs.readFileSync(targetPath, 'utf8');

const countryMap = {
  // Oceans & Continents
  '태평양': { c: '바다', ce: 'Ocean' },
  '북태평양': { c: '바다', ce: 'Ocean' },
  '남태평양': { c: '바다', ce: 'Ocean' },
  '대서양': { c: '바다', ce: 'Ocean' },
  '북대서양': { c: '바다', ce: 'Ocean' },
  '남대서양': { c: '바다', ce: 'Ocean' },
  '인도양': { c: '바다', ce: 'Ocean' },
  '북극해': { c: '바다', ce: 'Ocean' },
  '남극해': { c: '바다', ce: 'Ocean' },
  '아시아': { c: '대륙', ce: 'Continent' },
  '유럽': { c: '대륙', ce: 'Continent' },
  '아프리카': { c: '대륙', ce: 'Continent' },
  '북아메리카': { c: '대륙', ce: 'Continent' },
  '남아메리카': { c: '대륙', ce: 'Continent' },
  '오세아니아': { c: '대륙', ce: 'Continent' },
  '남극 대륙': { c: '대륙', ce: 'Continent' },

  // Hidden Gems & Oceania
  '라로통가': { c: '쿡 제도', ce: 'Cook Islands', ne: 'Rarotonga' },
  '아이투타키': { c: '쿡 제도', ce: 'Cook Islands', ne: 'Aitutaki' },
  '보라보라': { c: '프랑스령 폴리네시아', ce: 'French Polynesia', ne: 'Bora Bora' },
  '모오레아': { c: '프랑스령 폴리네시아', ce: 'French Polynesia', ne: 'Moorea' },
  '피지': { c: '피지', ce: 'Fiji' },
  '팔라우': { c: '팔라우', ce: 'Palau' },
  '바누아투': { c: '바누아투', ce: 'Vanuatu' },
  '사모아': { c: '사모아', ce: 'Samoa' },
  '통가': { c: '통가', ce: 'Tonga' },
  '뉴칼레도니아': { c: '뉴칼레도니아', ce: 'New Caledonia' },
  '솔로몬 제도': { c: '솔로몬 제도', ce: 'Solomon Islands' },
  '투발루': { c: '투발루', ce: 'Tuvalu' },
  '키리바시': { c: '키리바시', ce: 'Kiribati' },
  '미드웨이 환초': { c: '미국', ce: 'USA', ne: 'Midway Atoll' },
  '마셜 제도': { c: '마셜 제도', ce: 'Marshall Islands' },
  '갈라파고스': { c: '에콰도르', ce: 'Ecuador' },
  '이스터 섬': { c: '칠레', ce: 'Chile', ne: 'Easter Island' },
  '핏케언 제도': { c: '영국령 핏케언 제도', ce: 'Pitcairn Islands', ne: 'Pitcairn Islands' },

  // Indian Ocean & Asia
  '소코트라 섬': { c: '예멘', ce: 'Yemen', ne: 'Socotra' },
  '세이셸': { c: '세이셸', ce: 'Seychelles' },
  '잔지바르': { c: '탄자니아', ce: 'Tanzania' },
  '모리셔스': { c: '모리셔스', ce: 'Mauritius' },
  '레위니옹': { c: '프랑스령 레위니옹', ce: 'La Reunion', ne: 'La Reunion' },
  '몰디브': { c: '몰디브', ce: 'Maldives' },
  '라자암팟': { c: '인도네시아', ce: 'Indonesia' },
  '코모도 섬': { c: '인도네시아', ce: 'Indonesia', ne: 'Komodo' },
  '팔라완': { c: '필리핀', ce: 'Philippines' },
  '바간': { c: '미얀마', ce: 'Myanmar' },
  '안다만 제도': { c: '인도', ce: 'India' },
  '크리스마스 섬': { c: '호주', ce: 'Australia', ne: 'Christmas Island' },
  '디에고 가르시아': { c: '영국령 인도양 지역', ce: 'British Indian Ocean Territory' },

  // Atlantic & Europe/Americas
  '아조레스 제도': { c: '포르투갈', ce: 'Portugal', ne: 'Azores' },
  '마데이라': { c: '포르투갈', ce: 'Portugal' },
  '카나리아 제도': { c: '스페인', ce: 'Spain' },
  '카보베르데': { c: '카보베르데', ce: 'Cape Verde' },
  '페르난두 지 노로냐': { c: '브라질', ce: 'Brazil', ne: 'Fernando de Noronha' },
  '버뮤다': { c: '버뮤다', ce: 'Bermuda' },
  '로포텐 제도': { c: '노르웨이', ce: 'Norway', ne: 'Lofoten' },
  '페로 제도': { c: '페로 제도', ce: 'Faroe Islands' },
  '산토리니': { c: '그리스', ce: 'Greece' },
  '메테오라': { c: '그리스', ce: 'Greece', ne: 'Meteora' },
  '페트라': { c: '요르단', ce: 'Jordan' },
  '파타고니아': { c: '아르헨티나', ce: 'Argentina' }, // 아르헨티나/칠레 교집합이나 검색상 아르헨티나 사용
  '스발바르 제도': { c: '노르웨이', ce: 'Norway', ne: 'Svalbard' },
  '그린란드': { c: '그린란드', ce: 'Greenland' },
  '일룰리사트': { c: '그린란드', ce: 'Greenland' },
  '우수아이아': { c: '아르헨티나', ce: 'Argentina' },
  '남극점': { c: '남극', ce: 'Antarctica', ne: 'South Pole' },
  '맥머도 기지': { c: '남극', ce: 'Antarctica', ne: 'McMurdo Station' },
  '케르겔렌 제도': { c: '프랑스 남부 연방 영토', ce: 'French Southern and Antarctic Lands', ne: 'Kerguelen Islands' },
  '어센션 섬': { c: '영국령 어센션 섬', ce: 'Ascension Island' },
  '세인트 헬레나': { c: '영국령 세인트 헬레나', ce: 'St. Helena' },
  '트리스탄 다 쿠냐': { c: '영국령 트리스탄 다 쿠냐', ce: 'Tristan da Cunha' },

  // Asia
  '서울': { c: '한국', ce: 'South Korea' },
  '도쿄': { c: '일본', ce: 'Japan' },
  '베이징': { c: '중국', ce: 'China' },
  '상하이': { c: '중국', ce: 'China' },
  '모스크바': { c: '러시아', ce: 'Russia' },
  '노보시비르스크': { c: '러시아', ce: 'Russia' },
  '야쿠츠크': { c: '러시아', ce: 'Russia' },
  '블라디보스토크': { c: '러시아', ce: 'Russia' },
  '이르쿠츠크': { c: '러시아', ce: 'Russia' },
  '캄차카 반도': { c: '러시아', ce: 'Russia', ne: 'Kamchatka Peninsula' },
  '울란바토르': { c: '몽골', ce: 'Mongolia' },
  '아스타나': { c: '카자흐스탄', ce: 'Kazakhstan' },
  '타슈켄트': { c: '우즈베키스탄', ce: 'Uzbekistan' },
  '테헤란': { c: '이란', ce: 'Iran' },
  '뭄바이': { c: '인도', ce: 'India' },
  '뉴델리': { c: '인도', ce: 'India' },
  '방콕': { c: '태국', ce: 'Thailand' },
  '싱가포르': { c: '싱가포르', ce: 'Singapore' },
  '자카르타': { c: '인도네시아', ce: 'Indonesia' },
  '마닐라': { c: '필리핀', ce: 'Philippines' },

  // Africa & Middle East
  '카이로': { c: '이집트', ce: 'Egypt' },
  '두바이': { c: '아랍에미리트', ce: 'UAE' },
  '사하라 사막': { c: '사하라', ce: 'Sahara', ne: 'Sahara Desert' },
  '팀북투': { c: '말리', ce: 'Mali' },
  '다카르': { c: '세네갈', ce: 'Senegal' },
  '라고스': { c: '나이지리아', ce: 'Nigeria' },
  '아디스아바바': { c: '에티오피아', ce: 'Ethiopia' },
  '나이로비': { c: '케냐', ce: 'Kenya' },
  '킨샤사': { c: '콩고민주공화국', ce: 'DR Congo' },
  '케이프타운': { c: '남아프리카 공화국', ce: 'South Africa' },

  // Americas
  '뉴욕': { c: '미국', ce: 'USA' },
  '로스앤젤레스': { c: '미국', ce: 'USA' },
  '시카고': { c: '미국', ce: 'USA' },
  '밴쿠버': { c: '캐나다', ce: 'Canada' },
  '알래스카': { c: '미국', ce: 'USA' },
  '멕시코시티': { c: '멕시코', ce: 'Mexico' },
  '아바나': { c: '쿠바', ce: 'Cuba' },
  '보고타': { c: '콜롬비아', ce: 'Colombia' },
  '아마존 분지': { c: '브라질', ce: 'Brazil' },
  '리마': { c: '페루', ce: 'Peru' },
  '리우데자네이루': { c: '브라질', ce: 'Brazil' },
  '산티아고': { c: '칠레', ce: 'Chile' },
  '부에노스아이레스': { c: '아르헨티나', ce: 'Argentina' },

  // Europe
  '런던': { c: '영국', ce: 'UK' },
  '파리': { c: '프랑스', ce: 'France' },
  '로마': { c: '이탈리아', ce: 'Italy' },
  '베를린': { c: '독일', ce: 'Germany' },
  '이스탄불': { c: '튀르키예', ce: 'Turkey' },
  '오슬로': { c: '노르웨이', ce: 'Norway' },
  '레이캬비크': { c: '아이슬란드', ce: 'Iceland' },

  // Oceania
  '시드니': { c: '호주', ce: 'Australia' },
  '멜버른': { c: '호주', ce: 'Australia' },
  '앨리스스프링스': { c: '호주', ce: 'Australia' },
  '퍼스': { c: '호주', ce: 'Australia' },
  '다윈': { c: '호주', ce: 'Australia' },
  '오클랜드': { c: '뉴질랜드', ce: 'New Zealand' },
  '크라이스트처치': { c: '뉴질랜드', ce: 'New Zealand' },

  // SE Asia & Oceania resort
  '발리': { c: '인도네시아', ce: 'Indonesia' },
  '길리 메노': { c: '인도네시아', ce: 'Indonesia' },
  '세부': { c: '필리핀', ce: 'Philippines' },
  '보라카이': { c: '필리핀', ce: 'Philippines' },
  '보홀': { c: '필리핀', ce: 'Philippines' },
  '다낭': { c: '베트남', ce: 'Vietnam' },
  '나트랑': { c: '베트남', ce: 'Vietnam' },
  '푸꾸옥': { c: '베트남', ce: 'Vietnam' },
  '치앙마이': { c: '태국', ce: 'Thailand' },
  '푸켓': { c: '태국', ce: 'Thailand' },
  '하와이': { c: '미국', ce: 'USA' },
  '괌': { c: '미국', ce: 'USA' },
  '사이판': { c: '미국', ce: 'USA' },
  '칸쿤': { c: '멕시코', ce: 'Mexico' },

  // Swiss & Italy/Spain
  '인터라켄': { c: '스위스', ce: 'Switzerland' },
  '취리히': { c: '스위스', ce: 'Switzerland' },
  '루체른': { c: '스위스', ce: 'Switzerland' },
  '체르마트': { c: '스위스', ce: 'Switzerland' },
  '밀라노': { c: '이탈리아', ce: 'Italy' },
  '피렌체': { c: '이탈리아', ce: 'Italy' },
  '베네치아': { c: '이탈리아', ce: 'Italy' },
  '마드리드': { c: '스페인', ce: 'Spain' },
  '바르셀로나': { c: '스페인', ce: 'Spain' },
  '세비야': { c: '스페인', ce: 'Spain' },

  // East Asia
  '제주': { c: '한국', ce: 'South Korea' },
  '부산': { c: '한국', ce: 'South Korea' },
  '오사카': { c: '일본', ce: 'Japan' },
  '후쿠오카': { c: '일본', ce: 'Japan' },
  '삿포로': { c: '일본', ce: 'Japan' },
  '오키나와': { c: '일본', ce: 'Japan' },
  '교토': { c: '일본', ce: 'Japan' },
  '타이베이': { c: '대만', ce: 'Taiwan' },
  '가오슝': { c: '대만', ce: 'Taiwan' },

  // Americas (Additional)
  '라스베이거스': { c: '미국', ce: 'USA' },
  '샌프란시스코': { c: '미국', ce: 'USA' },
  '밴프 국립공원': { c: '캐나다', ce: 'Canada', ne: 'Banff National Park' },
  '옐로나이프': { c: '캐나다', ce: 'Canada' },
  '우유니 소금사막': { c: '볼리비아', ce: 'Bolivia', ne: 'Uyuni Salt Flat' },
  '마추픽추': { c: '페루', ce: 'Peru' },

  // Europe (Additional)
  '프라하': { c: '체코', ce: 'Czech Republic' },
  '부다페스트': { c: '헝가리', ce: 'Hungary' },
  '암스테르담': { c: '네덜란드', ce: 'Netherlands' },
  '니스': { c: '프랑스', ce: 'France' },
  '그라나다': { c: '스페인', ce: 'Spain' },

  // Africa / Oceania (Additional)
  '골드코스트': { c: '호주', ce: 'Australia' },
  '퀸스타운': { c: '뉴질랜드', ce: 'New Zealand' },
  '세렝게티': { c: '탄자니아', ce: 'Tanzania', ne: 'Serengeti' },
  '마라케시': { c: '모로코', ce: 'Morocco' },
};

// 정규식 치환
const regex = /\{\s*name:\s*'([^']+)'(.*?) \}/g;

const newData = data.replace(regex, (match, name, rest) => {
  const mapped = countryMap[name];
  if (!mapped) return match; // fallback

  // Extract name_en to replace it if ne is provided
  let updatedRest = rest;
  if (mapped.ne) {
    updatedRest = updatedRest.replace(/name_en:\s*'([^']+)'/, `name_en: '${mapped.ne}'`);
  } else {
    // 만약 name_en 에 꼬리표가 있으면 삭제해버리자. (ex: , Cook Islands)
    updatedRest = updatedRest.replace(/name_en:\s*'([^']+)'/, (m, ne_val) => {
       const cleaned = ne_val.split(',')[0].trim().replace(/\s(Polynesia|greece)$/i, '');
       return `name_en: '${cleaned}'`;
    });
  }

  // Insert country and country_en after name_en
  updatedRest = updatedRest.replace(/name_en:\s*'([^']+)'/, `name_en: '$1', country: '${mapped.c}', country_en: '${mapped.ce}'`);

  return `{ name: '${name}'${updatedRest} }`;
});

fs.writeFileSync(targetPath, newData, 'utf8');
console.log('Normalized citiesData.js');
