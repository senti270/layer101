import WardrobeCalculator from "./WardrobeCalculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "붙박이장 견적 계산기 — layer101",
  description: "사이즈·소재·도어 타입을 선택하면 붙박이장 예상 제작비를 바로 계산합니다.",
};

export default function WardrobePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
          ← 목록으로
        </a>
        <h1 className="text-2xl font-bold text-gray-900">붙박이장 견적 계산기</h1>
        <p className="text-sm text-gray-500 mt-1">
          아래 항목을 입력하면 예상 제작비를 자동으로 계산합니다. (VAT 별도)
        </p>
      </div>
      <WardrobeCalculator />
    </div>
  );
}
