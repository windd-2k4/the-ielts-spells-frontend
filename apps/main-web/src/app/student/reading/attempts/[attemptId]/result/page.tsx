import { ReadingResultPage } from "@/features/reading/ReadingResultPage";

export default async function StudentReadingResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }> | { attemptId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <ReadingResultPage attemptId={resolvedParams.attemptId} />;
}
