import React, { useState, useEffect } from 'react';
import { X, Star, Upload, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
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
  // AI 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);

  // 모달 닫기 방지용 효과
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
    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} 이미지는 5MB 이하만 업로드 가능합니다.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review_images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review_images')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다: ' + error.message);
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // input 초기화
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API 키가 없습니다.");

      const placeName = location?.name || location?.name_en || '이 곳';
      const prompt = getReviewPrompt(placeName, rating, content);

      const resultText = await apiClient.fetchGeminiResponse(
        apiKey,
        [],
        "사용자의 입력을 바탕으로 자연스럽고 매력적인 리뷰 초안을 작성하세요. 팩트를 왜곡하지 않습니다.",
        prompt,
        [],
        "gemini-2.5-flash"
      );

      setContent(prev => prev + (prev && !prev.endsWith('\n') ? '\n\n' : '') + resultText);
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

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {existingReview ? '리뷰 수정' : '리뷰 작성'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">

          {/* 장소 이름 표시 */}
          <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border border-blue-100/50">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-blue-800">{location?.name || '장소 이름'}</span>
              <span className="text-xs text-blue-600/70">{location?.country || location?.country_en || 'Explore'}</span>
            </div>
            {/* 별점 선택기 */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 에디터 */}
          <div className="relative flex-1 min-h-[120px] md:min-h-[200px] flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 장소에서의 경험을 공유해주세요. 어떤 점이 좋았나요? (AI 아이콘을 눌러 추천 문구를 생성해보세요!)"
              className="w-full h-full min-h-[120px] md:min-h-[200px] resize-none border-none bg-gray-50/50 rounded-xl p-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-colors"
              disabled={isSubmitting || isGenerating}
            />

            {/* AI 어시스턴트 버튼 */}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || isSubmitting}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg text-xs font-medium shadow-md shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-70"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'AI가 작성 중...' : 'AI 초안 생성'}
            </button>
          </div>

          {/* 사진 첨부 영역 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">사진 첨부</label>
              <span className="text-xs text-gray-400">{images.length}/10장</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* 추가 버튼 */}
              {images.length < 10 && (
                <label className="shrink-0 w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors snap-start relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage || isSubmitting}
                  />
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-400 font-medium">업로드</span>
                    </>
                  )}
                </label>
              )}

              {/* 업로드된 이미지 썸네일 */}
              {images.map((img, idx) => (
                <div key={idx} className="shrink-0 relative w-20 h-20 rounded-xl overflow-hidden snap-start group border border-gray-200">
                  <img src={img} alt={`uploaded ${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <label className="flex items-center cursor-pointer gap-2">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isSubmitting}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-gray-700 select-none">
                {isPublic ? '전체 공개' : '나만 보기'}
              </span>
            </label>
          </div>

        </div>

        {/* 푸터 (제출 버튼) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200/50 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center min-w-[100px]"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (existingReview ? '수정 완료' : '등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditorModal;
