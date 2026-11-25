# GATEO full-corpus link audit — **final7**

Policy: unverified ≠ non-official; unwrap **third-party** or **confirmed dead** (404/410/soft-404) only; timeouts/403/bot walls → retry then **keep**. MD5 guard = raw `content` (no trim).

Corpus read at (live Supabase): **2026-11-25T06:26:55.202Z**

Corpus: **155** reviews + **40** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 312 |
| URL decisions: keep + language label | 29 |
| URL decisions: replace | 46 |
| URL decisions: unwrap | 11 |
| SQL rows (place_reviews) | 34 |
| SQL rows (reports) | 15 |
| Post-corpus scan URLs | 411 |
| Post-corpus issues | 141 |

## Unwrap table (full)

| URL | Row(s) | Category | Evidence |
|---|---|---|---|
| https://gleebooks.com.au/ | review 04c02248-d84b-4d39-bdaa-4a9f008ec48c | non-official | gleebooks.com.au |
| https://tabelog.com/osaka/A2701/A270202/27001546/ | review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | non-official | tabelog.com |
| https://zoobaeats.com/ | review 2fc0c1c5-0d8a-40a0-90f0-ef09858f894d | non-official | zoobaeats.com |
| https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri | review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | dead | HTTP 404 |
| https://parisjetaime.com/eng/culture/musee-d-orsay-p3592 | review 62190bb0-b77d-4485-9e83-98ec5e3d85f6 | non-official | parisjetaime.com |
| https://zoobaeats.com/food | report 66 | non-official | zoobaeats.com |
| https://thesool.com/front/publication/M000000064/view.do?bbsId=A000000042&publicationId=C000003554 | report 76 | non-official | thesool.com |
| https://www.beritajakarta.id/potret-jakarta/album/19996/pemprov-dki-kembali-lakukan-perawatan-tugu-monas | report 81 | non-official | www.beritajakarta.id |
| https://vr.com.vn/tin-tuc/tuyen-duong-sat-ha-noi-lao-cai-tang-len-3-doi-tau-khach-moi-ngay | report 91 | non-official | vr.com.vn |
| https://commons.wikimedia.org/wiki/User:Irisgazer | report 93 | dead | HTTP 404 |
| https://commons.wikimedia.org/wiki/User:Saigen_Jiro | report 93 | non-official | commons.wikimedia.org |

## Keep + language label

- https://www.tcma.gov.taipei/News_Content.aspx?n=FAC14AD2DE4E01A4&s=0CFD6ED2C96E9CC4&sms=32F7BA052C5CA548 — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=FA645AE0684F4CBC&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=93592B425F56FEBB&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.paris.fr/lieux/square-louis-xiii-36 — (프랑스어)
- https://www.hotel-de-sully.fr/ — (프랑스어)
- https://www.hotel-de-sully.fr/visiter/visites-et-activites — (프랑스어)
- https://mercadodetrianasevilla.com/horarios/ — (스페인어)
- https://mercadodetrianasevilla.com/comercio/bar-la-muralla/ — (스페인어)
- https://mercadodetrianasevilla.com/comercio/jamoneria-jose-luis-romero/ — (스페인어)
- https://www.paris.fr/lieux/marche-belleville-5475 — (프랑스어)
- https://www.paris.fr/lieux/marche-menilmontant-5478 — (프랑스어)
- https://www.paris.fr/lieux/marche-pyrenees-5533 — (프랑스어)
- https://www.paris.fr/lieux/parc-de-belleville-1777 — (프랑스어)
- https://www2.city.kyoto.lg.jp/kotsu/webguide/ja/bus/limited_express.html — (일본어)
- https://leperchoir.fr/location/le-perchoir-menilmontant/ — (프랑스어)
- https://www.pref.nara.lg.jp/n113/39910.html — (일본어)
- https://www.pref.nara.lg.jp/site/park/2590.html — (일본어)
- https://www.pref.nara.lg.jp/site/park/1232.html — (일본어)
- https://www.parconazionale5terre.it/pagina.php?id=480 — (이탈리아어)
- https://www.parconazionale5terre.it/rete-sentieristica.php — (이탈리아어)
- https://museudoamanha.org.br/pt-br/ingressos — (포르투갈어)
- https://tofukuji.jp/guide/ — (일본어)
- https://www.eikando.or.jp/lp/2026/index.html — (일본어)
- https://www.comune.venezia.it/it/content/la-previsione — (이탈리아어)
- https://ticketing.colosseo.it/ — (이탈리아어)
- https://portale.museiitaliani.it/b2c/buyTicketless/33f77159-0acd-40c4-8524-701f33aae108 — (이탈리아어)
- https://www.sovraintendenzaroma.it/content/da-luned%C3%AC-2-febbraio-nuove-modalit%C3%A0-di-visita-di-fontana-di-trevi — (이탈리아어)
- https://www.comune.roma.it/web/it/notizia/biglietto-dingresso-fontana-di-trevi.page — (이탈리아어)
- https://tofukuji.jp/ — (일본어)

## GATEO storage image URLs (left unchanged)

- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=에펠탑 실루엣)
  - before: `eo.kr/place/paris)에서 보면 된다. ![에펠탑 실루엣](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=파리 카페 거리)
  - before: ` 가방 규정은 방문 전 공식 안내에서 확인한다. ![파리 카페 거리](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=파리 스카이라인)
  - before: ` 걷기 4. 시차와 걸음 수를 생각해 일찍 쉬기 ![파리 스카이라인](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=세느 강과 다리 황혼)
  - before: ` 한 블록 옆 각도를 찾아 천천히 걷는다. ![세느 강과 다리 황혼](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=루브르 피라미드)
  - before: `확인한다. 티켓 가격은 여기서 단정하지 않는다. ![루브르 피라미드](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=몽마르트 사크레쾨르)
  - before: `만 사람이 많다. 측도로 빠질 여유를 둔다. ![몽마르트 사크레쾨르](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=루브르 외관)
  - before: `ay 4:** 몽마르트 또는 마레 하나와 여유 쇼핑 ![루브르 외관](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)
- **report 60** — In-body photo via `![alt](url)`; content left unchanged. (markdown-image, alt=에펠탑과 파리 전경)
  - before: ` 되었다면, 먼저 도시 페이지를 열어 두자. ![에펠탑과 파리 전경](https://phdjnbfitvmrguqzverm.supabase.co/storage/v`
  - after: (unchanged)

## Rows changed vs final6

| Row | final6 ops | final7 ops |
|---|---|---|
| review:1904e49b-0ef9-4be9-8bb3-da7cd9603c4f | 3 | 1 |
| review:1aad326e-a37f-40d8-95ca-f31847c494dd | 2 | 1 |
| review:2a7dab01-bfd8-4946-8a48-f3c0749b5269 | 1 | 1 |
| review:2e1d1d1b-45ae-4e33-8016-c925186692a1 | 2 | 1 |
| review:2eabdcda-9aa3-45b1-9800-e2b52958a342 | 4 | 3 |
| review:43292c6e-8f0f-4fa1-97f8-59d3329e5b29 | 0 | 1 |
| review:44178bf5-e46c-48f6-8781-532835d850bc | 4 | 2 |
| review:4616d9a7-2d50-4d26-8129-762906196952 | 3 | 2 |
| review:46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | 4 | 2 |
| review:5d40e738-6d2b-4ec7-8a1a-5b40517023fc | 3 | 2 |
| review:5f9cc144-1af2-432f-8dc9-05353bfb8bd8 | 2 | 1 |
| review:669c2eea-23fa-4929-84d9-6a715d256574 | 3 | 2 |
| review:7315cf26-78f3-4c92-9ee7-ac5dc9c15b24 | 2 | 1 |
| review:7c31a683-e627-4b7a-8ad1-99b21e10273e | 1 | 1 |
| review:8e4e0384-1110-453c-954a-d29dfbe121a4 | 2 | 2 |
| review:9b7bf10f-0d82-4574-81db-511a750f9ed6 | 3 | 3 |
| review:b6bb0a1d-0481-4a1e-91b2-5d46c8841026 | 4 | 2 |
| report:69 | 2 | 3 |
| report:73 | 4 | 4 |
| report:75 | 6 | 4 |
| report:77 | 6 | 5 |
| report:78 | 2 | 2 |
| report:80 | 3 | 2 |
| report:82 | 3 | 2 |
| report:91 | 5 | 3 |
| report:93 | 1 | 2 |
| review:0d85bbf2-9d7d-4900-ab6e-3784191a392c | 1 | 0 |
| review:18c5a722-12aa-4324-b252-01ef8b22a0c7 | 1 | 0 |
| review:33676179-a5fc-451d-b373-8fba35e0ccd0 | 1 | 0 |
| review:407d7a88-3795-41bc-9740-70fc0b328600 | 1 | 0 |
| review:4181696e-e4f4-40c9-9c04-51dd5f23825f | 1 | 0 |
| review:5b4c6c81-147a-4e06-a18a-35b3368f4f35 | 1 | 0 |
| review:81be5176-9eac-41f9-b19e-1382cc773a38 | 1 | 0 |
| review:91ab5557-db37-4dff-b809-60a4d7a753a6 | 5 | 0 |
| review:c0367f6b-57fc-4353-a1b5-7d177aaf1848 | 1 | 0 |
| review:c7cdcf9e-aa70-45ac-bdb4-148f2b485751 | 1 | 0 |
| review:d4c0b844-c24d-4a82-8312-e9db0c2ce561 | 1 | 0 |
| review:dc2a621f-493d-438e-a4fb-f6758014dbb4 | 3 | 0 |
| review:e17ff4b9-be5e-4bd0-a19b-2fa02b52ea7f | 1 | 0 |
| report:60 | 8 | 0 |
| report:70 | 1 | 0 |
| report:72 | 2 | 0 |
| report:79 | 1 | 0 |

## URL decisions changed vs final6 (70)

| URL | final6 | final7 |
|---|---|---|
| https://futar.bkk.hu/ | unwrap | keep |
| https://tourism.ub.gov.mn/wp-content/uploads/Ulaanbaatar-korea-2025-2.pdf | replace → https://tourism.ub.gov.mn/ | keep |
| https://hikarimasse.osaka-chushin.fun/ | unwrap | keep |
| https://www.shochiku.co.jp/wp-content/uploads/2025/08/shochiku20250828-1.pdf | unwrap | keep |
| https://www.seaparadise.co.jp/institution/index.html | unwrap | keep |
| https://www.pref.ishikawa.jp/siro-niwa/kenrokuen/ | keep-label | replace → https://www.pref.ishikawa.jp/en/ |
| https://www.mizuno-osaka.com/ | unwrap | keep |
| https://paris-carette.fr/nos-magasins/place-des-vosges/ | unwrap | keep |
| https://www.hotel-de-sully.fr/ | unwrap | keep-label |
| https://www.hotel-de-sully.fr/visiter/visites-et-activites | unwrap | keep-label |
| https://www.cafebatavia.com/ | unwrap | keep |
| https://thegridfoodmarket.com/ | unwrap | keep |
| https://www.keibunsha-store.com/ | unwrap | keep |
| https://parcocolosseo.it/en/visit/how-to-get-here/ | keep | replace → https://parcocolosseo.it/en/ |
| https://www.italia.it/it/veneto/venezia/isola-della-giudecca | unwrap | replace → https://www.italia.it/en/veneto/venezia/isola-della-giudecca |
| https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_2.pdf | unwrap | keep |
| https://www.italia.it/it/veneto/venezia/ponte-di-rialto | replace → https://www.italia.it/en/ | replace → https://www.italia.it/en/veneto/venezia/ponte-di-rialto |
| https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_1.pdf | unwrap | keep |
| https://www.city.fukuoka.lg.jp/keizai/yatai/shisei/documents/01_rule.pdf | replace → https://www.city.fukuoka.lg.jp/english/ | keep |
| https://www.llibrerialamemoria.com/ | unwrap | keep |
| https://terrabartrobada.com/ | unwrap | keep |
| https://transportnsw.info/documents/timetables/93-F4-Pyrmont-Bay-20260614.pdf | replace → https://transportnsw.info/ | keep |
| https://www.thailandgoodtravel.info/?locale=en | replace → https://www.thailandgoodtravel.info/english/ | keep |
| https://www.lecafecharbon.fr/ | unwrap | keep |
| https://leperchoir.fr/location/le-perchoir-menilmontant/ | unwrap | keep-label |
| https://raw-gelaende.de/ | unwrap | keep |
| https://vietnamtourism.vn/index.php/tourism/items/491 | replace → https://vietnamtourism.vn/en/ | replace → https://vietnamtourism.vn/english/ |
| https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/istanbul-ici-hatlar/uskudar-karakoy-eminonu-164 | unwrap | keep |
| https://stohrer.fr/ | unwrap | replace → https://stohrer.fr/en/ |
| https://cookislands.travel/islands/aitutaki | unwrap | keep |
| https://cookislands.travel/supplier/vaka-cruise | unwrap | keep |
| https://cookislands.travel/supplier/aitutaki-day-tour | unwrap | keep |
| https://cookislands.travel/experiences/arts-culture/island-nights | unwrap | keep |
| https://cookislands.travel/supplier/kia-orana-cruise-aitutaki | unwrap | keep |
| https://www.parconazionale5terre.it/pagina.php?id=480 | unwrap | keep-label |
| https://www.parconazionale5terre.it/rete-sentieristica.php | unwrap | keep-label |
| https://www.rioscenarium.com.br/ | unwrap | keep |
| https://www.barcariocadagema.com.br/ | unwrap | keep |
| https://www.circovoador.com.br/ | unwrap | replace → https://www.circovoador.com.br/en/ |
| https://www.mercatllibertat.cat/ | unwrap | keep |
| https://www.gochang.go.kr/tidalflat/index.gochang | replace → https://www.gochang.go.kr/en/ | keep |
| https://seaworld.com.au/park-info | unwrap | keep |
| https://torvehallernekbh.dk/op-set/opening-hours/ | replace → https://torvehallernekbh.dk/ | keep |
| https://torvehallernekbh.dk/stade/hallernes-smorrebrod/ | replace → https://torvehallernekbh.dk/ | keep |
| https://torvehallernekbh.dk/stade/hav/ | replace → https://torvehallernekbh.dk/ | keep |
| https://www.santiagoturismo.com/parques-e-xardins/parque-da-alameda | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_w72yrpjrk.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_gt26b85mb.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_4beg6wogw.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530301_kz74yhbox.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_82yzpvw80.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_dhpqvppdg.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_cxw7rtp9u.jpg | unwrap | keep |
| https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_pau5cr7sz.jpg | unwrap | keep |
| https://www.planalto.gov.br/ccivil_03/decreto/2002/d4235.htm | keep | replace → https://www.gov.br/planalto/en |
| https://experiences.visitdubai.com/productDetail/75168?currencyCode=AED&lang=en | replace → https://experiences.visitdubai.com/en/ | keep |
| https://www.evisa.gov.kh/ | replace → https://www.evisa.gov.kh/en/ | keep |
| https://tofukuji.jp/guide/ | unwrap | keep-label |
| https://www.eikando.or.jp/lp/2026/index.html | unwrap | keep-label |
| https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_12.pdf | unwrap | keep |
| https://cultura.gov.it/luogo/pantheon | keep-label | keep |
| https://tickets.museivaticani.va/ | keep-label | replace → https://www.museivaticani.va/content/museivaticani/en.html |
| https://tofukuji.jp/ | unwrap | keep-label |
| https://indianvisaonline.gov.in/evisa/images/Etourist_fee_final.pdf | replace → https://indianvisaonline.gov.in/ | keep |
| https://kuromon.com/jp/ | keep-label | replace → https://kuromon.com/en/ |
| https://www.osakacastle.net/guide/ | unwrap | keep |
| https://dsvn.vn/ | unwrap | keep |
| https://sunworld.vn/en/fansipan/sunworld-news/notice-fansipan-cable-car-officially-resumes-operation-from-september-28-30074 | unwrap | keep |
| https://sunworld.vn/vi/fansipan/tin-tuc-sunworld/dem-nguoc-combo-don-binh-minh-tren-dinh-fansipan-dieu-gi-cho-nguoi-day-som-o-do-cao-3143m-39960 | unwrap | replace → https://sunworld.vn/en/ |
| https://commons.wikimedia.org/wiki/User:Saigen_Jiro | keep | unwrap |

## Artifact SHA256

- REPORT.md: 7e68d9b839f2954ffc386142ec3a29a3a925632e902ed46b18c23f968ab39a09
- backup.json: 531edd2a0a4526201c488d6f5b17defce86876a6927af63bb5727f8351643a15
- update.sql: 12b751baf6cc90bd8315442b7f4a280aee9086638d5f772be87d19e6c9c79797
- rollback.sql: b67b38fa2a5cbade6ac1e661ed1f164596911039506fdd972260e8e57741371a

Branch: `ops/link-audit-final7` · bundle artifact commit: (see git after publish)
