# GATEO full-corpus link audit — **final6**

Policy: KO → EN substitutes; official EN kept (bot-tolerant); official local-lang **keep + label**; unwrap non-official/dead only. MD5 guard = raw `content` bytes (no trim).

Corpus: **155** reviews + **39** reports.

| Metric | Count |
|---|---|
| URL decisions: keep | 257 |
| URL decisions: keep + language label | 25 |
| URL decisions: replace | 48 |
| URL decisions: unwrap | 60 |
| SQL rows (place_reviews) | 46 |
| SQL rows (reports) | 19 |
| Post-corpus scan URLs | 352 |
| Post-corpus issues | 60 |

## Unwrap list (reason)

- https://gleebooks.com.au/ — non-official-domain
- https://futar.bkk.hu/ — non-official-or-unverified
- https://hikarimasse.osaka-chushin.fun/ — non-official-or-unverified
- https://www.shochiku.co.jp/wp-content/uploads/2025/08/shochiku20250828-1.pdf — pdf-no-verified-home
- https://www.seaparadise.co.jp/institution/index.html — non-official-or-unverified
- https://www.mizuno-osaka.com/ — non-official-or-unverified
- https://tabelog.com/osaka/A2701/A270202/27001546/ — non-official-domain
- https://paris-carette.fr/nos-magasins/place-des-vosges/ — non-official-or-unverified
- https://www.hotel-de-sully.fr/ — non-official-or-unverified
- https://www.hotel-de-sully.fr/visiter/visites-et-activites — non-official-or-unverified
- https://zoobaeats.com/ — non-official-domain
- https://www.cafebatavia.com/ — non-official-or-unverified
- https://thegridfoodmarket.com/ — non-official-or-unverified
- https://www.keibunsha-store.com/ — non-official-or-unverified
- https://www.italia.it/it/veneto/venezia/isola-della-giudecca — fetch-This operation was aborted
- https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_2.pdf — pdf-no-verified-home
- https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_1.pdf — fetch-fetch failed
- https://thisisbarcelona.com/architecture/urban-spaces-and-elements/placa-de-sant-felip-neri — http-404
- https://www.llibrerialamemoria.com/ — non-official-or-unverified
- https://terrabartrobada.com/ — non-official-or-unverified
- https://parisjetaime.com/eng/culture/musee-d-orsay-p3592 — non-official-or-unverified
- https://www.lecafecharbon.fr/ — non-official-or-unverified
- https://leperchoir.fr/location/le-perchoir-menilmontant/ — non-official-or-unverified
- https://raw-gelaende.de/ — non-official-or-unverified
- https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/istanbul-ici-hatlar/uskudar-karakoy-eminonu-164 — non-official-or-unverified
- https://stohrer.fr/ — non-official-or-unverified
- https://cookislands.travel/islands/aitutaki — non-official-or-unverified
- https://cookislands.travel/supplier/vaka-cruise — non-official-or-unverified
- https://cookislands.travel/supplier/aitutaki-day-tour — non-official-or-unverified
- https://cookislands.travel/experiences/arts-culture/island-nights — non-official-or-unverified
- https://cookislands.travel/supplier/kia-orana-cruise-aitutaki — non-official-or-unverified
- https://www.parconazionale5terre.it/pagina.php?id=480 — non-official-or-unverified
- https://www.parconazionale5terre.it/rete-sentieristica.php — non-official-or-unverified
- https://www.rioscenarium.com.br/ — non-official-or-unverified
- https://www.barcariocadagema.com.br/ — non-official-or-unverified
- https://www.circovoador.com.br/ — non-official-or-unverified
- https://www.mercatllibertat.cat/ — non-official-or-unverified
- https://seaworld.com.au/park-info — non-official-or-unverified
- https://www.santiagoturismo.com/parques-e-xardins/parque-da-alameda — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_w72yrpjrk.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_gt26b85mb.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_4beg6wogw.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530301_kz74yhbox.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_82yzpvw80.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_dhpqvppdg.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_cxw7rtp9u.jpg — non-official-or-unverified
- https://phdjnbfitvmrguqzverm.supabase.co/storage/v1/object/public/images/1790252530302_pau5cr7sz.jpg — non-official-or-unverified
- https://zoobaeats.com/food — non-official-domain
- https://tofukuji.jp/guide/ — non-official-or-unverified
- https://www.eikando.or.jp/lp/2026/index.html — non-official-or-unverified
- https://actv.avmspa.it/sites/default/files/avm/navigazione/Actv_nav_linea_12.pdf — pdf-no-verified-home
- https://thesool.com/front/publication/M000000064/view.do?bbsId=A000000042&publicationId=C000003554 — non-official-or-unverified
- https://tofukuji.jp/ — non-official-or-unverified
- https://www.beritajakarta.id/potret-jakarta/album/19996/pemprov-dki-kembali-lakukan-perawatan-tugu-monas — non-official-or-unverified
- https://www.osakacastle.net/guide/ — non-official-or-unverified
- https://dsvn.vn/ — non-official-or-unverified
- https://vr.com.vn/tin-tuc/tuyen-duong-sat-ha-noi-lao-cai-tang-len-3-doi-tau-khach-moi-ngay — non-official-or-unverified
- https://sunworld.vn/en/fansipan/sunworld-news/notice-fansipan-cable-car-officially-resumes-operation-from-september-28-30074 — http-404
- https://sunworld.vn/vi/fansipan/tin-tuc-sunworld/dem-nguoc-combo-don-binh-minh-tren-dinh-fansipan-dieu-gi-cho-nguoi-day-som-o-do-cao-3143m-39960 — http-404
- https://commons.wikimedia.org/wiki/User:Irisgazer — http-404

## Keep + language label

- https://www.tcma.gov.taipei/News_Content.aspx?n=FAC14AD2DE4E01A4&s=0CFD6ED2C96E9CC4&sms=32F7BA052C5CA548 — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=FA645AE0684F4CBC&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.tcma.gov.taipei/News_Content.aspx?n=A90BF1B705D5AC0E&s=93592B425F56FEBB&sms=E5D0A9B8CEF9D29F — (중국어)
- https://www.pref.ishikawa.jp/siro-niwa/kenrokuen/ — (일본어)
- https://www.paris.fr/lieux/square-louis-xiii-36 — (프랑스어)
- https://mercadodetrianasevilla.com/horarios/ — (스페인어)
- https://mercadodetrianasevilla.com/comercio/bar-la-muralla/ — (스페인어)
- https://mercadodetrianasevilla.com/comercio/jamoneria-jose-luis-romero/ — (스페인어)
- https://www.paris.fr/lieux/marche-belleville-5475 — (프랑스어)
- https://www.paris.fr/lieux/marche-menilmontant-5478 — (프랑스어)
- https://www.paris.fr/lieux/marche-pyrenees-5533 — (프랑스어)
- https://www.paris.fr/lieux/parc-de-belleville-1777 — (프랑스어)
- https://www2.city.kyoto.lg.jp/kotsu/webguide/ja/bus/limited_express.html — (일본어)
- https://www.pref.nara.lg.jp/n113/39910.html — (일본어)
- https://www.pref.nara.lg.jp/site/park/2590.html — (일본어)
- https://www.pref.nara.lg.jp/site/park/1232.html — (일본어)
- https://museudoamanha.org.br/pt-br/ingressos — (포르투갈어)
- https://www.comune.venezia.it/it/content/la-previsione — (이탈리아어)
- https://ticketing.colosseo.it/ — (이탈리아어)
- https://cultura.gov.it/luogo/pantheon — (이탈리아어)
- https://portale.museiitaliani.it/b2c/buyTicketless/33f77159-0acd-40c4-8524-701f33aae108 — (이탈리아어)
- https://www.sovraintendenzaroma.it/content/da-luned%C3%AC-2-febbraio-nuove-modalit%C3%A0-di-visita-di-fontana-di-trevi — (이탈리아어)
- https://www.comune.roma.it/web/it/notizia/biglietto-dingresso-fontana-di-trevi.page — (이탈리아어)
- https://tickets.museivaticani.va/ — (이탈리아어)
- https://kuromon.com/jp/ — (일본어)

## Artifact SHA256

- REPORT.md: 6f68ecff6e3659e1242548fc8482f68c5d43a06c90c9da1d687d645548cecea8
- backup.json: 094e042692ec60e0597bffcd8b275dea209f2739218c998139d8c2c7f1d746af
- update.sql: 871cd05992e71b6fbb316207c427a464889b00be27682de51d5880f94397cfec
- rollback.sql: 64f8e320b41c1a17efead51c6363ff93e94f162e5400cbbcb3c38154b6be7597

Branch: `ops/link-audit-final6` · commit: `9b04bfcdf34ad625928034cd61430d5980d668cb`
