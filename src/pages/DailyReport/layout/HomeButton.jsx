// 🚨 [Fix] 라우터 이동(Link)을 덜어내고, 전역 패널 닫기 스위치(closeReport)로 교체
import React from 'react';
import { Globe } from 'lucide-react';

// 🚨 [New] 전역 리모컨 호출
import { useReport } from '../../../../src/context/ReportContext';

const HomeButton = () => {
  const { closeReport } = useReport();

  return (
    <div className="px-6 pt-5 pb-0 flex justify-between items-center">
      <button 
        onClick={closeReport} 
        className="text-gray-500 hover:text-blue-400 transition-colors p-2 -ml-2 hover:bg-gray-800/50 rounded-full group" 
        title="Go Home (Close Logbook)"
      >
        <Globe size={20} className="group-hover:rotate-180 transition-transform duration-700 ease-in-out"/>
      </button>
    </div>
  );
};

export default HomeButton;