import { useCallback, useEffect, useState } from 'react';
import {
  TRAVEL_AGENCY_VISITS_EVENT,
  clearTravelAgencyVisits,
  loadTravelAgencyVisits,
  removeTravelAgencyVisit,
} from '../utils/travelAgencyVisits.js';

export function useTravelAgencyVisits() {
  const [visits, setVisits] = useState(() => loadTravelAgencyVisits());

  const refresh = useCallback(() => {
    setVisits(loadTravelAgencyVisits());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(TRAVEL_AGENCY_VISITS_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(TRAVEL_AGENCY_VISITS_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const removeVisit = useCallback((agencyId) => {
    setVisits(removeTravelAgencyVisit(agencyId));
  }, []);

  const clearVisits = useCallback(() => {
    setVisits(clearTravelAgencyVisits());
  }, []);

  return { visits, refresh, removeVisit, clearVisits };
}
