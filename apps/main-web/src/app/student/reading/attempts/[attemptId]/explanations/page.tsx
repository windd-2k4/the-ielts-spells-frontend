import { ReadingExplanationPage } from "@/features/reading/ReadingExplanationPage";

export default async function StudentReadingExplanationsPage({
  params,
}: {
  params: Promise<{ attemptId: string }> | { attemptId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <ReadingExplanationPage attemptId={resolvedParams.attemptId} />;
}
