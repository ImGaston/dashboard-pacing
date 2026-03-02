"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import type { CourseLesson } from "@/types/course";

interface LessonPanelProps {
  lessons: CourseLesson[];
  selectedLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onCreateLesson: (title: string) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
  onReorderLesson: (id: string, direction: "up" | "down") => Promise<void>;
  onToggleAvailability: (id: string, available: boolean) => Promise<void>;
}

export function LessonPanel({
  lessons,
  selectedLessonId,
  onSelectLesson,
  onCreateLesson,
  onDeleteLesson,
  onReorderLesson,
  onToggleAvailability,
}: LessonPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsLoading(true);
    await onCreateLesson(newTitle.trim());
    setNewTitle("");
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    setIsLoading(true);
    await onDeleteLesson(id);
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-moss uppercase tracking-[2px]">
          Lessons
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-7 w-7 p-0 text-moss hover:text-cedar"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add new lesson */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Lesson title"
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            disabled={isLoading || !newTitle.trim()}
            className="h-8 w-8 p-0 text-success"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewTitle("");
            }}
            className="h-8 w-8 p-0 text-moss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lesson list */}
      <div className="space-y-1">
        {lessons.map((lesson, idx) => {
          const isSelected = lesson.id === selectedLessonId;

          return (
            <div
              key={lesson.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors cursor-pointer",
                isSelected
                  ? "bg-cedar/5 border border-cedar/20"
                  : "hover:bg-bone-muted border border-transparent"
              )}
              onClick={() => onSelectLesson(lesson.id)}
            >
              {/* Order number */}
              <span className="text-xs font-mono text-moss/60 w-5 shrink-0">
                {idx + 1}.
              </span>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-cedar" : "text-tobacco"
                  )}
                >
                  {lesson.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-moss">
                    {lesson.duration || "No duration"}
                  </span>
                  {!lesson.available && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-moss/60 bg-bone-muted px-1.5 py-0.5 rounded">
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Actions (hover) */}
              <div
                className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    onToggleAvailability(lesson.id, !lesson.available)
                  }
                  className="p-1 text-moss hover:text-cedar"
                  title={lesson.available ? "Lock lesson" : "Unlock lesson"}
                >
                  {lesson.available ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => onReorderLesson(lesson.id, "up")}
                  disabled={idx === 0 || isLoading}
                  className="p-1 text-moss hover:text-cedar disabled:opacity-20"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onReorderLesson(lesson.id, "down")}
                  disabled={idx === lessons.length - 1 || isLoading}
                  className="p-1 text-moss hover:text-cedar disabled:opacity-20"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="p-1 text-moss hover:text-error"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {lessons.length === 0 && !isAdding && (
          <p className="text-moss text-sm text-center py-6 italic">
            No lessons in this module yet.
          </p>
        )}
      </div>
    </div>
  );
}
