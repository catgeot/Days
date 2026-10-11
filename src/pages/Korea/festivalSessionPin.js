/**
 * Strip transient detail-sheet fields before persisting a session pin row.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {Record<string, unknown> | null}
 */
export function festivalItemForSessionPin(item) {
  if (!item || item.contentId == null) return null;
  const { detailAsOf: _detailAsOf, ...rest } = item;
  return { ...rest, contentId: String(item.contentId) };
}

/**
 * @param {object[]} panelItems
 * @param {Record<string, unknown> | null | undefined} pinned
 */
export function excludePinnedFromPanelItems(panelItems, pinned) {
  if (!pinned?.contentId) return panelItems;
  const pinId = String(pinned.contentId);
  return (panelItems || []).filter(
    (row) => String(row?.contentId || '') !== pinId,
  );
}
