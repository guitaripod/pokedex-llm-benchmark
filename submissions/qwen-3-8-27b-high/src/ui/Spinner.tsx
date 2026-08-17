export function Spinner({ label }: { label?: string }) {
   return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-[#ef5d2e]" />
         {label && <span className="text-sm">{label}</span>}
       </div>
   );
}

export function Skeleton({ className = "" }: { className?: string }) {
   return <div className={"animate-pulse rounded-lg bg-slate-700/40 " + className} />;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
   return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
         <div className="text-5xl">🔍</div>
         <p className="text-lg font-semibold text-slate-200">{title}</p>
         {hint && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
   );
}
