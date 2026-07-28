"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── 임시 더미 데이터 ───────────────────────────────────────────
const PROJECT = {
  id: "1",
  name: "강남 도곡동 래미안 1401호",
  client_name: "김민준",
  client_phone: "010-1234-5678",
  site_address: "서울시 강남구 도곡동 467",
  survey_date: "2026-05-20",
  install_date: "2026-06-15",
  status: "designing",
  notes: "드레스룸 전체 붙박이장 + 주방 상하부장",
};

const SPACES = [
  { id: "s1", name: "안방 붙박이장", width: 3200, height: 2400, depth: 600, modules: 4 },
  { id: "s2", name: "드레스룸",      width: 2400, height: 2400, depth: 600, modules: 6 },
  { id: "s3", name: "주방 상부장",   width: 2700, height: 800,  depth: 350, modules: 0 },
];

const STATUS_STEPS = [
  { key: "survey",        label: "실측" },
  { key: "designing",     label: "설계" },
  { key: "quoted",        label: "견적" },
  { key: "confirmed",     label: "수주" },
  { key: "ordered",       label: "발주" },
  { key: "in_production", label: "제작" },
  { key: "delivered",     label: "납품" },
];

const TABS = ["공간 설계", "견적", "발주서", "도면", "메모"];

// ── 벽면 설정 타입 ────────────────────────────────────────────
type CornerType = "filler" | "blind" | "carousel";
interface WallConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  cornerToNext?: CornerType;
}

const CORNER_OPTIONS: { value: CornerType; label: string; desc: string }[] = [
  { value: "filler",   label: "채움판",    desc: "좁은 채움판으로 코너 마감" },
  { value: "blind",    label: "블라인드",  desc: "한쪽 옆판을 연장해 코너 마감" },
  { value: "carousel", label: "카루젤",    desc: "회전식 코너 장 적용" },
];

const WALL_NAME_PRESET = ["정면", "우측", "후면", "좌측", "기타"];
const WALL_LABEL_PRESET = ["A", "B", "C", "D", "E", "F"];

// ── 평면 다이어그램 (탑뷰) ────────────────────────────────────
// 벽면 배열을 시계방향으로 해석: wall[0]=상단/정면, wall[1]=우측, wall[2]=좌측or하단, wall[3]=좌측
// ㄷ자 특례: initWallsFromShape가 [좌측(A), 정면(B), 우측(C)] 순이므로 B=상단, A=좌, C=우로 배치
function TopDownDiagram({ walls, mirrored = false }: { walls: WallConfig[]; mirrored?: boolean }) {
  if (walls.length === 0) return null;

  const n     = walls.length;
  const D     = 24;   // 벽 두께 표현 (px)
  const PAD   = 18;
  const COLS  = ["#bfdbfe","#bbf7d0","#fef08a","#f5d0fe","#c7d2fe","#fed7aa"];
  const SCALE = 0.07;

  // mm → 표시px (최소 40, 최대 220)
  function wl(w: WallConfig) { return Math.min(Math.max(w.width * SCALE, 40), 220); }

  type Rect = { x:number; y:number; w:number; h:number; ci:number; wi:number };
  const rects: Rect[] = [];
  let svgW = 0, svgH = 0;

  if (n === 1) {
    // 일자 ━━━━━━━━
    const ww = wl(walls[0]);
    svgW = ww + PAD * 2; svgH = D + PAD * 2;
    rects.push({ x:PAD, y:PAD, w:ww, h:D, ci:0, wi:0 });

  } else if (n === 2) {
    // ㄱ자: wall[0]=상단 수평, wall[1]=우측(or 좌측 if mirrored) 수직
    const w0 = wl(walls[0]), w1 = wl(walls[1]);
    svgW = w0 + PAD * 2; svgH = w1 + D + PAD * 2;
    rects.push({ x:PAD, y:PAD, w:w0, h:D, ci:0, wi:0 });
    if (mirrored) {
      // 역ㄱ: 수직 벽을 왼쪽에
      rects.push({ x:PAD, y:PAD+D, w:D, h:w1, ci:1, wi:1 });
    } else {
      // ㄱ: 수직 벽을 오른쪽에
      rects.push({ x:PAD+w0-D, y:PAD+D, w:D, h:w1, ci:1, wi:1 });
    }

  } else if (n === 3) {
    // ㄷ자: wall[0]=좌측, wall[1]=정면(상단), wall[2]=우측
    //        ┌──정면──┐
    //        좌측    우측
    //        (입구→아래)
    const wFront = wl(walls[1]);
    const wSide  = Math.max(wl(walls[0]), wl(walls[2]));
    svgW = wFront + PAD * 2; svgH = wSide + D + PAD * 2;
    rects.push({ x:PAD, y:PAD, w:wFront, h:D, ci:1, wi:1 });          // 정면 (상단)
    rects.push({ x:PAD, y:PAD+D, w:D, h:wSide, ci:0, wi:0 });          // 좌측
    rects.push({ x:PAD+wFront-D, y:PAD+D, w:D, h:wSide, ci:2, wi:2 }); // 우측

  } else {
    // 4면 이상: 직사각형 배치 (top, right, bottom, left, ...)
    const w0 = wl(walls[0]), w1 = wl(walls[1]);
    const w2 = walls[2] ? wl(walls[2]) : w0;
    const w3 = walls[3] ? wl(walls[3]) : w1;
    const rW = Math.max(w0, w2), rH = Math.max(w1, w3);
    svgW = rW + PAD * 2; svgH = rH + PAD * 2;
    rects.push({ x:PAD, y:PAD, w:rW, h:D, ci:0, wi:0 });                      // 상단
    rects.push({ x:PAD+rW-D, y:PAD+D, w:D, h:rH-D*2, ci:1, wi:1 });           // 우측
    if (walls[2]) rects.push({ x:PAD, y:PAD+rH-D, w:rW, h:D, ci:2, wi:2 });   // 하단
    if (walls[3]) rects.push({ x:PAD, y:PAD+D, w:D, h:rH-D*2, ci:3, wi:3 });  // 좌측
    // 5번째 이상 벽면: 우측 외부에 작게 표시
    for (let i = 4; i < n; i++) {
      rects.push({ x:PAD+rW+4+(i-4)*(D+4), y:PAD, w:D, h:wl(walls[i]), ci:i, wi:i });
    }
  }

  // 인테리어 영역 (공간 내부 음영)
  const interior: { x:number; y:number; w:number; h:number } | null = (() => {
    if (n === 1) return null;
    if (n === 2) {
      const w0=wl(walls[0]),w1=wl(walls[1]);
      // 역ㄱ: 인테리어는 오른쪽 하단, ㄱ: 왼쪽 하단
      return mirrored
        ? { x:PAD+D, y:PAD+D, w:w0-D, h:w1 }
        : { x:PAD, y:PAD+D, w:w0-D, h:w1 };
    }
    if (n === 3) { const wF=wl(walls[1]),wS=Math.max(wl(walls[0]),wl(walls[2])); return { x:PAD+D, y:PAD+D, w:wF-D*2, h:wS }; }
    const w0=wl(walls[0]),w1=wl(walls[1]),w2=walls[2]?wl(walls[2]):w0,w3=walls[3]?wl(walls[3]):w1;
    const rW=Math.max(w0,w2),rH=Math.max(w1,w3);
    return { x:PAD+D, y:PAD+D, w:rW-D*2, h:rH-D*2 };
  })();

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* 내부 음영 */}
        {interior && interior.w > 0 && interior.h > 0 && (
          <rect x={interior.x} y={interior.y} width={interior.w} height={interior.h}
            fill="#e0f2fe" opacity={0.5} />
        )}

        {/* 벽면 */}
        {rects.map((r) => (
          <g key={r.wi}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h}
              fill={COLS[r.ci % COLS.length]} stroke="#94a3b8" strokeWidth={1.5} rx={2} />
            {/* 이름 */}
            {r.w >= 24 && r.h >= 10 && (
              <text x={r.x + r.w/2} y={r.y + r.h/2 + 3}
                textAnchor="middle" fontSize={9} fill="#334155" fontFamily="sans-serif"
                fontWeight="600">
                {walls[r.wi].name.replace(/\s*\(.*\)/, "").trim()}
              </text>
            )}
            {/* 치수 */}
            {r.w >= 40 && r.h >= 20 && (
              <text x={r.x + r.w/2} y={r.y + r.h/2 + 13}
                textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="monospace">
                {walls[r.wi].width.toLocaleString()}
              </text>
            )}
          </g>
        ))}

        {/* 입구 표시 (ㄷ자) */}
        {n === 3 && (
          <text x={svgW/2} y={svgH - 5}
            textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="sans-serif">
            ↕ 입구
          </text>
        )}
      </svg>
    </div>
  );
}

// ── 벽면 구성 모달 ────────────────────────────────────────────
function WallConfigModal({
  space, onClose, projectId,
}: {
  space: typeof SPACES[0];
  onClose: () => void;
  projectId: string;
}) {
  const [walls, setWalls] = useState<WallConfig[]>([
    { id: "wA", name: "정면 (A)", width: space.width, height: space.height, depth: space.depth },
  ]);

  function addWall() {
    const idx   = walls.length;
    const label = WALL_LABEL_PRESET[idx] ?? String.fromCharCode(65 + idx);
    const name  = WALL_NAME_PRESET[idx] ?? "기타";
    setWalls(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: `${name} (${label})`, width: 1200, height: space.height, depth: space.depth },
    ]);
  }

  function removeWall(id: string) {
    setWalls(prev => prev.filter(w => w.id !== id));
  }

  function updateWall(id: string, field: keyof WallConfig, value: string | number) {
    setWalls(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  const totalWidth = walls.reduce((s, w) => s + w.width, 0);
  const shapeLabel = walls.length === 1 ? "일자" : walls.length === 2 ? "ㄱ자" : walls.length === 3 ? "ㄷ자" : `${walls.length}면`;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{space.name} — 벽면 구성</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              ㄱ자·ㄷ자 공간은 벽면을 여러 개 추가하세요. 현재: <span className="font-medium text-purple-600">{shapeLabel}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* 평면 다이어그램 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">평면도 (위에서 본 배치)</p>
          <TopDownDiagram walls={walls} />
        </div>

        {/* 벽면 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {walls.map((w, i) => (
            <div key={w.id}>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {WALL_LABEL_PRESET[i] ?? String(i + 1)}
                    </span>
                    <input
                      value={w.name}
                      onChange={(e) => updateWall(w.id, "name", e.target.value)}
                      className="text-sm font-semibold text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  {walls.length > 1 && (
                    <button
                      onClick={() => removeWall(w.id)}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([ ["폭 W (mm)", "width", w.width], ["높이 H (mm)", "height", w.height], ["깊이 D (mm)", "depth", w.depth] ] as [string,keyof WallConfig,number][]).map(([label, field, val]) => (
                    <div key={field}>
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => updateWall(w.id, field, Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 코너 연결 (다음 벽면이 있을 때) */}
              {i < walls.length - 1 && (
                <div className="flex items-center gap-3 py-2 px-2">
                  <div className="flex-1 h-px bg-purple-100" />
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5">
                    <span className="text-purple-400 text-sm">⌐</span>
                    <span className="text-xs text-purple-600 font-medium">코너 처리</span>
                    <select
                      value={w.cornerToNext ?? "filler"}
                      onChange={(e) => updateWall(w.id, "cornerToNext", e.target.value)}
                      className="text-xs border-none bg-transparent text-purple-700 font-medium focus:outline-none cursor-pointer"
                    >
                      {CORNER_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <span className="text-xs text-purple-400">
                      → {CORNER_OPTIONS.find(c => c.value === (w.cornerToNext ?? "filler"))?.desc}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-purple-100" />
                </div>
              )}
            </div>
          ))}

          {/* 벽면 추가 버튼 */}
          {walls.length < 6 && (
            <button
              onClick={addWall}
              className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              + 벽면 추가
            </button>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-gray-500 space-y-0.5">
            <div>총 <span className="font-medium">{walls.length}개</span> 벽면 · 합계 {totalWidth.toLocaleString()}mm</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:bg-white transition-colors"
            >
              취소
            </button>
            <button className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors">
              저장
            </button>
            <Link
              href={`/studio/projects/${projectId}/spaces/${space.id}`}
              className="text-sm bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors"
            >
              설계 열기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab]     = useState("공간 설계");
  const [showNewSpace, setShowNewSpace] = useState(false);
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === PROJECT.status);

  return (
    <div className="flex flex-col h-full">
      {/* 프로젝트 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/studio/projects" className="text-xs text-gray-400 hover:text-gray-600">프로젝트 목록</Link>
              <span className="text-gray-300 text-xs">›</span>
              <span className="text-xs text-gray-600">{PROJECT.name}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{PROJECT.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {PROJECT.client_name} · {PROJECT.client_phone} · {PROJECT.site_address}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
              편집
            </button>
            <button className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
              견적서 생성
            </button>
          </div>
        </div>

        {/* 진행 상태 스텝 */}
        <div className="flex items-center gap-0 mt-4">
          {STATUS_STEPS.map((step, i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" :
                  done   ? "bg-green-100 text-green-700" :
                           "bg-gray-100 text-gray-400"
                }`}>
                  {done && <span>✓</span>}
                  {step.label}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${done ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* 탭 */}
        <div className="flex gap-0 mt-4 border-b border-gray-100 -mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "공간 설계" && (
          <SpaceTab
            spaces={SPACES}
            showNew={showNewSpace}
            onToggleNew={() => setShowNewSpace((v) => !v)}
            projectId={projectId}
          />
        )}
        {activeTab === "견적" && <QuoteTab />}
        {activeTab === "발주서" && <OrderTab />}
        {activeTab === "도면" && <DrawingTab />}
        {activeTab === "메모" && <NoteTab notes={PROJECT.notes} />}
      </div>
    </div>
  );
}

// ── 공간 형태 프리셋 아이콘 ──────────────────────────────────
type SpaceShape = "linear" | "l_shape" | "u_shape" | "custom";

function ShapeIcon({ shape, size = 40, mirrored = false }: { shape: SpaceShape; size?: number; mirrored?: boolean }) {
  const s = size, t = Math.round(s * 0.18), c = "#3b82f6", bg = "#dbeafe";
  if (shape === "linear") return (
    <svg viewBox="0 0 40 40" width={s} height={s}>
      <rect x={4} y={14} width={32} height={12} fill={bg} stroke={c} strokeWidth={2} rx={2} />
    </svg>
  );
  if (shape === "l_shape") return (
    // mirrored=true 이면 scaleX(-1)로 역ㄱ 모양
    <svg viewBox="0 0 40 40" width={s} height={s}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}>
      <path d={`M4,4 L${4+t},4 L${4+t},${40-t-4} L36,${40-t-4} L36,36 L4,36 Z`}
        fill={bg} stroke={c} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
  if (shape === "u_shape") return (
    <svg viewBox="0 0 40 40" width={s} height={s}>
      <path d={`M4,4 L${4+t},4 L${4+t},${36-t} L${36-t},${36-t} L${36-t},4 L36,4 L36,36 L4,36 Z`}
        fill={bg} stroke={c} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
  // custom
  return (
    <svg viewBox="0 0 40 40" width={s} height={s}>
      <circle cx={10} cy={20} r={3} fill={c} />
      <circle cx={20} cy={20} r={3} fill={c} />
      <circle cx={30} cy={20} r={3} fill={c} />
    </svg>
  );
}

const SHAPE_PRESETS: { shape: SpaceShape; label: string; walls: number; desc: string }[] = [
  { shape:"linear",  label:"일자",  walls:1, desc:"벽면 1개, 드레스룸·거실장" },
  { shape:"l_shape", label:"ㄱ자",  walls:2, desc:"벽면 2개, 코너 드레스룸" },
  { shape:"u_shape", label:"ㄷ자",  walls:3, desc:"벽면 3개, 워크인 클로젯" },
  { shape:"custom",  label:"커스텀",walls:0, desc:"벽면 직접 추가" },
];

function initWallsFromShape(shape: SpaceShape, h: number, d: number, mirrored = false): WallConfig[] {
  const base = (name: string, w: number): WallConfig =>
    ({ id: crypto.randomUUID(), name, width: w, height: h, depth: d });
  if (shape === "l_shape")
    return [
      base("정면 (A)", 2400),
      { ...base(mirrored ? "좌측 (B)" : "우측 (B)", 1800), cornerToNext: "filler" as CornerType },
    ];
  if (shape === "u_shape")
    return [base("좌측 (A)", 1200), { ...base("정면 (B)", 2400), cornerToNext: "filler" as CornerType },
            { ...base("우측 (C)", 1200), cornerToNext: "filler" as CornerType }];
  return [base("정면 (A)", 3200)];
}

// ── 새 공간 입력 폼 ───────────────────────────────────────────
function NewSpaceForm({ onClose }: { onClose: () => void }) {
  const [name,     setName]     = useState("");
  const [shape,    setShape]    = useState<SpaceShape>("linear");
  const [mirrored, setMirrored] = useState(false);
  const [h,        setH]        = useState(2400);
  const [d,        setD]        = useState(600);
  const [memo,     setMemo]     = useState("");
  const [walls, setWalls] = useState<WallConfig[]>(() => initWallsFromShape("linear", 2400, 600));

  function handleShapeChange(s: SpaceShape) {
    setShape(s);
    setMirrored(false);
    setWalls(initWallsFromShape(s, h, d, false));
  }

  function handleMirrorToggle() {
    const next = !mirrored;
    setMirrored(next);
    setWalls(initWallsFromShape(shape, h, d, next));
  }

  function updateWall(id: string, field: keyof WallConfig, value: string | number) {
    setWalls(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function moveWall(id: string, delta: -1 | 1) {
    setWalls(prev => {
      const idx = prev.findIndex(w => w.id === id);
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  const wallColors = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-yellow-100 text-yellow-700", "bg-purple-100 text-purple-700"];
  const wallLabels = ["A","B","C","D"];

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
      {/* 상단 헤더 */}
      <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">새 공간 추가</p>
        <button onClick={onClose} className="text-blue-200 hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="p-5 space-y-5">
        {/* 공간명 */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">공간명 <span className="text-red-400">*</span></label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="예) 안방 붙박이장, 드레스룸"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 형태 선택 */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-2">공간 형태</label>
          <div className="grid grid-cols-4 gap-2">
            {SHAPE_PRESETS.map(p => (
              <button key={p.shape} onClick={() => handleShapeChange(p.shape)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  shape === p.shape
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <ShapeIcon
                  shape={p.shape} size={36}
                  mirrored={p.shape === "l_shape" && mirrored}
                />
                <span className={`text-xs font-semibold ${shape === p.shape ? "text-blue-700" : "text-gray-600"}`}>
                  {p.shape === "l_shape" && mirrored ? "역ㄱ자" : p.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-gray-400">
              {SHAPE_PRESETS.find(p => p.shape === shape)?.desc}
            </p>
            {shape === "l_shape" && (
              <button
                onClick={handleMirrorToggle}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  mirrored
                    ? "border-blue-400 text-blue-600 bg-blue-50"
                    : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <span>↔</span> 좌우 반전
              </button>
            )}
          </div>
        </div>

        {/* 벽면 치수 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">벽면 치수</label>
            {shape === "custom" && (
              <button onClick={() => {
                const i = walls.length;
                setWalls(prev => [...prev, {
                  id: crypto.randomUUID(),
                  name: `${wallLabels[i] ?? String(i+1)}장`,
                  width: 1200, height: h, depth: d
                }]);
              }} className="text-xs text-blue-600 hover:underline">+ 장 추가</button>
            )}
          </div>
          <div className="space-y-2">
            {walls.map((w, i) => (
              <div key={w.id} className="flex items-center gap-2">
                {/* 순서 이동 버튼 (커스텀 모드) */}
                {shape === "custom" && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveWall(w.id, -1)}
                      disabled={i === 0}
                      className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    >▲</button>
                    <button
                      onClick={() => moveWall(w.id, 1)}
                      disabled={i === walls.length - 1}
                      className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    >▼</button>
                  </div>
                )}
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${wallColors[i % wallColors.length]}`}>
                  {wallLabels[i] ?? String(i + 1)}
                </span>
                <input value={w.name} onChange={e => updateWall(w.id, "name", e.target.value)}
                  className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <div className="flex items-center gap-1 text-xs text-gray-400">W</div>
                <input type="number" value={w.width} onChange={e => updateWall(w.id, "width", Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <div className="flex items-center gap-1 text-xs text-gray-400">H</div>
                <input type="number" value={w.height} onChange={e => updateWall(w.id, "height", Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <div className="flex items-center gap-1 text-xs text-gray-400">D</div>
                <input type="number" value={w.depth} onChange={e => updateWall(w.id, "depth", Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                {i < walls.length - 1 && (
                  <span className="text-purple-400 text-xs ml-1">⌐ 연결</span>
                )}
                {shape === "custom" && walls.length > 1 && (
                  <button onClick={() => setWalls(p => p.filter(x => x.id !== w.id))}
                    className="text-red-300 hover:text-red-500 text-xs ml-auto">✕</button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <TopDownDiagram walls={walls} mirrored={mirrored} />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">메모</label>
          <textarea
            rows={2}
            value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="특이사항, 요청사항 (예: 코너장 설치 필요, 문 방향 주의)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="text-sm text-gray-500 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
            취소
          </button>
          <button
            disabled={!name.trim()}
            className="text-sm text-white bg-blue-600 rounded-lg px-5 py-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            공간 저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 공간 설계 탭 ──────────────────────────────────────────────
function SpaceTab({
  spaces, showNew, onToggleNew, projectId,
}: {
  spaces: typeof SPACES;
  showNew: boolean;
  onToggleNew: () => void;
  projectId: string;
}) {
  const [configSpaceId, setConfigSpaceId] = useState<string | null>(null);
  const configSpace = spaces.find(s => s.id === configSpaceId) ?? null;

  return (
    <div className="space-y-4">
      {/* 벽면 구성 모달 */}
      {configSpace && (
        <WallConfigModal
          space={configSpace}
          onClose={() => setConfigSpaceId(null)}
          projectId={projectId}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">공간 목록</h2>
        <button
          onClick={onToggleNew}
          className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
        >
          + 공간 추가
        </button>
      </div>

      {/* 새 공간 입력 폼 */}
      {showNew && <NewSpaceForm onClose={onToggleNew} />}

      {/* 공간 카드 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{space.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {space.width} × {space.height} × {space.depth} mm
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                space.modules > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {space.modules > 0 ? `모듈 ${space.modules}개` : "비어있음"}
              </span>
            </div>

            {/* 공간 미리보기 막대 */}
            <div
              className="bg-gray-100 rounded border border-gray-200 mb-3 flex items-end gap-0.5 p-1"
              style={{ height: "60px" }}
            >
              {space.modules > 0 ? (
                Array.from({ length: space.modules }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-blue-200 border border-blue-300"
                    style={{ height: `${55 + (i % 3) * 5}%` }}
                  />
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                  모듈을 추가하세요
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/studio/projects/${projectId}/spaces/${space.id}`}
                className="flex-1 text-xs text-center text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition-colors"
              >
                설계 열기
              </Link>
              <button
                onClick={() => setConfigSpaceId(space.id)}
                className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                title="벽면 구성 설정"
              >
                벽면 설정
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 견적 탭 ───────────────────────────────────────────────────
function QuoteTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">견적 내역</h2>
        <button className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
          견적서 PDF 출력
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">항목</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">수량</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">단가</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { name: "안방 붙박이장 — 자재비",  qty: 1, unit: 320000, total: 320000 },
              { name: "안방 붙박이장 — 철물비",  qty: 1, unit:  85000, total:  85000 },
              { name: "드레스룸 — 자재비",       qty: 1, unit: 480000, total: 480000 },
              { name: "드레스룸 — 철물비",       qty: 1, unit: 120000, total: 120000 },
              { name: "설치비",                  qty: 1, unit: 300000, total: 300000 },
              { name: "운임비",                  qty: 1, unit: 200000, total: 200000 },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{row.name}</td>
                <td className="px-4 py-3 text-right text-gray-500">{row.qty}</td>
                <td className="px-4 py-3 text-right text-gray-500">{row.unit.toLocaleString()}원</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{row.total.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">합계</td>
              <td className="px-4 py-3 text-right text-lg font-bold text-blue-700">1,505,000원</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── 발주서 탭 ─────────────────────────────────────────────────
function OrderTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">발주서</h2>
        <div className="flex gap-2">
          <button className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
            판재 발주서 Excel
          </button>
          <button className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
            철물 발주서 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 판재 컷리스트 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">판재 컷리스트</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">32장</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {[
              { name: "옆판", size: "2400 × 580", thickness: "18T", qty: 8,  mat: "LPM 화이트" },
              { name: "상판", size: "780 × 580",  thickness: "18T", qty: 4,  mat: "LPM 화이트" },
              { name: "하판", size: "780 × 580",  thickness: "18T", qty: 4,  mat: "LPM 화이트" },
              { name: "선반", size: "776 × 560",  thickness: "18T", qty: 12, mat: "LPM 화이트" },
              { name: "뒷판", size: "2364 × 798", thickness: "9T",  qty: 4,  mat: "MDF 화이트" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <div>
                  <span className="font-medium text-gray-700">{row.name}</span>
                  <span className="ml-2 text-gray-400">{row.size} · {row.thickness}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{row.mat}</span>
                  <span className="font-semibold text-gray-700">×{row.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 철물 목록 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">철물 목록</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">6종</span>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: "블럼 클립탑 경첩 110도",      brand: "블럼", qty: 24, unit: "ea" },
              { name: "블럼 TANDEM 서랍레일 500mm",  brand: "블럼", qty: 12, unit: "set" },
              { name: "캠락 M6×12.5",                brand: "국산", qty: 80, unit: "ea" },
              { name: "선반핀 5mm",                   brand: "국산", qty: 48, unit: "ea" },
              { name: "행거바 알루미늄 1200mm",       brand: "국산", qty: 2,  unit: "ea" },
              { name: "푸쉬피팅 마그네틱",            brand: "블럼", qty: 10, unit: "ea" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <div>
                  <span className="font-medium text-gray-700">{row.name}</span>
                  <span className="ml-1.5 text-gray-400">{row.brand}</span>
                </div>
                <span className="font-semibold text-gray-700">×{row.qty} {row.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 도면 탭 ───────────────────────────────────────────────────
function DrawingTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">고객 전달 도면</h2>
        <div className="flex gap-2">
          <button className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
            DXF 내보내기
          </button>
          <button className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
            PDF 출력
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {["안방 붙박이장 — 정면도", "드레스룸 — 정면도"].map((title) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-2">📐</div>
                <p className="text-xs">설계 완료 후 자동 생성</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메모 탭 ───────────────────────────────────────────────────
function NoteTab({ notes }: { notes: string }) {
  const [text, setText] = useState(notes);
  return (
    <div className="space-y-3 max-w-xl">
      <h2 className="text-sm font-semibold text-gray-700">현장 메모</h2>
      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
        저장
      </button>
    </div>
  );
}
