import os
import time
import json
import re
import requests # 🚨 [New] 자막 데이터를 다운로드하기 위해 추가 (설치 필요: pip install requests)
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

# 🚨 분석하고 싶은 여행지로 변경하세요
LOCATIONS = ["스위스 알프스"] 
OUTPUT_FILE = "real_timeline_data.json"
MAX_RESULTS = 5 

client = genai.Client(api_key=API_KEY)

# ==========================================
# 2. [Step 1] yt-dlp: 영상 검색 및 자막 URL 추출
# ==========================================
def get_video_data_with_subs(keyword, limit=5):
    print(f"🔍 '{keyword}' 여행 브이로그 검색 및 분석 중...")
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': False, # 🚨 자막 정보를 보려면 flat 모드를 꺼야 함 (속도는 약간 느려짐)
        'noplaylist': True,
        'writesubtitles': True,      # 자막 정보 요청
        'writeautomaticsub': True,   # 자동 생성 자막 요청
        'skip_download': True,       # 영상 다운로드는 생략
    }
    
    # 쿼리: 검색어 + 여행 브이로그 + 숏츠 제외
    query = f"ytsearch{limit * 2}:{keyword} 여행 브이로그 -shorts"
    video_list = []

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 검색 결과 가져오기 (flat=True로 빠르게 목록만 먼저 확보)
            search_opts = {**ydl_opts, 'extract_flat': True}
            with yt_dlp.YoutubeDL(search_opts) as search_ydl:
                search_result = search_ydl.extract_info(query, download=False)

            if 'entries' in search_result:
                for entry in search_result['entries']:
                    video_id = entry['id']
                    title = entry['title']
                    duration = entry.get('duration', 0)

                    # 필터링 (5분 미만, 숏츠 제외)
                    if duration < 300: continue
                    if 'shorts' in title.lower(): continue

                    print(f"\n🎥 상세 분석 중: {title}")
                    
                    # 🚨 [Core] 개별 영상의 자막 정보 추출
                    try:
                        # 자막 URL을 얻기 위해 상세 정보 로드
                        info = ydl.extract_info(entry['url'], download=False)
                        
                        # 자막 텍스트 가져오기 (함수 호출)
                        transcript_text = extract_transcript_from_info(info)
                        
                        if not transcript_text:
                            print("   Pass: 자막을 찾을 수 없습니다.")
                            continue
                            
                        print(f"   👉 자막 확보 완료 ({len(transcript_text)}자)")
                        
                        video_list.append({
                            "info": {
                                "id": video_id,
                                "title": title,
                                "url": entry['url'],
                                "duration": duration,
                                "thumbnail": entry.get('thumbnails', [{}])[0].get('url', '')
                            },
                            "transcript": transcript_text
                        })

                        if len(video_list) >= limit: break

                    except Exception as e:
                        print(f"   ⚠️ 상세 정보 로드 실패: {e}")
                        continue
                        
        print(f"\n✅ 분석 가능한 영상 {len(video_list)}개 확보.")
        return video_list

    except Exception as e:
        print(f"❌ 검색 프로세스 실패: {e}")
        return []

# ==========================================
# 3. [Step 2] 자막 URL에서 텍스트 추출 (핵심)
# ==========================================
def extract_transcript_from_info(info_dict):
    """
    yt-dlp 정보 딕셔너리에서 한국어 > 영어 순으로 자막을 찾고 텍스트로 변환합니다.
    """
    # 1. 자막 후보군 통합 (수동 자막 + 자동 자막)
    subs = info_dict.get('subtitles') or {}
    auto_subs = info_dict.get('automatic_captions') or {}
    
    # 2. 우선순위: 한국어 수동 -> 한국어 자동 -> 영어 수동 -> 영어 자동
    target_langs = ['ko', 'en']
    selected_sub = None
    
    for lang in target_langs:
        # 수동 자막 확인
        if lang in subs:
            selected_sub = subs[lang]
            break
        # 자동 자막 확인
        if lang in auto_subs:
            selected_sub = auto_subs[lang]
            break
            
    if not selected_sub:
        return None

    # 3. JSON3 포맷 URL 찾기 (가장 파싱하기 쉬움)
    json_url = None
    for fmt in selected_sub:
        if fmt.get('ext') == 'json3':
            json_url = fmt.get('url')
            break
    
    # JSON3가 없으면 VTT나 다른 포맷일 수 있는데, 여기선 JSON3만 시도
    if not json_url:
        return None

    # 4. 자막 데이터 다운로드 및 파싱
    try:
        response = requests.get(json_url)
        response.raise_for_status()
        json_data = response.json()
        
        full_text = ""
        if 'events' in json_data:
            for event in json_data['events']:
                # 시간 정보 (ms 단위 -> MM:SS)
                start_ms = event.get('tStartMs', 0)
                start_sec = start_ms // 1000
                time_str = f"[{start_sec//60:02d}:{start_sec%60:02d}]"
                
                # 텍스트 합치기
                if 'segs' in event:
                    seg_text = "".join([seg.get('utf8', '') for seg in event['segs']])
                    seg_text = seg_text.replace('\n', ' ').strip()
                    if seg_text:
                        full_text += f"{time_str} {seg_text}\n"
                        
        return full_text[:25000] # Gemini 용량 제한 고려

    except Exception as e:
        print(f"   (자막 다운로드 실패: {e})")
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

    [필수 조건]
    1. **거짓말 금지:** 자막에 없는 장소나 행동은 절대 적지 마.
    2. **내용 판단:** 자막이 여행 정보가 너무 부실하면 빈 리스트 `[]`를 반환해.
    3. **포맷:** 반드시 아래 JSON 형식으로만 출력해.

    {{
        "id": "{video_info['id']}",
        "title": "{video_info['title']}",
        "duration": {video_info['duration']},
        "url": "{video_info['url']}",
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

# ==========================================
# 5. 유틸리티 & 메인
# ==========================================
def parse_json(text):
    if not text: return None
    try:
        clean_text = re.sub(r"```json|```", "", text).strip()
        return json.loads(clean_text)
    except:
        return None

def main():
    print(f"🚀 '{LOCATIONS[0]}' 타임라인 추출 시작 (yt-dlp 단독 모드)...")
    
    # 1. 영상 및 자막 확보
    video_datasets = get_video_data_with_subs(LOCATIONS[0], limit=MAX_RESULTS)
    final_data = []

    # 2. AI 분석
    print(f"\n🤖 AI 분석 시작 (총 {len(video_datasets)}개)...")
    for data in video_datasets:
        info = data['info']
        print(f"   Processing: {info['title']}...")
        
        result_text = analyze_with_gemini(LOCATIONS[0], info, data['transcript'])
        result_json = parse_json(result_text)

        if result_json and result_json.get('ai_context', {}).get('timeline'):
            final_data.append(result_json)
            print("     ✅ 타임라인 생성 성공!")
        else:
            print("     Pass: 유효한 정보 부족")
        
        time.sleep(1) 

    # 3. 저장
    if final_data:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)
        print(f"\n🎉 성공! 총 {len(final_data)}개의 데이터가 {OUTPUT_FILE}에 저장되었습니다.")
    else:
        print("\n⚠️ 저장된 데이터가 없습니다.")

if __name__ == "__main__":
    main()