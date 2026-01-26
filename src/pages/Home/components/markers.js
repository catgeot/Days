// src/pages/Home/components/markers.js

// ✂️ 텍스트 길이 제한 유틸리티
const truncate = (str, length = 8) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '..' : str;
};

// 🎨 마커 디자인 및 HTML 생성 함수
export const getMarkerDesign = (d) => {
  let iconContent = '';
  let scale = '1';
  let offsetY = '-50%'; 
  let zIndex = '10';

  // ---------------------------------------------------------
  // A. Base Layer (The Labels)
  // ---------------------------------------------------------
  
  // 1. Saved Base (유저 저장소 - 영구) - 깔끔한 흰색 점
  if (d.type === 'saved-base') { 
      zIndex = '100';
      iconContent = `
         <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); border: 1px solid #f8fafc; padding: 3px 8px; border-radius: 99px;">
           <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%; box-shadow: 0 0 5px #ffffff;"></div>
           <span style="color: white; font-size: 10px; font-weight: bold; white-space: nowrap;">${truncate(d.name, 10)}</span>
         </div>`;
  }
  // 2. Temp Base (탐색/대화 - 임시) - 밋밋한 회색 점
  else if (d.type === 'temp-base') { 
      zIndex = '50';
      iconContent = `
         <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); backdrop-filter: blur(1px); border: 1px solid #64748b; padding: 2px 6px; border-radius: 99px;">
           <div style="width: 4px; height: 4px; background: #cbd5e1; border-radius: 50%;"></div>
           <span style="color: #cbd5e1; font-size: 9px; white-space: nowrap;">${truncate(d.name, 8)}</span>
         </div>`;
  }
  // 3. Major (지명 아이콘) - 화려함
  else if (d.type === 'major') { 
      let colorClass = '#94a3b8';
      if (d.category === 'paradise') colorClass = '#22d3ee';
      else if (d.category === 'nature') colorClass = '#4ade80';
      else if (d.category === 'urban') colorClass = '#c084fc';
      else if (d.category === 'nearby') colorClass = '#facc15';
      else if (d.category === 'adventure') colorClass = '#f87171';
      
      iconContent = `
         <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.7); backdrop-filter: blur(2px); border: 1px solid ${colorClass}80; padding: 3px 8px; border-radius: 99px;">
           <div style="width: 8px; height: 8px; background: ${colorClass}; border-radius: 50%; box-shadow: 0 0 5px ${colorClass};"></div>
           <span style="color: white; font-size: 10px; font-weight: bold; white-space: nowrap;">${truncate(d.name, 10)}</span>
         </div>`;
  }
  
  // 독립 아이콘 처리 (예외적 상황)
  else if (d.type === 'saved-trip' && !d.isActive && !d.isGhost) {
      iconContent = `<div style="filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));">...</div>`;
  }

  // Active or Ghost Only (독립된 경우)
  if ((d.type === 'active' || d.type === 'ghost') && iconContent === '') {
      offsetY = '-100%';
      iconContent = `<div style="width:1px; height:1px;"></div>`; 
  }

  // ---------------------------------------------------------
  // B. Overlay Layer (Pins & Badges)
  // ---------------------------------------------------------
  let overlay = '';
  
  // 1. Active Pin
  if (d.isActive) {
      zIndex = '999'; 
      overlay += `
          <div style="position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); animation: pinBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
              </svg>
              <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #7f1d1d;"></div>
          </div>
      `;
  }
  // 2. Ghost Pin
  else if (d.isGhost) {
      zIndex = '900'; 
      overlay += `
          <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; opacity: 0.85; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
              </svg>
          </div>
      `;
  }

  // 3. Status Badge (Major & Saved-Base & Temp-Base에 붙는 배지)
  // 🚨 [Fix] Temp-Base(흐릿한 점) 위에도 배지가 달릴 수 있게 조건 추가
  if (d.type === 'major' || d.type === 'saved-base' || d.type === 'temp-base') {
      if (d.isBookmarked) {
          overlay += `
              <div style="position: absolute; bottom: 18px; right: -10px; width: 18px; height: 18px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); animation: popIn 0.3s ease-out;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
              </div>`;
      } else if (d.hasChat) {
          overlay += `
              <div style="position: absolute; bottom: 18px; right: -10px; width: 18px; height: 18px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); animation: popIn 0.3s ease-out;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
              </div>`;
      }
  }

  const html = `
    <div style="position: absolute; transform: translate(-50%, ${offsetY}); cursor: pointer; transition: transform 0.2s ease;">
      ${overlay}
      <div style="transform: scale(${scale});">${iconContent}</div>
    </div>
    <style>
      @keyframes pinBounce {
        0% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
        60% { transform: translateX(-50%) translateY(10px); opacity: 1; }
        80% { transform: translateX(-50%) translateY(-5px); }
        100% { transform: translateX(-50%) translateY(0); }
      }
      @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
      }
    </style>
  `;

  return { html, zIndex, offsetY };
};