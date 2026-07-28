"use client";

import { useState } from "react";

const CATEGORIES = ["전체", "경첩", "서랍레일", "슬라이딩레일", "푸쉬피팅", "손잡이", "행거바", "선반핀", "캠락"];
const BRANDS = ["전체", "블럼", "헤티히", "그라스", "국산", "중국산"];

const DUMMY_ITEMS = [
  { id: "1", category: "경첩",    brand: "블럼",  name: "클립탑 경첩 110도 소프트클로징",      model: "71M2550",    spec: "풀오버레이·35보링·소프트클로징", price: 5000,  unit: "ea", active: true },
  { id: "2", category: "경첩",    brand: "블럼",  name: "클립탑 경첩 165도 소프트클로징",      model: "71M5550",    spec: "풀오버레이·35보링·165도",        price: 7000,  unit: "ea", active: true },
  { id: "3", category: "경첩",    brand: "헤티히", name: "인터맷 경첩 110도",                  model: "9073484",    spec: "풀오버레이·35보링",              price: 4500,  unit: "ea", active: true },
  { id: "4", category: "경첩",    brand: "국산",  name: "일반 경첩 110도",                    model: "-",          spec: "풀오버레이·35보링",              price:  800,  unit: "ea", active: true },
  { id: "5", category: "서랍레일", brand: "블럼",  name: "TANDEM 풀익스텐션 500mm",            model: "563H5000B",  spec: "500mm·풀익스텐션·소프트클로징", price: 28000, unit: "set", active: true },
  { id: "6", category: "서랍레일", brand: "블럼",  name: "TANDEM 풀익스텐션 400mm",            model: "563H4000B",  spec: "400mm·풀익스텐션·소프트클로징", price: 25000, unit: "set", active: true },
  { id: "7", category: "서랍레일", brand: "국산",  name: "사이드마운트 레일 500mm",            model: "-",          spec: "500mm·사이드마운트",             price:  3000, unit: "set", active: true },
  { id: "8", category: "푸쉬피팅", brand: "블럼",  name: "TIP-ON 푸쉬 오프너",                model: "956.1201",   spec: "도어 두께 16-20mm",              price:  8000, unit: "ea", active: true },
];

export default function HardwarePage() {
  const [selectedCat, setSelectedCat] = useState("전체");
  const [selectedBrand, setSelectedBrand] = useState("전체");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = DUMMY_ITEMS.filter((item) =>
    (selectedCat === "전체" || item.category === selectedCat) &&
    (selectedBrand === "전체" || item.brand === selectedBrand) &&
    (search === "" || item.name.includes(search) || item.model.includes(search))
  );

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">철물 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">경첩, 레일, 철물 마스터 데이터</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + 철물 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="검색 (이름, 모델번호)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedCat === c
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-2 flex-wrap">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedBrand === b
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">카테고리</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">브랜드</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">품명</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">모델번호</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">사양</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">단가</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">단위</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">사용</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{item.brand}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{item.model}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{item.spec}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {item.price.toLocaleString()}원
                </td>
                <td className="px-4 py-3 text-center text-gray-500 text-xs">{item.unit}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {item.active ? "사용" : "미사용"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">편집</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length}개 항목
        </div>
      </div>

      {/* 철물 추가 모달 */}
      {showForm && (
        <HardwareFormModal onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function HardwareFormModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-5">철물 추가</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="카테고리 *">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="브랜드 *">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {BRANDS.slice(1).map((b) => <option key={b}>{b}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="품명 *">
            <input type="text" placeholder="블럼 클립탑 경첩 110도" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="모델번호">
              <input type="text" placeholder="71M2550" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </FormField>
            <FormField label="사양">
              <input type="text" placeholder="풀오버레이·35보링" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="단가 (원) *">
              <input type="number" placeholder="5000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </FormField>
            <FormField label="단위">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="ea">ea (개)</option>
                <option value="set">set (세트)</option>
                <option value="pair">pair (쌍)</option>
                <option value="meter">meter (m)</option>
              </select>
            </FormField>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">호환성 정보 (경첩)</p>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="보링 직경 (mm)">
                <input type="number" placeholder="35" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </FormField>
              <FormField label="개방각도 (°)">
                <input type="number" placeholder="110" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </FormField>
              <FormField label="오버레이">
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>풀오버레이</option>
                  <option>하프오버레이</option>
                  <option>인셋</option>
                </select>
              </FormField>
            </div>
            <div className="flex gap-4 mt-3">
              {["소프트클로징", "푸쉬투오픈"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="accent-blue-600" />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <FormField label="SPEC 문서 (PDF)">
            <input type="file" accept=".pdf" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </FormField>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
