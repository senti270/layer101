"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Survey {
  id: string;
  title: string;
  createdAt: { toDate: () => Date } | null;
  photos: { id: string; url: string }[];
  hasResponse?: boolean;
}

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() } as Survey)));
    });
  }, []);

  async function createSurvey() {
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, "surveys"), {
        title: "새 고객 설문",
        createdAt: serverTimestamp(),
        photos: [],
        hasResponse: false,
      });
      router.push(`/system/surveys/${ref.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">고객 선호도 설문</h1>
        <button
          onClick={createSurvey}
          disabled={creating}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {creating ? "생성 중..." : "+ 새 설문 만들기"}
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-sm">설문이 없습니다. 새 설문을 만들어보세요.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => (
            <Link
              key={survey.id}
              href={`/system/surveys/${survey.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{survey.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {survey.createdAt ? survey.createdAt.toDate().toLocaleDateString("ko-KR", {
                      year: "numeric", month: "long", day: "numeric"
                    }) : "-"}
                    {" · "}사진 {survey.photos?.length ?? 0}장
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    survey.hasResponse
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {survey.hasResponse ? "응답완료" : "미응답"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
