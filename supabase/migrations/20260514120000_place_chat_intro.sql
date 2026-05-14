-- Cached short intro shown when opening "AI에게 장소 묻기" for a destination (empty chat).
-- Supabase: SQL Editor에서 이 파일 전체를 한 번에 실행하거나, `supabase db push` 로 적용.

CREATE TABLE IF NOT EXISTS place_chat_intro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_key text NOT NULL UNIQUE,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_place_chat_intro_destination_key ON place_chat_intro (destination_key);

ALTER TABLE place_chat_intro ENABLE ROW LEVEL SECURITY;

-- 재실행 시 정책 중복 오류 방지
DROP POLICY IF EXISTS "place_chat_intro_select_anon" ON place_chat_intro;
DROP POLICY IF EXISTS "place_chat_intro_insert_anon" ON place_chat_intro;
DROP POLICY IF EXISTS "place_chat_intro_update_anon" ON place_chat_intro;

CREATE POLICY "place_chat_intro_select_anon"
  ON place_chat_intro FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "place_chat_intro_insert_anon"
  ON place_chat_intro FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "place_chat_intro_update_anon"
  ON place_chat_intro FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- PostgREST(anon 키)에서 테이블 접근 허용
GRANT SELECT, INSERT, UPDATE ON public.place_chat_intro TO anon, authenticated;
GRANT ALL ON public.place_chat_intro TO service_role;
