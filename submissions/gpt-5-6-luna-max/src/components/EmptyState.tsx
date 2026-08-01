import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><SearchX size={24} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <button className="button secondary" type="button" onClick={action.onClick}>{action.label}</button> : null}
    </div>
  );
}
