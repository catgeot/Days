import React, { useEffect, useRef, useState } from 'react';

const KLOOK_WIDGET_SCRIPT_SRC = 'https://affiliate.klook.com/widget/fetch-iframe-init.js';

const ensureKlookWidgetScript = () => {
    if (document.querySelector(`script[src="${KLOOK_WIDGET_SCRIPT_SRC}"]`)) {
        return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = KLOOK_WIDGET_SCRIPT_SRC;
    document.body.appendChild(script);
};

const KlookCarBannerWidget = ({ width = 728, height = 90, className = 'mt-3' }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        ensureKlookWidgetScript();
    }, []);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth - 8; // padding 보정
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
        <div ref={containerRef} className={`${className} w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm`}>
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
                    data-bgtype="Car"
                    data-adid="1265731"
                    data-lang="ko"
                    data-prod="banner"
                    data-width={String(width)}
                    data-height={String(height)}
                >
                    <a href="https://www.klook.com/?aid=118544">Klook.com</a>
                </ins>
            </div>
            </div>
        </div>
    );
};

export default KlookCarBannerWidget;
