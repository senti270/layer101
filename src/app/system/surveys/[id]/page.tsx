"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Photo {
  id: string;
  url: string;
  storagePath: string;
}

interface Survey {
  title: string;
  photos: Photo[];
  hasResponse: boolean;
  projectId?: string;
}

interface Response {
  submittedAt: { toDate: () => Date };
  answers: { [photoId: string]: "like" | "dislike" };
}

export default function SurveyDetailPage() {
  const { id: surveyId } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [response, setResponse] = useState<Response | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "surveys", surveyId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Survey;
        setSurvey(data);
        setTitle(prev => prev || data.title);
      }
    });
    return unsub;
  }, [surveyId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "surveys", surveyId, "response", "main"), (snap) => {
      if (snap.exists()) setResponse(snap.data() as Response);
    });
    return unsub;
  }, [surveyId]);

  async function handleTitleBlur() {
    if (survey && title !== survey.title && title.trim()) {
      await updateDoc(doc(db, "surveys", surveyId), { title: title.trim() });
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !survey) return;
    setUploading(true);
    try {
      const { ref: sRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const newPhotos: Photo[] = [];
      for (const file of files) {
        const photoId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const path = `surveys/${surveyId}/${photoId}`;
        const ref = sRef(storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        newPhotos.push({ id: photoId, url, storagePath: path });
      }
      await updateDoc(doc(db, "surveys", surveyId as string), {
        photos: [...(survey.photos || []), ...newPhotos],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeletePhoto(photo: Photo) {
    if (!survey) return;
    setDeleting(photo.id);
    try {
      const { ref: sRef, deleteObject } = await import("firebase/storage");
      await deleteObject(sRef(storage, photo.storagePath)).catch(() => {});
      await updateDoc(doc(db, "surveys", surveyId), {
        photos: survey.photos.filter(p => p.id !== photo.id),
      });
    } finally {
      setDeleting(null);
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/s/${surveyId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!survey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">
        로딩 중...
      </div>
    );
  }

  const likedPhotos = survey.photos.filter(p => response?.answers[p.id] === "like");
  const dislikedPhotos = survey.photos.filter(p => response?.answers[p.id] === "dislike");
  const unansweredPhotos = survey.photos.filter(p => !response?.answers[p.id]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href={survey.projectId ? `/system/projects/${survey.projectId}` : "/system/projects"} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        프로젝트로
      </Link>

      {/* Title */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="설문 제목"
        className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none w-full mb-8 pb-1 transition-colors"
      />

      {/* Shareable Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-3">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <div className="flex-1 text-sm text-blue-700 font-mono truncate">
          {typeof window !== "undefined" ? `${window.location.origin}/s/${surveyId}` : ""}
        </div>
        <button
          onClick={copyLink}
          className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
            copied
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {copied ? "복사됨!" : "링크 복사"}
        </button>
      </div>

      {/* Photo Upload */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">사진
            <span className="ml-2 text-sm font-normal text-gray-400">{survey.photos.length}장</span>
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "+ 사진 추가"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {survey.photos.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="text-3xl mb-2">🖼️</div>
            <div className="text-gray-400 text-sm">클릭하여 사진을 업로드하세요</div>
            <div className="text-gray-300 text-xs mt-1">여러 장 동시 선택 가능 · JPG, PNG, WEBP</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {survey.photos.map((photo, i) => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.url}
                  alt={`사진 ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {/* Response badge */}
                {response && (
                  <div className={`absolute bottom-1.5 left-1.5 text-base leading-none ${
                    !response.answers[photo.id] ? "opacity-40" : ""
                  }`}>
                    {response.answers[photo.id] === "like" ? "👍"
                      : response.answers[photo.id] === "dislike" ? "👎"
                      : "—"}
                  </div>
                )}
                {/* Delete button */}
                <button
                  onClick={() => handleDeletePhoto(photo)}
                  disabled={deleting === photo.id}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80 disabled:opacity-50"
                >
                  {deleting === photo.id ? "..." : "×"}
                </button>
              </div>
            ))}
            {/* Add more button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <span className="text-gray-400 text-2xl">+</span>
            </div>
          </div>
        )}
      </section>

      {/* Response Section */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-4">
          고객 응답
          {response && (
            <span className="ml-2 text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              응답완료
            </span>
          )}
        </h2>

        {!response ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
            아직 고객 응답이 없습니다.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-400">
              응답 일시: {response.submittedAt.toDate().toLocaleString("ko-KR")}
            </div>
            <div className="p-5 grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-1.5">
                  👍 좋아요
                  <span className="font-normal text-green-500">({likedPhotos.length})</span>
                </div>
                {likedPhotos.length === 0 ? (
                  <div className="text-xs text-gray-300">없음</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {likedPhotos.map(p => (
                      <img key={p.id} src={p.url} alt="" className="w-full aspect-square object-cover rounded-md" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-1.5">
                  👎 싫어요
                  <span className="font-normal text-red-400">({dislikedPhotos.length})</span>
                </div>
                {dislikedPhotos.length === 0 ? (
                  <div className="text-xs text-gray-300">없음</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {dislikedPhotos.map(p => (
                      <img key={p.id} src={p.url} alt="" className="w-full aspect-square object-cover rounded-md" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {unansweredPhotos.length > 0 && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-2">미선택 ({unansweredPhotos.length})</div>
                <div className="flex gap-1.5 flex-wrap">
                  {unansweredPhotos.map(p => (
                    <img key={p.id} src={p.url} alt="" className="w-12 h-12 object-cover rounded-md opacity-40" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
