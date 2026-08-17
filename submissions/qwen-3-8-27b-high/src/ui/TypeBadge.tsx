import type { TypeName } from "../types";
import { TYPE_COLORS, TYPE_GLYPH } from "../poke";

export function TypeBadge({
   type, size = "md", onClick, active,
}: {
   type: string;
   size?: "sm" | "md" | "lg";
   onClick?: () => void;
   active?: boolean;
}) {
   const color = TYPE_COLORS[type as TypeName] || "#667";
   const dims =
       size === "sm" ? "px-2 py-0.5 text-[11px]"
          : size === "lg" ? "px-4 py-1.5 text-sm"
            : "px-3 py-1 text-xs";
   return (
      <button
         type="button"
         onClick={onClick}
         disabled={!onClick}
         className={
           `inline-flex items-center gap-1 rounded-full font-semibold text-white shadow-sm ` +
           `${dims} ${onClick ? "cursor-pointer hover:brightness-110 active:scale-95 transition" : ""} ` +
           `${active ? "ring-2 ring-white ring-offset-2 ring-offset-[#141a2e]" : ""}`
          }
         style={{ background: color }}
          aria-label={type}
       >
        <span className="text-[0.9em] leading-none">{TYPE_GLYPH[type as TypeName] || "?"}</span>
        <span className="capitalize tracking-wide">{type}</span>
      </button>
   );
}
