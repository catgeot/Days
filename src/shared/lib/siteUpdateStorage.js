const SEEN_RELEASE_KEY = 'gateo_seen_release';
const SESSION_SNOOZE_KEY = 'gateo_release_snoozed_session';

export function getSeenReleaseId() {
  try {
    return localStorage.getItem(SEEN_RELEASE_KEY);
  } catch {
    return null;
  }
}

export function setSeenReleaseId(releaseId) {
  try {
    localStorage.setItem(SEEN_RELEASE_KEY, releaseId);
  } catch {
    // ignore
  }
}

export function getSessionSnoozedReleaseId() {
  try {
    return sessionStorage.getItem(SESSION_SNOOZE_KEY);
  } catch {
    return null;
  }
}

export function setSessionSnoozedReleaseId(releaseId) {
  try {
    sessionStorage.setItem(SESSION_SNOOZE_KEY, releaseId);
  } catch {
    // ignore
  }
}

export function shouldShowRelease(releaseId) {
  if (!releaseId) return false;
  if (getSeenReleaseId() === releaseId) return false;
  if (getSessionSnoozedReleaseId() === releaseId) return false;
  return true;
}
