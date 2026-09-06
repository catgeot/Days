/**
 * 갤러리 스톡(Unsplash/Pexels)에서 단일 인물 사진만 제외.
 * orientation=landscape 재도입 금지 — 세로 전경(폭포·사원)까지 잘림.
 * 전경 속 사람·거리 군중은 유지.
 * 장소 검색 태그(island/travel)만으로는 전경으로 보지 않음 — 자킨토스 인물 고착 방지.
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

const FACE_TAG_RE = /^(portraits?|face|headshot|selfie|men|women|man|woman)$/i;

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

function collectCaptionText(img) {
  if (!img || typeof img !== 'object') return '';
  return [img.description, img.alt_description, img.alt, img.tourApi?.title]
    .filter(Boolean)
    .join(' ');
}

function collectPhotoText(img) {
  if (!img || typeof img !== 'object') return '';
  return [collectCaptionText(img), tagTitles(img).join(' ')].filter(Boolean).join(' ');
}

function isPortraitAspect(img) {
  const width = Number(img?.width) || 0;
  const height = Number(img?.height) || 0;
  if (width <= 0 || height <= 0) return false;
  return height / width >= 1.25;
}

export function isSinglePersonPortraitPhoto(img) {
  if (!img || typeof img !== 'object') return false;

  const caption = collectCaptionText(img);
  const text = collectPhotoText(img);
  const tags = tagTitles(img);
  const portraitAspect = isPortraitAspect(img);
  const sceneInCaption = SCENE_RE.test(caption);

  if (SCENIC_PORTRAIT_PHRASE_RE.test(caption) || SCENIC_PORTRAIT_PHRASE_RE.test(text)) {
    return false;
  }

  if (ALWAYS_PORTRAIT_RE.test(text) || tags.some((title) => ALWAYS_PORTRAIT_RE.test(title))) {
    if (sceneInCaption && !portraitAspect) return false;
    return true;
  }

  const portraitWord =
    PORTRAIT_WORD_RE.test(text) || tags.some((title) => /^portraits?$/i.test(title));
  const personSubject =
    PERSON_SUBJECT_RE.test(caption) ||
    PERSON_SUBJECT_RE.test(text) ||
    tags.some((title) => PERSON_SUBJECT_RE.test(title));
  const faceTag = tags.some((title) => FACE_TAG_RE.test(title));

  if (portraitWord && personSubject && !sceneInCaption) return true;
  if (portraitAspect && personSubject && !sceneInCaption) return true;
  if (portraitAspect && faceTag && !sceneInCaption) return true;

  return false;
}

export function filterOutSinglePersonPortraits(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return list;
  return list.filter((img) => !isSinglePersonPortraitPhoto(img));
}
