import { officialArt, gen1Sprite } from "../poke";
import { TypeBadge } from "./../ui/TypeBadge";

// Lightweight card that shows number + sprite + name, with optional type chips.
// Full data (types/stats) is only fetched when a card opens the detail view.
export function Card({
   id, name, onOpen, art = true,
}: {
   id: number;
   name: string;
   onOpen: () => void;
   art?: boolean;
}) {
   return (
        <button
          onClick={onOpen}
          data-card={id}
          className={
             "group relative flex flex-col items-center rounded-2xl p-3 bg-gradient-to-b " +
             "from-white/5 to-white/0 border border-white/5 hover:border-[#ef5d2e]/40 " +
             "hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(239,93,46,0.5)] transition-all duration-200 " +
             "focus:outline-none focus:ring-2 focus:ring-[#ef5d2e]"
          }
        >
          <span className="absolute top-2 left-2 text-[11px] font-mono text-slate-500 tabular-nums">
            #{String(id).padStart(3, "0")}
            </span>
          <div
            className="relative flex items-center justify-center my-1"
            style={{ width: 96, height: 96 }}
            aria-label=""
          >
            <img
               src={art ? officialArt(id) : gen1Sprite(id)}
               width={96}
               height={96}
               alt={name}
               loading="lazy"
               className="transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
             />
          </div>
          <span className="text-sm font-semibold capitalize text-slate-100 leading-tight text-center truncate w-full">
            {name}
            </span>
        </button>
     );
}
