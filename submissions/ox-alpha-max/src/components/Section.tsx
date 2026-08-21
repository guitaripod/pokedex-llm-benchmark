import type { ReactNode } from "react";

export function Section({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-4 sm:p-5 ${className}`}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold capitalize" title={typeof value === "string" ? value : undefined}>
        {value}
      </p>
    </div>
  );
}
