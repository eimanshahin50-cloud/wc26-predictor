import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "rgba(255,255,255,0.04)",
        line: "rgba(255,255,255,0.08)",
        accent: { DEFAULT: "#7c5cff", soft: "#a48bff" },
        win: "#22c55e", live: "#ef4444",
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(124,92,255,0.4)" },
      backdropBlur: { xs: "2px" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulse2: { "50%": { opacity: ".5" } },
      },
      animation: { "fade-up": "fade-up .4s ease both", live: "pulse2 1.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
