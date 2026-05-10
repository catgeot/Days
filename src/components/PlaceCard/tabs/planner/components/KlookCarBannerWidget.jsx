import React, { useEffect, useRef, useState } from 'react';
import { isMobileDevice } from '../../../common/device';

const KLOOK_WIDGET_SCRIPT_SRC = 'https://affiliate.klook.com/widget/fetch-iframe-init.js';
const KLOOK_IFRAME_INIT_SCRIPT_KEYWORD = '/widget/iframe/iframe-init-';

const resetKlookWidgetScripts = () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach((scriptEl) => {
        const src = scriptEl.getAttribute('src') || '';
        if (src === KLOOK_WIDGET_SCRIPT_SRC || src.includes(KLOOK_IFRAME_INIT_SCRIPT_KEYWORD)) {
            scriptEl.remove();
        }
    });
};

const loadKlookWidgetScript = () => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = KLOOK_WIDGET_SCRIPT_SRC;
    return new Promise((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Klook widget script'));
        document.body.appendChild(script);
    });
};

// 명소 Klook 배너와 동일: IAB 468×60 + 카드 폭 맞춤 스케일
const DEFAULT_BANNER_W = 468;
const DEFAULT_BANNER_H = 60;
const MAX_BANNER_SCALE = 2.35;

const KlookCarBannerWidget = ({
    width = DEFAULT_BANNER_W,
    height = DEFAULT_BANNER_H,
    className = 'mt-3',
    targetUrl = 'https://www.klook.com/?aid=118544',
}) => {
    const containerRef = useRef(null);
    const hasRetriedRef = useRef(false);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        let disposed = false;

        const mountWidget = async () => {
            resetKlookWidgetScripts();
            try {
                await loadKlookWidgetScript();
            } catch (error) {
                console.error('[KlookCarBannerWidget] Script load failed:', error);
                return;
            }

            // 첫 진입 시 iframe이 늦게 생성되는 케이스를 1회 보정
            setTimeout(async () => {
                if (disposed || !containerRef.current || hasRetriedRef.current) return;
                const hasRenderedIframe = !!containerRef.current.querySelector('iframe');
                if (hasRenderedIframe) return;

                hasRetriedRef.current = true;
                resetKlookWidgetScripts();
                try {
                    await loadKlookWidgetScript();
                } catch (error) {
                    console.error('[KlookCarBannerWidget] Retry load failed:', error);
                }
            }, 1200);
        };

        mountWidget();

        return () => {
            disposed = true;
        };
    }, []);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const horizontalPad = 8;
            const available = containerRef.current.clientWidth - horizontalPad;
            const raw = available / width;
            const nextScale = Math.min(MAX_BANNER_SCALE, Math.max(0.2, raw));
            setScale(nextScale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        const el = containerRef.current;
        const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(updateScale) : null;
        if (ro && el) ro.observe(el);

        return () => {
            window.removeEventListener('resize', updateScale);
            ro?.disconnect();
        };
    }, [width]);

    const clipW = Math.round(width * scale);
    const clipH = Math.round(height * scale);

    return (
        <div ref={containerRef} className={`${className} relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm`}>
            <div className="mx-auto" style={{ width: clipW, height: clipH }}>
                <div className="overflow-hidden rounded-md" style={{ width: clipW, height: clipH }}>
                    <div
                        style={{
                            width: `${width}px`,
                            height: `${height}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        <ins
                            className="klk-aff-widget"
                            data-wid="118544"
                            data-bgtype="Car"
                            data-adid="1265731"
                            data-lang="ko"
                            data-prod="banner"
                            data-width={String(width)}
                            data-height={String(height)}
                        >
                            <a href={targetUrl}>Klook.com</a>
                        </ins>
                    </div>
                </div>
            </div>
            <a
                href={targetUrl}
                target={isMobileDevice() ? '_self' : '_blank'}
                rel="noopener noreferrer"
                aria-label="Klook 렌터카 페이지 열기"
                className="absolute inset-0 z-10"
            />
        </div>
    );
};

export default KlookCarBannerWidget;
