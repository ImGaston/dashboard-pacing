"use client";

import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/app/components/ui/progress";
import { lessons } from "./mini-course/lessons";
import { LessonSidebar } from "./mini-course/LessonSidebar";
import { LessonContent } from "./mini-course/LessonContent";

const STORAGE_KEY = "revfactor_course_progress";

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
  const [activeLessonId, setActiveLessonId] = useState(lessons[0].id);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
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

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0];
  const progressPercent = (completedLessons.length / lessons.length) * 100;

  const markComplete = useCallback(() => {
    setCompletedLessons((prev) => {
      if (prev.includes(activeLessonId)) return prev;
      return [...prev, activeLessonId];
    });
  }, [activeLessonId]);

  const handleSelect = useCallback((lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson && lesson.available) {
      setActiveLessonId(lessonId);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-bone rounded-full w-64" />
          <div className="flex gap-6">
            <div className="hidden md:block w-72 h-96 bg-bone rounded-xl" />
            <div className="flex-1 h-96 bg-bone rounded-xl" />
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
          <h2 className="text-xl font-serif text-onyx">Revenue Management Course</h2>
          <span className="text-xs font-bold text-moss uppercase tracking-widest">
            {completedLessons.length}/{lessons.length} completed
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <LessonSidebar
          lessons={lessons}
          activeLessonId={activeLessonId}
          completedLessons={completedLessons}
          onSelect={handleSelect}
        />

        <LessonContent
          lesson={activeLesson}
          isCompleted={completedLessons.includes(activeLessonId)}
          onMarkComplete={markComplete}
        />
      </div>
    </div>
  );
}
