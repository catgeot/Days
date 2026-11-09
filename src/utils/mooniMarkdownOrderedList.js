const ORDERED_LINE = /^(\s*)(\d+)\.\s+(.*)$/;
const HEADING_LINE = /^\s*(?:#{1,6}\s+|\*\*[^*\n]+\*\*|\d{1,2}일차)\s*$/;
const BLANK_LINE = /^\s*$/;
const LIST_BREAK_LINE = /^\s*(?:[-*+]\s+|\d+\.\s+)/;

/** 소제목(heading) 뒤에 다시 1.부터 나오는 번호 목록을 앞 구간 이어번으로 맞춘다. */
export function continueMooniOrderedListNumbers(markdown) {
  const lines = String(markdown ?? '').split('\n');
  let counter = 0;
  let inRun = false;
  return lines
    .map((line) => {
      const ordered = line.match(ORDERED_LINE);
      if (ordered) {
        const n = Number(ordered[2]);
        if (!inRun) {
          counter = n;
        } else if (n === 1) {
          counter += 1;
        } else if (n > counter) {
          counter = n;
        } else if (n < counter) {
          counter += 1;
        } else if (n === counter && counter > 1) {
          counter += 1;
        }
        inRun = true;
        return `${ordered[1]}${counter}. ${ordered[3]}`;
      }
      if (BLANK_LINE.test(line) || HEADING_LINE.test(line)) {
        return line;
      }
      if (/^\s*---\s*$/.test(line)) {
        inRun = false;
        counter = 0;
        return line;
      }
      if (/^\s*#{1,2}\s+\S/.test(line)) {
        inRun = false;
        counter = 0;
        return line;
      }
      return line;
    })
    .join('\n');
}
