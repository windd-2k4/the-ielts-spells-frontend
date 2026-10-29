import {
  CheckCircle,
  ListNumbers,
  WarningCircle,
  SpeakerHigh,
  BookOpen,
  Image as ImageIcon,
  CaretDown,
  CaretUp,
  Lightbulb
} from "@phosphor-icons/react";
import { useState } from "react";
import { readingQuestionTypeLabels } from "../test-builder/readingQuestionGroupConfig";
import type { QuestionTypeFormat, TestSkill } from "../../library-types";

type Props = {
  skill: TestSkill;
  builderContent: Record<string, unknown>;
  questionCount: number;
};

type PreviewQuestion = {
  id: string;
  number: number;
  prompt: string;
  typeFormat: string;
  options: Array<{ id: string; code: string; label: string; text: string }>;
  correctAnswers: string[];
  acceptableAnswers: string[];
  explanation?: string;
};

type PreviewGroup = {
  id: string;
  title: string;
  type: string;
  start: number;
  end: number;
  instructions: string;
  wordLimitRule?: string;
  sharedOptions: Array<{ id: string; code: string; label: string; text: string }>;
  gapFillTemplate?: string;
  questions: PreviewQuestion[];
};

type PreviewSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  audioUrl?: string;
  groups: PreviewGroup[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeHtmlText(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";

  let text = value
    .replace(/<\/(div|p|li|h[1-6]|tr)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "");

  if (typeof document !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(text, "text/html");
      text = doc.body.textContent || text;
    } catch {
      // fallback
    }
  }

  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function plainText(value: unknown): string {
  return decodeHtmlText(value);
}

function readGroups(value: unknown, sectionId: string): PreviewGroup[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((group, groupIndex) => {
    const rawQuestions = Array.isArray(group.questions) ? group.questions.filter(isRecord) : [];
    
    // Parse shared options
    const sharedOptions: Array<{ id: string; code: string; label: string; text: string }> = [];
    if (Array.isArray(group.sharedOptions)) {
      for (const opt of group.sharedOptions) {
        if (isRecord(opt)) {
          sharedOptions.push({
            id: String(opt.id || ""),
            code: String(opt.code || opt.label || ""),
            label: String(opt.label || opt.code || ""),
            text: String(opt.text || ""),
          });
        }
      }
    }

    const questions: PreviewQuestion[] = rawQuestions.map((q, qIndex) => {
      const qOptions: Array<{ id: string; code: string; label: string; text: string }> = [];
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (isRecord(opt)) {
            qOptions.push({
              id: String(opt.id || ""),
              code: String(opt.code || opt.label || ""),
              label: String(opt.label || opt.code || ""),
              text: String(opt.text || ""),
            });
          }
        }
      }

      const correctAnswers: string[] = Array.isArray(q.correctAnswers)
        ? q.correctAnswers.map(String)
        : q.correctAnswers ? [String(q.correctAnswers)] : [];

      const acceptableAnswers: string[] = Array.isArray(q.acceptableAnswers)
        ? q.acceptableAnswers.map(String)
        : q.acceptableAnswers ? [String(q.acceptableAnswers)] : [];

      const pText = plainText(q.prompt) || plainText(q.promptText) || plainText(q.title);
      const prompt = pText && !pText.startsWith("Question ") ? pText : `Câu hỏi ${q.number || qIndex + 1}`;

      let explanation = "";
      if (isRecord(q.solution) && typeof q.solution.explanation === "string") {
        explanation = plainText(q.solution.explanation);
      } else if (typeof q.explanation === "string") {
        explanation = plainText(q.explanation);
      }

      return {
        id: typeof q.id === "string" ? q.id : `${sectionId}-q-${qIndex + 1}`,
        number: typeof q.number === "number" ? q.number : qIndex + 1,
        prompt,
        typeFormat: typeof q.typeFormat === "string" ? q.typeFormat : String(group.typeFormat || "SHORT_ANSWER"),
        options: qOptions,
        correctAnswers,
        acceptableAnswers,
        explanation,
      };
    });

    const start = typeof group.startQuestionNo === "number" ? group.startQuestionNo : questions[0]?.number ?? 1;
    const end = typeof group.endQuestionNo === "number" ? group.endQuestionNo : questions.at(-1)?.number ?? start;
    const instructions = typeof group.instructions === "string" ? group.instructions : "";
    const wordLimitRule = typeof group.wordLimitRule === "string" ? group.wordLimitRule : undefined;
    const gapFillTemplate = typeof group.gapFillTemplate === "string" ? group.gapFillTemplate : undefined;

    return {
      id: typeof group.id === "string" ? group.id : `${sectionId}-group-${groupIndex + 1}`,
      title: plainText(group.title) || `Nhóm câu hỏi ${groupIndex + 1}`,
      type: typeof group.typeFormat === "string" ? group.typeFormat : "FILL_IN_BLANK",
      start,
      end,
      instructions,
      wordLimitRule,
      sharedOptions,
      gapFillTemplate,
      questions,
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
        body: typeof passage.content === "string" ? passage.content : "",
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
        body: typeof part.transcriptHtml === "string" ? part.transcriptHtml : "",
        audioUrl: typeof part.audioUrl === "string" ? part.audioUrl : undefined,
        groups: readGroups(part.questionGroups, id),
      };
    });
  }
  return [];
}

function questionTypeLabel(type: string): string {
  return readingQuestionTypeLabels[type as QuestionTypeFormat] ?? type.replaceAll("_", " ");
}

export default function AiImportStructurePreview({ skill, builderContent, questionCount }: Props) {
  const sections = readSections(skill, builderContent);
  const [expandedPassages, setExpandedPassages] = useState<Record<string, boolean>>({});
  const [showAllQuestions, setShowAllQuestions] = useState<Record<string, boolean>>({});

  const togglePassage = (id: string) => {
    setExpandedPassages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleQuestions = (groupId: string) => {
    setShowAllQuestions((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (!sections.length) {
    return (
      <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-bold"><WarningCircle size={20} /> Chưa nhận diện được phần thi</div>
        <p className="mt-2 leading-6">Vui lòng kiểm tra lại dữ liệu thô hoặc chọn phân tách lại bằng AI.</p>
      </div>
    );
  }

  return (
    <section aria-label="Cấu trúc đề đã nhận diện" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Cấu trúc đề thi bóc tách hoàn chỉnh</h2>
          <p className="mt-0.5 text-xs text-slate-500">Xem trước văn bản bài đọc, âm thanh bài nghe, bản đồ hình ảnh, nhóm câu hỏi và đáp án chính thức.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <CheckCircle size={16} className="text-emerald-600" /> {sections.length} phần · {questionCount} câu hỏi chuẩn
        </span>
      </div>

      {sections.map((section) => (
        <article key={section.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Section Header */}
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">{section.eyebrow}</p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">{section.title}</h3>
              </div>
              {section.body && (
                <button
                  type="button"
                  onClick={() => togglePassage(section.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100"
                >
                  <BookOpen size={14} />
                  {expandedPassages[section.id] ? "Thu gọn bài đọc/transcript" : "Xem bài đọc/transcript"}
                  {expandedPassages[section.id] ? <CaretUp size={12} /> : <CaretDown size={12} />}
                </button>
              )}
            </div>

            {/* Audio Player for Listening */}
            {section.audioUrl && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5">
                <SpeakerHigh size={24} className="text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-950 mb-1">
                    <span>File Nghe Audio (.mp3)</span>
                    <a href={section.audioUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 underline">
                      Mở tab mới
                    </a>
                  </div>
                  <audio controls src={section.audioUrl} className="h-8 w-full" preload="metadata" />
                </div>
              </div>
            )}

            {/* Expanded Passage Content */}
            {expandedPassages[section.id] && section.body && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 max-h-80 overflow-y-auto text-xs leading-6 text-slate-700 shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: section.body }} />
              </div>
            )}
          </header>

          {/* Question Groups */}
          <div className="space-y-4 p-4 sm:p-5">
            {section.groups.map((group) => {
              const isExpanded = showAllQuestions[group.id] ?? false;
              const displayedQuestions = isExpanded ? group.questions : group.questions.slice(0, 6);

              return (
                <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  {/* Group Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{group.title}</h4>
                        <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold">
                          {questionTypeLabel(group.type)}
                        </span>
                        {group.wordLimitRule && (
                          <span className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                            {group.wordLimitRule}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      <ListNumbers size={14} /> Câu {group.start}–{group.end}
                    </span>
                  </div>

                  {/* Instructions & Diagram Images */}
                  {group.instructions && (
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: group.instructions }} className="prose-sm max-w-none whitespace-pre-wrap [&_img]:max-h-72 [&_img]:mx-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-300 [&_img]:shadow-sm" />
                    </div>
                  )}

                  {/* Shared Option Bank (if Matching/Diagram) */}
                  {group.sharedOptions.length > 0 && (
                    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-2">Ngân Hàng Lựa Chọn (Option Bank):</p>
                      <div className="flex flex-wrap gap-2">
                        {group.sharedOptions.map((opt) => (
                          <span key={opt.id} className="inline-flex items-center gap-1 rounded-md bg-white border border-indigo-200 px-2.5 py-1 text-xs text-slate-800 shadow-2xs">
                            {opt.code === opt.text ? <span className="font-bold text-indigo-700">{opt.code}</span> : <><strong className="text-indigo-600">{opt.code}:</strong> {opt.text}</>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="mt-4 space-y-3">
                    {displayedQuestions.map((q) => {
                      // Determine answer display
                      let answerLabel = "";
                      if (group.sharedOptions.length > 0 && q.correctAnswers.length > 0) {
                        const matchedOpt = group.sharedOptions.find((o) => q.correctAnswers.includes(o.id) || q.correctAnswers.includes(o.code));
                        answerLabel = matchedOpt ? `${matchedOpt.code} (${matchedOpt.text})` : q.acceptableAnswers[0] || q.correctAnswers[0];
                      } else if (q.options.length > 0 && q.correctAnswers.length > 0) {
                        const matchedOpt = q.options.find((o) => q.correctAnswers.includes(o.id) || q.correctAnswers.includes(o.code));
                        answerLabel = matchedOpt ? (matchedOpt.code === matchedOpt.text ? matchedOpt.code : `${matchedOpt.code}. ${matchedOpt.text}`) : q.acceptableAnswers[0] || q.correctAnswers[0];
                      } else {
                        answerLabel = q.acceptableAnswers.join(" / ") || q.correctAnswers.join(" / ");
                      }

                      return (
                        <div key={q.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs">
                          <div className="flex items-start gap-2.5">
                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-indigo-600 font-bold text-white text-[11px]">
                              {q.number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 leading-relaxed">{q.prompt}</p>

                              {/* MCQ Choices List */}
                              {q.options.length > 0 && (
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {q.options.map((opt) => {
                                    const isCorrect = q.correctAnswers.includes(opt.id) || q.correctAnswers.includes(opt.code);
                                    return (
                                      <div
                                        key={opt.id}
                                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 border ${
                                          isCorrect
                                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                            : "bg-white border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        <span className={`size-4 grid place-items-center rounded text-[10px] font-bold ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                                          {opt.code}
                                        </span>
                                        <span className="truncate">{opt.text}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Answer Badge for non-MCQ */}
                              {q.options.length === 0 && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                    ✓ Đáp án: {answerLabel || "Không rõ"}
                                  </span>
                                </div>
                              )}

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="mt-1.5 flex items-start gap-1 text-[11px] text-slate-500 italic">
                                  <Lightbulb size={13} className="shrink-0 mt-0.5 text-amber-500" />
                                  <span>Giải thích: {q.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Toggle more questions */}
                  {group.questions.length > 6 && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleQuestions(group.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isExpanded ? "▲ Thu gọn danh sách câu hỏi" : `▼ Xem thêm ${group.questions.length - 6} câu hỏi khác`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
