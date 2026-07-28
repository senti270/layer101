"use client";

import { useState } from "react";
import Link from "next/link";

// ─── 상수 ────────────────────────────────────────────────────
const SC = 0.2; // mm → px 스케일
const PT = 18;   // 판재 두께 (mm)

function px(mm: number) { return mm * SC; }

// ─── 타입 ────────────────────────────────────────────────────
interface Wall {
  id: string; name: string;
  width: number; height: number; depth: number;
  cornerToNext?: "filler" | "blind" | "carousel";
}
interface PlacedMod {
  id: string; wallId: string;
  name: string;
  posX: number; width: number; height: number;
  drawers: number; shelves: number; hanger: boolean;
  hasDoor: boolean; doorCount: number; doorGap: number;
  baseboard: number;     // 걸레받이 높이 (mm)
  topSurround: number;   // 상부 서라운딩 높이 (mm)
  leftSurround: number;  // 좌 서라운딩 폭 (mm)
  rightSurround: number; // 우 서라운딩 폭 (mm)
}
interface PaletteMod {
  id: string; name: string; code: string;
  drawers: number; shelves: number; hanger: boolean;
  defaultWidth: number; defaultHeight: number;
  tags: string[];
}

// ─── 더미 데이터 ─────────────────────────────────────────────
const WALLS: Wall[] = [
  { id:"wA", name:"정면 (A)", width:3200, height:2400, depth:600, cornerToNext:"filler" },
  { id:"wB", name:"우측 (B)", width:1800, height:2400, depth:600 },
];

const PLACED_INIT: PlacedMod[] = [
  { id:"p1", wallId:"wA", posX:0,    width:900, height:2400, name:"2단 행거형",  drawers:0, shelves:0, hanger:true,  hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
  { id:"p2", wallId:"wA", posX:900,  width:600, height:2400, name:"3단 서랍형",  drawers:3, shelves:0, hanger:false, hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
  { id:"p3", wallId:"wA", posX:1500, width:900, height:2400, name:"행거+선반형", drawers:0, shelves:2, hanger:true,  hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
  { id:"p4", wallId:"wA", posX:2400, width:800, height:2400, name:"4단 선반형",  drawers:0, shelves:4, hanger:false, hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
  { id:"p5", wallId:"wB", posX:0,    width:900, height:2400, name:"2단 행거형",  drawers:0, shelves:0, hanger:true,  hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
  { id:"p6", wallId:"wB", posX:900,  width:600, height:2400, name:"3단 서랍형",  drawers:3, shelves:0, hanger:false, hasDoor:true, doorCount:2, doorGap:2, baseboard:80, topSurround:0, leftSurround:0, rightSurround:0 },
];

// ─── 붙박이장 모듈 팔레트 ────────────────────────────────────
const PALETTE: PaletteMod[] = [
  // ── 행거 계열 ──
  { id:"m1",  name:"풀 행거형",     code:"WARD-HNG-F",  hanger:true,  shelves:0, drawers:0, defaultWidth:900, defaultHeight:2400, tags:["행거"] },
  { id:"m2",  name:"2단 행거형",    code:"WARD-HNG-2",  hanger:true,  shelves:0, drawers:0, defaultWidth:900, defaultHeight:2400, tags:["행거"] },
  // ── 행거 혼합 계열 ──
  { id:"m3",  name:"행거+선반 2단", code:"WARD-HS-2",   hanger:true,  shelves:2, drawers:0, defaultWidth:900, defaultHeight:2400, tags:["행거","선반"] },
  { id:"m4",  name:"행거+선반 3단", code:"WARD-HS-3",   hanger:true,  shelves:3, drawers:0, defaultWidth:900, defaultHeight:2400, tags:["행거","선반"] },
  { id:"m5",  name:"행거+서랍 2단", code:"WARD-HD-2",   hanger:true,  shelves:0, drawers:2, defaultWidth:900, defaultHeight:2400, tags:["행거","서랍"] },
  { id:"m6",  name:"행거+서랍 3단", code:"WARD-HD-3",   hanger:true,  shelves:0, drawers:3, defaultWidth:900, defaultHeight:2400, tags:["행거","서랍"] },
  // ── 서랍 계열 ──
  { id:"m7",  name:"서랍장 3단",    code:"WARD-DRW-3",  hanger:false, shelves:0, drawers:3, defaultWidth:600, defaultHeight:2400, tags:["서랍"] },
  { id:"m8",  name:"서랍장 4단",    code:"WARD-DRW-4",  hanger:false, shelves:0, drawers:4, defaultWidth:600, defaultHeight:2400, tags:["서랍"] },
  { id:"m9",  name:"서랍장 5단",    code:"WARD-DRW-5",  hanger:false, shelves:0, drawers:5, defaultWidth:600, defaultHeight:2400, tags:["서랍"] },
  // ── 선반 계열 ──
  { id:"m10", name:"선반장 4단",    code:"WARD-SHF-4",  hanger:false, shelves:4, drawers:0, defaultWidth:600, defaultHeight:2400, tags:["선반"] },
  { id:"m11", name:"선반장 5단",    code:"WARD-SHF-5",  hanger:false, shelves:5, drawers:0, defaultWidth:600, defaultHeight:2400, tags:["선반"] },
  { id:"m12", name:"이불수납장",    code:"WARD-DUV",    hanger:false, shelves:3, drawers:0, defaultWidth:900, defaultHeight:2400, tags:["선반","이불"] },
  // ── 혼합 계열 ──
  { id:"m13", name:"선반+서랍 혼합",code:"WARD-SD-MIX", hanger:false, shelves:2, drawers:2, defaultWidth:600, defaultHeight:2400, tags:["선반","서랍"] },
];

// ─── 색상 ────────────────────────────────────────────────────
const C = {
  outer: "#334155", outerFill: "#ffffff",
  panel: "#64748b",
  hang:  "#dbeafe", hangRod: "#3b82f6", hangSym: "#93c5fd",
  shelf: "#dcfce7", shelfLine: "#6b7280",
  drawer:"#fef9c3", drawerStr:"#d97706", drawerH:"#fbbf24",
  door:  "#f8fafc", doorStr:"#334155",
  handle:"#94a3b8", hinge:"#64748b",
  gap:   "#f1f5f9", gapStr:"#cbd5e1",
  dim:   "#94a3b8",
  hov:   "rgba(59,130,246,0.1)", hovStr:"#3b82f6",
};

// ─── 모듈 내부 그리기 (목대) ─────────────────────────────────
function CarcassInterior({ mod, ox, oy }: { mod: PlacedMod; ox: number; oy: number }) {
  const iw = px(mod.width - PT * 2);
  const ih = px(mod.height - PT * 2);
  const ix = ox + px(PT);
  const iy = oy + px(PT);

  if (mod.hanger) {
    const hangH = mod.shelves > 0 ? ih * 0.55 : ih;
    const rodY = iy + px(80);
    const n = Math.max(2, Math.floor(iw / px(140)));
    const sp = iw / (n + 1);
    return (
      <g>
        {/* 행거 구역 */}
        <rect x={ix} y={iy} width={iw} height={hangH} fill={C.hang} />
        {/* 레일 */}
        <line x1={ix+3} y1={rodY} x2={ix+iw-3} y2={rodY}
          stroke={C.hangRod} strokeWidth={1.5} />
        {/* 행거 심볼 */}
        {Array.from({ length: n }, (_, i) => {
          const cx = ix + (i+1)*sp;
          return (
            <path key={i}
              d={`M${cx},${rodY} L${cx-px(35)},${rodY+px(75)} L${cx+px(35)},${rodY+px(75)}`}
              stroke={C.hangSym} strokeWidth={1} fill="none" strokeLinecap="round" />
          );
        })}
        {/* 하단 선반 구역 */}
        {mod.shelves > 0 && (() => {
          const sy = iy + hangH;
          const sh = ih - hangH;
          const sg = sh / (mod.shelves + 1);
          return (
            <g>
              <rect x={ix} y={sy} width={iw} height={sh} fill={C.shelf} />
              <rect x={ix} y={sy} width={iw} height={2} fill={C.shelfLine} />
              {Array.from({ length: mod.shelves }, (_, i) => (
                <rect key={i} x={ix} y={sy + sg*(i+1) - 1}
                  width={iw} height={px(PT)} fill={C.shelfLine} rx={1} />
              ))}
            </g>
          );
        })()}
      </g>
    );
  }

  if (mod.drawers > 0 && mod.shelves === 0) {
    const gap = px(6);
    const dh = (ih - gap*(mod.drawers+1)) / mod.drawers;
    return (
      <g>
        <rect x={ix} y={iy} width={iw} height={ih} fill={C.drawer} opacity={0.4} />
        {Array.from({ length: mod.drawers }, (_, i) => {
          const dy = iy + gap + i*(dh+gap);
          const cy = dy + dh/2;
          return (
            <g key={i}>
              <rect x={ix+px(3)} y={dy} width={iw-px(6)} height={dh}
                fill="white" stroke={C.drawerStr} strokeWidth={0.75} rx={2} />
              <rect x={ix+iw/2-px(40)} y={cy-px(6)} width={px(80)} height={px(12)}
                fill={C.drawerH} rx={px(6)} />
            </g>
          );
        })}
      </g>
    );
  }

  if (mod.shelves > 0) {
    const sg = ih / (mod.shelves + 1);
    return (
      <g>
        <rect x={ix} y={iy} width={iw} height={ih} fill={C.shelf} opacity={0.5} />
        {Array.from({ length: mod.shelves }, (_, i) => (
          <rect key={i} x={ix} y={iy + sg*(i+1) - 1}
            width={iw} height={px(PT)} fill={C.shelfLine} rx={1} />
        ))}
      </g>
    );
  }

  return null;
}

// ─── 도어 그리기 ─────────────────────────────────────────────
function DoorOverlay({ mod, ox, oy }: { mod: PlacedMod; ox: number; oy: number }) {
  if (!mod.hasDoor || mod.doorCount === 0) return null;
  const w  = px(mod.width);
  const h  = px(mod.height);
  const pt = px(PT);
  const gap = px(mod.doorGap);                                          // 도어 간 갭 (px)
  const dw  = (w - pt * 2 - gap * (mod.doorCount - 1)) / mod.doorCount; // 도어 1짝 폭
  const dh  = h - pt - px(mod.baseboard);                               // 도어 높이 (걸레받이 제외)
  const dy  = oy + pt;

  return (
    <g>
      {Array.from({ length: mod.doorCount }, (_, i) => {
        const dx = ox + pt + i * (dw + gap);
        // 좌측 도어: 경첩 왼쪽 → 좌열림 (<)
        // 우측 도어: 경첩 오른쪽 → 우열림 (>)
        const isLeft = i === 0;

        // 도어 열림 방향 삼각형 (CAD 표준 표기)
        // < 좌열림: 꼭짓점=좌중앙, 밑변=우측 상하 끝
        // > 우열림: 꼭짓점=우중앙, 밑변=좌측 상하 끝
        const vx  = isLeft ? dx       : dx + dw;   // 꼭짓점 X
        const vy  = dy + dh / 2;                    // 꼭짓점 Y (도어 세로 중앙)
        const bx  = isLeft ? dx + dw  : dx;         // 밑변 X
        const top = dy;                              // 밑변 상단
        const bot = dy + dh;                         // 밑변 하단

        // 이등변삼각형 (점선)
        const triPath = `M ${vx},${vy} L ${bx},${top} L ${bx},${bot} Z`;

        return (
          <g key={i}>
            {/* 도어 패널 배경 */}
            <rect x={dx} y={dy} width={dw} height={dh}
              fill={C.door} stroke={C.doorStr} strokeWidth={1.5} rx={1} />

            {/* 열림 방향 삼각형 — 점선 */}
            <path
              d={triPath}
              fill="none"
              stroke="#334155"
              strokeWidth={1}
              strokeDasharray="5,3"
              strokeLinejoin="round"
            />

            {/* 손잡이 */}
            <rect
              x={isLeft ? dx + dw - px(16) : dx + px(8)}
              y={vy - px(28)} width={px(7)} height={px(56)}
              fill={C.handle} rx={px(3.5)} />

            {/* 경첩 */}
            {[0.18, 0.5, 0.82].map((r, hi) => (
              <g key={hi}>
                <rect
                  x={isLeft ? dx + px(6) : dx + dw - px(14)}
                  y={dy + dh * r - px(9)}
                  width={px(8)} height={px(18)}
                  fill="#e2e8f0" stroke={C.hinge} strokeWidth={0.75} rx={1} />
                <circle
                  cx={isLeft ? dx + px(10) : dx + dw - px(10)}
                  cy={dy + dh * r}
                  r={px(3)} fill={C.hinge} />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ─── 치수선 ──────────────────────────────────────────────────
function DimH({ x1, x2, y, label }: { x1:number; x2:number; y:number; label:string }) {
  const mid = (x1+x2)/2;
  return (
    <g>
      <line x1={x1} y1={y-px(8)} x2={x1} y2={y+px(8)} stroke={C.dim} strokeWidth={0.75} />
      <line x1={x2} y1={y-px(8)} x2={x2} y2={y+px(8)} stroke={C.dim} strokeWidth={0.75} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={C.dim} strokeWidth={0.75} />
      <text x={mid} y={y-px(14)} textAnchor="middle"
        fontSize={10} fill={C.dim} fontFamily="ui-monospace,monospace">
        {label}
      </text>
    </g>
  );
}

// ─── 전개도 SVG ──────────────────────────────────────────────
function ElevationSVG({
  wall, modules, showDoors, hoveredId, onHover,
  selectedId, onSelect,
  onMoveLeft, onMoveRight, onDelete, onReorder,
}: {
  wall: Wall; modules: PlacedMod[];
  showDoors: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMoveLeft?: (id: string) => void;
  onMoveRight?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
}) {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const W = px(wall.width);
  const H = px(wall.height);
  const MX = 70; // margin x (left — 치수 공간 확보)
  const MY = 54; // margin y (위 — 치수 공간)
  const MB = 44; // margin bottom

  const sorted = [...modules].sort((a, b) => a.posX - b.posX);

  // 빈 공간 계산
  const gaps: { x: number; w: number }[] = [];
  let cur = 0;
  for (const m of sorted) {
    if (m.posX > cur + 5) gaps.push({ x: cur, w: m.posX - cur });
    cur = m.posX + m.width;
  }
  if (cur < wall.width - 5) gaps.push({ x: cur, w: wall.width - cur });

  const vbW = W + MX * 2;
  const vbH = H + MY + MB;

  // 툴바 상수
  const TB_H = 30; // toolbar height
  const BTN_W = 28, BTN_H = 24;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={vbW}
      height={vbH}
      style={{ display: "block" }}
    >
      {/* 해치 패턴 */}
      <defs>
        <pattern id={`hatch-${wall.id}`} width={8} height={8}
          patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={8} stroke={C.gapStr} strokeWidth={1.5} />
        </pattern>
      </defs>

      {/* 바닥선 */}
      <line x1={MX - 12} y1={MY + H} x2={MX + W + 12} y2={MY + H}
        stroke="#475569" strokeWidth={2.5} />

      {/* 벽 배경 */}
      <rect x={MX} y={MY} width={W} height={H} fill="#f8fafc" />

      {/* 빈 공간 해치 */}
      {gaps.map((g, i) => (
        <g key={i}>
          <rect x={MX + px(g.x)} y={MY} width={px(g.w)} height={H}
            fill={`url(#hatch-${wall.id})`} opacity={0.5} />
          <rect x={MX + px(g.x)} y={MY} width={px(g.w)} height={H}
            fill="none" stroke={C.gapStr} strokeWidth={0.5} strokeDasharray="4 3" />
          {px(g.w) > 30 && (
            <text x={MX + px(g.x) + px(g.w) / 2} y={MY + H / 2}
              textAnchor="middle" fontSize={9} fill={C.dim} fontFamily="monospace">
              {g.w}mm
            </text>
          )}
        </g>
      ))}

      {/* 모듈들 */}
      {sorted.map((mod, modIdx) => {
        const ox = MX + px(mod.posX);
        const oy = MY;
        const w  = px(mod.width);
        const h  = px(mod.height);
        const isHov = hoveredId === mod.id;
        const isSel = selectedId === mod.id;
        const canLeft  = modIdx > 0;
        const canRight = modIdx < sorted.length - 1;

        // 테두리: 호버(파란) > 선택(주황) > 기본(회색)
        const borderColor  = isHov ? C.hovStr : isSel ? "#f59e0b" : C.outer;
        const borderWidth  = (isHov || isSel) ? 2 : 1.5;
        const bgFill       = isHov ? C.hov : isSel ? "rgba(251,191,36,0.05)" : "white";

        const isDropTarget = dropTargetId === mod.id;

        return (
          <g key={mod.id}
            onMouseEnter={() => onHover(mod.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect?.(mod.id)}
            style={{ cursor: "grab" }}
            // ── 캔버스 내 드래그 순서 변경 ──
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("canvas/module", mod.id);
              e.dataTransfer.effectAllowed = "move";
              e.stopPropagation(); // 팔레트 드롭 핸들러로 올라가지 않도록
            }}
            onDragEnd={() => setDropTargetId(null)}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes("canvas/module")) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              setDropTargetId(mod.id);
            }}
            onDragLeave={() => setDropTargetId(null)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const fromId = e.dataTransfer.getData("canvas/module");
              if (fromId && fromId !== mod.id) onReorder?.(fromId, mod.id);
              setDropTargetId(null);
            }}
          >
            {/* 투명 히트 영역 */}
            <rect x={ox} y={oy - TB_H} width={w} height={h + TB_H}
              fill="transparent" />

            {/* 드롭 위치 인디케이터 */}
            {isDropTarget && (
              <rect x={ox} y={oy} width={w} height={h}
                fill="rgba(59,130,246,0.08)"
                stroke="#3b82f6" strokeWidth={2.5}
                strokeDasharray="6,3" rx={2} />
            )}

            {/* 몸통 배경 */}
            <rect x={ox} y={oy} width={w} height={h}
              fill={bgFill}
              stroke={isDropTarget ? "#3b82f6" : borderColor}
              strokeWidth={isDropTarget ? 2.5 : borderWidth} />

            {/* 내부 구조 */}
            {!showDoors
              ? <CarcassInterior mod={mod} ox={ox} oy={oy} />
              : <><CarcassInterior mod={mod} ox={ox} oy={oy} /><DoorOverlay mod={mod} ox={ox} oy={oy} /></>
            }

            {/* 테두리 */}
            <rect x={ox} y={oy} width={w} height={h}
              fill="none"
              stroke={borderColor}
              strokeWidth={borderWidth} />

            {/* ── hover 툴바 ── */}
            {isHov && (() => {
              const tbY = oy - TB_H;
              const bY  = tbY + (TB_H - BTN_H) / 2;

              return (
                <g>
                  {/* 툴바 배경 */}
                  <rect x={ox} y={tbY} width={w} height={TB_H}
                    fill="#1e293b" rx={4} />

                  {/* 모듈명 (중앙) */}
                  <text x={ox + w / 2} y={tbY + TB_H / 2 + 4}
                    textAnchor="middle" fontSize={10} fill="#94a3b8"
                    fontFamily="sans-serif" style={{ userSelect: "none" }}>
                    {mod.name}
                  </text>

                  {/* ← 이동 버튼 */}
                  <g
                    onClick={(e) => { e.stopPropagation(); if (canLeft) onMoveLeft?.(mod.id); }}
                    style={{ cursor: canLeft ? "pointer" : "default", opacity: canLeft ? 1 : 0.25 }}
                  >
                    <rect x={ox + 2} y={bY} width={BTN_W} height={BTN_H}
                      fill={canLeft ? "#3b82f6" : "none"} rx={3} />
                    <text x={ox + 2 + BTN_W / 2} y={bY + BTN_H / 2 + 4}
                      textAnchor="middle" fontSize={13} fill="white"
                      style={{ userSelect: "none" }}>←</text>
                  </g>

                  {/* → 이동 버튼 */}
                  <g
                    onClick={(e) => { e.stopPropagation(); if (canRight) onMoveRight?.(mod.id); }}
                    style={{ cursor: canRight ? "pointer" : "default", opacity: canRight ? 1 : 0.25 }}
                  >
                    <rect x={ox + 2 + BTN_W + 2} y={bY} width={BTN_W} height={BTN_H}
                      fill={canRight ? "#3b82f6" : "none"} rx={3} />
                    <text x={ox + 2 + BTN_W + 2 + BTN_W / 2} y={bY + BTN_H / 2 + 4}
                      textAnchor="middle" fontSize={13} fill="white"
                      style={{ userSelect: "none" }}>→</text>
                  </g>

                  {/* ✕ 삭제 버튼 */}
                  <g
                    onClick={(e) => { e.stopPropagation(); onDelete?.(mod.id); }}
                    style={{ cursor: "pointer" }}
                  >
                    <rect x={ox + w - BTN_W - 2} y={bY} width={BTN_W} height={BTN_H}
                      fill="#ef4444" rx={3} />
                    <text x={ox + w - BTN_W / 2 - 2} y={bY + BTN_H / 2 + 4}
                      textAnchor="middle" fontSize={11} fill="white"
                      style={{ userSelect: "none" }}>✕</text>
                  </g>
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* 전체 너비 치수 */}
      <DimH x1={MX} x2={MX + W} y={MY + H + MB * 0.75}
        label={`${wall.width.toLocaleString()}mm`} />

      {/* 모듈별 너비 치수 (상단) */}
      {sorted.map(mod => (
        <DimH key={`d-${mod.id}`}
          x1={MX + px(mod.posX)} x2={MX + px(mod.posX + mod.width)}
          y={MY - 22}
          label={`${mod.width}`}
        />
      ))}

      {/* 높이 치수 (좌측) */}
      <line x1={MX - 32} y1={MY} x2={MX - 32} y2={MY + H}
        stroke={C.dim} strokeWidth={0.75} />
      <line x1={MX - 38} y1={MY}     x2={MX - 26} y2={MY}     stroke={C.dim} strokeWidth={0.75} />
      <line x1={MX - 38} y1={MY + H} x2={MX - 26} y2={MY + H} stroke={C.dim} strokeWidth={0.75} />
      <text x={MX - 46} y={MY + H / 2}
        textAnchor="middle" fontSize={10} fill={C.dim}
        transform={`rotate(-90 ${MX - 46} ${MY + H / 2})`}>
        {wall.height}mm
      </text>

      {/* 코너 심볼 */}
      {wall.cornerToNext && (
        <text x={MX + W + 12} y={MY + H / 2}
          fontSize={10} fill="#7c3aed" fontFamily="sans-serif">
          ⌐ {wall.cornerToNext === "filler" ? "채움판" : wall.cornerToNext}
        </text>
      )}
    </svg>
  );
}

// ─── 팔레트 미리보기 SVG ──────────────────────────────────────
function PaletteSVG({ mod }: { mod: PaletteMod }) {
  const W = 48; const H = 80;
  const pt = 3;
  const iw = W - pt*2; const ih = H - pt*2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <rect x={0} y={0} width={W} height={H}
        fill="white" stroke="#334155" strokeWidth={1.5} rx={2} />
      {mod.hanger && (
        <g>
          <rect x={pt} y={pt} width={iw} height={mod.shelves ? ih*0.55 : ih}
            fill={C.hang} />
          <line x1={pt+2} y1={pt+10} x2={W-pt-2} y2={pt+10}
            stroke={C.hangRod} strokeWidth={1.5} />
          {[1,2].map(i => {
            const cx = pt + iw*i/3;
            return (
              <path key={i}
                d={`M${cx},${pt+10} L${cx-5},${pt+24} L${cx+5},${pt+24}`}
                stroke={C.hangSym} strokeWidth={1} fill="none" />
            );
          })}
          {mod.shelves > 0 && (() => {
            const sy = pt + ih*0.55;
            const sg = (ih - ih*0.55) / (mod.shelves+1);
            return (
              <g>
                <rect x={pt} y={sy} width={iw} height={ih-ih*0.55} fill={C.shelf} />
                {Array.from({length:mod.shelves},(_,i)=>(
                  <rect key={i} x={pt} y={sy+sg*(i+1)-1} width={iw} height={2}
                    fill={C.shelfLine} />
                ))}
              </g>
            );
          })()}
        </g>
      )}
      {!mod.hanger && mod.drawers > 0 && (
        <g>
          <rect x={pt} y={pt} width={iw} height={ih} fill={C.drawer} opacity={0.5} />
          {Array.from({length:mod.drawers},(_,i)=>{
            const dh = (ih-4*(mod.drawers+1))/mod.drawers;
            const dy = pt+4+i*(dh+4);
            return (
              <g key={i}>
                <rect x={pt+2} y={dy} width={iw-4} height={dh}
                  fill="white" stroke={C.drawerStr} strokeWidth={0.5} rx={1} />
                <rect x={pt+iw/2-8} y={dy+dh/2-2} width={16} height={4}
                  fill={C.drawerH} rx={2} />
              </g>
            );
          })}
        </g>
      )}
      {!mod.hanger && mod.drawers === 0 && mod.shelves > 0 && (
        <g>
          <rect x={pt} y={pt} width={iw} height={ih} fill={C.shelf} opacity={0.5} />
          {Array.from({length:mod.shelves},(_,i)=>{
            const sg = ih/(mod.shelves+1);
            return (
              <rect key={i} x={pt} y={pt+sg*(i+1)-1} width={iw} height={2}
                fill={C.shelfLine} />
            );
          })}
        </g>
      )}
    </svg>
  );
}

// ─── 속성 패널 ────────────────────────────────────────────────
function PropertiesPanel({
  module, onUpdate, onApplyToAll,
}: {
  module: PlacedMod | null;
  onUpdate: (patch: Partial<PlacedMod>) => void;
  onApplyToAll: (patch: Partial<PlacedMod>) => void;
}) {
  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">속성</p>
        {module && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
            {module.name}
          </span>
        )}
      </div>

      {!module ? (
        <div className="p-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            도면에서 장을 클릭하면<br />속성이 표시됩니다
          </p>
        </div>
      ) : (
        <div className="p-3 space-y-3">

          {/* 모듈명 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">모듈명</label>
            <input
              value={module.name}
              onChange={e => onUpdate({ name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* 치수 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">치수 (mm)</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([["폭", "width"], ["높이", "height"]] as const).map(([label, field]) => (
                <div key={field}>
                  <span className="text-xs text-gray-400">{label}</span>
                  <input
                    type="number" value={module[field]}
                    onChange={e => onUpdate({ [field]: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 내부 구성 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">내부 구성</label>
            <div className="space-y-2">
              {/* 행거 토글 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">행거</span>
                <button
                  onClick={() => onUpdate({ hanger: !module.hanger })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${module.hanger ? "bg-blue-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${module.hanger ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
              {/* 선반 수 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">선반</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onUpdate({ shelves: Math.max(0, module.shelves - 1) })}
                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">−</button>
                  <span className="text-xs font-semibold w-4 text-center text-gray-700">{module.shelves}</span>
                  <button onClick={() => onUpdate({ shelves: Math.min(8, module.shelves + 1) })}
                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              {/* 서랍 수 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">서랍</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onUpdate({ drawers: Math.max(0, module.drawers - 1) })}
                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">−</button>
                  <span className="text-xs font-semibold w-4 text-center text-gray-700">{module.drawers}</span>
                  <button onClick={() => onUpdate({ drawers: Math.min(8, module.drawers + 1) })}
                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* 도어 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">도어</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">도어 사용</span>
                <button
                  onClick={() => onUpdate({ hasDoor: !module.hasDoor })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${module.hasDoor ? "bg-blue-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${module.hasDoor ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
              {module.hasDoor && (
                <>
                  {/* 도어 수 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">도어 수</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onUpdate({ doorCount: Math.max(1, module.doorCount - 1) })}
                        className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">−</button>
                      <span className="text-xs font-semibold w-4 text-center text-gray-700">{module.doorCount}</span>
                      <button onClick={() => onUpdate({ doorCount: Math.min(4, module.doorCount + 1) })}
                        className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>

                  {/* 도어 갭 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600 flex-shrink-0">도어갭</span>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number" min={0} max={20}
                        value={module.doorGap}
                        onChange={e => onUpdate({ doorGap: Number(e.target.value) })}
                        className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <span className="text-xs text-gray-400">mm</span>
                      <button
                        onClick={() => onApplyToAll({ doorGap: module.doorGap })}
                        className="flex-1 text-xs bg-gray-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-gray-200 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
                      >
                        일괄적용
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 서라운딩 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">서라운딩 (mm)</label>
            <div className="space-y-2">
              {(
                [
                  ["걸레받이 높이", "baseboard",     module.baseboard    ],
                  ["상부 높이",     "topSurround",   module.topSurround  ],
                  ["좌",            "leftSurround",  module.leftSurround ],
                  ["우",            "rightSurround", module.rightSurround],
                ] as [string, keyof PlacedMod, number][]
              ).map(([label, field, val]) => (
                <div key={field} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 w-[62px] flex-shrink-0">{label}</span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number" min={0} max={500}
                      value={val}
                      onChange={e => onUpdate({ [field]: Number(e.target.value) })}
                      className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-xs text-gray-400">mm</span>
                    <button
                      onClick={() => onApplyToAll({ [field]: val })}
                      className="flex-1 text-xs bg-gray-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-gray-200 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
                    >
                      일괄적용
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── 견적 패널 ────────────────────────────────────────────────
function EstimatePanel({ modules }: { modules: PlacedMod[] }) {
  const unitPrices = { woodFrame: 80000, door: 30000, shelf: 18000, drawer: 55000, hanger: 15000 };
  const bayJa = 3.5;

  const items = modules.map(m => {
    const base = unitPrices.woodFrame * bayJa + unitPrices.door * (m.hasDoor ? m.doorCount : 0);
    const hw = (m.hanger ? 1 : 0) * unitPrices.hanger + m.shelves * unitPrices.shelf + m.drawers * unitPrices.drawer;
    return { id: m.id, name: m.name, total: base + hw };
  });
  const subtotal = items.reduce((s,i) => s+i.total, 0);
  const install = 150000;
  const shipping = 200000;
  const total = subtotal + install + shipping;

  function fmt(n: number) {
    return n.toLocaleString() + "원";
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">예상 견적</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-baseline text-xs">
            <span className="text-gray-600 truncate mr-2">{item.name}</span>
            <span className="text-gray-700 font-medium whitespace-nowrap">{fmt(item.total)}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
          <span className="text-gray-500">설치비</span>
          <span className="text-gray-600">{fmt(install)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">운임비</span>
          <span className="text-gray-600">{fmt(shipping)}</span>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-blue-50 space-y-2">
        <div className="flex justify-between text-xs text-blue-600">
          <span>원가 합계</span>
          <span className="font-semibold">{fmt(subtotal + install + shipping)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-bold text-blue-800">견적가</span>
          <span className="text-xl font-bold text-blue-700">{fmt(total)}</span>
        </div>
        <button className="w-full mt-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-blue-700">
          견적서 출력
        </button>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function DesignPage() {
  const [activeWall, setActiveWall] = useState<string>(WALLS[0].id);
  const [placed, setPlaced]         = useState<PlacedMod[]>(PLACED_INIT);
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const wall        = WALLS.find(w => w.id === activeWall)!;
  const wallModules = placed.filter(m => m.wallId === activeWall);

  // ── 팔레트 드래그 → 캔버스 드롭 ──────────────────────────
  // dataTransfer 사용 (React 상태 대신) — SVG 자식 요소가 이벤트 가로채도 안정적으로 동작
  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // 캔버스 내 모듈 재정렬 드래그는 모듈 자체에서 처리 — 여기선 무시
    if (e.dataTransfer.types.includes("canvas/module")) return;
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const src = PALETTE.find(p => p.id === id);
    if (!src) return;
    const wallMods  = placed.filter(m => m.wallId === activeWall);
    const usedWidth = wallMods.reduce((s, m) => s + m.width, 0);
    if (usedWidth + src.defaultWidth > wall.width) return;
    const newMod: PlacedMod = {
      id: crypto.randomUUID(), wallId: activeWall,
      posX: usedWidth, width: src.defaultWidth, height: src.defaultHeight,
      name: src.name, drawers: src.drawers, shelves: src.shelves,
      hanger: src.hanger, hasDoor: true, doorCount: 2, doorGap: 2,
      baseboard: 80, topSurround: 0, leftSurround: 0, rightSurround: 0,
    };
    setPlaced(prev => {
      const others  = prev.filter(m => m.wallId !== activeWall);
      const sorted  = [...prev.filter(m => m.wallId === activeWall), newMod]
        .sort((a, b) => a.posX - b.posX);
      let cx = 0;
      const repacked = sorted.map(m => { const r = { ...m, posX: cx }; cx += m.width; return r; });
      return [...others, ...repacked];
    });
  }

  // ── 모듈 이동 (같은 벽면 내 순서 교환) ─────────────────────
  function moveMod(id: string, dir: "left" | "right") {
    setPlaced(prev => {
      const others   = prev.filter(m => m.wallId !== activeWall);
      const sorted   = [...prev.filter(m => m.wallId === activeWall)].sort((a, b) => a.posX - b.posX);
      const idx      = sorted.findIndex(m => m.id === id);
      if (idx < 0) return prev;

      const swapIdx  = dir === "left" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

      // posX 교환
      const a = sorted[idx], b = sorted[swapIdx];
      sorted[idx]     = { ...a, posX: b.posX };
      sorted[swapIdx] = { ...b, posX: a.posX };

      // posX 재정렬 (순서 유지, 겹침 방지)
      const reordered = [...sorted].sort((x, y) => x.posX - y.posX);
      let cx = 0;
      for (const m of reordered) { m.posX = cx; cx += m.width; }

      return [...others, ...reordered];
    });
  }

  // ── 모듈 속성 수정 ───────────────────────────────────────────
  function updateMod(id: string, patch: Partial<PlacedMod>) {
    setPlaced(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...patch } : m);

      // 폭이 바뀌면 같은 벽면 장들을 왼쪽부터 순서대로 재배치 (gap 없이 딱딱)
      if ("width" in patch) {
        const wallId = updated.find(m => m.id === id)!.wallId;
        const others  = updated.filter(m => m.wallId !== wallId);
        const sorted  = updated
          .filter(m => m.wallId === wallId)
          .sort((a, b) => a.posX - b.posX);
        let cx = 0;
        const repacked = sorted.map(m => {
          const r = { ...m, posX: cx };
          cx += m.width;
          return r;
        });
        return [...others, ...repacked];
      }

      return updated;
    });
  }

  // ── 캔버스 내 드래그로 순서 변경 ─────────────────────────────
  function reorderMod(fromId: string, toId: string) {
    setPlaced(prev => {
      const wallId = prev.find(m => m.id === fromId)?.wallId;
      if (!wallId) return prev;
      const others   = prev.filter(m => m.wallId !== wallId);
      const wallMods = [...prev.filter(m => m.wallId === wallId)].sort((a, b) => a.posX - b.posX);
      const fromIdx  = wallMods.findIndex(m => m.id === fromId);
      const toIdx    = wallMods.findIndex(m => m.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const arr = [...wallMods];
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      // 좌측 기준 재배치
      let cx = 0;
      const repacked = arr.map(m => { const r = { ...m, posX: cx }; cx += m.width; return r; });
      return [...others, ...repacked];
    });
  }

  // ── 현재 벽면 전체 일괄 적용 ────────────────────────────────
  function applyToAll(patch: Partial<PlacedMod>) {
    setPlaced(prev => prev.map(m =>
      m.wallId === activeWall ? { ...m, ...patch } : m
    ));
  }

  // ── 모듈 삭제 ────────────────────────────────────────────────
  function deleteMod(id: string) {
    setPlaced(prev => {
      const remaining = prev.filter(m => m.id !== id);
      // 같은 벽면의 posX 재계산
      const wallMods  = remaining.filter(m => m.wallId === activeWall).sort((a, b) => a.posX - b.posX);
      let cx = 0;
      for (const m of wallMods) { m.posX = cx; cx += m.width; }
      return remaining;
    });
    setHoveredId(null);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">

      {/* ── 좌측: 모듈 팔레트 ─────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">모듈 팔레트</p>
          <input
            type="text" placeholder="검색..."
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {PALETTE.map(mod => (
            <div key={mod.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", mod.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200
                bg-white hover:border-blue-400 hover:shadow-sm
                cursor-grab active:cursor-grabbing select-none transition-all"
            >
              <PaletteSVG mod={mod} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 leading-tight">{mod.name}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">
                  {mod.defaultWidth}×{mod.defaultHeight}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {[
                    mod.hanger && "행거",
                    mod.shelves > 0 && `선반×${mod.shelves}`,
                    mod.drawers > 0 && `서랍×${mod.drawers}`,
                  ].filter(Boolean).map(t => (
                    <span key={String(t)} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0 rounded-full leading-5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── 가운데: 도면 캔버스 ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

        {/* 상단 툴바: 브레드크럼 + 벽면 탭 */}
        <div className="bg-white border-b border-gray-200 px-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Link href="/studio" className="hover:text-gray-600">대시보드</Link>
            <span>›</span>
            <Link href="/studio/projects/1" className="hover:text-gray-600">강남 도곡동 래미안</Link>
            <span>›</span>
            <span className="text-gray-600">안방 붙박이장</span>
          </div>
          <div className="flex items-center justify-between">
            {/* 벽면 탭 */}
            <div className="flex gap-0">
              {WALLS.map((w, i) => (
                <button key={w.id} onClick={() => setActiveWall(w.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 font-medium transition-colors ${
                    activeWall === w.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {i > 0 && <span className="text-gray-300 text-xs mr-1">⌐</span>}
                  {w.name}
                  <span className="text-xs text-gray-400 font-normal">{w.width.toLocaleString()}mm</span>
                  {w.cornerToNext && (
                    <span className="ml-1 text-xs text-purple-400">→ {w.cornerToNext}</span>
                  )}
                </button>
              ))}
              <button className="px-3 py-2 text-sm text-blue-500 hover:text-blue-700 border-b-2 border-transparent">
                + 벽면 추가
              </button>
            </div>
            {/* 공간 정보 */}
            <div className="text-xs text-gray-400 pb-2 flex gap-3">
              <span>총 {wall.width.toLocaleString()}mm</span>
              <span className="text-blue-500 font-medium">
                배치: {wallModules.reduce((s, m) => s + m.width, 0).toLocaleString()}mm
              </span>
              <span className="text-gray-300">
                여백: {(wall.width - wallModules.reduce((s, m) => s + m.width, 0)).toLocaleString()}mm
              </span>
            </div>
          </div>
        </div>

        {/* 도면 영역 — 단일 스크롤 컨테이너 */}
        <div className="flex-1 overflow-auto">

          {/* 목대 도면 */}
          <div className="p-4 border-b-2 border-dashed border-gray-200"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={handleCanvasDrop}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                목대 도면 (구조)
              </span>
              <span className="text-xs text-gray-400">도어 없음 · 내부 구조 표시</span>
              <span className="ml-auto text-xs text-gray-400">← → 버튼으로 순서 변경</span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 overflow-x-auto"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
              onDrop={handleCanvasDrop}
            >
              <ElevationSVG
                wall={wall} modules={wallModules}
                showDoors={false}
                hoveredId={hoveredId} onHover={setHoveredId}
                selectedId={selectedId} onSelect={setSelectedId}
                onMoveLeft={(id) => moveMod(id, "left")}
                onMoveRight={(id) => moveMod(id, "right")}
                onDelete={deleteMod}
                onReorder={reorderMod}
              />
            </div>
          </div>

          {/* 도어 도면 */}
          <div className="p-4"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={handleCanvasDrop}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                도어 도면 (완성)
              </span>
              <span className="text-xs text-gray-400">도어 · 경첩 · 손잡이 위치 표시</span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 overflow-x-auto"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
              onDrop={handleCanvasDrop}
            >
              <ElevationSVG
                wall={wall} modules={wallModules}
                showDoors={true}
                hoveredId={hoveredId} onHover={setHoveredId}
                onMoveLeft={(id) => moveMod(id, "left")}
                onMoveRight={(id) => moveMod(id, "right")}
                onDelete={deleteMod}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 우측: 속성 + 견적 패널 ──────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        {/* 속성창 */}
        <div className="flex-none overflow-y-auto border-b border-gray-200"
          style={{ maxHeight: selectedId ? "54%" : "auto" }}>
          <PropertiesPanel
            module={placed.find(m => m.id === selectedId) ?? null}
            onUpdate={patch => selectedId && updateMod(selectedId, patch)}
            onApplyToAll={applyToAll}
          />
        </div>
        {/* 견적 패널 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <EstimatePanel modules={placed} />
        </div>
      </aside>
    </div>
  );
}
