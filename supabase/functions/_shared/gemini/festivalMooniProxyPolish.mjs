import { polishFestivalModelReply } from "../../../../src/shared/korea/mooniKoreaFestivalReplyPolish.js";
import { repairGeminiReplacementChars } from "./answerSanitize.mjs";

function ymdDigits(raw) {
  const s = String(raw ?? "").replace(/\D/g, "");
  return /^\d{8}$/.test(s) ? s : "";
}

function nearbyRestaurants(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 16) return null;
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const name = String(row.name ?? "").trim();
    if (!name || name.length > 80) return null;
    const item = { name };
    const distKm = Number(row.distKm);
    if (Number.isFinite(distKm) && distKm > 0) item.distKm = distKm;
    const cat3 = String(row.cat3 ?? "").trim();
    if (cat3) item.cat3 = cat3.slice(0, 16);
    const locality = String(row.locality ?? "").trim();
    if (locality) item.locality = locality.slice(0, 80);
    const url = String(row.url ?? row.homepage ?? "").trim();
    if (/^https?:\/\//i.test(url)) item.url = url.slice(0, 400);
    out.push(item);
  }
  return out;
}

/** mooni_chat optional body — mirrors client `buildFestivalMooniPolishOptions`. */
export function parseFestivalPolishParams(raw) {
  if (raw == null || raw === false) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const restaurants = nearbyRestaurants(raw.nearbyRestaurants);
  if (restaurants == null) return null;
  return {
    locale: raw.locale == null ? "ko" : String(raw.locale).slice(0, 8),
    userText: raw.userText == null ? "" : String(raw.userText).slice(0, 1000),
    chipId: raw.chipId == null || raw.chipId === "" ? "" : String(raw.chipId).slice(0, 48),
    contentId: raw.contentId == null ? "" : String(raw.contentId).slice(0, 16),
    nearbyRestaurants: restaurants,
    referenceYmd: ymdDigits(raw.referenceYmd),
    eventStartDate: ymdDigits(raw.eventStartDate),
    eventEndDate: ymdDigits(raw.eventEndDate),
    departureOriginId: raw.departureOriginId == null ? "" : String(raw.departureOriginId).slice(0, 32),
    festivalTitle: raw.festivalTitle == null ? "" : String(raw.festivalTitle).slice(0, 120),
    homepage: raw.homepage == null ? "" : String(raw.homepage).slice(0, 400),
    tel: raw.tel == null ? "" : String(raw.tel).slice(0, 80),
  };
}

export function polishMooniFestivalProxyText(text, polish) {
  const repaired = repairGeminiReplacementChars(text);
  if (!polish) return repaired;
  return polishFestivalModelReply(repaired, polish);
}
