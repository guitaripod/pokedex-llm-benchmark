import { Suspense, lazy, useEffect, useState } from "react";
import { useRoute } from "./useRoute";
import { Navigation } from "./components/Navigation";
import { Dex } from "./views/Dex";

const PokemonDetail = lazy(() =>
     import("./views/PokemonDetail").then((m) => ({ default: m.PokemonDetail })));
const TypeChart = lazy(() =>
     import("./views/TypeChart").then((m) => ({ default: m.TypeChart })));
const Compare = lazy(() =>
     import("./views/Compare").then((m) => ({ default: m.Compare })));

export function App() {
   const [route, navigate] = useRoute();
   const [total, setTotal] = useState(1025);

   useEffect(() => {
      fetch("/api/pokemon")
           .then((r) => r.json())
           .then((d: any) => {
            if (Array.isArray(d) && d.length) setTotal(d.length);
             })
           .catch(() => {});
            if (navigator.onLine)
             document.documentElement.setAttribute("data-online", "1");
          }, []);

   return (
         <div className="min-h-screen">
            <Navigation route={route} navigate={navigate} total={total} />
            <main className="pb-16">
              <Suspense
               fallback={
                  <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
                     <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#ef5d2e] align-[-4px] mr-2" />
                     Loading…
                  </div>
                  }
              >
                {route.view === "dex" && <Dex navigate={navigate} />}
                {route.view === "type" && <TypeChart />}
                {route.view === "compare" && <Compare navigate={navigate} />}
                {route.view === "pokemon" && <PokemonDetail navigate={navigate} id={route.id} />}
             </Suspense>
         </main>
       </div>
    );
}
