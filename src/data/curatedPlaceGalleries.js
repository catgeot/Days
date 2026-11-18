/**
 * Slug-locked galleries. A listed slug never falls through to place_stats,
 * session cache, Unsplash, or Pexels. An empty list is the empty gallery.
 * URLs are Wikimedia Commons thumbs checked for HTTP 200 and image/jpeg.
 */

const COMMONS = 'https://commons.wikimedia.org/';

function commonsPhoto({ id, file, thumb, author, license, licenseUrl, alt, width, height }) {
  const page = `https://commons.wikimedia.org/wiki/File:${file}`;
  return {
    id,
    source: 'wikimedia',
    width,
    height,
    alt_description: alt,
    author,
    license,
    licenseUrl,
    sourceUrl: page,
    urls: { regular: thumb, small: thumb },
    links: { html: page },
    user: { name: author, links: { html: page } },
    providerHome: COMMONS,
  };
}

const GALLERIES = {
  'nang-thong-beach': [
    commonsPhoto({
      id: 'commons-khao-lak-light-beacon',
      file: 'Khao_Lak_light_beacon.JPG',
      thumb:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Khao_Lak_light_beacon.JPG/960px-Khao_Lak_light_beacon.JPG',
      author: 'Jmex',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      alt: 'Khao Lak lighthouse on the rock off Nang Thong Beach',
      width: 960,
      height: 720,
    }),
  ],
  'bang-sak-beach': [
    commonsPhoto({
      id: 'commons-sunset-bangsak-beach',
      file: 'Sunset_Bangsak_Beach_-_panoramio.jpg',
      thumb:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Sunset_Bangsak_Beach_-_panoramio.jpg/960px-Sunset_Bangsak_Beach_-_panoramio.jpg',
      author: 'svenimartini',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      alt: 'Sunset at Bangsak Beach',
      width: 960,
      height: 720,
    }),
  ],
  'bang-niang-market': [],
  'ton-chong-fa-waterfall': [
    commonsPhoto({
      id: 'commons-ton-chong-fa-tier-4',
      file: '%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%884.jpg',
      thumb:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%884.jpg/960px-%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%884.jpg',
      author: 'Maleewan1wanpen2thai',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      alt: 'Ton Chong Fa waterfall tier 4, Khao Lak-Lam Ru National Park',
      width: 960,
      height: 1280,
    }),
    commonsPhoto({
      id: 'commons-ton-chong-fa-tier-3',
      file: '%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%883%E0%B9%80%E0%B8%94%E0%B8%B7%E0%B8%AD%E0%B8%99%E0%B8%A1%E0%B8%B4%E0%B8%96%E0%B8%B8%E0%B8%99%E0%B8%B2%E0%B8%A2%E0%B8%992565.jpg',
      thumb:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%883%E0%B9%80%E0%B8%94%E0%B8%B7%E0%B8%AD%E0%B8%99%E0%B8%A1%E0%B8%B4%E0%B8%96%E0%B8%B8%E0%B8%99%E0%B8%B2%E0%B8%A2%E0%B8%992565.jpg/960px-%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%95%E0%B8%81%E0%B9%82%E0%B8%95%E0%B8%99%E0%B8%8A%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B9%89%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%883%E0%B9%80%E0%B8%94%E0%B8%B7%E0%B8%AD%E0%B8%99%E0%B8%A1%E0%B8%B4%E0%B8%96%E0%B8%B8%E0%B8%99%E0%B8%B2%E0%B8%A2%E0%B8%992565.jpg',
      author: 'Maleewan1wanpen2thai',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      alt: 'Ton Chong Fa waterfall tier 3, Khao Lak-Lam Ru National Park',
      width: 960,
      height: 1280,
    }),
  ],
  'ban-nam-khem-tsunami-memorial-park': [],
  'takua-pa-old-town': [],
};

export function curatedPlaceGallery(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(GALLERIES, key)) return null;
  return GALLERIES[key];
}

export function curatedPlaceGalleryUrls(slug) {
  const images = curatedPlaceGallery(slug);
  if (!images) return null;
  return images.map((image) => image.urls.regular);
}

export function listCuratedPlaceGallerySlugs() {
  return Object.keys(GALLERIES);
}
