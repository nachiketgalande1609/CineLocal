const PREFIX = "cinelocal_progress_";

export function useWatchProgress(movieId) {
  function getProgress() {
    try {
      const raw = localStorage.getItem(PREFIX + movieId);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveProgress(currentTime, duration) {
    if (!movieId || !duration || duration < 30) return;
    const pct = currentTime / duration;
    if (pct < 0.02 || pct > 0.97) {
      localStorage.removeItem(PREFIX + movieId);
    } else {
      localStorage.setItem(PREFIX + movieId, JSON.stringify({
        time: currentTime,
        percentage: pct,
        duration,
        savedAt: new Date().toISOString(),
      }));
    }
  }

  function clearProgress() {
    localStorage.removeItem(PREFIX + movieId);
  }

  return { getProgress, saveProgress, clearProgress };
}

// Read all progress entries for a list of movie ids
export function getAllProgress(movieIds) {
  return movieIds.reduce((acc, id) => {
    try {
      const raw = localStorage.getItem(PREFIX + id);
      if (raw) acc[id] = JSON.parse(raw);
    } catch {}
    return acc;
  }, {});
}
