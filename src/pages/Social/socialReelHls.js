// Safari plays HLS on the video element. Other browsers load hls.js only when a reel needs it.
// The package is already in node_modules via @react-three/drei; this file is the adapter seam.
export async function loadHlsModule() {
  const mod = await import('hls.js');
  return mod?.default ?? mod;
}
