"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="relative inline-block">
            <Image
              src="/revfactor-logo.png"
              alt="RevFactor"
              width={280}
              height={83}
              className="mx-auto"
              priority
            />
            <Image
              src="/summit-badge.png"
              alt="Summit"
              width={120}
              height={110}
              className="absolute -right-16 -top-18 rotate-[20deg]"
              priority
            />
          </div>
          <p className="text-bone/50 text-xs font-sans tracking-[0.25em] uppercase">
            intelligent pricing for inspired stays
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="bg-white/10 border-bone/20 text-bone placeholder:text-bone/40 focus:ring-bone/30 pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bone/40 hover:text-bone transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

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
      </div>
    </div>
  );
}
