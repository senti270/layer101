"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { PriceSettings, BayConfig } from "./types";
import { TEMPLATES, DEFAULT_PRICES, PRICE_LABELS, STORAGE_KEY } from "./constants";
import TemplateIcon from "./TemplateIcon";

// ── 유틸 ──────────────────────────────────────────────────
function commas(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmt(n: number) {
  return commas(n) + "원";
}

/** mm → 자(尺), 0.5자 단위 올림. 1자 = 300mm */
function jaFromMm(mm: number): number {
  return Math.ceil((mm / 300) / 0.5) * 0.5;
}

function autoBayCount(width: number): number {
  const minBays = Math.max(1, Math.ceil(width / 1050));
  const maxBays = Math.max(1, Math.floor(width / 900));

  if (minBays <= maxBays) {
    // 유효 범위 존재 → 1000mm에 가장 가까운 n 선택
    const ideal = Math.round(width / 1000);
    return Math.max(minBays, Math.min(maxBays, ideal));
  }

  // 유효 범위 없음 → 1000mm와의 오차가 작은 쪽 선택
  const bayAtMin = width / minBays;
  const bayAtMax = width / maxBays;
  return Math.abs(bayAtMin - 1000) <= Math.abs(bayAtMax - 1000) ? minBays : maxBays;
}

function bayWidth(width: number, bayCount: number): number {
  return Math.round(width / bayCount);
}

function newBay(): BayConfig {
  return { id: crypto.randomUUID(), templateId: null, antiwarp: false };
}

// ── 단가 설정 모달 ─────────────────────────────────────────
function PriceModal({
  prices,
  marginRate,
  onMarginChange,
  bayWidthMm,
  bayJa,
  onSave,
  onClose,
}: {
  prices: PriceSettings;
  marginRate: number;
  onMarginChange: (r: number) => void;
  bayWidthMm: number;
  bayJa: number;
  onSave: (p: PriceSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PriceSettings>(prices);
  const keys = Object.keys(PRICE_LABELS) as (keyof PriceSettings)[];

  /** 견적단가 계산: 목대=자당×자수×마진, 도어=개당×2×마진, 나머지=단가×마진 */
  function quoteAmt(key: keyof PriceSettings, val: number) {
    const m = 1 + marginRate / 100;
    if (key === "woodFramePerBay") return { amt: Math.round(val * bayJa * m), note: `×${bayJa}자 · 칸당` };
    if (key === "doorPerBay")      return { amt: Math.round(val * 2 * m),    note: "×2개 · 칸당" };
    return { amt: Math.round(val * m), note: "" };
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-3">단가 설정</h3>

        {/* 마진율 + 칸 사이즈 */}
        <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-600 whitespace-nowrap">마진율</span>
            <div className="relative w-20">
              <input
                type="number"
                value={marginRate}
                onChange={(e) => onMarginChange(Math.max(0, Math.min(99, Number(e.target.value))))}
                className="w-full border border-blue-200 rounded-lg px-2 py-1.5 pr-6 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                min={0} max={99}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
          <div className="text-right border-l border-blue-200 pl-3">
            <p className="text-xs font-semibold text-blue-700">
              칸당 약 {commas(bayWidthMm)}mm
            </p>
            <p className="text-xs text-blue-400">{bayJa}자 적용</p>
          </div>
        </div>

        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="flex-1 text-xs text-gray-400">항목</span>
          <span className="w-28 text-xs text-gray-400 text-right">원가 단가</span>
          <span className="w-24 text-xs text-gray-400 text-right">견적가</span>
        </div>

        {/* 단가 목록 */}
        <div className="space-y-1.5">
          {keys.map((key) => {
            const { amt, note } = quoteAmt(key, draft[key]);
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-tight truncate">{PRICE_LABELS[key]}</p>
                  {note && <p className="text-xs text-gray-400 leading-tight">{note}</p>}
                </div>
                <div className="relative w-28 flex-shrink-0">
                  <input
                    type="number"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, [key]: Number(e.target.value) }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 pr-6 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                </div>
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-xs font-medium text-blue-600">
                    {commas(amt)}원
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 템플릿 선택 모달 ───────────────────────────────────────
function TemplateModal({
  current,
  onChange,
  onClear,
  onClose,
}: {
  current: string | null;
  onChange: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-bold text-gray-900 mb-4">장 유형 선택</h3>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onChange(t.id);
                onClose();
              }}
              className={`border-2 rounded-xl p-2 flex flex-col items-center gap-1.5 transition-all ${
                current === t.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-400 bg-white"
              }`}
            >
              <TemplateIcon id={t.id} />
              <span
                className={`text-xs font-medium text-center leading-tight whitespace-pre-line ${
                  current === t.id ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {t.name}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          {current && (
            <button
              onClick={() => { onClear(); onClose(); }}
              className="flex-1 border border-red-200 rounded-lg py-2 text-sm text-red-400 hover:bg-red-50 transition-colors"
            >
              비우기
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 계산기 ────────────────────────────────────────────
export default function WardrobeCalculator() {
  const [prices, setPrices] = useState<PriceSettings>(DEFAULT_PRICES);
  const [showPrices, setShowPrices] = useState(false);
  const [selectedBayIdx, setSelectedBayIdx] = useState<number | null>(null);
  const [dragOverBayIdx, setDragOverBayIdx] = useState<number | null>(null);
  const [dragBayIdx, setDragBayIdx] = useState<number | null>(null);

  const [width, setWidth] = useState(1800);
  const [height, setHeight] = useState(2400);
  const [depth, setDepth] = useState(600);
  const [bays, setBays] = useState<BayConfig[]>(() =>
    Array.from({ length: 3 }, () => newBay())
  );
  const [leftFinish, setLeftFinish] = useState(false);
  const [rightFinish, setRightFinish] = useState(false);
  const [includeInstall, setIncludeInstall] = useState(true);
  const [includeShipping, setIncludeShipping] = useState(true);
  const [includeMisc, setIncludeMisc] = useState(true);
  const [hingeType, setHingeType] = useState<"none" | "domestic" | "euro">("none");
  const [drawerRailType, setDrawerRailType] = useState<"none" | "domestic" | "euro">("none");
  const [pushFittingType, setPushFittingType] = useState<"none" | "domestic" | "euro">("none");
  const [marginRate, setMarginRate] = useState(0); // 마진율 (%)

  // 저장된 단가 + 마진율 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPrices({ ...DEFAULT_PRICES, ...JSON.parse(saved) });
      const savedMargin = localStorage.getItem(STORAGE_KEY + "_margin");
      if (savedMargin !== null) setMarginRate(Number(savedMargin));
    } catch {}
  }, []);

  const savePrices = useCallback((p: PriceSettings) => {
    setPrices(p);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }, []);

  const saveMarginRate = useCallback((r: number) => {
    const clamped = Math.max(0, Math.min(99, r));
    setMarginRate(clamped);
    try { localStorage.setItem(STORAGE_KEY + "_margin", String(clamped)); } catch {}
  }, []);

  // 가로 길이 변경 시 칸 수 자동 조정
  useEffect(() => {
    const count = autoBayCount(width);
    setBays((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const extras = Array.from({ length: count - prev.length }, () => newBay());
        return [...prev, ...extras];
      }
      return prev.slice(0, count);
    });
  }, [width]);

  // 칸 템플릿 변경
  const updateBayTemplate = useCallback((idx: number, templateId: string) => {
    setBays((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, templateId } : b))
    );
  }, []);

  // 휨방지 토글
  const toggleAntiwarp = useCallback((idx: number) => {
    setBays((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, antiwarp: !b.antiwarp } : b))
    );
  }, []);

  // 칸 순서 변경 (드래그 리오더)
  const reorderBays = useCallback((from: number, to: number) => {
    if (from === to) return;
    setBays((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  // 칸 비우기
  const clearBay = useCallback((idx: number) => {
    setBays((prev) =>
      prev.map((b, i) => i === idx ? { ...b, templateId: null, antiwarp: false } : b)
    );
  }, []);

  // 견적 계산
  const estimate = useMemo(() => {
    const bayW = bayWidth(width, bays.length);
    const bayJa = jaFromMm(bayW); // 0.5자 단위 올림
    // 옵션 단가 (칸당 계산용)
    const hingeUnit =
      hingeType === "domestic" ? prices.hingeDomestic
      : hingeType === "euro" ? prices.hingeEuro : 0;
    const drawerRailUnit =
      drawerRailType === "domestic" ? prices.drawerRailDomestic
      : drawerRailType === "euro" ? prices.drawerRailEuro : 0;
    const pushFittingUnit =
      pushFittingType === "domestic" ? prices.pushFittingDomestic
      : pushFittingType === "euro" ? prices.pushFittingEuro : 0;

    const bayDetails: Array<{
      no: number; templateName: string;
      bayJa: number;
      woodFrame: number; door: number;
      hangerRods: number; hangerRodAmt: number;
      shelves: number; shelfAmt: number;
      drawers: number; drawerAmt: number; drawerAssemblyAmt: number;
      antiwarpAmt: number;
      hingeAmt: number;
      drawerRailAmt: number;
      pushFittingAmt: number;
      total: number;
    }> = [];
    bays.forEach((bay, i) => {
      if (!bay.templateId) return;
      const t = TEMPLATES.find((t) => t.id === bay.templateId)!;
      const woodFrame = prices.woodFramePerBay * bayJa;
      const door = prices.doorPerBay * 2;
      const hangerRodAmt = t.hangerRods * prices.hangerRod;
      const shelfAmt = t.shelves * prices.shelf;
      const drawerAmt = t.drawers * prices.drawer;
      const drawerAssemblyAmt = t.drawers * prices.drawerAssembly;
      const antiwarpAmt = bay.antiwarp ? t.shelves * prices.antiwarpPerShelf : 0;
      const hingeAmt = 8 * hingeUnit;
      const drawerRailAmt = t.drawers * drawerRailUnit;
      const pushFittingAmt = 2 * pushFittingUnit;
      const total = woodFrame + door + hangerRodAmt + shelfAmt + drawerAmt
        + drawerAssemblyAmt + antiwarpAmt + hingeAmt + drawerRailAmt + pushFittingAmt;
      bayDetails.push({
        no: i + 1,
        templateName: t.name.replace("\n", " "),
        bayJa,
        woodFrame, door,
        hangerRods: t.hangerRods, hangerRodAmt,
        shelves: t.shelves, shelfAmt,
        drawers: t.drawers, drawerAmt, drawerAssemblyAmt,
        antiwarpAmt,
        hingeAmt, drawerRailAmt, pushFittingAmt,
        total,
      });
    });

    const bayTotal = bayDetails.reduce((s, b) => s + b.total, 0);
    const finishTotal =
      (leftFinish ? prices.finishPanel : 0) +
      (rightFinish ? prices.finishPanel : 0);
    const installTotal = includeInstall ? prices.installation : 0;
    const shippingTotal = includeShipping ? prices.shippingFee : 0;
    const miscTotal = includeMisc ? prices.miscFee : 0;

    const subtotal = bayTotal + finishTotal + installTotal + shippingTotal + miscTotal;
    const marginAmt = Math.round(subtotal * marginRate / 100);
    const quoteTotal = subtotal + marginAmt;

    return {
      bayDetails, bayTotal, finishTotal, installTotal,
      shippingTotal, miscTotal,
      subtotal, marginAmt, quoteTotal,
      bayJa, bayW,
    };
  }, [bays, prices, width, leftFinish, rightFinish,
      includeInstall, includeShipping, includeMisc,
      hingeType, drawerRailType, pushFittingType, marginRate]);

  return (
    <>
      {showPrices && (
        <PriceModal
          prices={prices}
          marginRate={marginRate}
          onMarginChange={saveMarginRate}
          bayWidthMm={bayWidth(width, bays.length)}
          bayJa={jaFromMm(bayWidth(width, bays.length))}
          onSave={savePrices}
          onClose={() => setShowPrices(false)}
        />
      )}
      {selectedBayIdx !== null && (
        <TemplateModal
          current={bays[selectedBayIdx]?.templateId ?? null}
          onChange={(id) => updateBayTemplate(selectedBayIdx, id)}
          onClear={() => clearBay(selectedBayIdx)}
          onClose={() => setSelectedBayIdx(null)}
        />
      )}

      <div className="space-y-7">
        {/* 단가 설정 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowPrices(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" />
            </svg>
            단가 설정
          </button>
        </div>

        {/* 사이즈 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            사이즈
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: "폭 (W)", value: width, set: setWidth, min: 600, max: 5000 },
                { label: "높이 (H)", value: height, set: setHeight, min: 1800, max: 2800 },
                { label: "깊이 (D)", value: depth, set: setDepth, min: 400, max: 700 },
              ] as const
            ).map(({ label, value, set, min, max }) => (
              <div key={label}>
                <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    mm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 장 구성 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              장 구성{" "}
              <span className="text-gray-300 font-normal normal-case tracking-normal">
                ({bays.length}칸 · 칸당 약 {commas(bayWidth(width, bays.length))}mm)
              </span>
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setBays((p) => p.length > 1 ? p.slice(0, -1) : p)}
                className="text-gray-400 hover:text-gray-600 font-bold w-6 h-6 flex items-center justify-center border border-gray-300 rounded"
              >−</button>
              <button
                onClick={() => setBays((p) => [...p, newBay()])}
                className="text-gray-400 hover:text-gray-600 font-bold w-6 h-6 flex items-center justify-center border border-gray-300 rounded"
              >+</button>
            </div>
          </div>

          {/* 장 유형 팔레트 — 드래그 소스 */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">장 유형을 아래 옷장으로 드래그 · 칸을 드래그해 순서 변경 · 클릭으로 선택</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("dtype-template", t.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0 cursor-grab active:cursor-grabbing select-none border border-gray-200 rounded-xl p-1.5 bg-white hover:border-blue-400 hover:shadow-sm transition-all"
                  title={t.name.replace("\n", " ")}
                >
                  <TemplateIcon id={t.id} svgWidth={38} svgHeight={76} />
                  <span className="text-xs text-gray-600 text-center whitespace-pre-line leading-tight w-10">
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 연결형 옷장 프레임 — bay 1칸당 고정 160×270px */}
          <div className="overflow-x-auto text-center">
          <div
            className="border-2 border-slate-700 rounded-sm overflow-hidden inline-flex"
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverBayIdx(null);
              }
            }}
          >
            {bays.map((bay, i) => {
              const isOver = dragOverBayIdx === i;
              const isDragging = dragBayIdx === i;
              const hasTemplate = bay.templateId !== null;
              return (
                <div
                  key={bay.id}
                  draggable={hasTemplate}
                  className={`relative select-none transition-opacity${
                    i < bays.length - 1 ? " border-r-2 border-slate-400" : ""
                  }${isDragging ? " opacity-30" : ""}${
                    hasTemplate ? " cursor-grab active:cursor-grabbing" : " cursor-default"
                  }`}
                  style={{ width: "100px", height: "220px", flexShrink: 0, position: "relative" }}
                  onDragStart={hasTemplate ? (e) => {
                    e.dataTransfer.setData("dtype-reorder", String(i));
                    e.dataTransfer.effectAllowed = "move";
                    setTimeout(() => setDragBayIdx(i), 0);
                  } : undefined}
                  onDragEnd={() => {
                    setDragBayIdx(null);
                    setDragOverBayIdx(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("dtype-reorder")
                      ? "move"
                      : "copy";
                    setDragOverBayIdx(i);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const types = e.dataTransfer.types;
                    if (types.includes("dtype-template")) {
                      const templateId = e.dataTransfer.getData("dtype-template");
                      if (templateId) updateBayTemplate(i, templateId);
                    } else if (types.includes("dtype-reorder")) {
                      const fromIdx = Number(e.dataTransfer.getData("dtype-reorder"));
                      reorderBays(fromIdx, i);
                    }
                    setDragOverBayIdx(null);
                    setDragBayIdx(null);
                  }}
                  onClick={() => setSelectedBayIdx(i)}
                >
                  {hasTemplate ? (
                    <TemplateIcon
                      id={bay.templateId!}
                      svgWidth="100%"
                      svgHeight="100%"
                      connected
                    />
                  ) : (
                    /* 빈 칸 — dashed placeholder */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
                      <svg
                        width="32" height="32" viewBox="0 0 32 32"
                        fill="none" stroke="#94a3b8" strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="26" height="26" rx="2" strokeDasharray="4 3" />
                        <line x1="16" y1="10" x2="16" y2="22" strokeLinecap="round" />
                        <line x1="10" y1="16" x2="22" y2="16" strokeLinecap="round" />
                      </svg>
                      <span className="text-xs text-slate-400 text-center leading-tight px-1">
                        여기에<br />드래그
                      </span>
                    </div>
                  )}
                  {/* 드롭 오버레이 */}
                  {isOver && (
                    <div
                      className="absolute inset-0 pointer-events-none bg-blue-400/20"
                      style={{ boxShadow: "inset 0 0 0 3px #3b82f6" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          </div>{/* /overflow-x-auto */}

          {/* 칸 번호 + 휨방지 체크박스 */}
          <div className="text-center mt-1.5">
          <div className="inline-flex">
            {bays.map((bay, i) => {
              const t = bay.templateId
                ? TEMPLATES.find((t) => t.id === bay.templateId) ?? null
                : null;
              return (
                <div
                  key={bay.id}
                  className="flex flex-col items-center gap-0.5 pt-1"
                  style={{ width: "100px", flexShrink: 0 }}
                >
                  <span className="text-xs text-gray-400 font-medium">{i + 1}칸</span>
                  <span className="text-xs text-gray-300 leading-none">
                    {commas(bayWidth(width, bays.length))}mm
                  </span>
                  {t && t.shelves > 0 && (
                    <label className="flex items-center gap-0.5 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bay.antiwarp}
                        onChange={() => toggleAntiwarp(i)}
                        className="accent-blue-600"
                      />
                      <span className="leading-none">휨방지</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          </div>{/* /text-center */}
        </section>

        {/* 옵션 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            옵션
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {(
              [
                {
                  label: "좌측 마감",
                  checked: leftFinish,
                  toggle: () => setLeftFinish((v) => !v),
                  price: prices.finishPanel,
                },
                {
                  label: "우측 마감",
                  checked: rightFinish,
                  toggle: () => setRightFinish((v) => !v),
                  price: prices.finishPanel,
                },
                {
                  label: "설치비",
                  checked: includeInstall,
                  toggle: () => setIncludeInstall((v) => !v),
                  price: prices.installation,
                },
                {
                  label: "운임비",
                  checked: includeShipping,
                  toggle: () => setIncludeShipping((v) => !v),
                  price: prices.shippingFee,
                },
                {
                  label: "폐기물 처리 및 기타",
                  checked: includeMisc,
                  toggle: () => setIncludeMisc((v) => !v),
                  price: prices.miscFee,
                },
              ] as const
            ).map(({ label, checked, toggle, price }) => (
              <label
                key={label}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={toggle}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <span className="text-xs text-gray-400">{fmt(price)}</span>
              </label>
            ))}

            {/* 경첩 선택 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700">경첩</span>
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "none" as const, label: "없음", price: null },
                    { key: "domestic" as const, label: "국산", price: prices.hingeDomestic },
                    { key: "euro" as const, label: "유럽산", price: prices.hingeEuro },
                  ]
                ).map(({ key, label, price }) => (
                  <button
                    key={key}
                    onClick={() => setHingeType(key)}
                    className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                      hingeType === key
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {label}
                    {price !== null && (
                      <span className="ml-1 opacity-60">{commas(price)}원</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 서랍레일 선택 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700">서랍레일</span>
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "none" as const, label: "없음", price: null },
                    { key: "domestic" as const, label: "국산", price: prices.drawerRailDomestic },
                    { key: "euro" as const, label: "유럽산", price: prices.drawerRailEuro },
                  ]
                ).map(({ key, label, price }) => (
                  <button
                    key={key}
                    onClick={() => setDrawerRailType(key)}
                    className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                      drawerRailType === key
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {label}
                    {price !== null && (
                      <span className="ml-1 opacity-60">{commas(price)}원</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 푸쉬철물 선택 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700">푸쉬철물</span>
              <div className="flex gap-1.5">
                {(
                  [
                    { key: "none" as const, label: "없음", price: null },
                    { key: "domestic" as const, label: "국산", price: prices.pushFittingDomestic },
                    { key: "euro" as const, label: "유럽산", price: prices.pushFittingEuro },
                  ]
                ).map(({ key, label, price }) => (
                  <button
                    key={key}
                    onClick={() => setPushFittingType(key)}
                    className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                      pushFittingType === key
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {label}
                    {price !== null && (
                      <span className="ml-1 opacity-60">{commas(price)}원</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 견적 요약 */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          {/* 헤더 + 마진율 입력 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-700">예상 견적</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-500">마진율</span>
              <div className="relative">
                <input
                  type="number"
                  value={marginRate}
                  onChange={(e) => saveMarginRate(Number(e.target.value))}
                  className="w-16 border border-blue-200 rounded-lg px-2 py-1 pr-6 text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  min={0} max={99} step={1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* 칸별 원가 내역 */}
          <div className="space-y-3 text-sm mb-4">
            {estimate.bayDetails.length === 0 && (
              <p className="text-sm text-blue-300 text-center py-1">
                장 유형을 칸에 드래그해서 채워주세요
              </p>
            )}
            {estimate.bayDetails.map((bay) => (
              <div key={bay.no}>
                {/* 칸 헤더 */}
                <div className="flex justify-between font-medium text-gray-700">
                  <span>{bay.no}칸 · {bay.templateName}</span>
                  <span>{fmt(bay.total)}</span>
                </div>
                {/* 상세 내역 */}
                <div className="mt-1 pl-3 border-l-2 border-blue-100 space-y-0.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>목대 {bay.bayJa}자 × {commas(prices.woodFramePerBay)}원</span>
                    <span>{fmt(bay.woodFrame)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>도어 2개 × {commas(prices.doorPerBay)}원</span>
                    <span>{fmt(bay.door)}</span>
                  </div>
                  {bay.hangerRods > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>행거바 {bay.hangerRods}개 × {commas(prices.hangerRod)}원</span>
                      <span>{fmt(bay.hangerRodAmt)}</span>
                    </div>
                  )}
                  {bay.shelves > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>선반 {bay.shelves}장 × {commas(prices.shelf)}원</span>
                      <span>{fmt(bay.shelfAmt)}</span>
                    </div>
                  )}
                  {bay.drawers > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>서랍 {bay.drawers}개 × {commas(prices.drawer)}원</span>
                      <span>{fmt(bay.drawerAmt)}</span>
                    </div>
                  )}
                  {bay.drawers > 0 && bay.drawerAssemblyAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>서랍조립비 {bay.drawers}개 × {commas(prices.drawerAssembly)}원</span>
                      <span>{fmt(bay.drawerAssemblyAmt)}</span>
                    </div>
                  )}
                  {bay.antiwarpAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>휨방지 {bay.shelves}장 × {commas(prices.antiwarpPerShelf)}원</span>
                      <span>{fmt(bay.antiwarpAmt)}</span>
                    </div>
                  )}
                  {bay.hingeAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>경첩 ({hingeType === "domestic" ? "국산" : "유럽산"}) 8개 × {commas(hingeType === "domestic" ? prices.hingeDomestic : prices.hingeEuro)}원</span>
                      <span>{fmt(bay.hingeAmt)}</span>
                    </div>
                  )}
                  {bay.drawerRailAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>서랍레일 ({drawerRailType === "domestic" ? "국산" : "유럽산"}) {bay.drawers}세트 × {commas(drawerRailType === "domestic" ? prices.drawerRailDomestic : prices.drawerRailEuro)}원</span>
                      <span>{fmt(bay.drawerRailAmt)}</span>
                    </div>
                  )}
                  {bay.pushFittingAmt > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>푸쉬철물 ({pushFittingType === "domestic" ? "국산" : "유럽산"}) 2개 × {commas(pushFittingType === "domestic" ? prices.pushFittingDomestic : prices.pushFittingEuro)}원</span>
                      <span>{fmt(bay.pushFittingAmt)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {estimate.finishTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>마감판</span>
                <span>{fmt(estimate.finishTotal)}</span>
              </div>
            )}
            {estimate.installTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>설치비</span><span>{fmt(estimate.installTotal)}</span>
              </div>
            )}
            {estimate.shippingTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>운임비</span><span>{fmt(estimate.shippingTotal)}</span>
              </div>
            )}
            {estimate.miscTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>폐기물 처리 및 기타</span><span>{fmt(estimate.miscTotal)}</span>
              </div>
            )}
          </div>

          {/* 원가 소계 */}
          <div className="border-t border-blue-200 pt-3 space-y-1.5">
            <div className="flex justify-between items-baseline text-sm text-blue-600">
              <span>원가 합계</span>
              <span className="font-semibold">{fmt(estimate.subtotal)}</span>
            </div>
            {marginRate > 0 && (
              <div className="flex justify-between items-baseline text-xs text-blue-400">
                <span>마진 ({marginRate}%)</span>
                <span>+ {fmt(estimate.marginAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-blue-200">
              <span className="font-semibold text-blue-800">견적가 (VAT 별도)</span>
              <span className="text-2xl font-bold text-blue-700">
                {fmt(estimate.quoteTotal)}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-0.5">
            <p className="text-xs text-blue-500 font-medium">
              목대: {estimate.bayJa}자 × {commas(prices.woodFramePerBay)}원 = {commas(estimate.bayJa * prices.woodFramePerBay)}원/칸
            </p>
            <p className="text-xs text-gray-400">
              * 현장 실측 후 실제 견적은 달라질 수 있습니다.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
