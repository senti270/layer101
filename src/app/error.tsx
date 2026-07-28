"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ color: "red" }}>🔴 페이지 에러</h2>
      <pre style={{ background: "#fee2e2", padding: 16, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 12 }}>
        {error.message || String(error)}
        {"\n\n"}
        {error.stack}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: 16, padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
      >
        다시 시도
      </button>
    </div>
  );
}
