"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  clientName: string;
  type: string;
  status: "진행중" | "완료" | "대기";
  createdAt: { toDate: () => Date } | null;
}

const STATUS_STYLES = {
  진행중: "bg-blue-100 text-blue-700",
  완료: "bg-green-100 text-green-700",
  대기: "bg-gray-100 text-gray-500",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; clientName: string; type: string; status: Project["status"] }>({ name: "", clientName: "", type: "주거", status: "진행중" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
  }, []);

  async function createProject() {
    if (!form.name.trim() || !form.clientName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...form,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        createdAt: serverTimestamp(),
      });
      setForm({ name: "", clientName: "", type: "주거", status: "진행중" });
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">프로젝트</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "취소" : "+ 새 프로젝트"}
        </button>
      </div>

      {/* 생성 폼 */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">프로젝트명 *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="예: 홍길동 아파트 리모델링"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">고객명 *</label>
              <input
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder="예: 홍길동"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">유형</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option>주거</option>
                <option>카페</option>
                <option>음식점</option>
                <option>사무실</option>
                <option>기타</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">상태</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Project["status"] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option>진행중</option>
                <option>대기</option>
                <option>완료</option>
              </select>
            </div>
          </div>
          <button
            onClick={createProject}
            disabled={creating || !form.name.trim() || !form.clientName.trim()}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "생성 중..." : "프로젝트 생성"}
          </button>
        </div>
      )}

      {/* 프로젝트 목록 */}
      {projects.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-4xl mb-4">🏗️</div>
          <div className="text-sm">프로젝트가 없습니다. 새 프로젝트를 만들어보세요.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/system/projects/${project.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{project.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {project.clientName} · {project.type}
                    {project.createdAt && ` · ${project.createdAt.toDate().toLocaleDateString("ko-KR")}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[project.status]}`}>
                    {project.status}
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
