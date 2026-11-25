# GATEO full-corpus link audit — **final7e**

Policy: operator own-site + ko/en replace when verified; keep-label when foreign-only; unwrap third-party/dead. **final7e** applies 13 evidence-table URL mandates (deterministic). Post-corpus scan = sequential. MD5 raw `content`. **DELETE/INSERT = 0**.

Corpus read at (live Supabase): **2026-11-25T19:31:41.144Z**

Corpus: **155** reviews + **40** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 318 |
| URL decisions: keep + language label | 32 |
| URL decisions: replace | 46 |
| URL decisions: unwrap | 2 |
| SQL rows (place_reviews) | 29 |
| SQL rows (reports) | 13 |
| Post-corpus scan URLs | 421 |
| Post-corpus issues | 101 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

## Post-corpus issues (explained)

After applying `update.sql` to a local mirror of the corpus, each **outbound URL** in updated rows is re-fetched with the post-update scanner. A row is an **issue** when `ok=false` (WAF hard-block, nav/timeout, CJK/non-EN body under strict rules, or topic mismatch). These are **QA signals**, not automatic unwrap triggers.

| Category | Count |
|---|---|
| ok | 320 |
| waf-hard-block | 32 |
| non-en-latin-body | 26 |
| non-ko-en-cjk-body | 19 |
| short-body | 13 |
| navigation-error | 8 |
| topic-mismatch | 2 |
| other-scanner-fail | 1 |

### Non-ko/en link labels after update.sql

**Target met:** 0 markdown links with foreign path/host lacking a `(…어)` label in the link text after update.

## Evidence URL mandates (applied)

- https://www.kiyomizudera.or.jp/: keep → replace (https://www.kiyomizudera.or.jp/en/)
- https://www.kiyomizudera.or.jp/event/yakan.php: replace → replace (https://www.kiyomizudera.or.jp/en/)
- https://www.balajo.fr/le-balajo: keep → replace (https://www.balajo.fr/en/)
- https://stohrer.fr/: keep → replace (https://stohrer.fr/en/)
- https://www.pieddecochon.com/: keep → replace (https://www.pieddecochon.com/en/)
- https://ufleku.cz/: keep → replace (https://ufleku.cz/en/)
- https://www.kyoto-nishiki.or.jp/: keep → replace (https://www.kyoto-nishiki.or.jp/en/)
- https://www.louvre.fr/decouvrir/les-jardins: keep → replace (https://www.louvre.fr/en/)
- https://www.thepeak.com.hk/en/ticket-and-booking/purchase-ticket/peak-tram-sky-pass: replace → replace (https://webstore.thepeak.com.hk/?lang=en_us)
- https://tickets.museivaticani.va/: keep-label → replace (https://www.museivaticani.va/content/museivaticani/en.html)
- https://www.hotel-de-sully.fr/: keep → keep-label label (프랑스어)
- https://vietnamtourism.gov.vn/en/post/17740: keep → keep
- https://www.evisa.gov.kh/: keep → keep
- https://actv.avmspa.it/en/content/venice-urban-services: keep → keep

## Unwrap table (full)

| URL | Row(s) | Category | Evidence |
|---|---|---|---|
| https://tabelog.com/osaka/A2701/A270202/27001546/ | review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | non-official | tabelog.com |
| https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri | review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | dead | HTTP 404 (2 requests) |

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
- https://cultura.gov.it/luogo/pantheon — (이탈리아어)
- https://portale.museiitaliani.it/b2c/buyTicketless/33f77159-0acd-40c4-8524-701f33aae108 — (이탈리아어)
- https://www.sovraintendenzaroma.it/content/da-luned%C3%AC-2-febbraio-nuove-modalit%C3%A0-di-visita-di-fontana-di-trevi — (이탈리아어)
- https://www.comune.roma.it/web/it/notizia/biglietto-dingresso-fontana-di-trevi.page — (이탈리아어)
- https://tickets.museivaticani.va/ — (이탈리아어)
- https://tofukuji.jp/ — (일본어)
- https://www.beritajakarta.id/potret-jakarta/album/19996/pemprov-dki-kembali-lakukan-perawatan-tugu-monas — (인도네시아어)
- https://vr.com.vn/tin-tuc/tuyen-duong-sat-ha-noi-lao-cai-tang-len-3-doi-tau-khach-moi-ngay — (베트남어)
- https://www.hotel-de-sully.fr/ — (프랑스어)

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

## Rows changed vs final7d

| Row | final7d ops | final7e ops |
|---|---|---|
| review:2eabdcda-9aa3-45b1-9800-e2b52958a342 | 2 | 3 |
| review:44178bf5-e46c-48f6-8781-532835d850bc | 3 | 2 |
| review:615587ff-f3a1-47db-98b4-4259dc4acd2c | 1 | 2 |
| review:669c2eea-23fa-4929-84d9-6a715d256574 | 1 | 2 |
| review:8e4e0384-1110-453c-954a-d29dfbe121a4 | 0 | 2 |
| review:b764795c-a1c9-45ff-985e-5f2fc3b1db81 | 0 | 1 |
| review:bf044b52-27cb-47bf-a6cd-d26a2596f52f | 3 | 4 |
| review:e93cafdf-d704-48df-8aba-bca6d86d0c29 | 0 | 1 |
| report:73 | 3 | 4 |
| report:75 | 5 | 4 |
| report:77 | 6 | 7 |
| review:43292c6e-8f0f-4fa1-97f8-59d3329e5b29 | 1 | 0 |

## URL decisions changed vs final7d (11)

| URL | final7d | final7e |
|---|---|---|
| https://www.hotel-de-sully.fr/ | keep | keep-label |
| https://parcocolosseo.it/en/visit/how-to-get-here/ | replace → https://parcocolosseo.it/en/ | keep |
| https://actv.avmspa.it/en/content/venice-urban-services | replace → https://actv.avmspa.it/english/ | keep |
| https://www.kiyomizudera.or.jp/ | keep | replace → https://www.kiyomizudera.or.jp/en/ |
| https://www.balajo.fr/le-balajo | keep | replace → https://www.balajo.fr/en/ |
| https://stohrer.fr/ | keep | replace → https://stohrer.fr/en/ |
| https://www.pieddecochon.com/ | keep | replace → https://www.pieddecochon.com/en/ |
| https://ufleku.cz/ | keep | replace → https://ufleku.cz/en/ |
| https://www.kyoto-nishiki.or.jp/ | keep | replace → https://www.kyoto-nishiki.or.jp/en/ |
| https://www.louvre.fr/decouvrir/les-jardins | keep | replace → https://www.louvre.fr/en/ |
| https://cultura.gov.it/luogo/pantheon | keep | keep-label |

## Evidence self-check (13 mandates)

| ID | expect in update.sql | count | post-scan original URL | PASS |
|---|---|---:|---|---|
| kiyomizudera | `https://www.kiyomizudera.or.jp/en/` | 6 | — | yes |
| balajo | `https://www.balajo.fr/en/` | 2 | — | yes |
| stohrer | `https://stohrer.fr/en/` | 2 | — | yes |
| pieddecochon | `https://www.pieddecochon.com/en/` | 2 | — | yes |
| ufleku | `https://ufleku.cz/en/` | 2 | — | yes |
| kyoto-nishiki | `https://www.kyoto-nishiki.or.jp/en/` | 10 | — | yes |
| louvre | `https://www.louvre.fr/en/` | 2 | — | yes |
| thepeak | `https://webstore.thepeak.com.hk/?lang=en_us` | 1 | — | yes |
| museivaticani | `https://www.museivaticani.va/content/museivaticani/en.html` | 1 | — | yes |
| hotel-de-sully | `(프랑스어)](https://www.hotel-de-sully.fr/)` | 2 | https://www.hotel-de-sully.fr/ | yes |
| vietnamtourism | `https://vietnamtourism.gov.vn/en/post/17740` | 0 | https://vietnamtourism.gov.vn/en/post/17740 | yes |
| evisa | `https://www.evisa.gov.kh/` | 0 | https://www.evisa.gov.kh/ | yes |
| actv | `https://actv.avmspa.it/en/content/venice-urban-services` | 3 | https://actv.avmspa.it/en/content/venice-urban-services | yes |

**Self-check failures:** 0

**Post-corpus navigation-error count:** 8

## Artifact SHA256

See `SHA256SUMS` in this directory (four bundle files; REPORT hash omitted here to avoid stale self-reference).

## Git

Branch `ops/link-audit-final7e` · verify tip: `git rev-parse origin/ops/link-audit-final7e`

