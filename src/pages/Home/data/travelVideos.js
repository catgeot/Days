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
      id: "8dPE59G11do",
      title: "신비로운 젤리피쉬 레이크와 밀키웨이 투어",
      type: "main",
      thumbnail: "https://img.youtube.com/vi/8dPE59G11do/hqdefault.jpg",
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
      thumbnail: "https://img.youtube.com/vi/Drw1WJjEfqU/maxresdefault.jpg",
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
  
  104: [{ id: "IjW7ouLw0Ts", title: "Turtle Beach", type: "main" }],
  105: [{ id: "kxQYZyjkFCU", title: "White Beach Party", type: "main" }],
  106: [{ id: "t-hfCwbVnrM", title: "Luxury Resort", type: "main" }],
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
  405: [{ id: "MNHYBTnUeJI", title: "Fukuoka City", type: "main" }],
  406: [{ id: "WZp6d5BjfM4", title: "Taipei 101", type: "main" }],
  407: [{ id: "H9mwbhJBUaw", title: "Hong Kong Night", type: "main" }],
  
  501: [{ id: "yy6cLDf-rd8", title: "Safari Tour", type: "main" }],
  502: [{ id: "mysTzRk7uqo", title: "Pyramids", type: "main" }]
};