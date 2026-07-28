import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  survey:        "bg-gray-100 text-gray-600",
  designing:     "bg-blue-100 text-blue-700",
  quoted:        "bg-yellow-100 text-yellow-700",
  confirmed:     "bg-green-100 text-green-700",
  ordered:       "bg-purple-100 text-purple-700",
  in_production: "bg-orange-100 text-orange-700",
  delivered:     "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  survey:        "실측",
  designing:     "설계중",
  quoted:        "견적완료",
  confirmed:     "수주확정",
  ordered:       "발주완료",
  in_production: "제작중",
  delivered:     "납품완료",
};

const PROJECTS = [
  { id:"1", name:"강남 도곡동 래미안 1401호", client:"김민준", phone:"010-1234-5678", status:"designing",     spaces:2, install_date:"2026-06-15", updated:"2026-05-28" },
  { id:"2", name:"서초 반포자이 802호",        client:"이서연", phone:"010-2345-6789", status:"quoted",       spaces:3, install_date:"2026-06-22", updated:"2026-05-27" },
  { id:"3", name:"마포 공덕역 힐스테이트",     client:"박지호", phone:"010-3456-7890", status:"confirmed",    spaces:1, install_date:"2026-07-05", updated:"2026-05-25" },
  { id:"4", name:"송파 잠실 리센츠 203동",     client:"최예진", phone:"010-4567-8901", status:"delivered",    spaces:4, install_date:"2026-04-10", updated:"2026-05-20" },
];

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">프로젝트 목록</h1>
        <Link
          href="/studio/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + 새 프로젝트
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">현장명</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">고객</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">연락처</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">공간수</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">상태</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">시공일</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">수정일</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PROJECTS.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.client}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.phone}</td>
                <td className="px-4 py-3 text-center text-gray-600">{p.spaces}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs font-medium">
                  {p.install_date ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.updated}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/studio/projects/${p.id}`} className="text-xs text-blue-600 hover:underline">
                    열기 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
