/** Curation taste chip/group labels — id SSOT in curationHistory.js */
export function formatCurationTasteLabel(t, opt) {
  if (!opt?.id) return opt?.label || '';
  return t(`logbook.curationHub.taste.${opt.id}`, { defaultValue: opt.label });
}

export function formatCurationTasteGroupTitle(t, group) {
  if (!group?.id) return group?.title || '';
  return t(`logbook.curationHub.tasteGroup.${group.id}`, { defaultValue: group.title });
}
