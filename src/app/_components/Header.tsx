"use client";

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/look/") || pathname.startsWith("/s/");

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <a href="/">
        <img src="/layer101_logo.png" alt="layer101" className="h-8 w-auto" />
      </a>
      {!isPublic && (
        <nav className="flex items-center gap-4 text-sm">
          <a href="/wardrobe" className="text-gray-500 hover:text-gray-800 transition-colors">붙박이장 견적</a>
          <a href="/studio" className="text-gray-500 hover:text-gray-800 transition-colors">Studio</a>
        </nav>
      )}
    </header>
  );
}
