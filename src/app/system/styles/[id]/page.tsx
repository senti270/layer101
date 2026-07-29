"use client";

import { useState, useEffect, useRef, use } from "react";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StyleGroup {
  name: string;
}

interface Style {
  id: string;
  name: string;
  groupId: string;
  order: number;
  photos: { id: string; url: string }[];
}

export default function StyleGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<StyleGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [styles, setStyles] = useState<Style[]>([]);
  const [creating, setCreating] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, "styleGroups", groupId), snap => {
      if (snap.exists()) {
        const data = snap.data() as StyleGroup;
        setGroup(data);
        if (!initialized.current) {
          setGroupName(data.name || "");
          initialized.current = true;
        }
      }
    });

    const q = query(collection(db, "styles"), where("groupId", "==", groupId));
    const unsub2 = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Style));
      list.sort((a, b) => a.order - b.order);
      setStyles(list);
    });

    return () => { unsub1(); unsub2(); };
  }, [groupId]);

  async function saveGroupName() {
    if (!group || groupName === group.name || !groupName.trim()) return;
    setSavingName(true);
    try {
      await updateDoc(doc(db, "styleGroups", groupId), { name: groupName.trim() });
    } finally {
      setSavingName(false);
    }
  }

  async function addStyle() {
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, "styles"), {
        name: "새 스타일",
        groupId,
        description: "",
        pros: [],
        cons: [],
        order: styles.length,
        photos: [],
        createdAt: serverTimestamp(),
      });
      router.push(`/system/styles/${groupId}/${ref.id}`);
    } catch (e) {
      alert("스타일 생성 실패: " + (e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function moveStyle(style: Style, direction: -1 | 1) {
    const sorted = [...styles].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === style.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await Promise.all([
      updateDoc(doc(db, "styles", sorted[idx].id), { order: sorted[swapIdx].order }),
      updateDoc(doc(db, "styles", sorted[swapIdx].id), { order: sorted[idx].order }),
    ]);
  }

  if (!group) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/system/styles" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        스타일 그룹 목록
      </Link>

      {/* 그룹명 편집 */}
      <div className="flex items-center gap-3 mb-8">
        <input
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          onBlur={saveGroupName}
          className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none flex-1 pb-1 transition-colors"
        />
        {savingName && <span className="text-xs text-gray-400">저장 중...</span>}
      </div>

      {/* 스타일 추가 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">스타일 {styles.length}개</span>
        <button
          onClick={addStyle}
          disabled={creating}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "생성 중..." : "+ 스타일 추가"}
        </button>
      </div>

      {/* 스타일 목록 */}
      {styles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-4">🖼️</div>
          <div className="text-sm">스타일이 없습니다. 추가해보세요.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {styles.map((style, i) => (
            <div key={style.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex items-stretch h-20">
              <div className="w-20 flex-shrink-0 bg-gray-100">
                {style.photos?.[0] ? (
                  <img src={style.photos[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖼</div>
                )}
              </div>
              <div className="flex-1 px-4 flex items-center min-w-0">
                <div className="font-medium text-gray-900 truncate">{style.name}</div>
              </div>
              <div className="flex items-center gap-1 px-3 flex-shrink-0">
                <button onClick={() => moveStyle(style, -1)} disabled={i === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs">▲</button>
                <button onClick={() => moveStyle(style, 1)} disabled={i === styles.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs">▼</button>
                <Link
                  href={`/system/styles/${groupId}/${style.id}`}
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
