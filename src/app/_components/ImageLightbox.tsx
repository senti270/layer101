"use client";

import { useState, useEffect, useCallback } from "react";

interface LbState { images: string[]; index: number }

export function useLightbox() {
  const [lb, setLb] = useState<LbState | null>(null);
  const openLb = useCallback((images: string[], index = 0) => setLb({ images, index }), []);
  const closeLb = useCallback(() => setLb(null), []);
  const prevLb = useCallback(() => setLb(s => s && s.index > 0 ? { ...s, index: s.index - 1 } : s), []);
  const nextLb = useCallback(() => setLb(s => s && s.index < s.images.length - 1 ? { ...s, index: s.index + 1 } : s), []);
  return { lb, openLb, closeLb, prevLb, nextLb };
}

export function Lightbox({
  lb, onClose, onPrev, onNext,
}: {
  lb: LbState | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (!lb) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lb, onClose, onPrev, onNext]);

  if (!lb) return null;

  const hasPrev = lb.index > 0;
  const hasNext = lb.index < lb.images.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 이미지 */}
      <img
        src={lb.images[lb.index]}
        onClick={e => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain select-none"
        draggable={false}
      />

      {/* 닫기 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors text-lg"
      >
        ✕
      </button>

      {/* 이전 */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 다음 */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 카운터 */}
      {lb.images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs tabular-nums">
          {lb.index + 1} / {lb.images.length}
        </div>
      )}
    </div>
  );
}
