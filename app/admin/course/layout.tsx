"use client";

import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import { AdminGuard } from "@/app/components/AdminGuard";
import { Button } from "@/app/components/ui/button";

function AdminNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("revfactor_admin_auth");
    router.push("/admin");
  };

  return (
    <header className="sticky top-0 z-50 bg-bone-light/80 backdrop-blur-md border-b border-bone-dark">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: logo + badge */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-moss group-hover:text-cedar transition-colors" />
            <span className="text-xl font-serif text-cedar italic">
              revfactor
            </span>
          </a>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase bg-cedar text-bone px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-moss hover:text-cedar"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function CourseAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-bone">
        <AdminNavbar />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
