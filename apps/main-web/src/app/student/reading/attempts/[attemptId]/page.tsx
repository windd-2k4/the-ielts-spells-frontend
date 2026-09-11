import { ReadingAttemptPlayer } from "@/features/reading/ReadingAttemptPlayer";

export default async function ReadingAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReadingAttemptPlayer attemptId={attemptId} />;
}
