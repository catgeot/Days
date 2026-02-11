import os
from dotenv import load_dotenv # 🚨 [New] 환경변수 로드 라이브러리
from google import genai
from google.genai import types
import yt_dlp  # 🚨 [Fix/New] 더 강력하고 안정적인 유튜브 데이터 수집 라이브러리
import json
import time
import re

# ==========================================
# 1. 설정
# ==========================================
# 🚨 [중요] API 키를 입력하세요.
# 🚨 [Fix] .env.local 파일에서 API 키 로드
load_dotenv('.env.local') # .env가 아니라 .env.local을 명시적으로 지정
API_KEY = os.getenv("VITE_GEMINI_API_KEY")

# API 키가 제대로 안 불러와졌을 경우를 대비한 안전장치
if not API_KEY:
    raise ValueError("❌ API 키가 없습니다. .env.local 파일에 'VITE_GEMINI_API_KEY'가 있는지 확인해주세요.")
LOCATIONS = ["케이프타운"]
OUTPUT_FILE = "travel_video_data.json"
MAX_RESULTS_PER_KEYWORD = 5  # 키워드 당 수집할 영상 개수

# ==========================================
# 2. 클라이언트 초기화
# ==========================================
client = genai.Client(api_key=API_KEY)

# ==========================================
# 3. [Step 1] yt-dlp를 이용한 실제 유튜브 데이터 수집 함수
# ==========================================
def get_real_youtube_data(keyword, limit=5):
    """
    yt-dlp를 사용하여 실제 존재하는 영상 메타데이터만 빠르게 가져옵니다.
    영상을 다운로드하지 않고 정보만 추출하므로 속도가 빠릅니다.
    """
    print(f"🔍 [yt-dlp] '{keyword}' 검색 및 데이터 수집 중...")

    # yt-dlp 옵션 설정
    ydl_opts = {
        'quiet': True,              # 불필요한 로그 출력 끄기
        'extract_flat': True,       # 🚨 중요: 영상 다운로드 안 함 (메타데이터만 추출)
        'force_generic_extractor': False,
        'noplaylist': True,         # 플레이어 리스트 제외
    }

    real_data_list = []
    
    # 검색어 구성: "ytsearch5:검색어" -> 검색어당 5개만 가져오라는 명령어
    search_query = f"ytsearch{limit}:{keyword} 브이로그"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(search_query, download=False)
            
            if 'entries' in result:
                for video in result['entries']:
                    # yt-dlp가 주는 데이터에서 필요한 것만 뽑기
                    video_info = {
                        "id": video.get('id'),
                        "title": video.get('title'),
                        "url": video.get('url') or f"https://www.youtube.com/watch?v={video.get('id')}",
                        "duration": video.get('duration'), # 초 단위 (예: 600)
                        # extract_flat 모드에서는 썸네일이 없을 수 있어 기본 처리
                        "thumbnail": video.get('thumbnails')[0]['url'] if video.get('thumbnails') else f"https://i.ytimg.com/vi/{video.get('id')}/hqdefault.jpg"
                    }
                    real_data_list.append(video_info)
        
        print(f"✅ [yt-dlp] 실존하는 영상 {len(real_data_list)}개 확보 완료.")
        return real_data_list

    except Exception as e:
        print(f"❌ [yt-dlp] 검색 중 오류 발생: {e}")
        return []

# ==========================================
# 4. [Step 2] Gemini 프롬프트 생성 (데이터 주입)
# ==========================================
def create_analysis_prompt(location_name, real_video_list):
    # Python 객체를 JSON 문자열로 변환하여 프롬프트에 삽입
    video_json_str = json.dumps(real_video_list, ensure_ascii=False, indent=2)

    return f"""
    너는 여행 콘텐츠 전문 에디터야.
    아래 제공된 `source_videos` JSON 데이터는 내가 이미 검증한 **실제 유튜브 영상 목록**이야.
    
    [작업 목표]
    제공된 영상들의 `id`, `title`, `url`은 **절대 수정하지 말고 그대로 유지**해.
    각 영상의 제목과 문맥(여행지: {location_name})을 분석하여 `ai_context` 필드를 완성해줘.

    [소스 데이터 (절대 위조 금지)]
    {video_json_str}

    [작성 규칙]
    1. `summary`: 영상의 제목과 길이를 보고 어떤 여행 정보가 있을지 3줄 내외로 매력적으로 요약.
    2. `tags`: 관련 해시태그 3~5개.
    3. `timeline`: 영상의 길이(`duration`초)를 고려하여 예상되는 타임라인 3~5개를 작성해줘.
    4. 5분 미만의 너무 짧은 영상이 있다면 리스트에서 제외해도 좋아.

    [출력 포맷 - JSON Array]
    응답은 오직 아래 JSON 포맷을 따르는 코드 블록(```json ... ```)으로만 출력해.
    
    [
      {{
        "id": "소스데이터의_id_그대로_사용",
        "title": "소스데이터의_title_그대로_사용",
        "type": "video",
        "url": "소스데이터의_url_그대로_사용",
        "duration": "소스데이터의_duration",
        "location_keyword": "{location_name}",
        "ai_context": {{
          "summary": "작성된 요약...",
          "tags": ["#태그1", "#태그2"],
          "best_moment": {{ "time": "00:00", "desc": "하이라이트 설명" }},
          "timeline": [
            {{ "time": "MM:SS", "title": "구간제목", "desc": "내용" }}
          ]
        }}
      }}
    ]
    """

# ==========================================
# 5. 유틸리티: JSON 추출
# ==========================================
def extract_json(text):
    try:
        match = re.search(r"```json\s*(.*?)```", text, re.DOTALL)
        if match: return json.loads(match.group(1))
        match = re.search(r"```\s*(.*?)```", text, re.DOTALL)
        if match: return json.loads(match.group(1))
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ JSON 파싱 경고: {e}")
        return []

# ==========================================
# 6. 메인 실행 로직
# ==========================================
def main():
    final_dataset = []
    print(f"🚀 총 {len(LOCATIONS)}개의 여행지 분석을 시작합니다 (Strategy A: yt-dlp -> AI)...")

    for location in LOCATIONS:
        print(f"\n📍 Processing: {location}...")
        
        # 1. [Python] 실제 데이터 먼저 확보
        real_videos = get_real_youtube_data(location, limit=MAX_RESULTS_PER_KEYWORD)
        
        if not real_videos:
            print(f"⚠️ {location}: 검색 결과가 없어 건너뜁니다.")
            continue

        # 2. [Gemini] 데이터 주입 및 분석 요청
        try:
            print("🤖 [AI] 데이터 분석 및 요약 생성 중...")
            prompt = create_analysis_prompt(location, real_videos)
            
            response = client.models.generate_content(
                model='gemini-2.0-flash', # 혹은 gemini-2.5-flash
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2
                )
            )

            if response.text:
                analyzed_data = extract_json(response.text)
                
                if analyzed_data:
                    final_dataset.extend(analyzed_data)
                    print(f"✅ {location}: {len(analyzed_data)}개 데이터 분석 완료.")
                else:
                    print(f"⚠️ {location}: AI 응답에서 JSON 추출 실패.")
                    print(f"DEBUG: {response.text[:200]}...") # 디버깅용
            else:
                print(f"⚠️ {location}: AI 응답이 비어있습니다.")

        except Exception as e:
            print(f"❌ {location} AI 처리 중 오류 발생: {e}")
        
        time.sleep(2)

    # 3. 결과 저장
    if final_dataset:
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(final_dataset, f, ensure_ascii=False, indent=2)
            print(f"\n🎉 모든 작업 완료! 총 {len(final_dataset)}개 영상 저장됨.")
            print(f"📂 파일 경로: {OUTPUT_FILE}")
            
            # 검증용 출력
            if len(final_dataset) > 0:
                print("\n[데이터 샘플 확인]")
                print(f"ID: {final_dataset[0].get('id')} (실제 ID 확인)")
                print(f"제목: {final_dataset[0].get('title')}")

        except Exception as e:
            print(f"❌ 파일 저장 중 오류 발생: {e}")
    else:
        print("\n⚠️ 저장할 데이터가 없습니다.")

if __name__ == "__main__":
    main()