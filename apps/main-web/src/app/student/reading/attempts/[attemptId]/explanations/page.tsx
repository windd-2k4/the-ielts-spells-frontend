import { ReadingExplanationPage } from "@/features/reading/ReadingExplanationPage";

export default async function StudentReadingExplanationsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReadingExplanationPage attemptId={attemptId} />;
}
