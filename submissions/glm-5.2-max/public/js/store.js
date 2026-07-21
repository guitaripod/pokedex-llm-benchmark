const FAV_KEY = "pokedex_favorites";
const TEAMS_KEY = "pokedex_teams";
const THEME_KEY = "pokedex_theme";
const SETTINGS_KEY = "pokedex_settings";
const CURRENT_TEAM_KEY = "pokedex_current_team";

function load(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export const store = {
  _favorites: new Set(load(FAV_KEY, [])),
  _teams: load(TEAMS_KEY, { default: [] }),
  _currentTeam: load(CURRENT_TEAM_KEY, "default"),
  _theme: load(THEME_KEY, "dark"),
  _settings: load(SETTINGS_KEY, { shinyDefault: false }),
  _listeners: new Map(),

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
  },

  emit(event, data) {
    const callbacks = this._listeners.get(event);
    if (callbacks) callbacks.forEach((cb) => cb(data));
  },

  getFavorites() {
    return [...this._favorites].sort((a, b) => a - b);
  },

  isFavorite(id) {
    return this._favorites.has(id);
  },

  toggleFavorite(id) {
    const wasFav = this._favorites.has(id);
    if (wasFav) this._favorites.delete(id);
    else this._favorites.add(id);
    save(FAV_KEY, [...this._favorites]);
    this.emit("favorites", { id, isFav: !wasFav });
    return !wasFav;
  },

  getTeams() {
    return this._teams;
  },

  getTeamNames() {
    return Object.keys(this._teams);
  },

  getCurrentTeamName() {
    return this._currentTeam;
  },

  setCurrentTeam(name) {
    if (this._teams[name]) {
      this._currentTeam = name;
      save(CURRENT_TEAM_KEY, name);
      this.emit("team", this.getCurrentTeam());
    }
  },

  getCurrentTeam() {
    return this._teams[this._currentTeam] || [];
  },

  addToTeam(pokemon) {
    const team = this.getCurrentTeam();
    if (team.length >= 6) return false;
    if (team.some((p) => p.id === pokemon.id)) return false;
    team.push(pokemon);
    this._teams[this._currentTeam] = team;
    save(TEAMS_KEY, this._teams);
    this.emit("team", team);
    return true;
  },

  removeFromTeam(id) {
    const team = this.getCurrentTeam();
    this._teams[this._currentTeam] = team.filter((p) => p.id !== id);
    save(TEAMS_KEY, this._teams);
    this.emit("team", this.getCurrentTeam());
  },

  clearTeam() {
    this._teams[this._currentTeam] = [];
    save(TEAMS_KEY, this._teams);
    this.emit("team", []);
  },

  createTeam(name) {
    if (this._teams[name]) return false;
    this._teams[name] = [];
    save(TEAMS_KEY, this._teams);
    this._currentTeam = name;
    save(CURRENT_TEAM_KEY, name);
    this.emit("team", []);
    return true;
  },

  deleteTeam(name) {
    if (name === "default") return false;
    delete this._teams[name];
    if (this._currentTeam === name) {
      this._currentTeam = "default";
      save(CURRENT_TEAM_KEY, "default");
    }
    save(TEAMS_KEY, this._teams);
    this.emit("team", this.getCurrentTeam());
    return true;
  },

  getTheme() {
    return this._theme;
  },

  setTheme(theme) {
    this._theme = theme;
    save(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    this.emit("theme", theme);
  },

  toggleTheme() {
    this.setTheme(this._theme === "dark" ? "light" : "dark");
  },

  getSettings() {
    return this._settings;
  },

  updateSettings(partial) {
    this._settings = { ...this._settings, ...partial };
    save(SETTINGS_KEY, this._settings);
    this.emit("settings", this._settings);
  },

  init() {
    document.documentElement.setAttribute("data-theme", this._theme);
  },
};
