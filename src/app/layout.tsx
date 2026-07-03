import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WC26 Predictor — Amateur vs nxtmv",
  description: "A private FIFA World Cup 2026 prediction duel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
