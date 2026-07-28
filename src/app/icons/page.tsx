import TemplateIcon from "@/app/wardrobe/TemplateIcon";
import { TEMPLATES } from "@/app/wardrobe/constants";

export default function IconsPreview() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold mb-6">장 유형 아이콘 미리보기</h1>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="flex flex-col items-center gap-2">
            <div className="border-2 border-gray-200 rounded-xl p-2">
              <TemplateIcon id={t.id} />
            </div>
            <p className="text-xs text-center text-gray-600 font-medium whitespace-pre-line leading-tight">
              {t.name}
            </p>
            <p className="text-xs text-center text-gray-400">
              {[
                t.hangerRods > 0 && `행거×${t.hangerRods}`,
                t.shelves > 0 && `선반×${t.shelves}`,
                t.drawers > 0 && `서랍×${t.drawers}`,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
