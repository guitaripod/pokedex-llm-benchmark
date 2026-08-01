import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Activity,
  BookOpen,
  ChevronRight,
  Command,
  Compass,
  Heart,
  Menu,
  Moon,
  Search,
  Shapes,
  Sun,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { getPokemon, getPokemonIndex, getPokemonProfile, getType } from "./api/pokeapi";
import { ExploreView } from "./components/ExploreView";
import { PokemonDetailDrawer } from "./components/PokemonDetailDrawer";
import { TeamView } from "./components/TeamView";
import { TypeExplorer } from "./components/TypeExplorer";
import { GENERATIONS, TYPE_NAMES } from "./lib/pokemon";
import { readFavorites, readTeam, readTheme, writeFavorites, writeTeam, writeTheme } from "./lib/storage";
import type { PokemonDetail, PokemonProfile, PokemonSummary, TypeDetail } from "./types";

type View = "explore" | "favorites" | "team" | "types";

const navItems: Array<{ id: View; label: string; note: string; icon: typeof Compass }> = [
  { id: "explore", label: "Explore", note: "Living index", icon: Compass },
  { id: "favorites", label: "Archive", note: "Saved specimens", icon: Heart },
  { id: "team", label: "Squad room", note: "Build your six", icon: UsersRound },
  { id: "types", label: "Type atlas", note: "Matchup system", icon: Shapes },
];

function initialView(): View {
  if (typeof window === "undefined") return "explore";
  const value = new URLSearchParams(window.location.search).get("view");
  return value === "favorites" || value === "team" || value === "types" ? value : "explore";
}

function initialPokemon(): number | null {
  if (typeof window === "undefined") return null;
  const value = Number(new URLSearchParams(window.location.search).get("pokemon"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function App() {
  const [activeView, setActiveView] = useState<View>(initialView);
  const [index, setIndex] = useState<PokemonSummary[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [generation, setGeneration] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("number");
  const [visibleCount, setVisibleCount] = useState(36);
  const [detailMap, setDetailMap] = useState<Record<number, PokemonDetail>>({});
  const [typeDetails, setTypeDetails] = useState<Record<string, TypeDetail>>({});
  const [typeLoading, setTypeLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialPokemon);
  const [profile, setProfile] = useState<PokemonProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => readFavorites());
  const [team, setTeam] = useState<number[]>(() => readTeam());
  const [theme, setTheme] = useState<"dark" | "light">(() => readTheme());
  const [toast, setToast] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIndexLoading(true);
    getPokemonIndex(controller.signal)
      .then((data) => {
        setIndex(data);
        setIndexError(null);
        setIndexLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setIndexError(error instanceof Error ? error.message : "Unable to load the Pokédex");
        setIndexLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (index.length === 0) return;
    let cancelled = false;
    const ids = index.slice(0, 36).map((pokemon) => pokemon.id);
    Promise.allSettled(ids.map((id) => getPokemon(id))).then((results) => {
      if (cancelled) return;
      setDetailMap((current) => {
        const next = { ...current };
        for (const result of results) {
          if (result.status === "fulfilled") next[result.value.id] = result.value;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [index]);

  const typeIds = useMemo(() => {
    if (!typeFilter || !typeDetails[typeFilter]) return null;
    return new Set(typeDetails[typeFilter].pokemon.map((entry) => entry.pokemon.name));
  }, [typeDetails, typeFilter]);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase().replace(/^#/, "");
    const generationOption = GENERATIONS.find((option) => option.value === generation) ?? GENERATIONS[0];
    const filteredIndex = index.filter((pokemon) => {
      const matchesQuery = !normalizedQuery || pokemon.name.includes(normalizedQuery) || String(pokemon.id).includes(normalizedQuery);
      const matchesGeneration = pokemon.id >= generationOption.range[0] && pokemon.id <= generationOption.range[1];
      const matchesType = !typeFilter || (typeIds ? typeIds.has(pokemon.name) : true);
      const matchesArchive = activeView !== "favorites" || favorites.includes(pokemon.id);
      return matchesQuery && matchesGeneration && matchesType && matchesArchive;
    });
    return [...filteredIndex].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return sortBy === "number-desc" ? b.id - a.id : a.id - b.id;
    });
  }, [activeView, deferredQuery, favorites, generation, index, sortBy, typeFilter, typeIds]);

  const previewIds = useMemo(() => filtered.slice(0, visibleCount).map((pokemon) => pokemon.id), [filtered, visibleCount]);

  useEffect(() => {
    const missing = previewIds.filter((id) => !detailMap[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.allSettled(missing.map((id) => getPokemon(id))).then((results) => {
      if (cancelled) return;
      setDetailMap((current) => {
        const next = { ...current };
        for (const result of results) {
          if (result.status === "fulfilled") next[result.value.id] = result.value;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [detailMap, previewIds]);

  useEffect(() => {
    const missing = team.filter((id) => !detailMap[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.allSettled(missing.map((id) => getPokemon(id))).then((results) => {
      if (cancelled) return;
      setDetailMap((current) => {
        const next = { ...current };
        for (const result of results) {
          if (result.status === "fulfilled") next[result.value.id] = result.value;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [detailMap, team]);

  useEffect(() => {
    if (selectedId === null) {
      setProfile(null);
      return;
    }
    const controller = new AbortController();
    setProfileLoading(true);
    setProfileError(null);
    getPokemonProfile(selectedId, controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setProfileLoading(false);
        setDetailMap((current) => ({ ...current, [nextProfile.pokemon.id]: nextProfile.pokemon }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setProfileError(error instanceof Error ? error.message : "Unable to load this field note");
        setProfileLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (activeView !== "types") return;
    const missing = TYPE_NAMES.filter((name) => !typeDetails[name]);
    if (missing.length === 0) return;
    let cancelled = false;
    setTypeLoading(true);
    Promise.allSettled(missing.map((name) => getType(name))).then((results) => {
      if (cancelled) return;
      setTypeDetails((current) => {
        const next = { ...current };
        results.forEach((result) => {
          if (result.status === "fulfilled") next[result.value.name] = result.value;
        });
        return next;
      });
      setTypeLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeView, typeDetails]);

  useEffect(() => {
    if (!typeFilter || typeDetails[typeFilter]) return;
    let cancelled = false;
    getType(typeFilter).then((detail) => {
      if (cancelled) return;
      setTypeDetails((current) => ({ ...current, [detail.name]: detail }));
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [typeDetails, typeFilter]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && selectedId !== null) closeDetails();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    document.title = profile ? `${profile.pokemon.name.charAt(0).toUpperCase()}${profile.pokemon.name.slice(1)} · LunaDex` : "LunaDex · The living Pokédex";
  }, [profile]);

  function showToast(message: string): void {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  function setView(view: View): void {
    startTransition(() => setActiveView(view));
    setVisibleCount(36);
    const params = new URLSearchParams(window.location.search);
    if (view === "explore") params.delete("view");
    else params.set("view", view);
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }

  function selectPokemon(id: number): void {
    setSelectedId(id);
    setProfile(null);
    setProfileLoading(true);
    const params = new URLSearchParams(window.location.search);
    params.set("pokemon", String(id));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function closeDetails(): void {
    setSelectedId(null);
    setProfile(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("pokemon");
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }

  function toggleFavorite(id: number): void {
    const next = favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];
    setFavorites(next);
    writeFavorites(next);
    showToast(favorites.includes(id) ? "Removed from your archive" : "Saved to your archive");
  }

  function toggleTeam(id: number): void {
    if (team.includes(id)) {
      const next = team.filter((teamId) => teamId !== id);
      setTeam(next);
      writeTeam(next);
      showToast("Removed from squad room");
      return;
    }
    if (team.length >= 6) {
      showToast("Your squad is full · remove a member first");
      return;
    }
    const next = [...team, id];
    setTeam(next);
    writeTeam(next);
    showToast("Added to squad room");
  }

  function clearFilters(): void {
    setQuery("");
    setGeneration("all");
    setTypeFilter("");
    setSortBy("number");
    setVisibleCount(36);
  }

  function randomEncounter(): void {
    const pool = filtered.length > 0 ? filtered : index;
    if (pool.length === 0) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) selectPokemon(next.id);
  }

  const currentLabel = navItems.find((item) => item.id === activeView)?.label ?? "Explore";

  return (
    <div className={`app-shell ${isPending ? "is-transitioning" : ""}`}>
      <div className="mobile-topbar"><button className="mobile-brand" type="button" onClick={() => setView("explore")}><span className="brand-mark"><i /><i /><i /></span><strong>Luna<span>Dex</span></strong></button><div className="mobile-actions"><button className="icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button" type="button" onClick={() => searchRef.current?.focus()} aria-label="Focus search"><Search size={18} /></button></div></div>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="brand-lockup"><button className="brand-button" type="button" onClick={() => setView("explore")}><span className="brand-mark"><i /><i /><i /></span><span className="brand-type"><strong>Luna<span>Dex</span></strong><small>Field guide · 2026</small></span></button></div>
          <div className="sidebar-rule" />
          <nav className="primary-nav" aria-label="Primary navigation"><span className="nav-label">Navigate</span>{navItems.map((item) => { const Icon = item.icon; const count = item.id === "favorites" ? favorites.length : item.id === "team" ? team.length : undefined; return <button key={item.id} type="button" className={`nav-item ${activeView === item.id ? "is-active" : ""}`} onClick={() => setView(item.id)}><span className="nav-icon"><Icon size={17} strokeWidth={activeView === item.id ? 2.2 : 1.7} /></span><span className="nav-copy"><strong>{item.label}</strong><small>{item.note}</small></span>{count !== undefined ? <span className="nav-count">{count}</span> : activeView === item.id ? <ChevronRight className="nav-arrow" size={15} /> : null}</button>; })}</nav>
          <div className="sidebar-module"><div className="module-heading"><span>Field status</span><Activity size={14} /></div><div className="status-readout"><span className={`status-light ${online ? "is-online" : "is-offline"}`} /><strong>{online ? "Signal clear" : "Offline mode"}</strong><small>{online ? "Live data link active" : "Cached notes available"}</small></div><div className="module-meter"><span style={{ width: `${index.length ? 100 : 12}%` }} /></div></div>
          <div className="sidebar-bottom"><button className="sidebar-tip" type="button" onClick={() => setView("types")}><span className="tip-icon">✦</span><span><strong>Know your matchups</strong><small>Open the type atlas <ChevronRight size={12} /></small></span></button><div className="sidebar-footer"><span><span className={`connection-dot ${online ? "" : "offline"}`} /> {online ? "Connected to PokéAPI" : "Local cache only"}</span><button className="icon-button subtle" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button></div></div>
        </aside>
        <main className="main-content">
          <header className="global-header"><div className="breadcrumb"><BookOpen size={16} /><span>LunaDex</span><ChevronRight size={13} /><strong>{currentLabel}</strong></div><div className="global-search"><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the field guide…" aria-label="Search the field guide" /><kbd><Command size={11} /> K</kbd>{query ? <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button> : null}</div><div className="header-actions"><span className={`header-status ${online ? "" : "offline"}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? "Live" : "Offline"}</span><button className="header-icon icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button className="header-menu icon-button" type="button" aria-label="Open menu"><Menu size={18} /></button></div></header>
          <div className="content-scroll">
            {indexError ? <div className="catalog-error"><WifiOff size={24} /><h2>The field link is quiet.</h2><p>{indexError}</p><button className="button secondary" type="button" onClick={() => window.location.reload()}>Reconnect</button></div> : null}
            {!indexError && activeView === "explore" ? <ExploreView index={index} filtered={filtered} details={detailMap} query={query} generation={generation} typeFilter={typeFilter} sortBy={sortBy} visibleCount={visibleCount} favoriteIds={favorites} teamIds={team} loading={indexLoading} onQueryChange={setQuery} onGenerationChange={(value) => { setGeneration(value); setVisibleCount(36); }} onTypeChange={(value) => { setTypeFilter(value); setVisibleCount(36); }} onSortChange={(value) => setSortBy(value)} onVisibleCountChange={() => setVisibleCount((count) => count + 36)} onSelectPokemon={selectPokemon} onFavorite={toggleFavorite} onTeam={toggleTeam} onRandom={randomEncounter} onClearFilters={clearFilters} /> : null}
            {!indexError && activeView === "favorites" ? <div className="archive-view"><section className="page-intro"><div><span className="eyebrow"><span className="eyebrow-mark" /> Personal archive</span><h1>Keep the <em>remarkable.</em></h1><p>Your hand-picked index of species worth another look. Favorites stay on this device, quietly waiting for your next field session.</p></div><div className="archive-count"><Heart size={20} /><strong>{favorites.length}</strong><span>saved specimens</span></div></section><ExploreView index={index} filtered={filtered} details={detailMap} query={query} generation={generation} typeFilter={typeFilter} sortBy={sortBy} visibleCount={visibleCount} favoriteIds={favorites} teamIds={team} loading={indexLoading} onQueryChange={setQuery} onGenerationChange={(value) => { setGeneration(value); setVisibleCount(36); }} onTypeChange={(value) => { setTypeFilter(value); setVisibleCount(36); }} onSortChange={setSortBy} onVisibleCountChange={() => setVisibleCount((count) => count + 36)} onSelectPokemon={selectPokemon} onFavorite={toggleFavorite} onTeam={toggleTeam} onRandom={randomEncounter} onClearFilters={clearFilters} /></div> : null}
            {!indexError && activeView === "team" ? <TeamView teamIds={team} details={detailMap} onSelectPokemon={selectPokemon} onRemove={toggleTeam} onClear={() => { setTeam([]); writeTeam([]); showToast("Squad room cleared"); }} onBrowse={() => setView("explore")} /> : null}
            {!indexError && activeView === "types" ? <TypeExplorer typeDetails={typeDetails} loading={typeLoading} index={index} onSelectPokemon={selectPokemon} /> : null}
          </div>
        </main>
      </div>
      {selectedId !== null ? <PokemonDetailDrawer profile={profile} loading={profileLoading} error={profileError} favorite={favorites.includes(selectedId)} inTeam={team.includes(selectedId)} onClose={closeDetails} onSelectPokemon={selectPokemon} onFavorite={toggleFavorite} onTeam={toggleTeam} /> : null}
      {toast ? <div className="toast"><span className="toast-mark">✦</span>{toast}</div> : null}
    </div>
  );
}

export default App;
