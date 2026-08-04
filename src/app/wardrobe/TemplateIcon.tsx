"use client";

import { useId } from "react";
import type { ReactNode } from "react";

const W = 56;
const H = 112;

// 구역별 배경색
const C_HANG = "#dbeafe";   // 행거 — 파란빛
const C_SHELF = "#dcfce7";  // 선반 — 초록빛
const C_DRAW = "#fef9c3";   // 서랍 — 노란빛

// 선/테두리 색
const S_BORDER = "#334155";
const S_DIV = "#94a3b8";
const S_ROD = "#3b82f6";
const S_SHELF = "#6b7280";
const S_DRAW_FILL = "#d1d5db";
const S_DRAW_STROKE = "#9ca3af";
const S_HANGER = "#93c5fd";

// ── 구역 컴포넌트 ─────────────────────────────────────────

function HangZone({
  y1, y2,
  x1 = 2, x2 = W - 2,
}: {
  y1: number; y2: number; x1?: number; x2?: number;
}) {
  const rodY = y1 + 8;
  const zoneW = x2 - x1;
  const n = Math.max(2, Math.floor(zoneW / 14));
  const sp = zoneW / (n + 1);

  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={C_HANG} />
      {/* 행거 레일 */}
      <line x1={x1 + 3} y1={rodY} x2={x2 - 3} y2={rodY} stroke={S_ROD} strokeWidth="1.5" />
      {/* 행거 심볼 (역 V 형태) */}
      {Array.from({ length: n }, (_, i) => {
        const cx = x1 + (i + 1) * sp;
        return (
          <path
            key={i}
            d={`M${cx},${rodY} L${cx - 4},${rodY + 9} L${cx + 4},${rodY + 9}`}
            stroke={S_HANGER}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

function ShelfZone({
  y1, y2, n,
  x1 = 2, x2 = W - 2,
}: {
  y1: number; y2: number; n: number; x1?: number; x2?: number;
}) {
  const sH = (y2 - y1) / (n + 1);
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={C_SHELF} />
      {Array.from({ length: n }, (_, i) => (
        <rect
          key={i}
          x={x1}
          y={y1 + (i + 1) * sH - 1.5}
          width={x2 - x1}
          height={3}
          fill={S_SHELF}
          rx="0.5"
        />
      ))}
    </g>
  );
}

function DrawerZone({ y1, y2, n }: { y1: number; y2: number; n: number }) {
  const gap = 3;
  const dH = (y2 - y1 - (n + 1) * gap) / n;
  return (
    <g>
      <rect x={2} y={y1} width={W - 4} height={y2 - y1} fill={C_DRAW} />
      {Array.from({ length: n }, (_, i) => {
        const dy = y1 + gap + i * (dH + gap);
        const cy = dy + dH / 2;
        return (
          <g key={i}>
            {/* 서랍 박스 */}
            <rect
              x={5} y={dy} width={W - 10} height={dH}
              fill="white" stroke={S_DRAW_STROKE} strokeWidth="0.75" rx="1.5"
            />
            {/* 손잡이 */}
            <rect
              x={W / 2 - 6} y={cy - 1.5} width={12} height={3}
              fill={S_DRAW_FILL} rx="1.5"
            />
          </g>
        );
      })}
    </g>
  );
}

// 상단 선반 (얇은 선반 공간 + 선반판)
function TopShelfZone({ h = 14 }: { h?: number }) {
  return (
    <g>
      <rect x={2} y={2} width={W - 4} height={h} fill={C_SHELF} />
      <rect x={2} y={h + 1} width={W - 4} height={3} fill={S_SHELF} rx="0.5" />
    </g>
  );
}

function Div({ y }: { y: number }) {
  return (
    <rect x={2} y={y - 1} width={W - 4} height={2} fill={S_DIV} rx="0.5" />
  );
}

function VDiv({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <rect x={x - 1} y={y1} width={2} height={y2 - y1} fill={S_DIV} rx="0.5" />
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────

export default function TemplateIcon({
  id,
  svgWidth = W,
  svgHeight = H,
  connected = false,
}: {
  id: string;
  svgWidth?: number | string;
  svgHeight?: number | string;
  connected?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `tci-${uid}`;

  let content: ReactNode = null;

  switch (id) {
    case "double_hanger":
      content = (
        <>
          <HangZone y1={2} y2={H / 2} />
          <Div y={H / 2} />
          <HangZone y1={H / 2} y2={H - 2} />
        </>
      );
      break;

    case "single_2drawer":
      // 긴옷 걸 수 있도록 행거 구역 70%로 확대
      content = (
        <>
          <HangZone y1={2} y2={H * 0.70} />
          <Div y={H * 0.70} />
          <DrawerZone y1={H * 0.70} y2={H - 2} n={2} />
        </>
      );
      break;

    case "double_4shelf_duvet":
      // 선반 3개 = 4칸 (이불수납)
      content = <ShelfZone y1={2} y2={H - 2} n={3} />;
      break;

    case "double_hanger_shelf":
      content = (
        <>
          <HangZone y1={2} y2={H * 0.5} />
          <Div y={H * 0.5} />
          <ShelfZone y1={H * 0.5} y2={H - 2} n={2} />
        </>
      );
      break;

    case "double_t_shelf":
      // 상단: 전체 행거 / 하단: 좌측 행거 + 우측 선반
      content = (
        <>
          {/* 상단 전체 행거 */}
          <HangZone y1={2} y2={H * 0.5} />
          {/* 중간 가로 구분선 */}
          <Div y={H * 0.5} />
          {/* 하단 좌 — 행거 */}
          <HangZone y1={H * 0.5} y2={H - 2} x1={2} x2={W / 2} />
          {/* 하단 세로 구분선 */}
          <VDiv x={W / 2} y1={H * 0.5} y2={H - 2} />
          {/* 하단 우 — 선반 2개 */}
          <ShelfZone y1={H * 0.5} y2={H - 2} n={2} x1={W / 2} x2={W - 2} />
        </>
      );
      break;

    case "single_1drawer": {
      // 최상단 선반 + 행거(긴옷) + 작은 서랍
      const topH = 14;
      const divY = H * 0.82;
      content = (
        <>
          <TopShelfZone h={topH} />
          <HangZone y1={topH + 4} y2={divY} />
          <Div y={divY} />
          <DrawerZone y1={divY} y2={H - 2} n={1} />
        </>
      );
      break;
    }

    case "shelf3_drawer4":
      // 상단 3단 선반 + 하단 서랍 4개
      content = (
        <>
          <ShelfZone y1={2} y2={H * 0.45} n={2} />
          <Div y={H * 0.45} />
          <DrawerZone y1={H * 0.45} y2={H - 2} n={4} />
        </>
      );
      break;

    default:
      content = null;
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${W} ${H}`}
      className={connected ? "block" : "mx-auto"}
      aria-label={id}
      preserveAspectRatio={connected ? "none" : undefined}
    >
      <defs>
        <clipPath id={clipId}>
          {connected
            ? <rect x="0" y="0" width={W} height={H} />
            : <rect x="2" y="2" width={W - 4} height={H - 4} rx="2" />
          }
        </clipPath>
      </defs>
      {/* 흰 배경 (standalone only) */}
      {!connected && <rect x="1" y="1" width={W - 2} height={H - 2} fill="white" rx="3" />}
      {/* 구역 내용 */}
      <g clipPath={`url(#${clipId})`}>{content}</g>
      {/* 테두리 (standalone only) */}
      {!connected && (
        <rect
          x="1" y="1" width={W - 2} height={H - 2}
          fill="none" stroke={S_BORDER} strokeWidth="2" rx="3"
        />
      )}
    </svg>
  );
}
