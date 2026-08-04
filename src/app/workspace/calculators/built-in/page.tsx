import WardrobeCalculator from "../../../wardrobe/WardrobeCalculator";

export default function BuiltInCalculatorPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Built-in Furniture Calculator</h1>
        <p className="text-sm text-gray-400 mt-1">아래 항목을 입력하면 예상 제작비를 자동으로 계산합니다. (VAT 별도)</p>
      </div>
      <WardrobeCalculator />
    </div>
  );
}
