"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Style {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  order: number;
  photos: { id: string; url: string; storagePath: string }[];
}

export default function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "styles"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setStyles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Style)));
    });
  }, []);

  async function addStyle() {
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, "styles"), {
        name: "새 스타일",
        description: "",
        pros: [],
        cons: [],
        order: styles.length,
        photos: [],
        createdAt: serverTimestamp(),
      });
      router.push(`/system/styles/${ref.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  async function moveStyle(style: Style, direction: -1 | 1) {
    const sorted = [...styles].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === style.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      updateDoc(doc(db, "styles", a.id), { order: b.order }),
      updateDoc(doc(db, "styles", b.id), { order: a.order }),
    ]);
  }

  const sorted = [...styles].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">스타일 관리</h1>
        <button
          onClick={addStyle}
          disabled={creating}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {creating ? "생성 중..." : "+ 스타일 추가"}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-4xl mb-4">🎨</div>
          <div className="text-sm">스타일이 없습니다. 추가해보세요.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((style, i) => (
            <div key={style.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex items-stretch h-20">
              <div className="w-20 flex-shrink-0 bg-gray-100">
                {style.photos[0] ? (
                  <img src={style.photos[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖼</div>
                )}
              </div>
              <div className="flex-1 px-4 flex items-center min-w-0">
                <div>
                  <div className="font-medium text-gray-900">{style.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    사진 {style.photos?.length ?? 0}장
                    {style.pros?.length > 0 && ` · 장점 ${style.pros.length}개`}
                    {style.cons?.length > 0 && ` · 단점 ${style.cons.length}개`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 flex-shrink-0">
                <button
                  onClick={() => moveStyle(style, -1)}
                  disabled={i === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                >▲</button>
                <button
                  onClick={() => moveStyle(style, 1)}
                  disabled={i === sorted.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                >▼</button>
                <Link
                  href={`/system/styles/${style.id}`}
                  className="ml-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  편집
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
