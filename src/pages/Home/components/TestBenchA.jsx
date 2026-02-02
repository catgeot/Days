// src/pages/Home/components/TestBenchA.jsx
// 🚨 [New] useSearchEngine 검증을 위한 전용 테스트 벤치
import React, { useState } from 'react';
import { useSearchEngine } from '../hooks/useSearchEngine';

const TestBenchA = () => {
  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();
  const [inputVal, setInputVal] = useState('');

  // 테스트할 케이스들
  const testCases = [
    { label: "다낭 (한글 도시)", val: "다낭" },
    { label: "vietnam (영어 동의어)", val: "vietnam" },
    { label: "파리 (직접 매칭)", val: "파리" },
    { label: "벹남 (오타 테스트)", val: "벹남" }, // 오타 사전이 없으면 실패해야 함
  ];

  const handleManualSearch = () => {
    processSearchKeywords(inputVal);
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl max-w-md mx-auto mt-10 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">🧪 Engine Test Bench</h2>
      
      {/* 입력부 */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:border-cyan-500 outline-none"
          placeholder="검색어 입력..."
        />
        <button 
          onClick={handleManualSearch}
          className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded font-bold transition"
        >
          Scan
        </button>
      </div>

      {/* 퀵 테스트 버튼 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {testCases.map((test) => (
          <button
            key={test.label}
            onClick={() => {
              setInputVal(test.val);
              processSearchKeywords(test.val);
            }}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded border border-gray-500"
          >
            {test.label}
          </button>
        ))}
      </div>

      {/* 결과 출력부 */}
      <div className="bg-black/50 p-4 rounded min-h-[150px]">
        <h3 className="text-sm text-gray-400 mb-2 border-b border-gray-700 pb-1">
            Result Tags ({relatedTags.length})
        </h3>
        
        {isTagLoading ? (
          <div className="text-yellow-400 animate-pulse">⚙️ Analyzing Neural Map...</div>
        ) : relatedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tag, idx) => (
              <span key={idx} className="bg-indigo-900 text-indigo-200 px-2 py-1 rounded text-sm">
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No related tags found.</div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        {/* * "다낭" 입력 시 -> "베트남"(역추적) + "Danang"(영문명)이 나와야 성공 */}
      </p>
    </div>
  );
};

export default TestBenchA;