import { useEffect, useState, useCallback } from "react";

export type Route =
   | { view: "dex" }
   | { view: "pokemon"; id: string }
   | { view: "type" }
   | { view: "compare" };

function parse(hash: string): Route {
   const h = hash.replace(/^#/, "");
   const parts = h.split("/").filter(Boolean);
   if (parts[0] === "pokemon" && parts[1]) return { view: "pokemon", id: parts[1] };
   if (parts[0] === "type") return { view: "type" };
   if (parts[0] === "compare") return { view: "compare" };
   return { view: "dex" };
}

export function useRoute(): [Route, (r: Route) => void] {
   const [route, setRoute] = useState<Route>(() => parse(location.hash));
   useEffect(() => {
      const onHash = () => setRoute(parse(location.hash));
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
   }, []);
   const navigate = useCallback((r: Route) => {
      const hash =
         r.view === "dex" ? "#" :
         r.view === "type" ? "#type" :
         r.view === "compare" ? "#compare" :
         `#pokemon/${r.id}`;
      if (location.hash !== hash) location.hash = hash;
      window.scrollTo(0, 0);
    }, []);
   return [route, navigate];
}
