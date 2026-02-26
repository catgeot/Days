// 🚨 [Fix/Update] 지루한 호구조사 폼 삭제 ➡️ 3단계 '여행 MBTI 심리테스트' UI로 전면 개편
// 🚨 [Fix/Subtraction] 질문의 개수를 4개에서 3개로 줄여 유저 이탈률(피로도) 최소화

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Map, Users, Compass, Calendar, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../shared/api/supabase';
import useTravelStore from './store';

// 🚨 [Fix/Update] MBTI 기반 핵심 3문항으로 교체
const INTERVIEW_STEPS = [
  {
    id: 'energy', // E vs I (휴양 vs 액티비티)
    title: '드디어 도착한 여행지!\n호텔 문을 열고 들어간 당신의 첫 행동은?',
    subtitle: '당신의 여행 에너지 충전 방식을 알아봅니다.',
    icon: <Map className="text-blue-400 mb-4 mx-auto" size={36} />,
    options: [
      { label: '하아~ 살 것 같다! 푹신한 침대에 다이빙 🛌', value: 'introvert' },
      { label: '짐만 던져두고, 당장 밖으로 나가서 동네 탐험! 🏃‍♂️', value: 'extrovert' }
    ]
  },
  {
    id: 'destination_style', // S vs N (유명 명소 vs 로컬/숨겨진 곳)
    title: '둘째 날 아침,\n오늘 하루의 메인 스케줄을 고른다면?',
    subtitle: '선호하는 여행지의 분위기를 파악합니다.',
    icon: <Compass className="text-purple-400 mb-4 mx-auto" size={36} />,
    options: [
      { label: '남들 다 가는 핫플은 이유가 있지! 랜드마크 인증샷 📸', value: 'landmark' },
      { label: '지도 앱은 꺼두기. 발길 닿는 대로 로컬 골목길 🧭', value: 'local' }
    ]
  },
  {
    id: 'planning', // J vs P (촘촘한 일정 vs 여유로운 일정)
    title: '맙소사, 꼭 가고 싶었던 맛집이\n오늘 휴무라네요. 당신의 반응은?',
    subtitle: '여행의 일정표(달력) 밀도를 결정합니다.',
    icon: <Calendar className="text-orange-400 mb-4 mx-auto" size={36} />,
    options: [
      { label: '당황하지 마. 이럴 줄 알고 플랜 B, C까지 다 있지 📊', value: 'planner' },
      { label: '오히려 좋아! 아까 본 예쁜 테라스 카페나 가보자 🍻', value: 'spontaneous' }
    ]
  }
];

const TravelPlanPanel = ({ 
  location, 
  onClose, 
  isFullScreen,
  onPlanUpdate 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const setDestination = useTravelStore((state) => state.setDestination);
  const isCompleted = currentStep >= INTERVIEW_STEPS.length;
  const currentQuestion = INTERVIEW_STEPS[currentStep];

  const handleSelectOption = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    setDestination((prevDestination) => ({
      ...prevDestination, 
      [questionId]: value 
    }));
    
    if (onPlanUpdate) {
        onPlanUpdate({ step: currentStep + 1, answers: newAnswers });
    }

    setTimeout(() => {
        setCurrentStep(prev => prev + 1);
    }, 300); 
  };

  const handleSaveToDB = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('travel_plans')
        .insert([{
          user_id: 'sandbox-test-user-001', 
          place_id: location.name, 
          title: `${location.name} 맞춤형 여행 스케치`,
          schedule_data: answers 
        }]);

      if (error) throw error;
      setMessage({ type: 'success', text: '취향 정보가 안전하게 저장되었습니다. 우측 패널에서 세부 일정을 짜보세요!' });
    } catch (error) {
      console.error('🚨 [DB Save Error]:', error);
      setMessage({ type: 'error', text: `저장 실패: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 md:translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
        absolute top-0 left-0 w-full z-[150] h-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-4 border-none rounded-none
        md:relative md:w-[35%] md:h-full md:backdrop-blur-xl md:border md:border-white/10 md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:bg-[#05070a]/90 md:pb-0 md:z-auto`}> 
      
      {/* 🛡️ Header */}
      <div className="h-16 md:h-20 shrink-0 flex items-center px-4 md:px-6 md:border-b md:border-white/5 bg-transparent z-20 mt-2 md:mt-0">
         <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 shadow-lg mr-4">
             <ArrowLeft size={16} />
         </button>
         
         {/* 🚨 [Fix/Update] 우리가 정한 강력한 카피라이팅 적용! */}
         <div className="flex flex-col min-w-0">
             <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">{location.name || '라루통가'} 맞춤형 분석</span>
             <h1 className="text-xl font-bold text-white truncate leading-none">당신의 여행 MBTI는? 👀</h1>
         </div>
      </div>

      {/* 🚀 Body */}
      <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-8 relative">
        {!isCompleted ? (
            <div className="animate-fade-in flex flex-col h-full justify-center">
                <div className="text-center mb-8">
                    {currentQuestion.icon}
                    <div className="text-xs font-bold text-gray-500 mb-2 tracking-widest uppercase">
                        Question {currentStep + 1} of {INTERVIEW_STEPS.length}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 leading-tight whitespace-pre-line">
                        {currentQuestion.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {currentQuestion.subtitle}
                    </p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectOption(currentQuestion.id, option.value)}
                            className="w-full text-left px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500 hover:scale-[1.02] transition-all text-white font-medium shadow-lg"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-10 overflow-hidden">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-500" 
                        style={{ width: `${((currentStep) / INTERVIEW_STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        ) : (
            <div className="animate-fade-in flex flex-col h-full justify-center items-center text-center">
                <CheckCircle className="text-green-400 mb-6" size={48} />
                <h2 className="text-2xl font-bold text-white mb-2">여행 자아 분석 완료! 🎉</h2>
                <p className="text-sm text-gray-400 mb-8">
                    수집된 정보를 바탕으로 우측 화면에<br/>당신만을 위한 맞춤형 일정을 준비했습니다.
                </p>

                {message ? (
                     <div className={`p-4 rounded-xl text-sm font-medium w-full mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {message.text}
                    </div>
                ) : (
                    <button 
                        onClick={handleSaveToDB}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-900/50 flex justify-center items-center gap-2 transition-all"
                    >
                        {isSubmitting ? '데이터 동기화 중...' : <><Save size={18} /> 추천 데이터 저장하기</>}
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default TravelPlanPanel;