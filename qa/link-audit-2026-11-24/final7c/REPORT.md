# GATEO full-corpus link audit — **final7c**

Policy: government/tourism **and operator own-site** (`공식 사이트`) links kept; unwrap **third-party** (aggregators/review platforms) or **confirmed dead** only. Post-corpus scan = **sequential** Playwright pass. MD5 guard = raw `content`. **DELETE/INSERT = 0**.

Corpus read at (live Supabase): **2026-11-25T13:04:53.180Z**

Corpus: **155** reviews + **40** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 326 |
| URL decisions: keep + language label | 31 |
| URL decisions: replace | 39 |
| URL decisions: unwrap | 2 |
| SQL rows (place_reviews) | 27 |
| SQL rows (reports) | 13 |
| Post-corpus scan URLs | 421 |
| Post-corpus issues | 104 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

## Post-corpus issues (explained)

After applying `update.sql` to a local mirror of the corpus, each **outbound URL** in updated rows is re-fetched with the post-update scanner. A row is an **issue** when `ok=false` (WAF hard-block, nav/timeout, CJK/non-EN body under strict rules, or topic mismatch). These are **QA signals**, not automatic unwrap triggers.

| Category | Count |
|---|---|
| ok | 317 |
| waf-hard-block | 32 |
| non-en-latin-body | 26 |
| non-ko-en-cjk-body | 19 |
| short-body | 14 |
| navigation-error | 7 |
| other-scanner-fail | 4 |
| topic-mismatch | 2 |

### Non-ko/en link labels after update.sql

**Target met:** 0 markdown links with foreign path/host lacking a `(…어)` label in the link text after update.

## Unwrap table (full)

| URL | Row(s) | Category | Evidence |
|---|---|---|---|
| https://tabelog.com/osaka/A2701/A270202/27001546/ | review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | non-official | tabelog.com (third-party review platform; adjacent `tel:+81662127381` unchanged) |
| https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri | review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | dead | HTTP 404 (2 requests) |

**No other unwraps.** Operator own-sites `gleebooks.com.au`, `zoobaeats.com`, `zoobaeats.com/food` are **keep** (공식 사이트).

## Keep + language label

- https://www.tcma.gov.taipei/News_Content.aspx?n=FAC14AD2DE4E01A4&s=0CFD6ED2C96E9CC4&sms=32F7BA052C5CA548 — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=FA645AE0684F4CBC&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=93592B425F56FEBB&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.paris.fr/lieux/square-louis-xiii-36 — (프랑스어)
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
- https://tickets.museivaticani.va/ — (이탈리아어)
- https://tofukuji.jp/ — (일본어)
- https://www.beritajakarta.id/potret-jakarta/album/19996/pemprov-dki-kembali-lakukan-perawatan-tugu-monas — (인도네시아어)
- https://vr.com.vn/tin-tuc/tuyen-duong-sat-ha-noi-lao-cai-tang-len-3-doi-tau-khach-moi-ngay — (베트남어)

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

## Rows changed vs final7b

| Row | final7b ops | final7c ops |
|---|---|---|
| review:2eabdcda-9aa3-45b1-9800-e2b52958a342 | 3 | 2 |
| review:615587ff-f3a1-47db-98b4-4259dc4acd2c | 2 | 1 |
| review:669c2eea-23fa-4929-84d9-6a715d256574 | 2 | 1 |
| review:bf044b52-27cb-47bf-a6cd-d26a2596f52f | 4 | 3 |
| report:68 | 2 | 1 |
| report:73 | 4 | 3 |
| report:77 | 6 | 6 |
| review:04c02248-d84b-4d39-bdaa-4a9f008ec48c | 1 | 0 |
| review:0f176b78-cf13-43cf-80d0-f572e7e215b8 | 1 | 0 |
| review:2fc0c1c5-0d8a-40a0-90f0-ef09858f894d | 1 | 0 |
| review:36ec7a22-1e40-4879-981d-39f9554beb0b | 1 | 0 |
| review:8e4e0384-1110-453c-954a-d29dfbe121a4 | 2 | 0 |
| review:b764795c-a1c9-45ff-985e-5f2fc3b1db81 | 1 | 0 |
| review:e93cafdf-d704-48df-8aba-bca6d86d0c29 | 1 | 0 |
| report:66 | 1 | 0 |
| report:72 | 2 | 0 |

## URL decisions changed vs final7b (15)

| URL | final7b | final7c |
|---|---|---|
| https://gleebooks.com.au/ | unwrap | keep |
| https://www.thepeak.com.hk/en/the-peak-experience/the-sky-terrace-428 | replace → https://webstore.thepeak.com.hk/?lang=en_us | keep |
| https://www.hotel-de-sully.fr/ | keep-label | keep |
| https://zoobaeats.com/ | unwrap | keep |
| https://vietnamtourism.gov.vn/en/post/17740 | replace → https://vietnamtourism.gov.vn/en/ | keep |
| https://www.kiyomizudera.or.jp/ | replace → https://www.kiyomizudera.or.jp/en/ | keep |
| https://www.balajo.fr/le-balajo | replace → https://www.balajo.fr/en/ | keep |
| https://stohrer.fr/ | replace → https://stohrer.fr/en/ | keep |
| https://www.pieddecochon.com/ | replace → https://www.pieddecochon.com/en/ | keep |
| https://ufleku.cz/ | replace → https://ufleku.cz/en/ | keep |
| https://www.kyoto-nishiki.or.jp/ | replace → https://www.kyoto-nishiki.or.jp/en/ | keep |
| https://www.louvre.fr/decouvrir/les-jardins | replace → https://www.louvre.fr/en/ | keep |
| https://zoobaeats.com/food | unwrap | keep |
| https://www.evisa.gov.kh/ | replace → https://www.evisa.gov.kh/en/ | keep |
| https://tickets.museivaticani.va/ | replace → https://www.museivaticani.va/content/museivaticani/en.html | keep-label |

## Artifact SHA256

- REPORT.md: `86214ec1f522b2d729451b8f002816809f918910f615c6aa5dacddf6e2517b29`
- backup.json: `97b8a4c44742b5b1e7189cb6bc72a2c4bff4d708d93f9483cd64ad1ca364e2d3`
- update.sql: `a5828d88abc2394f15dcbcc3c3a86f64d9f57105ff435b12b110c5e471b79986`
- rollback.sql: `b375b9f498b214e3a61672221f1804ce998bc2e2f75bac2ee644a18c26b3216f`

Branch tip (`git rev-parse HEAD` after push): `0967c0255b0addf632ea59a3029099664a1c52ca` on `ops/link-audit-final7c`
