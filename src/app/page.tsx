import Link from "next/link";

const tools = [
  {
    href: "/wardrobe",
    title: "붙박이장 견적 계산기",
    description: "사이즈·소재·도어 타입을 입력하면 예상 제작비를 자동 계산합니다.",
    icon: "🚪",
    badge: "NEW",
    disabled: false,
  },
  {
    href: "#",
    title: "인테리어 면적 계산기",
    description: "도배, 바닥재, 타일 시공 면적과 예상 자재비를 계산합니다.",
    icon: "📐",
    badge: "준비중",
    disabled: true,
  },
];

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">인테리어 계산기</h1>
        <p className="text-gray-500">맞춤가구·인테리어 시공 견적을 빠르게 계산하세요.</p>
      </div>

      <div className="grid gap-4">
        {tools.map((tool) =>
          tool.disabled ? (
            <div
              key={tool.title}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 opacity-50 cursor-not-allowed"
            >
              <span className="text-3xl">{tool.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-700">{tool.title}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>
            </div>
          ) : (
            <Link
              key={tool.title}
              href={tool.href}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <span className="text-3xl">{tool.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{tool.title}</span>
                  {tool.badge && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>
              <span className="text-gray-400 mt-1">→</span>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
