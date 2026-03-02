"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("revfactor_admin_auth") === "admin_authenticated") {
      router.push("/admin/course");
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      console.warn(
        "[Admin] NEXT_PUBLIC_ADMIN_PASSWORD is not set. Restart the dev server after updating .env.local"
      );
    }

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem("revfactor_admin_auth", "admin_authenticated");
      router.push("/admin/course");
    } else {
      setError("Incorrect admin password.");
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
