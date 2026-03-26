"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

/* ─── Data ─── */

type PhraseType = "stat" | "question";

interface Phrase {
  type: PhraseType;
  text: string;
  icon: string;
}

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const PHRASES: Phrase[] = [
  { type: "stat", text: "Properties with dynamic pricing generate up to 40% more revenue than those with fixed rates.", icon: "📊" },
  { type: "question", text: "Do you know your average booking lead time? It defines your pricing windows.", icon: "🤔" },
  { type: "stat", text: "A 1% increase in occupancy can mean 3-5% more in total revenue when paired with rate optimization.", icon: "📈" },
  { type: "question", text: "Are you pricing weekends and weekdays differently? Demand patterns are never flat.", icon: "💡" },
  { type: "stat", text: "Direct bookings save 15-20% in OTA commissions. What's your channel mix?", icon: "💰" },
  { type: "question", text: "When was the last time you reviewed your minimum night stay strategy?", icon: "🔍" },
  { type: "stat", text: "Revenue Management isn't just about price — it's about selling the right night, to the right guest, at the right time.", icon: "🎯" },
  { type: "question", text: "What percentage of your revenue comes from repeat guests vs. new bookings?", icon: "🤔" },
  { type: "stat", text: "Properties that adjust rates based on booking pace see 20-30% better RevPAR.", icon: "⚡" },
  { type: "question", text: "How far in advance are your highest-value reservations booking? That's your pricing sweet spot.", icon: "💡" },
  { type: "stat", text: "Seasonality accounts for 60-70% of rate variation in most STR markets.", icon: "📊" },
  { type: "question", text: "Are orphan nights costing you revenue? A smart gap-fill strategy can recover 5-10% of lost income.", icon: "🔍" },
  { type: "stat", text: "The top 20% of your nights likely generate 50%+ of your annual revenue. Do you know which ones?", icon: "📈" },
  { type: "question", text: "Is your competitive set defined? You can't optimize without knowing your market.", icon: "🎯" },
  { type: "stat", text: "Last-minute discounts erode brand value. A structured markdown ladder protects both occupancy and ADR.", icon: "⚡" },
  { type: "question", text: "What's your cancellation rate? It directly impacts your net pacing accuracy.", icon: "💡" },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "What does RevPAR stand for?",
    options: ["Revenue Per Available Room", "Rate Per Average Rental", "Revenue Per Adjusted Rate", "Rental Price Average Ratio"],
    correct: 0,
    explanation: "RevPAR = Revenue Per Available Room. Calculated as ADR × Occupancy Rate — the single most important metric in revenue management.",
  },
  {
    q: "If your occupancy is 75% and your ADR is $200, what's your RevPAR?",
    options: ["$266", "$150", "$175", "$125"],
    correct: 1,
    explanation: "RevPAR = 0.75 × $200 = $150. It tells you how much revenue each available night generates, including vacant ones.",
  },
  {
    q: "A property has 10 nights available this month and fills 8. What's the occupancy rate?",
    options: ["85%", "80%", "75%", "90%"],
    correct: 1,
    explanation: "Occupancy = Booked Nights ÷ Available Nights = 8/10 = 80%. Simple, but the most tracked KPI in STR.",
  },
  {
    q: "What's the best strategy when booking pace slows 30 days out?",
    options: [
      "Wait and see — bookings might come last minute",
      "Lower rates aggressively by 30%+",
      "Apply graduated reductions based on a pricing ladder",
      "Block the calendar to create scarcity",
    ],
    correct: 2,
    explanation: "A pricing ladder with graduated reductions (5%, 10%, 15%) protects ADR while stimulating demand. Panic discounts destroy rate integrity.",
  },
  {
    q: "Which metric best measures if you're leaving money on the table?",
    options: ["Occupancy Rate", "Average Daily Rate", "RevPAR", "Booking Lead Time"],
    correct: 2,
    explanation: "RevPAR captures both rate AND occupancy. 100% occupancy at bad rates or great rates with no bookings — RevPAR shows the full picture.",
  },
  {
    q: "What are 'orphan nights' in STR revenue management?",
    options: [
      "Nights with no bookings in the entire market",
      "Isolated vacant nights between two reservations",
      "Last-minute cancellations",
      "Nights priced below market average",
    ],
    correct: 1,
    explanation: "Orphan nights are 1-2 night gaps between bookings that are hard to fill. Smart min-stay strategies and gap-fill pricing can recover this lost revenue.",
  },
  {
    q: "You earn $50K/year at 70% occ. Raise rates 10%, occupancy drops to 65%. What happens?",
    options: [
      "Revenue drops — lost too much occupancy",
      "Revenue stays roughly the same",
      "Revenue increases ~2-3%",
      "Revenue increases ~10%",
    ],
    correct: 2,
    explanation: "New ADR is +10%, but you sell 65/70 = 92.8% of previous nights. Net: 1.10 × 0.928 = 1.021 — about 2% more revenue with fewer guests and less wear.",
  },
  {
    q: "What's the main risk of relying only on Airbnb's Smart Pricing?",
    options: [
      "It charges too much commission",
      "It optimizes for occupancy over revenue",
      "It doesn't work on weekends",
      "It only adjusts monthly",
    ],
    correct: 1,
    explanation: "Airbnb's Smart Pricing prioritizes filling nights (good for their commission) rather than maximizing your revenue. It typically underprices high-demand periods.",
  },
  {
    q: "A booking 90 days out vs. 7 days — which typically generates more revenue?",
    options: [
      "7 days (last-minute premium)",
      "90 days (early bird premium)",
      "90 days (guests plan ahead for peak dates)",
      "They generate roughly the same",
    ],
    correct: 2,
    explanation: "Long lead-time bookings typically capture peak/holiday dates where guests plan ahead and are less price-sensitive. Last-minute fills leftover inventory at lower rates.",
  },
  {
    q: "What does 'rate parity' mean in the context of OTAs?",
    options: [
      "All properties in a market charge the same rate",
      "Your rate is the same across all booking channels",
      "Your rate matches your competitor's rate",
      "Rates don't change throughout the year",
    ],
    correct: 1,
    explanation: "Rate parity means consistent pricing across Airbnb, Vrbo, Booking.com, and direct. Breaking parity risks OTA penalties, but strategic direct-booking discounts are increasingly accepted.",
  },
  {
    q: "Property A: 90% occ, $100 ADR. Property B: 60% occ, $180 ADR. Which performs better?",
    options: [
      "A — higher occupancy wins",
      "B — higher ADR wins",
      "Nearly identical RevPAR",
      "Impossible to compare",
    ],
    correct: 1,
    explanation: "A: RevPAR = $90. B: RevPAR = $108. B wins! This is exactly why RevPAR matters more than occupancy or ADR alone.",
  },
  {
    q: "What's the '80/20 rule' in STR revenue management?",
    options: [
      "80% of revenue comes from 20% of nights",
      "80% of guests book 20 days in advance",
      "You should price 80% of nights at market rate",
      "80% occupancy is the ideal target",
    ],
    correct: 0,
    explanation: "A small fraction of high-demand nights (holidays, events, weekends) generate a disproportionate share of total revenue. Identifying and pricing these correctly is critical.",
  },
];

const PHASE_SWITCH_TIME = 30;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Phrase Carousel ─── */

function PhraseCarousel({ phrases }: { phrases: Phrase[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((p) => (p + 1) % phrases.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(iv);
  }, [phrases.length]);

  const cur = phrases[idx];

  return (
    <div className="min-h-[140px] flex flex-col items-center justify-center">
      <div
        className="transition-all duration-400 ease-in-out"
        style={{
          opacity: fade ? 1 : 0,
          transform: fade ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <span className="text-[28px] block mb-3.5">{cur.icon}</span>
        <p className="font-serif text-[19px] font-normal leading-relaxed text-tobacco mb-3 max-w-[440px] italic">
          &ldquo;{cur.text}&rdquo;
        </p>
        <span
          className={`font-mono text-[10px] font-normal uppercase tracking-[1.5px] px-3 py-1 rounded-full ${
            cur.type === "stat"
              ? "text-moss bg-moss/10"
              : "text-walnut bg-walnut/10"
          }`}
        >
          {cur.type === "stat" ? "Revenue Insight" : "Think About It"}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-7">
        {phrases.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx % 8 ? "w-5 bg-cedar" : "w-1.5 bg-bone"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Quiz Mode ─── */

function QuizMode({ questions }: { questions: QuizQuestion[] }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fadeQ, setFadeQ] = useState(true);

  const current = questions[qIdx];
  const isFinished = qIdx >= questions.length;

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null) return;
      setSelected(i);
      setShowExplanation(true);
      if (i === current.correct) setScore((s) => s + 1);
      setAnswered((a) => a + 1);
    },
    [selected, current]
  );

  const handleNext = useCallback(() => {
    setFadeQ(false);
    setTimeout(() => {
      setSelected(null);
      setShowExplanation(false);
      setQIdx((p) => p + 1);
      setFadeQ(true);
    }, 300);
  }, []);

  const handleRestart = useCallback(() => {
    setFadeQ(false);
    setTimeout(() => {
      setQIdx(0);
      setSelected(null);
      setScore(0);
      setAnswered(0);
      setShowExplanation(false);
      setFadeQ(true);
    }, 300);
  }, []);

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👏" : "📚";
    const msg =
      pct >= 80
        ? "Revenue Management Pro!"
        : pct >= 50
          ? "Solid foundation — let's sharpen the edges."
          : "Great start — the workshop will level you up.";

    return (
      <div
        className="text-center transition-opacity duration-300"
        style={{ opacity: fadeQ ? 1 : 0 }}
      >
        <span className="text-[48px] block mb-4">{emoji}</span>
        <p className="font-serif text-[26px] font-semibold text-cedar mb-2 lowercase tracking-[1px]">
          {score} / {questions.length} correct
        </p>
        <p className="text-[15px] text-tobacco/70 mb-6">{msg}</p>
        <button
          onClick={handleRestart}
          className="font-mono text-[11px] font-medium uppercase tracking-[1px] px-7 py-2.5 rounded-md bg-cedar text-white border-none cursor-pointer hover:bg-cedar/90 transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="max-w-[480px] mx-auto transition-all duration-300 ease-in-out"
      style={{
        opacity: fadeQ ? 1 : 0,
        transform: fadeQ ? "translateY(0)" : "translateY(10px)",
      }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2.5 mb-5 justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-moss/60">
          Question {qIdx + 1} / {questions.length}
        </span>
        <div className="flex-1 max-w-[120px] h-[3px] bg-bone/60 rounded-sm overflow-hidden">
          <div
            className="h-full bg-moss rounded-sm transition-all duration-400 ease-in-out"
            style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[11px] font-bold text-moss">
          {score}/{answered}
        </span>
      </div>

      {/* Question */}
      <p className="font-serif text-[20px] font-semibold leading-snug text-onyx mb-5 text-center">
        {current.q}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct;
          const isSelected = i === selected;
          const revealed = selected !== null;

          let containerClass = "bg-white border-bone";
          let leftBorder = "border-l-transparent";
          let letterBg = "bg-bone/40";
          let letterColor = "text-tobacco/70";
          let letterContent = String.fromCharCode(65 + i);
          let textColor = "text-onyx";
          let opacityClass = "";

          if (revealed) {
            if (isCorrect) {
              containerClass = "bg-green-800/5 border-green-800";
              leftBorder = "border-l-green-800";
              letterBg = "bg-green-800";
              letterColor = "text-white";
              letterContent = "✓";
              textColor = "text-green-800";
            } else if (isSelected) {
              containerClass = "bg-red-800/5 border-red-800";
              leftBorder = "border-l-red-800";
              letterBg = "bg-red-800";
              letterColor = "text-white";
              letterContent = "✗";
              textColor = "text-red-800";
            } else {
              containerClass = "bg-bone/20 border-bone/40";
              textColor = "text-moss/50";
              letterBg = "bg-bone/30";
              letterColor = "text-moss/40";
              opacityClass = "opacity-55";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`relative text-[14px] leading-snug py-3 px-4 pl-5 border-[1.5px] border-l-4 rounded-lg text-left transition-all duration-250 ease-in-out flex items-center gap-2.5 ${containerClass} ${leftBorder} ${textColor} ${opacityClass} ${
                revealed ? "cursor-default" : "cursor-pointer hover:border-cedar/40 hover:shadow-sm"
              }`}
            >
              <span
                className={`font-mono text-[11px] font-semibold w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-250 ${letterBg} ${letterColor}`}
              >
                {letterContent}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mt-4 py-3.5 px-4.5 rounded-lg bg-cedar/5 border border-bone">
          <p className="text-[13px] leading-relaxed text-tobacco/70">
            <strong className="text-cedar">💡</strong> {current.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {selected !== null && (
        <div className="text-center mt-5">
          <button
            onClick={handleNext}
            className="font-mono text-[11px] font-medium uppercase tracking-[1px] px-8 py-2.5 rounded-md bg-cedar text-white border-none cursor-pointer hover:bg-cedar/90 transition-colors"
          >
            {qIdx + 1 < questions.length ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

interface LoadingCarouselProps {
  pmsName?: string;
}

export function LoadingCarousel({ pmsName = "your PMS" }: LoadingCarouselProps) {
  const [phase, setPhase] = useState<"phrases" | "transition" | "quiz">("phrases");
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState(1);
  const [transitionFade, setTransitionFade] = useState(false);

  const shuffledPhrases = useMemo(() => shuffle(PHRASES), []);
  const shuffledQuiz = useMemo(() => shuffle(QUIZ_QUESTIONS), []);

  // Elapsed timer
  useEffect(() => {
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Phase switch after PHASE_SWITCH_TIME seconds
  useEffect(() => {
    if (elapsed === PHASE_SWITCH_TIME && phase === "phrases") {
      setPhase("transition");
      setTransitionFade(true);
      setTimeout(() => {
        setPhase("quiz");
        setTransitionFade(false);
      }, 2200);
    }
  }, [elapsed, phase]);

  // Animated dots
  useEffect(() => {
    const iv = setInterval(() => setDots((p) => (p % 3) + 1), 500);
    return () => clearInterval(iv);
  }, []);

  const dotStr = ".".repeat(dots) + "\u00A0".repeat(3 - dots);

  return (
    <div className="flex items-center justify-center py-20 px-6">
      <div className="max-w-[540px] w-full text-center">
        {/* Spinner */}
        <div className="w-11 h-11 mx-auto mb-7 rounded-full border-3 border-bone animate-spin border-t-cedar" />

        {/* Loading message */}
        <p className="font-mono text-[13px] font-medium text-cedar tracking-[0.5px] uppercase mb-1.5">
          Loading reservations{dotStr}
        </p>
        <p className="text-[13px] text-moss/60 mb-10">
          Fetching data from {pmsName}. This may take a moment.
        </p>

        {/* Divider */}
        <div className="w-10 h-px bg-bone mx-auto mb-8" />

        {/* Phase: Phrases */}
        {phase === "phrases" && (
          <>
            <PhraseCarousel phrases={shuffledPhrases} />
            <p
              className="font-mono text-[10px] text-moss/50 mt-6 tracking-[0.5px] transition-opacity duration-600"
              style={{ opacity: elapsed > 15 ? 1 : 0 }}
            >
              🧠 Quiz starts in {Math.max(0, PHASE_SWITCH_TIME - elapsed)}s
            </p>
          </>
        )}

        {/* Phase: Transition */}
        {phase === "transition" && (
          <div
            className="min-h-[160px] flex flex-col items-center justify-center transition-opacity duration-800"
            style={{ opacity: transitionFade ? 1 : 0 }}
          >
            <span className="text-[36px] mb-4">🧠</span>
            <p className="font-serif text-[22px] font-semibold text-cedar mb-2 lowercase tracking-[1px]">
              still loading? let&apos;s put you to the test.
            </p>
            <p className="text-[14px] text-tobacco/60">
              Quick Revenue Management trivia while you wait.
            </p>
          </div>
        )}

        {/* Phase: Quiz */}
        {phase === "quiz" && <QuizMode questions={shuffledQuiz} />}

        {/* Branding */}
        <p className="font-serif text-sm font-semibold text-moss/50 tracking-[2px] mt-12 lowercase">
          revfactor
        </p>
      </div>
    </div>
  );
}
