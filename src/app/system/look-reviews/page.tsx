"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface LookReview {
  id: string;
  customerName: string;
  createdAt: { toDate: () => Date } | null;
  hearts: { [photoId: string]: true };
}

export default function LookReviewsPage() {
  const [reviews, setReviews] = useState<LookReview[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "lookReviews"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as LookReview)));
    });
  }, []);

  async function createReview() {
    if (!customerName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "lookReviews"), {
        customerName: customerName.trim(),
        createdAt: serverTimestamp(),
        hearts: {},
      });
      setCustomerName("");
    } finally {
      setCreating(false);
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/look/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const heartCount = (hearts: { [k: string]: true }) => Object.keys(hearts || {}).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-8">룩북 링크 관리</h1>

      {/* 생성 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <div className="text-sm font-medium text-gray-700 mb-3">새 고객 링크 만들기</div>
        <div className="flex gap-3">
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && createReview()}
            placeholder="고객 이름 (예: 홍길동)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          />
          <button
            onClick={createReview}
            disabled={creating || !customerName.trim()}
            className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "생성 중..." : "링크 생성"}
          </button>
        </div>
      </div>

      {/* 목록 */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <div className="text-4xl mb-3">🔗</div>
          생성된 링크가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => {
            const count = heartCount(review.hearts);
            return (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{review.customerName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {review.createdAt ? review.createdAt.toDate().toLocaleDateString("ko-KR") : "-"}
                    {count > 0 && <span className="ml-2 text-pink-500">❤️ {count}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {count > 0 && (
                    <Link
                      href={`/system/look-reviews/${review.id}`}
                      className="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      결과 보기
                    </Link>
                  )}
                  <button
                    onClick={() => copyLink(review.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      copied === review.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {copied === review.id ? "복사됨!" : "링크 복사"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
