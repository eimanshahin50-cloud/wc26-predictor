"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";
export function Button({
  className, variant = "primary", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none";
  const variants: Record<Variant, string> = {
    primary: "bg-accent text-white hover:bg-accent-soft shadow-glow",
    ghost: "bg-white/5 text-white hover:bg-white/10 border border-line",
    outline: "border border-line text-white hover:bg-white/5",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
