import { CheckCircle, ListNumbers, WarningCircle } from "@phosphor-icons/react";
import { readingQuestionTypeLabels } from "../test-builder/readingQuestionGroupConfig";
import type { QuestionTypeFormat, TestSkill } from "../../library-types";

type Props = {
  skill: TestSkill;
  builderContent: Record<string, unknown>;
  questionCount: number;
};

type PreviewGroup = {
  id: string;
  title: string;
  type: string;
  start: number;
  end: number;
  prompts: Array<{ id: string; number: number; prompt: string }>;
};

type PreviewSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  groups: PreviewGroup[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function plainText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function readGroups(value: unknown, sectionId: string): PreviewGroup[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((group, groupIndex) => {
    const prompts = Array.isArray(group.questions)
      ? group.questions.filter(isRecord).map((question, questionIndex) => ({
        id: typeof question.id === "string" ? question.id : `${sectionId}-question-${questionIndex + 1}`,
        number: typeof question.number === "number" ? question.number : questionIndex + 1,
        prompt: plainText(question.prompt) || plainText(question.promptText) || "Chưa nhận diện được nội dung câu hỏi",
      }))
      : [];
    const start = typeof group.startQuestionNo === "number" ? group.startQuestionNo : prompts[0]?.number ?? 0;
    const end = typeof group.endQuestionNo === "number" ? group.endQuestionNo : prompts.at(-1)?.number ?? start;
    return {
      id: typeof group.id === "string" ? group.id : `${sectionId}-group-${groupIndex + 1}`,
      title: plainText(group.title) || `Nhóm câu hỏi ${groupIndex + 1}`,
      type: typeof group.typeFormat === "string" ? group.typeFormat : "FILL_IN_BLANK",
      start,
      end,
      prompts,
    };
  });
}

function readSections(skill: TestSkill, content: Record<string, unknown>): PreviewSection[] {
  if (skill === "READING" && Array.isArray(content.passages)) {
    return content.passages.filter(isRecord).map((passage, index) => {
      const id = typeof passage.id === "string" ? passage.id : `reading-passage-${index + 1}`;
      const no = typeof passage.passageNo === "number" ? passage.passageNo : index + 1;
      return {
        id,
        eyebrow: `Reading Passage ${no}`,
        title: plainText(passage.title) || `Passage ${no}`,
        body: plainText(passage.content),
        groups: readGroups(passage.questionGroups, id),
      };
    });
  }
  if (skill === "LISTENING" && Array.isArray(content.parts)) {
    return content.parts.filter(isRecord).map((part, index) => {
      const id = typeof part.id === "string" ? part.id : `listening-part-${index + 1}`;
      const no = typeof part.partNo === "number" ? part.partNo : index + 1;
      return {
        id,
        eyebrow: `Listening Part ${no}`,
        title: plainText(part.title) || `Part ${no}`,
        body: plainText(part.transcriptHtml),
        groups: readGroups(part.questionGroups, id),
      };
    });
  }
  if (skill === "WRITING" && Array.isArray(content.tasks)) {
    return content.tasks.filter(isRecord).map((task, index) => {
      const id = typeof task.id === "string" ? task.id : `writing-task-${index + 1}`;
      const no = typeof task.taskNo === "number" ? task.taskNo : index + 1;
      return {
        id,
        eyebrow: `Writing Task ${no}`,
        title: plainText(task.title) || `Task ${no}`,
        body: plainText(task.promptHtml),
        groups: [],
      };
    });
  }
  if (skill === "SPEAKING" && Array.isArray(content.parts)) {
    return content.parts.filter(isRecord).map((part, index) => {
      const id = typeof part.id === "string" ? part.id : `speaking-part-${index + 1}`;
      const no = typeof part.partNo === "number" ? part.partNo : index + 1;
      const questions = Array.isArray(part.questions)
        ? part.questions.filter(isRecord).map((question, questionIndex) => ({
          id: typeof question.id === "string" ? question.id : `${id}-question-${questionIndex + 1}`,
          number: questionIndex + 1,
          prompt: plainText(question.promptText) || "Chưa nhận diện được nội dung câu hỏi",
        }))
        : [];
      return {
        id,
        eyebrow: `Speaking Part ${no}`,
        title: plainText(part.topicTitle) || `Part ${no}`,
        body: plainText(part.cueCardPromptHtml),
        groups: questions.length ? [{ id: `${id}-questions`, title: "Câu hỏi", type: "SPEAKING", start: 1, end: questions.length, prompts: questions }] : [],
      };
    });
  }
  return [];
}

function questionTypeLabel(type: string) {
  return readingQuestionTypeLabels[type as QuestionTypeFormat] ?? (type === "SPEAKING" ? "Câu hỏi nói" : type.replaceAll("_", " "));
}

export default function AiImportStructurePreview({ skill, builderContent, questionCount }: Props) {
  const sections = readSections(skill, builderContent);

  if (!sections.length) {
    return (
      <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-bold"><WarningCircle size={20} /> Chưa nhận diện được phần thi</div>
        <p className="mt-2 leading-6">Bạn vẫn có thể xem dữ liệu kỹ thuật hoặc quay lại bổ sung nội dung và hướng dẫn cho AI.</p>
      </div>
    );
  }

  return (
    <section aria-label="Cấu trúc đề đã nhận diện" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#292528]">Cấu trúc AI đã nhận diện</h2>
          <p className="mt-1 text-sm text-[#6F676C]">Kiểm tra nhanh từng phần, nhóm dạng bài và số câu trước khi tạo bản nháp.</p>
        </div>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-[#247052]">
          <CheckCircle size={17} /> {sections.length} phần · {questionCount} câu
        </span>
      </div>

      {sections.map((section) => (
        <article key={section.id} className="overflow-hidden rounded-[22px] border border-[#DED7DA] bg-white">
          <header className="border-b border-[#DED7DA] bg-[#F7F5F4] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#AD4C64]">{section.eyebrow}</p>
            <h3 className="mt-1 font-display text-base font-bold text-[#292528]">{section.title}</h3>
            {section.body && <p className="mt-2 line-clamp-3 max-w-4xl text-xs leading-5 text-[#6F676C]">{section.body}</p>}
          </header>
          <div className="space-y-3 p-4 sm:p-5">
            {!section.groups.length && section.body && (
              <p className="rounded-xl bg-[#F2ECEE] px-4 py-3 text-sm leading-6 text-[#292528]">{section.body}</p>
            )}
            {section.groups.map((group) => (
              <div key={group.id} className="rounded-2xl border border-[#DED7DA] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#292528]">{group.title}</h4>
                    <p className="mt-1 text-xs text-[#6F676C]">{questionTypeLabel(group.type)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7E5EA] px-2.5 py-1.5 text-[11px] font-bold text-[#AD4C64]">
                    <ListNumbers size={15} /> Câu {group.start || "?"}–{group.end || "?"}
                  </span>
                </div>
                {group.prompts.length > 0 && (
                  <ol className="mt-3 space-y-2">
                    {group.prompts.slice(0, 4).map((question) => (
                      <li key={question.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-2 text-xs leading-5 text-[#292528]">
                        <span className="grid size-7 place-items-center rounded-lg bg-[#F2ECEE] font-bold text-[#6F676C]">{question.number}</span>
                        <span className="pt-1">{question.prompt}</span>
                      </li>
                    ))}
                    {group.prompts.length > 4 && <li className="pl-10 text-xs font-semibold text-[#6F676C]">Còn {group.prompts.length - 4} câu trong nhóm này</li>}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
