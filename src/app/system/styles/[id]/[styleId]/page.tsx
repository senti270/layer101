import StyleEditorPage from "./_client";

export default async function Page({ params }: { params: Promise<{ id: string; styleId: string }> }) {
  const { id, styleId } = await params;
  return <StyleEditorPage groupId={id} styleId={styleId} />;
}
