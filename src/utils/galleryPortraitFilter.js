/**
 * 갤러리 스톡(Unsplash/Pexels)에서 단일 인물 사진만 제외.
 * orientation=landscape 재도입 금지 — 세로 전경(폭포·사원)까지 잘림.
 * 전경 속 사람·거리 군중은 유지.
 */

const ALWAYS_PORTRAIT_RE =
  /\b(headshot|head-shot|head shot|selfie|mugshot|self-portrait|self portrait|studio portrait|head and shoulders)\b|셀카|셀피|인물사진|초상화/i;

const PORTRAIT_WORD_RE = /\bportraits?\b|인물\s*사진/i;

const PERSON_SUBJECT_RE =
  /\b((young|beautiful|smiling|attractive)\s+)?(woman|man|girl|boy|lady|gentleman|model|person|female|male)\b|여성|남성|소녀|소년/i;

const SCENE_RE =
  /\b(landscape|cityscape|skyline|architecture|building|temple|pagoda|beach|ocean|sea|mountain|forest|jungle|street|market|village|harbor|harbour|waterfall|island|sunset|sunrise|travel|destination|landmark|plaza|bridge|castle|church|mosque|garden|park|lake|river|desert|volcano|cliff|coast|scenic|scenery|aerial|drone|panorama|downtown|tower|monument|statue|palace|shrine|night view|city view)\b|전경|야경|풍경|해안|해변|사찰|궁궐/i;

const SCENIC_PORTRAIT_PHRASE_RE =
  /\bportrait of (a |an |the )?(city|mountain|landscape|place|building|temple|castle|valley|coast|island|skyline)/i;

function tagTitles(img) {
  const tags = img?.tags || img?.tags_preview || [];
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object') return String(tag.title || tag.name || '');
      return '';
    })
    .map((title) => title.trim())
    .filter(Boolean);
}

function collectPhotoText(img) {
  if (!img || typeof img !== 'object') return '';
  return [
    img.description,
    img.alt_description,
    img.alt,
    img.tourApi?.title,
    tagTitles(img).join(' '),
  ]
    .filter(Boolean)
    .join(' ');
}

function isPortraitAspect(img) {
  const width = Number(img?.width) || 0;
  const height = Number(img?.height) || 0;
  if (width <= 0 || height <= 0) return false;
  return height / width >= 1.25;
}

function hasSceneSignal(text, tags) {
  if (SCENE_RE.test(text)) return true;
  return tags.some((title) => SCENE_RE.test(title));
}

export function isSinglePersonPortraitPhoto(img) {
  if (!img || typeof img !== 'object') return false;

  const text = collectPhotoText(img);
  const tags = tagTitles(img);
  const portraitAspect = isPortraitAspect(img);
  const scene = hasSceneSignal(text, tags);

  if (SCENIC_PORTRAIT_PHRASE_RE.test(text)) return false;

  if (ALWAYS_PORTRAIT_RE.test(text) || tags.some((title) => ALWAYS_PORTRAIT_RE.test(title))) {
    if (scene && !portraitAspect) return false;
    return true;
  }

  const portraitWord =
    PORTRAIT_WORD_RE.test(text) || tags.some((title) => /^portraits?$/i.test(title));
  const personSubject =
    PERSON_SUBJECT_RE.test(text) || tags.some((title) => PERSON_SUBJECT_RE.test(title));

  if (portraitWord && personSubject && !scene) return true;
  if (portraitAspect && personSubject && !scene) return true;

  return false;
}

export function filterOutSinglePersonPortraits(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return list;
  const kept = list.filter((img) => !isSinglePersonPortraitPhoto(img));
  if (kept.length === 0) return list;
  return kept;
}
