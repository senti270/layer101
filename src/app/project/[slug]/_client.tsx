"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  location: string;
  year: number;
  type: string;
  area: string;
  client: string;
  categories: string[];
  description: string;
  thumbnail: string;
  coverImage: string;
  images: string[];
  published: boolean;
}

const CAT_LABELS: Record<string, string> = {
  "space-design": "SPACE DESIGN",
  furniture: "FURNITURE",
  interior: "INTERIOR",
  popup: "POP-UP",
  solution: "SOLUTION",
};

export default function ProjectDetailPage({ slug }: { slug: string }) {
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getDocs(query(collection(db, "portfolioProjects"), where("slug", "==", slug), limit(1))).then(snap => {
      if (!snap.empty) setProject({ id: snap.docs[0].id, ...snap.docs[0].data() } as PortfolioProject);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-200 text-xs tracking-widest">LOADING</div>
  );

  if (!project) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">프로젝트를 찾을 수 없습니다.</div>
  );

  const catStr = project.categories?.map(c => CAT_LABELS[c] || c).join(" · ");

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-16">
      <Link href="/" className="inline-block text-xs text-gray-400 tracking-widest hover:text-gray-600 mb-12 uppercase">
        ← Back
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900 tracking-widest uppercase mb-3">
          {project.title}
        </h1>
        <p className="text-xs text-gray-400 tracking-wide">
          {[project.location, project.year].filter(Boolean).join(" · ")}
        </p>
        {catStr && (
          <p className="text-xs text-gray-300 tracking-widest uppercase mt-1">{catStr}</p>
        )}
      </div>

      {/* Cover Image */}
      {project.coverImage && (
        <div className="aspect-video overflow-hidden bg-gray-50 mb-16">
          <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Project Info */}
      {(project.type || project.area || project.client) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-b border-gray-100 py-8 mb-16">
          {project.type && (
            <div>
              <p className="text-xs text-gray-300 tracking-widest uppercase mb-1">Type</p>
              <p className="text-sm text-gray-700">{project.type}</p>
            </div>
          )}
          {project.area && (
            <div>
              <p className="text-xs text-gray-300 tracking-widest uppercase mb-1">Area</p>
              <p className="text-sm text-gray-700">{project.area}</p>
            </div>
          )}
          {project.client && (
            <div>
              <p className="text-xs text-gray-300 tracking-widest uppercase mb-1">Client</p>
              <p className="text-sm text-gray-700">{project.client}</p>
            </div>
          )}
          {project.year && (
            <div>
              <p className="text-xs text-gray-300 tracking-widest uppercase mb-1">Year</p>
              <p className="text-sm text-gray-700">{project.year}</p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="max-w-2xl mb-16">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>
      )}

      {/* Gallery */}
      {project.images?.length > 0 && (
        <div className="space-y-4 mb-20">
          {project.images.map((img, i) => (
            <div key={i} className="w-full bg-gray-50">
              <img src={img} alt={`${project.title} ${i + 1}`} className="w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Back */}
      <div className="border-t border-gray-100 pt-12 text-center">
        <Link href="/" className="text-xs text-gray-400 tracking-widest uppercase hover:text-gray-700">
          All Projects
        </Link>
      </div>
    </div>
  );
}
