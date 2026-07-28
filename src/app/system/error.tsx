"use client";

import { useEffect } from "react";

export default function SystemError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("System page error:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <div className="font-semibold text-gray-900 mb-3">페이지 로드 실패</div>
      <div className="text-sm text-red-600 font-mono bg-red-50 border border-red-200 p-4 rounded-xl text-left break-all mb-6">
        {error.message || String(error)}
        {error.digest && <div className="mt-2 text-xs text-red-400">digest: {error.digest}</div>}
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );
}
