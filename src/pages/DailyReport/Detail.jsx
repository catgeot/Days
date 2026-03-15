// src/pages/DailyReport/Detail.jsx
// 🚨 [Fix/Subtraction] 수동 URL 복사 및 복잡한 토글 로직 제거
// 🚨 [New] Web Share API (navigator.share) 전면 도입으로 모바일 네이티브 공유 경험(카카오톡/인스타 연동) 최적화
// 🚨 [Safe Path] Web Share 미지원 환경(PC 등)을 위한 Clipboard Fallback(대비책) 구축

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { ArrowLeft, Trash2, Edit, MapPin, Copy, CheckCircle2, Lock, Share2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const getOneReport = async () => {
      if (!id) {
        navigate('/blog', { replace: true });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      const { data, error } = await supabase.from('reports').select('*').eq('id', id).eq('user_id', user.id).single();

      if (error || !data) {
        console.warn("[Safe Path] 존재하지 않거나 권한이 없는 기록입니다.");
        navigate('/blog', { replace: true });
      } else {
        setReport(data);
        setIsPublic(data.is_public || false);
      }
    };
    getOneReport();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("이 기록을 영구적으로 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('reports').delete().eq('id', id).eq('user_id', user.id);

      if(error) {
         console.error("삭제 실패:", error);
         alert("기록을 삭제하는 중 오류가 발생했습니다.");
         return;
      }
      navigate('/blog', { replace: true });
    }
  };

  // 🚨 [New] 비공개(Lock) 강제 전환 핸들러
  const handleMakePrivate = async () => {
    if (window.confirm("이 글을 비공개로 전환하시겠습니까? (기존 공유 링크 접속 차단)")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('reports').update({ is_public: false }).eq('id', id).eq('user_id', user.id);
      if (!error) {
        setIsPublic(false);
      } else {
        alert("비공개 전환에 실패했습니다.");
      }
    }
  };

  // 🚨 [New] 스마트 공유 핸들러 (Web Share API + Fallback)
  const handleSmartShare = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. [Pessimistic First] 비공개 상태면 DB부터 공개로 업데이트
    if (!isPublic) {
      const { error } = await supabase.from('reports').update({ is_public: true }).eq('id', id).eq('user_id', user.id);
      if (error) return alert("공유 상태 전환에 실패했습니다.");
      setIsPublic(true);
    }

    const shareUrl = `${window.location.origin}/p/${id}`;
    const shareData = {
      title: `GATEO LogBook: ${report.title}`,
      text: '지구본에서 나의 특별한 여행 기록을 확인해보세요.',
      url: shareUrl,
    };

    // 2. [Fact Check] 브라우저가 Web Share API를 지원하는가? (주로 모바일 환경)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        // 공유 모달이 성공적으로 닫힘
      } catch (error) {
        // 사용자가 모달을 띄웠다가 그냥 닫은 경우(AbortError)는 에러창을 띄우지 않음 (UX 배려)
        if (error.name !== 'AbortError') {
          fallbackCopy(shareUrl);
        }
      }
    } else {
      // 3. 지원하지 않는 환경 (PC 브라우저 등) -> 클립보드 강제 복사
      fallbackCopy(shareUrl);
    }
  };

  // 🚨 [Safe Path] 복사 우회 로직
  const fallbackCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`공유 링크가 클립보드에 복사되었습니다.\n(카카오톡 등 원하는 곳에 붙여넣기 하세요!)\n\n${url}`);
    } catch (err) {
      alert("URL 복사에 실패했습니다. 브라우저 주소창의 /p/아이디 경로를 확인해주세요.");
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

      const publicLinkHtml = isPublic ? `<p style="margin-top: 10px;"><a href="${window.location.origin}/p/${id}" style="color: #3b82f6; text-decoration: none;">🔗 웹에서 원본 보기</a></p>` : '';
      const footerHtml = `<br/><blockquote style="border-left: 4px solid #3b82f6; padding-left: 14px; margin-top: 40px; color: #888; font-style: italic; background: #f8fafc; padding: 16px; border-radius: 0 8px 8px 0;">이 글은 <strong>GATEO</strong>의 AI LogBook을 통해 작성되었습니다.<br/>🌐 https://gateo.kr${publicLinkHtml}</blockquote>`;

      const finalHtml = `<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">${titleHtml}${metaHtml}${bodyHtml}${footerHtml}</div>`;
      const plainText = `${report.title}\n일자: ${report.date} | 위치: ${report.location}\n\n${report.content}\n\n> 이 글은 GATEO의 AI LogBook을 통해 작성되었습니다.\n> https://gateo.kr`;

      if (window.ClipboardItem) {
        const blobHtml = new Blob([finalHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        const clipboardItem = new window.ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText });
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
              <img src={images[imgIndex]} alt={`첨부 ${imgIndex + 1}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" onClick={() => window.open(images[imgIndex], '_blank')} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
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

  if (!report) return <div className="min-h-screen bg-white p-10 flex justify-center items-center text-gray-400 animate-pulse">우주의 기억을 동기화하는 중...</div>;

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

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 sm:px-6">

        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <button onClick={() => navigate('/blog')} className="text-gray-500 hover:text-gray-900 transition-colors p-2 bg-gray-100 rounded-full backdrop-blur-md border border-gray-200">
            <ArrowLeft size={24} />
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">

            {/* 🚨 [New] 직관적인 공유하기 버튼 (가장 돋보이게 처리) */}
            <button
              onClick={handleSmartShare}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full transition-all border text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow-md border-transparent"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">외부로 공유하기</span>
              <span className="sm:hidden">공유</span>
            </button>

            {/* 🚨 [New] 비공개 전환 버튼 (공개 상태일 때만 슬쩍 나타나는 Safe Path) */}
            {isPublic && (
              <button
                onClick={handleMakePrivate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50"
                title="클릭 시 외부 접속이 차단됩니다"
              >
                <Lock size={14} />
                <span className="hidden sm:inline">비공개로 숨기기</span>
              </button>
            )}

            <div className="w-px h-6 bg-gray-200 my-auto mx-1 hidden md:block"></div>

            <button
              onClick={handleExportBlog}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all border text-sm font-medium backdrop-blur-md
                ${isCopied
                  ? 'bg-green-50 text-green-600 border-green-200 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{isCopied ? '복사 완료!' : '블로그 내보내기'}</span>
            </button>

            <button onClick={() => navigate(`/blog/write/${id}`)} className="flex items-center gap-1.5 bg-gray-50 backdrop-blur-md text-gray-600 px-3 sm:px-4 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200 text-sm font-medium">
              <Edit size={16} /> <span className="hidden sm:inline">수정</span>
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 bg-red-50 backdrop-blur-md text-red-500 px-3 sm:px-4 py-2 rounded-full hover:bg-red-100 transition-colors border border-red-100 text-sm font-medium">
              <Trash2 size={16} /> <span className="hidden sm:inline">삭제</span>
            </button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 p-6 sm:p-10 rounded-3xl shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-wider">{report.date}</span>
            <span className="text-gray-500 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-gray-400"/> {report.location}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-10 tracking-tight leading-tight">{report.title}</h1>

          {!hasPlaceholders && images.length > 0 && (
            <div className={`mb-10 grid gap-3 rounded-2xl overflow-hidden
              ${images.length === 1 ? 'grid-cols-1' : ''}
              ${images.length === 2 ? 'grid-cols-2' : ''}
              ${images.length === 3 ? 'grid-cols-3' : ''}
              ${images.length >= 4 ? 'grid-cols-2' : ''}
            `}>
              {images.map((img, idx) => (
                <div key={idx} className={`relative group ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                  <img src={img} alt={`첨부 ${idx+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer border border-gray-200" onClick={() => window.open(img, '_blank')} />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            {hasPlaceholders ? renderBlogContent(report.content, images) : (
              <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap font-medium">{report.content}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Detail;
