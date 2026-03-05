// src/context/ReportContext.jsx
// 🚨 [Fix/Subtraction] URL 기반 라우팅 전환으로 인한 쓸모없는 상태(currentView, selectedId, preSelectedDate) 대량 학살
// 🚨 [Fix] openReport 시 오직 '세션 팩트 체크'와 '대시보드 강제 라우팅' 역할만 수행

import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../shared/api/supabase'; 

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); 

  const openReport = async () => {
    // 1. [Fact Check] 버튼을 누른 순간의 실제 인증 상태를 직접 확인
    const { data: { session }, error } = await supabase.auth.getSession();

    // 2. [Pessimistic First] 세션이 없다면 안전한 경로로 튕겨냄
    if (!session || error) {
      alert("LogBook은 로그인이 필요한 서비스입니다."); 
      navigate('/auth/login');
      return; 
    }

    // 3. 상태 저장 없이 URL 이동으로 갈음
    navigate('/report');
    setIsOpen(true);
  };

  const closeReport = () => {
    setIsOpen(false);
  };

  return (
    // 🚨 [Fix] 쓸모없는 setter 함수들 모두 Context에서 제거
    <ReportContext.Provider value={{ 
      isOpen, openReport, closeReport 
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => useContext(ReportContext);