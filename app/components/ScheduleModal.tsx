"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ScheduleModalProps {
  onClose: () => void;
}

export function ScheduleModal({ onClose }: ScheduleModalProps) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Entrance animation + scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Trigger entrance on next frame
    requestAnimationFrame(() => setVisible(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close with exit animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" />

      {/* Centering wrapper */}
      <div
        className="relative flex items-center justify-center min-h-full p-4"
        onClick={handleOverlayClick}
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-[20px] w-full max-w-[700px] max-h-[90dvh] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.2)] outline-none flex flex-col transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-6 pb-4">
            <div>
              <span className="inline-block px-3 py-1.5 rounded-full bg-moss/10 text-moss font-bold uppercase text-[9px] tracking-[2.5px] mb-2">
                BOOK A CALL
              </span>
              <h2
                id="schedule-modal-title"
                className="text-[clamp(24px,3.5vw,32px)] leading-[1.1] text-tobacco font-serif italic"
              >
                Schedule your strategy call
              </h2>
            </div>

            <button
              onClick={handleClose}
              aria-label="Close schedule dialog"
              className="w-8 h-8 flex items-center justify-center rounded-full text-walnut hover:bg-bone-dark/20 transition-colors duration-200 shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Iframe */}
          <div className="flex-1 min-h-[500px] px-4 pb-4">
            <iframe
              src="https://schedule.revfactor.io/embed"
              title="Schedule a strategy call with RevFactor"
              className="w-full h-full min-h-[500px] rounded-[12px] border-0"
              allow="payment"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
