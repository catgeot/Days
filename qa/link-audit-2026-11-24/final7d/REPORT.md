# GATEO full-corpus link audit — **final7d**

Policy: operator own-site + ko/en replace when verified; keep-label when foreign-only; unwrap third-party/dead. **final7d** pins regressions vs final7b on 12 disputed URLs (exempt: Vietnam EN posts, evisa root, operator sites). Post-corpus scan = sequential. MD5 raw `content`. **DELETE/INSERT = 0**.

Corpus read at (live Supabase): **2026-11-25T16:19:25.255Z**

Corpus: **155** reviews + **40** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 325 |
| URL decisions: keep + language label | 30 |
| URL decisions: replace | 41 |
| URL decisions: unwrap | 2 |
| SQL rows (place_reviews) | 27 |
| SQL rows (reports) | 13 |
| Post-corpus scan URLs | 421 |
| Post-corpus issues | 106 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

## Post-corpus issues (explained)

After applying `update.sql` to a local mirror of the corpus, each **outbound URL** in updated rows is re-fetched with the post-update scanner. A row is an **issue** when `ok=false` (WAF hard-block, nav/timeout, CJK/non-EN body under strict rules, or topic mismatch). These are **QA signals**, not automatic unwrap triggers.

| Category | Count |
|---|---|
| ok | 315 |
| waf-hard-block | 32 |
| non-en-latin-body | 28 |
| non-ko-en-cjk-body | 19 |
| short-body | 13 |
| navigation-error | 8 |
| other-scanner-fail | 4 |
| topic-mismatch | 2 |

### Non-ko/en link labels after update.sql

**Target met:** 0 markdown links with foreign path/host lacking a `(…어)` label in the link text after update.

## Policy pins (final7b-stable)

- https://tickets.museivaticani.va/: keep-label → replace (https://www.museivaticani.va/content/museivaticani/en.html)

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

## Rows changed vs final7c

| Row | final7c ops | final7d ops |
|---|---|---|
| review:44178bf5-e46c-48f6-8781-532835d850bc | 2 | 3 |
| report:75 | 4 | 5 |
| report:77 | 6 | 6 |

## URL decisions changed vs final7c (2)

| URL | final7c | final7d |
|---|---|---|
| https://actv.avmspa.it/en/content/venice-urban-services | keep | replace → https://actv.avmspa.it/english/ |
| https://tickets.museivaticani.va/ | keep-label | replace → https://www.museivaticani.va/content/museivaticani/en.html |

## Artifact SHA256

- REPORT.md: cd8b0525125c0d646eedfcf817d8a54ac452480b635249debb8ca30594b250a4
- backup.json: 18f7c34b334a89ea4e9447f42a777bebda23f52604b18af5a49e1ee783916040
- update.sql: 441369b5ca036942dd74e2d382a7f2a64436ecd7248191b2e5c072d00a203bfe
- rollback.sql: b375b9f498b214e3a61672221f1804ce998bc2e2f75bac2ee644a18c26b3216f
