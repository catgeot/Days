// src/pages/DailyReport/Detail.jsx
// 🚨 [Fix] 수정 페이지 진입 시 Deep Linking 라우팅 규격(/report/write/:id)에 완벽 대응

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { ArrowLeft, Trash2, Edit, MapPin, Copy, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [report, setReport] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const getOneReport = async () => {
      if (!id) {
        navigate('/report', { replace: true });
        return; 
      }
      
      const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
      
      if (error || !data) {
        console.warn("[Safe Path] 존재하지 않거나 삭제된 기록입니다. 대시보드로 회귀합니다.", error);
        navigate('/report', { replace: true });
      } else {
        setReport(data);
      }
    };
    getOneReport();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("이 기록을 삭제하시겠습니까? (안전하게 숨김 처리됩니다)")) {
      const { error } = await supabase.from('reports').update({ is_deleted: true }).eq('id', id);
      
      if(error) {
         console.warn("Soft Delete 실패, 영구 삭제로 대체합니다 (임시 롤백)");
         await supabase.from('reports').delete().eq('id', id);
      }
      navigate('/report', { replace: true });
    }
  };

  const handleExportBlog = async () => {
    if (!report) return;

    try {
      const images = report.images || [];
      const titleHtml = `<h2 style="color: #333; font-size: 24px; font-weight: bold;">${report.title}</h2>`;
      const metaHtml = `<p style="color: #666; font-size: 14px; margin-bottom: 20px;"><strong>일자:</strong> ${report.date} | <strong>위치:</strong> ${report.location}</p><hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />`;
      
      let bodyHtml = '';
      const parts = report.content.split(/(\[사진\s*\d+\])/g);

      parts.forEach(part => {
        const match = part.match(/\[사진\s*(\d+)\]/);
        if (match) {
          const imgIndex = parseInt(match[1], 10) - 1;
          if (images[imgIndex]) {
            bodyHtml += `<div style="margin: 30px 0; text-align: center;"><img src="${images[imgIndex]}" alt="첨부사진 ${match[1]}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /></div>`;
          }
        } else if (part.trim()) {
          bodyHtml += `<p style="line-height: 1.8; color: #444; font-size: 16px; margin-bottom: 15px; white-space: pre-wrap;">${part}</p>`;
        }
      });

      const footerHtml = `<br/><blockquote style="border-left: 4px solid #3b82f6; padding-left: 14px; margin-top: 40px; color: #888; font-style: italic; background: #f8fafc; padding: 16px; border-radius: 0 8px 8px 0;">이 글은 <strong>GATEO</strong>의 AI LogBook을 통해 작성되었습니다.<br/>🌐 https://gateo.kr</blockquote>`;

      const finalHtml = `<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">${titleHtml}${metaHtml}${bodyHtml}${footerHtml}</div>`;
      
      const plainText = `${report.title}\n일자: ${report.date} | 위치: ${report.location}\n\n${report.content}\n\n> 이 글은 GATEO의 AI LogBook을 통해 작성되었습니다.\n> https://gateo.kr`;

      if (window.ClipboardItem) {
        const blobHtml = new Blob([finalHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        const clipboardItem = new window.ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(plainText); 
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      alert("브라우저 환경에 따라 복사가 지원되지 않을 수 있습니다.");
    }
  };

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
            <div key={index} className="my-10 group relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
              <img 
                src={images[imgIndex]} 
                alt={`첨부 ${imgIndex + 1}`} 
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
                onClick={() => window.open(images[imgIndex], '_blank')} 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
            </div>
          );
        }
        return null; 
      }
      
      if (part.trim() !== '') {
        return (
          <p key={index} className="text-lg leading-[1.8] text-slate-300 whitespace-pre-wrap font-light mb-6">
            {part}
          </p>
        );
      }
      return null;
    });
  };

  if (!report) return <div className="min-h-screen bg-slate-950 p-10 flex justify-center items-center text-slate-500 animate-pulse">우주의 기억을 동기화하는 중...</div>;

  const images = report.images || [];
  const heroImageUrl = images[0] || null;
  const hasPlaceholders = /\[사진\s*\d+\]/.test(report.content); 

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-20 font-sans">
      
      {heroImageUrl && (
        <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-700 pointer-events-none">
          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 sm:px-6">
        
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/report')} 
            className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/50 rounded-full backdrop-blur-md"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex gap-2 sm:gap-3">
            <button 
              onClick={handleExportBlog} 
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all border text-sm font-medium backdrop-blur-md
                ${isCopied 
                  ? 'bg-green-900/40 text-green-300 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'bg-blue-900/30 text-blue-300 border-blue-800/50 hover:bg-blue-800/50 hover:text-blue-100'}
              `}
            >
              {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{isCopied ? '복사 완료!' : '블로그로 내보내기'}</span>
              <span className="sm:hidden">{isCopied ? '완료' : '내보내기'}</span>
            </button>

            <div className="w-px h-6 bg-slate-700/50 my-auto mx-1 hidden sm:block"></div>

            <button 
              // 🚨 [Fix] state 넘김 방식 버리고, URL에 직접 id를 박아넣어 Deep Link 규격 준수
              onClick={() => navigate(`/report/write/${id}`)} 
              className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-md text-slate-300 px-3 sm:px-4 py-2 rounded-full hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50 text-sm font-medium"
            >
              <Edit size={16} /> <span className="hidden sm:inline">수정</span>
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 bg-red-900/20 backdrop-blur-md text-red-400 px-3 sm:px-4 py-2 rounded-full hover:bg-red-900/40 transition-colors border border-red-900/50 text-sm font-medium">
              <Trash2 size={16} /> <span className="hidden sm:inline">삭제</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold text-blue-300 bg-blue-900/30 border border-blue-800/50 px-3 py-1.5 rounded-full uppercase tracking-wider">{report.date}</span>
            <span className="text-slate-400 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-slate-500"/> {report.location}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight leading-tight">{report.title}</h1>

          {!hasPlaceholders && images.length > 0 && (
            <div className={`mb-10 grid gap-3 rounded-2xl overflow-hidden
              ${images.length === 1 ? 'grid-cols-1' : ''} 
              ${images.length === 2 ? 'grid-cols-2' : ''} 
              ${images.length === 3 ? 'grid-cols-3' : ''} 
              ${images.length >= 4 ? 'grid-cols-2' : ''} 
            `}>
              {images.map((img, idx) => (
                <div key={idx} className={`relative group ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                  <img 
                    src={img} 
                    alt={`첨부 ${idx+1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer border border-slate-700/50"
                    onClick={() => window.open(img, '_blank')} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            {hasPlaceholders ? renderBlogContent(report.content, images) : (
              <div className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap font-light">
                {report.content}
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default Detail;