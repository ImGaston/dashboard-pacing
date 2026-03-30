/* ────────────────────────────────────────────────────────────
   List all lessons in Firestore with their module, title & ID
   Run:  npx tsx scripts/list-lessons.ts
   ──────────────────────────────────────────────────────────── */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

async function main() {
  // Fetch modules
  const modsSnap = await getDocs(
    query(collection(db, "modules"), orderBy("order", "asc"))
  );
  const modules = new Map<string, string>();
  modsSnap.docs.forEach((d) => modules.set(d.id, (d.data() as any).title));

  // Fetch lessons
  const lessonsSnap = await getDocs(
    query(collection(db, "lessons"), orderBy("order", "asc"))
  );

  // Group lessons by module, respecting module order
  const moduleOrder = modsSnap.docs.map((d) => d.id);
  const grouped = new Map<string, { title: string; id: string; order: number }[]>();

  lessonsSnap.docs.forEach((d) => {
    const data = d.data() as any;
    const list = grouped.get(data.moduleId) ?? [];
    list.push({ title: data.title, id: d.id, order: data.order });
    grouped.set(data.moduleId, list);
  });

  console.log("\n📚 Lessons in Firestore (grouped by module)\n");

  let total = 0;
  for (const modId of moduleOrder) {
    const modTitle = modules.get(modId) ?? modId;
    const lessons = (grouped.get(modId) ?? []).sort((a, b) => a.order - b.order);

    console.log(`\n┌─ 📖 ${modTitle}`);
    console.log("│");
    lessons.forEach((l, i) => {
      const prefix = i === lessons.length - 1 ? "└" : "├";
      const num = String(i + 1).padStart(2, " ");
      console.log(`│  ${prefix}─ ${num}. ${l.title}`);
      console.log(`│  ${i === lessons.length - 1 ? " " : "│"}      → ${l.id}.svg`);
      total++;
    });
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Total: ${total} lessons`);
  console.log(`\n📁 Put your SVGs in: public/course/<filename>\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
