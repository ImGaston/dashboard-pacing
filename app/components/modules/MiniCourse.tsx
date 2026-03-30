"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Progress } from "@/app/components/ui/progress";
import { lessons as staticLessons } from "./mini-course/lessons";
import { LessonSidebar } from "./mini-course/LessonSidebar";
import { LessonContent } from "./mini-course/LessonContent";
import { EmailGateModal } from "./mini-course/EmailGateModal";
import { useEmailGate } from "./mini-course/useEmailGate";
import { getModulesWithLessons } from "@/lib/firestore-course";
import type { ModuleWithLessons } from "@/types/course";

/** Modules with order >= this threshold require email subscription. */
const GATED_MODULE_ORDER = 2;

const STORAGE_KEY = "revfactor_course_progress";

/** A unified lesson type for both Firestore and legacy data. */
export interface UnifiedLesson {
  id: string;
  title: string;
  duration: string;
  available: boolean;
  /** Markdown string (Firestore) OR React node (legacy). */
  content: string | React.ReactNode | null;
}

function loadProgress(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveProgress(completed: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
}

export function MiniCourse() {
  const [modules, setModules] = useState<ModuleWithLessons[] | null>(null);
  const [allLessons, setAllLessons] = useState<UnifiedLesson[]>(
    staticLessons as UnifiedLesson[]
  );
  const [activeLessonId, setActiveLessonId] = useState(staticLessons[0].id);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const emailGate = useEmailGate();

  // Fetch from Firestore, fallback to static
  useEffect(() => {
    let cancelled = false;

    async function fetchCourse() {
      try {
        const mods = await getModulesWithLessons();

        if (cancelled) return;

        // Only use Firestore data if we actually got lessons
        const firestoreLessons = mods.flatMap((m) => m.lessons);
        if (firestoreLessons.length > 0) {
          setModules(mods);
          setAllLessons(
            firestoreLessons.map((l) => ({
              id: l.id,
              title: l.title,
              duration: l.duration,
              available: l.available,
              content: l.content,
            }))
          );
          // Default to first available lesson
          const firstAvailable = firestoreLessons.find((l) => l.available);
          if (firstAvailable) {
            setActiveLessonId(firstAvailable.id);
          }
        }
      } catch (err) {
        // Silently fall back to static lessons
        console.warn("Firestore unavailable, using static lessons:", err);
      }
    }

    fetchCourse();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load progress from localStorage on mount
  useEffect(() => {
    setCompletedLessons(loadProgress());
    setIsLoaded(true);
  }, []);

  // Sync to localStorage on changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveProgress(completedLessons);
    }
  }, [completedLessons, isLoaded]);

  // Build a set of lesson IDs that belong to gated modules (order >= GATED_MODULE_ORDER)
  const gatedLessonIds = useMemo(() => {
    if (!modules) return new Set<string>();
    const gatedModuleIds = new Set(
      modules.filter((m) => m.order >= GATED_MODULE_ORDER).map((m) => m.id)
    );
    return new Set(
      modules
        .filter((m) => gatedModuleIds.has(m.id))
        .flatMap((m) => m.lessons.map((l) => l.id))
    );
  }, [modules]);

  const activeLesson =
    allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];
  const progressPercent =
    allLessons.length > 0
      ? (completedLessons.filter((id) => allLessons.some((l) => l.id === id))
          .length /
          allLessons.length) *
        100
      : 0;

  const markComplete = useCallback(() => {
    setCompletedLessons((prev) => {
      if (prev.includes(activeLessonId)) return prev;
      return [...prev, activeLessonId];
    });
  }, [activeLessonId]);

  const handleSelect = useCallback(
    (lessonId: string) => {
      const lesson = allLessons.find((l) => l.id === lessonId);
      if (!lesson || !lesson.available) return;

      // If lesson belongs to a gated module and user hasn't subscribed → show gate
      if (gatedLessonIds.has(lessonId) && !emailGate.isUnlocked) {
        emailGate.openGate(lessonId);
        return;
      }

      setActiveLessonId(lessonId);
    },
    [allLessons, gatedLessonIds, emailGate]
  );

  const handleGateSubmit = useCallback(
    async (data: { email: string; name: string; listingCount: string }) => {
      const pendingId = await emailGate.handleSubscribe(data);
      if (pendingId) {
        setActiveLessonId(pendingId);
      }
    },
    [emailGate]
  );

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-bone-muted rounded-full w-64" />
          <div className="flex gap-6">
            <div className="hidden md:block w-72 h-96 bg-bone-muted rounded-[12px]" />
            <div className="flex-1 h-96 bg-bone-muted rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-onyx">
            Revenue Management Course
          </h2>
          <span className="text-[9px] font-bold text-walnut uppercase tracking-[2px]">
            {completedLessons.filter((id) =>
              allLessons.some((l) => l.id === id)
            ).length}
            /{allLessons.length} completed
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <LessonSidebar
          lessons={allLessons}
          modules={modules}
          activeLessonId={activeLessonId}
          completedLessons={completedLessons}
          onSelect={handleSelect}
          gatedLessonIds={gatedLessonIds}
          isGateUnlocked={emailGate.isUnlocked}
        />

        <LessonContent
          lesson={activeLesson}
          isCompleted={completedLessons.includes(activeLessonId)}
          onMarkComplete={markComplete}
        />
      </div>

      {/* Email gate modal */}
      <EmailGateModal
        open={emailGate.isOpen}
        onClose={emailGate.closeGate}
        onSubmit={handleGateSubmit}
      />
    </div>
  );
}
