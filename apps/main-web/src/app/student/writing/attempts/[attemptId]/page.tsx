import { WritingAttemptPlayer } from "@/features/writing/WritingAttemptPlayer";

export default async function WritingAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolved = await params;
  return <WritingAttemptPlayer attemptId={resolved.attemptId} />;
}
