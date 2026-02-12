import os
import time
import json
import re
import requests
import yt_dlp
from dotenv import load_dotenv
from google import genai
from google.genai import types

# ==========================================
# 1. 설정
# ==========================================
load_dotenv('.env.local')
API_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("❌ API 키가 없습니다. .env.local 파일을 확인해주세요.")

LOCATIONS = ["라로통가"] 
OUTPUT_FILE = "real_timeline_data.json"
TARGET_SUCCESS_COUNT = 5  # 🚨 목표: 성공한 데이터 5개를 만들 때까지 멈추지 않음
SEARCH_CANDIDATES = 30    # 🚨 후보군: 5개를 건지기 위해 넉넉하게 30개를 먼저 검색

client = genai.Client(api_key=API_KEY)

# ==========================================
# 2. [Step 1] 영상 후보군 검색 (최신순 정렬)
# ==========================================
def get_video_candidates(keyword, limit=30):
    print(f"🔍 '{keyword}' 관련 최신 영상 {limit}개를 검색합니다...")
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': False, # 자막 유무 확인을 위해 상세 정보 필요
        'noplaylist': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'skip_download': True,
    }
    
    # 쿼리: 검색어 + 여행 브이로그 + 숏츠 제외
    query = f"ytsearch{limit}:{keyword} 여행 브이로그 -shorts"
    candidates = []

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 1. 빠르게 목록만 먼저 확보 (extract_flat=True)
            flat_opts = {**ydl_opts, 'extract_flat': True}
            with yt_dlp.YoutubeDL(flat_opts) as search_ydl:
                search_result = search_ydl.extract_info(query, download=False)

            if 'entries' in search_result:
                # 2. Python 내부에서 '최신순(날짜)'으로 정렬
                # (yt-dlp 검색 결과는 관련도 순이므로, 여기서 강제로 날짜 정렬)
                entries = sorted(
                    search_result['entries'], 
                    key=lambda x: x.get('upload_date', '00000000'), 
                    reverse=True # 내림차순 (최신 날짜가 위로)
                )

                print(f"📋 검색된 {len(entries)}개의 후보를 최신순으로 정렬했습니다.")

                for entry in entries:
                    duration = entry.get('duration', 0)
                    title = entry.get('title', '')
                    
                    # 3. 기본 필터링 (5분 미만, 숏츠 제외)
                    if duration < 300: continue
                    if 'shorts' in title.lower(): continue

                    # 후보 리스트에 추가
                    candidates.append({
                        "id": entry['id'],
                        "title": title,
                        "url": entry.get('url'),
                        "duration": duration,
                        "upload_date": entry.get('upload_date'), # 날짜 정보
                        "thumbnail": entry.get('thumbnails', [{}])[0].get('url', '')
                    })
                    
        return candidates

    except Exception as e:
        print(f"❌ 검색 중 오류 발생: {e}")
        return []

# ==========================================
# 3. [Step 2] 자막 추출 (이전과 동일한 강력한 로직)
# ==========================================
def get_transcript_text(video_url):
    """
    영상 URL을 받아 자막 텍스트를 추출합니다.
    """
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            subs = info.get('subtitles') or {}
            auto_subs = info.get('automatic_captions') or {}
            
            # 한국어 > 영어 순서로 자막 찾기
            target_langs = ['ko', 'en']
            selected_sub = None
            
            for lang in target_langs:
                if lang in subs:
                    selected_sub = subs[lang]
                    break
                if lang in auto_subs:
                    selected_sub = auto_subs[lang]
                    break
            
            if not selected_sub: return None

            # JSON3 포맷 URL 찾기
            json_url = next((fmt['url'] for fmt in selected_sub if fmt.get('ext') == 'json3'), None)
            if not json_url: return None

            # 다운로드 및 파싱
            response = requests.get(json_url)
            response.raise_for_status()
            json_data = response.json()
            
            full_text = ""
            if 'events' in json_data:
                for event in json_data['events']:
                    if 'segs' in event:
                        start_ms = event.get('tStartMs', 0)
                        start_sec = start_ms // 1000
                        time_str = f"[{start_sec//60:02d}:{start_sec%60:02d}]"
                        
                        seg_text = "".join([seg.get('utf8', '') for seg in event['segs']])
                        seg_text = seg_text.replace('\n', ' ').strip()
                        if seg_text:
                            full_text += f"{time_str} {seg_text}\n"
                            
            return full_text[:25000]

    except Exception:
        return None

# ==========================================
# 4. [Step 3] Gemini 분석
# ==========================================
def analyze_with_gemini(location, video_info, transcript):
    prompt = f"""
    너는 여행 콘텐츠 에디터야. 아래는 유튜브 영상의 **실제 자막**이야.
    이 자막을 읽고, 시청자가 영상을 안 봐도 여행 코스를 알 수 있게 **타임라인**을 정리해줘.

    [영상 정보]
    - 제목: {video_info['title']}
    - 자막 내용:
    {transcript}

    [논리적 정합성 규칙 - 매우 중요]
    1. **타임라인 우선 작성:** 전체 여정을 10개의 핵심 타임라인으로 먼저 구성해.(시간순 선택이 아니라 전체 자막에서 흥미로운 장소/행동을 뽑아)
    2. **베스트 모멘트 선정:** 작성된 **타임라인 항목 중에서** 가장 매력적인 하나를 골라 'best_moment'로 지정해.
    3. **데이터 일치:** 따라서 'best_moment'의 시간(time)과 장소(place)는 반드시 'timeline'에 있는 항목 중 하나와 **정확히 일치**해야 해.

    [필수 제약 사항]
    - **타임라인 개수: ** 5개 이상, 10개 이하.
    - **거짓말 금지:** 자막에 없는 장소나 행동은 절대 적지 마.
    - **설명 길이: **15자 이내로 간결하게.
    -	**포맷:** 반드시 아래 JSON 형식으로만 출력해.        
    
		[JSON 포맷]
    {{
        "id": "{video_info['id']}",
        "title": "{video_info['title']}",
        "duration": {video_info['duration']},
        "date": "{video_info.get('upload_date')}",
        "location_keyword": "{location}",
        "ai_context": {{
            "summary": "자막 기반 3줄 요약",
            "tags": ["#태그1", "#태그2"],
            "best_moment": {{ "time": "MM:SS", "desc": "가장 인상 깊은 순간" }},
            "timeline": [
                {{ "time": "MM:SS", "title": "장소/행동", "desc": "자막 내용 요약" }}
            ]
        }}
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1)
        )
        return response.text
    except Exception as e:
        print(f"❌ Gemini 호출 실패: {e}")
        return None

def parse_json(text):
    if not text: return None
    try:
        clean_text = re.sub(r"```json|```", "", text).strip()
        return json.loads(clean_text)
    except:
        return None

# ==========================================
# 5. 메인 실행 (목표 달성 로직 적용)
# ==========================================
def main():
    print(f"🚀 '{LOCATIONS[0]}' 타임라인 데이터 확보 시작")
    print(f"🎯 목표: 유효한 데이터 {TARGET_SUCCESS_COUNT}개 수집")
    
    # 1. 후보군 확보
    candidates = get_video_candidates(LOCATIONS[0], limit=SEARCH_CANDIDATES)
    final_data = []

    print(f"\n🏃 검증 및 분석 시작 (총 {len(candidates)}개 후보)...")
    
    # 2. 목표 개수를 채울 때까지 반복
    for i, video in enumerate(candidates):
        # 목표 달성 시 즉시 종료
        if len(final_data) >= TARGET_SUCCESS_COUNT:
            print(f"\n✨ 목표 달성! ({len(final_data)}/{TARGET_SUCCESS_COUNT})")
            break

        print(f"\n[{i+1}/{len(candidates)}] 분석 중: {video['title']} ({video.get('upload_date', '날짜모름')})")
        
        # 자막 추출
        transcript = get_transcript_text(video['url'])
        if not transcript:
            print("   Pass: 자막 없음 ❌")
            continue
        
        # AI 분석
        result_text = analyze_with_gemini(LOCATIONS[0], video, transcript)
        result_json = parse_json(result_text)

        # 결과 검증
        if result_json and result_json.get('ai_context', {}).get('timeline'):
            final_data.append(result_json)
            print(f"   ✅ 타임라인 확보 성공! (현재 {len(final_data)}/{TARGET_SUCCESS_COUNT})")
        else:
            print("   Pass: 여행 정보 부족 또는 분석 실패 ⚠️")
        
        time.sleep(1) # API 부하 조절

    # 3. 결과 저장
    if final_data:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write("[\n") # 배열 시작
            
            for i, item in enumerate(final_data):
                # 1. 객체 하나를 문자열로 변환 (indent 없음 -> 한 줄로 압축됨)
                line = json.dumps(item, ensure_ascii=False)
                
                # 2. 마지막 항목이 아니면 쉼표(,) 추가
                if i < len(final_data) - 1:
                    f.write("  " + line + ",\n")
                else:
                    f.write("  " + line + "\n") # 마지막 항목은 쉼표 없음
            
            f.write("]") # 배열 종료
        print(f"\n🎉 최종 결과: 총 {len(final_data)}개의 데이터가 저장되었습니다.")
        print(f"📂 파일 경로: {OUTPUT_FILE}")
        
        # 부족할 경우 경고
        if len(final_data) < TARGET_SUCCESS_COUNT:
            print(f"⚠️ 경고: 후보군({SEARCH_CANDIDATES}개)을 모두 검색했으나 목표({TARGET_SUCCESS_COUNT}개)를 채우지 못했습니다.")
    else:
        print("\n😭 저장된 데이터가 없습니다.")

if __name__ == "__main__":
    main()