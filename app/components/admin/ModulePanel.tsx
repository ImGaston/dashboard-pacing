"use client";

import { useState } from "react";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import type { ModuleWithLessons } from "@/types/course";

interface ModulePanelProps {
  modules: ModuleWithLessons[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  onCreateModule: (title: string) => Promise<void>;
  onUpdateModule: (id: string, title: string) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onReorderModule: (id: string, direction: "up" | "down") => Promise<void>;
}

export function ModulePanel({
  modules,
  selectedModuleId,
  onSelectModule,
  onCreateModule,
  onUpdateModule,
  onDeleteModule,
  onReorderModule,
}: ModulePanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsLoading(true);
    await onCreateModule(newTitle.trim());
    setNewTitle("");
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    setIsLoading(true);
    await onUpdateModule(id, editTitle.trim());
    setEditingId(null);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    setIsLoading(true);
    await onDeleteModule(id);
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-moss uppercase tracking-[2px]">
          Modules
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

      {/* Add new module inline */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Module title"
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

      {/* Module list */}
      <nav className="space-y-1">
        {modules.map((mod, idx) => {
          const isSelected = mod.id === selectedModuleId;
          const isEditing = editingId === mod.id;

          return (
            <div
              key={mod.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg transition-colors",
                isSelected
                  ? "bg-cedar/5 border border-cedar/20"
                  : "hover:bg-bone-muted border border-transparent"
              )}
            >
              {/* Reorder grip */}
              <div className="flex flex-col shrink-0 pl-1">
                <button
                  onClick={() => onReorderModule(mod.id, "up")}
                  disabled={idx === 0 || isLoading}
                  className="text-moss/40 hover:text-cedar disabled:opacity-20 p-0.5"
                >
                  <GripVertical className="h-3 w-3 rotate-180" />
                </button>
                <button
                  onClick={() => onReorderModule(mod.id, "down")}
                  disabled={idx === modules.length - 1 || isLoading}
                  className="text-moss/40 hover:text-cedar disabled:opacity-20 p-0.5"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>

              {isEditing ? (
                <div className="flex-1 flex items-center gap-1 p-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(mod.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdate(mod.id)}
                    className="h-7 w-7 p-0 text-success"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                    className="h-7 w-7 p-0 text-moss"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelectModule(mod.id)}
                    className="flex-1 text-left px-2 py-2.5 min-w-0"
                  >
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-cedar" : "text-tobacco"
                      )}
                    >
                      {mod.title}
                    </p>
                    <p className="text-[11px] text-moss mt-0.5">
                      {mod.lessons.length} lesson
                      {mod.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </button>

                  {/* Actions (visible on hover) */}
                  <div className="shrink-0 flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(mod.id);
                        setEditTitle(mod.title);
                      }}
                      className="p-1 text-moss hover:text-cedar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(mod.id)}
                      className="p-1 text-moss hover:text-error"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {isSelected && (
                    <ChevronRight className="h-4 w-4 text-cedar shrink-0 mr-1" />
                  )}
                </>
              )}
            </div>
          );
        })}

        {modules.length === 0 && !isAdding && (
          <p className="text-moss text-sm text-center py-6 italic">
            No modules yet. Click + to create one.
          </p>
        )}
      </nav>
    </div>
  );
}
