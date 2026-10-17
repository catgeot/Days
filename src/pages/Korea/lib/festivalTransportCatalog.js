/** Server catalog DESTINATION_ORDER. Unknown ids are not requested by transport-proxy. */
export const FESTIVAL_TRANSPORT_CONTENT_IDS = ['638576', '637693', '2930716'];

export function shouldQueryFestivalTransport(contentId) {
  return FESTIVAL_TRANSPORT_CONTENT_IDS.includes(String(contentId || '').trim());
}
