import { useParams } from "react-router-dom";
import { ReadingTestBuilder } from "../components/test-builder/ReadingTestBuilder";
import { ListeningTestBuilder } from "../components/test-builder/ListeningTestBuilder";
import { WritingSpeakingBuilder } from "../components/test-builder/WritingSpeakingBuilder";

export function TestBuilderPage() {
  const { skill } = useParams<{ skill: string }>();

  switch (skill?.toLowerCase()) {
    case "listening":
      return <ListeningTestBuilder />;
    case "writing":
      return <WritingSpeakingBuilder skill="writing" />;
    case "speaking":
      return <WritingSpeakingBuilder skill="speaking" />;
    case "reading":
    default:
      return <ReadingTestBuilder />;
  }
}
