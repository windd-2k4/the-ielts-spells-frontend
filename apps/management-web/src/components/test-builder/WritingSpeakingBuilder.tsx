import SpeakingTestBuilder from "./SpeakingTestBuilder";
import WritingTestBuilder from "./WritingTestBuilder";

type Props = {
  skill: "writing" | "speaking";
};

export function WritingSpeakingBuilder({ skill }: Props) {
  return skill === "writing" ? <WritingTestBuilder /> : <SpeakingTestBuilder />;
}
