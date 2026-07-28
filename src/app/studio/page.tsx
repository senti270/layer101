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

// 임시 더미 데이터
const DUMMY_PROJECTS = [
  { id: "1", name: "강남 도곡동 래미안 1401호", client: "김민준", status: "designing", updated: "2026-05-28" },
  { id: "2", name: "서초 반포자이 802호",       client: "이서연", status: "quoted",    updated: "2026-05-27" },
  { id: "3", name: "마포 공덕역 힐스테이트",    client: "박지호", status: "confirmed", updated: "2026-05-25" },
  { id: "4", name: "송파 잠실 리센츠 203동",    client: "최예진", status: "delivered", updated: "2026-05-20" },
];

const STATS = [
  { label: "진행 중인 현장", value: 3, color: "text-blue-600" },
  { label: "이번달 수주",    value: 2, color: "text-green-600" },
  { label: "제작 중",        value: 1, color: "text-orange-600" },
  { label: "이번달 납품",    value: 1, color: "text-emerald-600" },
];

export default function StudioDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">2026년 5월 29일</p>
        </div>
        <Link
          href="/studio/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 새 프로젝트
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 최근 프로젝트 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">최근 프로젝트</h2>
          <Link href="/studio/projects" className="text-xs text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">현장명</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">고객</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">상태</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">수정일</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {DUMMY_PROJECTS.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.client}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.updated}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/studio/projects/${p.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    열기 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 빠른 접근 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/studio/admin/modules",   icon: "🗂", title: "모듈 관리",   desc: "가구 모듈 등록 및 편집" },
          { href: "/studio/admin/hardware",  icon: "🔩", title: "철물 관리",   desc: "철물 마스터 데이터 관리" },
          { href: "/studio/admin/materials", icon: "🪵", title: "자재 관리",   desc: "판재 및 자재 단가 관리" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{card.icon}</span>
            <p className="mt-2 font-medium text-gray-800 text-sm">{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
