import { useState, useEffect } from 'react';

const MD_MQL = '(min-width: 768px)';

export function useMdUpViewport() {
  const [isMdUp, setIsMdUp] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return window.matchMedia(MD_MQL).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(MD_MQL);
    const onChange = () => setIsMdUp(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMdUp;
}
