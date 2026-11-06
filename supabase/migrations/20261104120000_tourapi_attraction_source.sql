-- tourapi_attraction: TourAPI 주간 sync 대상 vs GATEO 직접 등록 구분
ALTER TABLE public.tourapi_attraction
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'tourapi';
