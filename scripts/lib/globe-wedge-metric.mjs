/**
 * WebKit globe wedge heuristic: dark fraction in right-middle band (x 72–100%, y 26–56%).
 * @returns {{ darkFraction: number, wedgeSuspect: boolean, meanRgb: number }}
 */
export function measureGlobeWedgeFromRgba(rgba, width, height) {
  const x0 = Math.floor(width * 0.72);
  const y0 = Math.floor(height * 0.26);
  const x1 = width;
  const y1 = Math.floor(height * 0.56);
  let sum = 0;
  let dark = 0;
  let n = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * width + x) * 4;
      const mean = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;
      sum += mean;
      if (mean < 25) dark += 1;
      n += 1;
    }
  }
  const darkFraction = n > 0 ? dark / n : 1;
  const meanRgb = n > 0 ? sum / n : 0;
  return {
    darkFraction,
    meanRgb,
    wedgeSuspect: darkFraction >= 0.35,
  };
}
