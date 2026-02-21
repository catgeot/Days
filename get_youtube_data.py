import os
import time
import json
import re
import requests
import random 
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

# 🚨 [Fix/New] 타겟 지역 변경 (후쿠오카)
LOCATIONS = ["페트라"] 
OUTPUT_FILE = "real_timeline_data.json"
TARGET_SUCCESS_COUNT = 5
SEARCH_CANDIDATES = 30

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

EXCLUDE_VIDEO_IDS = [
    # "막히는_영상_ID_여기에_추가"
]

client = genai.Client(api_key=API_KEY)

def save_checkpoint(data):
    if not data: return
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("[\n")
        for i, item in enumerate(data):
            line = json.dumps(item, ensure_ascii=False)
            if i < len(data) - 1:
                f.write("  " + line + ",\n")
            else:
                f.write("  " + line + "\n")
        f.write("]")

# ==========================================
# 2. [Step 1] 영상 후보군 검색 (최신순 정렬)
# ==========================================
def get_video_candidates(keyword, limit=30):
    print(f"🔍 '{keyword}' 관련 최신 영상 {limit}개를 검색합니다...")
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': False,
        'noplaylist': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'skip_download': True,
        'http_headers': {'User-Agent': USER_AGENT}
    }
    
    query = f"ytsearch{limit}:{keyword} 여행 브이로그 -shorts"
    candidates = []

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            flat_opts = {**ydl_opts, 'extract_flat': True}
            with yt_dlp.YoutubeDL(flat_opts) as search_ydl:
                search_result = search_ydl.extract_info(query, download=False)

            if 'entries' in search_result:
                entries = sorted(
                    search_result['entries'], 
                    key=lambda x: x.get('upload_date', '00000000'), 
                    reverse=True
                )

                print(f"📋 검색된 {len(entries)}개의 후보를 최신순으로 정렬했습니다.")

                for entry in entries:
                    if not entry: continue # 안전 장치: entry 자체가 None인 경우 방어
                    
                    video_id = entry.get('id')
                    if not video_id: continue # 안전 장치: ID가 없는 쓰레기 데이터 방어

                    title = entry.get('title', '')
                    
                    # 🚨 [Fix/New] 에러 해결: duration이 None으로 넘어올 경우(라이브 등) 무조건 0으로 안전하게 치환
                    raw_duration = entry.get('duration')
                    duration = raw_duration if raw_duration is not None else 0
                    
                    if video_id in EXCLUDE_VIDEO_IDS: continue
                    if duration < 300: continue # 이제 None 타입 에러 없이 정상적으로 300(5분) 미만 필터링 작동
                    if 'shorts' in title.lower(): continue

                    candidates.append({
                        "id": video_id,
                        "title": title,
                        "url": entry.get('url'),
                        "duration": duration,
                        "upload_date": entry.get('upload_date'),
                        "thumbnail": entry.get('thumbnails', [{}])[0].get('url', '')
                    })
                    
        return candidates

    except Exception as e:
        print(f"❌ 검색 중 오류 발생: {e}")
        return []

# ==========================================
# 3. [Step 2] 자막 추출
# ==========================================
def get_transcript_text(video_url):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'http_headers': {'User-Agent': USER_AGENT} 
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            subs = info.get('subtitles') or {}
            auto_subs = info.get('automatic_captions') or {}
            
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

            json_url = next((fmt['url'] for fmt in selected_sub if fmt.get('ext') == 'json3'), None)
            if not json_url: return None

            response = requests.get(json_url, headers={'User-Agent': USER_AGENT})
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
    - **포맷:** 반드시 아래 JSON 형식으로만 출력해.        
    
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
# 5. 메인 실행 
# ==========================================
def main():
    print(f"🚀 '{LOCATIONS[0]}' 타임라인 데이터 확보 시작")
    print(f"🎯 목표: 유효한 데이터 {TARGET_SUCCESS_COUNT}개 수집")
    
    candidates = get_video_candidates(LOCATIONS[0], limit=SEARCH_CANDIDATES)
    final_data = []

    print(f"\n🏃 검증 및 분석 시작 (총 {len(candidates)}개 후보)...")
    
    for i, video in enumerate(candidates):
        if len(final_data) >= TARGET_SUCCESS_COUNT:
            print(f"\n✨ 목표 달성! ({len(final_data)}/{TARGET_SUCCESS_COUNT})")
            break

        print(f"\n[{i+1}/{len(candidates)}] 분석 중: {video['title']}")
        
        transcript = get_transcript_text(video['url'])
        if not transcript:
            print("  Pass: 자막 없음 또는 접근 차단 ❌")
            continue
        
        result_text = analyze_with_gemini(LOCATIONS[0], video, transcript)
        result_json = parse_json(result_text)

        if result_json and result_json.get('ai_context', {}).get('timeline'):
            final_data.append(result_json)
            save_checkpoint(final_data) 
            print(f"  ✅ 타임라인 확보 성공 및 저장 완료! (현재 {len(final_data)}/{TARGET_SUCCESS_COUNT})")
        else:
            print("  Pass: 여행 정보 부족 또는 분석 실패 ⚠️")
        
        sleep_time = random.uniform(3.0, 7.0)
        print(f"  ⏳ 봇 감지 우회 중... ({sleep_time:.1f}초 대기)")
        time.sleep(sleep_time)

    print(f"\n🎉 최종 결과: 총 {len(final_data)}개의 데이터가 저장되었습니다.")
    print(f"📂 파일 경로: {OUTPUT_FILE}")
    
    if len(final_data) < TARGET_SUCCESS_COUNT:
        print(f"⚠️ 경고: 후보군을 모두 검색했으나 목표({TARGET_SUCCESS_COUNT}개)를 채우지 못했습니다.")

if __name__ == "__main__":
    main()