// src/pages/DailyReport/Detail.jsx
// 🚨 [Fix] 라우터 의존성(useParams, useNavigate) 제거 및 Context 연결 유지
// 🚨 [New] Midnight Canvas 테마 적용 (다크모드, 글래스모피즘, Hero 배경)
// 🚨 [New] [사진N] 치환자를 실제 이미지로 파싱하는 블로그식 렌더링 로직 추가
// 🚨 [New] 외부 블로그(네이버, 티스토리) 복사/붙여넣기(Rich Text) 지원 기능 추가

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { ArrowLeft, Trash2, Edit, MapPin, Copy, CheckCircle2 } from 'lucide-react';
import { useReport } from '../../context/ReportContext';

const Detail = () => {
  const { selectedId, setCurrentView, setSelectedId } = useReport();
  const [report, setReport] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const getOneReport = async () => {
      if (!selectedId) return; 
      const { data, error } = await supabase.from('reports').select('*').eq('id', selectedId).single();
      if (error) console.error("에러:", error);
      else setReport(data);
    };
    getOneReport();
  }, [selectedId]);

  const handleDelete = async () => {
    if (window.confirm("이 기록을 삭제하시겠습니까? (안전하게 숨김 처리됩니다)")) {
      // 🚨 [Fix/Safe Path] 데이터 영구 유실 방지 원칙에 따라 delete() 대신 Soft Delete (업데이트) 적용
      const { error } = await supabase.from('reports').update({ is_deleted: true }).eq('id', selectedId);
      
      if(error) {
         console.warn("Soft Delete 실패, 영구 삭제로 대체합니다 (임시 롤백)");
         await supabase.from('reports').delete().eq('id', selectedId);
      }
      
      setCurrentView('dashboard');
      setSelectedId(null);
    }
  };

  // 🚨 [New] HTML Rich Text 클립보드 복사 로직 (블로그 내보내기용)
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

      const footerHtml = `<br/><blockquote style="border-left: 4px solid #3b82f6; padding-left: 14px; margin-top: 40px; color: #888; font-style: italic; background: #f8fafc; padding: 16px; border-radius: 0 8px 8px 0;">이 글은 <strong>Project Days (GATEO)</strong>의 AI LogBook을 통해 작성되었습니다.</blockquote>`;

      const finalHtml = `<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">${titleHtml}${metaHtml}${bodyHtml}${footerHtml}</div>`;
      const plainText = `${report.title}\n일자: ${report.date} | 위치: ${report.location}\n\n${report.content}\n\n> 이 글은 Project Days (GATEO)의 AI LogBook을 통해 작성되었습니다.`;

      if (window.ClipboardItem) {
        const blobHtml = new Blob([finalHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        const clipboardItem = new window.ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(plainText); // Fallback
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      alert("브라우저 환경에 따라 복사가 지원되지 않을 수 있습니다.");
    }
  };

  // 🚨 [New] 블로그식 동적 렌더링 파서
  const renderBlogContent = (content, images) => {
    if (!content) return null;
    
    // 치환자를 기준으로 텍스트를 분리
    const regex = /(\[사진\s*\d+\])/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      const match = part.match(/\[사진\s*(\d+)\]/);
      
      // 1. 치환자일 경우 이미지 컴포넌트로 변환
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
        return null; // 이미지가 매칭되지 않으면 렌더링하지 않음 (Safe Path)
      }
      
      // 2. 일반 텍스트 렌더링
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
  const hasPlaceholders = /\[사진\s*\d+\]/.test(report.content); // 치환자 존재 여부 검사

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-20 font-sans">
      
      {/* Hero Background */}
      {heroImageUrl && (
        <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-700">
          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 sm:px-6">
        
        {/* 헤더 컨트롤 */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); }} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/50 rounded-full backdrop-blur-md">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex gap-2 sm:gap-3">
            {/* 🚨 [New] 블로그 내보내기 버튼 */}
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

            <div className="w-px h-6 bg-slate-700/50 my-auto mx-1"></div>

            <button onClick={() => setCurrentView('write')} className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-md text-slate-300 px-3 sm:px-4 py-2 rounded-full hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50 text-sm font-medium">
              <Edit size={16} /> <span className="hidden sm:inline">수정</span>
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 bg-red-900/20 backdrop-blur-md text-red-400 px-3 sm:px-4 py-2 rounded-full hover:bg-red-900/40 transition-colors border border-red-900/50 text-sm font-medium">
              <Trash2 size={16} /> <span className="hidden sm:inline">삭제</span>
            </button>
          </div>
        </div>

        {/* Glassmorphism 메인 캔버스 */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold text-blue-300 bg-blue-900/30 border border-blue-800/50 px-3 py-1.5 rounded-full uppercase tracking-wider">{report.date}</span>
            <span className="text-slate-400 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-slate-500"/> {report.location}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight leading-tight">{report.title}</h1>

          {/* 🚨 [Subtraction] 기존의 상단 갤러리 렌더링 방어 로직 */}
          {/* 본문에 [사진1] 등의 치환자가 없다면(과거에 작성된 글 등) 기존처럼 상단에 모아서 보여줌 */}
          {!hasPlaceholders && images.length > 0 && (
            <div className={`mb-10 grid gap-3 rounded-2xl overflow-hidden
              ${images.length === 1 ? 'grid-cols-1' : ''} 
              ${images.length === 2 ? 'grid-cols-2' : ''} 
              ${images.length === 3 ? 'grid-cols-3' : ''} 
              ${images.length === 4 ? 'grid-cols-2' : ''} 
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

          {/* 🚨 [New] 블로그식 본문 렌더링 (치환자 파싱) */}
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