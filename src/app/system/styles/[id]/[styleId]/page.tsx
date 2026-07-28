"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Photo { id: string; url: string; storagePath: string; }
interface Style {
  name: string; description: string;
  pros: string[]; cons: string[];
  photos: Photo[];
}

export default function StyleEditorPage() {
  const { id: groupId, styleId } = useParams<{ id: string; styleId: string }>();
  const [style, setStyle] = useState<Style | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    return onSnapshot(doc(db, "styles", styleId), snap => {
      if (snap.exists()) {
        const data = snap.data() as Style;
        setStyle(data);
        if (!initialized.current) {
          setName(data.name || "");
          setDescription(data.description || "");
          setPros(data.pros || []);
          setCons(data.cons || []);
          initialized.current = true;
        }
      }
    });
  }, [styleId]);

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "styles", styleId), { name, description, pros, cons });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !style) return;
    setUploading(true);
    try {
      const newPhotos: Photo[] = [];
      for (const file of files) {
        const photoId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const path = `styles/${styleId}/${photoId}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        newPhotos.push({ id: photoId, url, storagePath: path });
      }
      await updateDoc(doc(db, "styles", styleId), {
        photos: [...(style.photos || []), ...newPhotos],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!style) return;
    await deleteObject(storageRef(storage, photo.storagePath)).catch(() => {});
    await updateDoc(doc(db, "styles", styleId), {
      photos: style.photos.filter(p => p.id !== photo.id),
    });
  }

  function addPro() { if (!newPro.trim()) return; setPros(p => [...p, newPro.trim()]); setNewPro(""); }
  function addCon() { if (!newCon.trim()) return; setCons(c => [...c, newCon.trim()]); setNewCon(""); }

  if (!style) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">로딩 중...</div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href={`/system/styles/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        스타일 목록
      </Link>

      <div className="space-y-8">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">스타일 이름</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="예: 모던 미니멀" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">특징 설명</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none transition-colors"
            placeholder="이 스타일의 특징을 설명해주세요..." />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">장점</label>
          <div className="space-y-2 mb-3">
            {pros.map((pro, i) => (
              <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <span className="text-green-500 text-sm">✓</span>
                <span className="flex-1 text-sm text-gray-700">{pro}</span>
                <button onClick={() => setPros(p => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newPro} onChange={e => setNewPro(e.target.value)} onKeyDown={e => e.key === "Enter" && addPro()}
              placeholder="장점 입력 후 Enter..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            <button onClick={addPro} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">추가</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">단점</label>
          <div className="space-y-2 mb-3">
            {cons.map((con, i) => (
              <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <span className="text-amber-500 text-sm">!</span>
                <span className="flex-1 text-sm text-gray-700">{con}</span>
                <button onClick={() => setCons(c => c.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCon} onChange={e => setNewCon(e.target.value)} onKeyDown={e => e.key === "Enter" && addCon()}
              placeholder="단점 입력 후 Enter..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
            <button onClick={addCon} className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">추가</button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">사진 <span className="font-normal text-gray-400">({style.photos?.length ?? 0}장)</span></label>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
              {uploading ? "업로드 중..." : "+ 사진 추가"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </div>
          {(!style.photos || style.photos.length === 0) ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-14 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
              <div className="text-3xl mb-2">🖼️</div>
              <div className="text-gray-400 text-sm">클릭하여 사진 업로드</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {style.photos.map((photo, i) => (
                <div key={photo.id} className="relative group aspect-square">
                  <img src={photo.url} alt={`${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => deletePhoto(photo)}
                    className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                </div>
              ))}
              <div onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50">
                <span className="text-gray-300 text-3xl">+</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving}
          className={`w-full py-3 font-semibold rounded-xl transition-colors ${
            saved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          }`}>
          {saved ? "저장됨!" : saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
