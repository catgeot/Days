import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../shared/api/supabase'; 

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); 

  const openReport = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (!session || error) {
      alert("LogBook은 로그인이 필요한 서비스입니다."); 
      navigate('/auth/login');
      return; 
    }

    navigate('/blog');
    setIsOpen(true);
  };

  const closeReport = () => {
    setIsOpen(false);
  };

  return (
    <ReportContext.Provider value={{ 
      isOpen, openReport, closeReport 
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => useContext(ReportContext);
