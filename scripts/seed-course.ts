/* ────────────────────────────────────────────────────────────
   Seed script — populate Firestore with the initial course
   Run:  npx tsx scripts/seed-course.ts
   Requires .env.local with Firebase config vars.
   ──────────────────────────────────────────────────────────── */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
} from "firebase/firestore";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ═══════════════════════════════════════════════════════════
   MODULE
   ═══════════════════════════════════════════════════════════ */

const MODULE_ID = "revenue-management-fundamentals";

const moduleData = {
  title: "Revenue Management Fundamentals",
  description: "A beginner-friendly introduction to revenue management for short-term rental operators.",
  order: 0,
};

/* ═══════════════════════════════════════════════════════════
   LESSONS (IDs match legacy lesson-1 … lesson-7 for
   backwards-compatible localStorage progress tracking)
   ═══════════════════════════════════════════════════════════ */

const lessons = [
  {
    id: "lesson-1",
    moduleId: MODULE_ID,
    title: "Understanding Revenue Management",
    duration: "~8 min read",
    order: 0,
    available: true,
    content: `Revenue management is the strategic discipline of selling the right room to the right guest at the right price and at the right time. For short-term rental operators, it means moving beyond a single nightly rate and instead optimizing every lever that drives total revenue.

### Why Revenue Management Matters for STRs

Unlike hotels with dedicated revenue teams, most STR operators set prices based on gut feeling or a quick glance at competitors. A structured approach can unlock 15-30% more revenue from the same inventory — without adding a single new listing.

The three foundational metrics you need to understand are **Occupancy Rate**, **Average Daily Rate (ADR)**, and **Revenue Per Available Night (RevPAN)**. Together, they form the "revenue triangle" that every pricing decision should consider.

### The Revenue Triangle

**Occupancy Rate** measures how many of your available nights were booked. A 100% occupancy sounds great, but it usually means you left money on the table — your price was too low.

**ADR** tells you the average amount earned per occupied night. Raising ADR is the fastest way to grow revenue, but push too hard and occupancy drops.

**RevPAN** combines both into a single number: total revenue divided by total available nights. It is the ultimate "score" because it accounts for both rate and occupancy. Maximizing RevPAN — not occupancy or ADR alone — should be your primary goal.

> **Key Takeaway:** Always optimize for RevPAN, not occupancy or ADR in isolation. A property at 70% occupancy with a $250 ADR (RevPAN $175) outperforms one at 95% occupancy with a $150 ADR (RevPAN $142).

### Getting Started

Begin by collecting at least 12 months of historical booking data from your PMS. Export your reservations with check-in dates, nightly rates, and booking dates. This historical baseline is the foundation for every strategy covered in later lessons.`,
  },
  {
    id: "lesson-2",
    moduleId: MODULE_ID,
    title: "Setting Your Pricing Strategy",
    duration: "~10 min read",
    order: 1,
    available: true,
    content: `Your pricing strategy is the single biggest lever you control as a short-term rental operator. Yet many hosts default to a flat rate year-round and wonder why their calendar is either fully booked months in advance or eerily empty during shoulder seasons.

### Cost-Plus vs. Market-Based Pricing

**Cost-plus pricing** starts with your expenses — mortgage, cleaning fees, utilities, platform commissions — and adds a target margin. It guarantees profitability per booking but ignores what guests are actually willing to pay. In peak season you could be charging $180 when guests would gladly pay $320.

**Market-based pricing** anchors to comparable listings in your area. By studying what similar properties charge and how their calendars behave, you set rates that reflect real demand. This is the approach used by professional revenue managers and is the foundation of dynamic pricing.

> **Key Takeaway:** Use cost-plus pricing to set your absolute floor — the minimum rate below which a booking loses money. Then use market-based signals to set your actual asking rate above that floor.

### Building a Rate Calendar

Start by dividing the year into seasons based on your market's demand patterns. Most STR markets have 3-4 distinct seasons: peak, shoulder, low, and possibly a holiday micro-season. Assign a base rate to each season that reflects historical occupancy and ADR.

From there, layer on day-of-week adjustments. Friday and Saturday nights typically command a 15-25% premium over midweek in leisure markets. For urban or business-travel markets, Tuesday through Thursday may be stronger.

### Length-of-Stay Discounts

Offering a discount for longer stays reduces turnover costs (cleaning, laundry, guest communication) and fills gaps in your calendar. A common structure is:

- Weekly discount: 10-15%
- Monthly discount: 20-30%

Always calculate the net RevPAN after discounts and saved turnover costs. A 25% monthly discount that keeps your property occupied at $150/night beats a full-rate strategy that leaves 40% of nights empty.

> **Key Takeaway:** A pricing strategy is not a single number — it is a system of base rates, seasonal adjustments, day-of-week premiums, and length-of-stay incentives that work together to maximize RevPAN across the full calendar.`,
  },
  {
    id: "lesson-3",
    moduleId: MODULE_ID,
    title: "Seasonal Demand Patterns",
    duration: "~7 min read",
    order: 2,
    available: false,
    content: "",
  },
  {
    id: "lesson-4",
    moduleId: MODULE_ID,
    title: "Channel Mix Optimization",
    duration: "~9 min read",
    order: 3,
    available: false,
    content: "",
  },
  {
    id: "lesson-5",
    moduleId: MODULE_ID,
    title: "Dynamic Pricing Fundamentals",
    duration: "~12 min read",
    order: 4,
    available: false,
    content: "",
  },
  {
    id: "lesson-6",
    moduleId: MODULE_ID,
    title: "Competitive Analysis",
    duration: "~8 min read",
    order: 5,
    available: false,
    content: "",
  },
  {
    id: "lesson-7",
    moduleId: MODULE_ID,
    title: "Measuring Performance with KPIs",
    duration: "~10 min read",
    order: 6,
    available: false,
    content: "",
  },
];

/* ═══════════════════════════════════════════════════════════
   SEED
   ═══════════════════════════════════════════════════════════ */

async function seed() {
  console.log("🌱 Seeding course data…\n");

  // 1. Create module
  await setDoc(doc(db, "modules", MODULE_ID), moduleData);
  console.log(`  ✅ Module: ${moduleData.title}`);

  // 2. Create lessons (using setDoc with custom IDs to preserve localStorage progress)
  for (const lesson of lessons) {
    const { id, ...data } = lesson;
    await setDoc(doc(db, "lessons", id), data);
    console.log(`  ✅ Lesson: ${lesson.title}${lesson.available ? "" : " (locked)"}`);
  }

  console.log("\n🎉 Done! Course seeded successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
