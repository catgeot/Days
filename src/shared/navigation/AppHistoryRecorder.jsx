import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordAppHistoryPath } from './appHistoryPathIndex';

export default function AppHistoryRecorder() {
  const location = useLocation();

  useEffect(() => {
    recordAppHistoryPath(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}
