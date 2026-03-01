"use client";

import { CheckCircle2, Lock } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import type { Lesson } from "./lessons";

interface LessonSidebarProps {
  lessons: Lesson[];
  activeLessonId: string;
  completedLessons: string[];
  onSelect: (lessonId: string) => void;
}

export function LessonSidebar({
  lessons,
  activeLessonId,
  completedLessons,
  onSelect,
}: LessonSidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar (hidden below md) ── */}
      <aside className="hidden md:block w-72 shrink-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <nav className="space-y-1 pr-3">
            {lessons.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              const isCompleted = completedLessons.includes(lesson.id);
              const isLocked = !lesson.available;

              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    if (!isLocked) onSelect(lesson.id);
                  }}
                  disabled={isLocked}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors text-sm",
                    "border-l-2 border-transparent",
                    isActive && "bg-cedar/5 border-l-cedar text-cedar",
                    !isActive && !isLocked && "hover:bg-bone/60 text-tobacco",
                    isLocked && "opacity-50 cursor-not-allowed text-moss"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {isLocked ? (
                        <Lock className="h-4 w-4 text-moss" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2",
                            isActive ? "border-cedar" : "border-moss/30"
                          )}
                        />
                      )}
                    </div>

                    {/* Title + duration */}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-medium leading-tight",
                          isActive && "text-cedar",
                          isCompleted && !isActive && "text-tobacco"
                        )}
                      >
                        {lesson.title}
                      </p>
                      <p className="text-xs text-moss mt-0.5">
                        {lesson.duration}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* ── Mobile dropdown (visible below md) ── */}
      <div className="md:hidden w-full">
        <Select value={activeLessonId} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isLocked = !lesson.available;
              return (
                <SelectItem
                  key={lesson.id}
                  value={lesson.id}
                  disabled={isLocked}
                >
                  <span className="flex items-center gap-2">
                    {isLocked && <Lock className="h-3 w-3 text-moss" />}
                    {isCompleted && !isLocked && (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    )}
                    <span className={isLocked ? "text-moss" : ""}>
                      {lesson.title}
                    </span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
