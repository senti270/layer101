"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", client_name: "", client_phone: "",
    client_email: "", site_address: "",
    survey_date: "", install_date: "", notes: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-gray-900">새 프로젝트</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* 현장 정보 */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">현장 정보</h2>
          <div className="space-y-3">
            <Field label="현장명 *" required>
              <input
                placeholder="예) 강남 도곡동 래미안 1401호"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="주소">
              <input
                placeholder="서울시 강남구 도곡동..."
                value={form.site_address}
                onChange={(e) => set("site_address", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 고객 정보 */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">고객 정보</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="고객명 *" required>
              <input
                placeholder="홍길동"
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
              />
            </Field>
            <Field label="연락처">
              <input
                placeholder="010-0000-0000"
                value={form.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
              />
            </Field>
            <Field label="이메일" className="col-span-2">
              <input
                placeholder="example@email.com"
                value={form.client_email}
                onChange={(e) => set("client_email", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 일정 */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">일정</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="실측일">
              <input
                type="date"
                value={form.survey_date}
                onChange={(e) => set("survey_date", e.target.value)}
              />
            </Field>
            <Field label="시공 예정일">
              <input
                type="date"
                value={form.install_date}
                onChange={(e) => set("install_date", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 메모 */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">메모</h2>
          <textarea
            rows={3}
            placeholder="특이사항, 요청사항..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={() => router.push("/studio/projects/1")}
          disabled={!form.name || !form.client_name}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          프로젝트 생성
        </button>
      </div>
    </div>
  );
}

function Field({
  label, required, className, children,
}: {
  label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {/* 자식 input에 공통 스타일 */}
      <div className="[&>input]:w-full [&>input]:border [&>input]:border-gray-300 [&>input]:rounded-lg [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm [&>input]:focus:outline-none [&>input]:focus:ring-2 [&>input]:focus:ring-blue-400">
        {children}
      </div>
    </div>
  );
}
