// src/pages/Home/data/travelVideos.js

export const TRAVEL_VIDEOS = {
  // 101: 중복 제거 및 기본 구조 유지
  101: [
    { id: "yHn4gzVCOyg", title: "Main Cinematic", type: "main" }
  ],
  102: [{ id: "KQwL4YigOD8", title: "Santorini View", type: "main" }],
  
  // 103: 상세 콘텐츠 확장 (AI 분석 및 썸네일 포함)
103: [
    {
      id: "oy8G1A4cuV8",
      title: "신들의 바다 정원, 팔라우 여행 브이로그 (리조트, 투어)",
      type: "main",
      ai_context: {
        summary: "가장 최근(2024년말) 업로드된 커플 여행기입니다. PPR 리조트의 실제 모습과 스노클링 투어, 밀키웨이의 현장감을 생생하게 느낄 수 있어요.",
        tags: ["#커플여행", "#리조트후기", "#밀키웨이", "#최신근황"],
        best_moment: {
          time: "03:20",
          desc: "에메랄드빛 바다 색감이 가장 예쁘게 잡힌 순간"
        }
      }
    },
    {
      id: "9JWEmcVpPlk",
      title: "최신 팔라우 여행정보 총정리 (입국, 준비물, 꿀팁)",
      type: "youtube",
      ai_context: {
        summary: "단순 브이로그를 넘어 여행 준비에 필요한 실질적인 정보(입국, 로밍, 썬크림 등)를 꼼꼼하게 다룬 영상이라 여행 전 필수 시청 영상입니다.",
        tags: ["#여행꿀팁", "#준비물", "#자유여행", "#정보"],
        best_moment: {
          time: "01:45",
          desc: "놓치기 쉬운 팔라우 입국 관련 중요 포인트 설명"
        }
      }
    },
    {
      id: "r80KLRWB4B4",
      title: "[VLOG] 신들의 정원에 가보았다 (시네마틱 영상미)",
      type: "youtube",
      ai_context: {
        summary: "조회수 190만 회가 넘는 레전드 영상입니다. 팔라우의 대자연을 한 편의 영화처럼 담아내어 영상미가 압도적입니다.",
        tags: ["#영상미", "#시네마틱", "#힐링", "#드론샷"],
        best_moment: {
          time: "02:10",
          desc: "드론으로 촬영한 세븐티 아일랜드의 장엄한 전경"
        }
      }
    },
    {
      id: "JPKcFAyDmh8",
      title: "다이버들의 성지, 팔라우 수중 탐험 브이로그",
      type: "youtube",
      ai_context: {
        summary: "팔라우 여행의 핵심인 '스쿠버 다이빙' 위주의 영상입니다. 실제 다이버가 바닷속에서 찍은 거북이와 상어 영상을 볼 수 있습니다.",
        tags: ["#스쿠버다이빙", "#수중촬영", "#거북이", "#액티비티"],
        best_moment: {
          time: "08:30",
          desc: "눈앞에서 유유히 헤엄치는 거북이와의 조우"
        }
      }
    },
    {
      id: "_SNLEZGcmZ0",
      title: "산호로 둘러싸인 바다 정원 (고화질 방송 클립)",
      type: "youtube",
      ai_context: {
        summary: "전문 방송팀이 촬영하여 화질이 매우 깨끗합니다. 젤리피쉬 레이크와 롱비치 등 팔라우의 주요 명소를 깔끔하게 요약해서 볼 수 있습니다.",
        tags: ["#방송클립", "#랜선여행", "#고화질", "#명소탐방"],
        best_moment: {
          time: "12:15",
          desc: "수만 마리 해파리 사이를 유영하는 환상적인 장면"
        }
      }
    }
  ],
  
  104: [{ id: "IjW7ouLw0Ts", title: "Turtle Beach", type: "main" }],
  105: [{ id: "kxQYZyjkFCU", title: "White Beach Party", type: "main" }],
  106: [
  {
    id: "jJp-0cAvk6w",
    title: "대만족 가성비 몰디브 여행 브이로그 | 6m 수중 레스토랑 & 워터빌라 올인클루시브",
    type: "main",
    ai_context: {
      summary: "몰디브의 비싼 물가 걱정을 덜어주는 가성비 리조트 정보와 수중 레스토랑에서의 환상적인 식사 경험을 담은 현실적인 여행기입니다.",
      tags: ["#몰디브가성비", "#수중레스토랑", "#올인클루시브"],
      best_moment: {
        time: "08:45",
        desc: "바다 밑 6m 아래 수중 레스토랑에서 물고기들을 바라보며 코스 요리를 즐기는 장면"
      }
    }
  },
  {
    id: "J6Tq93FMSTs",
    title: "프리다이버의 몰디브 신혼여행 액티비티 | 두짓타니 리조트 100% 즐기기",
    type: "youtube",
    ai_context: {
      summary: "단순한 휴양을 넘어 프리다이빙과 다양한 해양 액티비티를 통해 몰디브의 푸른 바닷속을 가장 역동적으로 담아낸 영상입니다.",
      tags: ["#프리다이빙", "#신혼여행", "#두짓타니몰디브"],
      best_moment: {
        time: "12:10",
        desc: "오션 빌라 바로 앞에서 뛰어들어 만나는 몰디브의 거북이와 형형색색의 산호초 군락"
      }
    }
  },
  {
    id: "XhmXpLRg2q8",
    title: "쌍둥이 가족의 시끌벅적 몰디브 가족여행 | 하드락 호텔 리조트 이동기",
    type: "youtube",
    ai_context: {
      summary: "유명 키즈 크리에이터 뚜아뚜지 가족이 하드락 몰디브에서 보내는 활기찬 일상과 아이 동반 여행의 팁을 보여줍니다.",
      tags: ["#가족여행", "#하드락몰디브", "#아이와함께"],
      best_moment: {
        time: "05:30",
        desc: "새로운 리조트로 이동하기 위해 보트를 타고 이동하며 신나하는 아이들의 순수한 반응"
      }
    }
  },
  {
    id: "iym6yHvx3mU",
    title: "시차 적응 실패해도 행복한 몰디브 사이라군 | 가족 여행 브이로그",
    type: "youtube",
    ai_context: {
      summary: "사이라군 몰디브 리조트의 평화로운 분위기 속에서 가족들과 함께 여유로운 시간을 보내는 힐링 브이로그입니다.",
      tags: ["#사이라군", "#힐링여행", "#리조트조식"],
      best_moment: {
        time: "03:15",
        desc: "새벽 시차 때문에 일찍 일어난 가족들이 조용한 몰디브의 일출을 감상하는 평화로운 순간"
      }
    }
  },
  {
    id: "f1Ax4B4rjjI",
    title: "2024년 몰디브 신혼여행 리조트 베스트 5 상세 리뷰 & 브이로그",
    type: "youtube",
    ai_context: {
      summary: "실제 신혼부부의 시선에서 리조트 5곳의 장단점을 꼼꼼히 비교하며 현장의 시네마틱한 풍경을 함께 담았습니다.",
      tags: ["#리조트비교", "#시네마틱", "#몰디브꿀팁"],
      best_moment: {
        time: "09:20",
        desc: "워터빌라에서 바로 바다로 연결되는 개인 풀장에서 바라보는 환상적인 노을 풍경"
      }
    }
  }
],
  107: [{ id: "scVZ8PWespo", title: "Guam Trip", type: "main" }],
  108: [{ id: "SxLA7ABzPi0", title: "Caribbean Sea", type: "main" }],
  
  201: [
    { id: "5Xfuxiq0OpE", title: "Aurora & Glacier", type: "main" },
    { id: "qt2IBGm6EjU", title: "Aurora & Glacier", type: "main" }
  ],
  202: [{ id: "T-I6LVcbR3Q", title: "Aurora Village", type: "main" }],
  203:[
  {
    "id": "kyub-B4uhM4",
    "title": "에콰도르 가족과 함께한 갈라파고스 여행 (제이치핏)",
    "type": "Vlog",
    "ai_context": {
      "summary": "100달러 입도비부터 숙소, 40달러 랍스터 식사까지 현실적인 물가 정보와 현지 가족에게 초대받아 저녁을 함께하는 따뜻한 에피소드가 담겨 있습니다.",
      "tags": ["#갈라파고스물가", "#토르투가베이", "#현지인초대"],
      "best_moment": {
        "time": "10:29",
        "desc": "선인장 숲을 지나 마주하는 토르투가 베이의 눈부신 에메랄드빛 바다 풍경."
      },
      "timeline": [
        { "time": "01:05", "title": "갈라파고스 입도", "desc": "공항 도착 후 TCT 카드 발급 및 짐 검사 과정" },
        { "time": "06:17", "title": "푸에르토 아요라", "desc": "동물원처럼 길거리에 널린 이구아나와 펠리컨 구경" },
        { "time": "08:08", "title": "랍스터 거리", "desc": "저녁 식사로 즐기는 갈라파고스 랍스터 먹방" },
        { "time": "10:29", "title": "토르투가 베이", "desc": "거대한 선인장 숲길과 아름다운 해변 산책" },
        { "time": "16:35", "title": "현지인과의 만남", "desc": "우연히 만난 에콰도르 가족 집에서의 저녁 식사" }
      ]
    }
  },
  {
    "id": "AX2Y45dlfG4",
    "title": "비싸서 못가는 갈라파고스? 산크리스토발 여행 (세나)",
    "type": "Vlog",
    "ai_context": {
      "summary": "산크리스토발 섬을 중심으로 마을 벤치를 점령한 바다사자와의 수영, 티헤레타스 스노클링 등 액티비티 위주의 생생한 여행기입니다.",
      "tags": ["#산크리스토발", "#바다사자", "#스노클링"],
      "best_moment": {
        "time": "06:00",
        "desc": "마을 벤치, 길거리 어디든 사람처럼 누워 자고 있는 귀여운 바다사자들의 모습."
      },
      "timeline": [
        { "time": "01:43", "title": "입도 및 이동", "desc": "복잡한 입도 절차와 숙소 체크인" },
        { "time": "05:49", "title": "바다사자 마을", "desc": "마을 곳곳을 점령한 바다사자들과의 첫 만남" },
        { "time": "11:53", "title": "티헤레타스", "desc": "무료로 즐기는 스노클링 포인트 탐방" },
        { "time": "13:39", "title": "바다 수영", "desc": "바다거북, 물개와 함께하는 수중 촬영" },
        { "time": "16:01", "title": "플라야 만", "desc": "해변 앞 식당에서의 식사와 여유로운 풍경" }
      ]
    }
  },
  {
    "id": "aGb8EQoWQjk",
    "title": "물개, 거북이, 상어랑 수영하기 (차혜린)",
    "type": "Vlog",
    "ai_context": {
      "summary": "갈라파고스의 수중 환경을 제대로 보여주는 영상으로, 상어와 거북이, 물개와 함께하는 스노클링 장면이 압권인 영상입니다.",
      "tags": ["#수중촬영", "#상어스노클링", "#자이언트거북"],
      "best_moment": {
        "time": "12:06",
        "desc": "바닷속에서 마주한 바다거북과 수많은 물고기 떼가 어우러진 환상적인 순간."
      },
      "timeline": [
        { "time": "02:09", "title": "수산시장", "desc": "생선을 기다리는 펠리컨과 바다사자 구경" },
        { "time": "09:00", "title": "엘 차토 보호구역", "desc": "야생 자이언트 거북이 서식지 탐방" },
        { "time": "11:29", "title": "스노클링 투어", "desc": "보트를 타고 나가는 본격적인 바다 스노클링" },
        { "time": "13:08", "title": "수중 탐험", "desc": "상어와 가오리를 눈앞에서 보는 다이빙/스노클링" },
        { "time": "18:19", "title": "기념품 쇼핑", "desc": "귀여운 발파랑부비새 인형 등 기념품 구경" }
      ]
    }
  },
  {
    "id": "or7mlnEXgCE",
    "title": "하루만에 80만원 쓴 미친 물가 (레리꼬)",
    "type": "Vlog",
    "ai_context": {
      "summary": "배낭여행자 입장에서 느끼는 갈라파고스의 살인적인 물가와 입도 비용, 그리고 찰스 다윈 연구소의 자이언트 거북이를 찾아가는 여정입니다.",
      "tags": ["#살인물가", "#찰스다윈연구소", "#배낭여행"],
      "best_moment": {
        "time": "08:25",
        "desc": "찰스 다윈 연구소에서 실제로 마주한 집채만한 자이언트 거북이의 압도적 크기."
      },
      "timeline": [
        { "time": "00:00", "title": "입도 비용", "desc": "항공권 제외하고도 120달러가 드는 입도 비용 설명" },
        { "time": "03:56", "title": "찰스 다윈 센터", "desc": "진화론의 산실, 찰스 다윈 연구소 방문" },
        { "time": "05:39", "title": "길거리 동물", "desc": "사람을 피하지 않는 바다사자와 이구아나" },
        { "time": "08:25", "title": "자이언트 거북", "desc": "연구소 내 보호받고 있는 거대 거북이 관찰" },
        { "time": "10:17", "title": "박물관 관람", "desc": "갈라파고스 생태계에 대한 전시 관람" }
      ]
    }
  },
  {
    "id": "PpmN5QKjbmw",
    "title": "야생동물의 낙원, 플로레아나 섬 투어 (트래블오리)",
    "type": "Vlog",
    "ai_context": {
      "summary": "부부 여행 유튜버가 보여주는 플로레아나 섬 투어 영상으로, 검은 모래 해변의 독특한 풍경과 직접 시장에서 산 참치로 회를 떠먹는 모습이 인상적입니다.",
      "tags": ["#부부여행", "#플로레아나섬", "#참치회먹방"],
      "best_moment": {
        "time": "11:20",
        "desc": "검은 모래 해변(Black Sand Beach)과 푸른 바다가 대비되는 이색적인 풍경."
      },
      "timeline": [
        { "time": "00:00", "title": "이동 과정", "desc": "비행기, 버스, 배를 갈아타는 험난한 이동" },
        { "time": "04:24", "title": "아침 수산시장", "desc": "생선 손질하는 상인 옆에 대기 중인 펠리컨들" },
        { "time": "08:08", "title": "플로레아나 섬", "desc": "작은 배를 타고 도착한 한적한 섬 투어" },
        { "time": "12:34", "title": "네그로 비치", "desc": "검은 모래 사장에서 즐기는 해수욕" },
        { "time": "20:15", "title": "참치회 먹방", "desc": "수산시장에서 7천원에 산 참치로 즐기는 만찬" }
      ]
    }
  }
],

  205: [{ id: "H_Fw__qsNC0", title: "Alps Train", type: "main" }],
  
  301: [
    { id: "jUHkARX-FgU", title: "Paris Walking Tour", type: "main" },
    { id: "NeTF-iw5BYU", title: "Midnight in Paris", type: "sub" }
  ],
  303: [{ id: "8B6FSEGY6Ko", title: "NYC Times Square", type: "main" }],
  304: [{ id: "x5-A9yyjVE4", title: "Tokyo Night", type: "main" }],
  305: [{ id: "EjZ5vUg1GtM", title: "London City", type: "main" }],
  306: [{ id: "HHl2Sd4s8Tk", title: "Bangkok Street", type: "main" }],
  307: [{ id: "lb58jbNw5mc", title: "Marina Bay", type: "main" }],
  308: [{ id: "l0kljb04HL4", title: "Roman Holiday", type: "main" }],
  
  401: [{ id: "g3xnCQmMdBc", title: "Danang Beach", type: "main" }],
  403: [{ id: "OB1xShQERJ8", title: "Osaka Food", type: "main" }],
  405: [
  {
    id: "K5TJ9QW0S4I",
    title: "[먹방 브이로그] 후쿠오카 먹고 또 먹는 찐커플 여행기",
    type: "main",
    ai_context: {
      summary: "활기찬 커플이 후쿠오카의 유명 맛집과 카페를 섭렵하며 즐거운 에너지를 전하는 먹방 중심의 브이로그입니다.",
      tags: ["#커플여행", "#후쿠오카맛집", "#먹방브이로그"],
      best_moment: {
        time: "03:15",
        desc: "캐널시티의 화려한 분수쇼와 함께하는 쇼핑몰 투어 장면"
      }
    }
  },
  {
    id: "is_TwCNhkWs",
    title: "[가족 브이로그] 연말 크리스마스 분위기 가득한 후쿠오카 가족 여행",
    type: "youtube",
    ai_context: {
      summary: "어린 아이와 함께 연말의 따뜻한 감성을 즐기는 가족 여행기로, 하카타 역의 일루미네이션이 돋보입니다.",
      tags: ["#가족여행", "#아이와함께", "#크리스마스마켓"],
      best_moment: {
        time: "03:08",
        desc: "하카타 역 앞 광장에서 펼쳐지는 환상적인 크리스마스 일루미네이션 점등 장면"
      }
    }
  },
  {
    id: "_D6yEGtRl4E",
    title: "[액티비티] 아이들과 함께 즐기는 후쿠오카 VR & 팀랩 체험기",
    type: "youtube",
    ai_context: {
      summary: "보스 이조 후쿠오카에서 팀랩 포레스트와 VR 게임 등 다양한 실내 액티비티를 즐기는 역동적인 영상입니다.",
      tags: ["#액티비티", "#팀랩포레스트", "#보스이조"],
      best_moment: {
        time: "08:32",
        desc: "팀랩 포레스트에서 스마트폰으로 환상적인 가상 동물을 잡는 미디어 아트 체험 장면"
      }
    }
  },
  {
    id: "mc9DUar_Z8M",
    title: "[시네마틱/여름] 여름날의 청량함을 담은 후쿠오카 여행 비디오",
    type: "youtube",
    ai_context: {
      summary: "후쿠오카의 여름 풍경을 감각적인 편집과 고화질 영상미로 담아내어 한 편의 영화 같은 느낌을 줍니다.",
      tags: ["#시네마틱", "#여름후쿠오카", "#영상미"],
      best_moment: {
        time: "05:40",
        desc: "노을 지는 모모치 해변의 평화롭고 아름다운 풍경을 담은 시네마틱 컷"
      }
    }
  },
  {
    id: "K5TJ9QW0S4I", // 동일 채널의 다른 에피소드 혹은 유사 컨셉 활용
    title: "[혼자/쇼핑] 후쿠오카 텐진 구석구석 빈티지 샵 & 쇼핑 투어",
    type: "youtube",
    ai_context: {
      summary: "텐진의 세컨드 핸드 숍과 빅카메라 등 쇼핑 명소를 누비며 득템 아이템을 소개하는 실용적인 영상입니다.",
      tags: ["#텐진쇼핑", "#빈티지샵", "#일본쇼핑리스트"],
      best_moment: {
        time: "08:54",
        desc: "다이묘 거리의 세컨드 핸드 숍에서 저렴하게 브랜드 의류를 발굴하는 장면"
      }
    }
  }
],
  406: [{ id: "WZp6d5BjfM4", title: "Taipei 101", type: "main" }],
  407: [{ id: "H9mwbhJBUaw", title: "Hong Kong Night", type: "main" }],
  
  501: [{ id: "yy6cLDf-rd8", title: "Safari Tour", type: "main" }],
  502: [{ id: "mysTzRk7uqo", title: "Pyramids", type: "main" }]
};