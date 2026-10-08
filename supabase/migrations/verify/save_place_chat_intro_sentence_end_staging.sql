-- Human-operated staging verification (gateo-staging-temp, ref qeqszwxjvhnbzhkchera).
-- Run in SQL Editor after applying 20261008120000_save_place_chat_intro_sentence_end.sql.
-- Expect: ok_* → true, bad_* → false. Clean up test keys when done.

-- PASS: complete Korean intro (Cos 수타사-style)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_ko',
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 신라 시대에 처음 세워졌다고 전해지는 유서 깊은 산사입니다. 사계절 숲길과 고즈넉한 법당이 어우러져, 잠시 발길을 멈추고 쉬어 가 보기 좋습니다.'
) AS ok_ko_period;

-- PASS: formal ending 습니다.
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_seupnida',
  '보로부두르는 자바 중부의 불교 사원으로, 이른 아침 일출을 보며 올라가는 코스가 잘 알려져 있습니다.'
) AS ok_seupnida;

-- PASS: closing quote after period
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_ok_quote',
  '부산 해운대는 넓은 백사장과 야경이 어우러진 대표 해변입니다. 인근 맛집과 산책로도 함께 둘러보기 좋습니다."'
) AS ok_closing_quote;

-- FAIL: mid-word / mid-sentence (Cos 수 stump)
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_bad_mid',
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수'
) AS bad_mid_sentence;

-- FAIL: long but no terminal punctuation
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_bad_no_punct',
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 오래전부터 수행의 장소로 알려져 왔습니다'
) AS bad_no_punct;

-- FAIL: trailing comma
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_bad_comma',
  '제주도는 한국 최남단의 섬으로, 해안 드라이브가 인기 있는 여행지입니다,'
) AS bad_trailing_comma;

-- FAIL: unclosed markdown bold
SELECT public.save_place_chat_intro(
  '__qa_sentence_end_bad_md',
  '**Draft intro stub for QA only — should not persist because bold marker is not closed.'
) AS bad_unclosed_markdown;

-- Cleanup (optional)
-- DELETE FROM public.place_chat_intro WHERE destination_key LIKE '__qa_sentence_end_%';
