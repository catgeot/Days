/**
 * 겹치는 여행지에 showOnGlobe: false 자동 적용 스크립트
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 숨길 여행지 목록 (분석 결과)
const toHide = [
  "Bodrum",
  "Santorini",
  "El Nido",
  "Cebu",
  "Bohol",
  "Palawan",
  "Bali",
  "Phi Phi Islands",
  "Koh Samui",
  "Krabi",
  "Langkawi",
  "Fiordland",
  "Cinque Terre",
  "Kuala Lumpur",
  "Seattle",
  "Machu Picchu",
  "Jerusalem",
  "Delhi",
  "Denali",
  "Serengeti"
];

const filePath = join(__dirname, '../src/pages/Home/data/travelSpots.js');
let content = readFileSync(filePath, 'utf-8');

let modifiedCount = 0;

toHide.forEach(nameEn => {
  // "name_en": "Bodrum" 패턴 찾기
  const regex = new RegExp(
    `("name_en":\\s*"${nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]+?"showOnGlobe":\\s*)true`,
    'g'
  );

  const newContent = content.replace(regex, '$1false');

  if (newContent !== content) {
    console.log(`✅ ${nameEn}: showOnGlobe true → false`);
    modifiedCount++;
    content = newContent;
  } else {
    // 이미 false이거나 showOnGlobe 속성이 없는 경우
    const alreadyFalse = new RegExp(
      `"name_en":\\s*"${nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]+?"showOnGlobe":\\s*false`
    ).test(content);

    if (alreadyFalse) {
      console.log(`⏭️  ${nameEn}: 이미 false`);
    } else {
      console.log(`⚠️  ${nameEn}: showOnGlobe 속성 없음 또는 찾을 수 없음`);
    }
  }
});

// 파일 저장
writeFileSync(filePath, content, 'utf-8');

console.log(`\n📊 완료: ${modifiedCount}개 여행지 수정`);
console.log(`📁 파일: ${filePath}`);
