"use client";

import { GraduationCap } from "lucide-react";

export function MiniCourse() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <GraduationCap className="w-12 h-12 text-moss mx-auto" />
        <h2 className="text-2xl font-serif text-onyx">Mini Course</h2>
        <p className="text-moss text-sm max-w-md">
          Learn revenue management strategies for short-term rentals. Coming soon.
        </p>
      </div>
    </div>
  );
}
