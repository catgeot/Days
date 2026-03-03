// src/pages/DailyReport/hooks/useLogbookMedia.js
// 🚨 [New] 관심사 분리: Write.jsx에서 복잡한 미디어(이미지) 처리 로직을 완전히 독립시킴
// 🚨 [Fix] 10장 한도 상향 및 일괄 업로드 진행률(Progress) 피드백 로직 추가

import { useState } from 'react';
import imageCompression from 'browser-image-compression';

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const useLogbookMedia = () => {
  const [imageFiles, setImageFiles] = useState([]); 
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [existingImages, setExistingImages] = useState([]); 

  // 🚨 [New] 압축 진행 상태 관리
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState({ current: 0, total: 0 });

  const handleImageChange = async (e, isAILoading) => {
    if (isAILoading || isCompressing) return; // 작업 중 중복 실행 차단 (Safe Path)
    
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const totalCount = existingImages.length + imageFiles.length + files.length;
    // 🚨 [Fix] 블로그 최적화 밀도를 위해 한도를 10장으로 상향
    if (totalCount > 10) { 
      alert("사진은 최대 10장까지만 업로드 가능합니다."); 
      return; 
    }
    
    setIsCompressing(true);
    setCompressProgress({ current: 0, total: files.length });

    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFiles = [];
    const newPreviews = [];

    try {
      // 🚨 [New] 진행 상황 UI 업데이트를 위해 for...of 루프 사용
      for (let i = 0; i < files.length; i++) {
        const compressed = await imageCompression(files[i], options);
        compressedFiles.push(compressed);
        newPreviews.push(URL.createObjectURL(compressed));
        setCompressProgress({ current: i + 1, total: files.length });
      }
      
      setImageFiles(prev => [...prev, ...compressedFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    } catch (error) { 
      console.error("이미지 압축 실패:", error); 
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removeNewImage = (index) => { 
    setImageFiles(prev => prev.filter((_, i) => i !== index)); 
    setPreviewUrls(prev => prev.filter((_, i) => i !== index)); 
  };
  
  const removeExistingImage = (index) => { 
    setExistingImages(prev => prev.filter((_, i) => i !== index)); 
  };

  const heroImageUrl = previewUrls[0] || existingImages[0] || null;

  return {
    imageFiles,
    previewUrls,
    existingImages,
    setExistingImages, 
    handleImageChange,
    removeNewImage,
    removeExistingImage,
    heroImageUrl,
    isCompressing,     // 🚨 Export 추가
    compressProgress   // 🚨 Export 추가
  };
};