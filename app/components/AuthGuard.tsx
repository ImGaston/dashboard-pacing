"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("revfactor_auth");
    if (token === "authenticated") {
      setIsAuthed(true);
    } else {
      setIsAuthed(false);
      router.push("/login");
    }
  }, [router]);

  if (!isAuthed) {
    return null;
  }

  return <>{children}</>;
}
