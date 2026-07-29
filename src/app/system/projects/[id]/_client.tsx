"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, getDocs, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  name: string;
  clientName: string;
  type: string;
  status: "진행중" | "완료" | "대기";
}

interface Survey {
  id: string;
  title: string;
  createdAt: { toDate: () => Date } | null;
  photos: unknown[];
  hasResponse: boolean;
}

interface LookReview {
  id: string;
  customerName: string;
  groupId: string;
  groupName?: string;
  createdAt: { toDate: () => Date } | null;
  hearts: { [k: string]: true };
}

interface StyleGroup {
  id: string;
  name: string;
  order: number;
}

type Tab = "surveys" | "lookbook" | "documents" | "photos";

const STATUS_STYLES = {
  진행중: "bg-blue-100 text-blue-700",
  완료: "bg-green-100 text-green-700",
  대기: "bg-gray-100 text-gray-500",
};

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [lookReviews, setLookReviews] = useState<LookReview[]>([]);
  const [styleGroups, setStyleGroups] = useState<StyleGroup[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("surveys");
  const [creatingSurvey, setCreatingSurvey] = useState(false);
  const [lookForm, setLookForm] = useState({ customerName: "", groupId: "" });
  const [creatingLook, setCreatingLook] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, "projects", projectId), snap => {
      if (snap.exists()) setProject(snap.data() as Project);
    });
    const unsub2 = onSnapshot(
      query(collection(db, "surveys"), where("projectId", "==", projectId)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Survey));
        list.sort((a, b) => (b.createdAt?.toDate().getTime() ?? 0) - (a.createdAt?.toDate().getTime() ?? 0));
        setSurveys(list);
      }
    );
    const unsub3 = onSnapshot(
      query(collection(db, "lookReviews"), where("projectId", "==", projectId)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LookReview));
        list.sort((a, b) => (b.createdAt?.toDate().getTime() ?? 0) - (a.createdAt?.toDate().getTime() ?? 0));
        setLookReviews(list);
      }
    );
    getDocs(query(collection(db, "styleGroups"), orderBy("order", "asc"))).then(snap => {
      setStyleGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as StyleGroup)));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [projectId]);

  async function createSurvey() {
    setCreatingSurvey(true);
    try {
      const ref = await addDoc(collection(db, "surveys"), {
        title: "새 선호도 설문",
        projectId,
        createdAt: serverTimestamp(),
        photos: [],
        hasResponse: false,
      });
      router.push(`/system/surveys/${ref.id}`);
    } finally {
      setCreatingSurvey(false);
    }
  }

  async function createLookReview() {
    if (!lookForm.customerName.trim() || !lookForm.groupId) return;
    setCreatingLook(true);
    try {
      const group = styleGroups.find(g => g.id === lookForm.groupId);
      await addDoc(collection(db, "lookReviews"), {
        customerName: lookForm.customerName.trim(),
        groupId: lookForm.groupId,
        groupName: group?.name ?? "",
        projectId,
        createdAt: serverTimestamp(),
        hearts: {},
      });
      setLookForm({ customerName: "", groupId: "" });
    } finally {
      setCreatingLook(false);
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/look/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "surveys", label: "선호도 조사", count: surveys.length },
    { key: "lookbook", label: "룩북", count: lookReviews.length },
    { key: "documents", label: "설계문서" },
    { key: "photos", label: "현장사진" },
  ];

  if (!project) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/system/projects" className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          프로젝트 목록
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <div className="text-sm text-gray-500 mt-1">{project.clientName} · {project.type}</div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${STATUS_STYLES[project.status]}`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "surveys" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={createSurvey}
              disabled={creatingSurvey}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creatingSurvey ? "생성 중..." : "+ 새 설문 만들기"}
            </button>
          </div>
          {surveys.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl">
              설문이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {surveys.map(survey => (
                <Link
                  key={survey.id}
                  href={`/system/surveys/${survey.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{survey.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        사진 {survey.photos?.length ?? 0}장
                        {survey.createdAt && ` · ${survey.createdAt.toDate().toLocaleDateString("ko-KR")}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        survey.hasResponse ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
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
      )}

      {activeTab === "lookbook" && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            <div className="text-sm font-medium text-gray-700 mb-3">새 룩북 링크 만들기</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                value={lookForm.customerName}
                onChange={e => setLookForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="고객 이름"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              />
              <select
                value={lookForm.groupId}
                onChange={e => setLookForm(f => ({ ...f, groupId: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">스타일 그룹 선택</option>
                {styleGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={createLookReview}
              disabled={creatingLook || !lookForm.customerName.trim() || !lookForm.groupId}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creatingLook ? "생성 중..." : "링크 생성"}
            </button>
            {styleGroups.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                먼저{" "}
                <Link href="/system/styles" className="underline">스타일 관리</Link>
                에서 그룹을 추가해주세요.
              </p>
            )}
          </div>

          {lookReviews.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl">
              룩북 링크가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {lookReviews.map(review => {
                const heartCount = Object.keys(review.hearts || {}).length;
                return (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{review.customerName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {review.groupName || "스타일 그룹 없음"}
                        {review.createdAt && ` · ${review.createdAt.toDate().toLocaleDateString("ko-KR")}`}
                        {heartCount > 0 && <span className="ml-2 text-pink-500">❤️ {heartCount}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {heartCount > 0 && (
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
                          copied === review.id ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
      )}

      {(activeTab === "documents" || activeTab === "photos") && (
        <div className="text-center py-24 text-gray-400">
          <div className="text-4xl mb-4">{activeTab === "documents" ? "📄" : "📸"}</div>
          <div className="text-sm font-medium text-gray-500">
            {activeTab === "documents" ? "설계문서 공유" : "현장사진"}
          </div>
          <div className="text-xs mt-1">준비 중입니다</div>
        </div>
      )}
    </div>
  );
}
