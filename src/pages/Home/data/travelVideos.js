// src/pages/Home/data/travelVideos.js

export const TRAVEL_VIDEOS = {
  // 101: 괌/사이판 권역
  101: [
    { id: "yHn4gzVCOyg", title: "Main Cinematic", type: "main" }
  ],
  102: [{ id: "KQwL4YigOD8", title: "Santorini View", type: "main" }],
  
  // 🚨 [Fix/New] 103: 팔라우 - 썸네일 URL 제거, 순수 ID 및 AI 데이터만 유지
  103: [
		{
      id: "K20mdymKhuQ",
      title: "[해외다이빙] 2025년 8월 팔라우 다이빙투어 (Blue Hole & Corner)",
      type: "main",
      ai_context: {
        summary: "2025년 8월, 팔라우의 가장 뜨거운 수중 풍경을 담은 고화질 브이로그입니다. 블루홀의 신비로운 지형과 블루코너의 역동적인 생태계를 생생하게 감상할 수 있습니다. (13분)",
        tags: ["#팔라우다이빙", "#2025여행", "#블루코너", "#수중영상"],
        best_moment: {
          time: "02:15",
          desc: "💡 블루홀 거대 동굴 사이로 쏟아지는 환상적인 빛의 기둥"
        }
      }
    },
    {
      id: "EkMJN-0AYro",
      title: "페렐리우에서 살아남기! 팔라우 조류 다이빙과 섬 탐방",
      type: "youtube",
      ai_context: {
        summary: "팔라우의 거친 매력을 느낄 수 있는 페렐리우 지역 투어 영상입니다. 강력한 조류 속에서 펼쳐지는 스릴 넘치는 다이빙과 섬 내부의 역사적 현장을 직접 누비는 리얼 브이로그예요.",
        tags: ["#페렐리우", "#조류다이빙", "#익스트림", "#팔라우Vlog"],
        best_moment: {
          time: "03:10",
          desc: "💡 엄청난 조류를 타고 날아가듯 이동하는 '익스프레스' 다이빙의 짜릿함"
        }
      }
    },
    {
      id: "8dPE59G11do",
      title: "신비로운 젤리피쉬 레이크와 밀키웨이 투어",
      type: "main",
      // thumbnail: URL 삭제됨 (View에서 ID로 자동 처리)
      ai_context: {
        summary: "독이 없는 수백만 마리의 해파리와 함께 유영하는 몽환적인 영상이에요. 산호 가루가 깔린 밀키웨이 바다 입수는 그야말로 비현실적이죠. (3분)",
        tags: ["#젤리피쉬", "#밀키웨이", "#인생샷", "#신비로움"],
        best_moment: {
          time: "00:45",
          desc: "💡 황금빛 해파리 군무가 시작되는 순간"
        }
      }
    },
    {
      id: "Drw1WJjEfqU",
      title: "백만 마리 해파리와의 유영 (EBS)",
      type: "youtube",
      ai_context: {
        summary: "팔라우가 왜 '신들의 정원'인지 증명하는 고퀄리티 영상입니다. 고요한 호수 속에서 자연과 하나가 되는 평화로움을 느껴보세요.",
        tags: ["#힐링", "#ASMR", "#수중촬영"],
        best_moment: {
          time: "01:20",
          desc: "💡 화면 가득 해파리가 차오르는 절정의 순간"
        }
      }
    }
  ],
  
  // 기타 여행지
  104: [{ id: "IjW7ouLw0Ts", title: "Turtle Beach", type: "main" }],
  105: [{ id: "kxQYZyjkFCU", title: "White Beach Party", type: "main" }],
  106: [{ id: "t-hfCwbVnrM", title: "Luxury Resort", type: "main" }],
  107: [{ id: "scVZ8PWespo", title: "Guam Trip", type: "main" }],
  108: [{ id: "SxLA7ABzPi0", title: "Caribbean Sea", type: "main" }],
  
  // 200번대: 유럽/오로라
  201: [
    { id: "5Xfuxiq0OpE", title: "Aurora & Glacier", type: "main" },
    { id: "qt2IBGm6EjU", title: "Aurora & Glacier", type: "main" }
  ],
  202: [{ id: "T-I6LVcbR3Q", title: "Aurora Village", type: "main" }],
  205: [{ id: "H_Fw__qsNC0", title: "Alps Train", type: "main" }],
  
  // 300번대: 도시 투어
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
  
  // 400번대: 아시아
  401: [{ id: "g3xnCQmMdBc", title: "Danang Beach", type: "main" }],
  403: [{ id: "OB1xShQERJ8", title: "Osaka Food", type: "main" }],
  405: [{ id: "MNHYBTnUeJI", title: "Fukuoka City", type: "main" }],
  406: [{ id: "WZp6d5BjfM4", title: "Taipei 101", type: "main" }],
  407: [{ id: "H9mwbhJBUaw", title: "Hong Kong Night", type: "main" }],
  
  // 500번대: 특수 지역
  501: [{ id: "yy6cLDf-rd8", title: "Safari Tour", type: "main" }],
  502: [{ id: "mysTzRk7uqo", title: "Pyramids", type: "main" }]
};