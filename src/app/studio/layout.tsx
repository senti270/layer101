"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    section: "현장 관리",
    items: [
      { href: "/studio",          label: "대시보드",     icon: "⊞" },
      { href: "/studio/projects", label: "프로젝트 목록", icon: "📋" },
    ],
  },
  {
    section: "관리자",
    items: [
      { href: "/studio/admin/modules",  label: "모듈 관리",   icon: "🗂" },
      { href: "/studio/admin/hardware", label: "철물 관리",   icon: "🔩" },
      { href: "/studio/admin/materials",label: "자재 관리",   icon: "🪵" },
      { href: "/studio/admin/specs",    label: "사양 관리",   icon: "📐" },
    ],
  },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* 사이드바 */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 py-4">
        <div className="px-4 mb-4">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Studio
          </span>
        </div>

        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="px-4 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = path === item.href ||
                (item.href !== "/studio" && path.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
