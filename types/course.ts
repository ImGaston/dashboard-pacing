/* ────────────────────────────────────────────────────────────
   Course types — Firestore data model for Modules → Lessons
   ──────────────────────────────────────────────────────────── */

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  duration: string;
  content: string; // Markdown
  order: number;
  available: boolean;
}

/** A module enriched with its child lessons (sorted by order). */
export interface ModuleWithLessons extends CourseModule {
  lessons: CourseLesson[];
}
