import { normalizePersonaLabel } from '../utils/placeReviewEditorial.js';

const PERSONA_GRADIENT = Object.freeze({
  야경렌즈: 'from-indigo-600 via-violet-600 to-indigo-800',
  느린산책: 'from-emerald-500 to-teal-700',
  로컬하루: 'from-sky-500 to-blue-700',
  가족나들이: 'from-rose-400 to-pink-600',
  미식갑니다: 'from-amber-500 to-orange-600',
  문턱없이: 'from-cyan-500 to-blue-600',
  흥이난다: 'from-fuchsia-500 to-purple-700',
  이틀컷: 'from-slate-500 to-slate-700',
});

const DEFAULT_GRADIENT = 'from-indigo-500 via-indigo-600 to-violet-700';

export function logbookReviewPersonaFallbackGradient(personaLabel) {
  const key = normalizePersonaLabel(personaLabel);
  return PERSONA_GRADIENT[key] || DEFAULT_GRADIENT;
}