"use client";

import { useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────
interface Module {
  id: string;
  name: string;
  code: string;
  cats: string[];
  w: number; h: number; d: number;
  drawers: number; shelves: number; hanger: boolean;
  active: boolean;
  thumbnail?: string; // URL (없으면 SVG 자동 생성)
}

const CATEGORY_FILTERS = ["전체", "붙박이장", "주방가구", "홈오피스", "거실장"];
const POSITION_FILTERS = ["전체", "하부장", "상부장", "키큰장", "코너장"];

// ── 더미 데이터 ───────────────────────────────────────────────
const DUMMY_MODULES: Module[] = [
  { id:"1", name:"하부 서랍장 3단",   code:"BASE-DRW-3", cats:["붙박이장","하부장","서랍형"],  w:600,  h: 900, d:580, drawers:3, shelves:0, hanger:false, active:true  },
  { id:"2", name:"하부 오픈 선반장",   code:"BASE-SHF",   cats:["주방가구","하부장","선반형"],  w:600,  h: 900, d:580, drawers:0, shelves:3, hanger:false, active:true  },
  { id:"3", name:"행거+선반 혼합형",   code:"WARD-MIX",   cats:["붙박이장","키큰장","혼합형"], w:900,  h:2400, d:580, drawers:0, shelves:2, hanger:true,  active:true  },
  { id:"4", name:"상부 도어장 2짝",    code:"UPR-DR2",    cats:["주방가구","상부장","도어형"],  w:600,  h: 800, d:350, drawers:0, shelves:2, hanger:false, active:true  },
  { id:"5", name:"키큰 팬트리장",      code:"TALL-PNT",   cats:["주방가구","키큰장","선반형"],  w:600,  h:2200, d:580, drawers:2, shelves:5, hanger:false, active:true  },
  { id:"6", name:"코너 연결장",        code:"CORNER",     cats:["붙박이장","코너장"],           w:450,  h:2400, d:580, drawers:0, shelves:4, hanger:false, active:false },
];

// ── 모듈 SVG 썸네일 자동 생성 ──────────────────────────────────
const THUMB_COLORS = {
  hang:   "#dbeafe",
  shelf:  "#dcfce7",
  drawer: "#fef9c3",
  bg:     "#f8fafc",
  frame:  "#334155",
  rod:    "#3b82f6",
  line:   "#6b7280",
  dh:     "#fbbf24",
};

function ModuleThumbnailSVG({ mod }: { mod: Module }) {
  const W = 80, H = 110, P = 4;
  const iw = W - P * 2, ih = H - P * 2;

  const hangH = mod.hanger ? (mod.shelves > 0 ? ih * 0.55 : ih) : 0;
  const restH = ih - hangH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {/* 배경 */}
      <rect width={W} height={H} fill={THUMB_COLORS.bg} />
      {/* 테두리 */}
      <rect x={0} y={0} width={W} height={H}
        fill="none" stroke={THUMB_COLORS.frame} strokeWidth={2} />
      {/* 옆판 암시 */}
      <rect x={0} y={0} width={P} height={H} fill={THUMB_COLORS.frame} opacity={0.15} />
      <rect x={W - P} y={0} width={P} height={H} fill={THUMB_COLORS.frame} opacity={0.15} />

      {/* 행거 구역 */}
      {mod.hanger && (
        <g>
          <rect x={P} y={P} width={iw} height={hangH} fill={THUMB_COLORS.hang} />
          {/* 행거레일 */}
          <line x1={P + 2} y1={P + 14} x2={W - P - 2} y2={P + 14}
            stroke={THUMB_COLORS.rod} strokeWidth={1.5} />
          {/* 옷걸이 심볼 */}
          {[1, 2, 3].map(i => {
            const cx = P + iw * i / 4;
            return (
              <path key={i}
                d={`M${cx},${P+14} L${cx-6},${P+28} L${cx+6},${P+28}`}
                stroke={THUMB_COLORS.rod} strokeWidth={0.8} fill="none" opacity={0.7} />
            );
          })}
        </g>
      )}

      {/* 서랍 구역 */}
      {mod.drawers > 0 && (() => {
        const startY = P + hangH;
        const drawerZoneH = mod.shelves === 0 ? restH : restH * 0.5;
        const dh = (drawerZoneH - 3 * (mod.drawers + 1)) / mod.drawers;
        return (
          <g>
            <rect x={P} y={startY} width={iw} height={drawerZoneH}
              fill={THUMB_COLORS.drawer} opacity={0.5} />
            {Array.from({ length: mod.drawers }, (_, i) => {
              const dy = startY + 3 + i * (dh + 3);
              return (
                <g key={i}>
                  <rect x={P + 2} y={dy} width={iw - 4} height={dh}
                    fill="white" stroke={THUMB_COLORS.line} strokeWidth={0.5} rx={1} />
                  <rect x={P + iw / 2 - 10} y={dy + dh / 2 - 2} width={20} height={4}
                    fill={THUMB_COLORS.dh} rx={2} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* 선반 구역 */}
      {mod.shelves > 0 && (() => {
        const startY = P + hangH + (mod.drawers > 0 ? restH * 0.5 : 0);
        const shelfZoneH = mod.drawers > 0 ? restH * 0.5 : restH;
        const sg = shelfZoneH / (mod.shelves + 1);
        return (
          <g>
            <rect x={P} y={startY} width={iw} height={shelfZoneH}
              fill={THUMB_COLORS.shelf} opacity={0.4} />
            {Array.from({ length: mod.shelves }, (_, i) => (
              <rect key={i} x={P} y={startY + sg * (i + 1) - 1}
                width={iw} height={2} fill={THUMB_COLORS.line} opacity={0.6} />
            ))}
          </g>
        );
      })()}
    </svg>
  );
}

// ── 썸네일 표시 컴포넌트 ──────────────────────────────────────
function Thumbnail({ mod }: { mod: Module }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center"
      style={{ width: 80, height: 110 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {mod.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mod.thumbnail} alt={mod.name} className="w-full h-full object-cover" />
      ) : (
        <ModuleThumbnailSVG mod={mod} />
      )}

      {/* hover overlay — 이미지 변경 */}
      {hover && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
          <span className="text-white text-xs">📷</span>
          <span className="text-white text-xs font-medium leading-tight text-center px-1">
            이미지<br />등록
          </span>
        </div>
      )}
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function ModulesPage() {
  const [modules]   = useState<Module[]>(DUMMY_MODULES);
  const [catFilter, setCatFilter] = useState("전체");
  const [posFilter, setPosFilter] = useState("전체");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = modules.filter((m) =>
    (catFilter === "전체" || m.cats.includes(catFilter)) &&
    (posFilter === "전체" || m.cats.includes(posFilter))
  );

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">모듈 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">가구 모듈 등록 및 패널·철물 슬롯 설정</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 토글 */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-xs transition-colors ${view==="grid" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              ▦ 그리드
            </button>
            <button onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs transition-colors ${view==="list" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              ☰ 목록
            </button>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + 모듈 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1.5">
          {CATEGORY_FILTERS.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                catFilter === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>{c}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex gap-1.5">
          {POSITION_FILTERS.map((p) => (
            <button key={p} onClick={() => setPosFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                posFilter === p ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>{p}</button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}개 모듈</span>
      </div>

      {/* ── 그리드 뷰 ── */}
      {view === "grid" && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((mod) => (
            <div key={mod.id}
              className={`bg-white rounded-xl border p-4 space-y-3 transition-all ${
                mod.active ? "border-gray-200 hover:border-blue-300 hover:shadow-sm" : "border-gray-100 opacity-50"
              }`}
            >
              {/* 상단: 썸네일 + 기본 정보 */}
              <div className="flex gap-3">
                <Thumbnail mod={mod} />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{mod.name}</p>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      mod.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}>
                      {mod.active ? "사용" : "미사용"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{mod.code}</p>
                  <div className="bg-gray-50 rounded px-2 py-1.5 text-xs text-gray-600">
                    <span className="font-medium">{mod.w} × {mod.h} × {mod.d}</span>
                    <span className="text-gray-400"> mm</span>
                  </div>
                  {/* 구성 태그 */}
                  <div className="flex gap-1 flex-wrap">
                    {mod.drawers > 0 && <span className="bg-yellow-50 text-yellow-700 text-xs px-1.5 py-0 rounded-full leading-5">서랍×{mod.drawers}</span>}
                    {mod.shelves > 0 && <span className="bg-green-50 text-green-700 text-xs px-1.5 py-0 rounded-full leading-5">선반×{mod.shelves}</span>}
                    {mod.hanger   && <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0 rounded-full leading-5">행거</span>}
                  </div>
                </div>
              </div>

              {/* 카테고리 태그 */}
              <div className="flex flex-wrap gap-1">
                {mod.cats.map((c) => (
                  <span key={c} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>

              {/* 액션 */}
              <div className="flex gap-2 pt-1">
                <button className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 text-gray-600 hover:bg-gray-50">
                  편집
                </button>
                <button className="flex-1 text-xs border border-blue-200 text-blue-600 rounded-lg py-1.5 hover:bg-blue-50">
                  슬롯 설정
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 목록 뷰 ── */}
      {view === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">썸네일</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">모듈명</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">코드</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">치수</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">구성</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((mod) => (
                <tr key={mod.id} className={`hover:bg-gray-50 ${!mod.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2">
                    <div className="w-12 h-16 rounded overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                      {mod.thumbnail
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={mod.thumbnail} alt={mod.name} className="w-full h-full object-cover" />
                        : <ModuleThumbnailSVG mod={{ ...mod }} />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-800">{mod.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {mod.cats.map(c => <span key={c} className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded-full leading-5">{c}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{mod.code}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{mod.w}×{mod.h}×{mod.d}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {mod.drawers > 0 && <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 rounded-full leading-5">서랍×{mod.drawers}</span>}
                      {mod.shelves > 0 && <span className="text-xs bg-green-50 text-green-700 px-1.5 rounded-full leading-5">선반×{mod.shelves}</span>}
                      {mod.hanger   && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded-full leading-5">행거</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mod.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {mod.active ? "사용" : "미사용"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="text-xs text-gray-500 hover:text-gray-700">편집</button>
                      <button className="text-xs text-blue-600 hover:underline">슬롯 설정</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
