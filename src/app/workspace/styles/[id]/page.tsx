import StyleGroupDetailPage from "@/app/system/styles/[id]/_client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StyleGroupDetailPage groupId={id} />;
}
