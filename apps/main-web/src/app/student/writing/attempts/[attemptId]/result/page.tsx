import { WritingResultPage } from "@/features/writing/WritingResultPage";

export default async function WritingAttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolved = await params;
  return <WritingResultPage attemptId={resolved.attemptId} />;
}
