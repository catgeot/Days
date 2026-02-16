// 🚨 [Fix/New] 달력에서 선택한 날짜를 Write 뷰로 전달하기 위한 preSelectedDate 상태 추가

import React, { createContext, useContext, useState } from 'react';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [selectedId, setSelectedId] = useState(null);
  
  // ✨ [New] 달력 날짜 전달용 파이프
  const [preSelectedDate, setPreSelectedDate] = useState(null); 

  const openReport = (view = 'dashboard', id = null) => {
    setCurrentView(view);
    setSelectedId(id);
    setIsOpen(true);
  };

  const closeReport = () => {
    setIsOpen(false);
    setPreSelectedDate(null); // 닫을 때 찌꺼기 데이터 초기화
  };

  return (
    <ReportContext.Provider value={{ 
      isOpen, currentView, selectedId, preSelectedDate,
      openReport, closeReport, setCurrentView, setSelectedId, setPreSelectedDate 
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => useContext(ReportContext);