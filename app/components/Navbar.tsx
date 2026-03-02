"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface NavbarProps {
  children?: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("revfactor_auth");
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3">
      <nav className="max-w-7xl mx-auto bg-bone-light/80 backdrop-blur-md border border-bone-dark/30 rounded-full px-5 py-2 flex items-center gap-4 transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
        <Image
          src="/RevFactor_SecondaryLogo_Cedar.png"
          alt="RevFactor"
          width={120}
          height={28}
          className="h-7 w-auto shrink-0"
          priority
        />

        {/* Tabs (center) */}
        {children && (
          <div className="flex-1 flex justify-center overflow-x-auto scrollbar-none">
            {children}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-walnut hover:text-cedar gap-2 text-[9px] uppercase tracking-[2px] rounded-full shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </nav>
    </div>
  );
}
