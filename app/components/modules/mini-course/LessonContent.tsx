"use client";

import { Lock, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import type { Lesson } from "./lessons";

interface LessonContentProps {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export function LessonContent({
  lesson,
  isCompleted,
  onMarkComplete,
}: LessonContentProps) {
  /* ── Locked lesson ── */
  if (!lesson.available) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-3">
            <Lock className="h-10 w-10 text-moss/40 mx-auto" />
            <h2 className="text-xl font-serif text-onyx">{lesson.title}</h2>
            <p className="text-moss text-sm max-w-sm">
              This lesson is coming soon. Check back later for new content.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Available lesson ── */
  return (
    <Card className="flex-1">
      <CardContent className="py-8 px-6 sm:px-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif text-onyx leading-tight">
            {lesson.title}
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <Clock className="h-3.5 w-3.5 text-moss" />
            <span className="text-xs font-medium text-moss">{lesson.duration}</span>
          </div>
        </div>

        {/* Lesson body */}
        {lesson.content}

        {/* Footer: Mark as Complete */}
        <div className="mt-10 pt-6 border-t border-bone">
          {isCompleted ? (
            <Button variant="ghost" disabled className="gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Completed</span>
            </Button>
          ) : (
            <Button onClick={onMarkComplete} className="gap-2">
              Mark as Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
