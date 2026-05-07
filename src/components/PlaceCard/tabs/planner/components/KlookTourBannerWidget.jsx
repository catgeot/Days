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

const KlookTourBannerWidget = ({ width = 728, height = 90, className = 'mt-3', targetUrl = 'https://www.klook.com/?aid=118544' }) => {
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
                console.error('[KlookTourBannerWidget] Script load failed:', error);
                return;
            }

            setTimeout(async () => {
                if (disposed || !containerRef.current || hasRetriedRef.current) return;
                const hasRenderedIframe = !!containerRef.current.querySelector('iframe');
                if (hasRenderedIframe) return;

                hasRetriedRef.current = true;
                resetKlookWidgetScripts();
                try {
                    await loadKlookWidgetScript();
                } catch (error) {
                    console.error('[KlookTourBannerWidget] Retry load failed:', error);
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
            const containerWidth = containerRef.current.clientWidth - 8;
            const nextScale = Math.min(1, containerWidth / width);
            setScale(nextScale > 0 ? nextScale : 1);
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };
    }, [width]);

    return (
        <div ref={containerRef} className={`${className} relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm`}>
            <div style={{ height: `${height * scale}px` }}>
                <div
                    className="origin-top-left"
                    style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: `scale(${scale})`,
                    }}
                >
                    <ins
                        className="klk-aff-widget"
                        data-wid="118544"
                        data-bgtype="Play"
                        data-adid="1272015"
                        data-lang="ko"
                        data-prod="banner"
                        data-width={String(width)}
                        data-height={String(height)}
                    >
                        <a href={targetUrl}>Klook.com</a>
                    </ins>
                </div>
            </div>
            <a
                href={targetUrl}
                target={isMobileDevice() ? '_self' : '_blank'}
                rel="noopener noreferrer"
                aria-label="Klook 투어 페이지 열기"
                className="absolute inset-0 z-10"
            />
        </div>
    );
};

export default KlookTourBannerWidget;
