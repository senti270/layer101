"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/workspace", icon: "⊞" },
  {
    section: "PORTFOLIO",
    items: [
      { label: "Projects", href: "/workspace/projects", icon: "🖼️" },
    ],
  },
  {
    section: "CLIENTS",
    items: [
      { label: "Client Projects", href: "/workspace/clients", icon: "👥" },
      { label: "Styles", href: "/workspace/styles", icon: "🎨" },
    ],
  },
  {
    section: "CALCULATORS",
    items: [
      { label: "Built-in Furniture", href: "/workspace/calculators/built-in", icon: "🚪" },
      { label: "Material", href: "/workspace/calculators/material", icon: "📐" },
    ],
  },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  if (!user) return <LoginScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end text-xs text-gray-400">
          <span className="mr-4">{user.email}</span>
          <button onClick={() => signOut(auth)} className="hover:text-gray-700 transition-colors">로그아웃</button>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ user: _ }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="text-xs font-bold tracking-widest text-gray-900 uppercase">Layer101</div>
        <div className="text-xs text-gray-400 mt-0.5 tracking-widest">WORKSPACE</div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map((item, i) => {
          if ("href" in item) {
            const active = pathname === item.href;
            return (
              <Link key={i} href={item.href}
                className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${
                  active ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}>
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          }
          return (
            <div key={i} className="mt-4">
              <p className="px-5 mb-1 text-xs font-semibold text-gray-300 tracking-widest uppercase">{item.section}</p>
              {item.items.map(sub => {
                const active = pathname === sub.href || pathname.startsWith(sub.href + "/");
                return (
                  <Link key={sub.href} href={sub.href}
                    className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${
                      active ? "bg-gray-50 text-gray-900 font-medium border-r-2 border-gray-900" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}>
                    <span className="text-base leading-none">{sub.icon}</span>
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← 공개 사이트
        </Link>
      </div>
    </aside>
  );
}

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("로그인에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 w-full max-w-sm text-center shadow-sm">
        <div className="text-xs font-bold tracking-widest text-gray-900 uppercase mb-1">Layer101</div>
        <div className="text-xs text-gray-400 tracking-widest mb-8">WORKSPACE</div>
        {error && <div className="text-xs text-red-500 mb-4">{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>
      </div>
    </div>
  );
}
