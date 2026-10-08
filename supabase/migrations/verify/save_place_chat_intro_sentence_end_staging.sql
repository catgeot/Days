-- Human-operated staging verification (gateo-staging-temp, ref qeqszwxjvhnbzhkchera).
-- After 20261008120000_save_place_chat_intro_sentence_end.sql.
-- Validation failures raise ERRCODE 22023; hourly cap raises 54000. Existing keys return false (no overwrite).

-- 1) PASS: insert a new valid intro (expect true)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_ko',
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 신라 시대에 처음 세워졌다고 전해지는 유서 깊은 산사입니다. 사계절 숲길과 고즈넉한 법당이 어우러져, 잠시 발길을 멈추고 쉬어 가 보기 좋습니다.'
) AS ok_insert_should_be_true;

-- 2) No overwrite: same key again with different summary (expect false; row unchanged)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_ko',
  '이 문장은 저장되면 안 됩니다. 기존 키가 있으면 덮어쓰지 않고 false를 반환해야 합니다.'
) AS existing_key_should_be_false;

SELECT summary
FROM public.place_chat_intro
WHERE destination_key = '__qa_sentence_end_ok_ko';

-- 3) PASS: curly closing quote after period (Edge/client parity)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_curly_period',
  '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞아요.”'
) AS ok_curly_period_should_be_true;

-- 4) PASS: curly closing quote after exclamation
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_curly_exclaim',
  '해안 절벽 위 전망대에서 바다를 내려다보면 일몰이 특히 아름다워 사진 찍기 좋은 길입니다!”'
) AS ok_curly_exclaim_should_be_true;

-- 5) PASS: trailing newline after valid ending (btrim + \s*$ parity with JS)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_trailing_nl',
  E'제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞습니다.\n'
) AS ok_trailing_newline_should_be_true;

-- 6) FAIL: letter after terminal period (.s) — must not match literal s*$ tail bug
DO $verify$
DECLARE
  msg text;
BEGIN
  PERFORM public.save_place_chat_intro(
    '__qa_sentence_end_bad_dot_s',
    '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞습니다.s'
  );
  RAISE EXCEPTION 'verify: expected exception for .s suffix';
EXCEPTION
  WHEN sqlstate '22023' THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    IF msg NOT LIKE '%summary must end with a complete sentence%' THEN
      RAISE EXCEPTION 'verify: wrong 22023 message: %', msg;
    END IF;
    RAISE NOTICE 'ok: .s suffix rejected (22023 sentence-end message)';
END;
$verify$;

-- 7) FAIL: mid-sentence, >40 chars (expect 22023 sentence-end message, not length)
DO $verify$
DECLARE
  msg text;
BEGIN
  PERFORM public.save_place_chat_intro(
    '__qa_sentence_end_bad_mid',
    '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 오래전부터 수행의 장소로 알려져 왔습니다'
  );
  RAISE EXCEPTION 'verify: expected exception for mid-sentence summary';
EXCEPTION
  WHEN sqlstate '22023' THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    IF msg NOT LIKE '%summary must end with a complete sentence%' THEN
      RAISE EXCEPTION 'verify: wrong 22023 message: %', msg;
    END IF;
    RAISE NOTICE 'ok: mid-sentence rejected (22023 sentence-end message)';
END;
$verify$;

-- 8) FAIL: trailing comma (expect EXCEPTION 22023)
DO $verify$
BEGIN
  PERFORM public.save_place_chat_intro(
    '__qa_sentence_end_bad_comma',
    '제주도는 한국 최남단의 섬으로, 해안 드라이브가 인기 있는 여행지입니다,'
  );
  RAISE EXCEPTION 'verify: expected exception for trailing comma';
EXCEPTION
  WHEN sqlstate '22023' THEN
    RAISE NOTICE 'ok: trailing comma rejected (22023)';
END;
$verify$;

-- 9) FAIL: unclosed markdown (expect EXCEPTION 22023)
DO $verify$
BEGIN
  PERFORM public.save_place_chat_intro(
    '__qa_sentence_end_bad_md',
    '**Draft intro stub for QA only — should not persist because bold marker is not closed.'
  );
  RAISE EXCEPTION 'verify: expected exception for unclosed markdown';
EXCEPTION
  WHEN sqlstate '22023' THEN
    RAISE NOTICE 'ok: unclosed markdown rejected (22023)';
END;
$verify$;

-- Cleanup (optional)
-- DELETE FROM public.place_chat_intro WHERE destination_key LIKE '__qa_sentence_end_%';
