export default function SLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <a href="/" className="text-xl font-bold tracking-tight text-gray-900">
          layer<span className="text-blue-600">101</span>
        </a>
      </header>
      <main>{children}</main>
    </>
  );
}
