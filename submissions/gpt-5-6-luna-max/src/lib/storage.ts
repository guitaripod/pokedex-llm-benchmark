const FAVORITES_KEY = "luna-dex-favorites";
const TEAM_KEY = "luna-dex-team";
const THEME_KEY = "luna-dex-theme";

function readNumberList(key: string): number[] {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is number => typeof item === "number");
  } catch {
    return [];
  }
}

function writeNumberList(key: string, value: number[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readFavorites(): number[] {
  return readNumberList(FAVORITES_KEY);
}

export function writeFavorites(value: number[]): void {
  writeNumberList(FAVORITES_KEY, value);
}

export function readTeam(): number[] {
  return readNumberList(TEAM_KEY).slice(0, 6);
}

export function writeTeam(value: number[]): void {
  writeNumberList(TEAM_KEY, value.slice(0, 6));
}

export function readTheme(): "dark" | "light" {
  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function writeTheme(value: "dark" | "light"): void {
  window.localStorage.setItem(THEME_KEY, value);
}
