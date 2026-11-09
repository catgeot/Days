import { isMooniGfmTableLine } from './mooniGfmTableLine.js';

/** 비표 행 끝에 붙는 교통편 CTA 잔여 `|` 제거 */
export function stripMooniScheduleTrailingPipes(markdown) {
  return String(markdown ?? '')
    .split('\n')
    .map((line) => {
      if (!line.trim() || isMooniGfmTableLine(line)) return line;
      return line.replace(/\s+\|\s*$/, '');
    })
    .join('\n');
}
