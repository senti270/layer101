import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "layer101 - 레이어101",
  description: "맞춤가구·인테리어 견적 계산기 모음",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans antialiased">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight text-gray-900">
            layer<span className="text-blue-600">101</span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/wardrobe" className="text-gray-500 hover:text-gray-800 transition-colors">붙박이장 견적</a>
            <a href="/studio" className="text-gray-500 hover:text-gray-800 transition-colors">Studio</a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          © 2025 layer101
        </footer>
      </body>
    </html>
  );
}
