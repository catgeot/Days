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