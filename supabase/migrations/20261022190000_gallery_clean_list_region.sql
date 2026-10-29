-- Save-path only. This file is not applied by the app.
-- gallery_clean_list filters the candidate payload (host sanitize, gallery_photo_exclusions,
-- and a foreign city/country mention). It does not UPDATE or DELETE place_stats.
-- Stored photos stay on gallery_keep_stored. A region mismatch does not strip them.
-- GALLERY_PURGE_STORED_PHOTOS is false on the client for the same reason.

CREATE OR REPLACE FUNCTION public.gallery_fold_place_text(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      translate(
        lower(coalesce(p_text, '')),
        'áàâäãåéèêëíìîïóòôöõúùûüýÿñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÝÑÇ',
        'aaaaaaeeeeiiiiooooouuuuyyncaaaaaaeeeeiiiiooooouuuuync'
      ),
      '[._-]+', ' ', 'g'
    ),
    '[[:space:]]+', ' ', 'g'
  ));
$$;

CREATE OR REPLACE FUNCTION public.gallery_alias_hit(p_folded text, p_alias text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
  v_alias text := public.gallery_fold_place_text(p_alias);
BEGIN
  IF coalesce(p_folded, '') = '' OR v_alias = '' THEN
    RETURN false;
  END IF;
  IF v_alias ~ '[^a-z0-9 ]' THEN
    IF char_length(v_alias) < 2 THEN
      RETURN false;
    END IF;
    RETURN strpos(p_folded, v_alias) > 0;
  END IF;
  IF char_length(replace(v_alias, ' ', '')) < 4 AND v_alias NOT IN ('usa', 'uae', 'uk', 'nyc', 'rio') THEN
    RETURN false;
  END IF;
  RETURN p_folded ~ ('(^|[^a-z0-9])' || v_alias || '([^a-z0-9]|$)');
END;
$$;

CREATE OR REPLACE FUNCTION public.gallery_place_alias_list()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT $gallery_aliases$
[
  {
    "id": "bangkok",
    "city": [
      "Bangkok",
      "방콕"
    ],
    "country": [
      "Thailand",
      "태국"
    ]
  },
  {
    "id": "barcelona",
    "city": [
      "Barcelona",
      "바르셀로나"
    ],
    "country": [
      "Spain",
      "España",
      "스페인"
    ]
  },
  {
    "id": "madrid",
    "city": [
      "Madrid",
      "마드리드"
    ],
    "country": [
      "Spain",
      "España",
      "스페인"
    ]
  },
  {
    "id": "seville",
    "city": [
      "Seville",
      "세비야",
      "Sevilla"
    ],
    "country": [
      "Spain",
      "España",
      "스페인"
    ]
  },
  {
    "id": "paris",
    "city": [
      "Paris",
      "파리"
    ],
    "country": [
      "France",
      "프랑스"
    ]
  },
  {
    "id": "london",
    "city": [
      "London",
      "런던"
    ],
    "country": [
      "United Kingdom",
      "England",
      "영국",
      "잉글랜드"
    ]
  },
  {
    "id": "tokyo",
    "city": [
      "Tokyo",
      "도쿄"
    ],
    "country": [
      "Japan",
      "일본"
    ]
  },
  {
    "id": "kyoto",
    "city": [
      "Kyoto",
      "교토"
    ],
    "country": [
      "Japan",
      "일본"
    ]
  },
  {
    "id": "osaka",
    "city": [
      "Osaka",
      "오사카"
    ],
    "country": [
      "Japan",
      "일본"
    ]
  },
  {
    "id": "singapore",
    "city": [
      "Singapore",
      "싱가포르"
    ],
    "country": [
      "Singapore",
      "싱가포르"
    ]
  },
  {
    "id": "sydney",
    "city": [
      "Sydney",
      "시드니"
    ],
    "country": [
      "Australia",
      "호주"
    ]
  },
  {
    "id": "hanoi",
    "city": [
      "Hanoi",
      "하노이"
    ],
    "country": [
      "Vietnam",
      "베트남"
    ]
  },
  {
    "id": "edinburgh",
    "city": [
      "Edinburgh",
      "에딘버러"
    ],
    "country": [
      "Scotland",
      "스코틀랜드"
    ]
  },
  {
    "id": "san-francisco",
    "city": [
      "San Francisco",
      "샌프란시스코"
    ],
    "country": [
      "United States",
      "USA",
      "미국"
    ]
  },
  {
    "id": "shanghai",
    "city": [
      "Shanghai",
      "상하이"
    ],
    "country": [
      "China",
      "중국"
    ]
  },
  {
    "id": "toronto",
    "city": [
      "Toronto",
      "토론토"
    ],
    "country": [
      "Canada",
      "캐나다"
    ]
  },
  {
    "id": "florence",
    "city": [
      "Florence",
      "피렌체",
      "Firenze"
    ],
    "country": [
      "Italy",
      "이탈리아"
    ]
  },
  {
    "id": "istanbul",
    "city": [
      "Istanbul",
      "이스탄불"
    ],
    "country": [
      "Turkey",
      "Türkiye",
      "튀르키예",
      "터키"
    ]
  },
  {
    "id": "lisbon",
    "city": [
      "Lisbon",
      "리스본"
    ],
    "country": [
      "Portugal",
      "포르투갈"
    ]
  },
  {
    "id": "seoul",
    "city": [
      "Seoul",
      "서울"
    ],
    "country": [
      "South Korea",
      "Korea",
      "한국",
      "대한민국"
    ]
  },
  {
    "id": "hong-kong",
    "city": [
      "Hong Kong",
      "홍콩"
    ],
    "country": [
      "China",
      "중국"
    ]
  },
  {
    "id": "prague",
    "city": [
      "Prague",
      "프라하"
    ],
    "country": [
      "Czech Republic",
      "Czechia",
      "체코"
    ]
  },
  {
    "id": "cairo",
    "city": [
      "Cairo",
      "카이로"
    ],
    "country": [
      "Egypt",
      "이집트"
    ]
  },
  {
    "id": "jeju",
    "city": [
      "Jeju",
      "제주"
    ],
    "country": [
      "South Korea",
      "Korea",
      "한국",
      "대한민국"
    ]
  },
  {
    "id": "rio-de-janeiro",
    "city": [
      "Rio de Janeiro",
      "리우데자네이루"
    ],
    "country": [
      "Brazil",
      "브라질"
    ]
  },
  {
    "id": "dubai",
    "city": [
      "Dubai",
      "두바이"
    ],
    "country": [
      "United Arab Emirates",
      "아랍에미리트"
    ]
  },
  {
    "id": "macau",
    "city": [
      "Macau",
      "마카오",
      "Macao"
    ],
    "country": [
      "China",
      "중국"
    ]
  },
  {
    "id": "rome",
    "city": [
      "Rome",
      "로마"
    ],
    "country": [
      "Italy",
      "이탈리아"
    ]
  },
  {
    "id": "venice",
    "city": [
      "Venice",
      "베니스",
      "Venezia"
    ],
    "country": [
      "Italy",
      "이탈리아"
    ]
  },
  {
    "id": "berlin",
    "city": [
      "Berlin",
      "베를린"
    ],
    "country": [
      "Germany",
      "독일"
    ]
  },
  {
    "id": "munich",
    "city": [
      "Munich",
      "뮌헨"
    ],
    "country": [
      "Germany",
      "독일"
    ]
  },
  {
    "id": "amsterdam",
    "city": [
      "Amsterdam",
      "암스테르담"
    ],
    "country": [
      "Netherlands",
      "네덜란드"
    ]
  },
  {
    "id": "vienna",
    "city": [
      "Vienna",
      "빈"
    ],
    "country": [
      "Austria",
      "오스트리아"
    ]
  },
  {
    "id": "budapest",
    "city": [
      "Budapest",
      "부다페스트"
    ],
    "country": [
      "Hungary",
      "헝가리"
    ]
  },
  {
    "id": "athens",
    "city": [
      "Athens",
      "아테네"
    ],
    "country": [
      "Greece",
      "그리스"
    ]
  },
  {
    "id": "new-york",
    "city": [
      "New York",
      "뉴욕",
      "New York City",
      "NYC"
    ],
    "country": [
      "United States",
      "USA",
      "미국"
    ]
  },
  {
    "id": "los-angeles",
    "city": [
      "Los Angeles",
      "로스앤젤레스"
    ],
    "country": [
      "United States",
      "USA",
      "미국"
    ]
  },
  {
    "id": "chicago",
    "city": [
      "Chicago",
      "시카고"
    ],
    "country": [
      "United States",
      "USA",
      "미국"
    ]
  },
  {
    "id": "vancouver",
    "city": [
      "Vancouver",
      "밴쿠버"
    ],
    "country": [
      "Canada",
      "캐나다"
    ]
  },
  {
    "id": "taipei",
    "city": [
      "Taipei",
      "타이베이"
    ],
    "country": [
      "Taiwan",
      "대만"
    ]
  },
  {
    "id": "kuala-lumpur",
    "city": [
      "Kuala Lumpur",
      "쿠알라룸푸르"
    ],
    "country": [
      "Malaysia",
      "말레이시아"
    ]
  },
  {
    "id": "jakarta",
    "city": [
      "Jakarta",
      "자카르타"
    ],
    "country": [
      "Indonesia",
      "인도네시아"
    ]
  },
  {
    "id": "phuket",
    "city": [
      "Phuket",
      "푸켓"
    ],
    "country": [
      "Thailand",
      "태국"
    ]
  },
  {
    "id": "chiang-mai",
    "city": [
      "Chiang Mai",
      "치앙마이"
    ],
    "country": [
      "Thailand",
      "태국"
    ]
  },
  {
    "id": "melbourne",
    "city": [
      "Melbourne",
      "멜버른"
    ],
    "country": [
      "Australia",
      "호주"
    ]
  },
  {
    "id": "auckland",
    "city": [
      "Auckland",
      "오클랜드"
    ],
    "country": [
      "New Zealand",
      "뉴질랜드"
    ]
  },
  {
    "id": "moscow",
    "city": [
      "Moscow",
      "모스크바"
    ],
    "country": [
      "Russia",
      "러시아"
    ]
  },
  {
    "id": "warsaw",
    "city": [
      "Warsaw",
      "바르샤바"
    ],
    "country": [
      "Poland",
      "폴란드"
    ]
  },
  {
    "id": "stockholm",
    "city": [
      "Stockholm",
      "스톡홀름"
    ],
    "country": [
      "Sweden",
      "스웨덴"
    ]
  },
  {
    "id": "oslo",
    "city": [
      "Oslo",
      "오슬로"
    ],
    "country": [
      "Norway",
      "노르웨이"
    ]
  },
  {
    "id": "copenhagen",
    "city": [
      "Copenhagen",
      "코펜하겐"
    ],
    "country": [
      "Denmark",
      "덴마크"
    ]
  },
  {
    "id": "dublin",
    "city": [
      "Dublin",
      "더블린"
    ],
    "country": [
      "Ireland",
      "아일랜드"
    ]
  },
  {
    "id": "zurich",
    "city": [
      "Zurich",
      "취리히",
      "Zürich"
    ],
    "country": [
      "Switzerland",
      "스위스"
    ]
  },
  {
    "id": "geneva",
    "city": [
      "Geneva",
      "제네바"
    ],
    "country": [
      "Switzerland",
      "스위스"
    ]
  },
  {
    "id": "brussels",
    "city": [
      "Brussels",
      "브뤼셀"
    ],
    "country": [
      "Belgium",
      "벨기에"
    ]
  },
  {
    "id": "porto",
    "city": [
      "Porto",
      "포르투"
    ],
    "country": [
      "Portugal",
      "포르투갈"
    ]
  },
  {
    "id": "milan",
    "city": [
      "Milan",
      "밀라노"
    ],
    "country": [
      "Italy",
      "이탈리아"
    ]
  },
  {
    "id": "fukuoka",
    "city": [
      "Fukuoka",
      "후쿠오카"
    ],
    "country": [
      "Japan",
      "일본"
    ]
  },
  {
    "id": "sapporo",
    "city": [
      "Sapporo",
      "삿포로"
    ],
    "country": [
      "Japan",
      "일본"
    ]
  },
  {
    "id": "hawaii",
    "city": [
      "Hawaii",
      "하와이"
    ],
    "country": [
      "Hawaii",
      "United States",
      "USA",
      "미국",
      "하와이"
    ]
  },
  {
    "id": "honolulu",
    "city": [
      "Honolulu",
      "호놀룰루"
    ],
    "country": [
      "Hawaii",
      "United States",
      "USA",
      "미국",
      "하와이"
    ]
  },
  {
    "id": "cape-town",
    "city": [
      "Cape Town",
      "케이프타운"
    ],
    "country": [
      "South Africa",
      "남아프리카공화국"
    ]
  },
  {
    "id": "marrakech",
    "city": [
      "Marrakech",
      "마라케시"
    ],
    "country": [
      "Morocco",
      "모로코"
    ]
  },
  {
    "id": "delhi",
    "city": [
      "Delhi",
      "델리"
    ],
    "country": [
      "India",
      "인도"
    ]
  },
  {
    "id": "cancun",
    "city": [
      "Cancun",
      "칸쿤"
    ],
    "country": [
      "Mexico",
      "멕시코"
    ]
  },
  {
    "id": "buenos-aires",
    "city": [
      "Buenos Aires",
      "부에노스아이레스"
    ],
    "country": [
      "Argentina",
      "아르헨티나"
    ]
  },
  {
    "id": "manila",
    "city": [
      "Manila",
      "마닐라"
    ],
    "country": [
      "Philippines",
      "필리핀"
    ]
  },
  {
    "id": "queenstown",
    "city": [
      "Queenstown",
      "퀸스타운"
    ],
    "country": [
      "New Zealand",
      "뉴질랜드"
    ]
  },
  {
    "id": "reykjavik",
    "city": [
      "Reykjavik",
      "레이캬비크"
    ],
    "country": [
      "Iceland",
      "아이슬란드"
    ]
  },
  {
    "id": "helsinki",
    "city": [
      "Helsinki",
      "헬싱키"
    ],
    "country": [
      "Finland",
      "핀란드"
    ]
  },
  {
    "id": "hamburg",
    "city": [
      "Hamburg",
      "함부르크"
    ],
    "country": [
      "Germany",
      "독일"
    ]
  },
  {
    "id": "ho-chi-minh-city",
    "city": [
      "Ho Chi Minh City",
      "Ho Chi Minh",
      "Saigon",
      "호치민",
      "사이공"
    ],
    "country": [
      "Vietnam",
      "베트남"
    ]
  },
  {
    "id": "busan",
    "city": [
      "Busan",
      "Pusan",
      "부산"
    ],
    "country": [
      "South Korea",
      "Korea",
      "한국",
      "대한민국"
    ]
  },
  {
    "id": "beijing",
    "city": [
      "Beijing",
      "Peking",
      "베이징"
    ],
    "country": [
      "China",
      "중국"
    ]
  },
  {
    "id": "dresden",
    "city": [
      "Dresden",
      "드레스덴"
    ],
    "country": [
      "Germany",
      "독일"
    ]
  },
  {
    "id": "peterhof",
    "city": [
      "Peterhof",
      "Petergof",
      "Петергоф",
      "페테르고프"
    ],
    "country": [
      "Russia",
      "러시아"
    ]
  },
  {
    "id": "saint-petersburg",
    "city": [
      "Saint Petersburg",
      "St Petersburg",
      "St. Petersburg",
      "상트페테르부르크"
    ],
    "country": [
      "Russia",
      "러시아"
    ]
  }
]
  $gallery_aliases$::jsonb;
$$;

CREATE OR REPLACE FUNCTION public.gallery_foreign_place(p_place_id text, p_item jsonb)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  v_text text;
  v_fold text;
  v_key text;
  v_target jsonb;
  v_entry jsonb;
  v_alias text;
BEGIN
  IF p_item IS NULL OR jsonb_typeof(p_item) <> 'object' THEN
    RETURN false;
  END IF;
  v_text := concat_ws(' ',
    p_item ->> 'description',
    p_item ->> 'alt_description',
    p_item ->> 'alt',
    p_item #>> '{location,name}',
    p_item #>> '{location,city}',
    p_item #>> '{location,country}',
    p_item #>> '{location,title}'
  );
  v_fold := public.gallery_fold_place_text(v_text);
  IF v_fold = '' THEN
    RETURN false;
  END IF;
  v_key := public.gallery_fold_place_text(p_place_id);
  SELECT value INTO v_target
  FROM jsonb_array_elements(public.gallery_place_alias_list()) AS e(value)
  WHERE public.gallery_fold_place_text(value ->> 'id') = v_key
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements_text(value -> 'city') AS a(alias)
       WHERE public.gallery_fold_place_text(a.alias) = v_key
     )
  LIMIT 1;
  IF v_target IS NULL THEN
    RETURN false;
  END IF;
  FOR v_alias IN SELECT jsonb_array_elements_text(v_target -> 'city') LOOP
    IF public.gallery_alias_hit(v_fold, v_alias) THEN
      RETURN false;
    END IF;
  END LOOP;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(public.gallery_place_alias_list()) AS e(value) LOOP
    IF v_entry ->> 'id' = v_target ->> 'id' THEN
      CONTINUE;
    END IF;
    FOR v_alias IN SELECT jsonb_array_elements_text(v_entry -> 'city') LOOP
      IF public.gallery_alias_hit(v_fold, v_alias) THEN
        RETURN true;
      END IF;
    END LOOP;
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(v_target -> 'country') AS tc(alias)
      JOIN jsonb_array_elements_text(v_entry -> 'country') AS oc(alias)
        ON public.gallery_fold_place_text(tc.alias) = public.gallery_fold_place_text(oc.alias)
       AND public.gallery_fold_place_text(tc.alias) <> ''
    ) THEN
      CONTINUE;
    END IF;
    FOR v_alias IN SELECT jsonb_array_elements_text(v_entry -> 'country') LOOP
      IF public.gallery_alias_hit(v_fold, v_alias) THEN
        RETURN true;
      END IF;
    END LOOP;
  END LOOP;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.gallery_clean_list(p_place_id text, p_list jsonb, p_max integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO ''
AS $$
  WITH raw AS (
    SELECT x, public.gallery_sanitize_item(x) AS s, o
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_list) = 'array' THEN p_list ELSE '[]'::jsonb END)
         WITH ORDINALITY AS e(x, o)
  ), ok AS (
    SELECT s, o,
           public.gallery_url_key(coalesce(s #>> '{urls,regular}', s #>> '{urls,small}')) AS k
    FROM raw
    WHERE s IS NOT NULL
      AND NOT public.gallery_is_excluded(p_place_id, s)
      AND NOT public.gallery_foreign_place(p_place_id, x)
  ), d AS (
    SELECT s, o,
           row_number() OVER (PARTITION BY s ->> 'id' ORDER BY o) AS rn_id,
           row_number() OVER (PARTITION BY k ORDER BY o) AS rn_k
    FROM ok
  )
  SELECT coalesce(jsonb_agg(s ORDER BY o), '[]'::jsonb)
  FROM (SELECT s, o FROM d WHERE rn_id = 1 AND rn_k = 1 ORDER BY o LIMIT p_max) z;
$$;

REVOKE ALL ON FUNCTION public.gallery_fold_place_text(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gallery_alias_hit(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gallery_place_alias_list() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gallery_foreign_place(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gallery_fold_place_text(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.gallery_alias_hit(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.gallery_place_alias_list() TO service_role;
GRANT EXECUTE ON FUNCTION public.gallery_foreign_place(text, jsonb) TO service_role;
