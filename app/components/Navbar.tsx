"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("revfactor_auth");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-moss/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-serif text-onyx italic">revfactor</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-moss hover:text-cedar gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </nav>
  );
}
