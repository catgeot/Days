import React from 'react';
import { useReport } from '../../../../src/context/ReportContext';

import Dashboard from '../../DailyReport/Dashboard';
import Write from '../../DailyReport/Write';
import Detail from '../../DailyReport/Detail';
import DailyLayout from '../../DailyReport/layout/DailyLayout'; 

const ReportPanel = () => {
  const { isOpen, currentView } = useReport();

  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full bg-black z-[200] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <DailyLayout>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'write' && <Write />}
        {currentView === 'detail' && <Detail />}
      </DailyLayout>
    </div>
  );
};

export default ReportPanel;