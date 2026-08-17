import { useState } from "react";
import { officialArt, homeSprite, defaultSprite } from "../poke";

export function Sprite({
   id, size = 120, variant = "art", rounded = true, className = "",
}: {
   id: number; size?: number;
   variant?: "art" | "home" | "default" | "shiny";
   rounded?: boolean;
   className?: string;
}) {
   const [src, setSrc] = useState(urlFor(id, variant));
   // Fallback chain art -> home -> default sprite on load error.
   const fallbacks =
      variant === "default" ? [defaultSprite(id)]
         : [officialArt(id, variant === "shiny"), homeSprite(id), defaultSprite(id)];
   return (
      <img
         src={src}
         width={size}
         height={size}
         alt=""
         loading="lazy"
         onLoad={() => setSrc(urlFor(id, variant))}
         onError={(e) => {
            const cur = (e.currentTarget as HTMLImageElement).src;
            const idx = fallbacks.findIndex((f) => f.startsWith(cur.split("/").slice(-2).join("/")));
            const next = fallbacks[idx + 1] || defaultSprite(id);
            if (next !== cur) (e.currentTarget as HTMLImageElement).src = next;
          }}
         className={
           `${rounded ? "rounded-2xl" : ""} ${className}`}
          style={{ width: size, height: size }}
       />
    );
}

function urlFor(id: number, variant: string): string {
   if (variant === "home") return homeSprite(id);
   if (variant === "default") return defaultSprite(id);
   return officialArt(id, variant === "shiny");
}
