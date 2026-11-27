export function applyInlinePlayback(video, muted) {
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', 'true');
  video.preload = 'metadata';
  video.muted = muted;
  video.defaultMuted = muted;
  if (muted) video.setAttribute('muted', '');
  else video.removeAttribute('muted');
}

function clearMediaElementSource(video) {
  video.removeAttribute('src');
  video.src = '';
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
 * Public 720p MP4 URL (Cloudflare R2). Setting `src` lets the browser send Range
 * requests. `preload=metadata` asks for the header, not the whole file.
 * Replace this function if a later host needs a different attach step.
 */
export function attachMp4Source(video, reel) {
  if (!video || reel?.kind !== 'mp4' || !reel.src) return null;
  video.preload = 'metadata';
  video.src = reel.src;
  return {
    mode: 'mp4',
    destroy() {
      clearMediaElementSource(video);
    },
  };
}

/** One video element. `attachSource` defaults to {@link attachMp4Source}. */
export function createSocialReelSession(video, options = {}) {
  const attachSource = options.attachSource || attachMp4Source;
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
    if (token !== generation) return { mode: 'cancelled' };
    if (reel.kind !== 'mp4') return { mode: 'unsupported' };
    const handle = attachSource(video, reel);
    if (!handle) return { mode: 'unsupported' };
    if (token !== generation) {
      try {
        handle.destroy();
      } catch {
        /* ignore */
      }
      return { mode: 'cancelled' };
    }
    current = handle;
    return handle;
  }

  return { attach, detach };
}
