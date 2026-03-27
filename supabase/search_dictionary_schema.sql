-- Phase 1.5 스마트 검색 캐싱(Dictionary) DB 스키마
-- Supabase SQL Editor 에서 아래 코드를 실행해주세요.

CREATE TABLE IF NOT EXISTS public.search_dictionary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_query TEXT NOT NULL UNIQUE,
    corrected_query TEXT NOT NULL,
    location_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 속도 향상을 위한 인덱스 생성 (소문자 기반 검색을 위해 LOWER 적용 가능성 고려)
CREATE INDEX IF NOT EXISTS idx_search_dictionary_original_query
ON public.search_dictionary(LOWER(original_query));

-- Row Level Security (RLS) 활성화
ALTER TABLE public.search_dictionary ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회(Select) 권한 부여
CREATE POLICY "Enable read access for all users"
ON public.search_dictionary
FOR SELECT USING (true);

-- 모든 사용자 삽입(Insert) 권한 부여 (AI 교정 결과 캐싱용)
CREATE POLICY "Enable insert for all users"
ON public.search_dictionary
FOR INSERT WITH CHECK (true);
