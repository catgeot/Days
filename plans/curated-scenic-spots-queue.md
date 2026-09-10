# TourAPI 미등재 명소 자체 큐레이션 작업 큐

**문서 버전**: v1.0.0 (2026-09-10)  
**지침서**: [`korea-curated-spots-guide.md`](./korea-curated-spots-guide.md)  
**고정 브랜치**: `cursor/curated-scenic`  
**전체 대상**: 51건 (완료 1건 / 미흡 TODO 14건 / 보강 PARTIAL 36건)

---

## 1. 라운드별 진행 현황 요약

| 라운드 | 대상 성격 | 대상 수 | 상태 | 비고 |
|---|---|:---:|:---:|---|
| **R00** | 시범 적용 (양구 수목원) | 1 | ✅ 완료 (2026-09-10) | `yanggu-arboretum` (개요 253자, 주소, 홈피, 사진 5장) |
| **R01** | 사진 미보유(img: N) & 본문 미흡 | 14 | ⏳ **다음 세션 착수 대상** | 금강소나무숲길, 대통령기록관, 비내섬, 공주한옥마을 등 |
| **R02** | 수도권·강원·충청 사진보유 보강 | 18 | 📋 대기 | 알펜시아, 스타필드 하남, 들꽃수목원, 안산문화광장 등 |
| **R03** | 전라·경상 사진보유 보강 | 18 | 📋 대기 | 심청한옥마을, 운문사, 진해군항제, 성수산, 용궁시장 등 |

---

## 2. 라운드 상세 큐

### R00 (완료): 양구 수목원 시범 적용 ✅
- [x] `yanggu-arboretum` (양구 수목원) · 강원 yanggu · 산림청 공립수목원 제35호 · 양구9경 제1경
  - overview: 253자 (생태식물원, DMZ 야생화분재원, 대암산 자락)
  - addr1: 강원특별자치도 양구군 동면 숨골로310번길 131
  - homepage: https://www.yanggu.go.kr/arboretum/
  - galleryUrls: 한국관광공사 사진갤러리 5장 반영 완료

---

### R01 (다음 착수): 사진 미보유(TODO) 14건 큐

> **목표**: 사진이 전혀 없거나 개요가 0자인 14개 명소에 대해 공식 사진, 도로명 주소, 공식 웹사이트, 200자 내외 개요 채우기

| 번호 | ID | 명소명 | 권역/허브 | 조사 핵심 출처 | 작업 상태 |
|:---:|---|---|---|---|:---:|
| 01 | `geumgang-pine-forest-trail` | 울진 금강소나무숲길 | 경상 / uljin | 산림청 국가숲길·금강소나무생태관리센터 | [ ] 대기 |
| 02 | `binae-island` | 비내섬 | 충청 / chungju | 충주시 문화관광 (비내섬 억새·습지보호지역) | [ ] 대기 |
| 03 | `presidential-archives-sejong` | 대통령기록관 | 충청 / sejong | 행정안전부 대통령기록관 공식 (`pa.go.kr`) | [ ] 대기 |
| 04 | `dangjin-port` | 당진항 | 충청 / dangjin | 당진시 문화관광·해양수산청 | [ ] 대기 |
| 05 | `sangju-weir` | 상주보 | 경상 / sangju | 상주시 문화관광 (낙동강 7공구 수변레저) | [ ] 대기 |
| 06 | `gyeryongsan-natural-history-museum` | 계룡산 자연사박물관 | 충청 / gyeryong | 공식 사이트 (`krnamu.or.kr`) | [ ] 대기 |
| 07 | `geumwang-hot-springs` | 금왕온천 | 충청 / eumseong | 음성군 문화관광 (금왕약수·온천) | [ ] 대기 |
| 08 | `sujeongsan-forest-bath` | 수정산산림욕장 | 충청 / eumseong | 음성군 산림휴양 | [ ] 대기 |
| 09 | `gurim-village` | 구림마을 | 전라 / yeongam | 영암군 구림전통한옥마을 | [ ] 대기 |
| 10 | `goje-sansuyu-village` | 거창 고제면 산수유마을 | 경상 / geochang | 거창군 고제면 산수유군락지 | [ ] 대기 |
| 11 | `gongju-hanok-village` | 공주한옥마을 | 충청 / gongju | 공주시 공주한옥마을 공식 (`hanok.gongju.go.kr`) | [ ] 대기 |
| 12 | `boseong-ginkgo-forest` | 보성군립은행나무숲 | 전라 / boseong | 보성군 오봉산 자락 군립산림 | [ ] 대기 |
| 13 | `jeongeupcheon` | 정읍천 | 전라 / jeongeup | 정읍시 내장산 발원 생태하천 | [ ] 대기 |
| 14 | `pangyo-techno-valley` | 판교테크노밸리 | 수도권 / seongnam | 경기도·경기주택도시공사 판교 공식 | [ ] 대기 |

---

### R02 (대기): 수도권·강원·충청 보강 18건 큐
- [ ] `alpensia-resort` (알펜시아 리조트, 평창)
- [ ] `yongpyong-resort` (용평리조트/모나용평, 평창)
- [ ] `ansan-culture-plaza` (안산문화광장, 안산)
- [ ] `anyangcheon-eco-park-gwangmyeong` (광명 안양천생태공원, 광명)
- [ ] `starfield-hanam` (스타필드 하남, 하남)
- [ ] `hanam-gyosan-neighborhood-park` (하남교산근린공원, 하남)
- [ ] `neunggok-historic-park` (능곡동 유적공원, 시흥)
- [ ] `siheung-soft-town` (시흥 소프트타운, 시흥)
- [ ] `yangpyeong-wild-flower-arboretum` (양평 들꽃수목원, 양평)
- [ ] `malgeunnuri-park-gwacheon` (맑은누리공원, 과천)
- [ ] `osancheon` (오산천, 오산)
- [ ] `yeoju-premium-outlets` (여주프리미엄아울렛, 여주)
- [ ] `bosan-foreigners-street` (동두천 보산동 외국인거리, 동두천)
- [ ] `starlight-garden-universe` (이천 별빛정원우주, 이천)
- [ ] `pyeongtaek-mir-island` (평택 미르섬, 평택)
- [ ] `mihocheon-ecological-park` (미호천생태공원, 진천)

---

### R03 (대기): 전라·경상 보강 18건 큐
- [ ] `gokseong-simcheong-hanok-village` (곡성 심청한옥마을, 곡성)
- [ ] `seongsusan` (성수산, 임실)
- [ ] `jangseong-cornus-village` (장성산수유마을, 장성)
- [ ] `baeksajang-beach` (백사장해수욕장, 영광)
- [ ] `ungpo-tourist-site` (웅포관광지, 익산)
- [ ] `eden-valley-resort` (에덴밸리리조트, 양산)
- [ ] `tongdo-fantasia` (통도환타지아, 양산)
- [ ] `changwon-jinhae-gunhangje` (창원 진해군항제, 창원)
- [ ] `unmunsa-cheongdo` (청도 운문사, 청도)
- [ ] `uiseong-garlic-theme-park` (의성마늘테마공원, 의성)
- [ ] `yonggung-market` (용궁시장, 예천)
- [ ] `sungshan-garden` (숭산정원, 칠곡)
- [ ] `dokdo-landing-facility` (독도접안시설, 독도)
- [ ] `seodo` (서도, 독도)
- [ ] `gaejin-market-goryeong` (고령 개진시장, 고령)
- [ ] `goryeong-nakdong-viewpoint` (고령 낙동강 전망, 고령)
- [ ] `gubongsan-cable-car` (구봉산 케이블카, 광양)
- [ ] `hwanseongsa` (환성사, 경산)
- [ ] `toyorae-land-uiryeong` (의령 토요애랜드, 의령)
- [ ] `yeongyang-oessibeoseon-trail` (영양 외씨버선길, 영양)
