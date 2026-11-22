/**
 * 프라하 허브 Unsplash 페이지 slug ↔ images.unsplash.com pathname 고정표(썸네일 있는 명소만).
 * slug↔CDN 일치는 Playwright로 Unsplash `photo.urls.regular` pathname과 대조(봇 차단으로 CI는 pathname+HEAD만).
 */
export const PRAGUE_ICON_ONLY_ATTRACTIONS = ['프라하성'];

export const PRAGUE_UNSPLASH_BINDINGS = [
  {
    name: '카를교',
    slug: '4AL1OnvWAng',
    photo: 'photo-1719683187673-92559a5c0ab9',
    photographer: 'Joshua Kettle',
    username: 'joshuakettle',
  },
  {
    name: '구시가 광장',
    slug: 'fO6a6npF4mg',
    photo: 'photo-1749219346498-2e47d7c50e06',
    photographer: "Sergey Leont'ev",
    username: 'addictfuji',
  },
  {
    name: '천문시계',
    slug: 'uHI5ToXVvwo',
    photo: 'photo-1747466403454-d0518287e433',
    photographer: 'Sinisa Lekovic',
    username: 'sinisalekovic',
  },
  {
    name: '레논 벽',
    slug: '0m-Vj_0yFwE',
    photo: 'photo-1573929491484-c151f78d50e5',
    photographer: 'Dariusz Sankowski',
    username: 'dariuszsankowski',
  },
  {
    name: '페트르진 언덕',
    slug: 'rjqrQNWZmNo',
    photo: 'photo-1670784489742-5a8f40a8eda3',
    photographer: 'Mattia Spotti',
    username: 'pockmini',
  },
  {
    name: '요세포프',
    slug: 'USeZeayN_6M',
    photo: 'photo-1761953443006-bad3b9eca39e',
    photographer: 'Emir Kutluay',
    username: 'emirkutluay',
  },
];

const UTM = 'utm_source=gateo&utm_medium=referral';
const THUMB_Q = '?auto=format&fit=crop&w=400&h=400&q=80';

export function expectedPragueThumbUrl(photo) {
  return `https://images.unsplash.com/${photo}${THUMB_Q}`;
}

export function expectedPragueCredit(row) {
  return {
    source: 'unsplash',
    photographer: row.photographer,
    photographer_url: `https://unsplash.com/@${row.username}?${UTM}`,
    unsplash_url: `https://unsplash.com/photos/${row.slug}?${UTM}`,
  };
}