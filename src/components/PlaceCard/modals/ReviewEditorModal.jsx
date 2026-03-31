import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Upload, Sparkles, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../shared/api/supabase';
import { usePlaceReviews } from '../../../hooks/usePlaceReviews';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { getReviewPrompt } from '../../../pages/Home/lib/prompts';

const ReviewEditorModal = ({ isOpen, onClose, location, existingReview, onSuccess }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  const placeSlug = location?.slug || location?.id;
  const { addReview, updateReview } = usePlaceReviews(placeSlug, user);

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [content, setContent] = useState(existingReview?.content || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [isPublic, setIsPublic] = useState(existingReview?.is_public ?? true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  const imageScrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (images.length + files.length > 10) {
      alert("이미지는 최대 10장까지만 업로드 가능합니다.");
      return;
    }

    setUploadingImage(true);
    setUploadProgress({ current: 0, total: files.length });
    try {
      const uploadedUrls = [];
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await imageCompression(file, options);

        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review_images')
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review_images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        setUploadProgress({ current: i + 1, total: files.length });
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다: ' + error.message);
    } finally {
      setUploadingImage(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (index, direction) => {
    if (direction === 'left' && index > 0) {
      setImages(prev => {
        const newArr = [...prev];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        return newArr;
      });
    } else if (direction === 'right' && index < images.length - 1) {
      setImages(prev => {
        const newArr = [...prev];
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
        return newArr;
      });
    }
  };

  const scrollImages = (direction) => {
    if (imageScrollRef.current) {
      const scrollAmount = 200;
      if (direction === 'left') {
        imageScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        imageScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleClearContent = () => {
    if (window.confirm("작성 중인 내용을 모두 지우시겠습니까?")) {
      setContent('');
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API 키가 없습니다.");

      const placeName = location?.name || location?.name_en || '이 곳';
      const prompt = getReviewPrompt(placeName, rating, content);

      const resultText = await apiClient.fetchProxyGemini(
        apiKey,
        [],
        "사용자의 입력을 바탕으로 자연스럽고 매력적인 리뷰 초안을 작성하세요. 팩트를 왜곡하지 않습니다.",
        prompt,
        [],
        "gemini-2.5-flash"
      );

      setContent(resultText);
    } catch (error) {
      console.error(error);
      alert('AI 글 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('리뷰 내용을 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        place_name: location?.name || 'Unknown Place',
        content: content.trim(),
        images,
        rating,
        is_public: isPublic
      };

      let result;
      if (existingReview) {
        result = await updateReview(existingReview.id, reviewData);
      } else {
        result = await addReview(reviewData);
      }

      if (result.error) throw new Error(result.error);

      onSuccess();
    } catch (error) {
      console.error('Error saving review:', error);
      alert('리뷰 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {existingReview ? '리뷰 수정' : '리뷰 작성'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">

          {/* 장소 이름 & 별점 표시 */}
          <div className="bg-blue-50/50 rounded-xl p-3 flex items-center justify-between border border-blue-100/50 shrink-0">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-blue-800">{location?.name || '장소 이름'}</span>
              <span className="text-xs text-blue-600/70">{location?.country || location?.country_en || 'Explore'}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 에디터 및 유틸 버튼 */}
          <div className="flex-1 flex flex-col gap-2 min-h-[150px] md:min-h-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                내용 ({content.length}/1000자)
              </span>
              <div className="flex items-center gap-2">
                {content.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearContent}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                    title="내용 초기화"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    지우기
                  </button>
                )}
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg text-xs font-medium shadow-sm shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGenerating ? '작성 중...' : 'AI 초안 생성'}
                </button>
              </div>
            </div>

            <textarea
              value={content}
              maxLength={1000}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 장소에서의 경험을 공유해주세요. 어떤 점이 좋았나요?"
              className="w-full flex-1 min-h-[120px] md:min-h-[250px] resize-none border border-gray-200 bg-gray-50/50 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
              disabled={isSubmitting || isGenerating}
            />
          </div>

          {/* 사진 첨부 영역 */}
          <div className="relative group/gallery shrink-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                사진 첨부
                {uploadingImage && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {uploadProgress.current}/{uploadProgress.total}장 최적화 업로드 중...
                  </span>
                )}
              </label>
              <span className="text-[10px] text-gray-400">
                {images.length}/10장
                {images.length > 0 && " (첫 사진 대표)"}
              </span>
            </div>

            {images.length > 4 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollImages('left')}
                  className="absolute left-0 top-[60%] -translate-y-[50%] w-7 h-7 flex items-center justify-center bg-white/90 shadow-sm border border-gray-100 rounded-full z-10 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollImages('right')}
                  className="absolute right-0 top-[60%] -translate-y-[50%] w-7 h-7 flex items-center justify-center bg-white/90 shadow-sm border border-gray-100 rounded-full z-10 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}

            <div
              ref={imageScrollRef}
              className="flex gap-2.5 overflow-x-auto pb-2 snap-x custom-scrollbar scroll-smooth"
            >
              {images.length < 10 && (
                <label className="shrink-0 w-[72px] h-[72px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors snap-start relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage || isSubmitting}
                  />
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400 mb-0.5" />
                      <span className="text-[9px] text-gray-400 font-medium">업로드</span>
                    </>
                  )}
                </label>
              )}

              {images.map((img, idx) => (
                <div key={idx} className="shrink-0 relative w-[72px] h-[72px] rounded-xl overflow-hidden snap-start group border border-gray-200">
                  <img src={img} alt={`uploaded ${idx}`} className="w-full h-full object-cover" />

                  {/* 사진 순서 변경 오버레이 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-0.5 z-10">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 text-white hover:text-blue-300 disabled:opacity-0 transition-colors"
                      title="왼쪽으로 이동"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'right')}
                      disabled={idx === images.length - 1}
                      className="p-1 text-white hover:text-blue-300 disabled:opacity-0 transition-colors"
                      title="오른쪽으로 이동"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 (전체 공개 토글 & 제출 버튼) */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between">
          <label className="flex items-center cursor-pointer gap-2">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSubmitting}
              />
              <div className={`block w-9 h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-bold text-gray-700 select-none">
              {isPublic ? '전체 공개' : '나만 보기'}
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/50 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center min-w-[90px]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (existingReview ? '수정 완료' : '등록하기')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReviewEditorModal;
