import SurveyDetailPage from "./_client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurveyDetailPage surveyId={id} />;
}
