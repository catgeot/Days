const ORDERED_LINE = /^(\s*)(\d+)\.\s+(.*)$/;
const NESTED_ORDERED = /^(\s*)(\d+)\.\s+(\*\*.*)$/;
const HEADING_LINE = /^\s*(?:#{1,6}\s+|\*\*[^*\n]+\*\*|\d{1,2}일차)\s*$/;
const BLANK_LINE = /^\s*$/;
const LIST_BREAK_LINE = /^\s*(?:[-*+]\s+|\d+\.\s+)/;

/** MOONi 답변: «2. 탑승 절차» 아래 1.·2.·3. 중첩 목록은 이어번하지 않고, 소제목 번호만 문서 순서대로 맞춘다. */
export function continueMooniOrderedListNumbers(markdown) {
  const lines = String(markdown ?? '').split('\n');
  let sectionNum = 0;
  let nestedNum = 0;
  return lines
    .map((line) => {
      if (BLANK_LINE.test(line)) {
        return line;
      }
      if (HEADING_LINE.test(line) || /^\s*---\s*$/.test(line) || /^\s*#{1,2}\s+\S/.test(line)) {
        return line;
      }
      const nested = line.match(NESTED_ORDERED);
      if (nested) {
        nestedNum += 1;
        return `${nested[1]}${nestedNum}. ${nested[3]}`;
      }
      const ordered = line.match(ORDERED_LINE);
      if (!ordered) return line;
      const rest = ordered[3];
      if (!/^\*\*/.test(rest.trimStart())) {
        sectionNum += 1;
        nestedNum = 0;
        return `${ordered[1]}${sectionNum}. ${rest}`;
      }
      return line;
    })
    .join('\n');
}
