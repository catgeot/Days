import { useEffect, useState } from 'react';

const DESKTOP_MQ = '(min-width: 1280px)';

function readDesktopLayout() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(DESKTOP_MQ).matches;
}

export default function useExploreMonthlyPickDesktopLayout() {
  const [desktop, setDesktop] = useState(readDesktopLayout);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return desktop;
}
