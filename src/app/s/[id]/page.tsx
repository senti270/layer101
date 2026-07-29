"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  url: string;
  storagePath: string;
}

interface Survey {
  title: string;
  photos: Photo[];
}

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: surveyId } = use(params);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<{ [photoId: string]: "like" | "dislike" }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const [surveySnap, responseSnap] = await Promise.all([
        getDoc(doc(db, "surveys", surveyId)),
        getDoc(doc(db, "surveys", surveyId, "response", "main")),
      ]);
      if (!surveySnap.exists()) {
        setNotFound(true);
      } else {
        setSurvey(surveySnap.data() as Survey);
        if (responseSnap.exists()) setSubmitted(true);
      }
      setLoading(false);
    }
    load();
  }, [surveyId]);

  function toggle(photoId: string, value: "like" | "dislike") {
    setAnswers(prev => {
      if (prev[photoId] === value) {
        const next = { ...prev };
        delete next[photoId];
        return next;
      }
      return { ...prev, [photoId]: value };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await setDoc(doc(db, "surveys", surveyId, "response", "main"), {
        submittedAt: serverTimestamp(),
        answers,
      });
      await updateDoc(doc(db, "surveys", surveyId), { hasResponse: true });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <div className="text-5xl mb-4">🔍</div>
          <div className="font-semibold text-gray-700">설문을 찾을 수 없습니다</div>
          <div className="text-sm text-gray-400 mt-2">링크를 다시 확인해주세요.</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <div className="text-5xl mb-4">✅</div>
          <div className="font-semibold text-gray-800 text-xl">응답이 제출되었습니다</div>
          <div className="text-sm text-gray-400 mt-2">소중한 의견 감사합니다!</div>
        </div>
      </div>
    );
  }

  const photos = survey?.photos ?? [];
  const answeredCount = Object.keys(answers).length;
  const totalCount = photos.length;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">{survey?.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          마음에 드는 이미지는 👍, 아닌 이미지는 👎를 선택해주세요.
        </p>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>선택 현황</span>
            <span>{answeredCount} / {totalCount}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-5 mb-10">
        {photos.map((photo, i) => (
          <div key={photo.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative">
              <img
                src={photo.url}
                alt={`이미지 ${i + 1}`}
                className="w-full object-cover max-h-72"
              />
              <div className="absolute top-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                {i + 1} / {totalCount}
              </div>
            </div>
            <div className="flex p-3 gap-2">
              <button
                onClick={() => toggle(photo.id, "like")}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  answers[photo.id] === "like"
                    ? "bg-blue-600 text-white shadow-sm scale-[1.02]"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                👍 좋아요
              </button>
              <button
                onClick={() => toggle(photo.id, "dislike")}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  answers[photo.id] === "dislike"
                    ? "bg-red-500 text-white shadow-sm scale-[1.02]"
                    : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                👎 싫어요
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || answeredCount === 0}
        className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 text-sm"
      >
        {submitting
          ? "제출 중..."
          : answeredCount === 0
          ? "하나 이상 선택 후 제출해주세요"
          : `선호도 제출하기 (${answeredCount}/${totalCount} 선택)`}
      </button>
      {answeredCount > 0 && answeredCount < totalCount && (
        <p className="text-xs text-gray-400 text-center mt-2">
          일부만 선택해도 제출 가능합니다
        </p>
      )}
    </div>
  );
}
