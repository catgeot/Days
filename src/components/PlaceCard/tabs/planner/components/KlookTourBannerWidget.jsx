import React, { useEffect, useRef, useState } from 'react';
import { isMobileDevice } from '../../../common/device';
import {
    computeKlookBannerLayout,
    KLOOK_BANNER_MOBILE_HEIGHT,
    KLOOK_BANNER_MOBILE_WIDTH,
    KLOOK_TOUR_AD_ID_DESKTOP,
    KLOOK_TOUR_AD_ID_MOBILE,
} from './klookBannerLayout';
import { useKlookPlannerBannerDimensions } from './useKlookPlannerBannerDimensions';

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

const KlookTourBannerWidget = ({
    width: widthProp,
    height: heightProp,
    className = 'mt-3',
    targetUrl = 'https://www.klook.com/?aid=118544',
}) => {
    const responsiveDims = useKlookPlannerBannerDimensions('tour');
    const width = widthProp ?? responsiveDims.width;
    const height = heightProp ?? responsiveDims.height;

    const containerRef = useRef(null);
    const hasRetriedRef = useRef(false);
    const [layout, setLayout] = useState({ scale: 1, clipW: 320, clipH: height });

    useEffect(() => {
        hasRetriedRef.current = false;
    }, [width, height]);

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
    }, [width, height]);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            setLayout(computeKlookBannerLayout(containerRef.current.clientWidth, 8, width, height));
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
    }, [width, height]);

    const { scale, clipH } = layout;

    const tourAdId =
        width === KLOOK_BANNER_MOBILE_WIDTH && height === KLOOK_BANNER_MOBILE_HEIGHT
            ? KLOOK_TOUR_AD_ID_MOBILE
            : KLOOK_TOUR_AD_ID_DESKTOP;

    return (
        <div className={className}>
            <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                {/*
                  렌터카 배너와 동일: iframe이 클릭을 가로채면 aid가 위젯 쪽으로 바뀔 수 있음.
                  시각은 위젯 유지, 클릭은 affiliate 리다이렉트(targetUrl)로만 통과.
                */}
                <div
                    className="pointer-events-none flex w-full justify-center overflow-hidden rounded-md"
                    style={{ height: `${clipH}px` }}
                >
                    <div
                        key={`klook-tour-scale-${width}-${height}`}
                        style={{
                            width: `${width}px`,
                            height: `${height}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <ins
                            className="klk-aff-widget"
                            data-wid="118544"
                            data-bgtype="Play"
                            data-adid={tourAdId}
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
                    className="pointer-events-auto absolute inset-0 z-20"
                />
            </div>
        </div>
    );
};

export default KlookTourBannerWidget;
