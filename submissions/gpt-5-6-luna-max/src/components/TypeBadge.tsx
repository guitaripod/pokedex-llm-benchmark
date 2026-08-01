import { formatName, typeClass } from "../lib/pokemon";

interface TypeBadgeProps {
  name: string;
  compact?: boolean;
  onClick?: () => void;
}

export function TypeBadge({ name, compact = false, onClick }: TypeBadgeProps) {
  const content = (
    <span className={`type-badge ${typeClass(name)} ${compact ? "compact" : ""}`}>
      <span className="type-dot" />
      {formatName(name)}
    </span>
  );

  return onClick ? (
    <button className="type-badge-button" onClick={onClick} type="button">
      {content}
    </button>
  ) : (
    content
  );
}
