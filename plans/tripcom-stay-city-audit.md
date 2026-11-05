# 트립닷컴 숙소 도시 연결 점검

하와이(`hawaii` → city `757` 호놀룰루)는 사람 확인 후 PR #662로 메인에 반영한다. 배치 1(제도·섬)은 오케스트레이터 R01–R02에서 23곳을 연결하고 라자 암팟만 보류했다. 코드는 PR [#664](https://github.com/catgeot/Days/pull/664). 남은 순서는 [`tripcom-stay-city-queue.md`](./tripcom-stay-city-queue.md). 한 세션은 라운드 2개만.

## 왜 막히나

`city`가 없으면 `kr.trip.com/hotels/list`는 직전 세션 도시를 유지한다. 하와이는 그래서 사모아 아피아로 열렸다. `cityName`만으로는 검색창 글자만 바뀌고, 잡힌 도시는 안 바뀐다.

목록이 있는 여행지도 하단에 「트립닷컴에서 숙소 검색」이 생긴다 (`trip_sub1=숙소찾기 목록하단`). city가 없으면 이 링크도 세션 잔존이 난다.

## 연결 SSOT

`src/utils/affiliate.js` `PLANNER_TRIPCOM_HOTEL_CITY_IDS`. slug → Trip city ID.

city ID를 넣으면 부작용이 있다. 플래너 숙소 카드에 `[@지역@]` 태그가 없으면 숙소 버튼이 마이리얼트립에서 트립닷컴으로 바뀐다 (`getTripcomHotelOverrideUrlForLocation`). 항공+호텔 패키지 URL의 `htlProvinceId`에도 같은 ID가 들어간다. **점검 세션에서 ID를 일괄로 넣지 않는다.** 라이브 목록이 그 여행지로 열린 뒤에만, 일지에 플래너 전환을 적고 추가한다.

## 확인 방법

1. `node scripts/audit-tripcom-stay-cities.mjs` — Trip.com을 호출하지 않는다. 배치 1과 남은 수만 찍는다.
2. 시크릿 창에서 `https://kr.trip.com/hotels/list?city=<id>&cityName=<영문명>&checkIn=&checkOut=&adult=2&crn=1` 를 연다.
3. 통과: 잡힌 도시·주·나라가 그 여행지다. 실패: 직전 도시가 남거나, 다른 나라의 동명 도시다.
4. 금지: 주 province ID만 넣기(검색창이 빔). `city=10279`는 이탈리아 아풀리아. 키워드 API 첫 결과는 호텔 이름일 수 있다(「하와이」가 스페인 호텔로 나왔음).

호놀룰루 slug는 하와이 카드와 별개다. 하와이 카드만 `757`이다. 호놀룰루를 같은 ID로 묶지 않는다.

이미 sparse로 둔 slug(남극·핏케언·추크·크리스마스섬·페르세폴리스·팀북투 등)는 재고가 없거나 오매핑이라 city를 새로 단정하지 않는다.

## 배치 1 (R01–R02 기록)

23곳 연결, `raja-ampat` 보류(와이사이는 서파푸아). ID와 관문 도시는 `affiliate.js` 주석과 일지. 다음 세션은 큐 **R03**(대도시 10곳)부터 라운드 2개.

제도·섬·권역. 하와이처럼 도시 이름이 아니라 세션 잔존이 나기 쉽다.

`guam` `maldives` `seychelles` `palawan` `canary-islands` `galapagos` `mauritius` `zanzibar` `new-caledonia` `saipan` `okinawa` `hokkaido` `phuket` `boracay` `cebu` `crete` `sicily` `madeira` `bahamas` `cape-verde` `la-reunion` `uyuni-salt-flat` `komodo-island` `raja-ampat`

대도시(도쿄·오사카·싱가포르·방콕·파리·뉴욕·시드니·서울·제주)와 나머지 미연결 200곳은 배치 1 기록 다음이다. 한 세션에 220곳을 라이브로 보지 않는다.

## 기록

각 slug: 연 도시 / 맞음·틀림 / 넣은 city ID 또는 보류 이유. 일지 `plans/2026-11-05-project-log.md`에 배치 결과만 남긴다.
