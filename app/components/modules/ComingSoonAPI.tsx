"use client";

import { Plug } from "lucide-react";

export function ComingSoonAPI() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <Plug className="w-12 h-12 text-moss mx-auto" />
        <h2 className="text-2xl font-serif text-onyx">API Integration</h2>
        <p className="text-moss text-sm max-w-md">
          Connect directly to your PMS for automated data syncing. Coming soon.
        </p>
      </div>
    </div>
  );
}
