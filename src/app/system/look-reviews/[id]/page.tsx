import LookReviewDetailPage from "./_client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LookReviewDetailPage reviewId={id} />;
}
