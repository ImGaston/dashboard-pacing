"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { CheckCircle2, Lock, Mail, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import type { UnifiedLesson } from "../MiniCourse";
import type { ModuleWithLessons } from "@/types/course";

interface LessonSidebarProps {
  lessons: UnifiedLesson[];
  modules: ModuleWithLessons[] | null;
  activeLessonId: string;
  completedLessons: string[];
  onSelect: (lessonId: string) => void;
  /** Lesson IDs that require email subscription to access. */
  gatedLessonIds?: Set<string>;
  /** Whether the email gate has been unlocked. */
  isGateUnlocked?: boolean;
}

/* ── Shared render for a single lesson button ── */
function LessonButton({
  lesson,
  isActive,
  isCompleted,
  isLocked,
  isGated,
  onClick,
}: {
  lesson: UnifiedLesson;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  /** True when lesson requires email but user hasn't subscribed yet. */
  isGated: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg transition-colors text-sm",
        "border-l-2 border-transparent",
        isActive && "bg-cedar/5 border-l-cedar text-cedar",
        !isActive && !isLocked && !isGated && "hover:bg-bone-muted/60 text-tobacco",
        !isActive && isGated && "hover:bg-cedar/5 text-moss cursor-pointer",
        isLocked && "opacity-50 cursor-not-allowed text-moss"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {isLocked ? (
            <Lock className="h-4 w-4 text-moss" />
          ) : isGated ? (
            <Mail className="h-4 w-4 text-cedar/60" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2",
                isActive ? "border-cedar" : "border-bone-dark"
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
              isGated && !isActive && "text-moss",
              isCompleted && !isActive && "text-tobacco"
            )}
          >
            {lesson.title}
          </p>
          <p className="text-xs text-moss mt-0.5">{lesson.duration}</p>
        </div>
      </div>
    </button>
  );
}

export function LessonSidebar({
  lessons,
  modules,
  activeLessonId,
  completedLessons,
  onSelect,
  gatedLessonIds = new Set(),
  isGateUnlocked = false,
}: LessonSidebarProps) {
  const hasModules = modules && modules.length > 0;

  /** Check if a lesson is behind the email gate (gated + not yet unlocked). */
  const isLessonGated = (lessonId: string) =>
    gatedLessonIds.has(lessonId) && !isGateUnlocked;

  /* ── Scroll fade indicator ── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Find the Radix viewport (first child with data-radix-scroll-area-viewport)
    const viewport = el.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    setCanScrollDown(scrollHeight - scrollTop - clientHeight > 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = el.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;

    // Check on mount and after content loads
    checkScroll();
    const timer = setTimeout(checkScroll, 500);

    viewport.addEventListener("scroll", checkScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, modules, lessons]);

  return (
    <>
      {/* ── Desktop sidebar (hidden below md) ── */}
      <aside className="hidden md:block w-72 shrink-0 relative">
        <div ref={scrollRef}>
          <ScrollArea className="h-[calc(100vh-220px)]">
            <nav className="space-y-1 pr-3 pb-8">
            {hasModules
              ? /* ── Grouped by module ── */
                modules.map((mod) => (
                  <div key={mod.id} className="mb-4">
                    <p className="text-[9px] font-bold text-moss uppercase tracking-[2px] px-4 mb-2 mt-4">
                      {mod.title}
                    </p>
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isLocked = !lesson.available;
                      const gated = isLessonGated(lesson.id);
                      return (
                        <LessonButton
                          key={lesson.id}
                          lesson={lesson}
                          isActive={isActive}
                          isCompleted={isCompleted}
                          isLocked={isLocked}
                          isGated={gated}
                          onClick={() => {
                            if (!isLocked) onSelect(lesson.id);
                          }}
                        />
                      );
                    })}
                  </div>
                ))
              : /* ── Flat list (legacy fallback) ── */
                lessons.map((lesson) => {
                  const isActive = lesson.id === activeLessonId;
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isLocked = !lesson.available;
                  const gated = isLessonGated(lesson.id);
                  return (
                    <LessonButton
                      key={lesson.id}
                      lesson={lesson}
                      isActive={isActive}
                      isCompleted={isCompleted}
                      isLocked={isLocked}
                      isGated={gated}
                      onClick={() => {
                        if (!isLocked) onSelect(lesson.id);
                      }}
                    />
                  );
                })}
            </nav>
          </ScrollArea>
        </div>

        {/* Fade overlay — indicates more content below */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-300 flex items-end justify-center pb-2",
            "bg-gradient-to-t from-white via-white/80 to-transparent",
            canScrollDown ? "opacity-100" : "opacity-0"
          )}
        >
          <ChevronDown className="h-4 w-4 text-moss/50 animate-bounce" />
        </div>
      </aside>

      {/* ── Mobile dropdown (visible below md) ── */}
      <div className="md:hidden w-full">
        <Select value={activeLessonId} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hasModules
              ? modules.map((mod) => (
                  <SelectGroup key={mod.id}>
                    <SelectLabel className="text-[9px] font-bold text-moss uppercase tracking-[2px]">
                      {mod.title}
                    </SelectLabel>
                    {mod.lessons.map((lesson) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isLocked = !lesson.available;
                      const gated = isLessonGated(lesson.id);
                      return (
                        <SelectItem
                          key={lesson.id}
                          value={lesson.id}
                          disabled={isLocked}
                        >
                          <span className="flex items-center gap-2">
                            {isLocked && (
                              <Lock className="h-3 w-3 text-moss" />
                            )}
                            {gated && !isLocked && (
                              <Mail className="h-3 w-3 text-cedar/60" />
                            )}
                            {isCompleted && !isLocked && !gated && (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            )}
                            <span className={isLocked ? "text-moss" : gated ? "text-moss" : ""}>
                              {lesson.title}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))
              : lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isLocked = !lesson.available;
                  const gated = isLessonGated(lesson.id);
                  return (
                    <SelectItem
                      key={lesson.id}
                      value={lesson.id}
                      disabled={isLocked}
                    >
                      <span className="flex items-center gap-2">
                        {isLocked && <Lock className="h-3 w-3 text-moss" />}
                        {gated && !isLocked && (
                          <Mail className="h-3 w-3 text-cedar/60" />
                        )}
                        {isCompleted && !isLocked && !gated && (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        )}
                        <span className={isLocked ? "text-moss" : gated ? "text-moss" : ""}>
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
