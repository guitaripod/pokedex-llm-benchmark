import { useState } from "react";

export function Sprite({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className={`relative inline-block ${className}`}>
      {!loaded && !failed && <span className="skeleton absolute inset-0 rounded-2xl" />}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : failed ? "opacity-0" : "opacity-0"}`}
      />
      {failed && (
        <span className="absolute inset-0 grid place-items-center text-[10px] text-muted">—</span>
      )}
    </span>
  );
}
