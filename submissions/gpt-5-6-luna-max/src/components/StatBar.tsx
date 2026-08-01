import { formatStatName } from "../lib/pokemon";

interface StatBarProps {
  name: string;
  value: number;
  max?: number;
}

export function StatBar({ name, value, max = 255 }: StatBarProps) {
  const width = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="stat-row">
      <div className="stat-label"><span>{formatStatName(name)}</span><strong>{value}</strong></div>
      <div className="stat-track"><span style={{ width: `${width}%` }} /></div>
    </div>
  );
}
