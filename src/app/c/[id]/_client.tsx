"use client";

import { useState, useEffect } from "react";
import {
  doc, onSnapshot, collection, query, where, getDocs, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  name: string;
  clientName: string;
  completionDate?: string;
  managerName?: string;
  managerPhone?: string;
  managerKakao?: string;
  schedule?: { stages: Stage[] };
}
interface Survey {
  id: string;
  title: string;
  photos: { id: string; url: string }[];
}
interface SurveyResponse {
  answers: Record<string, "like" | "dislike">;
}
interface LookReview {
  id: string;
  customerName: string;
  hearts: Record<string, true>;
}
interface Style {
  id: string;
  name: string;
  photos: { id: string; url: string }[];
}
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

type Tab = "home" | "survey" | "lookbook" | "progress" | "schedule" | "materials" | "files";
const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "홈" },
  { id: "survey", label: "설문결과" },
  { id: "lookbook", label: "룩북" },
  { id: "progress", label: "공사현황" },
  { id: "schedule", label: "공정표" },
  { id: "materials", label: "마감재" },
  { id: "files", label: "파일" },
];

function dDay(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ClientPortal({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Record<string, SurveyResponse>>({});
  const [lookReviews, setLookReviews] = useState<LookReview[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const unsubProject = onSnapshot(doc(db, "projects", projectId), snap => {
      if (snap.exists()) setProject(snap.data() as Project);
      setLoading(false);
    });

    getDocs(query(collection(db, "surveys"), where("projectId", "==", projectId))).then(async snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Survey));
      setSurveys(list);
      const resMap: Record<string, SurveyResponse> = {};
      await Promise.all(list.map(async s => {
        const resSnap = await getDocs(collection(db, "surveys", s.id, "response"));
        if (!resSnap.empty) resMap[s.id] = resSnap.docs[0].data() as SurveyResponse;
      }));
      setResponses(resMap);
    });

    getDocs(query(collection(db, "lookReviews"), where("projectId", "==", projectId))).then(snap =>
      setLookReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as LookReview)))
    );

    getDocs(query(collection(db, "styles"), orderBy("order", "asc"))).then(snap =>
      setStyles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Style)))
    );

    const unsubLogs = onSnapshot(
      query(collection(db, "projects", projectId, "progressLogs"), orderBy("date", "desc")),
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressLog)))
    );
    const unsubMat = onSnapshot(
      query(collection(db, "projects", projectId, "materials"), orderBy("order", "asc")),
      snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)))
    );
    const unsubFiles = onSnapshot(
      query(collection(db, "projects", projectId, "files"), orderBy("uploadedAt", "desc")),
      snap => setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectFile)))
    );

    return () => { unsubProject(); unsubLogs(); unsubMat(); unsubFiles(); };
  }, [projectId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-300 text-sm">불러오는 중...</div>
  );
  if (!project) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">프로젝트를 찾을 수 없습니다.</div>
  );

  const dd = dDay(project.completionDate);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 pt-10 pb-6">
        <img src="/layer101_logo.png" alt="layer101" className="h-5 w-auto brightness-0 invert opacity-50 mb-4" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold leading-snug">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{project.clientName} 고객님</p>
          </div>
          {dd && (
            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-bold">{dd}</div>
              <div className="text-xs text-gray-500">{project.completionDate}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10 overflow-x-auto">
        <div className="flex px-2 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        {tab === "home" && <HomeTab project={project} setTab={setTab} />}
        {tab === "survey" && <SurveyTab surveys={surveys} responses={responses} />}
        {tab === "lookbook" && <LookbookTab lookReviews={lookReviews} styles={styles} />}
        {tab === "progress" && <ProgressTab logs={logs} />}
        {tab === "schedule" && <ScheduleTab stages={project.schedule?.stages ?? []} />}
        {tab === "materials" && <MaterialsTab materials={materials} />}
        {tab === "files" && <FilesTab files={files} />}
      </div>
    </div>
  );
}

// ── Tab: 홈 ───────────────────────────────────────────────────────────────
const QUICK_LINKS: { label: string; icon: string; tab: Tab }[] = [
  { label: "설문결과", icon: "📊", tab: "survey" },
  { label: "룩북", icon: "🖼️", tab: "lookbook" },
  { label: "공사현황", icon: "🏗️", tab: "progress" },
  { label: "공정표", icon: "📅", tab: "schedule" },
  { label: "마감재", icon: "🪵", tab: "materials" },
  { label: "파일", icon: "📁", tab: "files" },
];

function HomeTab({ project, setTab }: { project: Project; setTab: (t: Tab) => void }) {
  return (
    <div className="space-y-5">
      {(project.managerName || project.managerPhone) && (
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-2">담당 디자이너</p>
          <p className="font-medium text-gray-800 mb-3">{project.managerName}</p>
          <div className="flex gap-2">
            {project.managerPhone && (
              <a href={`tel:${project.managerPhone}`}
                className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl text-center">
                📞 전화
              </a>
            )}
            {project.managerKakao && (
              <a href={project.managerKakao} target="_blank" rel="noreferrer"
                className="flex-1 py-2.5 bg-yellow-400 text-gray-900 text-sm font-medium rounded-xl text-center">
                💬 카카오톡
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {QUICK_LINKS.map(item => (
          <button key={item.tab} onClick={() => setTab(item.tab)}
            className="bg-gray-50 rounded-2xl p-4 text-left hover:bg-gray-100 transition-colors active:scale-95">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab: 설문결과 ──────────────────────────────────────────────────────────
function SurveyTab({ surveys, responses }: { surveys: Survey[]; responses: Record<string, SurveyResponse> }) {
  if (!surveys.length) return <Empty icon="📊" text="등록된 설문이 없습니다." />;

  return (
    <div className="space-y-10">
      {surveys.map(survey => {
        const res = responses[survey.id];
        if (!survey.photos?.length) return null;
        const liked = survey.photos.filter(p => res?.answers[p.id] === "like");
        const disliked = survey.photos.filter(p => res?.answers[p.id] === "dislike");

        return (
          <div key={survey.id}>
            <h2 className="font-semibold text-gray-800 mb-4">{survey.title}</h2>
            {!res ? (
              <p className="text-sm text-gray-400">아직 응답이 없습니다.</p>
            ) : (
              <div className="space-y-5">
                {liked.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2">👍 좋아요 ({liked.length})</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {liked.map(p => <img key={p.id} src={p.url} className="aspect-square object-cover rounded-lg w-full" />)}
                    </div>
                  </div>
                )}
                {disliked.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 mb-2">👎 싫어요 ({disliked.length})</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {disliked.map(p => <img key={p.id} src={p.url} className="aspect-square object-cover rounded-lg w-full opacity-40" />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: 룩북 ──────────────────────────────────────────────────────────────
function LookbookTab({ lookReviews, styles }: { lookReviews: LookReview[]; styles: Style[] }) {
  if (!lookReviews.length) return <Empty icon="🖼️" text="등록된 룩북이 없습니다." />;

  return (
    <div className="space-y-10">
      {lookReviews.map(review => {
        const hearts = review.hearts || {};
        const byStyle = styles.map(s => ({
          style: s,
          photos: (s.photos || []).filter(p => hearts[p.id]),
        })).filter(x => x.photos.length > 0);

        return (
          <div key={review.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{review.customerName}</h2>
              <span className="text-xs text-pink-500">❤️ {Object.keys(hearts).length}</span>
            </div>
            {!byStyle.length ? (
              <p className="text-sm text-gray-400">아직 선택한 사진이 없습니다.</p>
            ) : byStyle.map(({ style, photos }) => (
              <div key={style.id} className="mb-6">
                <p className="text-xs font-medium text-gray-500 mb-2">{style.name}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map(p => <img key={p.id} src={p.url} className="aspect-square object-cover rounded-lg w-full" />)}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: 공사현황 ──────────────────────────────────────────────────────────
function ProgressTab({ logs }: { logs: ProgressLog[] }) {
  if (!logs.length) return <Empty icon="🏗️" text="아직 등록된 공사 현황이 없습니다." />;

  return (
    <div className="relative">
      <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-100" />
      <div className="space-y-8">
        {logs.map(log => (
          <div key={log.id} className="pl-7 relative">
            <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-gray-900 border-2 border-white shadow" />
            <p className="text-xs font-semibold text-gray-500 mb-1.5">{log.date}</p>
            {log.content && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">{log.content}</p>}
            {log.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {log.photos.map((url, i) => (
                  <img key={i} src={url} className="w-full aspect-video object-cover rounded-xl" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: 공정표 ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  완료: "bg-green-100 text-green-700",
  진행중: "bg-blue-100 text-blue-700",
  예정: "bg-gray-100 text-gray-400",
} as const;

function ScheduleTab({ stages }: { stages: Stage[] }) {
  if (!stages.length) return <Empty icon="📅" text="아직 등록된 공정표가 없습니다." />;

  const done = stages.filter(s => s.status === "완료").length;
  const pct = Math.round((done / stages.length) * 100);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">전체 진행률</span>
          <span className="font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{done}/{stages.length} 완료</p>
      </div>

      <div className="space-y-2">
        {[...stages].sort((a, b) => a.order - b.order).map((stage, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              stage.status === "완료" ? "bg-green-500" : stage.status === "진행중" ? "bg-blue-500" : "bg-gray-300"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-800">{stage.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[stage.status]}`}>
                  {stage.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{stage.plannedStart} ~ {stage.plannedEnd}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: 마감재 ────────────────────────────────────────────────────────────
function MaterialsTab({ materials }: { materials: Material[] }) {
  if (!materials.length) return <Empty icon="🪵" text="아직 등록된 마감재가 없습니다." />;

  const grouped = materials.reduce<Record<string, Material[]>>((acc, m) => {
    (acc[m.location] = acc[m.location] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([location, items]) => (
        <div key={location}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{location}</h3>
          <div className="space-y-2">
            {items.map(m => (
              <div key={m.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{m.category}</p>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    {m.spec && <p className="text-xs text-gray-500 mt-0.5">{m.spec}</p>}
                    {m.manufacturer && <p className="text-xs text-gray-400">{m.manufacturer}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    m.status === "확정" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: 파일 ─────────────────────────────────────────────────────────────
const FILE_ICON: Record<string, string> = { 계약서: "📄", 도면: "📐", 견적서: "💰" };

function FilesTab({ files }: { files: ProjectFile[] }) {
  if (!files.length) return <Empty icon="📁" text="등록된 파일이 없습니다." />;

  return (
    <div className="space-y-2">
      {files.map(f => (
        <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {FILE_ICON[f.type] ?? "📎"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
            <p className="text-xs text-gray-400">
              {f.type}{f.uploadedAt ? ` · ${f.uploadedAt.toDate().toLocaleDateString("ko-KR")}` : ""}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ))}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
