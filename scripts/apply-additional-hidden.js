/**
 * 추가 겹침 여행지 숨김 처리
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toHide = [
  "Dolomites",      // 체르마트와 겹침
  "Annapurna Circuit"  // 에베레스트와 겹침
];

const filePath = join(__dirname, '../src/pages/Home/data/travelSpots.js');
let content = readFileSync(filePath, 'utf-8');

let modifiedCount = 0;

toHide.forEach(nameEn => {
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
    console.log(`⏭️  ${nameEn}: 이미 false 또는 찾을 수 없음`);
  }
});

writeFileSync(filePath, content, 'utf-8');

console.log(`\n📊 완료: ${modifiedCount}개 여행지 추가 수정`);
console.log(`📁 최종 표시: 130개 → ${130 - modifiedCount}개`);
