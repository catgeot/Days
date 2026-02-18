// 🚨 [Fix/New] openReport 호출 시 유저 세션 검증(Fact Check) 로직 추가 및 비로그인 접근 차단 (Pessimistic First)
// 기존 달력 선택 날짜 전달 파이프(preSelectedDate) 등 모든 기존 상태와 로직은 100% 보존됨.

import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🚨 [New] 리다이렉트를 위한 훅 추가
import { supabase } from '../shared/api/supabase'; // 🚨 [New] 실제 세션 검증을 위한 Supabase 연결

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [selectedId, setSelectedId] = useState(null);
  
  // ✨ [Keep] 달력 날짜 전달용 파이프 (기존 로직 보존)
  const [preSelectedDate, setPreSelectedDate] = useState(null); 

  const navigate = useNavigate(); // 🚨 [New] 네비게이션 인스턴스 생성

  // 🚨 [Fix] 비동기(async) 함수로 변경하여 호출 순간의 확실한 세션 상태(Fact)를 검증
  const openReport = async (view = 'dashboard', id = null) => {
    // 1. [Fact Check] 버튼을 누른 순간의 실제 인증 상태를 Supabase에서 직접 확인
    const { data: { session }, error } = await supabase.auth.getSession();

    // 2. [Pessimistic First] 세션이 없다면(로그아웃 상태) 경고 후 안전한 경로로 튕겨냄 (뺄셈의 미학)
    if (!session || error) {
      alert("LogBook은 로그인이 필요한 서비스입니다."); 
      navigate('/auth/login');
      return; // 🚨 여기서 함수 실행을 강제 종료하여 패널이 열리지(isOpen=true) 않도록 원천 차단
    }

    // 3. 세션이 존재할 때만 정상적으로 상태 업데이트 및 패널 오픈
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