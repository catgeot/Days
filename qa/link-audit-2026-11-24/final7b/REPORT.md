# GATEO full-corpus link audit — **final7b**

Policy: official operators + Commons photo credits retained; unwrap **third-party** or **confirmed dead** (404/410/soft-404, double-checked) only. MD5 guard = raw `content` (no trim). **DELETE/INSERT = 0**.

Corpus read at (live Supabase): **2026-11-25T09:54:06.891Z**

Corpus: **155** reviews + **40** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 312 |
| URL decisions: keep + language label | 31 |
| URL decisions: replace | 50 |
| URL decisions: unwrap | 5 |
| SQL rows (place_reviews) | 34 |
| SQL rows (reports) | 15 |
| Post-corpus scan URLs | 416 |
| Post-corpus issues | 191 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

## Post-corpus issues (explained)

After applying `update.sql` to a local mirror of the corpus, each **outbound URL** in updated rows is re-fetched with the post-update scanner. A row is an **issue** when `ok=false` (WAF hard-block, nav/timeout, CJK/non-EN body under strict rules, or topic mismatch). These are **QA signals**, not automatic unwrap triggers.

| Category | Count |
|---|---|
| ok | 225 |
| navigation-error | 146 |
| non-ko-en-cjk-body | 14 |
| waf-hard-block | 11 |
| short-body | 9 |
| other-scanner-fail | 6 |
| non-en-latin-body | 5 |

### Non-ko/en link labels after update.sql

**Target for `update.sql` delta rows:** markdown links whose URL has a **foreign path/query marker** (not `/en` paths or operator PDFs) must carry a `(…어)` tag on the link text.

- **Rows touched by SQL (49):** **0** unlabeled foreign-path links after applying all operations (verified offline against `backup.json` operations).
- **Whole-corpus heuristic scan (416 URLs):** up to 14 hits were **false positives** — duplicate content/blocks passes, host-level `.fr`/`.it` TLD heuristics on **`/en-GB/` or English pages**, and **operator PDF** timetables kept without labels by policy. None of these are in the SQL delta set.

_vs final7 post-corpus issues (141):_ final7b rescans **416** post-update URL instances and records **191** `ok=false` rows; the rise is mostly **navigation-error** (146) from parallel Playwright timeouts during the post-pass, not new unwrap candidates.

## Unwrap table (full)

| URL | Row(s) | Category | Evidence |
|---|---|---|---|
| https://gleebooks.com.au/ | review 04c02248-d84b-4d39-bdaa-4a9f008ec48c | non-official | gleebooks.com.au |
| https://tabelog.com/osaka/A2701/A270202/27001546/ | review 2e1d1d1b-45ae-4e33-8016-c925186692a1 | non-official | tabelog.com |
| https://zoobaeats.com/ | review 2fc0c1c5-0d8a-40a0-90f0-ef09858f894d | non-official | zoobaeats.com |
| https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri | review 46f4510b-7e0b-4f0f-b6a5-51a236b3e62a | dead | HTTP 404 (2 requests) |
| https://zoobaeats.com/food | report 66 | non-official | zoobaeats.com |

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

## Rows changed vs final7

| Row | final7 ops | final7b ops |
|---|---|---|
| review:36ec7a22-1e40-4879-981d-39f9554beb0b | 0 | 1 |
| report:72 | 0 | 2 |
| report:77 | 5 | 6 |
| report:81 | 1 | 1 |
| report:91 | 3 | 3 |
| report:93 | 2 | 1 |
| review:62190bb0-b77d-4485-9e83-98ec5e3d85f6 | 1 | 0 |
| report:76 | 1 | 0 |

## URL decisions changed vs final7 (9)

| URL | final7 | final7b |
|---|---|---|
| https://vietnamtourism.gov.vn/en/post/17740 | keep | replace → https://vietnamtourism.gov.vn/en/ |
| https://parisjetaime.com/eng/culture/musee-d-orsay-p3592 | unwrap | keep |
| https://www.evisa.gov.kh/ | keep | replace → https://www.evisa.gov.kh/en/ |
| https://thesool.com/front/publication/M000000064/view.do?bbsId=A000000042&publicationId=C000003554 | unwrap | keep |
| https://fontanaditrevi.roma.it/ | keep | replace → https://fontanaditrevi.roma.it/en/ |
| https://www.beritajakarta.id/potret-jakarta/album/19996/pemprov-dki-kembali-lakukan-perawatan-tugu-monas | unwrap | keep-label |
| https://vr.com.vn/tin-tuc/tuyen-duong-sat-ha-noi-lao-cai-tang-len-3-doi-tau-khach-moi-ngay | unwrap | keep-label |
| https://commons.wikimedia.org/wiki/User:Irisgazer | unwrap | replace → https://commons.wikimedia.org/wiki/File:Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg |
| https://commons.wikimedia.org/wiki/User:Saigen_Jiro | unwrap | keep |

## Artifact SHA256

- REPORT.md: 8f837580a9114d598d9f1145b3920571ebd1cd564f326e0ddc51fb2ca9f1ca42
- backup.json: faee6a0615b0d0471a6b1ce8c853ea4c35f5ad34b2c6b5d493b01f8656ffdce9
- update.sql: 7d10391fedcfa975c5e5d0761c2ea812cd65d2c5b5bd931dbaa79d2a5134c9f2
- rollback.sql: 92f073f3269412eb08156d01b96d1dbed9d2986d3a306aa4ac3c80e7fcc72563

Branch: `ops/link-audit-final7b` · bundle artifact commit: (see git after publish)
