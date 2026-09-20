type MagazineLocale = "ko" | "en";

function normalizeMagazineLocale(raw: unknown): MagazineLocale {
  const v = String(raw ?? "ko").trim().toLowerCase();
  return v === "en" ? "en" : "ko";
}

export function magazineStorageId(canonicalId: string, locale: MagazineLocale): string {
  const base = String(canonicalId ?? "").trim();
  if (!base) return base;
  return locale === "en" && !base.endsWith("@en") ? `${base}@en` : base;
}

export function buildMagazinePrompt(locationName: string, localeRaw: unknown = "ko"): string {
  const locale = normalizeMagazineLocale(localeRaw);
  return locale === "en"
    ? buildMagazinePromptEn(locationName)
    : buildMagazinePromptKo(locationName);
}

export function buildMagazineJsonStabilityAppendix(localeRaw: unknown = "ko"): string {
  const locale = normalizeMagazineLocale(localeRaw);
  if (locale === "en") {
    return `

[JSON output stabilization — this request only]
- Return a pure JSON array with no extra commentary.
- Use escaped \\n\\n inside JSON strings for line breaks — never literal Enter characters.
- Keep each sections[].content between ~800 and 1400 characters so the JSON is not truncated.
- Keep all 7 section titles, guidelines, and tone exactly as specified.
`;
  }
  return `

[JSON 출력 안정화 — 이번 요청만 적용]
- 부가 설명 없이 순수 JSON 배열만 출력하세요.
- content 안의 줄바꿈은 실제 Enter가 아니라 반드시 이스케이프된 \\n\\n 문자열로 넣으세요.
- 각 sections[].content는 800~1400자 내외로 유지해 JSON이 중간에 잘리지 않게 하세요.
- 7개 섹션 제목·가이드라인·톤은 그대로 유지하세요.
`;
}

function buildMagazinePromptKo(locationName: string) {
  return `
    당신은 세계적인 하이엔드 여행 매거진 'Conde Nast Traveler'의 수석 에디터이자, 10년 이상 현지에서 머물며 로컬의 일상과 숨겨진 서사를 탐구해온 여행 에세이스트입니다.
    아래 장소들에 대해 독자가 글을 읽는 순간 당장 비행기 표를 끊고 싶게 만드는, 압도적인 몰입감과 깊이를 가진 '피처(Feature) 기사'를 작성하세요.
    단순한 정보 나열을 절대 금지하며, 한 권의 문학적인 여행 수필처럼 길고 유려한 호흡으로 서술해야 합니다.
    결과는 반드시 하나의 JSON 배열로 반환해야 합니다.

    [대상 여행지]
    ${locationName}

    [절대 엄수: 작성 가이드라인 및 제약사항]
    1. 압도적인 분량과 리듬감 (Volume & Rhythm): 가벼운 요약이 아닌 깊이 있는 서사를 작성하세요. 단, 글이 지루하지 않도록 시선을 끄는 짧은 문장(단문)과 깊이 있는 묘사의 긴 문장(장문)을 교차로 사용해 글의 리듬감을 만드세요. 모바일 가독성을 위해 최대 2~3문장마다 반드시 이중 줄바꿈(\\n\\n)을 삽입하세요.
    2. 5감(Senses) 자극 묘사: '아름답다', '멋지다' 같은 상투적인 표현을 철저히 배제하세요. 독자가 그곳의 공기 냄새, 파도 소리, 오래된 골목의 질감, 햇살의 온도를 직접 느낄 수 있도록 문학적이고 감각적인 은유를 적극 사용하세요.
    3. 비관적 정보 검증 (Pessimistic First): 특정 식당, 카페, 숙소의 '상호명'은 폐업할 수 있으므로 절대 적지 마세요. 대신 '특정 거리(Street)'의 분위기나 '반드시 먹어봐야 할 현지 음식의 종류'를 깊이 있게 묘사하세요.
    4. 섬세한 여백 (줄바꿈 강제): 문단과 문단 사이, 소제목과 본문 사이에는 반드시 명시적인 이중 줄바꿈(\\n\\n)을 삽입하여 긴 글임에도 모바일에서 텍스트가 숨을 쉴 수 있게 하세요.
    5. 지명 사용의 미학: place_id로 제공된 장소 이름을 본문 전체에 걸쳐 최소 3~5회 이상 자연스럽게 녹여내세요. 독자가 자신이 어디에 있는지 명확히 인지할 수 있도록, 기계적인 반복이 아닌 문장의 흐름 속에 유려하게 배치하세요. (단, 영문 병기는 여전히 금지합니다.)
    6. 시각적 닻 (Visual Anchor): 새로운 핵심 문단이 시작될 때, 문장 첫머리에 [ 에디터의 시선 ], [ 미각의 기억 ] 처럼 대괄호를 활용한 짧고 감각적인 키워드를 달아 독자의 시선이 머물게 하세요. (주의: 글머리 기호(•)나 숫자 넘버링은 딱딱해 보이므로 절대 사용하지 마세요.)
    7. 다채로운 어미와 어조 (Tone of Voice & Ending): 에디터가 독자에게 이야기하듯 세련되고 정중한 경어체를 사용하되, 문장의 끝맺음을 다양하게 변주하세요. '~합니다', '~해요' 뿐만 아니라, 때로는 명사로 끝내어 여운을 남기거나('~하는 법.', '~풍경.'), 가벼운 감탄형, 의문형을 섞어 글이 딱딱하게 끊어지지 않고 물 흐르듯 이어지게 하세요. 절대 '~한다', '~이다'와 같은 반말/문어체는 사용하지 마세요.
    8. 지명의 배치 전략: 특히 'summary(에디터의 프롤로그)'와 'sections' 중 '[ 에디터의 시선 ]' 혹은 '[ 시간의 흔적 ]' 부분에서는 반드시 해당 장소의 이름을 직접 언급하여 서사의 주인공이 누구인지 명확히 하세요.

    [JSON 구조 및 7단계 심층 기사 요구사항]
    [
      {
        "place_id": "${locationName}",
        "summary": "단순 요약이 아닌 '에디터의 프롤로그(Prologue)'. 왜 지금 이 장소로 떠나야 하는가에 대한 철학적인 질문과 감상을 다채로운 호흡으로 서술하세요 (이모지 2~3개 포함).",
        "sections": [
          {
            "title": "📜 장소의 숨겨진 서사",
            "content": "[ 시간의 흔적 ]\\n이 도시가 지금의 분위기를 갖게 된 흥미로운 배경 이야기. 시간의 흐름을 느낄 수 있게 서술.\\n\\n[ 에디터의 시선 ]\\n(서사 포인트 1에 대한 깊이 있는 설명, 앞 단락과 자연스럽게 이어지도록)\\n\\n[ 잊혀진 기록 ]\\n(서사 포인트 2에 대한 깊이 있는 설명)"
          },
          {
            "title": "🗺️ 시크릿 스팟 & 로컬 루트",
            "content": "[ 숨겨진 골목 ]\\n대부분의 여행자가 랜드마크에 머물 때, 발길이 잘 닿지 않는 한적한 명소 추천. 직접 걸어보는 듯한 시각적 묘사 필수.\\n\\n[ 로컬의 발자취 ]\\n그곳에서만 느낄 수 있는 고요함과 생명력에 대한 서술."
          },
          {
            "title": "🍽️ 미식과 로컬 다이닝",
            "content": "[ 미각의 기억 ]\\n반드시 맛봐야 할 로컬 식재료, 현지인들의 식사 문화. 혀끝에 맴도는 맛과 골목의 음식 냄새를 상상할 수 있는 미각적 묘사 (상호명 절대 금지).\\n\\n[ 로컬 다이닝 팁 ]\\n시장 분위기나 식사 시간대 등 현지식 바이브에 대한 묘사."
          },
          {
            "title": "🛏️ 스테이 & 지역 분위기",
            "content": "[ 창밖의 풍경 ]\\n숙소 위치 선정 팁. 창밖으로 보이는 풍경과 동네의 백그라운드 노이즈(소음, 새소리 등)까지 묘사하여 각 지구의 매력을 대조적으로 서술.\\n\\n[ 머무름의 미학 ]\\n어떤 분위기의 고독이나 활기를 선택해야 할지에 대한 조언."
          },
          {
            "title": "🚌 실전 이동망",
            "content": "[ 길 위의 풍경 ]\\n공항에서 시내 가는 효율적인 방법, 현지 최적의 교통수단.\\n\\n[ 여행자의 발걸음 ]\\n창밖으로 스쳐 지나가는 풍경 등 이동하는 과정 자체가 여행이 되는 팁 제공."
          },
          {
            "title": "⚠️ 로컬 매너 & 치안",
            "content": "[ 현지인의 귀띔 ]\\n여행자가 흔히 하는 실수, 금기사항, 소매치기 주의 구역 등 실존하는 위험 정보.\\n\\n[ 안전한 여정 ]\\n현지 가이드가 조용히 귀띔해주듯 진지하고 상세하게 서술."
          },
          {
            "title": "🗓️ 완벽한 타이밍",
            "content": "[ 계절의 호흡 ]\\n여행하기 가장 눈부신 시기, 피해야 할 우기, 또는 특별한 로컬 축제 정보.\\n\\n[ 여행의 온도 ]\\n계절의 온습도와 바람의 변화가 장소에 미치는 마법 같은 영향 묘사."
          }
        ]
      }
    ]
    
    부가 설명 없이 순수 JSON 배열만 출력하세요.
    content 필드의 줄바꿈은 실제 Enter가 아니라 JSON 문자열 안의 \\n\\n 이스케이프로만 넣으세요.
    `;
}

function buildMagazinePromptEn(locationName: string) {
  return `
    You are the lead editor of a world-class luxury travel magazine in the tradition of Condé Nast Traveler — and a travel essayist who has lived on the ground for more than a decade, tracing everyday life and hidden narratives locals rarely put on postcards.
    For the destination below, write a feature article with overwhelming immersion and depth — the kind that makes a reader want to book a flight before they finish the page.
    Never reduce this to a listicle. Write with the long, lyrical breath of literary travel writing.
    You must return exactly one JSON array.

    [Destination]
    ${locationName}

    [Non‑negotiable guidelines]
    1. Volume & rhythm: This is not a light summary — build a deep narrative. Alternate punchy short sentences with longer, layered descriptions so the piece breathes. For mobile readability, insert a double line break (\\n\\n) every 2–3 sentences at most.
    2. Sensory writing: Ban lazy words like "beautiful," "amazing," or "stunning." Let readers smell the air, hear the surf, feel old stone under their fingertips, and sense the temperature of the light through precise, literary metaphor.
    3. Pessimistic verification: Never name specific restaurants, cafés, or hotels — they close. Instead, describe the mood of a street, a district, or a type of local food travelers should seek.
    4. White space: Between paragraphs and between anchors and body copy, always use explicit double line breaks (\\n\\n) so long copy still feels airy on mobile.
    5. Place naming: Weave the destination name (${locationName}) naturally through the piece at least 3–5 times so readers always know where they are — never mechanical repetition. Do not add Korean or other-language glosses beside the English name.
    6. Visual anchors: When a new beat begins, open with a short bracketed sensory keyword such as [ Editor's eye ] or [ Taste memory ]. Never use bullet points (•) or numbered lists — they feel editorially stiff.
    7. Tone: Speak to the reader as a polished magazine editor — warm, confident, second person where natural. Vary sentence endings: statements, a occasional question, sometimes a noun phrase left hanging ("A city of marble at dusk."). Avoid dry encyclopedic tone.
    8. Placement: In the summary (editor's prologue) and in sections that open with [ Editor's eye ] or [ Traces of time ], name the destination explicitly so the narrative has a clear protagonist.

    [JSON structure — seven deep feature sections]
    [
      {
        "place_id": "${locationName}",
        "summary": "Not a blurb — an editor's prologue. Why travel here now? Philosophical pull, layered rhythm, 2–3 emojis.",
        "sections": [
          {
            "title": "📜 Hidden stories of the place",
            "content": "[ Traces of time ]\\nHow this place became what it feels like today — history you can sense in the streets.\\n\\n[ Editor's eye ]\\n(A deep narrative beat that flows from the previous paragraph.)\\n\\n[ Forgotten record ]\\n(A second historical or cultural thread.)"
          },
          {
            "title": "🗺️ Secret spots & local routes",
            "content": "[ Hidden alley ]\\nWhere travelers who only chase landmarks miss the quiet corners — write as if the reader is walking beside you.\\n\\n[ Local footsteps ]\\nThe particular stillness or vitality only found here."
          },
          {
            "title": "🍽️ Food & local dining",
            "content": "[ Taste memory ]\\nIngredients, market culture, and meals locals actually eat — evoke scent and texture (no venue names).\\n\\n[ Local dining tip ]\\nMarket rhythm, mealtimes, and neighborhood dining vibes."
          },
          {
            "title": "🛏️ Stays & neighborhood vibe",
            "content": "[ View from the window ]\\nHow to choose where to stay — what you might hear or see outside, district by district.\\n\\n[ Aesthetics of staying ]\\nWhether to seek solitude or buzz."
          },
          {
            "title": "🚌 Getting around in practice",
            "content": "[ Scenery on the road ]\\nAirport-to-city moves and the most sensible local transport.\\n\\n[ Traveler's steps ]\\nMake the journey itself part of the trip."
          },
          {
            "title": "⚠️ Local manners & safety",
            "content": "[ A local whisper ]\\nCommon tourist mistakes, taboos, pickpocket zones — real, grounded cautions.\\n\\n[ A safe journey ]\\nSerious, detailed, as if a guide is murmuring advice."
          },
          {
            "title": "🗓️ Perfect timing",
            "content": "[ Breath of the season ]\\nBest seasons, rains to avoid, festivals worth planning around.\\n\\n[ Temperature of the trip ]\\nHow humidity, wind, and light reshape the place."
          }
        ]
      }
    ]

    Return only the JSON array — no commentary.
    Line breaks inside content must be escaped as \\n\\n inside JSON strings, never literal newlines.
    `;
}
