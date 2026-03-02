"use client";

import { useState, useEffect } from "react";
import { Save, Eye, Pencil } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { cn } from "@/lib/utils";
import type { CourseLesson } from "@/types/course";

interface LessonEditorProps {
  lesson: CourseLesson;
  onSave: (data: {
    title: string;
    duration: string;
    content: string;
    available: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

export function LessonEditor({ lesson, onSave, isSaving }: LessonEditorProps) {
  const [title, setTitle] = useState(lesson.title);
  const [duration, setDuration] = useState(lesson.duration);
  const [content, setContent] = useState(lesson.content);
  const [available, setAvailable] = useState(lesson.available);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset when lesson changes
  useEffect(() => {
    setTitle(lesson.title);
    setDuration(lesson.duration);
    setContent(lesson.content);
    setAvailable(lesson.available);
    setShowPreview(false);
    setHasChanges(false);
  }, [lesson.id, lesson.title, lesson.duration, lesson.content, lesson.available]);

  // Track changes
  useEffect(() => {
    const changed =
      title !== lesson.title ||
      duration !== lesson.duration ||
      content !== lesson.content ||
      available !== lesson.available;
    setHasChanges(changed);
  }, [title, duration, content, available, lesson]);

  const handleSave = () => {
    onSave({ title, duration, content, available });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-moss uppercase tracking-[2px]">
          Edit Lesson
        </h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-[11px] text-walnut font-medium">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
            className="gap-2 bg-cedar text-bone hover:bg-cedar/90"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className="text-[11px] font-bold text-moss uppercase tracking-wider mb-1 block">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson title"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-moss uppercase tracking-wider mb-1 block">
            Duration
          </label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="~8 min read"
            className="text-sm"
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="rounded border-bone-dark text-cedar focus:ring-cedar"
            />
            <span className="text-sm text-tobacco">Available to students</span>
          </label>
        </div>
      </div>

      {/* Editor / Preview toggle */}
      <div className="border border-bone-dark rounded-[12px] overflow-hidden bg-bone-light">
        {/* Tab bar */}
        <div className="flex items-center border-b border-bone-dark bg-bone-muted/50 px-3">
          <button
            onClick={() => setShowPreview(false)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              !showPreview
                ? "border-cedar text-cedar"
                : "border-transparent text-moss hover:text-tobacco"
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            Write
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              showPreview
                ? "border-cedar text-cedar"
                : "border-transparent text-moss hover:text-tobacco"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>

        {/* Content area */}
        <div className="p-4">
          {showPreview ? (
            <div className="min-h-[400px]">
              <MarkdownPreview content={content} />
            </div>
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}
        </div>
      </div>
    </div>
  );
}
