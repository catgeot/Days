import google.generativeai as genai
import os
from dotenv import load_dotenv

# 1. 환경 변수 로드 (.env.local 파일)
load_dotenv('.env.local')

# 2. API 키 가져오기
API_KEY = os.getenv("VITE_GEMINI_API_KEY")

# 키가 없는 경우 에러 처리
if not API_KEY:
    print("❌ 오류: .env.local 파일에서 'VITE_GEMINI_API_KEY'를 찾을 수 없습니다.")
    exit()

# 3. Gemini 설정
genai.configure(api_key=API_KEY)

print(f"🔍 API Key 확인됨 ({API_KEY[:5]}...). 사용 가능한 모델 리스트 검색 중...\n")

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- 이름: {m.name}")
            print(f"  표시명: {m.display_name}")
            print("-" * 30)
            
except Exception as e:
    print(f"❌ 모델 리스트를 가져오는 중 오류 발생: {e}")