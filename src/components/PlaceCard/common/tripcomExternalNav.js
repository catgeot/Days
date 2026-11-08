/**
 * WebKit은 스크립트가 만든 `<a rel="noreferrer">.click()` 직후 remove 하면 이동을 취소한다.
 * Referer가 있으면 Trip.com이 공항 코드를 무시하므로 같은 탭 이동 전에 no-referrer로 둔다.
 * @param {string} url
 * @param {{ window?: Window, document?: Document }} [nav]
 */
export function assignTripcomWithoutReferrer(url, nav = {}) {
    const win = nav.window || window;
    const doc = nav.document || document;
    const head = doc.head || doc.documentElement;
    if (head) {
        let meta = head.querySelector('meta[name="referrer"]');
        if (!meta) {
            meta = doc.createElement('meta');
            meta.setAttribute('name', 'referrer');
            head.appendChild(meta);
        }
        meta.setAttribute('content', 'no-referrer');
    }
    win.location.assign(url);
}

/**
 * @param {string} url
 * @param {{
 *   target?: string,
 *   placeLabel?: string,
 *   recordVisit?: (input: { href: string, placeLabel?: string }) => void,
 *   window?: Window,
 *   document?: Document,
 * }} [options]
 */
export function openRecordedTripcomUrl(url, options = {}) {
    if (!url) return;
    const win = options.window || window;
    try {
        options.recordVisit?.({ href: url, placeLabel: options.placeLabel });
    } catch {
        // 저장 실패가 검색 이동을 막지 않게
    }
    if (options.target === '_self') {
        assignTripcomWithoutReferrer(url, { window: win, document: options.document });
        return;
    }
    const opened = win.open(url, '_blank', 'noopener');
    if (!opened) assignTripcomWithoutReferrer(url, { window: win, document: options.document });
}
