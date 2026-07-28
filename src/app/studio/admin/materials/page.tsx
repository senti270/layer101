"use client";

import { useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────
type MatType = "panel" | "edge" | "back" | "etc";

interface Material {
  id: string;
  code: string;
  name: string;
  type: MatType;
  thickness: number;   // mm
  unit: string;        // "장" | "m" | "개"
  price: number;       // 원
  supplier: string;
  inStock: boolean;
  note?: string;
}

const TYPE_LABEL: Record<MatType, string> = {
  panel: "판재",
  edge:  "엣지",
  back:  "뒷판",
  etc:   "기타",
};

const TYPE_COLOR: Record<MatType, string> = {
  panel: "bg-blue-100 text-blue-700",
  edge:  "bg-yellow-100 text-yellow-700",
  back:  "bg-gray-100 text-gray-600",
  etc:   "bg-purple-100 text-purple-700",
};

// ── 더미 데이터 ───────────────────────────────────────────────
const INIT_MATERIALS: Material[] = [
  { id:"m1",  code:"LPM-WH18", name:"LPM 화이트 18T",     type:"panel", thickness:18, unit:"장",  price: 28000, supplier:"성창기업",    inStock:true  },
  { id:"m2",  code:"LPM-WH15", name:"LPM 화이트 15T",     type:"panel", thickness:15, unit:"장",  price: 22000, supplier:"성창기업",    inStock:true  },
  { id:"m3",  code:"LPM-GY18", name:"LPM 그레이 18T",     type:"panel", thickness:18, unit:"장",  price: 30000, supplier:"성창기업",    inStock:false },
  { id:"m4",  code:"MDF-WH09", name:"MDF 화이트 9T",      type:"back",  thickness: 9, unit:"장",  price: 12000, supplier:"한솔홈데코",  inStock:true  },
  { id:"m5",  code:"PLY-BIR18",name:"자작합판 18T",        type:"panel", thickness:18, unit:"장",  price: 45000, supplier:"건축자재마트", inStock:true  },
  { id:"m6",  code:"EDG-WH02", name:"엣지 화이트 0.2mm",  type:"edge",  thickness: 0, unit:"m",   price:   150, supplier:"국내",        inStock:true  },
  { id:"m7",  code:"EDG-WH05", name:"엣지 화이트 0.5mm",  type:"edge",  thickness: 0, unit:"m",   price:   200, supplier:"국내",        inStock:true  },
  { id:"m8",  code:"EDG-WH2T", name:"엣지 화이트 2mm ABS",type:"edge",  thickness: 0, unit:"m",   price:   350, supplier:"국내",        inStock:false },
];

// ── 모달 ──────────────────────────────────────────────────────
const BLANK: Omit<Material, "id"> = {
  code: "", name: "", type: "panel", thickness: 18,
  unit: "장", price: 0, supplier: "", inStock: true, note: "",
};

function MaterialModal({
  mat, onClose, onSave,
}: {
  mat: Material | null;
  onClose: () => void;
  onSave: (m: Omit<Material, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<Material, "id">>(
    mat ? { code: mat.code, name: mat.name, type: mat.type, thickness: mat.thickness, unit: mat.unit, price: mat.price, supplier: mat.supplier, inStock: mat.inStock, note: mat.note ?? "" }
        : { ...BLANK }
  );

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{mat ? "자재 수정" : "자재 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">자재코드</label>
              <input value={form.code} onChange={e => set("code", e.target.value)}
                placeholder="LPM-WH18"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">자재명</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="LPM 화이트 18T"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">구분</label>
              <select value={form.type} onChange={e => set("type", e.target.value as MatType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {Object.entries(TYPE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">두께 (mm)</label>
              <input type="number" value={form.thickness} onChange={e => set("thickness", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">단위</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {["장","m","개","roll"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">단가 (원/{form.unit})</label>
              <input type="number" value={form.price} onChange={e => set("price", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">공급업체</label>
              <input value={form.supplier} onChange={e => set("supplier", e.target.value)}
                placeholder="성창기업"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">비고</label>
            <input value={form.note ?? ""} onChange={e => set("note", e.target.value)}
              placeholder="특이사항 입력..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.inStock}
              onChange={e => set("inStock", e.target.checked)}
              className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">재고 있음</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm border border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">취소</button>
          <button onClick={() => onSave(form)} className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
            {mat ? "수정" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>(INIT_MATERIALS);
  const [filterType, setFilterType] = useState<MatType | "all">("all");
  const [showModal, setShowModal]   = useState(false);
  const [editMat, setEditMat]       = useState<Material | null>(null);

  const filtered = filterType === "all" ? materials : materials.filter(m => m.type === filterType);

  function handleSave(form: Omit<Material, "id">) {
    if (editMat) {
      setMaterials(prev => prev.map(m => m.id === editMat.id ? { ...m, ...form } : m));
    } else {
      setMaterials(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setShowModal(false);
    setEditMat(null);
  }

  function openEdit(mat: Material) {
    setEditMat(mat);
    setShowModal(true);
  }

  function openAdd() {
    setEditMat(null);
    setShowModal(true);
  }

  return (
    <div className="p-6 space-y-5">
      {showModal && (
        <MaterialModal mat={editMat} onClose={() => { setShowModal(false); setEditMat(null); }} onSave={handleSave} />
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">자재 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">판재 · 엣지 · 뒷판 등 자재 단가 및 사양 관리</p>
        </div>
        <button
          onClick={openAdd}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 자재 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {([["all","전체"], ["panel","판재"], ["edge","엣지"], ["back","뒷판"], ["etc","기타"]] as [MatType|"all",string][]).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filterType === v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">코드</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">자재명</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">구분</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">두께</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">단가</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">공급업체</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">재고</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.code}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {m.name}
                  {m.note && <span className="ml-2 text-xs text-gray-400">{m.note}</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[m.type]}`}>
                    {TYPE_LABEL[m.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600 text-xs">
                  {m.thickness > 0 ? `${m.thickness}T` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {m.price.toLocaleString()}원/{m.unit}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">{m.supplier}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${m.inStock ? "bg-green-400" : "bg-red-300"}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(m)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {filtered.length}개 자재</p>
    </div>
  );
}
