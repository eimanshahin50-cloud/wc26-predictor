"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true); setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Wrong username or password.");
    else router.push("/");
  }

  return (
    <main className="mx-auto mt-16 max-w-sm space-y-4 animate-fade-up">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="muted text-sm">Sign in as Amateur or nxtmv</p>
      </div>
      <div className="card space-y-3 p-5">
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input placeholder="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {error && <p className="text-sm text-live">{error}</p>}
        <Button className="w-full" onClick={submit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </main>
  );
}
