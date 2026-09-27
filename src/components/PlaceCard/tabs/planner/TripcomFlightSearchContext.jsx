import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getPlannerFlightArrivalIata } from '../../../../utils/affiliate';
import TripcomFlightSearchModal from '../../modals/TripcomFlightSearchModal';
import {
    buildTripcomPlannerFlightModalSrc,
    getTripcomFlightAdForModal,
    shouldUseTripcomFlightSearchModal,
} from '../../common/partnerNavigation';

const TripcomFlightSearchContext = createContext(null);

export function TripcomFlightSearchProvider({ children }) {
    const [modalState, setModalState] = useState(null);

    const closeFlightSearch = useCallback(() => {
        setModalState(null);
    }, []);

    const tryOpenFlightSearch = useCallback((location, options = {}) => {
        if (!location) return false;

        const iframeSrc = buildTripcomPlannerFlightModalSrc(location, options);
        const arrivalIata = getPlannerFlightArrivalIata(location, {
            essentialGuide: options.essentialGuide,
        });
        const departureIata = options.departureIata ?? null;

        if (iframeSrc && shouldUseTripcomFlightSearchModal(options)) {
            const { width: bannerWidth, height: bannerHeight } = getTripcomFlightAdForModal();
            setModalState({
                mode: 'iframe',
                iframeSrc,
                arrivalIata,
                departureIata,
                bannerWidth,
                bannerHeight,
            });
            return true;
        }

        // iframe 위젯이 막히면 일정 선택 폼을 띄운다. tickets 직행 금지.
        setModalState({
            mode: 'native',
            location,
            essentialGuide: options.essentialGuide ?? null,
            arrivalIata,
            departureIata,
            tracking: options.tracking ?? null,
            departDate: options.departDate ?? null,
            returnDate: options.returnDate ?? null,
        });
        return true;
    }, []);

    const value = useMemo(
        () => ({
            tryOpenFlightSearch,
            closeFlightSearch,
        }),
        [tryOpenFlightSearch, closeFlightSearch],
    );

    return (
        <TripcomFlightSearchContext.Provider value={value}>
            {children}
            {modalState ? (
                <TripcomFlightSearchModal
                    mode={modalState.mode}
                    iframeSrc={modalState.iframeSrc}
                    location={modalState.location}
                    essentialGuide={modalState.essentialGuide}
                    arrivalIata={modalState.arrivalIata}
                    departureIata={modalState.departureIata}
                    tracking={modalState.tracking}
                    departDate={modalState.departDate}
                    returnDate={modalState.returnDate}
                    bannerWidth={modalState.bannerWidth}
                    bannerHeight={modalState.bannerHeight}
                    onClose={closeFlightSearch}
                />
            ) : null}
        </TripcomFlightSearchContext.Provider>
    );
}

export function useTripcomFlightSearch() {
    const context = useContext(TripcomFlightSearchContext);
    if (!context) {
        throw new Error('useTripcomFlightSearch must be used within TripcomFlightSearchProvider');
    }
    return context;
}

/** Provider 밖에서는 false — 외부 링크 폴백 */
export function useTryOpenTripcomFlightSearch() {
    const context = useContext(TripcomFlightSearchContext);
    return context?.tryOpenFlightSearch ?? (() => false);
}
