import { loadHlsModule } from './socialReelHls.js';

export function videoSupportsNativeHls(video) {
  if (!video || typeof video.canPlayType !== 'function') return false;
  try {
    const apple = video.canPlayType('application/vnd.apple.mpegurl');
    const legacy = video.canPlayType('application/x-mpegURL');
    return apple === 'probably' || apple === 'maybe' || legacy === 'probably' || legacy === 'maybe';
  } catch {
    return false;
  }
}

function applyInlinePlayback(video, muted) {
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = muted;
  video.defaultMuted = muted;
  if (muted) video.setAttribute('muted', '');
  else video.removeAttribute('muted');
}

function clearMediaElementSource(video) {
  video.removeAttribute('src');
  if (typeof video.load === 'function') video.load();
}

export function safePlay(video) {
  try {
    const pending = video?.play?.();
    if (pending && typeof pending.then === 'function') pending.catch(() => {});
  } catch {
    /* jsdom has no media playback */
  }
}

/**
 * One video element. MP4 and native HLS set `src`. Other HLS goes through `loadHls`
 * (default: lazy `hls.js`) and does not replace the element.
 */
export function createSocialReelSession(video, options = {}) {
  const loadHls = options.loadHls || loadHlsModule;
  let generation = 0;
  let current = null;

  function destroyCurrent() {
    const active = current;
    current = null;
    if (!active) return;
    try {
      active.destroy();
    } catch {
      /* ignore */
    }
  }

  function detach() {
    generation += 1;
    destroyCurrent();
  }

  async function attach(reel, { muted = true } = {}) {
    const token = ++generation;
    destroyCurrent();
    if (!video || !reel?.src) return { mode: 'empty' };
    applyInlinePlayback(video, muted);

    if (reel.kind === 'hls' && !videoSupportsNativeHls(video)) {
      let Hls = null;
      try {
        Hls = await loadHls();
      } catch {
        Hls = null;
      }
      if (token !== generation) return { mode: 'cancelled' };
      const supported = Hls && (typeof Hls.isSupported !== 'function' || Hls.isSupported());
      if (supported) {
        const player = new Hls();
        player.loadSource(reel.src);
        player.attachMedia(video);
        const handle = {
          mode: 'hls.js',
          destroy() {
            try {
              player.detachMedia?.();
            } catch {
              /* ignore */
            }
            try {
              player.destroy?.();
            } catch {
              /* ignore */
            }
          },
        };
        if (token !== generation) {
          handle.destroy();
          return { mode: 'cancelled' };
        }
        current = handle;
        return handle;
      }
    }

    if (token !== generation) return { mode: 'cancelled' };
    video.src = reel.src;
    const handle = {
      mode: reel.kind === 'hls' ? 'native-hls' : 'mp4',
      destroy() {
        clearMediaElementSource(video);
      },
    };
    current = handle;
    return handle;
  }

  return { attach, detach };
}
