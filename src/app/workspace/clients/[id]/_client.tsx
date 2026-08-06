"use client";

import { useState, useEffect, useRef } from "react";
import {
  doc, onSnapshot, collection, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLightbox, Lightbox } from "@/app/_components/ImageLightbox";

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  name: string;
  clientName: string;
  type: string;
  status: "진행중" | "완료" | "대기";
  completionDate?: string;
  managerName?: string;
  managerPhone?: string;
  managerKakao?: string;
  schedule?: { stages: Stage[] };
}
interface Survey {
  id: string;
  title: string;
  photos: unknown[];
  hasResponse: boolean;
  createdAt: { toDate: () => Date } | null;
}
interface LookReview {
  id: string;
  customerName: string;
  groupId: string;
  groupName?: string;
  createdAt: { toDate: () => Date } | null;
  hearts: Record<string, true>;
}
interface StyleGroup { id: string; name: string; order: number; }
interface ProgressLog {
  id: string;
  date: string;
  content: string;
  photos: string[];
  createdAt: { toDate: () => Date } | null;
}
interface Stage {
  name: string;
  plannedStart: string;
  plannedEnd: string;
  status: "예정" | "진행중" | "완료";
  order: number;
}
interface Material {
  id: string;
  location: string;
  category: string;
  name: string;
  spec: string;
  manufacturer: string;
  status: "확정" | "검토중";
  order: number;
}
interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: { toDate: () => Date } | null;
}
interface MeetingLog {
  id: string;
  date: string;
  title: string;
  content: string;
  photos: string[];
  files: { name: string; url: string }[];
  createdAt: { toDate: () => Date } | null;
}

type Tab = "overview" | "surveys" | "meeting" | "progress" | "schedule" | "materials" | "files";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "surveys", label: "설문/룩북" },
  { id: "meeting", label: "미팅기록" },
  { id: "progress", label: "공사현황" },
  { id: "schedule", label: "공정표" },
  { id: "materials", label: "마감재" },
  { id: "files", label: "파일" },
];

const STATUS_STYLES = {
  진행중: "bg-blue-100 text-blue-700",
  완료: "bg-green-100 text-green-700",
  대기: "bg-gray-100 text-gray-500",
};

// ── Main ──────────────────────────────────────────────────────────────────
export default function ClientDashboard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [lookReviews, setLookReviews] = useState<LookReview[]>([]);
  const [styleGroups, setStyleGroups] = useState<StyleGroup[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [meetings, setMeetings] = useState<MeetingLog[]>([]);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!projectId) return;
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
    getDocs(query(collection(db, "styleGroups"), orderBy("order", "asc"))).then(snap =>
      setStyleGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as StyleGroup)))
    );
    const unsub4 = onSnapshot(
      query(collection(db, "projects", projectId, "progressLogs"), orderBy("date", "desc")),
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressLog)))
    );
    const unsub5 = onSnapshot(
      query(collection(db, "projects", projectId, "materials"), orderBy("order", "asc")),
      snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)))
    );
    const unsub6 = onSnapshot(
      query(collection(db, "projects", projectId, "files"), orderBy("uploadedAt", "desc")),
      snap => setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectFile)))
    );
    const unsub7 = onSnapshot(
      query(collection(db, "projects", projectId, "meetingLogs"), orderBy("date", "desc")),
      snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingLog)))
    );
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); };
  }, [projectId]);

  if (!project) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/workspace/clients" className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          클라이언트 목록
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab project={project} projectId={projectId} />
      )}
      {tab === "surveys" && (
        <SurveysTab
          projectId={projectId}
          surveys={surveys}
          lookReviews={lookReviews}
          styleGroups={styleGroups}
          router={router}
        />
      )}
      {tab === "meeting" && (
        <MeetingTab projectId={projectId} meetings={meetings} />
      )}
      {tab === "progress" && (
        <ProgressTab projectId={projectId} logs={logs} />
      )}
      {tab === "schedule" && (
        <ScheduleTab project={project} projectId={projectId} />
      )}
      {tab === "materials" && (
        <MaterialsTab projectId={projectId} materials={materials} />
      )}
      {tab === "files" && (
        <FilesTab projectId={projectId} files={files} />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ project, projectId }: { project: Project; projectId: string }) {
  const [form, setForm] = useState({
    completionDate: project.completionDate ?? "",
    managerName: project.managerName ?? "",
    managerPhone: project.managerPhone ?? "",
    managerKakao: project.managerKakao ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm({
      completionDate: project.completionDate ?? "",
      managerName: project.managerName ?? "",
      managerPhone: project.managerPhone ?? "",
      managerKakao: project.managerKakao ?? "",
    });
  }, [project]);

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${projectId}` : `/c/${projectId}`;

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId), form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function copyPortalLink() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Portal Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-700 mb-2">고객 포털 링크</p>
        <p className="text-xs text-gray-500 mb-3 break-all">{portalUrl}</p>
        <button onClick={copyPortalLink}
          className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
            copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}>
          {copied ? "✓ 복사됨" : "🔗 링크 복사"}
        </button>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">프로젝트 설정</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">완공 예정일</label>
          <input type="date" value={form.completionDate}
            onChange={e => setForm(f => ({ ...f, completionDate: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">담당자 이름</label>
          <input value={form.managerName}
            onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
            placeholder="홍길동"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">담당자 연락처</label>
          <input value={form.managerPhone}
            onChange={e => setForm(f => ({ ...f, managerPhone: e.target.value }))}
            placeholder="010-0000-0000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">카카오 오픈채팅 URL</label>
          <input value={form.managerKakao}
            onChange={e => setForm(f => ({ ...f, managerKakao: e.target.value }))}
            placeholder="https://open.kakao.com/..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <button onClick={save} disabled={saving}
          className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
            saved ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
          } disabled:opacity-50`}>
          {saved ? "✓ 저장됨" : saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

// ── Surveys Tab ───────────────────────────────────────────────────────────
function SurveysTab({
  projectId, surveys, lookReviews, styleGroups, router,
}: {
  projectId: string;
  surveys: Survey[];
  lookReviews: LookReview[];
  styleGroups: StyleGroup[];
  router: ReturnType<typeof useRouter>;
}) {
  const [surveyTab, setSurveyTab] = useState<"surveys" | "lookbook">("surveys");
  const [creatingSurvey, setCreatingSurvey] = useState(false);
  const [lookForm, setLookForm] = useState({ customerName: "", groupId: "" });
  const [creatingLook, setCreatingLook] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

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
      router.push(`/workspace/clients/${projectId}/surveys/${ref.id}`);
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

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(["surveys", "lookbook"] as const).map(t => (
          <button key={t} onClick={() => setSurveyTab(t)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              surveyTab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
            }`}>
            {t === "surveys" ? "선호도 조사" : "룩북"}
          </button>
        ))}
      </div>

      {surveyTab === "surveys" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={createSurvey} disabled={creatingSurvey}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {creatingSurvey ? "생성 중..." : "+ 새 설문 만들기"}
            </button>
          </div>
          {!surveys.length ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl">설문이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {surveys.map(survey => (
                <Link key={survey.id} href={`/workspace/clients/${projectId}/surveys/${survey.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{survey.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        사진 {(survey.photos as unknown[])?.length ?? 0}장
                        {survey.createdAt && ` · ${survey.createdAt.toDate().toLocaleDateString("ko-KR")}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      survey.hasResponse ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {survey.hasResponse ? "응답완료" : "미응답"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {surveyTab === "lookbook" && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            <div className="text-sm font-medium text-gray-700 mb-3">새 룩북 링크 만들기</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={lookForm.customerName}
                onChange={e => setLookForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="고객 이름"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
              <select value={lookForm.groupId}
                onChange={e => setLookForm(f => ({ ...f, groupId: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                <option value="">스타일 그룹 선택</option>
                {styleGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button onClick={createLookReview} disabled={creatingLook || !lookForm.customerName.trim() || !lookForm.groupId}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {creatingLook ? "생성 중..." : "링크 생성"}
            </button>
          </div>

          {!lookReviews.length ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl">룩북 링크가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {lookReviews.map(review => {
                const heartCount = Object.keys(review.hearts || {}).length;
                return (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{review.customerName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {review.groupName ?? ""}
                        {review.createdAt && ` · ${review.createdAt.toDate().toLocaleDateString("ko-KR")}`}
                        {heartCount > 0 && <span className="ml-2 text-pink-500">❤️ {heartCount}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {heartCount > 0 && (
                        <Link href={`/workspace/clients/${projectId}/look-reviews/${review.id}`}
                          className="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors">
                          결과 보기
                        </Link>
                      )}
                      <button onClick={() => copyLink(review.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          copied === review.id ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
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
    </div>
  );
}

// ── Progress Tab ──────────────────────────────────────────────────────────
function ProgressTab({ projectId, logs }: { projectId: string; logs: ProgressLog[] }) {
  const { lb, openLb, closeLb, prevLb, nextLb } = useLightbox();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), content: "" });
  const [uploadingPhotos, setUploadingPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadPhotos(files: File[]): Promise<string[]> {
    return Promise.all(files.map(async file => {
      const r = storageRef(storage, `projects/${projectId}/progress/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      return getDownloadURL(r);
    }));
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingPhotos(p => [...p, ...files.map(f => f.name)]);
    const urls = await uploadPhotos(files);
    setUploadingPhotos([]);
    setForm(f => ({ ...f, _photos: [...((f as { _photos?: string[] })._photos ?? []), ...urls] } as typeof f & { _photos: string[] }));
  }

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter(item => item.type.startsWith("image/"))
        .map(item => item.getAsFile())
        .filter(Boolean) as File[];
      if (!files.length) return;
      setUploadingPhotos(files.map(f => f.name));
      const urls = await uploadPhotos(files);
      setUploadingPhotos([]);
      setForm(f => ({ ...f, _photos: [...((f as { _photos?: string[] })._photos ?? []), ...urls] } as typeof f & { _photos: string[] }));
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [projectId]);

  async function submit() {
    if (!form.date) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "projects", projectId, "progressLogs"), {
        date: form.date,
        content: form.content,
        photos: (form as { _photos?: string[] })._photos ?? [],
        createdAt: serverTimestamp(),
      });
      setForm({ date: new Date().toISOString().slice(0, 10), content: "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteLog(id: string) {
    if (!confirm("이 항목을 삭제할까요?")) return;
    await deleteDoc(doc(db, "projects", projectId, "progressLogs", id));
  }

  const formPhotos = (form as { _photos?: string[] })._photos ?? [];

  return (
    <div>
      <Lightbox lb={lb} onClose={closeLb} onPrev={prevLb} onNext={nextLb} />
      {/* 공사일지 작성 폼 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">공사일지 작성</h2>
        <input type="date" value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
        <textarea value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="오늘의 공사 내용을 입력하세요 (이미지 붙여넣기 가능)"
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 resize-none" />

        {formPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {formPhotos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="w-full aspect-video object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({
                  ...f,
                  _photos: ((f as { _photos?: string[] })._photos ?? []).filter((_, j) => j !== i),
                } as typeof f & { _photos: string[] }))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadingPhotos.length > 0 && (
          <p className="text-xs text-blue-500">사진 업로드 중... ({uploadingPhotos.length})</p>
        )}

        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">
            📷 사진 추가
          </button>
          <button onClick={submit} disabled={submitting || !form.date}
            className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
      </div>

      {/* 목록 */}
      {!logs.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">아직 공사 현황이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-gray-800">{log.date}</span>
                  {log.photos?.length > 0 && <span className="ml-2 text-xs text-gray-400">📷 {log.photos.length}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); deleteLog(log.id); }}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5">삭제</button>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expandedId === log.id && (
                <div className="px-4 pb-4 space-y-3">
                  {log.content && <p className="text-sm text-gray-700 whitespace-pre-line">{log.content}</p>}
                  {log.photos?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {log.photos.map((url, i) => (
                        <img key={i} src={url} onClick={() => openLb(log.photos, i)}
                          className="w-full aspect-video object-cover rounded-lg cursor-zoom-in" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Schedule Tab ───────────────────────────────────────────────────────────
const STAGE_STATUS = ["예정", "진행중", "완료"] as const;

function ScheduleTab({ project, projectId }: { project: Project; projectId: string }) {
  const [stages, setStages] = useState<Stage[]>(() => project.schedule?.stages ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStages(project.schedule?.stages ?? []);
  }, [project.schedule]);

  function addStage() {
    setStages(s => [...s, {
      name: "",
      plannedStart: "",
      plannedEnd: "",
      status: "예정",
      order: s.length,
    }]);
  }

  function updateStage(i: number, field: keyof Stage, value: string) {
    setStages(s => s.map((item, j) => j === i ? { ...item, [field]: value } : item));
  }

  function removeStage(i: number) {
    setStages(s => s.filter((_, j) => j !== i).map((item, j) => ({ ...item, order: j })));
  }

  function moveStage(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const next = [...stages];
    [next[i], next[j]] = [next[j], next[i]];
    setStages(next.map((item, k) => ({ ...item, order: k })));
  }

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId), {
        schedule: { stages: stages.map((s, i) => ({ ...s, order: i })) },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const done = stages.filter(s => s.status === "완료").length;

  return (
    <div>
      {stages.length > 0 && (
        <div className="mb-4 bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">진행률</span>
          <span className="font-semibold">{done}/{stages.length} 완료 ({Math.round((done / stages.length) * 100)}%)</span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {stages.map((stage, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveStage(i, -1)} disabled={i === 0}
                  className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
                <button onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1}
                  className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
              </div>
              <input value={stage.name} onChange={e => updateStage(i, "name", e.target.value)}
                placeholder="공정명 (예: 철거공사)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={() => removeStage(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={stage.plannedStart} onChange={e => updateStage(i, "plannedStart", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              <input type="date" value={stage.plannedEnd} onChange={e => updateStage(i, "plannedEnd", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
            </div>
            <select value={stage.status} onChange={e => updateStage(i, "status", e.target.value as Stage["status"])}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400">
              {STAGE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={addStage}
          className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          + 공정 추가
        </button>
        <button onClick={save} disabled={saving}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            saved ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
          } disabled:opacity-50`}>
          {saved ? "✓ 저장됨" : saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

// ── Materials Tab ─────────────────────────────────────────────────────────
const MATERIAL_STATUS = ["확정", "검토중"] as const;
type MatStatus = typeof MATERIAL_STATUS[number];

const emptyMat = () => ({
  location: "", category: "", name: "", spec: "", manufacturer: "", status: "검토중" as MatStatus,
});

function MaterialsTab({ projectId, materials }: { projectId: string; materials: Material[] }) {
  const [form, setForm] = useState(emptyMat());
  const [submitting, setSubmitting] = useState(false);

  async function addMaterial() {
    if (!form.name.trim() || !form.location.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "projects", projectId, "materials"), {
        ...form,
        order: materials.length,
      });
      setForm(emptyMat());
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: MatStatus) {
    await updateDoc(doc(db, "projects", projectId, "materials", id), { status });
  }

  async function deleteMaterial(id: string) {
    if (!confirm("삭제할까요?")) return;
    await deleteDoc(doc(db, "projects", projectId, "materials", id));
  }

  const grouped = materials.reduce<Record<string, Material[]>>((acc, m) => {
    (acc[m.location] = acc[m.location] || []).push(m);
    return acc;
  }, {});

  return (
    <div>
      {/* 추가 폼 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">마감재 추가</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="위치 (예: 거실)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
          <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="카테고리 (예: 바닥재)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
        </div>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="자재명 *"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.spec} onChange={e => setForm(f => ({ ...f, spec: e.target.value }))}
            placeholder="규격"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
          <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
            placeholder="제조사"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
        </div>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MatStatus }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
          {MATERIAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={addMaterial} disabled={submitting || !form.name.trim() || !form.location.trim()}
          className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {submitting ? "추가 중..." : "+ 추가"}
        </button>
      </div>

      {/* 목록 */}
      {!materials.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">마감재가 없습니다.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([location, items]) => (
            <div key={location}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{location}</h3>
              <div className="space-y-2">
                {items.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{m.category}</p>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      {m.spec && <p className="text-xs text-gray-500">{m.spec}</p>}
                      {m.manufacturer && <p className="text-xs text-gray-400">{m.manufacturer}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={m.status} onChange={e => updateStatus(m.id, e.target.value as MatStatus)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                        {MATERIAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
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

// ── Files Tab ─────────────────────────────────────────────────────────────
const FILE_TYPES = ["계약서", "도면", "견적서", "기타"] as const;
const FILE_ICON: Record<string, string> = { 계약서: "📄", 도면: "📐", 견적서: "💰", 기타: "📎" };

function FilesTab({ projectId, files }: { projectId: string; files: ProjectFile[] }) {
  const [fileType, setFileType] = useState<string>("기타");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      await Promise.all(files.map(async file => {
        const r = storageRef(storage, `projects/${projectId}/files/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        await addDoc(collection(db, "projects", projectId, "files"), {
          name: file.name,
          url,
          type: fileType,
          uploadedAt: serverTimestamp(),
        });
      }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteFile(id: string) {
    if (!confirm("파일을 삭제할까요?")) return;
    await deleteDoc(doc(db, "projects", projectId, "files", id));
  }

  return (
    <div>
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">파일 업로드</h2>
        <select value={fileType} onChange={e => setFileType(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
          {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {uploading ? "업로드 중..." : "📎 파일 선택"}
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
      </div>

      {!files.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">파일이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                {FILE_ICON[f.type] ?? "📎"}
              </div>
              <div className="flex-1 min-w-0">
                <a href={f.url} target="_blank" rel="noreferrer"
                  className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block">{f.name}</a>
                <p className="text-xs text-gray-400">
                  {f.type}{f.uploadedAt ? ` · ${f.uploadedAt.toDate().toLocaleDateString("ko-KR")}` : ""}
                </p>
              </div>
              <button onClick={() => deleteFile(f.id)} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Meeting Tab ───────────────────────────────────────────────────────────
interface EditForm {
  date: string; title: string; content: string;
  photos: string[]; files: { name: string; url: string }[];
}

function MeetingTab({ projectId, meetings }: { projectId: string; meetings: MeetingLog[] }) {
  const { lb, openLb, closeLb, prevLb, nextLb } = useLightbox();

  // 작성 폼
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), title: "", content: "" });
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const meetingFileRef = useRef<HTMLInputElement>(null);

  // 목록 / 수정 상태
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const editPhotoRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  async function uploadToStorage(file: File, path: string) {
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  }

  // 작성 — 사진
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f =>
      uploadToStorage(f, `projects/${projectId}/meetings/${Date.now()}_${f.name}`)
    ));
    setPendingPhotos(p => [...p, ...urls]);
    setUploading(false);
    if (photoRef.current) photoRef.current.value = "";
  }

  // 작성 — 파일
  async function handleAttachSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = await Promise.all(files.map(async f => ({
      name: f.name,
      url: await uploadToStorage(f, `projects/${projectId}/meetings/files/${Date.now()}_${f.name}`),
    })));
    setPendingFiles(p => [...p, ...uploaded]);
    setUploading(false);
    if (meetingFileRef.current) meetingFileRef.current.value = "";
  }

  // 수정 — 사진
  async function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !editForm) return;
    setEditUploading(true);
    const urls = await Promise.all(files.map(f =>
      uploadToStorage(f, `projects/${projectId}/meetings/${Date.now()}_${f.name}`)
    ));
    setEditForm(f => f ? { ...f, photos: [...f.photos, ...urls] } : f);
    setEditUploading(false);
    if (editPhotoRef.current) editPhotoRef.current.value = "";
  }

  // 수정 — 파일
  async function handleEditFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !editForm) return;
    setEditUploading(true);
    const uploaded = await Promise.all(files.map(async f => ({
      name: f.name,
      url: await uploadToStorage(f, `projects/${projectId}/meetings/files/${Date.now()}_${f.name}`),
    })));
    setEditForm(f => f ? { ...f, files: [...f.files, ...uploaded] } : f);
    setEditUploading(false);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  // 붙여넣기 — 작성/수정 모드 자동 분기
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter(item => item.type.startsWith("image/"))
        .map(item => item.getAsFile())
        .filter(Boolean) as File[];
      if (!files.length) return;
      const urls = await Promise.all(files.map(f =>
        uploadToStorage(f, `projects/${projectId}/meetings/${Date.now()}_paste.png`)
      ));
      if (editingId) {
        setEditForm(f => f ? { ...f, photos: [...f.photos, ...urls] } : f);
      } else {
        setPendingPhotos(p => [...p, ...urls]);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [projectId, editingId]);

  async function submit() {
    if (!form.date || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "projects", projectId, "meetingLogs"), {
        date: form.date, title: form.title.trim(), content: form.content,
        photos: pendingPhotos, files: pendingFiles, createdAt: serverTimestamp(),
      });
      setForm({ date: new Date().toISOString().slice(0, 10), title: "", content: "" });
      setPendingPhotos([]);
      setPendingFiles([]);
    } finally { setSubmitting(false); }
  }

  function startEdit(m: MeetingLog) {
    setEditingId(m.id);
    setExpandedId(m.id);
    setEditForm({ date: m.date, title: m.title, content: m.content, photos: [...(m.photos ?? [])], files: [...(m.files ?? [])] });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editForm || !editingId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId, "meetingLogs", editingId), {
        date: editForm.date, title: editForm.title.trim(),
        content: editForm.content, photos: editForm.photos, files: editForm.files,
      });
      cancelEdit();
    } finally { setSaving(false); }
  }

  async function deleteMeeting(id: string) {
    if (!confirm("이 미팅기록을 삭제할까요?")) return;
    await deleteDoc(doc(db, "projects", projectId, "meetingLogs", id));
  }

  return (
    <div>
      <Lightbox lb={lb} onClose={closeLb} onPrev={prevLb} onNext={nextLb} />

      {/* 작성 폼 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">미팅기록 작성</h2>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목 *"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
        </div>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="미팅 내용을 입력하세요 (이미지 붙여넣기 가능)" rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 resize-none" />
        {pendingPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pendingPhotos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="w-full aspect-video object-cover rounded-lg" />
                <button onClick={() => setPendingPhotos(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        )}
        {pendingFiles.length > 0 && (
          <div className="space-y-1">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 border border-gray-200">
                <span className="truncate">📎 {f.name}</span>
                <button onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="text-red-400 ml-2 flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
        {uploading && <p className="text-xs text-blue-500">업로드 중...</p>}
        <div className="flex gap-2">
          <button onClick={() => photoRef.current?.click()}
            className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">📷 사진</button>
          <button onClick={() => meetingFileRef.current?.click()}
            className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">📎 파일</button>
          <button onClick={submit} disabled={submitting || !form.title.trim() || !form.date}
            className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
        <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        <input ref={meetingFileRef} type="file" multiple className="hidden" onChange={handleAttachSelect} />
      </div>

      {/* 목록 */}
      {!meetings.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">미팅 기록이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* 헤더 */}
              <button onClick={() => { if (editingId === m.id) return; setExpandedId(expandedId === m.id ? null : m.id); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{m.title}</span>
                  <span className="text-xs text-gray-400">{m.date}</span>
                  {m.photos?.length > 0 && <span className="text-xs text-gray-400">📷 {m.photos.length}</span>}
                  {m.files?.length > 0 && <span className="text-xs text-gray-400">📎 {m.files.length}</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); startEdit(m); }}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-0.5">수정</button>
                  <button onClick={e => { e.stopPropagation(); deleteMeeting(m.id); }}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5">삭제</button>
                  {editingId !== m.id && (
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === m.id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* 수정 폼 */}
              {editingId === m.id && editForm && (
                <div className="px-4 pb-4 border-t border-blue-100 pt-3 space-y-3 bg-blue-50/30">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editForm.date} onChange={e => setEditForm(f => f ? { ...f, date: e.target.value } : f)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
                    <input value={editForm.title} onChange={e => setEditForm(f => f ? { ...f, title: e.target.value } : f)} placeholder="제목 *"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
                  </div>
                  <textarea value={editForm.content} onChange={e => setEditForm(f => f ? { ...f, content: e.target.value } : f)}
                    placeholder="내용 (이미지 붙여넣기 가능)" rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 resize-none" />
                  {editForm.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {editForm.photos.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} className="w-full aspect-video object-cover rounded-lg" />
                          <button onClick={() => setEditForm(f => f ? { ...f, photos: f.photos.filter((_, j) => j !== i) } : f)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editForm.files.length > 0 && (
                    <div className="space-y-1">
                      {editForm.files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 border border-gray-200">
                          <span className="truncate">📎 {f.name}</span>
                          <button onClick={() => setEditForm(ef => ef ? { ...ef, files: ef.files.filter((_, j) => j !== i) } : ef)}
                            className="text-red-400 ml-2 flex-shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editUploading && <p className="text-xs text-blue-500">업로드 중...</p>}
                  <div className="flex gap-2">
                    <button onClick={() => editPhotoRef.current?.click()}
                      className="py-2 px-3 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">📷</button>
                    <button onClick={() => editFileRef.current?.click()}
                      className="py-2 px-3 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">📎</button>
                    <button onClick={cancelEdit}
                      className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">취소</button>
                    <button onClick={saveEdit} disabled={saving || !editForm.title.trim()}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {saving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                  <input ref={editPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditPhotoSelect} />
                  <input ref={editFileRef} type="file" multiple className="hidden" onChange={handleEditFileSelect} />
                </div>
              )}

              {/* 읽기 뷰 */}
              {expandedId === m.id && editingId !== m.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {m.content && <p className="text-sm text-gray-700 whitespace-pre-line">{m.content}</p>}
                  {m.photos?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {m.photos.map((url, i) => (
                        <img key={i} src={url} onClick={() => openLb(m.photos, i)}
                          className="w-full aspect-video object-cover rounded-lg cursor-zoom-in" />
                      ))}
                    </div>
                  )}
                  {m.files?.length > 0 && (
                    <div className="space-y-1">
                      {m.files.map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                          📎 {f.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
