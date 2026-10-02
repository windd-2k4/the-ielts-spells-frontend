import { ReadingAttemptPlayer } from "@/features/reading/ReadingAttemptPlayer";

export default async function ReadingAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }> | { attemptId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <ReadingAttemptPlayer attemptId={resolvedParams.attemptId} />;
}
