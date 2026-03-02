"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { ModulePanel } from "@/app/components/admin/ModulePanel";
import { LessonPanel } from "@/app/components/admin/LessonPanel";
import { LessonEditor } from "@/app/components/admin/LessonEditor";
import {
  getModulesWithLessons,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/firestore-course";
import type { ModuleWithLessons, CourseLesson } from "@/types/course";

export default function CourseEditorPage() {
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Load data ─── */
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await getModulesWithLessons();
      setModules(data);
    } catch (err) {
      console.error("Failed to load course data:", err);
      setError("Failed to load course data. Check your Firebase config.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Derived state ─── */
  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedLesson =
    selectedModule?.lessons.find((l) => l.id === selectedLessonId) ?? null;

  /* ═══════════════════════════════════════════════════════════
     MODULE HANDLERS
     ═══════════════════════════════════════════════════════════ */

  const handleCreateModule = async (title: string) => {
    const nextOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order)) + 1 : 0;
    await createModule({ title, description: "", order: nextOrder });
    await loadData();
  };

  const handleUpdateModule = async (id: string, title: string) => {
    await updateModule(id, { title });
    await loadData();
  };

  const handleDeleteModule = async (id: string) => {
    await deleteModule(id);
    if (selectedModuleId === id) {
      setSelectedModuleId(null);
      setSelectedLessonId(null);
    }
    await loadData();
  };

  const handleReorderModule = async (id: string, direction: "up" | "down") => {
    const idx = modules.findIndex((m) => m.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;

    const a = modules[idx];
    const b = modules[swapIdx];

    await Promise.all([
      updateModule(a.id, { order: b.order }),
      updateModule(b.id, { order: a.order }),
    ]);
    await loadData();
  };

  /* ═══════════════════════════════════════════════════════════
     LESSON HANDLERS
     ═══════════════════════════════════════════════════════════ */

  const handleCreateLesson = async (title: string) => {
    if (!selectedModuleId) return;
    const lessons = selectedModule?.lessons ?? [];
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order)) + 1 : 0;

    await createLesson({
      moduleId: selectedModuleId,
      title,
      duration: "",
      content: "",
      order: nextOrder,
      available: false,
    });
    await loadData();
  };

  const handleDeleteLesson = async (id: string) => {
    await deleteLesson(id);
    if (selectedLessonId === id) setSelectedLessonId(null);
    await loadData();
  };

  const handleReorderLesson = async (id: string, direction: "up" | "down") => {
    const lessons = selectedModule?.lessons ?? [];
    const idx = lessons.findIndex((l) => l.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;

    const a = lessons[idx];
    const b = lessons[swapIdx];

    await Promise.all([
      updateLesson(a.id, { order: b.order }),
      updateLesson(b.id, { order: a.order }),
    ]);
    await loadData();
  };

  const handleToggleAvailability = async (id: string, available: boolean) => {
    await updateLesson(id, { available });
    await loadData();
  };

  const handleSaveLesson = async (data: {
    title: string;
    duration: string;
    content: string;
    available: boolean;
  }) => {
    if (!selectedLessonId) return;
    setIsSaving(true);
    try {
      await updateLesson(selectedLessonId, data);
      await loadData();
    } catch (err) {
      console.error("Failed to save lesson:", err);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Loading / error states ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-cedar" />
        <span className="ml-3 text-moss text-sm">Loading course data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              loadData();
            }}
            className="text-cedar underline text-sm"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-onyx">Course Editor</h1>
        <p className="text-sm text-moss mt-1">
          Manage modules and lessons. Content supports Markdown with live preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              <ModulePanel
                modules={modules}
                selectedModuleId={selectedModuleId}
                onSelectModule={(id) => {
                  setSelectedModuleId(id);
                  setSelectedLessonId(null);
                }}
                onCreateModule={handleCreateModule}
                onUpdateModule={handleUpdateModule}
                onDeleteModule={handleDeleteModule}
                onReorderModule={handleReorderModule}
              />
            </CardContent>
          </Card>
        </div>

        {/* Lesson panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              {selectedModule ? (
                <LessonPanel
                  lessons={selectedModule.lessons}
                  selectedLessonId={selectedLessonId}
                  onSelectLesson={setSelectedLessonId}
                  onCreateLesson={handleCreateLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onReorderLesson={handleReorderLesson}
                  onToggleAvailability={handleToggleAvailability}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-moss text-sm italic">
                    Select a module to see its lessons.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lesson editor */}
        <div className="lg:col-span-6">
          <Card>
            <CardContent className="pt-5 pb-4">
              {selectedLesson ? (
                <LessonEditor
                  lesson={selectedLesson}
                  onSave={handleSaveLesson}
                  isSaving={isSaving}
                />
              ) : (
                <div className="text-center py-16">
                  <p className="text-moss text-sm italic">
                    {selectedModule
                      ? "Select a lesson to edit its content."
                      : "Select a module, then a lesson to start editing."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
