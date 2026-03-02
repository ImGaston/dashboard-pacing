/**
 * @deprecated — Legacy static lessons. Kept as fallback when Firestore is
 * unavailable. New content should be managed via the admin panel at /admin/course
 * and stored in Firestore.
 */
import React from "react";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  available: boolean;
  content: React.ReactNode | null;
}

/* ── Key Takeaway box ── */
function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-moss/10 border-l-4 border-moss p-4 rounded-r-lg my-6">
      <p className="text-[9px] font-bold text-walnut uppercase tracking-[2px] mb-1">
        Key Takeaway
      </p>
      <p className="text-tobacco text-sm leading-relaxed">{children}</p>
    </div>
  );
}

/* ── Lesson 1 ── */
function Lesson1Content() {
  return (
    <div className="space-y-5 text-tobacco leading-relaxed">
      <p>
        Revenue management is the strategic discipline of selling the right room to
        the right guest at the right price and at the right time. For short-term
        rental operators, it means moving beyond a single nightly rate and
        instead optimizing every lever that drives total revenue.
      </p>

      <h3 className="text-lg font-serif text-onyx mt-8">
        Why Revenue Management Matters for STRs
      </h3>
      <p>
        Unlike hotels with dedicated revenue teams, most STR operators set prices
        based on gut feeling or a quick glance at competitors. A structured
        approach can unlock 15-30% more revenue from the same inventory — without
        adding a single new listing.
      </p>
      <p>
        The three foundational metrics you need to understand are{" "}
        <strong>Occupancy Rate</strong>, <strong>Average Daily Rate (ADR)</strong>,
        and <strong>Revenue Per Available Night (RevPAN)</strong>. Together, they
        form the "revenue triangle" that every pricing decision should consider.
      </p>

      <h3 className="text-lg font-serif text-onyx mt-8">
        The Revenue Triangle
      </h3>
      <p>
        <strong>Occupancy Rate</strong> measures how many of your available nights
        were booked. A 100% occupancy sounds great, but it usually means you
        left money on the table — your price was too low.
      </p>
      <p>
        <strong>ADR</strong> tells you the average amount earned per occupied
        night. Raising ADR is the fastest way to grow revenue, but push too hard
        and occupancy drops.
      </p>
      <p>
        <strong>RevPAN</strong> combines both into a single number: total revenue
        divided by total available nights. It is the ultimate "score" because it
        accounts for both rate and occupancy. Maximizing RevPAN — not occupancy
        or ADR alone — should be your primary goal.
      </p>

      <Takeaway>
        Always optimize for RevPAN, not occupancy or ADR in isolation. A property
        at 70% occupancy with a $250 ADR (RevPAN $175) outperforms one at 95%
        occupancy with a $150 ADR (RevPAN $142).
      </Takeaway>

      <h3 className="text-lg font-serif text-onyx mt-8">
        Getting Started
      </h3>
      <p>
        Begin by collecting at least 12 months of historical booking data from your
        PMS. Export your reservations with check-in dates, nightly rates, and
        booking dates. This historical baseline is the foundation for every
        strategy covered in later lessons.
      </p>
    </div>
  );
}

/* ── Lesson 2 ── */
function Lesson2Content() {
  return (
    <div className="space-y-5 text-tobacco leading-relaxed">
      <p>
        Your pricing strategy is the single biggest lever you control as a
        short-term rental operator. Yet many hosts default to a flat rate
        year-round and wonder why their calendar is either fully booked months
        in advance or eerily empty during shoulder seasons.
      </p>

      <h3 className="text-lg font-serif text-onyx mt-8">
        Cost-Plus vs. Market-Based Pricing
      </h3>
      <p>
        <strong>Cost-plus pricing</strong> starts with your expenses — mortgage,
        cleaning fees, utilities, platform commissions — and adds a target margin.
        It guarantees profitability per booking but ignores what guests are
        actually willing to pay. In peak season you could be charging $180 when
        guests would gladly pay $320.
      </p>
      <p>
        <strong>Market-based pricing</strong> anchors to comparable listings in
        your area. By studying what similar properties charge and how their
        calendars behave, you set rates that reflect real demand. This is the
        approach used by professional revenue managers and is the foundation of
        dynamic pricing.
      </p>

      <Takeaway>
        Use cost-plus pricing to set your absolute floor — the minimum rate
        below which a booking loses money. Then use market-based signals to set
        your actual asking rate above that floor.
      </Takeaway>

      <h3 className="text-lg font-serif text-onyx mt-8">
        Building a Rate Calendar
      </h3>
      <p>
        Start by dividing the year into seasons based on your market&apos;s demand
        patterns. Most STR markets have 3-4 distinct seasons: peak, shoulder,
        low, and possibly a holiday micro-season. Assign a base rate to each
        season that reflects historical occupancy and ADR.
      </p>
      <p>
        From there, layer on day-of-week adjustments. Friday and Saturday nights
        typically command a 15-25% premium over midweek in leisure markets. For
        urban or business-travel markets, Tuesday through Thursday may be
        stronger.
      </p>

      <h3 className="text-lg font-serif text-onyx mt-8">
        Length-of-Stay Discounts
      </h3>
      <p>
        Offering a discount for longer stays reduces turnover costs (cleaning,
        laundry, guest communication) and fills gaps in your calendar. A common
        structure is:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>Weekly discount: 10-15%</li>
        <li>Monthly discount: 20-30%</li>
      </ul>
      <p>
        Always calculate the net RevPAN after discounts and saved turnover costs.
        A 25% monthly discount that keeps your property occupied at $150/night
        beats a full-rate strategy that leaves 40% of nights empty.
      </p>

      <Takeaway>
        A pricing strategy is not a single number — it is a system of base rates,
        seasonal adjustments, day-of-week premiums, and length-of-stay
        incentives that work together to maximize RevPAN across the full calendar.
      </Takeaway>
    </div>
  );
}

/* ── All Lessons ── */
export const lessons: Lesson[] = [
  {
    id: "lesson-1",
    title: "Understanding Revenue Management",
    duration: "~8 min read",
    available: true,
    content: <Lesson1Content />,
  },
  {
    id: "lesson-2",
    title: "Setting Your Pricing Strategy",
    duration: "~10 min read",
    available: true,
    content: <Lesson2Content />,
  },
  {
    id: "lesson-3",
    title: "Seasonal Demand Patterns",
    duration: "~7 min read",
    available: false,
    content: null,
  },
  {
    id: "lesson-4",
    title: "Channel Mix Optimization",
    duration: "~9 min read",
    available: false,
    content: null,
  },
  {
    id: "lesson-5",
    title: "Dynamic Pricing Fundamentals",
    duration: "~12 min read",
    available: false,
    content: null,
  },
  {
    id: "lesson-6",
    title: "Competitive Analysis",
    duration: "~8 min read",
    available: false,
    content: null,
  },
  {
    id: "lesson-7",
    title: "Measuring Performance with KPIs",
    duration: "~10 min read",
    available: false,
    content: null,
  },
];
