/**
 * 팔경 묶음 제목이 바뀌면 카드 격자를 끊는다.
 * 묶음 뒤에 제목 없는 행이 오면 rest (「지역 대표 명소」).
 * @param {Array<{ groupTitle?: string }> | null | undefined} spots
 * @returns {{ title: string, rest: boolean, spots: object[] }[]}
 */
export function scenicCardSections(spots) {
  const sections = [];
  let sawGroup = false;
  for (const spot of spots || []) {
    const title = String(spot?.groupTitle || '').trim();
    const last = sections[sections.length - 1];
    if (!last || last.title !== title) {
      if (title) sawGroup = true;
      sections.push({
        title,
        rest: !title && sawGroup,
        spots: [spot],
      });
    } else {
      last.spots.push(spot);
    }
  }
  return sections;
}
