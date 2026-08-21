import { useCallback, useEffect, useState } from "react";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const listeners = new Set<() => void>();
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((l) => l());
}

export function usePersistentState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => read(key, fallback));

  useEffect(() => {
    const sync = () => setState(read(key, fallback));
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(read(key, fallback)) : v;
      write(key, next);
      setState(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [state, set];
}

export function useFavorites(): [number[], (id: number) => void] {
  const [favs, setFavs] = usePersistentState<number[]>("dex.favorites", []);
  const toggle = useCallback(
    (id: number) =>
      setFavs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFavs]
  );
  return [favs, toggle];
}

export function useTeam(): [(number | null)[], (slot: number, id: number | null) => void] {
  const [team, setTeam] = usePersistentState<(number | null)[]>("dex.team", [
    null, null, null, null, null, null,
  ]);
  const setSlot = useCallback(
    (slot: number, id: number | null) =>
      setTeam((prev) => prev.map((v, i) => (i === slot ? id : v))),
    [setTeam]
  );
  return [team, setSlot];
}

export function useRecent(): [number[], (id: number) => void] {
  const [recent, setRecent] = usePersistentState<number[]>("dex.recent", []);
  const push = useCallback(
    (id: number) => setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12)),
    [setRecent]
  );
  return [recent, push];
}

export function useTheme(): ["dark" | "light", () => void] {
  const [theme, setTheme] = usePersistentState<"dark" | "light">("dex.theme", "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [setTheme]
  );
  return [theme, toggle];
}
