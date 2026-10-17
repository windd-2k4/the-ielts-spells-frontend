import { SpeakingResultPage } from "@/features/speaking/SpeakingResultPage";

export default async function SpeakingAttemptResultRoute({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolved = await params;
  return <SpeakingResultPage attemptId={resolved.attemptId} />;
}
