import assert from 'node:assert/strict';
import { test } from 'node:test';

/** WCAG relative luminance contrast (sRGB). */
function contrastRatio(rgbA, rgbB) {
  const lum = ([r, g, b]) => {
    const f = (c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const L1 = lum(rgbA);
  const L2 = lum(rgbB);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Tailwind tokens: text-teal-950 on bg-teal-100 / text-white on bg-teal-900 */
const LIGHT = {
  text: [4, 47, 46],
  bg: [204, 251, 241],
};
const DARK = {
  text: [255, 255, 255],
  bg: [19, 78, 74],
};

test('itinerary collapsed CTA — contrast ≥ 4.5:1 (light + dark tokens)', () => {
  assert.ok(contrastRatio(LIGHT.text, LIGHT.bg) >= 4.5);
  assert.ok(contrastRatio(DARK.text, DARK.bg) >= 4.5);
});
