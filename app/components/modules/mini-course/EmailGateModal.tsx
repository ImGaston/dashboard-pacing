"use client";

import React, { useState } from "react";
import { Mail, Gift, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

interface EmailGateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    name: string;
    listingCount: string;
  }) => Promise<void>;
}

const LISTING_OPTIONS = ["1-5", "6-15", "16-50", "51-100", "100+"];

export function EmailGateModal({
  open,
  onClose,
  onSubmit,
}: EmailGateModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [listingCount, setListingCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!listingCount) {
      setError("Please select your number of listings.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, name, listingCount });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-cedar/10 flex items-center justify-center">
              <Gift className="h-4 w-4 text-cedar" />
            </div>
          </div>
          <DialogTitle>Unlock the full course</DialogTitle>
          <DialogDescription className="text-tobacco/70 text-sm leading-relaxed">
            Get access to all remaining modules plus a free Revenue Management
            Toolkit (Excel) to apply what you learn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="gate-name"
              className="text-[10px] font-bold text-moss uppercase tracking-[1.5px]"
            >
              Name
            </label>
            <input
              id="gate-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-bone bg-white px-3 py-2.5 text-sm text-tobacco placeholder:text-moss/40 focus:outline-none focus:ring-2 focus:ring-cedar/30 focus:border-cedar transition-colors"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="gate-email"
              className="text-[10px] font-bold text-moss uppercase tracking-[1.5px]"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-moss/40" />
              <input
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-bone bg-white pl-10 pr-3 py-2.5 text-sm text-tobacco placeholder:text-moss/40 focus:outline-none focus:ring-2 focus:ring-cedar/30 focus:border-cedar transition-colors"
              />
            </div>
          </div>

          {/* Listing count */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-moss uppercase tracking-[1.5px]">
              Number of listings
            </label>
            <div className="flex flex-wrap gap-2">
              {LISTING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setListingCount(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    listingCount === opt
                      ? "bg-cedar text-bone border-cedar"
                      : "bg-white text-tobacco border-bone hover:border-cedar/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                Unlock Course & Get Toolkit
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Fine print */}
          <p className="text-[10px] text-moss/60 text-center leading-relaxed">
            You&apos;ll also receive occasional updates with workflows, toolkits
            & revenue tips. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
