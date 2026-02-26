// 🚨 [Fix/Update] 에디터의 강제 줄바꿈(Prettier) 에러를 원천 차단하기 위해 모든 긴 클래스명에 백틱(Template Literal) 적용

import React from 'react';
import PlaceGalleryView from '../PlaceCard/views/PlaceGalleryView';
import YouTubePlayerView from '../PlaceCard/views/YouTubePlayerView';
import { 
  Calendar, Plane, Hotel, MapPin, Sparkles, 
  Image as ImageIcon, Video, Compass, Zap 
} from 'lucide-react'; 

const PlaceMediaPanel = ({ 
  galleryData, isFullScreen, toggleFullScreen, showUI, mediaMode, 
  videoId, videos, onVideoSelect, playerRef, onAiModeChange, planContext 
}) => {
  
  const currentStep = planContext ? Object.keys(planContext.answers).length : 0;
  const isPlanCompleted = currentStep >= 3;

  if (isPlanCompleted) {
      const { answers } = planContext;
      
      const getPersonaTitle = () => {
          if (answers.energy === 'introvert' && answers.planning === 'spontaneous') return "완벽한 로그아웃, 즉흥 낭만가";
          if (answers.energy === 'extrovert' && answers.planning === 'planner') return "도파민 중독, 엑셀 마스터 탐험가";
          if (answers.destination_style === 'local') return "지도 밖을 걷는 로컬 탐험가";
          return "균형 잡힌 스마트 여행자";
      };
      
      return (
          <div className={`
              w-full h-full bg-[#0a0f16] rounded-[2rem] border border-white/10 
              p-8 flex flex-col text-white overflow-y-auto custom-scrollbar 
              animate-fade-in shadow-2xl relative
          `}>
              <div className="mb-8 border-b border-white/10 pb-6">
                  <span className={`
                      px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-bold 
                      rounded-full border border-blue-500/30 uppercase 
                      tracking-widest flex items-center w-fit gap-2
                  `}>
                      <Sparkles size={12} /> Travel Persona Analyzed
                  </span>
                  <h2 className="text-3xl font-bold mt-4 leading-tight">
                      당신의 여행 자아는 <br/>
                      <span className={`
                          text-transparent bg-clip-text bg-gradient-to-r 
                          from-blue-400 to-purple-400
                      `}>
                          [{getPersonaTitle()}]
                      </span>
                  </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 요약 카드 */}
                  <div className={`
                      col-span-1 md:col-span-2 bg-white/5 p-6 rounded-2xl 
                      border border-white/5 flex items-center gap-6
                  `}>
                      <div className={`
                          w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 
                          to-purple-600 flex items-center justify-center 
                          shrink-0 shadow-lg
                      `}>
                          <MapPin size={28} className="text-white" />
                      </div>
                      <div>
                          <p className="text-sm text-gray-400 mb-1">AI 맞춤형 라루통가 테마</p>
                          <p className="text-lg font-bold">
                              {answers.energy === 'introvert' ? '방전형 힐링' : '충전형 액티비티'} • 
                              {answers.destination_style === 'landmark' ? ' 랜드마크 인증' : ' 숨겨진 로컬 스팟'} • 
                              {answers.planning === 'planner' ? ' J형 완벽 계획' : ' P형 즉흥 일정'}
                          </p>
                      </div>
                  </div>

                  {/* 항공권 목업 */}
                  <div className={`
                      bg-gradient-to-br from-blue-900/40 to-black/40 p-6 
                      rounded-2xl border border-blue-500/20 relative 
                      overflow-hidden group
                  `}>
                      <Plane className={`
                          absolute -right-4 -bottom-4 text-blue-500/10 
                          group-hover:scale-110 transition-transform
                      `} size={120} />
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Plane size={18} className="text-blue-400"/> 최적의 항공권
                      </h3>
                      <div className="space-y-3 relative z-10">
                          <div className={`
                              flex justify-between items-center text-sm 
                              border-b border-white/10 pb-2
                          `}>
                              <span className="text-gray-400">ICN (인천)</span>
                              <Plane size={14} className="text-gray-600" />
                              <span className="text-gray-400">RAR (라루통가)</span>
                          </div>
                          <button className={`
                              w-full py-2 bg-blue-600 hover:bg-blue-500 
                              rounded-lg text-sm font-bold mt-2 transition-colors
                          `}>
                              스카이스캐너 실시간 조회
                          </button>
                      </div>
                  </div>

                  {/* 숙박 목업 */}
                  <div className={`
                      bg-gradient-to-br from-purple-900/40 to-black/40 p-6 
                      rounded-2xl border border-purple-500/20 relative 
                      overflow-hidden group
                  `}>
                      <Hotel className={`
                          absolute -right-4 -bottom-4 text-purple-500/10 
                          group-hover:scale-110 transition-transform
                      `} size={120} />
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Hotel size={18} className="text-purple-400"/> 추천 숙소
                      </h3>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                          {answers.energy === 'introvert' 
                            ? '아무것도 안 해도 완벽한 오션뷰 럭셔리 풀빌라를 추천합니다.' 
                            : '관광지 이동이 편리하고 가성비 좋은 시내 거점 숙소를 추천합니다.'}
                      </p>
                      <button className={`
                          w-full py-2 bg-purple-600 hover:bg-purple-500 
                          rounded-lg text-sm font-bold transition-colors
                      `}>
                          아고다 시크릿 특가 보기
                      </button>
                  </div>

                  {/* 달력/타임라인 목업 */}
                  <div className={`
                      col-span-1 md:col-span-2 bg-white/5 p-6 rounded-2xl 
                      border border-white/5
                  `}>
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                          <Calendar size={18} className="text-orange-400"/> 
                          {answers.planning === 'planner' ? '분 단위 타임라인 (Day 1)' : '여유로운 가이드라인 (Day 1)'}
                      </h3>
                      
                      <div className={`
                          space-y-6 relative before:absolute before:inset-0 
                          before:ml-2 before:-translate-x-px md:before:mx-auto 
                          md:before:translate-x-0 before:h-full before:w-0.5 
                          before:bg-gradient-to-b before:from-transparent 
                          before:via-white/10 before:to-transparent
                      `}>
                          
                          <div className={`
                              relative flex items-center justify-between 
                              md:justify-normal md:odd:flex-row-reverse group is-active
                          `}>
                              <div className={`
                                  flex items-center justify-center w-5 h-5 rounded-full 
                                  border-2 border-[#0a0f16] bg-orange-400 text-slate-500 
                                  shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 
                                  md:group-even:translate-x-1/2 z-10
                              `} />
                              <div className={`
                                  w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 
                                  rounded-xl border border-white/10 bg-black/50 shadow-lg
                              `}>
                                  <div className="flex items-center justify-between mb-1">
                                      <div className="font-bold text-blue-400">오후 2:00</div>
                                  </div>
                                  <div className="text-white font-medium mb-1">공항 도착 및 숙소 이동</div>
                                  <div className="text-sm text-gray-400">야자수 바람을 맞으며 라루통가 입성</div>
                              </div>
                          </div>

                          <div className={`
                              relative flex items-center justify-between 
                              md:justify-normal md:odd:flex-row-reverse group is-active
                          `}>
                              <div className={`
                                  flex items-center justify-center w-5 h-5 rounded-full 
                                  border-2 border-[#0a0f16] bg-blue-400 text-slate-500 
                                  shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 
                                  md:group-even:translate-x-1/2 z-10
                              `} />
                              <div className={`
                                  w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 
                                  rounded-xl border border-white/10 bg-black/50 shadow-lg
                              `}>
                                  <div className="flex items-center justify-between mb-1">
                                      <div className="font-bold text-purple-400">
                                          {answers.planning === 'planner' ? '오후 5:30' : '해질녘 즈음'}
                                      </div>
                                  </div>
                                  <div className="text-white font-medium mb-1">
                                      {answers.destination_style === 'landmark' ? '라루통가 라군 선셋 뷰포인트' : '해변가 이름 없는 로컬 펍'}
                                  </div>
                                  <div className="text-sm text-gray-400">완벽한 첫날의 마무리</div>
                              </div>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const renderVisualHints = () => {
    if (currentStep >= 3) return null;

    const hints = [
      {
        step: 0,
        title: "지금 당신에게 필요한 휴식의 형태는?",
        left: { icon: <ImageIcon size={24}/>, label: "완벽한 로그아웃 🛌", desc: "고요한 오션뷰 호캉스" },
        right: { icon: <Video size={24}/>, label: "심장이 뛰는 액티비티 🏃‍♂️", desc: "투명한 바다 위 패들보드" }
      },
      {
        step: 1,
        title: "어떤 풍경 속에 머물고 싶나요?",
        left: { icon: <Compass size={24}/>, label: "반드시 가봐야 할 핫플 📸", desc: "인생샷을 보장하는 명소" },
        right: { icon: <Zap size={24}/>, label: "숨겨진 로컬 스팟 🗺️", desc: "지도에 없는 한적한 해변" }
      },
      {
        step: 2,
        title: "여행을 즐기는 당신의 방식은?",
        left: { icon: <Calendar size={24}/>, label: "시간 낭비 없는 계획 📊", desc: "분 단위의 효율적인 동선" },
        right: { icon: <Sparkles size={24}/>, label: "발길 닿는 대로 즉흥적 🍻", desc: "우연히 마주친 로컬 카페" }
      }
    ];

    const currentHint = hints[currentStep];

    return (
      <div className={`
          absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col 
          items-center justify-center p-8 animate-fade-in rounded-[2rem] 
          border border-white/10
      `}>
        <h3 className="text-2xl font-bold text-white mb-10 text-center animate-pulse">
            {currentHint.title}
        </h3>
        
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl h-3/5">
            <div className={`
                flex-1 rounded-2xl bg-gradient-to-br from-blue-900/50 to-black/50 
                border border-blue-500/30 flex flex-col items-center justify-center 
                text-center p-6 shadow-2xl transition-all hover:scale-[1.02]
            `}>
                <div className={`
                    w-16 h-16 rounded-full bg-blue-500/20 flex items-center 
                    justify-center mb-6 text-blue-400
                `}>
                    {currentHint.left.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{currentHint.left.label}</h4>
                <p className="text-sm text-gray-400">{currentHint.left.desc}</p>
            </div>

            <div className={`
                hidden md:flex items-center justify-center font-bold 
                text-gray-500 text-xl italic
            `}>
                VS
            </div>

            <div className={`
                flex-1 rounded-2xl bg-gradient-to-br from-purple-900/50 to-black/50 
                border border-purple-500/30 flex flex-col items-center justify-center 
                text-center p-6 shadow-2xl transition-all hover:scale-[1.02]
            `}>
                <div className={`
                    w-16 h-16 rounded-full bg-purple-500/20 flex items-center 
                    justify-center mb-6 text-purple-400
                `}>
                    {currentHint.right.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{currentHint.right.label}</h4>
                <p className="text-sm text-gray-400">{currentHint.right.desc}</p>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            {mediaMode === 'GALLERY' ? (
                <PlaceGalleryView 
                    images={galleryData.images}
                    isImgLoading={galleryData.isImgLoading}
                    selectedImg={galleryData.selectedImg}
                    setSelectedImg={galleryData.setSelectedImg}
                    isFullScreen={isFullScreen}
                    toggleFullScreen={toggleFullScreen}
                    showUI={false} 
                />
            ) : (
                <YouTubePlayerView 
                    ref={playerRef}
                    videos={videos}
                    videoId={videoId} 
                    isFullScreen={isFullScreen}
                    toggleFullScreen={toggleFullScreen}
                    showUI={false}
                />
            )}
        </div>

        {!isPlanCompleted && renderVisualHints()}
    </div>
  );
};

export default PlaceMediaPanel;