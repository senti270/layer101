"use client";

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/workspace")) return null;

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4">
      <a href="/">
        <img src="/layer101_logo.png" alt="layer101" className="h-7 w-auto" />
      </a>
    </header>
  );
}
