"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, scope: "admin" }),
      });

      if (res.ok) {
        router.push("/admin/course");
      } else {
        setError("Incorrect admin password.");
        setIsLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cedar flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo + Admin badge */}
        <div className="space-y-3">
          <h1 className="text-5xl font-serif text-bone italic">revfactor</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase bg-bone/15 text-bone/80 px-3 py-1 rounded-full">
              Admin
            </span>
          </div>
          <p className="text-bone/50 text-xs font-sans tracking-[0.25em] uppercase">
            course management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            className="bg-white/10 border-bone/20 text-bone placeholder:text-bone/40 focus:ring-bone/30"
            autoFocus
          />

          {error && (
            <p className="text-error-bg text-sm text-left">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-bone text-cedar hover:bg-bone-light font-bold tracking-widest"
            size="lg"
          >
            {isLoading ? "VERIFYING..." : "ENTER"}
          </Button>
        </form>

        {/* Back link */}
        <a
          href="/login"
          className="text-bone/40 text-xs hover:text-bone/60 transition-colors underline underline-offset-2"
        >
          ← Back to dashboard login
        </a>
      </div>
    </div>
  );
}
