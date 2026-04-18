const fs = require('fs');

const fileContent = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf8');

const targets = [
  '팀북투',
  '랄리벨라',
  '아조레스 제도',
  '북해도',
  'Sant Joan',
  '미야코지마',
  '마다가스카르',
  '에베레스트',
  'Kala Patthar',
  '그레이트 배리어 리프',
  '페로 제도',
  '키리바시',
  '페르난두지노로냐',
  '카보베르데',
  '블레드',
  '라스페치아',
  '코토르'
];

const missing = [];
const existing = [];

targets.forEach(target => {
  // Check for exact match in name, name_en, slug or keywords
  if (fileContent.includes(`"${target}"`) || fileContent.includes(`'${target}'`)) {
    existing.push(target);
  } else {
    missing.push(target);
  }
});

console.log('--- Existing targets ---');
console.log(existing);
console.log('\\n--- Missing targets ---');
console.log(missing);
