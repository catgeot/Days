-- 1. place_reviews 테이블에 views_count 컬럼 추가 (기본값 0)
ALTER TABLE public.place_reviews ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- 2. place_review_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.place_review_likes (
    review_id uuid REFERENCES public.place_reviews(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (review_id, user_id)
);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE public.place_review_likes ENABLE ROW LEVEL SECURITY;

-- 3.1 누구나(로그인 사용자) 좋아요를 읽을 수 있음
CREATE POLICY "Anyone can view likes"
ON public.place_review_likes
FOR SELECT USING (true);

-- 3.2 로그인한 사용자만 자신의 좋아요를 추가할 수 있음
CREATE POLICY "Authenticated users can insert their own likes"
ON public.place_review_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3.3 로그인한 사용자만 자신의 좋아요를 취소(삭제)할 수 있음
CREATE POLICY "Authenticated users can delete their own likes"
ON public.place_review_likes
FOR DELETE USING (auth.uid() = user_id);

-- 4. 조회수 증가를 위한 RPC (Remote Procedure Call) 함수 생성
-- 동시성 문제(Race condition) 방지를 위해 함수를 통해 단일 트랜잭션으로 증가
CREATE OR REPLACE FUNCTION increment_review_view(review_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.place_reviews
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = review_id_param;
END;
$$;
