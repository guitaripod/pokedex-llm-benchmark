import { Link } from "react-router-dom";
import { ArrowRight, GitBranch } from "lucide-react";
import type { ChainLink } from "../lib/types";
import { DEX_BY_NAME, artworkUrl } from "../lib/data";
import { evolutionText, formatName } from "../lib/utils";
import { Sprite } from "./Sprite";

function Node({ link }: { link: ChainLink }) {
  const entry = DEX_BY_NAME.get(link.species.name);
  return (
    <div className="flex flex-col items-center gap-1">
      <Link
        to={`/pokemon/${entry?.i ?? link.species.name}`}
        className="group relative grid h-20 w-20 place-items-center rounded-2xl border border-line bg-panel-2 transition-all hover:-translate-y-0.5 hover:border-dex-red/40 hover:shadow-lg"
      >
        {entry ? (
          <Sprite src={artworkUrl(entry.i)} alt={link.species.name} className="h-16 w-16" />
        ) : (
          <GitBranch className="h-6 w-6 text-muted" />
        )}
      </Link>
      <p className="max-w-24 truncate text-center text-xs font-bold">{formatName(link.species.name)}</p>
    </div>
  );
}

function Branch({ link }: { link: ChainLink }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Node link={link} />
      {link.evolves_to.map((child) => (
        <div key={child.species.name} className="flex items-center gap-2 sm:gap-3">
          <EvolutionArrow details={child.evolution_details} />
          <Branch link={child} />
        </div>
      ))}
    </div>
  );
}

function EvolutionArrow({ details }: { details: ChainLink["evolution_details"] }) {
  const d = details[0];
  const parts = d ? evolutionText(d) : [];
  return (
    <div className="flex max-w-36 flex-col items-center gap-0.5 text-center">
      {parts.map((p) => (
        <span key={p} className="rounded-full bg-panel-2 px-2 py-0.5 text-[10px] font-semibold capitalize leading-tight text-muted">
          {p}
        </span>
      ))}
      <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
    </div>
  );
}

export function EvolutionView({ chain }: { chain: ChainLink }) {
  return (
    <div className="no-scrollbar overflow-x-auto">
      <div className="flex min-w-max items-start gap-3 py-2">
        <Branch link={chain} />
      </div>
    </div>
  );
}
