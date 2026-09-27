import { ListeningAttemptPlayer } from "@/features/listening/ListeningAttemptPlayer";

export default async function ListeningAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }> | { attemptId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <ListeningAttemptPlayer attemptId={resolvedParams.attemptId} />;
}
