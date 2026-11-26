# GATEO full-corpus link audit — **final7g**

Scope (owner, 2026-11-26): apply **only** final7e’s replace decisions, with the same replacement URLs. No new decisions. **keep-label = 0** (no language labels added). **unwrap = 0**. Rows whose final7e change was only a label or an unwrap are omitted. Mixed rows keep the original backup text and receive only the replace edits.

Source snapshot: final7e backup (`content_md5` of that read, **2026-11-25T19:31:41.144Z**). No corpus re-read. Every `UPDATE` guard was checked against `md5(content)` of that backup text. **DELETE/INSERT/DROP/ALTER = 0**.

| Metric | Count |
|---|---|
| URL replace decisions (unique old → new) | 46 |
| Replace operations (row × URL) | 51 |
| Replacements inside `content` | 52 |
| keep-label | 0 |
| unwrap | 0 |
| SQL rows (place_reviews) | 23 |
| SQL rows (reports) | 12 |
| SQL UPDATE statements | 35 |
| SQL DELETE statements | 0 |
| SQL INSERT statements | 0 |

7 final7e rows are not in this bundle: 6 were keep-label only, 1 was unwrap only (Tabelog `27001546`). The Sant Felip Neri thisisbarcelona link is not unwrapped. On that review the only edit is the final7e replace of the Gràcia `barcelona.cat` URL to `https://www.barcelona.cat/en/`.

Replace-only rows match final7e `content` and `content_blocks` exactly. Mixed rows differ from final7e because labels and unwraps are not applied.

## Why 52 content replacements, not 46

There are **46** distinct old→new URL pairs, and each is applied at least once. `content` contains **52** markdown replacements because four URLs occur more than once:

| Old URL | Times in `content` |
|---|---:|
| `https://thailand.prd.go.th/en/content/category/detail/id/52/iid/351342` | 4 |
| `https://www.kyoto-nishiki.or.jp/` | 2 |
| `https://guide.michelin.com/th/en/th-phang-nga-region/th-phang-nga/restaurant/krachang-khao-lak` | 2 |
| `https://booking.sunworld.vn/` | 2 |

Review `content_blocks` repeat the same edits in the text blocks (31 block replacements). That does not add decisions.

`rollback.sql` restores backup `content` (and `content_blocks` for reviews) for these 35 rows only.

## Artifact SHA256

See `SHA256SUMS` in this directory.

## Git

Branch `ops/link-audit-final7g` · verify tip: `git rev-parse origin/ops/link-audit-final7g`
