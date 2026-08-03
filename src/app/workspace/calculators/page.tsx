import Link from "next/link";

const CALCULATORS = [
  {
    href: "/workspace/calculators/built-in",
    title: "Built-in Furniture Calculator",
    description: "붙박이장 견적 및 사이즈 계산",
    icon: "🚪",
  },
  {
    href: "/workspace/calculators/material",
    title: "Material Calculator",
    description: "자재 수량 계산",
    icon: "📐",
    disabled: true,
  },
];

export default function CalculatorsPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">Calculators</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {CALCULATORS.map(calc =>
          calc.disabled ? (
            <div key={calc.title}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 opacity-40">
              <span className="text-2xl">{calc.icon}</span>
              <div>
                <div className="font-medium text-gray-700 text-sm">{calc.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{calc.description}</div>
                <div className="text-xs text-gray-300 mt-1">준비 중</div>
              </div>
            </div>
          ) : (
            <Link key={calc.title} href={calc.href}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors">
              <span className="text-2xl">{calc.icon}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">{calc.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{calc.description}</div>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
