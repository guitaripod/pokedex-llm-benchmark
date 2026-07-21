import { getLocalStorage, setLocalStorage, prefersDark } from './utils';

export interface AppSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  versionGroup: string;
  showShiny: boolean;
  showGenderDifferences: boolean;
  favorites: number[];
  teams: any[];
  searchHistory: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'system',
  versionGroup: 'scarlet-violet',
  showShiny: false,
  showGenderDifferences: true,
  favorites: [],
  teams: [],
  searchHistory: [],
};

export let settings: AppSettings = { ...DEFAULT_SETTINGS };

export function initApp(): Promise<void> {
  return new Promise((resolve) => {
    settings = { ...DEFAULT_SETTINGS, ...getLocalStorage('pokedex-settings', {}) };

    applyTheme(settings.theme);
    applyLanguage(settings.language);

    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    themeMedia.addEventListener('change', () => {
      if (settings.theme === 'system') applyTheme('system');
    });

    resolve();
  });
}

export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;
  const isDark = theme === 'system' ? prefersDark() : theme === 'dark';

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function applyLanguage(lang: string): void {
  document.documentElement.lang = lang;
}

export function updateSettings(newSettings: Partial<AppSettings>): void {
  settings = { ...settings, ...newSettings };
  setLocalStorage('pokedex-settings', settings);

  if (newSettings.theme) applyTheme(newSettings.theme);
  if (newSettings.language) applyLanguage(newSettings.language);
}

export function getSettings(): AppSettings {
  return settings;
}

export function addFavorite(id: number): void {
  if (!settings.favorites.includes(id)) {
    settings.favorites.push(id);
    updateSettings({ favorites: settings.favorites });
  }
}

export function removeFavorite(id: number): void {
  settings.favorites = settings.favorites.filter((f) => f !== id);
  updateSettings({ favorites: settings.favorites });
}

export function isFavorite(id: number): boolean {
  return settings.favorites.includes(id);
}

export function toggleFavorite(id: number): void {
  if (isFavorite(id)) {
    removeFavorite(id);
  } else {
    addFavorite(id);
  }
}

export function addSearchHistory(query: string): void {
  if (!query.trim()) return;
  settings.searchHistory = [query, ...settings.searchHistory.filter((q) => q !== query).slice(0, 19)];
  updateSettings({ searchHistory: settings.searchHistory });
}

export function clearSearchHistory(): void {
  updateSettings({ searchHistory: [] });
}

export function addTeam(team: any): void {
  settings.teams = [team, ...settings.teams];
  updateSettings({ teams: settings.teams });
}

export function updateTeam(teamId: string, updates: any): void {
  settings.teams = settings.teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t));
  updateSettings({ teams: settings.teams });
}

export function removeTeam(teamId: string): void {
  settings.teams = settings.teams.filter((t) => t.id !== teamId);
  updateSettings({ teams: settings.teams });
}

export function getTeams(): any[] {
  return settings.teams;
}

export function getTeam(teamId: string): any | undefined {
  return settings.teams.find((t) => t.id === teamId);
}

export function resetSettings(): void {
  settings = { ...DEFAULT_SETTINGS };
  setLocalStorage('pokedex-settings', settings);
  applyTheme(settings.theme);
}
