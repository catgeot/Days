const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '../src/pages/Home/data/globeLandmarks.json');
const batchPath = path.join(__dirname, 'data/globe-landmarks-batch-1e.json');

const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

Object.assign(base, batch);

// 1f — Mount Fuji Studio-style keyframes (smooth multi-stop orbit)
base['mount-fuji'] = {
  landmarkName: 'Mount Fuji & Kawaguchi',
  center: [138.7274, 35.3606],
  exaggeration: 1.4,
  keyframes: [
    {
      center: [138.757, 35.517],
      zoom: 10.5,
      pitch: 0,
      bearing: -30,
      duration: 0
    },
    {
      center: [138.757, 35.517],
      zoom: 11.8,
      pitch: 45,
      bearing: -30,
      duration: 4000,
      ease: true
    },
    {
      center: [138.801, 35.499],
      zoom: 12.2,
      pitch: 52,
      bearing: -10,
      duration: 5500,
      ease: true,
      orbit: true
    },
    {
      center: [138.7274, 35.3606],
      zoom: 12.6,
      pitch: 58,
      bearing: 20,
      duration: 6000,
      ease: true,
      orbit: true
    },
    {
      center: [138.68, 35.38],
      zoom: 12.4,
      pitch: 60,
      bearing: 55,
      duration: 6000,
      ease: true,
      orbit: true
    },
    {
      center: [138.7274, 35.3606],
      zoom: 12.8,
      pitch: 58,
      bearing: 95,
      duration: 5500,
      ease: true,
      orbit: true
    },
    {
      center: [138.757, 35.517],
      zoom: 12.5,
      pitch: 56,
      bearing: 130,
      duration: 5000,
      ease: true,
      orbit: true
    }
  ],
  tourReady: true
};

fs.writeFileSync(basePath, `${JSON.stringify(base, null, 2)}\n`, 'utf8');
console.log('Merged', Object.keys(batch).length, 'landmarks; mount-fuji keyframes updated.');
