-- 1. 신규 테이블 생성 (빈 테이블로 시작)
CREATE TABLE public.place_toolkit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    place_id TEXT NOT NULL UNIQUE,  -- 'travel_spots' 또는 'savedTrips'의 대상지 식별자
    essential_guide JSONB,          -- AI가 생성한 구조화된 툴킷 JSON 데이터
    toolkit_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- 툴킷 데이터 최종 갱신 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 검색 성능 향상을 위한 인덱스 생성
CREATE INDEX idx_place_toolkit_place_id ON public.place_toolkit(place_id);

-- 3. RLS(Row Level Security) 설정 (원하는 경우)
ALTER TABLE public.place_toolkit ENABLE ROW LEVEL SECURITY;

-- 4. 누구나 읽기 가능하도록 정책 추가
CREATE POLICY "Enable read access for all users" ON public.place_toolkit FOR SELECT USING (true);

-- 5. 서비스 역할(또는 엣지 함수)에서만 쓰기 가능하도록 설정
-- (Supabase 관리자나 서비스 역할 키를 사용하는 경우 기본적으로 RLS를 우회하므로 따로 추가하지 않아도 되지만,
-- 익명 사용자의 임의 수정을 막기 위해 위와 같이 Select 정책만 설정합니다.)
