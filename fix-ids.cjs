const fs = require('fs');
const path = './src/pages/Home/data/travelSpots.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /export const TRAVEL_SPOTS = (\[[\s\S]*?\]);/;
const match = content.match(regex);

if (match) {
  let arrStr = match[1];
  // Convert string to array using Function
  let arr;
  try {
    arr = new Function('return ' + arrStr)();
  } catch(e) {
    console.error('parse error', e);
    process.exit(1);
  }

  let used = new Set();
  let nextId = 300;
  let count = 0;

  for (let i=0; i<arr.length; i++) {
    if (used.has(arr[i].id)) {
      arr[i].id = nextId++;
      count++;
    } else {
      used.add(arr[i].id);
    }
  }

  if (count > 0) {
    const newArrStr = JSON.stringify(arr, null, 2);
    const newContent = content.replace(match[1], newArrStr);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log(`Fixed ${count} duplicate IDs`);
  } else {
    console.log('No duplicates found');
  }
} else {
  console.log('Regex match failed');
}
