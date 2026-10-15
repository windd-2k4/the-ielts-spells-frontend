import { SpeakingAttemptPlayer } from "@/features/speaking/SpeakingAttemptPlayer";

export default async function SpeakingAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolved = await params;
  return <SpeakingAttemptPlayer attemptId={resolved.attemptId} />;
}
