import { useState, useCallback } from "react";

const KEY = "cinelocal_watchlist";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function useWatchlist() {
  const [list, setList] = useState(load);

  const toggle = useCallback((id) => {
    const current = load();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    setList(next);
  }, []);

  const has = useCallback((id) => list.includes(id), [list]);

  return { list, toggle, has };
}
