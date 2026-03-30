"use client";

import { useState, useEffect, useCallback } from "react";
import { addSubscriber } from "@/lib/firestore-subscribers";

const STORAGE_KEY = "revfactor_course_email";

interface EmailGateState {
  /** Whether the user has already subscribed (modules 3+ unlocked). */
  isUnlocked: boolean;
  /** Whether the gate modal is currently open. */
  isOpen: boolean;
  /** The lesson ID the user was trying to access when gated. */
  pendingLessonId: string | null;
  /** Open the gate modal, storing which lesson they wanted. */
  openGate: (lessonId: string) => void;
  /** Close the gate modal without subscribing. */
  closeGate: () => void;
  /** Submit the subscription form. Returns the pending lesson ID on success. */
  handleSubscribe: (data: {
    email: string;
    name: string;
    listingCount: string;
  }) => Promise<string | null>;
}

export function useEmailGate(): EmailGateState {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setIsUnlocked(true);
  }, []);

  const openGate = useCallback((lessonId: string) => {
    setPendingLessonId(lessonId);
    setIsOpen(true);
  }, []);

  const closeGate = useCallback(() => {
    setIsOpen(false);
    setPendingLessonId(null);
  }, []);

  const handleSubscribe = useCallback(
    async (data: { email: string; name: string; listingCount: string }) => {
      await addSubscriber(data);
      localStorage.setItem(STORAGE_KEY, data.email.toLowerCase().trim());
      setIsUnlocked(true);
      setIsOpen(false);
      const lessonId = pendingLessonId;
      setPendingLessonId(null);
      return lessonId;
    },
    [pendingLessonId]
  );

  return {
    isUnlocked,
    isOpen,
    pendingLessonId,
    openGate,
    closeGate,
    handleSubscribe,
  };
}
