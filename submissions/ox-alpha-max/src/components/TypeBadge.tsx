import { formatName } from "../lib/utils";

export function TypeBadge({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider text-white shadow-sm ${sizes[size]}`}
      style={{
        background: `linear-gradient(135deg, var(--color-t-${type}), color-mix(in srgb, var(--color-t-${type}) 70%, black))`,
        textShadow: "0 1px 2px rgba(0,0,0,.35)",
      }}
    >
      <TypeIcon type={type} className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {formatName(type)}
    </span>
  );
}

const ICON_PATHS: Record<string, string> = {
  normal: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 5a4 4 0 110 8 4 4 0 010-8z",
  fire: "M12 2c1 3-1 4-1 6a3 3 0 006 .5C19 10 21 12 21 15a9 9 0 01-18 0c0-3 2-5.5 4-7 .5 1.5 1.5 2 2.5 2C9 7 10 4 12 2z",
  water: "M12 2s7 7.5 7 13a7 7 0 01-14 0c0-5.5 7-13 7-13z",
  electric: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  grass: "M12 22c-4 0-7-3-7-7 0-6 7-13 7-13s7 7 7 13c0 4-3 7-7 7zm0-3c2 0 4-2 4-4 0-3-2.5-6.5-4-8.5C10.5 8.5 8 12 8 15c0 2 2 4 4 4z",
  ice: "M12 2v20M4 6l16 12M20 6L4 18M12 2l-2 3m2-3l2 3M12 22l-2-3m2 3l2-3M4 6l3.5.5M4 6l.5 3.5M20 6l-3.5.5m3.5-.5l-.5 3.5M4 18l3.5-.5M4 18l.5-3.5m15.5 4l-3.5-.5m3.5.5l-.5-3.5",
  fighting: "M12 2a4 4 0 014 4v2h2a3 3 0 013 3v3a8 8 0 01-8 8h-2a8 8 0 01-8-8v-3a3 3 0 013-3h2V6a4 4 0 014-4z",
  poison: "M12 2a7 7 0 00-7 7c0 2 .8 3.5 2 4.7A7 7 0 1012 22a7 7 0 105-8.3c1.2-1.2 2-2.7 2-4.7a7 7 0 00-7-7z",
  ground: "M3 20c2-6 5-9 9-9s7 3 9 9H3zm9-11a4 4 0 110-8 4 4 0 010 8z",
  flying: "M2 16l8-2 4-8 2 6 6-2-6 6-8 2-4 4 2-6H2z",
  psychic: "M12 2a10 10 0 00-4 19.2c.5.2 1-.2 1-.7v-2c-3 .7-4-1.5-4-1.5-.5-1.2-1.2-1.5-1.2-1.5-1-.7 0-.7 0-.7 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.4-.3-5-1.2-5-5.4 0-1.2.4-2.2 1.1-2.9-.1-.3-.5-1.5.1-3 0 0 1-.3 3.1 1.1a10 10 0 015.6 0C17.3 4.7 18.3 5 18.3 5c.6 1.5.2 2.7.1 3 .7.7 1.1 1.7 1.1 2.9 0 4.2-2.6 5.1-5 5.4.4.4.8 1 .8 2.1v3.1c0 .5.5 1 1 .7A10 10 0 0012 2z",
  bug: "M12 2a5 5 0 015 5v1h2v2h-2v1a6 6 0 01-.4 2.2l1.9 1.1-1 1.7-2-1.2A6 6 0 0113 17v3h-2v-3a6 6 0 01-2.5-1.2l-2 1.2-1-1.7 1.9-1.1A6 6 0 017 11v-1H5V8h2V7a5 5 0 015-5z",
  rock: "M12 2l8 6-2 12H6L4 8l8-6z",
  ghost: "M12 2a8 8 0 00-8 8v10l3-2 2.5 2L12 18l2.5 2L17 18l3 2V10a8 8 0 00-8-8zm-3 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z",
  dragon: "M4 4c6 0 10 2 12 6l4 2-4 2c-1 4-5 6-9 6l2-4c-3-1-5-4-5-8V4z",
  dark: "M12 2a10 10 0 100 20c2 0 4-.6 5.6-1.6A8 8 0 0112 18a8 8 0 010-16c2.1 0 4.1.8 5.6 2.2A10 10 0 0012 2z",
  steel: "M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z",
  fairy: "M12 2l2.4 5.9L20 9l-4.4 3.6L17 19l-5-3.2L7 19l1.4-6.4L4 9l5.6-1.1L12 2z",
};

export function TypeIcon({ type, className = "h-3 w-3" }: { type: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden>
      <path d={ICON_PATHS[type] ?? ICON_PATHS.normal} strokeWidth={ICON_PATHS[type] === ICON_PATHS.ice ? 1.5 : 0} strokeLinecap="round" strokeLinejoin="round" fill={ICON_PATHS[type] === ICON_PATHS.ice ? "none" : "currentColor"} stroke="currentColor" />
    </svg>
  );
}
