import { useState, useCallback } from 'react';

export const useGlobeLogic = (globeRef) => {
  const [scoutedPins, setScoutedPins] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const moveToLocation = useCallback((lat, lng, name, category = 'scout') => {
    if (globeRef.current) {
      globeRef.current.flyToAndPin(lat, lng, name, category);
    }
  }, [globeRef]);

  const addScoutPin = useCallback((pin) => {
    setScoutedPins(prev => {
      const filtered = prev.filter(p => p.id !== pin.id && p.name !== pin.name);
      return [pin, ...filtered].slice(0, 5);
    });
    setSelectedLocation(pin);
  }, []);

  const clearScouts = useCallback(() => {
    setScoutedPins([]);
    setSelectedLocation(null);
    if (globeRef.current) globeRef.current.resetPins();
  }, [globeRef]);

  return {
    scoutedPins,
    setScoutedPins,
    selectedLocation,
    setSelectedLocation,
    moveToLocation,
    addScoutPin,
    clearScouts
  };
};