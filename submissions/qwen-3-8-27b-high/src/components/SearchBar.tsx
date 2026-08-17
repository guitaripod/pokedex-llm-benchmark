export function SearchBar({
   value, onChange, placeholder, big,
}: {
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   big?: boolean;
}) {
   return (
       <div className={"relative " + (big ? "w-full" : "w-full sm:w-80")}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Search by name or #…"}
            inputMode="text"
            className={
              "w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-8 text-slate-100 " +
              "placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ef5d2e]/60 focus:border-transparent transition " +
              (big ? "py-3.5 text-lg" : "py-2.5 text-sm")
            }
            data-search="1"
          />
          {value && (
            <button
             onClick={() => onChange("")}
             aria-label="Clear"
             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
            >
             ✕
             </button>
          )}
       </div>
    );
}
