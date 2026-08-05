import SurveyDetailPage from "@/app/system/surveys/[id]/_client";

export default async function Page({ params }: { params: Promise<{ id: string; surveyId: string }> }) {
  const { surveyId } = await params;
  return <SurveyDetailPage surveyId={surveyId} />;
}
