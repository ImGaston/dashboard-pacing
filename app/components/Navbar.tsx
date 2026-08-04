"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Calendar } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScheduleModal } from "@/app/components/ScheduleModal";

interface NavbarProps {
  children?: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleLogout = async () => {
    // Clean up the legacy localStorage token from the old client-side gate
    localStorage.removeItem("revfactor_auth");
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "event" }),
    }).catch(() => {});
    router.push("/login");
  };

  // Close menu when a tab is clicked (mobile)
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[role='tab']")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  return (
    <div className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3">
      <div className="max-w-7xl mx-auto relative">
        {/* Nav pill */}
        <nav className="bg-bone-light/80 backdrop-blur-md border border-bone-dark/30 rounded-full px-5 py-2 flex items-center gap-4 transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
          <Image
            src="/RevFactor_SecondaryLogo_Cedar.png"
            alt="RevFactor"
            width={120}
            height={28}
            className="h-7 w-auto shrink-0"
            priority
          />

          {/*
            Tabs container — single render:
            - md+: inline in the pill (flex row, centered)
            - <md: absolutely positioned as dropdown below the pill
          */}
          {children && (
            <div
              className={`
                md:static md:flex-1 md:flex md:justify-center md:overflow-x-auto md:scrollbar-none
                md:opacity-100 md:pointer-events-auto md:max-h-none md:mt-0
                md:bg-transparent md:border-0 md:rounded-none md:p-0 md:backdrop-blur-none

                absolute left-0 right-0 top-full mt-2
                overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                bg-bone-light/95 backdrop-blur-md border border-bone-dark/30 rounded-m px-4 py-3
                [&_[role=tablist]]:max-md:flex [&_[role=tablist]]:max-md:flex-col [&_[role=tablist]]:max-md:gap-1
                [&_[role=tablist]]:max-md:!rounded-none
                [&_[role=tab]]:max-md:w-full [&_[role=tab]]:max-md:justify-start [&_[role=tab]]:max-md:!rounded-xl
                ${menuOpen
                  ? "max-h-60 opacity-100"
                  : "max-md:max-h-0 max-md:opacity-0 max-md:pointer-events-none max-md:py-0 max-md:border-0"
                }
              `}
            >
              {children}
            </div>
          )}

          {/* Mobile spacer */}
          {children && <div className="flex-1 md:hidden" />}

          {/* Mobile hamburger */}
          {children && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden relative w-[18px] h-[18px] text-tobacco shrink-0"
              aria-label="Toggle menu"
            >
              <span
                className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
                style={{
                  top: menuOpen ? "8.25px" : "3.25px",
                  transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition:
                    "top 300ms cubic-bezier(0.25,0.1,0.25,1), transform 300ms cubic-bezier(0.25,0.1,0.25,1)",
                }}
              />
              <span
                className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current top-[8.25px]"
                style={{
                  opacity: menuOpen ? 0 : 1,
                  transition: "opacity 200ms cubic-bezier(0.25,0.1,0.25,1)",
                }}
              />
              <span
                className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
                style={{
                  top: menuOpen ? "8.25px" : "13.25px",
                  transform: menuOpen ? "rotate(-45deg)" : "rotate(0deg)",
                  transition:
                    "top 300ms cubic-bezier(0.25,0.1,0.25,1), transform 300ms cubic-bezier(0.25,0.1,0.25,1)",
                }}
              />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSchedule(true)}
            data-umami-event="Book a Call"
            className="text-cedar hover:text-cedar/80 gap-2 text-[9px] uppercase tracking-[2px] rounded-full shrink-0"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Book a Call</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-umami-event="Logout"
            className="text-walnut hover:text-cedar gap-2 text-[9px] uppercase tracking-[2px] rounded-full shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </nav>
      </div>

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} />}
    </div>
  );
}
