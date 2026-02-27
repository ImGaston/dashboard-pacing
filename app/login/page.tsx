"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("revfactor_auth") === "authenticated") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password === process.env.NEXT_PUBLIC_EVENT_PASSWORD) {
      localStorage.setItem("revfactor_auth", "authenticated");
      router.push("/dashboard");
    } else {
      setError("Incorrect password. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cedar flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-3">
          <h1 className="text-5xl font-serif text-bone italic">revfactor</h1>
          <p className="text-bone/50 text-xs font-sans tracking-[0.25em] uppercase">
            intelligent pricing for inspired stays
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            className="bg-white/10 border-bone/20 text-bone placeholder:text-bone/40 focus:ring-bone/30"
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm text-left">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-bone text-cedar hover:bg-white font-bold tracking-widest"
            size="lg"
          >
            {isLoading ? "VERIFYING..." : "ENTER"}
          </Button>
        </form>
      </div>
    </div>
  );
}
