import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Moon, Sun, Shuffle, Github } from "lucide-react";
import { useTheme } from "../lib/store";
import { BASE_DEX } from "../lib/data";

const NAV = [
  { to: "/", label: "Dex" },
  { to: "/moves", label: "Moves" },
  { to: "/abilities", label: "Abilities" },
  { to: "/types", label: "Types" },
  { to: "/items", label: "Items" },
  { to: "/berries", label: "Berries" },
  { to: "/team", label: "Team" },
  { to: "/compare", label: "Compare" },
];

export function Layout() {
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();

  const random = () => {
    const p = BASE_DEX[Math.floor(Math.random() * BASE_DEX.length)];
    navigate(`/pokemon/${p.i}`);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-50 border-b border-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-dex-red to-red-800 shadow-lg shadow-dex-red/30 transition-transform group-hover:rotate-[25deg]">
              <span className="absolute inset-[3px] rounded-full border-2 border-white/90" />
              <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/20" />
            </span>
            <span className="hidden text-sm font-extrabold uppercase tracking-widest sm:block">
              Ox<span className="text-dex-red">·</span>Alpha<span className="text-dex-gold">·</span>Max
            </span>
          </Link>

          <nav className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-dex-red/10 text-dex-red"
                      : "text-muted hover:bg-panel-2 hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={random}
              title="Random Pokemon"
              aria-label="Random Pokemon"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-2 hover:text-dex-gold"
            >
              <Shuffle className="h-4.5 w-4.5" />
            </button>
            <a
              href="https://github.com/guitaripod/pokedex-ox-alpha-max"
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              className="hidden h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-2 hover:text-ink sm:grid"
            >
              <Github className="h-4.5 w-4.5" />
            </a>
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-2 hover:text-ink"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted sm:flex-row">
          <p>
            <span className="font-bold">Pokedex Ox Alpha Max</span> — data from{" "}
            <a href="https://pokeapi.co" target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-dex-red">
              PokeAPI
            </a>
            . Pokemon © Nintendo / Game Freak.
          </p>
          <p>Built with React + Cloudflare Pages</p>
        </div>
      </footer>
    </div>
  );
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
