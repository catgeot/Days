# GATEO full-corpus link audit — **final5b** (WAF false-English fix)

Base **final5** decisions frozen; repriced URLs only where WAF/block copy falsely passed as English.

## final5 → final5b diff

| URL | final5 decision | final5b decision | Evidence sample |
|---|---|---|---|
| https://ticket.toureiffel.paris/en | keep → https://ticket.toureiffel.paris/en | unwrap |  |
| https://www.toureiffel.paris/en/rates-opening-times | keep → https://www.toureiffel.paris/en/rates-opening-times | unwrap |  |
| https://www.tremdocorcovado.rio/en | keep → https://www.tremdocorcovado.rio/en | unwrap |  |
| https://www.tremdocorcovado.rio/en/institucional/informacoes-uteis | keep → https://www.tremdocorcovado.rio/en/institucional/informacoes-uteis | unwrap |  |

Corpus: **155** reviews + **39** reports.

| Metric | Count |
|---|---|
| Link instances (exempt maps/unsplash/gateo/tel) | 682 |
| Unique URLs resolved | 390 |
| URL decisions: keep | 180 |
| URL decisions: replace | 40 |
| URL decisions: unwrap | 170 |
| Row operations logged | 224 |
| SQL rows | 87 |
| Post-corpus URL checks | 233 |
| **Non-KO/EN remaining** | **0** |
| WAF-repriced URLs | 4 |
| final5→final5b decision changes | 4 |

## Ticket / booking links

| Original URL | Action | New URL | Proof sample |
|---|---|---|---|
| https://ticket.toureiffel.paris/en | unwrap | — |  |
| https://webstore.thepeak.com.hk/?lang=en_us | keep | https://webstore.thepeak.com.hk/?lang=en_us |  |
| https://www.angkorenterprise.gov.kh/en/available-tickets | keep | https://www.angkorenterprise.gov.kh/en/available-tickets |  |
| https://tickets.monuments-nationaux.fr/en-GB/families?site=2032863779450400197 | unwrap | — |  |
| https://kpmn.welovebooking.net/book/kpmn/home | keep | https://kpmn.welovebooking.net/book/kpmn/home |  |
| https://www.kaiyukan.com/info/ticket/kaiyukan/ | keep | https://www.kaiyukan.com/info/ticket/kaiyukan/ |  |
| https://site.bileto.sympla.com.br/rioscenarium/ | unwrap | — |  |
| https://www.hrad.cz/en/prague-castle-for-visitors/tickets | keep | https://www.hrad.cz/en/prague-castle-for-visitors/tickets |  |
| https://pid.cz/en/tickets-and-fare/ | keep | https://pid.cz/en/tickets-and-fare/ |  |
| https://www.signalfestival.com/en/tickets/ | keep | https://www.signalfestival.com/en/tickets/ |  |
| https://tickets.gem.eg/ | keep | https://tickets.gem.eg/ |  |
| https://www.thepeak.com.hk/en/ticket-and-booking/purchase-ticket/peak-tram-sky-pass | replace | https://webstore.thepeak.com.hk/?lang=en_us |  |
| https://www.bondinho.com.br/pt/comprar-ingresso | replace | https://www.bondinho.com.br/en/ |  |
| https://museudoamanha.org.br/pt-br/ingressos | unwrap | — |  |
| https://ticket.louvre.fr/en | unwrap | — |  |
| https://www.louvre.fr/en/visit/hours-admission | keep | https://www.louvre.fr/en/visit/hours-admission |  |
| https://www.veneziaunica.it/en/buy-tickets | keep | https://www.veneziaunica.it/en/buy-tickets |  |
| https://tickets.basilicasanmarco.it/en/ | keep | https://tickets.basilicasanmarco.it/en/ |  |
| https://tickets.basilicasanmarco.it/en/support/prices | keep | https://tickets.basilicasanmarco.it/en/support/prices |  |
| https://muve.vivaticket.it/ita/tour/palazzo-ducale/2478 | replace | https://muve.vivaticket.it/en/tour/palazzo-ducale/2478 |  |
| https://gallerieaccademia.eventim-inhouse.de/webshop/webticket/timeslot | replace | https://gallerieaccademia.eventim-inhouse.de/ |  |
| https://www.gallerieaccademia.it/en/visit/opening-hours-and-tickets/ | keep | https://www.gallerieaccademia.it/en/visit/opening-hours-and-tickets/ |  |
| https://ticketing.colosseo.it/ | unwrap | — |  |
| https://portale.museiitaliani.it/b2c/buyTicketless/33f77159-0acd-40c4-8524-701f33aae108 | unwrap | — |  |
| https://www.comune.roma.it/web/it/notizia/biglietto-dingresso-fontana-di-trevi.page | unwrap | — |  |
| https://tickets.museivaticani.va/ | unwrap | — |  |
| https://asi.paygov.org.in/asi-webapp/#/ticketbooking | unwrap | — |  |
| https://www.nankai.co.jp/en_railway/ticket/rapit | unwrap | — |  |
| https://ticket.duomomilano.it/en/eventi/terrazze-salita-a-piedi/ | unwrap | — |  |
| https://ticket.duomomilano.it/en/eventi/english-terrazze-salita-in-ascensore/ | unwrap | — |  |
| https://ticket.duomomilano.it/en/categoria/terrazze/ | unwrap | — |  |
| https://nhahatmuaroithanglong.vn/en/ticket-book/ | unwrap | — |  |
| https://booking.sunworld.vn/ | unwrap | — |  |

## Render could not be verified (unwrap / fallback)

- **https://ticket.toureiffel.paris/en** → unwrap (ticket-booking-last-resort)
- **https://www.toureiffel.paris/en/rates-opening-times** → unwrap (no-verified-en-ko-institution)
- **https://www.tremdocorcovado.rio/en** → unwrap (no-verified-en-ko-institution)
- **https://www.tremdocorcovado.rio/en/institucional/informacoes-uteis** → unwrap (no-verified-en-ko-institution)

## Scanner (all post-update bodies)

| Row | URL | OK | Detected | Method | Sample text |
|---|---|---|---|---|---|
| review 040dc9cf-8b41-4a9e-a857-5a919deb3071 | https://www.incredibleindia.gov.in/en/uttar-pradesh/varanasi/assi-ghat | yes | en | chromium-body | Destinations Experiences Plan your trip Festivals & Events EN Previous Uttar Pradesh Assi Ghat Uttar Pradesh Assi Ghat N |
| review 04c02248-d84b-4d39-bdaa-4a9f008ec48c | https://www.botanicgardens.org.au/royal-botanic-garden-sydney/plan-your-visit | yes | en | chromium-body | Skip to navigation Skip to content For schools Our science The Royal Botanic Gardens of Sydney map Map Donate Search Vis |
| review 04c02248-d84b-4d39-bdaa-4a9f008ec48c | https://gleebooks.com.au/ | yes | en | chromium-body | Skip to main content 0 items Login/Sign up Search for books Contact Us Gleaner Events Gift Cards Kids Schools Textbooks  |
| review 06372342-759a-49d9-a2b1-2af2aa57f387 | https://www.visityap.com/do_dont_yap.php | yes | en | chromium-body | DIVE YAP STAY YAP FLY YAP KNOW YAP DO YAP BOOK YAP GALLERIES NEWS Yap Do's and Dont's DO's Always ask for permission bef |
| review 06372342-759a-49d9-a2b1-2af2aa57f387 | https://www.visityap.com/points_of_interest.php | yes | en | chromium-body | DIVE YAP STAY YAP FLY YAP KNOW YAP DO YAP BOOK YAP GALLERIES NEWS Yap Points of Interest Yap Living History Museum This  |
| review 06372342-759a-49d9-a2b1-2af2aa57f387 | https://www.visityap.com/events_in_yap.php | yes | en | chromium-body | DIVE YAP STAY YAP FLY YAP KNOW YAP DO YAP BOOK YAP GALLERIES NEWS Yap Festivals & Events Yap Day This annual event is us |
| review 094b7aca-8d76-4d65-b99e-e67a31799dab | https://www.tajmahal.gov.in/dos-and-donts.aspx | yes | en | chromium-body | Home Visiting Hours & Ticketing Nearby Attractions Agra Beyond Taj Night Viewing Do's & Don'ts Agra Fort Fatehpur Sikri  |
| review 0d85bbf2-9d7d-4900-ab6e-3784191a392c | https://www.budapestinfo.hu/en/shoes-on-the-danube-bank | yes | en | chromium-body | Highlights in Spring in Summer in Autumn in Winter Latest News Attractions Top Attractions Sightseeing Thermal Baths Out |
| review 0d85bbf2-9d7d-4900-ab6e-3784191a392c | https://www.budapestinfo.hu/en/chain-bridge | yes | en | chromium-body | Highlights in Spring in Summer in Autumn in Winter Latest News Attractions Top Attractions Sightseeing Thermal Baths Out |
| review 0d85bbf2-9d7d-4900-ab6e-3784191a392c | https://futar.bkk.hu/ | yes | en | scanner-lang-frozen | 18:58 Zoom in to view vehicles! Privacy settings — License — © OpenMapTiles © OpenStreetMap contributors ​ ​ Trip Planne |
| review 0ea558a7-e934-4c8a-bcbf-9ba6b138830c | https://sfrecpark.org/Facilities/Facility/Details/Twin-Peaks-384 | yes | en | chromium-body | Skip to Main Content Search EXPLORE OUR PARKS FIND A PROGRAM PERMITS & RESERVATIONS ABOUT US Parks and Facilities Bureau |
| review 0ea558a7-e934-4c8a-bcbf-9ba6b138830c | https://www.sfmta.com/routes/37-corbett | yes | en | chromium-body | Skip to main content SFMTA Getting Around Projects Calendar Services News About Us Careers Quick Links English Alerts FI |
| review 0eab4752-308a-43de-a974-0944dd55df3f | https://www.turismoroma.it/en/places/campo-de%E2%80%99-fiori | yes | en | chromium-body | Skip to main content LIVE ROME, DISCOVER ROME TOURIST SERVICES AND CULTURAL OFFER +39060608 English Italiano Deutsch Fra |
| review 0eab4752-308a-43de-a974-0944dd55df3f | https://www.losteriadellatrippa.it/ | yes | en | chromium-body | Skip to main content Facebook Instagram phone BOOK MENU Menu Fifth fourth from the 2019 Kitchen Roman, wine And time slo |
| review 0f176b78-cf13-43cf-80d0-f572e7e215b8 | https://www.tourism.gov.hk/symphony/english/details/details.html | yes | en | chromium-body | Skip to content A A A Details of the Show HONG KONG A SYMPHONY OF LIGHTS "A Symphony of Lights" (SoL) has illuminated Ho |
| review 0f176b78-cf13-43cf-80d0-f572e7e215b8 | https://webstore.thepeak.com.hk/?lang=en_us | yes | en | chromium-body | Important Notices Open My Order Contact Us English Tickets & Services The Peak Experience Shop & Dine Heritage Guest Inf |
| review 16547990-6dd1-478d-8c5b-b7dc48580251 | https://www.angkorenterprise.gov.kh/en/available-tickets | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| review 18c5a722-12aa-4324-b252-01ef8b22a0c7 | https://tourism.ub.gov.mn/ | yes | en | chromium-body | Skip to content 70128687 UBTOURISM@GMAIL.COM НИЙСЛЭЛИЙН АЯЛАЛ ЖУУЛЧЛАЛЫН ГАЗАР “Зөвшөөрлийн нэгдсэн сан” https://license |
| review 18c5a722-12aa-4324-b252-01ef8b22a0c7 | https://www.visit-ulaanbaatar.com/EN/get-to-know | yes | en | chromium-body | Ulaanbaatar Events and activities Get To Know Eat & Stay Newsroom Taxi & Ride Apps EN Let's explore nomadic heritage tog |
| review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f | https://osaka-info.jp/en/spot/dotonbori/ | yes | en | chromium-body | For corporations, organizations, and media For those involved in domestic school trips For Meetings & Events Global (Eng |
| review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f | https://osaka-info.jp/en/spot/tombori-riverwalk/ | yes | en | chromium-body | For corporations, organizations, and media For those involved in domestic school trips For Meetings & Events Global (Eng |
| review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f | https://osaka-info.jp/en/special/dc/event/detail376/ | yes | en | chromium-body | Featured Experiences, Events, and Spots Search by type Experience Event spot Search by area Osaka City Sakai City Hokuse |
| review 1aad326e-a37f-40d8-95ca-f31847c494dd | https://babycal-jre.com/en/ | yes | en | chromium-body | Rental Fees *Rental fees vary by location. *Follow the procedure for extending your rentalif you need to go over your or |
| review 2139d379-8947-47f7-a270-f0bd3abec2aa | https://www.canadaplace.ca/plan-your-visit | yes | en | scanner-blocked-official-en | www.canadaplace.ca Performing security verification This website uses a security service to protect against malicious bo |
| review 2139d379-8947-47f7-a270-f0bd3abec2aa | https://www.translink.ca/rider-guide/transit-accessibility/how-to-use-accessible-transit | yes | en | chromium-body | Skip to content RIDER INFO PLANS & PROJECTS ABOUT News Jobs Contact Sign in to Transit Alerts Search Trip Planner Next B |
| review 233fa36d-4378-499a-b96f-3e4ae5281896 | https://sunworld.vn/en/ | yes | en | chromium-body | Visit Park English About Us Vouchers Experiences News Shows Events Affiliate Contact Us Let's start your vacation! Desti |
| review 235e9263-07c8-44eb-b5b4-b85cfd7f3642 | https://royal.khs.go.kr/ROYAL/contents/R706060000.do | yes | ko | chromium-body | 메인메뉴 바로가기 본문 바로가기 푸터 바로가기 사이트맵 검색창열기 궁궐안내 왕릉안내 관람안내 관람코스 통합예약 궁능TV 페이스북열기 인스타그램열기 트위터열기 궁능소개 통합예약 관람안내 행사마당 자료마당 소통마당 기관 |
| review 235e9263-07c8-44eb-b5b4-b85cfd7f3642 | https://royal.khs.go.kr/ROYAL/contents/R702000000.do?schGroupCode=rtm | yes | ko | chromium-body | 메인메뉴 바로가기 본문 바로가기 푸터 바로가기 사이트맵 검색창열기 궁궐안내 왕릉안내 관람안내 관람코스 통합예약 궁능TV 페이스북열기 인스타그램열기 트위터열기 궁능소개 통합예약 관람안내 행사마당 자료마당 소통마당 기관 |
| review 235e9263-07c8-44eb-b5b4-b85cfd7f3642 | https://royal.khs.go.kr/ROYAL/contents/R707000000.do?schGroupCode=rtm&schGroupCodeNm=%EC%A1%B0%EC%84%A0%EC%99%95%EB%A6%89 | yes | ko | chromium-body | 메인메뉴 바로가기 본문 바로가기 푸터 바로가기 사이트맵 검색창열기 궁궐안내 왕릉안내 관람안내 관람코스 통합예약 궁능TV 페이스북열기 인스타그램열기 트위터열기 궁능소개 통합예약 관람안내 행사마당 자료마당 소통마당 기관 |
| review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | https://tabelog.com/en/ | yes | en | chromium-body | About TabelogFAQJapanese Culture and Etiquette Guide Japan's No. 1* Restaurant Listing and Reservation Site. English 简体中 |
| review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | https://osaka-info.jp/en/spot/kuromon-market/ | yes | en | chromium-body | For corporations, organizations, and media For those involved in domestic school trips For Meetings & Events Global (Eng |
| review 2f5b5725-00d1-45a0-a9d3-01cd73716656 | https://prague.eu/en/objevujte/petrin-gardens-petrinske-sady/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 2f5b5725-00d1-45a0-a9d3-01cd73716656 | https://prague.eu/en/objevujte/zahrada-kinskych/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 2fc0c1c5-0d8a-40a0-90f0-ef09858f894d | https://www.koshary-aboutarek.com/en/branches | yes | en | chromium-body | About Us News Branches Contact Us ع 16011 Branches Abou Tarek Branches Branches Abou Tarek Branches Discover Us Home Abo |
| review 2fda15bd-ac0d-48c5-937d-49fdbb4675d8 | https://hk.science.museum/en/web/scm/visit.html | yes | en | chromium-body | About UsVisitExhibitionsEventsScience Promotion UnitOnline Explore EN 繁 簡 Search Visit Back Opening Hours Exhibition Hal |
| review 33676179-a5fc-451d-b373-8fba35e0ccd0 | https://www.cafebatavia.com/ | yes | en | scanner-lang-frozen | Our Story Signature Menu Moments Reach Us Award-Winning Restaurant Salon Cullinaire 2019 by ACP - FHI La Cuisine by ACP  |
| review 33755302-e121-4231-9b5e-dc312350cabb | https://www.paris-arc-de-triomphe.fr/en | yes | en | chromium-body | To improve your comfort, the lift at the Arc de Triomphe is currently undergoing modernisation works. Access to the monu |
| review 36ec7a22-1e40-4879-981d-39f9554beb0b | https://vietnamtourism.gov.vn/en/post/17740 | yes | en | chromium-body | Nov 24, 2026Tiếng Việt ABOUT VNATLIVE FULLY IN VIETNAMVNAT'S ACTIVITIESNEWSEVENTSTOURISM PROMOTIONSDISCOVER VIETNAMSTATI |
| review 36ec7a22-1e40-4879-981d-39f9554beb0b | https://vietnamtourism.gov.vn/en/post/5507 | yes | en | scanner-institution-fallback | Nov 24, 2026Tiếng Việt ABOUT VNATLIVE FULLY IN VIETNAMVNAT'S ACTIVITIESNEWSEVENTSTOURISM PROMOTIONSDISCOVER VIETNAMSTATI |
| review 370753d8-46a4-45cb-87c3-d61408b3138b | https://www.gimhae.go.kr/07058/07059/07327.web?amode=view&idx=297 | yes | ko | chromium-body | 본문 바로가기 주 메뉴 바로가기 시정포털 관광포털 분야포털 공공예약포털 주민자치포털 기업119 일자리지원센터 김해시의회 공공데이터 스마트도시 교통정보 김해온몰 국가상징 Global Navigation 홈 누리집 안내 |
| review 370753d8-46a4-45cb-87c3-d61408b3138b | https://www.gimhae.go.kr/06048/06050.web | yes | ko | chromium-body | 본문 바로가기 주 메뉴 바로가기 Global Navigation 홈 사이트맵 시정포털 관광포털 LANGUAGES 주 메뉴 박물관 소개 이용안내 전시 정보·자료실 교육·행사 소식·참여 율하유적전시관 전체메뉴 전체메뉴  |
| review 370753d8-46a4-45cb-87c3-d61408b3138b | https://gimhae.museum.go.kr/kr/html/sub01/0105.html | yes | ko | chromium-body | 본문 바로가기 사이드메뉴 바로가기 대메뉴 바로가기 이 누리집은 대한민국 공식 전자정부 누리집입니다. 문화체육관광부 국립김해박물관 로그인 Language 열기 검색 모바일 전체메뉴 GIMHAE NATIONAL MUSE |
| review 373efece-464b-4134-a50e-0233f597543b | https://www.wmata.com/ride/accessibility/metro-rail.html | yes | en | chromium-body | Skip to Main Content English Smart Trip opens in a new tab Ride Pay News Help Search Accessibility at Metro Metro Rail A |
| review 38bf5835-1797-4095-8aac-f3ddff35596b | https://vietnam.travel/things-to-do/enjoy-vietnams-sidewalk-culture/ | yes | en | chromium-body | Attention: Latest updates on destinations, experiences, and travel in Vietnam Explore Now → Your location Ha Noi Ha Noi  |
| review 38bf5835-1797-4095-8aac-f3ddff35596b | https://vietnam.travel/things-to-do/explore-old-quarter-your-way/ | yes | en | chromium-body | Attention: Latest updates on destinations, experiences, and travel in Vietnam Explore Now → Your location Ha Noi Ha Noi  |
| review 38bf5835-1797-4095-8aac-f3ddff35596b | https://vietnam.travel/things-to-do/3-walking-tours-ha-noi/ | yes | en | chromium-body | Attention: Latest updates on destinations, experiences, and travel in Vietnam Explore Now → Your location Ha Noi Ha Noi  |
| review 3f7b4d94-1cc1-4c0b-8c73-18d54100e9ed | https://access.visitkorea.or.kr/ms/detail.do?cotId=1a1821fc-b2cf-4e1c-9d83-56f5adb79bce | yes | ko | chromium-body | 본문 바로가기 주메뉴 바로가기 화면크게 화면크기 화면작게 텍스트보기 고대비보기 초기화 대한민국구석구석 열린관광 모두의 여행 인스타그램 Home 내공간 로그인 추천여행 무장애 관광정보 새소식·공지 사업소개 검색 홈 무 |
| review 407d7a88-3795-41bc-9740-70fc0b328600 | https://thegridfoodmarket.com/ | yes | en | scanner-lang-frozen | Skip to content Browse Stalls Stall 1 Origine Stall 2 Bebang Halo-halo Stall 3 Flowerboy Stall 4 Tsuke-Men Stall 5 Le Ch |
| review 407d7a88-3795-41bc-9740-70fc0b328600 | https://thegridfoodmarket.com/collections/stall-5-le-chon | yes | en | chromium-body | Skip to content Browse Stalls Stall 1 Origine Stall 2 Bebang Halo-halo Stall 3 Flowerboy Stall 4 Tsuke-Men Stall 5 Le Ch |
| review 42f01dc5-b9e3-4c8a-9330-324f237a97af | https://www.visitlisboa.com/en/places/miradouro-de-santa-luzia | yes | en | chromium-body | Visit Lisboa Convention Bureau About Us Traveller information Photo Gallery Turismo de Lisboa Logo Culture & Outdoors Se |
| review 42f01dc5-b9e3-4c8a-9330-324f237a97af | https://www.carris.pt/en/ | yes | en | chromium-body | Travel Buy Customer Care Discover CARRIS EN Real-time tracking Track all vehicles on the road and see how long it will t |
| review 43292c6e-8f0f-4fa1-97f8-59d3329e5b29 | https://colosseo.it/en/opening-times/ | yes | en | chromium-body | Gestisci Consenso Cookie Per fornire le migliori esperienze, utilizziamo tecnologie come i cookie per memorizzare e/o ac |
| review 43292c6e-8f0f-4fa1-97f8-59d3329e5b29 | https://parcocolosseo.it/en/ | yes | en | chromium-body | Gestisci Consenso Cookie Per fornire le migliori esperienze, utilizziamo tecnologie come i cookie per memorizzare e/o ac |
| review 44178bf5-e46c-48f6-8781-532835d850bc | https://www.italia.it/en/veneto/venezia/isola-della-giudecca | yes | en | scanner-institution-fallback | Press Alt+1 for screen-reader mode, Alt+0 to cancel Accessibility Screen-Reader Guide, Feedback, and Issue Reporting \|  |
| review 44178bf5-e46c-48f6-8781-532835d850bc | https://actv.avmspa.it/en/ | yes | en | chromium-body | Error 403 Web Page Blocked URL: actv.avmspa.it/en/ Client IP: 18.235.67.204 Attack ID: 20000051 Message ID: 006135132745 |
| review 44178bf5-e46c-48f6-8781-532835d850bc | https://www.italia.it/en/veneto/venezia/ponte-di-rialto | yes | en | scanner-institution-fallback | Press Alt+1 for screen-reader mode, Alt+0 to cancel Accessibility Screen-Reader Guide, Feedback, and Issue Reporting \|  |
| review 44178bf5-e46c-48f6-8781-532835d850bc | https://actv.avmspa.it/en/content/venice-urban-services | yes | en | chromium-body | Error 403 Web Page Blocked URL: actv.avmspa.it/en/content/venice-urban-services Client IP: 52.73.250.138 Attack ID: 2000 |
| review 4616d9a7-2d50-4d26-8129-762906196952 | https://www.city.fukuoka.lg.jp/english/ | yes | en | chromium-body | Skip to main content Language To Japanese site English top page New Information Corporate tax reduction for Startups Sep |
| review 4616d9a7-2d50-4d26-8129-762906196952 | https://yokanavi.com/en/ | yes | en | chromium-body | language English 한국어 簡体中文 繁体中文 日本語（よかなび） About Fukuoka Things to Do Plan Your Trip Visitor Information Discover Fukuoka  |
| review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri | yes | en-weak | chromium-body | Resource at '/content/thisisbarcelona/en/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri.html' not found |
| review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | https://www.barcelona.cat/en/ | yes | en | chromium-body | Open in a new window English Select a language Search the website Other websites Skip to main content Barcelona.cat The  |
| review 4f344334-ffe2-4747-9d1c-d06c806b94ed | https://zermatt.swiss/en/p/village-walk-zermatt-01tVj000005EwviIAC | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and adverts, to provide social med |
| review 4f344334-ffe2-4747-9d1c-d06c806b94ed | https://zermatt.swiss/en/p/viewpoint-old-part-of-the-village-01tVj000005DpoLIAS | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and adverts, to provide social med |
| review 5291c187-f13b-4139-9376-8af5eb72a618 | https://lebua.com/restaurants/sky/ | yes | en | chromium-body | By continuing to browse the site you are agreeing to our use of cookies to analyse visits statistics. Privacy Policy. I  |
| review 5291c187-f13b-4139-9376-8af5eb72a618 | https://www.sevenrooms.com/explore/octaverooftoploungebarbkkms/reservations | yes | en | chromium-body | Octave Rooftop Lounge & Bar - Reservations Octave Rooftop Lounge & Bar 2, Sukhumvit Road Soi 57, Klongtan-Nua, Wattana,  |
| review 52c4495f-2f99-4b9e-9ae7-22e89c5a5d76 | https://www.phcf.or.kr/phcf/festival_detail/view.do?festivalId=FST_LIGHT_2026_001 | yes | ko | chromium-body | 본문으로 바로가기 지역문화예술정보 (축소됨) 대표축제 (축소됨) 문화공간 (축소됨) 문화후원 (축소됨) 공모·참여 (축소됨) 열린광장 (축소됨) 포항문화재단 (축소됨) 포항시립예술단 (축소됨) 로그인 회원가입 유료회 |
| review 52c4495f-2f99-4b9e-9ae7-22e89c5a5d76 | https://www.phcf.or.kr/phcf/festival_detail/view.do?festivalId=FST_LIGHT_2026_001&tab=program | yes | ko | chromium-body | 본문으로 바로가기 지역문화예술정보 (축소됨) 대표축제 (축소됨) 문화공간 (축소됨) 문화후원 (축소됨) 공모·참여 (축소됨) 열린광장 (축소됨) 포항문화재단 (축소됨) 포항시립예술단 (축소됨) 로그인 회원가입 유료회 |
| review 52c4495f-2f99-4b9e-9ae7-22e89c5a5d76 | https://www.phcf.or.kr/phcf/festival_detail/view.do?festivalId=FST_LIGHT_2026_001&tab=location | yes | ko | chromium-body | 본문으로 바로가기 지역문화예술정보 (축소됨) 대표축제 (축소됨) 문화공간 (축소됨) 문화후원 (축소됨) 공모·참여 (축소됨) 열린광장 (축소됨) 포항문화재단 (축소됨) 포항시립예술단 (축소됨) 로그인 회원가입 유료회 |
| review 5662286f-a6ac-4b7c-bf49-841b97f1b6b7 | https://tajmahal.gov.in/visiting-hours.aspx | yes | en | chromium-body | Home Visiting Hours & Ticketing Nearby Attractions Agra Beyond Taj Night Viewing Do's & Don'ts Agra Fort Fatehpur Sikri  |
| review 5662286f-a6ac-4b7c-bf49-841b97f1b6b7 | https://asi.paygov.org.in/ | yes | en | chromium-body | ARCHAEOLOGICAL SURVEY OF INDIA Regenerate Ticket Help & Contact CIRCLE Agra Delhi Mumbai Jaipur Lucknow Kolkata Bangalor |
| review 5662286f-a6ac-4b7c-bf49-841b97f1b6b7 | https://agra.nic.in/tourist-place/mehtab-bagh/ | yes | en | chromium-body | उत्तर प्रदेश सरकार GOVERNMENT OF UTTAR PRADESH आगरा AGRA Search Home About District Directory Departments Tourism Docume |
| review 5662286f-a6ac-4b7c-bf49-841b97f1b6b7 | https://tajmahal.gov.in/night-view.aspx | yes | en | chromium-body | Home Visiting Hours & Ticketing Nearby Attractions Agra Beyond Taj Night Viewing Do's & Don'ts Agra Fort Fatehpur Sikri  |
| review 58509340-ae7f-44be-ba59-f746335e61fa | https://nuncenter.com/farmers-market/ | yes | en | chromium-body | Skip to content Nūn Center Wellness center \| Cairo, Egypt Home About Our Offerings Calendar Farmer’s Market Contact Us  |
| review 58509340-ae7f-44be-ba59-f746335e61fa | https://www.experienceegypt.eg/en/attraction-details/291/downtown-cairo-city-breaks | yes | en | chromium-body | ABOUT EGYPT WHERE TO GO WHAT TO DO WHAT'S ON USEFUL INFORMATION English WHERE TO GO Pick your destination and start your |
| review 59981c6b-2789-4b3c-b275-9f7c26f4c960 | https://prague.eu/en/objevujte/wenceslas-square-vaclavske-namesti/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 59981c6b-2789-4b3c-b275-9f7c26f4c960 | https://prague.eu/en/objevujte/narodni-street/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 59981c6b-2789-4b3c-b275-9f7c26f4c960 | https://prague.eu/en/guides-and-tours/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 5a41acd7-ddd6-45bf-b74e-2bf88a8617a4 | https://vietnam.travel/things-to-do/11-must-see-attractions-ha-noi/ | yes | en | chromium-body | Attention: Latest updates on destinations, experiences, and travel in Vietnam Explore Now → Your location Ha Noi Ha Noi  |
| review 5b4c6c81-147a-4e06-a18a-35b3368f4f35 | https://transportnsw.info/ | yes | en | chromium-body | Skip to main content Plan Tickets and fares Travel info Regional travel Help and contact Plan your trip Trip Planner Dep |
| review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc | https://thailand.prd.go.th/en/ | yes | en | chromium-body | This content has been suspended with GDCC Security Center to protect your website content URL: thailand.prd.go.th/en/ Me |
| review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc | https://www.thailandgoodtravel.info/english/ | yes | en | chromium-body | Copy as text Routing Error No route matches [GET] "/english" Rails.root: /rails Application Trace \| Framework Trace \|  |
| review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc | https://bangniangmarket.com/ | yes | en | chromium-body | About Us Contact Us Home Shops Bringing Local Merchants To Tourists in Our Area For more than 17 years, we have had the  |
| review 5f9cc144-1af2-432f-8dc9-05353bfb8bd8 | https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503 | yes | en | chromium-body | Follow us: news.cision.com/ Tourism Authority of Thailand/ 7 best things to do in Khao Lak English 7 best things to do i |
| review 5f9cc144-1af2-432f-8dc9-05353bfb8bd8 | https://thailand.prd.go.th/en/ | yes | en | chromium-body | This content has been suspended with GDCC Security Center to protect your website content URL: thailand.prd.go.th/en/ Me |
| review 5f9cc144-1af2-432f-8dc9-05353bfb8bd8 | https://www.thailandgoodtravel.info/english/ | yes | en | chromium-body | Copy as text Routing Error No route matches [GET] "/english" Rails.root: /rails Application Trace \| Framework Trace \|  |
| review 615587ff-f3a1-47db-98b4-4259dc4acd2c | https://www.kiyomizudera.or.jp/en/ | yes | en | chromium-body | PRAY VISIT LEARN LOCATION FAQ NEWS EN JA The eleven faces and forty-two arms of Kannon show great compassion. People hav |
| review 61b4fde0-f1ed-48ab-8792-9334784b6105 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500745 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 동문재래시장 다양한 먹거리와 상업의 중심, 제주 동문 재래시장 날씨 흐림 6℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 관덕로14길 |
| review 61b4fde0-f1ed-48ab-8792-9334784b6105 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500748 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 제주민속오일시장 제주 현지인의 삶을 가장 잘 말해주는 오일시장 날씨 흐림 7℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 오일장서길  |
| review 61b4fde0-f1ed-48ab-8792-9334784b6105 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500276 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 사라봉 붉은 노을이 온 바다를 물들이는 모습이 아름다운 사라봉 날씨 흐림 6℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 사라봉동길  |
| review 62212ddb-749e-4ef6-9fda-fa0326a52122 | https://www.italia.it/en/lazio/rome/roman-forum | yes | en | chromium-body | Press Alt+1 for screen-reader mode, Alt+0 to cancel Accessibility Screen-Reader Guide, Feedback, and Issue Reporting \|  |
| review 669c2eea-23fa-4929-84d9-6a715d256574 | https://www.balajo.fr/en/ | yes | en | chromium-body | Skip to Main Content Log In HOME OUR EVENINGS GIFT CARDS AGENDA CLUBBING PRIVATIZATION PRIVATIZATION MONDAYS THE BALAJO  |
| review 669c2eea-23fa-4929-84d9-6a715d256574 | https://www.nouveaucasino.fr/ | yes | en | chromium-body | Nouveau Casino Electro house A propos Galerie Contact Tous Club Concerts Passé Jeudi 26.11 19:00 – 23:00 Hotline Jos’art |
| review 67acb469-48bd-445e-b8cc-dbb6fb7cd7a9 | https://vietnamtourism.gov.vn/en/post/16717 | yes | en | chromium-body | Nov 24, 2026Tiếng Việt ABOUT VNATLIVE FULLY IN VIETNAMVNAT'S ACTIVITIESNEWSEVENTSTOURISM PROMOTIONSDISCOVER VIETNAMSTATI |
| review 67acb469-48bd-445e-b8cc-dbb6fb7cd7a9 | https://www.hoianworldheritage.org.vn/en/news/Traditionnal-Hoi-An-food/the-best-street-food-in-hoi-an-vietnam-555.hwh | yes | en | chromium-body | Hoi An Hoi An Hoi An Hoi An Hoi An Hoi An Hotline: (+84) 8 43 42 8888 HOME PHOTOS VIDEOS HOI AN & NEWSPAPERS HOI AN TOUR |
| review 67acb469-48bd-445e-b8cc-dbb6fb7cd7a9 | https://whc.unesco.org/en/list/948/ | yes | en | scanner-blocked-official-en | whc.unesco.org Performing security verification This website uses a security service to protect against malicious bots.  |
| review 692c1a26-518f-4209-a342-812a5bd16de7 | https://www.visitdubai.com/en/places-to-visit/the-dubai-fountain | yes | en | chromium-body | We respect your privacy and are committed to being transparent about how our website uses cookies. Cookies enhance your  |
| review 6ec03e36-347a-4ce7-8fa4-1c59aa376fca | https://thipsamai.com/ | yes | en | chromium-body | 313-315 Mahachai Road, Samranrat, Pranakorn, Bangkok, 10200 +66 2226 6666 STORY MENU COOKING PRODUCTS MEDIA NEWS AWARDS  |
| review 701303cd-e327-4be1-bbf1-34d1226d65cf | https://www.peru.travel/attractions/san-pedro-market | yes | en | chromium-body | Peru 360º Meetings and business About Peru News Useful information IPERÚ - Tourist Assistance Plan your trip Destination |
| review 728d0ffe-feda-4ad7-9c55-615315eaf7ea | https://www.duomomilano.it/en/regulations/accessibility/ | yes | en | chromium-body | Skip to content DUOMO DI MILANO LITURGIC LIFE CULTURE AND ART VISIT DONATE SHOP BUY TICKETS ENG Accessibility INFORMATIO |
| review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | https://www.unesco.de/en | yes | en | chromium-body | Jump directly to the page contents To the home page of the German Commission for UNESCO Menu Open navigation Dark mode I |
| review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | https://www.visitberlin.de/en/clubs-berlin | yes | en | chromium-body | Skip to main content visitBerlin.de Berlin's official travel website Menu © GettyImages, Foto: DisobeyArt Breadcrumb vis |
| review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | https://www.visitberlin.de/en/matrix | yes | en | chromium-body | Skip to main content visitBerlin.de Berlin's official travel website Menu Concert © Getty Images, Foto: Jena Ardell Brea |
| review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | https://www.visitberlin.de/en/astra-kulturhaus | yes | en | chromium-body | Skip to main content visitBerlin.de Berlin's official travel website Menu © GettyImages, Foto: Hinterhaus Productions Br |
| review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | https://www.berlin.de/en/public-transportation/1859225-2913840-night-buses-public-transport-at-night.en.html | yes | en | chromium-body | Berlin.deThe Official Website of Berlin Accessibility Open: SearchSearch Open: MenuMenu You are here: Homepage English P |
| review 74dd524a-fc27-4695-b091-c65598dc8de1 | https://www.miamiandbeaches.com/things-to-do/history-and-heritage/art-deco-historic-district | yes | en | chromium-body | SKIP TO CONTENT The Official Website of Greater Miami & Miami Beach Visitors Meeting Planners GMCVB Language Explore Pla |
| review 74dd524a-fc27-4695-b091-c65598dc8de1 | https://www.miamiandbeaches.com/ocean-drive | yes | en | chromium-body | SKIP TO CONTENT The Official Website of Greater Miami & Miami Beach Visitors Meeting Planners GMCVB Language Explore Pla |
| review 74dd524a-fc27-4695-b091-c65598dc8de1 | https://www.miamibeachfl.gov/city-hall/transportation/trolley/south-beach-trolley/ | yes | en | chromium-body | Manage Your Cookie Settings for a Better Browsing Experience We use cookies to enhance your browsing experience, serve p |
| review 78ca860b-f0a3-4004-9598-21db856b4032 | https://sabahparks.org.my/tunku-abdul-rahman-park | yes | en | chromium-body | Skip to main content Official Website of Sabah Parks FAQs Contact Us e-Complaint Sitemap Type & Search... Please type in |
| review 81be5176-9eac-41f9-b19e-1382cc773a38 | https://goturkiye.com/istanbul/old-galata-bridge | yes | en | chromium-body | EN MENU destinations Old Galata Bridge Home İstanbul Old Galata Bridge It spans the Golden Horn, an arm of the Bosphorus |
| review 81be5176-9eac-41f9-b19e-1382cc773a38 | https://goturkiye.com/istanbul/golden-horn | yes | en | chromium-body | EN MENU destinations Golden Horn Home İstanbul Health Tourism İstanbul Golden Horn The Blissful Place of İstanbul The Go |
| review 8885a3e4-6562-476d-8857-c5d3621d060d | https://np-plitvicka-jezera.hr/en/plan-your-visit/istrazite-jezera/hours-of-operation/ | yes | en | chromium-body | We value your privacy We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse |
| review 8885a3e4-6562-476d-8857-c5d3621d060d | https://np-plitvicka-jezera.hr/en/plan-your-visit/istrazite-jezera/activities/lake-tour-programmes/ | yes | en | chromium-body | We value your privacy We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse |
| review 890080b8-a052-4b23-9c46-7d36493a071f | https://www.vasamuseet.se/en/visit/accessibility | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review 890080b8-a052-4b23-9c46-7d36493a071f | https://sl.se/en/getting-around/transport-accessibility | yes | en | chromium-body | Vi använder kakor Vi använder kakor (cookies) på webbplatsen för att den ska fungera så bra som möjligt för dig. Kakor h |
| review 8ad80577-2563-4d45-bb51-e08c52205091 | https://www.visitmorocco.com/en/travel/marrakech/shopping | yes | en | scanner-blocked-official-en | www.visitmorocco.com Performing security verification This website uses a security service to protect against malicious  |
| review 8d52a149-05ed-4094-818e-dd897e13421b | https://www.reefmagic.com.au/faqs/ | yes | en | chromium-body | Skip to main content facebook instagram phone email 7 Day Support +61 07 4222 7479 Reef Magic Reef Magic Cruise Reef Opu |
| review 8e4e0384-1110-453c-954a-d29dfbe121a4 | https://www.pieddecochon.com/en/ | yes | en | chromium-body | Personalizing your cookie choices The restaurant and its partners use cookies on this site, which may involve the collec |
| review 917a59c5-d9f8-4a44-9326-1e14a318755e | https://kingpowermahanakhon.co.th/experience/mahanakhon-skywalk | yes | en | chromium-body | About us Experience Events Articles Contact Location En Get Tickets Experience Open Daily 10.00 AM - Midnight, Last Acce |
| review 917a59c5-d9f8-4a44-9326-1e14a318755e | https://www.asiatiquethailand.com/ | yes | en | chromium-body | HOME EXPLORE ASIATIQUE EVENTS & PROMOTIONS DINING RESTAURANTS CONTACT US FESTIVAL VILLAGE Discover the landmark’s ultima |
| review 917a59c5-d9f8-4a44-9326-1e14a318755e | https://kpmn.welovebooking.net/book/kpmn/home | yes | en | chromium-body | PLAN YOUR VISIT SKYWALK GALLERY ABOUTS menu Skywalk Quick Booking Date calendar_month Show Time WebDaytime 10:00 - 15:30 |
| review 92f60049-d361-4111-9fe0-5366945164be | https://zoo.sandiegozoo.org/plan-your-visit | yes | en | chromium-body | Skip to main content DONATE MEMBERSHIP TICKETS - Press Enter To Submit Search; Page Reloads On Search Submission Support |
| review 95ec6954-4468-44fe-897b-8cd15b4133e1 | https://www.kaiyukan.com/ | yes | en | chromium-body | Currently, many groups visit in the mornings. We recommend purchasing an e-ticket in advance to ensure smooth entry. Kai |
| review 95ec6954-4468-44fe-897b-8cd15b4133e1 | https://www.kaiyukan.com/info/ticket/kaiyukan/ | yes | en | chromium-body | Kaiyukan Language 日本語 English 한글 简体中文 繁體中文 ภาษาไทย User Guide User Guide Business hours and closing days Admission fees  |
| review 95ec6954-4468-44fe-897b-8cd15b4133e1 | https://www.kaiyukan.com/thv/marketplace/ | yes | en | chromium-body | Language Floor Guide Shop List Opening times Access and Parking Events & News Street Performance Shop List eat play buy  |
| review 998f297a-00c6-4bbf-bac7-b64de3b9cf82 | https://www.gardensbythebay.com.sg/en/plan-your-visit/getting-here.html | yes | en | chromium-body | 1/4 Carparks Closure and Traffic Arrangements for the 2026 BYD Singapore International Marathon on 5 and 6 Dec 2026 Upco |
| review bf8d3588-fbf4-4869-8ba4-52d9279cd4ff | https://bangniangmarket.com/ | yes | en | chromium-body | About Us Contact Us Home Shops Bringing Local Merchants To Tourists in Our Area For more than 17 years, we have had the  |
| review c88f7609-850d-4c20-b05d-ba4e12b0d737 | https://hallatrail.or.kr/en/ | yes | ko | scanner-lang-frozen | 찾으시는 페이지가 없어요 주소가 바뀌었거나 삭제된 페이지예요 이렇게 해결해 보세요 주소를 다시 확인해 주세요. 사이트 첫 화면에서 다시 찾으실 수 있어요. 사이트 첫 화면으로 The page you requested |
| review cf7b6841-0c28-4c44-b4cb-0f61719e2300 | https://prague.eu/en/objevujte/naplavka-farmers-market/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review d131c2da-3643-4889-ad52-f5a87742f137 | https://dpr.guam.gov/3893-2/ | yes | en | chromium-body | Skip to content Open toolbar Accessibility Tools Increase Text Decrease Text Grayscale High Contrast Negative Contrast L |
| review d131c2da-3643-4889-ad52-f5a87742f137 | https://www.nps.gov/wapa/planyourvisit/visitorcenters.htm | yes | en | chromium-body | An official website of the United States government Search or ask anything Ask DOI Anything - How Can We Help? Help me p |
| review d20489a7-2fc4-4e0e-9953-cc3923c46674 | https://www.thisisathens.org/shopping/athens-central-food-market | yes | en | chromium-body | Skip to main content Top VISITORS GUIDE CONVENTION & VISITORS BUREAU ATHENS WITH A LOCAL Main navigation EAT & DRINK SEE |
| review d20489a7-2fc4-4e0e-9953-cc3923c46674 | https://www.thisisathens.org/neighbourhoods/karayiannis | yes | en | chromium-body | Skip to main content Top VISITORS GUIDE CONVENTION & VISITORS BUREAU ATHENS WITH A LOCAL Main navigation EAT & DRINK SEE |
| review d2275347-1ee8-4265-8da5-1b710f7987b3 | https://tajmahal.gov.in/visiting-hours.aspx | yes | en | chromium-body | Home Visiting Hours & Ticketing Nearby Attractions Agra Beyond Taj Night Viewing Do's & Don'ts Agra Fort Fatehpur Sikri  |
| review d2275347-1ee8-4265-8da5-1b710f7987b3 | https://www.incredibleindia.gov.in/en/uttar-pradesh/agra/agras-vibrant-bazaars | yes | en | chromium-body | Destinations Experiences Plan your trip Festivals & Events EN Uttar Pradesh Agra's vibrant bazaars: A shopper's paradise |
| review d715f7fd-0fb3-4086-bf43-ec64d37f04dd | https://www.cntower.ca/plan-your-visit/accessibility | yes | en | chromium-body | Skip to main content Upcoming closures: Please note that on November 25, as well as December 1, 2, 3, 5, 6, 7, 9, 10, 11 |
| review d86b9525-6ba6-4838-8c05-2be4670dd19a | https://whc.unesco.org/en/list/173/ | yes | en | scanner-blocked-official-en | whc.unesco.org Performing security verification This website uses a security service to protect against malicious bots.  |
| review d86b9525-6ba6-4838-8c05-2be4670dd19a | https://whc.unesco.org/en/urban-heritage-atlas/stone-town/ | yes | en | scanner-blocked-official-en | whc.unesco.org Performing security verification This website uses a security service to protect against malicious bots.  |
| review dc2a621f-493d-438e-a4fb-f6758014dbb4 | https://www.visitcopenhagen.com/copenhagen/planning/torvehallerne-gdk545401 | yes | en | chromium-body | Skip to content Cookies We and third parties use cookies to optimise your experience and deliver the best content about  |
| review dcd45547-c68b-4a69-93ae-1e12a7f7d9e8 | https://www.getty.edu/accessibility/ | yes | en | chromium-body | Skip to content Sitewide Messages The Getty Center is making improvements that limit gallery access.Please visit our Bui |
| review ddc25884-dd22-48a3-b570-b042d63403a7 | https://www.chicago.gov/city/en/sites/chicagoriverwalk/home/faq.html | yes | en | chromium-body | An official website of the City of Chicago Here's how you know CHICAGO - CITY OF CHICAGO OFFICIAL WEBSITE HOME ABOUT LEA |
| review ddc25884-dd22-48a3-b570-b042d63403a7 | https://360chicago.com/plan-your-visit | yes | en | chromium-body | Skip to main content Enable accessibility for low vision Open the accessibility menu Skip to content Experiences TILT Cl |
| review e0914af4-881c-49b4-93f5-610e87d82fde | https://www.bled.si/en/what-to-see-do/attractions/1/lake-bled/ | yes | en | chromium-body | Skoči na vsebino Weather Webcam Map Search english WHAT TO SEE & DO INSPIRATION ACCOMMODATION EVENTS INFORMATION MEETING |
| review e5c154cc-ffed-4307-bae8-6c1373d7b464 | https://www.kotor.me/en/meet-kotor/ | yes | en | chromium-body | ALL NEWS CONTACT HOME MAYOR LOCAL ADMINISTRATION COMMUNITIES INFORMATION FOR CITIZENS ABOUT KOTOR Accessibility Tool Big |
| review e93cafdf-d704-48df-8aba-bca6d86d0c29 | https://www.louvre.fr/en/ | yes | en | chromium-body | Musée du Louvre Official Website Aller au contenu DEAR VISITORS, This site uses cookies, installed by the Musée du Louvr |
| review ee0b90a8-f394-4ed1-9c5b-cd39b1875b5b | https://lokal-dlouha.ambi.cz/en/reservations/ | yes | en | chromium-body | Menu Reservation Cz Reserve a table to be sure you’ll have a seat. Larger group? If there are more than 12 of you, write |
| review ee0b90a8-f394-4ed1-9c5b-cd39b1875b5b | https://www.cafesavoy.ambi.cz/en/reservation | yes | en | chromium-body | RESERVATION MENU CZ RESERVATION If you need a reservation for more than 8 people, please contact us at savoy@ambi.cz. Fo |
| review f33526e5-c1fa-4875-928b-cd13b476974c | https://jeju.museum.go.kr/ | yes | ko | chromium-body | 본문 바로가기 주메뉴 바로가기 관람시간09:00 ~ 18:00 휴관일1월 1일, 설, 추석, 매주(월) 인스타 트위터 페이스북 블로그 유투브 정보공개 관람안내 예약정보 문화체육관광부 국립제주박물관 Language 검 |
| review f524c904-e169-4f54-b6f6-f57fc219332b | https://www.nms.ac.uk/national-museum-of-scotland/plan-your-visit/accessibility | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| review f97d528b-a8c4-4bd6-86e7-77ea6877faf0 | https://www.visitdubai.com/en/places-to-visit/the-walk-at-jbr | yes | en | chromium-body | We respect your privacy and are committed to being transparent about how our website uses cookies. Cookies enhance your  |
| review ff09c541-dd74-4638-b6f8-ed5b796885a9 | https://www.grab.com/en/ | yes | en | chromium-body | Menu Grab Singapore GrabX Be Our Partner Help Centre Oops! We can't seem to find the page you're looking for. Try search |
| report 65 | https://pid.cz/en/travel-information/airport-and-stations/ | yes | en | chromium-body | Spravovat Souhlas s cookies Abychom poskytli co nejlepší služby, používáme soubory cookies ukládané ve Vašem zařízení. S |
| report 65 | https://www.hrad.cz/en/prague-castle-for-visitors/tickets | yes | en | scanner-blocked-official-en | www.hrad.cz Performing security verification This website uses a security service to protect against malicious bots. Thi |
| report 65 | https://prague.eu/en/produkt/old-town-hall-with-astronomical-clock/ | yes | en | chromium-body | Consent Details About This website uses cookies We use cookies to personalise content and ads, to provide social media f |
| report 65 | https://pid.cz/en/funicular/ | yes | en | chromium-body | Spravovat Souhlas s cookies Abychom poskytli co nejlepší služby, používáme soubory cookies ukládané ve Vašem zařízení. S |
| report 65 | https://pid.cz/en/tickets-and-fare/ | yes | en | chromium-body | Spravovat Souhlas s cookies Abychom poskytli co nejlepší služby, používáme soubory cookies ukládané ve Vašem zařízení. S |
| report 65 | https://www.signalfestival.com/en/ | yes | en | chromium-body | Catch a signal with us! Do you want to be the first to receive the latest information about the Signal Festival and ever |
| report 65 | https://www.signalfestival.com/en/tickets/ | yes | en | chromium-body | News → Signal Festival has come to an end, thank you! 14 → 17 10 History Press We care Contacts CZ 14 → 17 10 News About |
| report 65 | https://lokal-dlouha.ambi.cz/en/menu | yes | en | chromium-body | Menu Reservation Cz Evening menu Night menu Drinks Evening menu Tuesday, November 24 SHOW ALLERGENS Starters Prague ham  |
| report 65 | https://lokal-dlouha.ambi.cz/en/reservations/ | yes | en | chromium-body | Menu Reservation Cz Reserve a table to be sure you’ll have a seat. Larger group? If there are more than 12 of you, write |
| report 65 | https://en.ufleku.cz/restaurant/menu/ | yes | en | chromium-body | Pivovar U Fleků – English NEWS ABOUT US RESTAURANT HALLS PROGRAM GIFTS CONTACT INTERESTING FACTS Menu THIS MENU IS VALID |
| report 65 | https://en.ufleku.cz/contact/reservations/ | yes | en | chromium-body | Pivovar U Fleků – English NEWS ABOUT US RESTAURANT HALLS PROGRAM GIFTS CONTACT INTERESTING FACTS Reservations E-mail: uf |
| report 65 | https://www.cafesavoy.ambi.cz/en/menu | yes | en | chromium-body | RESERVATION MENU CZ BREAKFAST Breakfast Cafe menu Weekend menu Beverages Weekly menu Wines Show allergens View and order |
| report 65 | https://www.cafesavoy.ambi.cz/en/reservation | yes | en | chromium-body | RESERVATION MENU CZ RESERVATION If you need a reservation for more than 8 people, please contact us at savoy@ambi.cz. Fo |
| report 66 | https://www.visa2egypt.gov.eg/ | yes | en | chromium-body | ARAB REPUBLIC OF EGYPT ELECTRONIC VISA PORTAL SIGN IN SIGN UP English العربية Français Pусский 中文 Deutsch Italiano Españ |
| report 66 | https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau | yes | en | chromium-body | Ministry of Tourism and Antiquities A A A Register / Login English Historical Periods Places & Collections What's On Sto |
| report 66 | https://egymonuments.com/details/Pyramids | yes | en | chromium-body | Home About Us FAQ العربية Giza plateau CART TICKET(S) PRICE(S) Other Nationality Egyptian Adult EGP 700 Student EGP 350  |
| report 66 | https://tickets.gem.eg/ | yes | en | chromium-body | OFFICIAL TICKETING WEBSITE En \| عربي WELCOME TO THE GRAND EGYPTIAN MUSEUM WORLD'S LARGEST MUSEUM DEDICATED TO A SINGLE  |
| report 66 | https://egymonuments.com/details/EgyptianMuseum | yes | en | chromium-body | Home About Us FAQ العربية Egyptian Museum CART TICKET(S) PRICE(S) Other Nationality Egyptian Adult EGP 550 Student EGP 2 |
| report 66 | https://egymonuments.com/details/Mosque-MadrassaSultanHassan | yes | en | chromium-body | Home About Us FAQ العربية Mosque- Madrassa Sultan Hassan CART TICKET(S) PRICE(S) Other Nationality Adult EGP 220 Student |
| report 66 | https://www.cairo.gov.eg/en/tourism/tourism-destinations/cultural/khan-al-khalili/ | yes | en | chromium-body | Tuesday, November 24, 2026 06:15 PM 20°C العربية Search Cairo Governorate Electronic Portal Home About Governorate Gover |
| report 66 | https://www.koshary-aboutarek.com/en | yes | en | chromium-body | About Us News Branches Contact Us ع 16011 Welcome To Abou Tarek Empire About Us Read more Visit link Branches Abou Tarek |
| report 66 | https://zoobaeats.com/food | yes | en | chromium-body | Order Find Us Zoobawares TODAY’S EGYPTIAN CUISINE IS THE RESULT OF THOUSANDS OF YEARS OF TRADE AND CULINARY INTRODUCTION |
| report 67 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500745 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 동문재래시장 다양한 먹거리와 상업의 중심, 제주 동문 재래시장 날씨 흐림 6℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 관덕로14길 |
| report 67 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500748 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 제주민속오일시장 제주 현지인의 삶을 가장 잘 말해주는 오일시장 날씨 흐림 7℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 오일장서길  |
| report 67 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500276 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 사라봉 붉은 노을이 온 바다를 물들이는 모습이 아름다운 사라봉 날씨 흐림 6℃ 혼잡도 보통 길찾기 주소 제주특별자치도 제주시 사라봉동길  |
| report 67 | https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500349 | yes | ko | chromium-body | 본문 바로가기 VisitJEJU 관련사이트 로그인 검색 전체메뉴 공유하기 메뉴 성산일출봉 바다 위로 우뚝 솟은 수성 화산체이자 유네스코 세계자연유산 · 천연기념물 제420호 · 제주올레 1코스 날씨 흐림 6℃ 혼잡도 |
| report 68 | https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html | yes | en | chromium-body | Skip to main content Home Share 繁 简 Other Languages Text Size About Us Our Services Online Services Forms Publications & |
| report 68 | https://www.starferry.com.hk/en/service | yes | en | chromium-body | Skip to main content Close Search Ferry Fare Harbour Tour Pier Location Shops STAY Bar Top Shortcut Contact Us Online Sh |
| report 68 | https://temples.tungwahcsd.org/twghs-man-mo-temple?_lang=en | yes | en | chromium-body | Skip to content TWGHs Temple and Cultural Services Website 繁 简 ENG A A A Home Our Temples and Cultural Centres Gods in T |
| report 68 | https://webstore.thepeak.com.hk/?lang=en_us | yes | en | chromium-body | Important Notices Open My Order Contact Us English Tickets & Services The Peak Experience Shop & Dine Heritage Guest Inf |
| report 68 | https://www.tourism.gov.hk/symphony/english/details/details.html | yes | en | chromium-body | Skip to content A A A Details of the Show HONG KONG A SYMPHONY OF LIGHTS "A Symphony of Lights" (SoL) has illuminated Ho |
| report 69 | https://www.bondinho.com.br/en/ | yes | en | chromium-body | Monday to Friday, 8:30 am to 9 pm. Saturdays and Sundays, 7:30 am to 9 pm. Last boarding at 7:30 pm. TICKETS PARK INSTIT |
| report 70 | https://dubaiculture.gov.ae/en/attractions/heritage-sites/al-fahidi-historical-neighbourhood | yes | en | chromium-body | Skip to main content Home What's On About Us Discover Attractions Contact Us العربية Register/Login HERITAGE SITES Al Fa |
| report 70 | https://www.rta.ae/wps/portal/rta/ae/home/promotion/new-marine-routes-abra | yes | en | chromium-body | Press Enter to jump to main content Home Driver and Car Owner Public Transport Business and Corporate People of Determin |
| report 70 | https://experiences.visitdubai.com/en/ | yes | en | chromium-body | We respect your privacy and are committed to being transparent about how our website uses cookies. Cookies enhance your  |
| report 70 | https://thedubaimall.com/en/entertain-detail/dubai-fountain | yes | en | chromium-body | العربية Emaar Gift Card Search WHAT'S NEW SHOP DINE STAY ENTERTAIN PLAN YOUR VISIT SERVICES FASHION AVENUE FOUNTAIN VIEW |
| report 71 | https://www.louvre.fr/en/visit/hours-admission | yes | en | chromium-body | Hours & admission - Plan and book your visit Aller au contenu DEAR VISITORS, This site uses cookies, installed by the Mu |
| report 71 | https://www.sacre-coeur-montmartre.com/en/info-and-visits/practical-information/hours-and-directions/ | yes | en | chromium-body | Skip to content ABOUT MASS & PRAYER AGENDA AND MAJOR CELEBRATIONS GUESTHOUSE AND GROUPS INFOS & VISITS Light a prayer ca |
| report 72 | https://www.evisa.gov.kh/ | yes | en | scanner-institution-fallback | block Web Page Blocked! The page cannot be displayed. Please contact the administrator for additional information. URL:  |
| report 72 | https://www.angkorenterprise.gov.kh/en/available-tickets | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://arrival.gov.kh/ | yes | en | chromium-body | Cambodia e-Arrival Home v-Pass Contact Us Home v-Pass Contact Us English All travelers can submit the Cambodia e-Arrival |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a10149b66c0d6db9be5d3 | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a0ec29b66c0d6db9be544 | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a0dd49b66c0d6db9be44e | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a0e5b9b66c0d6db9be4c7 | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a0cec9b66c0d6db9be37a | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 72 | https://www.angkorenterprise.gov.kh/en/explore/685a0d609b66c0d6db9be3e9 | yes | en | scanner-blocked-official-en | www.angkorenterprise.gov.kh Performing security verification This website uses a security service to protect against mal |
| report 73 | https://www.kiyomizudera.or.jp/en/visit/ | yes | en | chromium-body | PRAY VISIT LEARN LOCATION FAQ NEWS EN JA THE GROUNDS EVENTS & RITUALS I Map of Kiyomizu-dera Temple THE GROUNDS 1Nio mon |
| report 73 | https://www.kiyomizudera.or.jp/en/news/2026/autumn2026.php | yes | en | chromium-body | PRAY VISIT LEARN LOCATION FAQ NEWS EN JA NEWS THE EVENING SPECIAL VISIT autumn 2026 Oct 29, 2026 [ THE EVENING SPECIAL V |
| report 73 | https://www.kiyomizudera.or.jp/en/news/2026/jojuin_autumn2026.php | yes | en | chromium-body | PRAY VISIT LEARN LOCATION FAQ NEWS EN JA NEWS SPECIAL VIEWING OF THE JOJUIN GARDEN autumn 2026 Oct 29, 2026 [ SPECIAL VI |
| report 73 | https://www.tenryuji.com/en/visit/ | yes | en | chromium-body | The official home page of Tenryu-ji, a UNESCO World Heritage site About Tenryu-ji Admission and Access What to See at Te |
| report 73 | https://www.kyoto-nishiki.or.jp/en/access/ | yes | en | chromium-body | Access 〒604-8054 609 Nishidaimonji-cho, Nakagyo-ku, Kyoto-shi, Kyoto Tel: 075-211-3882 (Kyoto Nishiki Market Shopping St |
| report 74 | https://southkorea.embassy.gov.au/seolkorean/ETA601.html | yes | ko | chromium-body | 호주 대사관 대한민국 & 북한 Skip to main content Text size English 한국어 대사관 안내 영사업무 여행, 교역, 유학 호주 소개 행사 안내 뉴스와 미디어 대사관 연락처 ETA 전자방문비 |
| report 74 | https://www.sydneyoperahouse.com/tours/sydney-opera-house-tour | yes | en | chromium-body | Skip to main content Main navigation Sydney Opera House home page What’s on Visit Search site for: Loading Cart Open men |
| report 74 | https://www.botanicgardens.org.au/royal-botanic-garden-sydney/plan-your-visit | yes | en | chromium-body | Skip to navigation Skip to content For schools Our science The Royal Botanic Gardens of Sydney map Map Donate Search Vis |
| report 74 | https://www.therocks.com/whats-on/market-overview | yes | en | chromium-body | Skip to Content Skip to Navigation Skip to Search Page Skip to Sitemap Page Skip to Footer THE ROCKS WHAT'S ON EAT & DRI |
| report 74 | https://transportnsw.info/routes/details/sydney-ferries/f1/090F1 | yes | en | chromium-body | Skip to content Plan Tickets and fares Travel info Regional travel Help and contact Home Routes, stops and timetables Ma |
| report 74 | https://transportnsw.info/travel-info/ways-to-get-around/ferry/how-to-pay-for-your-ferry-trip | yes | en | chromium-body | Skip to main content Plan Tickets and fares Travel info Regional travel Help and contact Home Travel info Ways to get ar |
| report 74 | https://www.sydney.com/things-to-do/nature-and-parks/walks/bondi-to-coogee-coastal-walk | yes | en | chromium-body | You are visiting the Australia site. Switch to United States Dismiss AU Toggle navigation Bondi to Coogee Coastal Walk B |
| report 75 | https://www.veneziaunica.it/en/buy-tickets | yes | en | chromium-body | Città di Venezia EN Plan your Trip Things to do in Venice Buy Online Sustainable Venice Frequent and Resident users Cont |
| report 75 | https://actv.avmspa.it/en/content/venice-urban-services | yes | en | chromium-body | Error 403 Web Page Blocked URL: actv.avmspa.it/en/content/venice-urban-services Client IP: 52.73.250.138 Attack ID: 2000 |
| report 75 | https://tickets.basilicasanmarco.it/en/ | yes | en | chromium-body | Help MONUMENTAL COMPLEX OF THE BASILICA CATHEDRAL OF SAN MARCO IN VENICE OFFICIAL TICKET OFFICE For additional services, |
| report 75 | https://tickets.basilicasanmarco.it/en/support/prices | yes | en | chromium-body | Help EN PRODUCTS INFORMATION SIGN IN / REGISTER 0 HomeInformationFree admission and Discounts FREE ADMISSION AND DISCOUN |
| report 75 | https://muve.vivaticket.it/en/tour/palazzo-ducale/2478 | yes | en | chromium-body | We use cookies This website uses cookies and other tracking technologies to improve your browsing experience for the fol |
| report 75 | https://palazzoducale.visitmuve.it/en/informazioni-pratiche/ | yes | en | chromium-body | SKIP TO MAIN CONTENT Palazzo Ducale EN TICKETS Plan your visit Home > Visit OPENING HOURS SPECIAL OPENINGS TICKETS MAP S |
| report 75 | https://gallerieaccademia.eventim-inhouse.de/ | yes | en | chromium-body | Cookie settings We use cookies to enable the best website-experience for our visitors. In addition third party cookies a |
| report 75 | https://www.gallerieaccademia.it/en/visit/opening-hours-and-tickets/ | yes | en | chromium-body | EN FR IT Visit Experience the Museum Collections Events & Exhibitions Info SUPPORT US SCHOOL Video Player Opening hours  |
| report 75 | https://actv.avmspa.it/en/ | yes | en | chromium-body | Error 403 Web Page Blocked URL: actv.avmspa.it/en/ Client IP: 18.235.67.204 Attack ID: 20000051 Message ID: 006135132745 |
| report 76 | https://www.i815.or.kr/ | yes | ko | chromium-body | 본문 바로가기 독립기념관 전체메뉴보기 Language 닫기 로그인하세요 관람편의시설 전시 디지털기념관 교육·행사 참여 소장자료 학술 소식 소개 정보공개 회원서비스 디지털기념관 장소 대관 캠핑장 함께하는 독립운동 체험 |
| report 76 | https://www.gwangjubiennale.org/gb/exhibition/biennale/visitorinfo.do?subPage=hoursInfo | yes | ko | chromium-body | LANG 전시 행사·프로그램 소식 자료실 재단법인 광주비엔날레 관람안내 전시 제16회 광주비엔날레 관람안내 전시 제16회 광주비엔날레 전시 프로그램 관람안내 제16회 광주비엔날레 파빌리온 지난전시 오시는 길 이용안내 |
| report 76 | https://piff.phcf.or.kr/phcf/festival/submain.do?festival_id=FST_STEEL_2026_001 | yes | ko | chromium-body | 본문으로 바로가기 지역문화예술정보 (축소됨) 대표축제 (축소됨) 문화공간 (축소됨) 문화후원 (축소됨) 공모·참여 (축소됨) 열린광장 (축소됨) 포항문화재단 (축소됨) 포항시립예술단 (축소됨) 로그인 회원가입 유료회 |
| report 77 | https://www.trenitalia.com/en/services/leonardo-express.html | yes | en | chromium-body | Go to main content Group Companies Whistleblowing-report ENG Customer Area About us Connections Offers Services Loyalty  |
| report 77 | https://www.0404.go.kr/bbs/contsPst/MST0000000000117/17/detail | yes | ko | chromium-body | 본문 바로가기 주메뉴 바로가기 안전소식 [인도네시아] 인도네시아 중부칼리만탄주 특별여행주의보 해제 [알바니아] 알바니아 전역에 여행경보 2단계(여행자제) 발령 [인도네시아] 인도네시아 중부칼리만탄주 특별여행주의보 발 |
| report 77 | https://cultura.gov.it/luogo/pantheon | yes | en | chromium-body | Facebook Twitter Instagram Youtube Tiktok Podcast Telefono Ricerca Ministero Attività e Servizi Atti e Normativa Luoghi  |
| report 77 | https://fontanaditrevi.roma.it/ | yes | en | chromium-body | Visit Tickets F.A.Q. How to reach History English The Trevi Fountain, a timeless masterpiece A new access to experience  |
| report 78 | https://www.kiyomizudera.or.jp/en/ | yes | en | chromium-body | PRAY VISIT LEARN LOCATION FAQ NEWS EN JA The eleven faces and forty-two arms of Kannon show great compassion. People hav |
| report 79 | https://tajmahal.gov.in/visiting-hours.aspx | yes | en | chromium-body | Home Visiting Hours & Ticketing Nearby Attractions Agra Beyond Taj Night Viewing Do's & Don'ts Agra Fort Fatehpur Sikri  |
| report 79 | https://agra.nic.in/tourist-place/mehtab-bagh/ | yes | en | chromium-body | उत्तर प्रदेश सरकार GOVERNMENT OF UTTAR PRADESH आगरा AGRA Search Home About District Directory Departments Tourism Docume |
| report 80 | https://bangniangmarket.com/ | yes | en | chromium-body | About Us Contact Us Home Shops Bringing Local Merchants To Tourists in Our Area For more than 17 years, we have had the  |
| report 80 | https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503 | yes | en | chromium-body | Follow us: news.cision.com/ Tourism Authority of Thailand/ 7 best things to do in Khao Lak English 7 best things to do i |
| report 80 | https://thailand.prd.go.th/en/ | yes | en | chromium-body | This content has been suspended with GDCC Security Center to protect your website content URL: thailand.prd.go.th/en/ Me |
| report 80 | https://www.thailandgoodtravel.info/english/ | yes | en | chromium-body | Copy as text Routing Error No route matches [GET] "/english" Rails.root: /rails Application Trace \| Framework Trace \|  |
| report 91 | https://sunworld.vn/en/ | yes | en | chromium-body | Visit Park English About Us Vouchers Experiences News Shows Events Affiliate Contact Us Let's start your vacation! Desti |

## Sample changes (first 120)

| Ref | Label | Action | Old | New | Reason |
|---|---|---|---|---|---|
| 홍콩 · 야경렌즈 (review 0f176b78-cf13-43cf-80d0-f572e7e215b8) | 공식 사이트 | replace | https://www.thepeak.com.hk/en/the-peak-experience/the-sky-terrace-428 | https://webstore.thepeak.com.hk/?lang=en_us | institution-candidate: en=28,other=0;topic=institution-token:1 |
| 울란바토르 · 나란툴 시장과 도심 생활 동선에 맞춘 하루 · 로컬하루 (review 18c5a722-12aa-4324-b252-01ef8b22a0c7) | 공식 페이지 | replace | https://tourism.ub.gov.mn/wp-content/uploads/Ulaanbaatar-korea-2025-2.pdf | https://tourism.ub.gov.mn/ | pdf->home: en=7,other=1;topic=institution-token:1 |
| 오사카 · 흥이난다 (review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f) | 점등 안내 | unwrap | https://hikarimasse.osaka-chushin.fun/ | — | final5: no verified institution page |
| 오사카 · 흥이난다 (review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f) | 크루즈 안내 | replace | https://osaka-info.jp/special/dc/event/detail376/ | https://osaka-info.jp/en/special/dc/event/detail376/ | en: en=180,other=1 |
| 오사카 · 흥이난다 (review 1904e49b-0ef9-4be9-8bb3-da7cd9603c4f) | 공식 안내 | unwrap | https://www.shochiku.co.jp/wp-content/uploads/2025/08/shochiku20250828-1.pdf | — | pdf |
| 타이베이 · 라오허제 야시장 가판 한 끼 · 미식갑니다 (review 1a1dba46-1417-493a-832b-e1b244ebd9f9) | 시장처 안내 | unwrap | https://www.tcma.gov.taipei/News_Content.aspx?n=FAC14AD2DE4E01A4&s=0CFD6ED2C96E9CC4&sms=32F7BA052C5CA548 | — | final5: no verified institution page |
| 타이베이 · 라오허제 야시장 가판 한 끼 · 미식갑니다 (review 1a1dba46-1417-493a-832b-e1b244ebd9f9) | 시장처 점포 | unwrap | https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=FA645AE0684F4CBC&sms=E5D0A9B8CEF9D29F | — | final5: no verified institution page |
| 타이베이 · 라오허제 야시장 가판 한 끼 · 미식갑니다 (review 1a1dba46-1417-493a-832b-e1b244ebd9f9) | 시장처 점포 | unwrap | https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=93592B425F56FEBB&sms=E5D0A9B8CEF9D29F | — | final5: no verified institution page |
| 요코하마 · 하케이지마 시파라다이스 아이 동반 실내 반나절 · 가족나들이 (review 1aad326e-a37f-40d8-95ca-f31847c494dd) | 공식 사이트 | unwrap | https://www.seaparadise.co.jp/institution/index.html | — | final5: no verified institution page |
| 요코하마 · 하케이지마 시파라다이스 아이 동반 실내 반나절 · 가족나들이 (review 1aad326e-a37f-40d8-95ca-f31847c494dd) | 베비칼 | replace | https://babycal-jre.com/ | https://babycal-jre.com/en/ | en: en=75,other=0 |
| 사파 · 고령 부모님과 판시판을 탈것으로 오르는 하루 · 가족나들이 (review 233fa36d-4378-499a-b96f-3e4ae5281896) | 공식 안내 | replace | https://sunworld.vn/vi/fansipan/di-chuyen/lo-trinh-tham-quan-fansipan-chi-tiet-tu-a-den-z-29945 | https://sunworld.vn/en/ | en: en=90,other=9 |
| 가나자와 · 겐로쿠엔과 히가시차야 골목의 느린 산책 · 느린산책 (review 2a7dab01-bfd8-4946-8a48-f3c0749b5269) | 겐로쿠엔 공식 | unwrap | https://www.pref.ishikawa.jp/siro-niwa/kenrokuen/ | — | final5: no verified institution page |
| 가나자와 · 겐로쿠엔과 히가시차야 골목의 느린 산책 · 느린산책 (review 2a7dab01-bfd8-4946-8a48-f3c0749b5269) | 히가시차야 안내 | unwrap | https://www.kanazawa-kankoukyoukai.or.jp/higashi | — | final5: no verified institution page |
| 가나자와 · 겐로쿠엔과 히가시차야 골목의 느린 산책 · 느린산책 (review 2a7dab01-bfd8-4946-8a48-f3c0749b5269) | 교통 안내 | unwrap | https://www.kanazawa-kankoukyoukai.or.jp/spot/detail_10212.html | — | final5: no verified institution page |
| 오사카 · 미식갑니다 (review 2e1d1d1b-45ae-4e33-8016-c925186692a1) | 공식 사이트 | unwrap | https://www.mizuno-osaka.com/ | — | final5: no verified institution page |
| 오사카 · 미식갑니다 (review 2e1d1d1b-45ae-4e33-8016-c925186692a1) | 타베로그 | replace | https://tabelog.com/osaka/A2701/A270202/27001546/ | https://tabelog.com/en/ | en: en=7,other=1 |
| 파리 · 느린산책 (review 2eabdcda-9aa3-45b1-9800-e2b52958a342) | 공식 안내 | unwrap | https://www.paris.fr/lieux/square-louis-xiii-36 | — | final5: no verified institution page |
| 파리 · 느린산책 (review 2eabdcda-9aa3-45b1-9800-e2b52958a342) | 공식 사이트 | unwrap | https://paris-carette.fr/nos-magasins/place-des-vosges/ | — | final5: no verified institution page |
| 파리 · 느린산책 (review 2eabdcda-9aa3-45b1-9800-e2b52958a342) | 공식 사이트 | unwrap | https://www.hotel-de-sully.fr/ | — | final5: no verified institution page |
| 파리 · 느린산책 (review 2eabdcda-9aa3-45b1-9800-e2b52958a342) | 온라인 예약 | unwrap | https://www.hotel-de-sully.fr/visiter/visites-et-activites | — | final5: no verified institution page |
| 프라하 · 느린산책 (review 2f5b5725-00d1-45a0-a9d3-01cd73716656) | 공식 안내 | replace | https://prague.eu/cs/objevujte/zahrada-kinskych/ | https://prague.eu/en/objevujte/zahrada-kinskych/ | en: en=18,other=6 |
| 카이로 · 미식갑니다 (review 2fc0c1c5-0d8a-40a0-90f0-ef09858f894d) | 공식 사이트 | unwrap | https://zoobaeats.com/ | — | final5: no verified institution page |
| 자카르타 · 글로독 코피 에스 탁키 · 코타 투아 카페 바타비아 · 미식갑니다 (review 33676179-a5fc-451d-b373-8fba35e0ccd0) | 관광 안내 | unwrap | https://enjoy.jakarta.go.id/article/kopi-es-takkie | — | final5: no verified institution page |
| 파리 · 야경렌즈 (review 33755302-e121-4231-9b5e-dc312350cabb) | 티켓 예매 | unwrap | https://tickets.monuments-nationaux.fr/en-GB/families?site=2032863779450400197 | — | final5: no verified institution page |
| 파리 · 야경렌즈 (review 33755302-e121-4231-9b5e-dc312350cabb) | 티켓 예매 | unwrap | https://ticket.toureiffel.paris/en | — | final5: no verified institution page |
| 파리 · 야경렌즈 (review 33755302-e121-4231-9b5e-dc312350cabb) | 공식 캘린더 | unwrap | https://www.toureiffel.paris/en/rates-opening-times | — | final5: no verified institution page |
| 워싱턴 DC · 국립 미국사 박물관과 메트로 엘리베이터 · 문턱없이 (review 373efece-464b-4134-a50e-0233f597543b) | 접근성 안내 | unwrap | https://americanhistory.si.edu/visit/accessibility | — | final5: no verified institution page |
| 교토 · 느린산책 (review 4181696e-e4f4-40c9-9c04-51dd5f23825f) | 공식 사이트 | unwrap | https://www.keibunsha-store.com/ | — | final5: no verified institution page |
| 리스본 · 야경렌즈 (review 42f01dc5-b9e3-4c8a-9330-324f237a97af) | 12E 트램 | replace | https://www.carris.pt/en/travel/carreiras/12e/ | https://www.carris.pt/en/ | en: en=10,other=0 |
| 로마 · 야경렌즈 (review 43292c6e-8f0f-4fa1-97f8-59d3329e5b29) | 메트로 B선 콜로세오 역 | replace | https://parcocolosseo.it/en/visit/how-to-get-here/ | https://parcocolosseo.it/en/ | en: en=116,other=10 |
| 베니스 · 야경렌즈 (review 44178bf5-e46c-48f6-8781-532835d850bc) | 레덴토레 성당과 치텔레 성당이 물을 마주하고 서 있어요 | replace | https://www.italia.it/it/veneto/venezia/isola-della-giudecca | https://www.italia.it/en/veneto/venezia/isola-della-giudecca | en: en=24,other=0 |
| 베니스 · 야경렌즈 (review 44178bf5-e46c-48f6-8781-532835d850bc) | 2번 시간표 | replace | https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_2.pdf | https://actv.avmspa.it/en/ | pdf->home: en=5,other=0;topic=institution-token:1 |
| 베니스 · 야경렌즈 (review 44178bf5-e46c-48f6-8781-532835d850bc) | 대운하를 한 아치로 건너는 흰 돌다리예요 | replace | https://www.italia.it/it/veneto/venezia/ponte-di-rialto | https://www.italia.it/en/veneto/venezia/ponte-di-rialto | en: en=24,other=0 |
| 베니스 · 야경렌즈 (review 44178bf5-e46c-48f6-8781-532835d850bc) | 1번 시간표 | replace | https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_1.pdf | https://actv.avmspa.it/en/ | pdf->home: en=5,other=0;topic=institution-token:1 |
| 세비야 · 트리아나 시장 하몬과 타파스 · 미식갑니다 (review 45fcae82-f643-4155-a7d9-ea3e9f18fe70) | 공식 누리집 | unwrap | https://mercadodetrianasevilla.com/horarios/ | — | final5: no verified institution page |
| 세비야 · 트리아나 시장 하몬과 타파스 · 미식갑니다 (review 45fcae82-f643-4155-a7d9-ea3e9f18fe70) | 가판 안내 | unwrap | https://mercadodetrianasevilla.com/comercio/bar-la-muralla/ | — | final5: no verified institution page |
| 세비야 · 트리아나 시장 하몬과 타파스 · 미식갑니다 (review 45fcae82-f643-4155-a7d9-ea3e9f18fe70) | 하몬 안내 | unwrap | https://mercadodetrianasevilla.com/comercio/jamoneria-jose-luis-romero/ | — | final5: no verified institution page |
| 후쿠오카 · 나카스 야타이 국물과 한입 교자 · 미식갑니다 (review 4616d9a7-2d50-4d26-8129-762906196952) | 영업 규칙 | replace | https://www.city.fukuoka.lg.jp/keizai/yatai/shisei/documents/01_rule.pdf | https://www.city.fukuoka.lg.jp/english/ | pdf->home: en=21,other=0;topic=institution-token:2 |
| 후쿠오카 · 나카스 야타이 국물과 한입 교자 · 미식갑니다 (review 4616d9a7-2d50-4d26-8129-762906196952) | 시 관광 소개 | replace | https://yokanavi.com/features/260529 | https://yokanavi.com/en/ | institution-candidate: en=120,other=0;topic=institution-markers |
| 후쿠오카 · 나카스 야타이 국물과 한입 교자 · 미식갑니다 (review 4616d9a7-2d50-4d26-8129-762906196952) | 시 관광 특집 | replace | https://yokanavi.com/features/260602 | https://yokanavi.com/en/ | institution-candidate: en=120,other=0;topic=institution-markers |
| 바르셀로나 · 느린산책 (review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a) | 공식 안내 | replace | https://www.barcelona.cat/capitalmundialarquitectura/ca/espai/placa-de-la-vila-de-gracia | https://www.barcelona.cat/en/ | institution-candidate: en=88,other=2;topic=institution-token:1 |
| 바르셀로나 · 느린산책 (review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a) | 공식 사이트 | unwrap | https://www.llibrerialamemoria.com/ | — | final5: no verified institution page |
| 바르셀로나 · 느린산책 (review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a) | 공식 사이트 | unwrap | https://terrabartrobada.com/ | — | final5: no verified institution page |
| 방콕 · 흥이난다 (review 5291c187-f13b-4139-9376-8af5eb72a618) | 공식 안내 | unwrap | https://www.tourismthailand.org/Attraction/khao-san-road | — | final5: no verified institution page |
| 파리 · 로컬하루 (review 57649f3d-550c-400c-b616-cd28dc7359af) | 공식 안내 | unwrap | https://www.paris.fr/lieux/marche-belleville-5475 | — | final5: no verified institution page |
| 파리 · 로컬하루 (review 57649f3d-550c-400c-b616-cd28dc7359af) | 공식 안내 | unwrap | https://www.paris.fr/lieux/marche-menilmontant-5478 | — | final5: no verified institution page |
| 파리 · 로컬하루 (review 57649f3d-550c-400c-b616-cd28dc7359af) | 공식 안내 | unwrap | https://www.paris.fr/lieux/marche-pyrenees-5533 | — | final5: no verified institution page |
| 파리 · 로컬하루 (review 57649f3d-550c-400c-b616-cd28dc7359af) | 공식 안내 | unwrap | https://www.paris.fr/lieux/parc-de-belleville-1777 | — | final5: no verified institution page |
| 시드니 · 야경렌즈 (review 5b4c6c81-147a-4e06-a18a-35b3368f4f35) | 공식 사이트 | unwrap | https://www.northsydney.nsw.gov.au/directory-record/1385/bradfield-park | — | final5: no verified institution page |
| 시드니 · 야경렌즈 (review 5b4c6c81-147a-4e06-a18a-35b3368f4f35) | 공식 시간표 | replace | https://transportnsw.info/documents/timetables/93-F4-Pyrmont-Bay-20260614.pdf | https://transportnsw.info/ | pdf->home: en=63,other=3;topic=institution-markers |
| 카오락 · 어촌의 바다 일과 읍내·장터의 하루 · 로컬하루 (review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc) | 추모공원 안내 | replace | https://thailand.prd.go.th/en/content/category/detail/id/52/iid/351342 | https://thailand.prd.go.th/en/ | institution-candidate: en=8,other=0;topic=institution-token:1 |
| 카오락 · 어촌의 바다 일과 읍내·장터의 하루 · 로컬하루 (review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc) | 정부 공보 | replace | https://thailand.prd.go.th/en/content/category/detail/id/52/iid/351342 | https://thailand.prd.go.th/en/ | institution-candidate: en=8,other=0;topic=institution-token:1 |
| 카오락 · 어촌의 바다 일과 읍내·장터의 하루 · 로컬하루 (review 5d40e738-6d2b-4ec7-8a1a-5b40517023fc) | 올드타운 안내 | replace | https://www.thailandgoodtravel.info/?locale=en | https://www.thailandgoodtravel.info/english/ | institution-candidate: en=5,other=0;topic=institution-token:1 |
| 카오락 · 해 질 녘 물가에서 폭포 웅덩이까지 느리게 · 느린산책 (review 5f9cc144-1af2-432f-8dc9-05353bfb8bd8) | 추모공원 안내 | replace | https://thailand.prd.go.th/en/content/category/detail/id/52/iid/351342 | https://thailand.prd.go.th/en/ | institution-candidate: en=8,other=0;topic=institution-token:1 |
| 카오락 · 해 질 녘 물가에서 폭포 웅덩이까지 느리게 · 느린산책 (review 5f9cc144-1af2-432f-8dc9-05353bfb8bd8) | 올드타운 안내 | replace | https://www.thailandgoodtravel.info/?locale=en | https://www.thailandgoodtravel.info/english/ | institution-candidate: en=5,other=0;topic=institution-token:1 |
| 교토 · 가족나들이 (review 615587ff-f3a1-47db-98b4-4259dc4acd2c) | 공식 사이트 | replace | https://www.kiyomizudera.or.jp/ | https://www.kiyomizudera.or.jp/en/ | institution-candidate: en=81,other=0;topic=institution-markers |
| 교토 · 가족나들이 (review 615587ff-f3a1-47db-98b4-4259dc4acd2c) | 공식 안내 | unwrap | https://www2.city.kyoto.lg.jp/kotsu/webguide/ja/bus/limited_express.html | — | final5: no verified institution page |
| 파리 · 시내 버스로 가는 오르세 미술관 이동 지원 · 문턱없이 (review 62190bb0-b77d-4485-9e83-98ec5e3d85f6) | 공식 안내 | unwrap | https://parisjetaime.com/eng/culture/musee-d-orsay-p3592 | — | final5: no verified institution page |
| 오클랜드 · 박물관 사우스 아트리움과 휠체어 접근 · 문턱없이 (review 627f6fd9-b8a9-452e-8d0c-b48ec0b8264f) | 접근성 안내 | unwrap | https://www.aucklandmuseum.com/visit/visit-plan-your-visit/visit-plan-your-visit-access | — | final5: no verified institution page |
| 파리 · 흥이난다 (review 669c2eea-23fa-4929-84d9-6a715d256574) | 공식 사이트 | replace | https://www.balajo.fr/le-balajo | https://www.balajo.fr/en/ | institution-candidate: en=56,other=1;topic=institution-token:1 |
| 파리 · 흥이난다 (review 669c2eea-23fa-4929-84d9-6a715d256574) | 온라인 예약 | unwrap | https://www.lecafecharbon.fr/ | — | final5: no verified institution page |
| 파리 · 흥이난다 (review 669c2eea-23fa-4929-84d9-6a715d256574) | 온라인 예약 | unwrap | https://leperchoir.fr/location/le-perchoir-menilmontant/ | — | final5: no verified institution page |
| 나라 · 요시키엔에서 우키미도까지 나라 공원 한 방향 산책 · 느린산책 (review 69ccdad9-3f26-4b66-939f-9986375f5303) | 공식 안내 | unwrap | https://www.pref.nara.lg.jp/n113/39910.html | — | final5: no verified institution page |
| 나라 · 요시키엔에서 우키미도까지 나라 공원 한 방향 산책 · 느린산책 (review 69ccdad9-3f26-4b66-939f-9986375f5303) | 공원 안내 | unwrap | https://www.pref.nara.lg.jp/site/park/2590.html | — | final5: no verified institution page |
| 나라 · 요시키엔에서 우키미도까지 나라 공원 한 방향 산책 · 느린산책 (review 69ccdad9-3f26-4b66-939f-9986375f5303) | 관광 안내 | unwrap | https://yamatoji.nara-kankou.or.jp/02nature/07park/01north_area/ukimido/ | — | final5: no verified institution page |
| 나라 · 요시키엔에서 우키미도까지 나라 공원 한 방향 산책 · 느린산책 (review 69ccdad9-3f26-4b66-939f-9986375f5303) | 사슴 안내 | unwrap | https://www.pref.nara.lg.jp/site/park/1232.html | — | final5: no verified institution page |
| 방콕 · 미식갑니다 (review 6ec03e36-347a-4ce7-8fa4-1c59aa376fca) | 공식 안내 | unwrap | https://www.tourismthailand.org/Attraction/chatuchak-weekend-market | — | final5: no verified institution page |
| 베를린 · 흥이난다 (review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24) | 공식 안내 | replace | https://www.unesco.de/staette/technokultur-in-berlin/ | https://www.unesco.de/en | institution-candidate: en=115,other=0;topic=institution-token:1 |
| 베를린 · 흥이난다 (review 7315cf26-78f3-4c92-9ee7-ac5dc9c15b24) | 행사 일정 | replace | https://raw-gelaende.de/ | https://raw-gelaende.de/en/ | institution-candidate: en=27,other=18;topic=institution-token:1 |
| 후에 · 동바 시장과 향강 강변 일상 · 로컬하루 (review 7c31a683-e627-4b7a-8ad1-99b21e10273e) | 공식 페이지 | replace | https://vietnamtourism.vn/index.php/tourism/items/491 | https://vietnamtourism.vn/en/ | institution-candidate: en=3,other=0,latin=271;topic=institution-token:1 |
| 이스탄불 · 야경렌즈 (review 81be5176-9eac-41f9-b19e-1382cc773a38) | 시히르 하틀라르 페리 | unwrap | https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/istanbul-ici-hatlar/uskudar-karakoy-eminonu-164 | — | final5: no verified institution page |
| 브리즈번 · QAG·GOMA 휠체어 입구와 대여 · 문턱없이 (review 858cb2df-da5d-4c3e-b548-43551909b681) | 오시는 길 | unwrap | https://www.qagoma.qld.gov.au/visit/getting-here-and-parking | — | final5: no verified institution page |
| 마라케시 · 제마 엘프나 광장과 세마린 수크에 맞춘 동네 하루 · 로컬하루 (review 8ad80577-2563-4d45-bb51-e08c52205091) | 공식 페이지 | unwrap | https://ich.unesco.org/en/RL/cultural-space-of-jemaa-el-fna-square-00014 | — | final5: no verified institution page |
| 방콕 · 느린산책 (review 8d31f6e0-1c38-4452-a47f-0c49cdb4e0c9) | 공식 안내 | unwrap | https://www.tourismthailand.org/Attraction/lumpini-park | — | final5: no verified institution page |
| 방콕 · 느린산책 (review 8d31f6e0-1c38-4452-a47f-0c49cdb4e0c9) | 공식 안내 | unwrap | https://www.tourismthailand.org/Attraction/wat-ratchanatdaram-worawihan-loha-prasat | — | final5: no verified institution page |
| 파리 · 미식갑니다 (review 8e4e0384-1110-453c-954a-d29dfbe121a4) | 공식 사이트 | unwrap | https://stohrer.fr/ | — | final5: no verified institution page |
| 파리 · 미식갑니다 (review 8e4e0384-1110-453c-954a-d29dfbe121a4) | 공식 사이트 | replace | https://www.pieddecochon.com/ | https://www.pieddecochon.com/en/ | institution-candidate: en=89,other=4;topic=institution-markers |
| 아이투타키 · 흥이난다 (review 91ab5557-db37-4dff-b809-60a4d7a753a6) | 관광청 안내 | unwrap | https://cookislands.travel/islands/aitutaki | — | final5: no verified institution page |
| 아이투타키 · 흥이난다 (review 91ab5557-db37-4dff-b809-60a4d7a753a6) | 크루즈 안내 | unwrap | https://cookislands.travel/supplier/vaka-cruise | — | final5: no verified institution page |
| 아이투타키 · 흥이난다 (review 91ab5557-db37-4dff-b809-60a4d7a753a6) | 당일 투어 | unwrap | https://cookislands.travel/supplier/aitutaki-day-tour | — | final5: no verified institution page |
| 아이투타키 · 흥이난다 (review 91ab5557-db37-4dff-b809-60a4d7a753a6) | 공연표 | unwrap | https://cookislands.travel/experiences/arts-culture/island-nights | — | final5: no verified institution page |
| 아이투타키 · 흥이난다 (review 91ab5557-db37-4dff-b809-60a4d7a753a6) | 일요일 크루즈 | unwrap | https://cookislands.travel/supplier/kia-orana-cruise-aitutaki | — | final5: no verified institution page |
| 라스베이거스 · 야경렌즈 (review 9a6c6bb5-f153-47d5-a3bf-7cff51bb2bc6) | 분수는 무료이고, 월~금은 오후 3시부터 7시 30분까지 30분 간격, 오후 8시부터 자정까지 15분 간격으로 올라가요. 토·일·공휴일은 낮 12시부터 7시 30분까지 30분 간격이고, 저녁 간격은 같아요. 야외 공연은 날씨 때문에 취소될 수 있어요. | unwrap | https://bellagio.mgmresorts.com/en/entertainment/fountains-of-bellagio.html | — | final5: no verified institution page |
| 라스베이거스 · 야경렌즈 (review 9a6c6bb5-f153-47d5-a3bf-7cff51bb2bc6) | STRAT에서 만달레이 베이까지 약 4.5마일이라, 한 번에 다 걷지 말고 분수 일대만 짧게 걷는 편이 좋아요. 2026년에는 미드스트립 공사로 붐비는 저녁에 병목이 생겨요. | unwrap | https://www.visitlasvegas.com/experience/post/walking-the-las-vegas-strip/ | — | final5: no verified institution page |
| 라스베이거스 · 야경렌즈 (review 9a6c6bb5-f153-47d5-a3bf-7cff51bb2bc6) | 라스베이거스 대로를 따라 사우스 스트립 터미널에서 프리몬트 스트리트까지, 하루 종일 밤에도 다녀요. | unwrap | https://www.visitlasvegas.com/plan/getting-here-and-around/maps/ | — | final5: no verified institution page |
| 친퀘테레 · 비아 델라모레 한 구간과 마나롤라 · 느린산책 (review 9b7bf10f-0d82-4574-81db-511a750f9ed6) | 이용 안내 | unwrap | https://www.parconazionale5terre.it/pagina.php?id=480 | — | final5: no verified institution page |
| 친퀘테레 · 비아 델라모레 한 구간과 마나롤라 · 느린산책 (review 9b7bf10f-0d82-4574-81db-511a750f9ed6) | 카드·예약 | unwrap | https://card.parconazionale5terre.it | — | no strict KO/EN body |
| 친퀘테레 · 비아 델라모레 한 구간과 마나롤라 · 느린산책 (review 9b7bf10f-0d82-4574-81db-511a750f9ed6) | 산책로 현황 | unwrap | https://www.parconazionale5terre.it/rete-sentieristica.php | — | final5: no verified institution page |
| 프라하 · 야경렌즈 (review a105c4bd-ec63-41f8-96dc-63531d43dd70) | 공식 안내 | unwrap | https://prague.eu/en/objevujte/charles-bridge-karluv-most/ | — | no strict KO/EN body |
| 프라하 · 야경렌즈 (review a105c4bd-ec63-41f8-96dc-63531d43dd70) | 공식 사이트 | unwrap | https://www.hrad.cz/en/prague-castle-for-visitors/opening-hours | — | final5: no verified institution page |
| 비엔티안 · 메콩 강변 야시장과 해 질 녘 산책로 · 로컬하루 (review a2fd93bc-9e32-4273-a9a1-d934251fddf6) | 공식 페이지 | unwrap | https://www.tourismlaos.org/central-provinces/vientiane-capital/ | — | no strict KO/EN body |
| 랑카위 · 스카이캡 가족·고령 부모 동선 · 가족나들이 (review a4db6a1c-4e6a-47d7-9073-78bccbdce8eb) | 공식 사이트 | unwrap | https://panoramalangkawi.com/skycab/ | — | no strict KO/EN body |
| 수원화성 · 야경렌즈 (review a9e7d546-7b70-47ce-bea1-362f36d12156) | 상시 개방·무료이고 야간에도 관람할 수 있어요 | unwrap | https://www.suwon.go.kr/sw-www/sw-visitsuwon/sw-visitsuwon-01/sw-visitsuwon-01-01/sw-visitsuwon-01-01-01.jsp | — | no strict KO/EN body |
| 수원화성 · 야경렌즈 (review a9e7d546-7b70-47ce-bea1-362f36d12156) | 성벽이 꺾이는 곳에 선 벽돌 3층 망루 | unwrap | https://www.swcf.or.kr/?idx=41&listGubun=list&p=59&page=1&viewMode=view | — | no strict KO/EN body |
| 수원화성 · 야경렌즈 (review a9e7d546-7b70-47ce-bea1-362f36d12156) | 두 성문 사이에 성벽과 나란한 공원 길이 이어져요 | unwrap | https://jangan.suwon.go.kr/sub_view.asp?menu_id=sub040902 | — | no strict KO/EN body |
| 호놀룰루 · 와이키키 쿠히오 해변 접근 매트 · 문턱없이 (review ad886f5a-d80f-46ed-ad19-fba95d11d82b) | 공식 안내 | unwrap | https://www.honolulu.gov/dpr/therapeutic-recreation-beach-wheelchairs/ | — | no strict KO/EN body |
| 멜버른 · 페더레이션 스퀘어·NGV 인터내셔널 각각의 이동 지원 접근 · 문턱없이 (review b36645a1-a6e8-4bd1-bbbc-1cb80ac0e305) | 접근성 안내 | unwrap | https://fedsquare.com/accessibility | — | no strict KO/EN body |
| 멜버른 · 페더레이션 스퀘어·NGV 인터내셔널 각각의 이동 지원 접근 · 문턱없이 (review b36645a1-a6e8-4bd1-bbbc-1cb80ac0e305) | 공식 안내 | unwrap | https://www.ngv.vic.gov.au/plan-your-visit/access/ | — | no strict KO/EN body |
| 리우데자네이루 · 흥이난다 (review b6bb0a1d-0481-4a1e-91b2-5d46c8841026) | 공식 사이트 | unwrap | https://www.rioscenarium.com.br/ | — | final5: no verified institution page |
| 리우데자네이루 · 흥이난다 (review b6bb0a1d-0481-4a1e-91b2-5d46c8841026) | 티켓 예매 | unwrap | https://site.bileto.sympla.com.br/rioscenarium/ | — | no strict KO/EN body |
| 리우데자네이루 · 흥이난다 (review b6bb0a1d-0481-4a1e-91b2-5d46c8841026) | 공식 사이트 | unwrap | https://www.barcariocadagema.com.br/ | — | final5: no verified institution page |
| 리우데자네이루 · 흥이난다 (review b6bb0a1d-0481-4a1e-91b2-5d46c8841026) | 공식 일정표 | unwrap | https://www.circovoador.com.br/ | — | final5: no verified institution page |
| 리우데자네이루 · 흥이난다 (review b6bb0a1d-0481-4a1e-91b2-5d46c8841026) | 공식 안내 | unwrap | https://visitrio.com.br/lapa-o-coracao-da-vida-noturna-do-rio/ | — | final5: no verified institution page |
| 프라하 · 흥이난다 (review b764795c-a1c9-45ff-985e-5f2fc3b1db81) | 공식 사이트 | unwrap | https://ufleku.cz/ | — | no strict KO/EN body |
| 방콕 · 로컬하루 (review bb1b738b-9cca-4b7d-a662-56d94996e156) | 공식 안내 | unwrap | https://www.tourismthailand.org/Attraction/nang-loeng-market | — | final5: no verified institution page |
| 오키나와 · 추라우미 수족관 아이 동반 반나절 · 가족나들이 (review bd1326b5-190b-4da9-b3b7-a9a48a9f58cd) | 공식 사이트 | unwrap | https://churaumi.okinawa/kr/ | — | no strict KO/EN body |
| 교토 · 미식갑니다 (review bf044b52-27cb-47bf-a6cd-d26a2596f52f) | 공식 사이트 | unwrap | https://www.kyoto-nishiki.or.jp/ | — | no strict KO/EN body |
| 교토 · 미식갑니다 (review bf044b52-27cb-47bf-a6cd-d26a2596f52f) | 공식 페이지 | unwrap | https://www.kyoto-nishiki.or.jp/stores/mikikeiran/ | — | no strict KO/EN body |
| 교토 · 미식갑니다 (review bf044b52-27cb-47bf-a6cd-d26a2596f52f) | 공식 페이지 | unwrap | https://www.kyoto-nishiki.or.jp/stores/yubakichi/ | — | no strict KO/EN body |
| 교토 · 미식갑니다 (review bf044b52-27cb-47bf-a6cd-d26a2596f52f) | 공식 페이지 | unwrap | https://www.kyoto-nishiki.or.jp/stores/karikarihakase/ | — | no strict KO/EN body |
| 카오락 · 완안칸·끄라창 카오락·방니앙 시장 길거리 음식 · 미식갑니다 (review bf8d3588-fbf4-4869-8ba4-52d9279cd4ff) | 관광청 소개 | unwrap | https://waankarn.com/ | — | no strict KO/EN body |
| 카오락 · 완안칸·끄라창 카오락·방니앙 시장 길거리 음식 · 미식갑니다 (review bf8d3588-fbf4-4869-8ba4-52d9279cd4ff) | 미쉐린 가이드 | unwrap | https://guide.michelin.com/th/en/th-phang-nga-region/th-phang-nga/restaurant/krachang-khao-lak | — | no strict KO/EN body |
| 사이판 · 마이크로 비치·아메리칸 메모리얼 파크 가족 반나절 · 가족나들이 (review bfafebe0-f975-4480-96ec-c3d51037692d) | 공식 사이트 | unwrap | https://www.nps.gov/amme/planyourvisit/index.htm | — | no strict KO/EN body |
| 바르셀로나 · 로컬하루 (review c0367f6b-57fc-4353-a1b5-7d177aaf1848) | 공식 사이트 | unwrap | https://www.mercatllibertat.cat/ | — | final5: no verified institution page |
| 보홀 · 타르시에 생추어리와 초콜릿 힐 가족 이동 · 가족나들이 (review c173ad14-1b92-4147-bb7f-b12a6d907bdf) | 공식 안내 | unwrap | https://tourism.bohol.gov.ph/corella-2/ | — | no strict KO/EN body |
| 보홀 · 타르시에 생추어리와 초콜릿 힐 가족 이동 · 가족나들이 (review c173ad14-1b92-4147-bb7f-b12a6d907bdf) | 공식 안내 | unwrap | https://tourism.bohol.gov.ph/visitbohol-carmen/ | — | no strict KO/EN body |
| 고창 갯벌 · 람사르고창갯벌센터 아이 동반 반나절 · 가족나들이 (review c7cdcf9e-aa70-45ac-bdb4-148f2b485751) | 공식 사이트 | unwrap | https://www.gochang.go.kr/tidalflat/index.gochang | — | no strict KO/EN body |
| 고창 갯벌 · 람사르고창갯벌센터 아이 동반 반나절 · 가족나들이 (review c7cdcf9e-aa70-45ac-bdb4-148f2b485751) | 국립해양조사원 | unwrap | https://www.khoa.go.kr/ | — | no strict KO/EN body |
| 나트랑 · VinWonders 시월드 아이 동반 실내 반나절 · 가족나들이 (review c813dbfd-9028-47e7-8ccf-550d138b85e3) | 공식 사이트 | unwrap | https://vinwonders.com/en/vinwonders-nha-trang/ | — | no strict KO/EN body |
| 제주 · 문턱없이 (review c88f7609-850d-4c20-b05d-ba4e12b0d737) | 공식 안내 | replace | https://hallatrail.or.kr/salyeonisup | https://hallatrail.or.kr/en/ | ko: hangul=72 |
