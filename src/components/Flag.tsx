"use client";
import { useState } from "react";

// Provider flag/logo with a graceful fallback to the team's initials.
export function Flag({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-white/80"
      >
        {name.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} width={size} height={size} onError={() => setBroken(true)} className="rounded-full object-cover" style={{ width: size, height: size }} />;
}
