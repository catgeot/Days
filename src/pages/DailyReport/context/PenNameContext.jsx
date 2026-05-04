import React, { createContext, useContext } from 'react';
import { usePenName } from '../hooks/usePenName';

const PenNameContext = createContext(null);

/**
 * /blog 하위에서 필명( profiles.display_name ) 상태를 한 곳에서만 씁니다.
 * 사이드바·글쓰기 화면 입력이 실시간으로 동기화됩니다.
 */
export function PenNameProvider({ user, children }) {
  const pen = usePenName(user);
  return (
    <PenNameContext.Provider value={{ ...pen, user }}>
      {children}
    </PenNameContext.Provider>
  );
}

export function usePenNameContext() {
  const ctx = useContext(PenNameContext);
  if (!ctx) {
    throw new Error('usePenNameContext must be used within PenNameProvider');
  }
  return ctx;
}
