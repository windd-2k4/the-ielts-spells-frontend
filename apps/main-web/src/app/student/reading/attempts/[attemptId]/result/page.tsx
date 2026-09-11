import { ReadingResultPage } from "@/features/reading/ReadingResultPage";

export default async function StudentReadingResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReadingResultPage attemptId={attemptId} />;
}
