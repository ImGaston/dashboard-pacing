"use client";

import { TrendingUp } from "lucide-react";

export function RevenueTracker() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <TrendingUp className="w-12 h-12 text-moss mx-auto" />
        <h2 className="text-2xl font-serif text-onyx">Revenue Tracker</h2>
        <p className="text-moss text-sm max-w-md">
          Track real-time revenue performance across all your properties. Coming soon.
        </p>
      </div>
    </div>
  );
}
