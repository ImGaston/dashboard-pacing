/* ────────────────────────────────────────────────────────────
   Firestore helpers — CRUD for course modules & lessons
   ──────────────────────────────────────────────────────────── */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CourseModule, CourseLesson, ModuleWithLessons } from "@/types/course";

/* ─── Collections ─── */
const modulesCol = () => collection(db, "modules");
const lessonsCol = () => collection(db, "lessons");

/* ═══════════════════════════════════════════════════════════
   MODULES
   ═══════════════════════════════════════════════════════════ */

export async function getModules(): Promise<CourseModule[]> {
  const q = query(modulesCol(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseModule));
}

export async function createModule(
  data: Omit<CourseModule, "id">
): Promise<string> {
  const ref = await addDoc(modulesCol(), data);
  return ref.id;
}

export async function updateModule(
  id: string,
  data: Partial<Omit<CourseModule, "id">>
): Promise<void> {
  await updateDoc(doc(db, "modules", id), data);
}

/** Delete a module and ALL its lessons (cascade). */
export async function deleteModule(id: string): Promise<void> {
  // Find child lessons
  const q = query(lessonsCol(), where("moduleId", "==", id));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "modules", id));
  await batch.commit();
}

/* ═══════════════════════════════════════════════════════════
   LESSONS
   ═══════════════════════════════════════════════════════════ */

export async function getAllLessons(): Promise<CourseLesson[]> {
  const q = query(lessonsCol(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseLesson));
}

export async function getLessonsByModule(
  moduleId: string
): Promise<CourseLesson[]> {
  const q = query(
    lessonsCol(),
    where("moduleId", "==", moduleId),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseLesson));
}

export async function getLesson(id: string): Promise<CourseLesson | null> {
  const snap = await getDoc(doc(db, "lessons", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CourseLesson;
}

export async function createLesson(
  data: Omit<CourseLesson, "id">
): Promise<string> {
  const ref = await addDoc(lessonsCol(), data);
  return ref.id;
}

export async function updateLesson(
  id: string,
  data: Partial<Omit<CourseLesson, "id">>
): Promise<void> {
  await updateDoc(doc(db, "lessons", id), data);
}

export async function deleteLesson(id: string): Promise<void> {
  await deleteDoc(doc(db, "lessons", id));
}

/* ═══════════════════════════════════════════════════════════
   AGGREGATED — modules with nested lessons
   ═══════════════════════════════════════════════════════════ */

export async function getModulesWithLessons(): Promise<ModuleWithLessons[]> {
  const [modules, lessons] = await Promise.all([
    getModules(),
    getAllLessons(),
  ]);

  return modules.map((mod) => ({
    ...mod,
    lessons: lessons
      .filter((l) => l.moduleId === mod.id)
      .sort((a, b) => a.order - b.order),
  }));
}
