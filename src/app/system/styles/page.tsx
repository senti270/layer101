"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface StyleGroup {
  id: string;
  name: string;
  order: number;
  styleCount?: number;
}

export default function StyleGroupsPage() {
  const [groups, setGroups] = useState<StyleGroup[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "styleGroups"), orderBy("order", "asc"));
    return onSnapshot(q, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as StyleGroup)));
    });
  }, []);

  async function createGroup() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "styleGroups"), {
        name: newName.trim(),
        order: groups.length,
        createdAt: serverTimestamp(),
      });
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function moveGroup(group: StyleGroup, direction: -1 | 1) {
    const sorted = [...groups].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(g => g.id === group.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await Promise.all([
      updateDoc(doc(db, "styleGroups", sorted[idx].id), { order: sorted[swapIdx].order }),
      updateDoc(doc(db, "styleGroups", sorted[swapIdx].id), { order: sorted[idx].order }),
    ]);
  }

  const sorted = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-8">스타일 관리</h1>

      {/* 그룹 추가 */}
      <div className="flex gap-3 mb-8">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createGroup()}
          placeholder="새 스타일 그룹 이름 (예: 주거용 스타일)"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={createGroup}
          disabled={creating || !newName.trim()}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "추가 중..." : "+ 그룹 추가"}
        </button>
      </div>

      {/* 그룹 목록 */}
      {sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-4xl mb-4">🎨</div>
          <div className="text-sm">스타일 그룹이 없습니다.</div>
          <div className="text-xs mt-1 text-gray-300">예: 주거용 스타일, 카페용 스타일, 음식점용 스타일</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((group, i) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-xl flex items-center overflow-hidden">
              <Link
                href={`/system/styles/${group.id}`}
                className="flex-1 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{group.name}</div>
              </Link>
              <div className="flex items-center gap-1 px-3 border-l border-gray-100">
                <button
                  onClick={() => moveGroup(group, -1)}
                  disabled={i === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                >▲</button>
                <button
                  onClick={() => moveGroup(group, 1)}
                  disabled={i === sorted.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                >▼</button>
                <Link
                  href={`/system/styles/${group.id}`}
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
