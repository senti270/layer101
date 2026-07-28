"use client";

import { useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────
interface CarcassSpec {
  id: string;
  name: string;
  side_t: number;   // 옆판 두께 mm
  shelf_t: number;  // 선반 두께 mm
  back_t: number;   // 뒷판 두께 mm
  top_t: number;    // 상판 두께 mm
  is_default: boolean;
  note?: string;
}

type DoorType = "hinged" | "sliding" | "lift_up" | "open";
type OverlayType = "full" | "half" | "inset";

interface DoorSpec {
  id: string;
  name: string;
  door_type: DoorType;
  thickness: number;
  overlay: OverlayType;
  soft_close: boolean;
  push_to_open: boolean;
  hinge_count_formula: string;  // e.g. "ceil(H/400)+1"
  note?: string;
}

const DOOR_TYPE_LABEL: Record<DoorType, string>    = { hinged:"여닫이", sliding:"슬라이딩", lift_up:"리프트업", open:"오픈형" };
const OVERLAY_LABEL: Record<OverlayType, string>   = { full:"풀오버레이", half:"하프오버레이", inset:"인셋" };
const DOOR_TYPE_COLOR: Record<DoorType, string>    = {
  hinged:"bg-blue-100 text-blue-700", sliding:"bg-green-100 text-green-700",
  lift_up:"bg-yellow-100 text-yellow-700", open:"bg-gray-100 text-gray-600"
};

// ── 더미 데이터 ───────────────────────────────────────────────
const INIT_CARCASS: CarcassSpec[] = [
  { id:"c1", name:"기본 18T",       side_t:18, shelf_t:18, back_t: 9, top_t:18, is_default:true,  note:"일반 LPM 합판 기준" },
  { id:"c2", name:"두꺼운 19T",     side_t:19, shelf_t:19, back_t: 9, top_t:19, is_default:false, note:"무거운 도어용 보강" },
  { id:"c3", name:"자작 18T (고급)",side_t:18, shelf_t:18, back_t:12, top_t:18, is_default:false, note:"자작합판 마감" },
];

const INIT_DOOR: DoorSpec[] = [
  { id:"d1", name:"기본 여닫이 18T",    door_type:"hinged",  thickness:18, overlay:"full",  soft_close:false, push_to_open:false, hinge_count_formula:"floor(H/600)+1" },
  { id:"d2", name:"블럼 소프트클로즈",  door_type:"hinged",  thickness:18, overlay:"full",  soft_close:true,  push_to_open:false, hinge_count_formula:"floor(H/600)+1" },
  { id:"d3", name:"푸쉬오픈 손잡이없음",door_type:"hinged",  thickness:18, overlay:"full",  soft_close:true,  push_to_open:true,  hinge_count_formula:"floor(H/600)+1" },
  { id:"d4", name:"2중 슬라이딩",       door_type:"sliding", thickness:18, overlay:"full",  soft_close:false, push_to_open:false, hinge_count_formula:"—" },
  { id:"d5", name:"인셋 힌지 15T",     door_type:"hinged",  thickness:15, overlay:"inset", soft_close:true,  push_to_open:false, hinge_count_formula:"floor(H/500)+1" },
];

// ── CarcassSpec 모달 ──────────────────────────────────────────
function CarcassModal({ spec, onClose, onSave }: {
  spec: CarcassSpec | null;
  onClose: () => void;
  onSave: (s: Omit<CarcassSpec,"id">) => void;
}) {
  const [f, setF] = useState<Omit<CarcassSpec,"id">>(spec
    ? { name:spec.name, side_t:spec.side_t, shelf_t:spec.shelf_t, back_t:spec.back_t, top_t:spec.top_t, is_default:spec.is_default, note:spec.note??""  }
    : { name:"", side_t:18, shelf_t:18, back_t:9, top_t:18, is_default:false, note:"" }
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{spec ? "몸통 사양 수정" : "몸통 사양 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">사양명</label>
            <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
              placeholder="기본 18T"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([["옆판 두께","side_t",f.side_t],["선반 두께","shelf_t",f.shelf_t],["뒷판 두께","back_t",f.back_t],["상판 두께","top_t",f.top_t]] as [string,keyof typeof f,number][]).map(([label,key,val])=>(
              <div key={key}>
                <label className="text-xs text-gray-500 font-medium block mb-1">{label} (mm)</label>
                <input type="number" value={val}
                  onChange={e=>setF(p=>({...p,[key]:Number(e.target.value)}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">비고</label>
            <input value={f.note??""} onChange={e=>setF(p=>({...p,note:e.target.value}))}
              placeholder="특이사항..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={f.is_default} onChange={e=>setF(p=>({...p,is_default:e.target.checked}))} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">기본 사양으로 설정</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">취소</button>
          <button onClick={()=>onSave(f)} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">{spec?"수정":"추가"}</button>
        </div>
      </div>
    </div>
  );
}

// ── DoorSpec 모달 ─────────────────────────────────────────────
function DoorModal({ spec, onClose, onSave }: {
  spec: DoorSpec | null;
  onClose: () => void;
  onSave: (s: Omit<DoorSpec,"id">) => void;
}) {
  const [f, setF] = useState<Omit<DoorSpec,"id">>(spec
    ? { name:spec.name, door_type:spec.door_type, thickness:spec.thickness, overlay:spec.overlay, soft_close:spec.soft_close, push_to_open:spec.push_to_open, hinge_count_formula:spec.hinge_count_formula, note:spec.note??"" }
    : { name:"", door_type:"hinged", thickness:18, overlay:"full", soft_close:false, push_to_open:false, hinge_count_formula:"floor(H/600)+1", note:"" }
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{spec ? "도어 사양 수정" : "도어 사양 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">사양명</label>
            <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
              placeholder="블럼 소프트클로즈 여닫이"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">도어 타입</label>
              <select value={f.door_type} onChange={e=>setF(p=>({...p,door_type:e.target.value as DoorType}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {Object.entries(DOOR_TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">두께 (mm)</label>
              <input type="number" value={f.thickness}
                onChange={e=>setF(p=>({...p,thickness:Number(e.target.value)}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">오버레이</label>
              <select value={f.overlay} onChange={e=>setF(p=>({...p,overlay:e.target.value as OverlayType}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {Object.entries(OVERLAY_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              경첩 수량 공식
              <span className="ml-1 text-gray-400 font-normal">(변수: H = 도어높이mm)</span>
            </label>
            <input value={f.hinge_count_formula}
              onChange={e=>setF(p=>({...p,hinge_count_formula:e.target.value}))}
              placeholder="floor(H/600)+1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.soft_close}
                onChange={e=>setF(p=>({...p,soft_close:e.target.checked}))} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">소프트클로즈</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.push_to_open}
                onChange={e=>setF(p=>({...p,push_to_open:e.target.checked}))} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">푸쉬투오픈 (손잡이없음)</span>
            </label>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">비고</label>
            <input value={f.note??""} onChange={e=>setF(p=>({...p,note:e.target.value}))}
              placeholder="특이사항..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">취소</button>
          <button onClick={()=>onSave(f)} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">{spec?"수정":"추가"}</button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function SpecsPage() {
  const [carcassList, setCarcassList] = useState<CarcassSpec[]>(INIT_CARCASS);
  const [doorList, setDoorList]       = useState<DoorSpec[]>(INIT_DOOR);
  const [activeTab, setActiveTab]     = useState<"carcass"|"door">("carcass");

  // carcass modal
  const [showCC, setShowCC]   = useState(false);
  const [editCC, setEditCC]   = useState<CarcassSpec | null>(null);

  // door modal
  const [showDD, setShowDD]   = useState(false);
  const [editDD, setEditDD]   = useState<DoorSpec | null>(null);

  function saveCarcass(f: Omit<CarcassSpec,"id">) {
    if (editCC) setCarcassList(p => p.map(c => c.id===editCC.id ? {...c,...f} : c));
    else setCarcassList(p => [...p, { id: crypto.randomUUID(), ...f }]);
    setShowCC(false); setEditCC(null);
  }
  function saveDoor(f: Omit<DoorSpec,"id">) {
    if (editDD) setDoorList(p => p.map(d => d.id===editDD.id ? {...d,...f} : d));
    else setDoorList(p => [...p, { id: crypto.randomUUID(), ...f }]);
    setShowDD(false); setEditDD(null);
  }

  return (
    <div className="p-6 space-y-5">
      {showCC && <CarcassModal spec={editCC} onClose={()=>{setShowCC(false);setEditCC(null);}} onSave={saveCarcass} />}
      {showDD && <DoorModal   spec={editDD} onClose={()=>{setShowDD(false);setEditDD(null);}} onSave={saveDoor} />}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">사양 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">몸통 사양 (CarcassSpec) · 도어 사양 (DoorSpec) 관리</p>
        </div>
        <button
          onClick={() => activeTab === "carcass" ? (setEditCC(null), setShowCC(true)) : (setEditDD(null), setShowDD(true))}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + {activeTab === "carcass" ? "몸통 사양 추가" : "도어 사양 추가"}
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-0 border-b border-gray-200">
        {([["carcass","몸통 사양 (Carcass)"],["door","도어 사양 (Door)"]] as ["carcass"|"door",string][]).map(([key,label])=>(
          <button key={key} onClick={()=>setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab===key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── 몸통 사양 ── */}
      {activeTab === "carcass" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">사양명</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">옆판T</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">선반T</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">뒷판T</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">상판T</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">비고</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">기본</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carcassList.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  {[c.side_t, c.shelf_t, c.back_t, c.top_t].map((v,i) => (
                    <td key={i} className="px-3 py-3 text-center text-gray-600">{v}mm</td>
                  ))}
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.note ?? "—"}</td>
                  <td className="px-3 py-3 text-center">
                    {c.is_default && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">기본</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={()=>{setEditCC(c);setShowCC(true);}} className="text-xs text-blue-600 hover:underline">수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 도어 사양 ── */}
      {activeTab === "door" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">사양명</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">타입</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">두께</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">오버레이</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">경첩수 공식</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">소프트</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">푸쉬</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doorList.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DOOR_TYPE_COLOR[d.door_type]}`}>
                      {DOOR_TYPE_LABEL[d.door_type]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">{d.thickness}mm</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{OVERLAY_LABEL[d.overlay]}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.hinge_count_formula}</td>
                  <td className="px-3 py-3 text-center">
                    {d.soft_close ? <span className="text-green-500">✓</span> : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {d.push_to_open ? <span className="text-green-500">✓</span> : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={()=>{setEditDD(d);setShowDD(true);}} className="text-xs text-blue-600 hover:underline">수정</button>
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
