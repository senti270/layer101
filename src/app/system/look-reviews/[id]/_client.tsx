"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Photo {
  id: string;
  url: string;
}

interface Style {
  id: string;
  name: string;
  order: number;
  photos: Photo[];
}

interface LookReview {
  customerName: string;
  hearts: { [photoId: string]: true };
  createdAt: { toDate: () => Date } | null;
  projectId?: string;
  groupId?: string;
}

export default function LookReviewDetailPage({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<LookReview | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "lookReviews", reviewId), (snap) => {
      if (snap.exists()) setReview(snap.data() as LookReview);
    });
    return unsub;
  }, [reviewId]);

  useEffect(() => {
    getDocs(query(collection(db, "styles"), orderBy("order", "asc"))).then(snap => {
      setStyles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Style)));
    });
  }, []);

  if (!review) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  const hearts = review.hearts || {};
  const totalHearts = Object.keys(hearts).length;

  const byStyle: { style: Style; photos: Photo[] }[] = styles
    .map(style => ({
      style,
      photos: (style.photos || []).filter(p => hearts[p.id]),
    }))
    .filter(({ photos }) => photos.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href={review.projectId ? `/system/projects/${review.projectId}` : "/system/projects"} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        프로젝트로
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">{review.customerName} 고객 룩북</h1>
        <div className="text-sm text-gray-400 mt-1">
          {review.createdAt ? review.createdAt.toDate().toLocaleDateString("ko-KR") : ""}
          {totalHearts > 0 && <span className="ml-2">· 총 ❤️ {totalHearts}장</span>}
        </div>
      </div>

      {byStyle.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl text-gray-400 text-sm">
          아직 하트한 사진이 없습니다.
        </div>
      ) : (
        <div className="space-y-10">
          {byStyle.map(({ style, photos }) => (
            <div key={style.id}>
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                {style.name}
                <span className="text-sm font-normal text-pink-500">❤️ {photos.length}장</span>
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-square">
                    <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
