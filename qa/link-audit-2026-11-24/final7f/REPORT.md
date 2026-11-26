# GATEO full-corpus link audit — **final7f**

Owner decision (2026-11-26): do not unwrap the two links final7e removed. **final7f** changes only those two `UPDATE` statements. The other **40** statements are byte-identical to final7e `update.sql`. `rollback.sql` is byte-identical to final7e (it restores pre-update corpus text). Raw `md5(content)` guards unchanged. **DELETE/INSERT = 0**. **Unwrap = 0**.

Corpus for the other rows: final7e live read **2026-11-25T19:31:41.144Z**. The two edited rows were re-read alone (id + content) and their `md5(content)` still matches the guards (`9f69943aba11d021612670b5f7a401e8`, `ce19c95c59d1f2db79dfa20079d13cf2`). No other row was re-read.

| Metric | Count |
|---|---|
| URL decisions: keep | 319 |
| URL decisions: keep + language label | 32 |
| URL decisions: replace | 47 |
| URL decisions: unwrap | 0 |
| SQL rows (place_reviews) | 29 |
| SQL rows (reports) | 13 |
| SQL UPDATE statements | 42 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

Decision delta vs final7e: Tabelog URL **unwrap → replace**. thisisbarcelona square URL **unwrap → keep** (link restored). Totals still 398 URL decisions.

## Evidence — review `2e1d1d1b-45ae-4e33-8016-c925186692a1` (くくる / Tabelog 27001546)

Before (corpus): `[타베로그](https://tabelog.com/osaka/A2701/A270202/27001546/)`

After: `[공식 사이트 (일본어)](https://dotonbori-kukuru.com/)`

- Tabelog lists the store homepage as `http://www.shirohato.com/kukuru/index.htm`. Fetch follows to **`https://dotonbori-kukuru.com/`** HTTP **200**, `html lang=ja`, title `たこ家道頓堀くくる 公式ブランドサイト | 白ハト食品工業株式会社`.
- `https://dotonbori-kukuru.com/en/` and `/kr/` return **302** to the Japanese home (not a Korean or English page).
- Home HTML has no 予約 link. `order.store` links on the home are other branches, not the Dotonbori honten reservation. Shop list `https://dotonbori-kukuru.com/shop/` is HTTP **200**, `lang=ja`.
- Same Tabelog restaurant in Korean also exists: `https://tabelog.com/kr/osaka/A2701/A270202/27001546/` HTTP **200**, `html lang=kr`, title `타코야 도톤보리 쿠쿠루 혼텐`. English `https://tabelog.com/en/osaka/.../27001546/` HTTP **200**. Not used, because an operator site was verified and that branch comes first. The Japanese Tabelog URL itself returned HTTP **403** (access-concentration page, `lang=ja`).

## Evidence — review `46f4510b-7e0b-4f0f-b6a5-51a236b3e62a` (Plaça de Sant Felip Neri)

Before (corpus): `[공식 안내](https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri)`

After: the same markdown link (final7e had unwrapped it to plain `공식 안내`).

- Operator: **Barcelona Turisme**. `https://thisisbarcelona.com/` HTTP **200**, title `This is Barcelona, the official website of Barcelona Turisme`. `https://www.barcelonaturisme.com/wv3/en/` redirects there. This is the city’s official tourism site, separate from Ajuntament `barcelona.cat`.
- The square URL is HTTP **404**. The 404 names AEM path `/content/thisisbarcelona/en/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri.html`, so the unprefixed URL is the **English** edition, not Spanish.
- Same slug under `/en/`, `/es/`, `/ca/`, `/ko/` is also HTTP **404**. No Korean or English replacement page to swap in. No `(스페인어)` label, because the content path is English.
- The other `공식 안내` in this row stays final7e: `https://www.barcelona.cat/capitalmundialarquitectura/ca/espai/placa-de-la-vila-de-gracia` → `https://www.barcelona.cat/en/`.

## Byte identity

`update.sql` statement diff vs final7e is exactly the two review ids above (42 statements, 40 unchanged). `rollback.sql` matches final7e byte for byte. Markdown link counts in all 42 updated `content` values are ≥ the backup `content` link counts.

## Artifact SHA256

See `SHA256SUMS` in this directory (REPORT hash is listed there; this section does not repeat a self-hash).

## Git

Branch `ops/link-audit-final7f` · verify tip: `git rev-parse origin/ops/link-audit-final7f`
