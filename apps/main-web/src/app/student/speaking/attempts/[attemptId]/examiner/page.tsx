import { SpeakingExaminerPlayer } from "@/features/speaking/SpeakingExaminerPlayer";

export default async function SpeakingExaminerPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolved = await params;
  return <SpeakingExaminerPlayer attemptId={resolved.attemptId} />;
}
