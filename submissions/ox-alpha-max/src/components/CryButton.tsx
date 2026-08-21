import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";

export function CryButton({ url, className = "" }: { url: string | null | undefined; className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!url) return null;

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
      audioRef.current.addEventListener("error", () => setPlaying(false));
    }
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  };

  return (
    <button
      onClick={play}
      title="Play cry"
      aria-label="Play Pokemon cry"
      className={`relative grid h-10 w-10 place-items-center rounded-full border border-line bg-panel text-muted transition-all hover:text-dex-red ${playing ? "text-dex-red pulse-ring" : ""} ${className}`}
    >
      <Volume2 className="h-5 w-5" />
    </button>
  );
}
