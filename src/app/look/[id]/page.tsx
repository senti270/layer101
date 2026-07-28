"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  url: string;
  storagePath: string;
}

interface Style {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  order: number;
  photos: Photo[];
}

interface LookReview {
  customerName: string;
  hearts: { [photoId: string]: true };
}

export default function LookPage({ params }: { params: { id: string } }) {
  const reviewId = params.id;
  const [styles, setStyles] = useState<Style[]>([]);
  const [hearts, setHearts] = useState<{ [photoId: string]: true }>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [reviewSnap, stylesSnap] = await Promise.all([
        getDoc(doc(db, "lookReviews", reviewId)),
        getDocs(query(collection(db, "styles"), orderBy("order", "asc"))),
      ]);
      if (!reviewSnap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const reviewData = reviewSnap.data() as LookReview;
      setHearts(reviewData.hearts || {});
      setStyles(stylesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Style)));
      setLoading(false);
    }
    load();

    return onSnapshot(doc(db, "lookReviews", reviewId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as LookReview;
        setHearts(data.hearts || {});
      }
    });
  }, [reviewId]);

  const toggleHeart = useCallback(async (photoId: string) => {
    if (toggling) return;
    setToggling(photoId);
    const isHearted = !!hearts[photoId];
    try {
      if (isHearted) {
        const next = { ...hearts };
        delete next[photoId];
        await updateDoc(doc(db, "lookReviews", reviewId), { hearts: next });
      } else {
        await updateDoc(doc(db, "lookReviews", reviewId), {
          [`hearts.${photoId}`]: true,
        });
      }
    } finally {
      setToggling(null);
    }
  }, [hearts, toggling, reviewId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh] text-gray-400 text-sm">불러오는 중...</div>
  );

  if (notFound) return (
    <div className="flex items-center justify-center min-h-[70vh] text-center">
      <div>
        <div className="text-5xl mb-4">🔍</div>
        <div className="font-semibold text-gray-700">페이지를 찾을 수 없습니다</div>
        <div className="text-sm text-gray-400 mt-2">링크를 다시 확인해주세요.</div>
      </div>
    </div>
  );

  if (styles.length === 0) return (
    <div className="flex items-center justify-center min-h-[70vh] text-gray-400 text-sm">준비 중입니다...</div>
  );

  const current = styles[currentIdx];
  const heartedInCurrent = (current.photos || []).filter(p => hearts[p.id]).length;
  const totalHearts = Object.keys(hearts).length;

  return (
    <div className="min-h-screen pb-24 bg-white">
      {/* 상단 고정 스타일 네비 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => { setCurrentIdx(prev => Math.max(0, prev - 1)); window.scrollTo({ top: 0 }); }}
              disabled={currentIdx === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-20 transition-all flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-base truncate">{current.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{currentIdx + 1} / {styles.length}</div>
            </div>

            <button
              onClick={() => { setCurrentIdx(prev => Math.min(styles.length - 1, prev + 1)); window.scrollTo({ top: 0 }); }}
              disabled={currentIdx === styles.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-20 transition-all flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 스타일 dots */}
          <div className="flex justify-center items-center gap-1.5 mt-2.5 pb-1">
            {styles.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentIdx(i); window.scrollTo({ top: 0 }); }}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIdx ? "w-5 h-2 bg-gray-800" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">
        {/* 설명 */}
        {current.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{current.description}</p>
        )}

        {/* 하트 카운트 */}
        {heartedInCurrent > 0 && (
          <div className="text-xs text-right text-pink-500 mb-3">
            ❤️ {heartedInCurrent}장 선택됨
          </div>
        )}

        {/* 사진 그리드 */}
        {(!current.photos || current.photos.length === 0) ? (
          <div className="text-center py-16 text-gray-300 text-sm">사진이 없습니다</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {current.photos.map(photo => {
              const isHearted = !!hearts[photo.id];
              return (
                <button
                  key={photo.id}
                  onClick={() => toggleHeart(photo.id)}
                  disabled={toggling === photo.id}
                  className="relative aspect-square focus:outline-none group"
                >
                  <img
                    src={photo.url}
                    alt=""
                    className={`w-full h-full object-cover rounded-2xl transition-all duration-200 ${
                      isHearted ? "ring-2 ring-pink-400 ring-offset-2" : ""
                    }`}
                  />
                  {/* 하트 버튼 */}
                  <div className={`absolute top-2.5 right-2.5 transition-all duration-200 ${
                    isHearted ? "scale-110" : "scale-90 opacity-50 group-hover:opacity-80 group-hover:scale-100"
                  }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
                      isHearted ? "bg-pink-500" : "bg-white/85 backdrop-blur-sm"
                    }`}>
                      <svg
                        className={`w-5 h-5 transition-colors ${isHearted ? "text-white" : "text-gray-400"}`}
                        fill={isHearted ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 장단점 */}
        {(current.pros?.length > 0 || current.cons?.length > 0) && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
            {current.pros?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">장점</div>
                <div className="space-y-1.5">
                  {current.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {current.cons?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">단점</div>
                <div className="space-y-1.5">
                  {current.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">!</span>
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 스타일 이동 버튼 */}
        <div className="flex gap-3">
          {currentIdx > 0 && (
            <button
              onClick={() => { setCurrentIdx(prev => prev - 1); window.scrollTo({ top: 0 }); }}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              ← {styles[currentIdx - 1].name}
            </button>
          )}
          {currentIdx < styles.length - 1 && (
            <button
              onClick={() => { setCurrentIdx(prev => prev + 1); window.scrollTo({ top: 0 }); }}
              className="flex-1 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              {styles[currentIdx + 1].name} →
            </button>
          )}
        </div>

        {totalHearts > 0 && (
          <div className="text-center text-xs text-gray-400 mt-4">
            전체 ❤️ {totalHearts}장 — 하트는 자동으로 저장됩니다
          </div>
        )}
      </div>
    </div>
  );
}
