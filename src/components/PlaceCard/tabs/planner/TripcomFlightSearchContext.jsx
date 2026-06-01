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
        const useModal = options.forceModal === true || shouldUseTripcomFlightSearchModal();
        if (!useModal) return false;

        const iframeSrc = buildTripcomPlannerFlightModalSrc(location, options);
        if (!iframeSrc) return false;

        const arrivalIata = getPlannerFlightArrivalIata(location, {
            essentialGuide: options.essentialGuide,
        });
        const { width: bannerWidth, height: bannerHeight } = getTripcomFlightAdForModal();

        setModalState({ iframeSrc, arrivalIata, bannerWidth, bannerHeight });
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
                    iframeSrc={modalState.iframeSrc}
                    arrivalIata={modalState.arrivalIata}
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
