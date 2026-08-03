"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import Link from "next/link";

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  location: string;
  year: string;
  type: string;
  area: string;
  client: string;
  categories: string[];
  description: string;
  thumbnail: string;
  coverImage: string;
  images: string[];
  featured: boolean;
  published: boolean;
  createdAt: { toDate: () => Date } | null;
}

const ALL_CATEGORIES = [
  { id: "space-design", label: "SPACE DESIGN" },
  { id: "furniture", label: "FURNITURE" },
  { id: "interior", label: "INTERIOR" },
  { id: "popup", label: "POP-UP" },
  { id: "solution", label: "SOLUTION" },
];

const EMPTY_FORM = {
  slug: "", title: "", location: "", year: new Date().getFullYear().toString(),
  type: "", area: "", client: "", categories: [] as string[],
  description: "", thumbnail: "", coverImage: "", images: [] as string[],
  featured: false, published: false,
};

export default function WorkspaceProjectsPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "portfolioProjects"), orderBy("createdAt", "desc")),
      snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioProject)))
    );
  }, []);

  function openNew() {
    setEditing("new");
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(p: PortfolioProject) {
    setEditing(p.id);
    setForm({
      slug: p.slug || "", title: p.title || "", location: p.location || "",
      year: String(p.year || ""), type: p.type || "", area: p.area || "",
      client: p.client || "", categories: p.categories || [],
      description: p.description || "", thumbnail: p.thumbnail || "",
      coverImage: p.coverImage || "", images: p.images || [],
      featured: p.featured || false, published: p.published || false,
    });
  }

  function cancel() { setEditing(null); }

  async function uploadImage(file: File, path: string): Promise<string> {
    const { ref: sRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const ref = sRef(storage, path);
    await uploadBytes(ref, file);
    return getDownloadURL(ref);
  }

  async function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, `portfolio/thumb_${Date.now()}`);
      setForm(f => ({ ...f, thumbnail: url }));
    } finally { setUploading(false); if (thumbRef.current) thumbRef.current.value = ""; }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, `portfolio/cover_${Date.now()}`);
      setForm(f => ({ ...f, coverImage: url }));
    } finally { setUploading(false); if (coverRef.current) coverRef.current.value = ""; }
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file, `portfolio/gallery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
        urls.push(url);
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } finally { setUploading(false); if (galleryRef.current) galleryRef.current.value = ""; }
  }

  function toggleCategory(id: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }));
  }

  async function save() {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        year: Number(form.year) || 0,
        updatedAt: serverTimestamp(),
      };
      if (editing === "new") {
        await addDoc(collection(db, "portfolioProjects"), { ...data, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, "portfolioProjects", editing!), data);
      }
      setEditing(null);
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "portfolioProjects", id));
  }

  async function togglePublish(p: PortfolioProject) {
    await updateDoc(doc(db, "portfolioProjects", p.id), { published: !p.published });
  }

  async function toggleFeatured(p: PortfolioProject) {
    await updateDoc(doc(db, "portfolioProjects", p.id), { featured: !p.featured });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Portfolio Projects</h1>
        <button onClick={openNew}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + New Project
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">
            {editing === "new" ? "New Project" : "Edit Project"}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { key: "title", label: "Title *" },
              { key: "slug", label: "Slug * (예: cafe-drawing-songpa)" },
              { key: "location", label: "Location" },
              { key: "year", label: "Year" },
              { key: "type", label: "Type" },
              { key: "area", label: "Area" },
              { key: "client", label: "Client" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.categories.includes(cat.id)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none" />
          </div>

          {/* Images */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Thumbnail</label>
              {form.thumbnail && <img src={form.thumbnail} className="w-full aspect-video object-cover rounded mb-1" />}
              <button onClick={() => thumbRef.current?.click()}
                className="w-full text-xs border border-dashed border-gray-300 rounded py-2 text-gray-400 hover:border-gray-400">
                {uploading ? "업로드 중..." : "이미지 선택"}
              </button>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cover Image</label>
              {form.coverImage && <img src={form.coverImage} className="w-full aspect-video object-cover rounded mb-1" />}
              <button onClick={() => coverRef.current?.click()}
                className="w-full text-xs border border-dashed border-gray-300 rounded py-2 text-gray-400 hover:border-gray-400">
                {uploading ? "업로드 중..." : "이미지 선택"}
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Gallery ({form.images.length})</label>
              <div className="grid grid-cols-3 gap-1 mb-1">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} className="w-full aspect-square object-cover rounded" />
                    <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                      className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 rounded flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => galleryRef.current?.click()}
                className="w-full text-xs border border-dashed border-gray-300 rounded py-2 text-gray-400 hover:border-gray-400">
                + 갤러리 추가
              </button>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallery} />
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-4 mb-5">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              Featured
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.title.trim() || !form.slug.trim()}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
              {saving ? "저장 중..." : "Save"}
            </button>
            <button onClick={cancel} className="text-sm text-gray-500 px-4 py-2 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {projects.length === 0 ? (
        <div className="text-center py-24 text-gray-400 text-sm">
          프로젝트가 없습니다. New Project를 눌러 추가하세요.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Slug</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Year</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Categories</th>
                <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Published</th>
                <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Featured</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {p.thumbnail && <img src={p.thumbnail} className="w-8 h-8 object-cover rounded" />}
                      {p.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{p.year}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories?.map(c => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {ALL_CATEGORIES.find(a => a.id === c)?.label || c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePublish(p)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>
                      {p.published ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleFeatured(p)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        p.featured ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                      }`}>
                      {p.featured ? "★" : "☆"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/project/${p.slug}`} target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-600">보기</Link>
                      <button onClick={() => openEdit(p)} className="text-xs text-blue-500 hover:text-blue-700">편집</button>
                      <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
