"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("revfactor_admin_auth");
    if (token === "admin_authenticated") {
      setIsAuthed(true);
    } else {
      setIsAuthed(false);
      router.push("/admin");
    }
  }, [router]);

  if (!isAuthed) return null;

  return <>{children}</>;
}
