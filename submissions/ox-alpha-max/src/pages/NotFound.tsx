import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="grid place-items-center py-32 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-3xl font-black">404 — Not Found</h1>
      <p className="mt-1 text-muted">This page wandered into the tall grass.</p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-dex-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25 transition-transform hover:scale-105"
      >
        Back to the Dex
      </Link>
    </div>
  );
}
