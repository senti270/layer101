"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  location: string;
  year: number;
  categories: string[];
  thumbnail: string;
  published: boolean;
}

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "space-design", label: "SPACE DESIGN" },
  { id: "furniture", label: "FURNITURE" },
  { id: "interior", label: "INTERIOR" },
  { id: "popup", label: "POP-UP" },
  { id: "solution", label: "SOLUTION" },
];

const CAT_LABELS: Record<string, string> = {
  "space-design": "SPACE DESIGN",
  furniture: "FURNITURE",
  interior: "INTERIOR",
  popup: "POP-UP",
  solution: "SOLUTION",
};

export default function Home() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "portfolioProjects"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioProject));
      setProjects(all.filter(p => p.published));
      setLoading(false);
    });
  }, []);

  const filtered = active === "all"
    ? projects
    : projects.filter(p => p.categories?.includes(active));

  return (
    <>
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 flex gap-8 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`py-4 text-xs tracking-widest font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                active === cat.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-32 text-gray-300 text-sm tracking-widest">LOADING</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-200 text-sm tracking-widest">NO PROJECTS</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filtered.map(project => (
              <Link key={project.id} href={`/project/${project.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-gray-50 mb-5">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <h2 className="text-sm font-medium text-gray-900 tracking-widest uppercase mb-1.5">
                  {project.title}
                </h2>
                <p className="text-xs text-gray-400 tracking-wide">
                  {[project.location, project.year].filter(Boolean).join(" · ")}
                </p>
                {project.categories?.length > 0 && (
                  <p className="text-xs text-gray-300 mt-1 tracking-widest uppercase">
                    {project.categories.map(c => CAT_LABELS[c] || c).join(" · ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
