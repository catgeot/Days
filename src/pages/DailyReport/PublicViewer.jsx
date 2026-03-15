import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { MapPin, Home, Compass } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const PublicViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchPublicReport = async () => {
      if (!id) {
        navigate('/', { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .neq('is_deleted', true)
        .single();

      if (error || !data) {
        console.warn("[Safe Path] 비공개되었거나 존재하지 않는 기록 접근 차단");
        setErrorMsg("비공개되었거나 존재하지 않는 기록입니다.");
      } else {
        setReport(data);
      }
    };
    fetchPublicReport();
  }, [id, navigate]);

  const renderBlogContent = (content, images) => {
    if (!content) return null;
    const regex = /(\[사진\s*\d+\])/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      const match = part.match(/\[사진\s*(\d+)\]/);
      if (match) {
        const imgIndex = parseInt(match[1], 10) - 1;
        if (images[imgIndex]) {
          return (
            <div key={index} className="my-10 group relative rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <img src={images[imgIndex]} alt={`첨부 ${imgIndex + 1}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          );
        }
        return null; 
      }
      if (part.trim() !== '') {
        return <p key={index} className="text-lg leading-[1.8] text-gray-800 whitespace-pre-wrap font-medium mb-6">{part}</p>;
      }
      return null;
    });
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center text-gray-500">
        <Compass size={48} className="mb-4 text-gray-400" />
        <p className="text-xl font-bold mb-6 text-gray-800">{errorMsg}</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 bg-blue-50 px-6 py-2 rounded-full">
          <Home size={16} /> 처음으로 가기
        </button>
      </div>
    );
  }

  if (!report) return <div className="min-h-screen bg-white flex justify-center items-center text-gray-400 animate-pulse">기억의 파편을 불러오는 중...</div>;

  const images = report.images || [];
  const heroImageUrl = images[0] || null;
  const hasPlaceholders = /\[사진\s*\d+\]/.test(report.content); 

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden pb-20 font-sans">
      {heroImageUrl && (
        <div className="absolute inset-0 z-0 opacity-10 transition-opacity duration-700 pointer-events-none">
          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto pt-12 px-4 sm:px-6">
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 p-6 sm:p-10 rounded-3xl shadow-sm mt-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-wider">{report.date}</span>
            <span className="text-gray-500 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-gray-400"/> {report.location}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-10 tracking-tight leading-tight">{report.title}</h1>

          {!hasPlaceholders && images.length > 0 && (
            <div className={`mb-10 grid gap-3 rounded-2xl overflow-hidden ${images.length === 1 ? 'grid-cols-1' : ''} ${images.length === 2 ? 'grid-cols-2' : ''} ${images.length === 3 ? 'grid-cols-3' : ''} ${images.length >= 4 ? 'grid-cols-2' : ''}`}>
              {images.map((img, idx) => (
                <div key={idx} className={`relative group ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                  <img src={img} alt={`첨부 ${idx+1}`} className="w-full h-full object-cover border border-gray-200" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            {hasPlaceholders ? renderBlogContent(report.content, images) : (
              <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap font-medium">{report.content}</div>
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm mb-4">이 멋진 기록은 GATEO의 LogBook을 통해 작성되었습니다.</p>
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-6 py-2.5 rounded-full border border-gray-200">
              <Compass size={16} /> 지구본에서 더 많은 곳 탐색하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicViewer;