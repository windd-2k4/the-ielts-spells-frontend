import {
  Article,
  BookOpenText,
  BookmarkSimple,
  Cards,
  CaretDown,
  ChartBar,
  ChartLineUp,
  ChartPie,
  Chats,
  Check,
  CheckCircle,
  Checks,
  ClipboardText,
  Compass,
  Exam,
  Eye,
  GitMerge,
  Headphones,
  ListChecks,
  ListNumbers,
  MagnifyingGlass,
  MapPin,
  Microphone,
  Notebook,
  NotePencil,
  PencilSimpleLine,
  Plus,
  PuzzlePiece,
  ShieldCheck,
  SpinnerGap,
  Table,
  Tag,
  Textbox,
  TextColumns,
  ThumbsUp,
  Trash,
  TreeStructure,
  TrendUp,
  UploadSimple,
  User,
  WarningCircle,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Page } from "../../academic-types";
import { apiFetch } from "../../lib/api";
import type {
  ContentLifecycleStatus,
  PassageSection,
  QuestionGroupItem,
  TestBankItem,
  TestSkill,
  TestType,
} from "../../library-types";
import PublishValidationModal from "../test-builder/PublishValidationModal";
import TestPreviewModal from "../test-builder/TestPreviewModal";

type Props = {
  onOpenBulkImport: () => void;
};

type AuthoringSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";

type FormatOption =
  | "ALL"
  | "SINGLE"
  | "FULL"
  | "DICTATION"
  | "PASSAGE_1"
  | "PASSAGE_2"
  | "PASSAGE_3"
  | "SECTION_1"
  | "SECTION_2"
  | "SECTION_3"
  | "SECTION_4"
  | "TASK_1"
  | "TASK_2"
  | "PART_1"
  | "PART_2"
  | "PART_3";

type CreateFormat = Exclude<FormatOption, "ALL" | "SINGLE">;

type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}>;

type SkillCardConfig = {
  skill: AuthoringSkill;
  label: string;
  description: string;
  icon: PhosphorIcon;
  formats: Array<{ value: CreateFormat; label: string; helper: string }>;
};

type QuestionTypeItem = {
  id: string;
  label: string;
  icon?: PhosphorIcon;
  iconBg?: string;
  iconColor?: string;
};

type CreateTestForm = {
  title: string;
  skill: AuthoringSkill;
  format: CreateFormat;
  durationMinutes: number;
  description: string;
  tagsText: string;
};

const statusLabels: Record<ContentLifecycleStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Chờ duyệt",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const skillLabels: Record<AuthoringSkill, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const formatLabels: Record<FormatOption, string> = {
  ALL: "Tất cả cấu trúc",
  SINGLE: "Bài lẻ",
  FULL: "Full đề",
  DICTATION: "Dictation",
  PASSAGE_1: "Reading Passage 1",
  PASSAGE_2: "Reading Passage 2",
  PASSAGE_3: "Reading Passage 3",
  SECTION_1: "Listening Section 1",
  SECTION_2: "Listening Section 2",
  SECTION_3: "Listening Section 3",
  SECTION_4: "Listening Section 4",
  TASK_1: "Writing Task 1",
  TASK_2: "Writing Task 2",
  PART_1: "Speaking Part 1",
  PART_2: "Speaking Part 2",
  PART_3: "Speaking Part 3",
};

const skillCards: SkillCardConfig[] = [
  {
    skill: "READING",
    label: "Reading",
    description: "Passage lẻ hoặc full 3 passages.",
    icon: BookOpenText,
    formats: [
      { value: "PASSAGE_1", label: "Passage 1", helper: "Bài lẻ 13 câu, dễ tái dùng vào full test." },
      { value: "PASSAGE_2", label: "Passage 2", helper: "Bài lẻ 13–14 câu." },
      { value: "PASSAGE_3", label: "Passage 3", helper: "Bài lẻ 13–14 câu." },
      { value: "FULL", label: "Full đề", helper: "Ghép 3 passages, mặc định 40 câu / 60 phút." },
    ],
  },
  {
    skill: "LISTENING",
    label: "Listening",
    description: "Section lẻ, full test hoặc dictation.",
    icon: Headphones,
    formats: [
      { value: "SECTION_1", label: "Section 1", helper: "Conversation ngắn, form/note/table completion." },
      { value: "SECTION_2", label: "Section 2", helper: "Monologue tình huống đời sống." },
      { value: "SECTION_3", label: "Section 3", helper: "Academic discussion." },
      { value: "SECTION_4", label: "Section 4", helper: "Lecture học thuật." },
      { value: "DICTATION", label: "Dictation", helper: "Luyện nghe chép chính tả." },
      { value: "FULL", label: "Full đề", helper: "4 sections, 40 câu." },
    ],
  },
  {
    skill: "WRITING",
    label: "Writing",
    description: "Task 1, Task 2 hoặc full Writing.",
    icon: PencilSimpleLine,
    formats: [
      { value: "TASK_1", label: "Task 1", helper: "Line graph, bar chart, table, map, process..." },
      { value: "TASK_2", label: "Task 2", helper: "Essay, opinion, discussion, problem-solution..." },
      { value: "FULL", label: "Full đề", helper: "Task 1 + Task 2, 60 phút." },
    ],
  },
  {
    skill: "SPEAKING",
    label: "Speaking",
    description: "Part lẻ hoặc full Speaking.",
    icon: Microphone,
    formats: [
      { value: "PART_1", label: "Part 1", helper: "Warm-up questions." },
      { value: "PART_2", label: "Part 2", helper: "Cue card + follow-up." },
      { value: "PART_3", label: "Part 3", helper: "Discussion mở rộng." },
      { value: "FULL", label: "Full đề", helper: "Part 1–3, 11–14 phút." },
    ],
  },
];

const readingQuestionTypes: QuestionTypeItem[] = [
  { id: "MATCHING_HEADINGS", label: "Matching Headings", icon: ListNumbers, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
  { id: "TRUE_FALSE_NOT_GIVEN", label: "True / False / Not Given", icon: CheckCircle, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { id: "YES_NO_NOT_GIVEN", label: "Yes / No / Not Given", icon: ThumbsUp, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { id: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: ListChecks, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: "MULTIPLE_ANSWERS", label: "Multiple Answers", icon: Checks, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { id: "MATCHING_INFORMATION", label: "Matching Information", icon: PuzzlePiece, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { id: "MATCHING_FEATURES", label: "Matching Features", icon: Tag, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "MATCHING_SENTENCE_ENDINGS", label: "Matching Sentence Endings", icon: GitMerge, iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-700" },
  { id: "FILL_IN_BLANK", label: "Gap Filling", icon: Textbox, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { id: "SHORT_ANSWER", label: "Short-answer Questions", icon: Chats, iconBg: "bg-lime-100", iconColor: "text-lime-700" },
  { id: "SENTENCE_COMPLETION", label: "Sentence Completion", icon: TextColumns, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { id: "SUMMARY_COMPLETION", label: "Summary Completion", icon: Notebook, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { id: "NOTE_COMPLETION", label: "Note Completion", icon: NotePencil, iconBg: "bg-amber-100", iconColor: "text-amber-700" },
  { id: "TABLE_COMPLETION", label: "Table Completion", icon: Table, iconBg: "bg-cyan-100", iconColor: "text-cyan-700" },
  { id: "FLOW_CHART_COMPLETION", label: "Flow-chart Completion", icon: TreeStructure, iconBg: "bg-green-100", iconColor: "text-green-700" },
  { id: "DIAGRAM_LABELING", label: "Diagram Labeling", icon: TreeStructure, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
];

const listeningQuestionTypes: QuestionTypeItem[] = [
  { id: "FILL_IN_BLANK", label: "Form / Note / Table Completion", icon: ClipboardText, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { id: "MAP_DIAGRAM_LABEL", label: "Map / Diagram Label", icon: Compass, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { id: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: ListChecks, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: "MULTIPLE_ANSWERS", label: "Multiple Answers", icon: Checks, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { id: "MATCHING_INFORMATION", label: "Matching", icon: PuzzlePiece, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "SUMMARY_COMPLETION", label: "Summary Completion", icon: Notebook, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
];

const writingQuestionTypes: QuestionTypeItem[] = [
  { id: "LINE_GRAPH", label: "Line Graph", icon: TrendUp, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { id: "BAR_CHART", label: "Bar Chart", icon: ChartBar, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { id: "PIE_CHART", label: "Pie Chart", icon: ChartPie, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "TABLE", label: "Table", icon: Table, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: "MIXED_GRAPH", label: "Mixed Graph", icon: ChartLineUp, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { id: "MAP", label: "Map", icon: MapPin, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { id: "PROCESS", label: "Process", icon: GitMerge, iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
  { id: "ESSAY", label: "Essay Task 2", icon: Article, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
];

const speakingQuestionTypes: QuestionTypeItem[] = [
  { id: "PERSONAL_QUESTIONS", label: "Personal Questions", icon: User, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: "CUE_CARD", label: "Cue Card", icon: Cards, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "DISCUSSION", label: "Discussion", icon: Chats, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
];

const defaultCreateForm: CreateTestForm = {
  title: "",
  skill: "READING",
  format: "PASSAGE_1",
  durationMinutes: 20,
  description: "",
  tagsText: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAuthoringSkill(value: TestSkill | "ALL"): value is AuthoringSkill {
  return value === "READING" || value === "LISTENING" || value === "WRITING" || value === "SPEAKING";
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultFormatForSkill(skill: AuthoringSkill): CreateFormat {
  switch (skill) {
    case "READING":
      return "PASSAGE_1";
    case "LISTENING":
      return "SECTION_1";
    case "WRITING":
      return "TASK_1";
    case "SPEAKING":
      return "PART_1";
  }
}

function defaultDuration(skill: AuthoringSkill, format: CreateFormat) {
  if (format === "FULL") {
    if (skill === "READING" || skill === "WRITING") return 60;
    if (skill === "LISTENING") return 40;
    return 15;
  }
  if (skill === "READING") return 20;
  if (skill === "LISTENING") return format === "DICTATION" ? 20 : 10;
  if (skill === "WRITING") return format === "TASK_1" ? 20 : 40;
  return format === "PART_2" ? 4 : 5;
}

function expectedQuestionCount(skill: AuthoringSkill, format: CreateFormat) {
  if (skill === "READING") return format === "FULL" ? 40 : 13;
  if (skill === "LISTENING") return format === "FULL" ? 40 : format === "DICTATION" ? 20 : 10;
  if (skill === "WRITING") return format === "FULL" ? 2 : 1;
  return format === "FULL" ? 3 : 1;
}

function testTypeForFormat(format: CreateFormat): TestType {
  return format === "FULL" ? "FULL_TEST" : "SINGLE_SKILL";
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[_/–—-]+/g, " ").replace(/\s+/g, " ").trim();
}

function isFormatOption(value: string): value is FormatOption {
  return [
    "ALL",
    "SINGLE",
    "FULL",
    "DICTATION",
    "PASSAGE_1",
    "PASSAGE_2",
    "PASSAGE_3",
    "SECTION_1",
    "SECTION_2",
    "SECTION_3",
    "SECTION_4",
    "TASK_1",
    "TASK_2",
    "PART_1",
    "PART_2",
    "PART_3",
  ].includes(value);
}

function formatOf(test: TestBankItem): FormatOption {
  const content = test.builderContent ?? {};
  const format = typeof content.format === "string" ? content.format.toUpperCase() : "";
  if (isFormatOption(format)) return format;
  const tagFormat = test.tags.find((tag) => isFormatOption(tag.toUpperCase()));
  if (tagFormat) return tagFormat.toUpperCase() as FormatOption;
  if (test.testType === "FULL_TEST" || test.sectionsCount > 1) return "FULL";
  return "SINGLE";
}

function readPassages(content?: Record<string, unknown>): PassageSection[] {
  const rawPassages = content?.passages;
  if (Array.isArray(rawPassages)) {
    return rawPassages.filter(isRecord).map((item, index) => {
      const questionGroups = Array.isArray(item.questionGroups) ? item.questionGroups as QuestionGroupItem[] : [];
      return {
        id: typeof item.id === "string" ? item.id : newId("passage"),
        passageNo: typeof item.passageNo === "number" ? item.passageNo : index + 1,
        title: typeof item.title === "string" ? item.title : `Reading Passage ${index + 1}`,
        content: typeof item.content === "string" ? item.content : "",
        teacherAnnotations: Array.isArray(item.teacherAnnotations)
          ? item.teacherAnnotations as PassageSection["teacherAnnotations"]
          : [],
        questionGroups,
      };
    });
  }

  const legacyPassageContent = content?.passageContent;
  if (isRecord(legacyPassageContent)) {
    return [1, 2, 3]
      .map((passageNo) => ({
        id: newId("passage"),
        passageNo,
        title: `Reading Passage ${passageNo}`,
        content: typeof legacyPassageContent[String(passageNo)] === "string"
          ? legacyPassageContent[String(passageNo)] as string
          : "",
        questionGroups: passageNo === 1 && Array.isArray(content?.questionGroups)
          ? content.questionGroups as QuestionGroupItem[]
          : [],
      }))
      .filter((passage) => passage.content || passage.questionGroups.length > 0);
  }

  return [];
}

function emptyReadingPassage(passageNo: number): PassageSection {
  return {
    id: newId("passage"),
    passageNo,
    title: `Reading Passage ${passageNo}`,
    content: "",
    teacherAnnotations: [],
    questionGroups: [],
  };
}

function cloneReadingPassage(source: TestBankItem, passageNo: number): PassageSection {
  const sourcePassage = readPassages(source.builderContent)[0];
  const questionGroups = (sourcePassage?.questionGroups ?? []).map((group) => ({
    ...group,
    id: newId("group"),
    questions: group.questions.map((question) => {
      const optionIdMap = new Map<string, string>();
      const options = question.options.map((option) => {
        const nextId = newId("option");
        optionIdMap.set(option.id, nextId);
        return { ...option, id: nextId };
      });
      return {
        ...question,
        id: newId("question"),
        options,
        correctAnswers: question.correctAnswers.map((answer) => optionIdMap.get(answer) ?? answer),
      };
    }),
  }));
  return {
    id: newId("passage"),
    passageNo,
    title: sourcePassage?.title || `${source.code} • ${source.title}`,
    content: sourcePassage?.content || "",
    teacherAnnotations: sourcePassage?.teacherAnnotations ?? [],
    questionGroups,
  };
}

function buildBuilderContent(form: CreateTestForm, selectedSourceTests: TestBankItem[]) {
  const base = {
    format: form.format,
    expectedQuestions: expectedQuestionCount(form.skill, form.format),
    authoringSkill: form.skill,
    createdFrom: "TEST_BANK_CREATE_MODAL",
  };

  if (form.skill === "READING") {
    if (form.format === "FULL") {
      const selectedPassages = selectedSourceTests.slice(0, 3).map((test, index) => cloneReadingPassage(test, index + 1));
      return {
        ...base,
        sectionsPreset: "READING_FULL",
        sourceTestIds: selectedSourceTests.slice(0, 3).map((test) => test.id),
        passages: [1, 2, 3].map((passageNo) => selectedPassages[passageNo - 1] ?? emptyReadingPassage(passageNo)),
      };
    }
    const passageNo = form.format === "PASSAGE_2" ? 2 : form.format === "PASSAGE_3" ? 3 : 1;
    return {
      ...base,
      sectionsPreset: form.format,
      passages: [emptyReadingPassage(passageNo)],
    };
  }

  if (form.skill === "LISTENING") {
    return {
      ...base,
      sectionsPreset: form.format,
      listeningParts: [],
      transcriptText: "",
      questionGroups: [],
      audioDurationSeconds: 0,
    };
  }

  if (form.skill === "WRITING") {
    return {
      ...base,
      sectionsPreset: form.format,
      promptText: "",
      minWords: form.format === "TASK_2" ? 250 : 150,
      timeMinutes: form.durationMinutes,
      sampleAnswer: "",
    };
  }

  return {
    ...base,
    sectionsPreset: form.format,
    promptText: "",
    timeMinutes: form.durationMinutes,
    sampleAnswer: "",
  };
}

function questionTypeList(skill: TestSkill | "ALL") {
  if (skill === "LISTENING") return listeningQuestionTypes;
  if (skill === "WRITING") return writingQuestionTypes;
  if (skill === "SPEAKING") return speakingQuestionTypes;
  return readingQuestionTypes;
}

function statusBadge(status: ContentLifecycleStatus) {
  const className = {
    PUBLISHED: "bg-emerald-50 text-[#237653]",
    IN_REVIEW: "bg-amber-50 text-[#8a6000]",
    DRAFT: "bg-stone-100 text-[#746A6E]",
    ARCHIVED: "bg-rose-50 text-[#b4232d]",
  }[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${className}`}>{statusLabels[status]}</span>;
}

function SkillCard({
  config,
  skillFilter,
  formatFilter,
  onSelect,
}: {
  config: SkillCardConfig;
  skillFilter: TestSkill | "ALL";
  formatFilter: FormatOption;
  onSelect: (skill: AuthoringSkill, format: FormatOption) => void;
}) {
  const Icon = config.icon;
  const selectedSkill = skillFilter === config.skill;
  const singleActive = selectedSkill && formatFilter !== "FULL" && formatFilter !== "ALL";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        selectedSkill ? "border-[#8f4458] ring-2 ring-[#8f4458]/10" : "border-[#e3dce2] hover:border-[#cdbfc6]"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(config.skill, "ALL")}
        className={`flex min-h-[56px] w-full items-center gap-3 border-b px-4 text-left transition ${
          selectedSkill ? "border-[#ead2da] bg-[#f7e7ec] text-[#743447]" : "border-[#e3dce2] bg-[#f8f6fa] text-[#211A1D]"
        }`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#8f4458] shadow-sm">
          <Icon size={19} weight="duotone" />
        </span>
        <span>
          <span className="block font-display text-sm font-extrabold">{config.label}</span>
          <span className="block text-[11px] font-semibold text-[#746A6E]">{config.description}</span>
        </span>
      </button>

      <div className="space-y-2 p-4">
        <button
          type="button"
          onClick={() => onSelect(config.skill, singleActive ? "ALL" : "SINGLE")}
          className="flex min-h-[36px] w-full items-center justify-between rounded-xl px-2 text-left hover:bg-[#f8f6fa]"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-[#211A1D]">
            <span className={`h-4 w-4 rounded-full border ${singleActive ? "border-[#8f4458] bg-[#8f4458]" : "border-[#cdbfc6] bg-white"}`} />
            Bài lẻ
          </span>
          <CaretDown size={14} className={`text-[#746A6E] transition ${singleActive ? "" : "-rotate-90"}`} />
        </button>

        {singleActive && (
          <div className="ml-4 space-y-1 border-l border-[#e3dce2] pl-3">
            {config.formats.filter((item) => item.value !== "FULL").map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => onSelect(config.skill, format.value)}
                className={`flex min-h-[34px] w-full items-center justify-between rounded-lg px-2 text-xs font-bold transition ${
                  formatFilter === format.value ? "bg-[#f7e7ec] text-[#8f4458]" : "text-[#5f565b] hover:bg-[#f8f6fa]"
                }`}
              >
                {format.label}
                {formatFilter === format.value && <Check size={13} weight="bold" />}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onSelect(config.skill, "FULL")}
          className={`flex min-h-[36px] w-full items-center gap-2.5 rounded-xl px-2 text-left text-sm font-bold transition ${
            selectedSkill && formatFilter === "FULL" ? "bg-[#f7e7ec] text-[#8f4458]" : "text-[#211A1D] hover:bg-[#f8f6fa]"
          }`}
        >
          <span className={`h-4 w-4 rounded-full border ${selectedSkill && formatFilter === "FULL" ? "border-[#8f4458] bg-[#8f4458]" : "border-[#cdbfc6] bg-white"}`} />
          Full đề
        </button>
      </div>
    </article>
  );
}

export function TestBankWorkspace({ onOpenBulkImport }: Props) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<TestSkill | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ContentLifecycleStatus | "ALL">("ALL");
  const [formatFilter, setFormatFilter] = useState<FormatOption>("ALL");
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [publishingTest, setPublishingTest] = useState<TestBankItem | null>(null);
  const [previewTest, setPreviewTest] = useState<TestBankItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTestForm>(defaultCreateForm);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("size", "100");
      if (query.trim()) params.set("query", query.trim());
      if (isAuthoringSkill(skillFilter)) params.set("skill", skillFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (formatFilter === "FULL") {
        params.set("testType", "FULL_TEST");
      } else if (formatFilter !== "ALL") {
        params.set("testType", "SINGLE_SKILL");
        if (formatFilter !== "SINGLE") params.set("format", formatFilter);
      }

      setLoading(true);
      setError("");
      apiFetch<Page<TestBankItem>>(`/admin/test-bank?${params.toString()}`)
        .then((page) => {
          if (active) setTests(page.content);
        })
        .catch((reason: Error) => {
          if (active) setError(reason.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [formatFilter, query, skillFilter, statusFilter]);

  const selectedTypes = questionTypeList(skillFilter);

  const filteredTests = useMemo(() => {
    if (selectedQuestionTypes.length === 0) return tests;
    return tests.filter((test) => {
      const haystack = normalizeToken([
        test.title,
        test.code,
        ...test.tags,
        JSON.stringify(test.builderContent ?? {}),
      ].join(" "));
      return selectedQuestionTypes.some((type) => haystack.includes(normalizeToken(type)));
    });
  }, [selectedQuestionTypes, tests]);

  const readingSingleSources = useMemo(() => (
    tests.filter((test) => {
      const format = formatOf(test);
      return test.skill === "READING"
        && test.testType === "SINGLE_SKILL"
        && test.status !== "ARCHIVED"
        && format !== "FULL";
    })
  ), [tests]);

  const selectedSourceTests = selectedSourceIds
    .map((id) => readingSingleSources.find((test) => test.id === id))
    .filter((test): test is TestBankItem => Boolean(test));

  function handleSelectSkillFormat(skill: AuthoringSkill, format: FormatOption) {
    setSkillFilter(skill);
    setFormatFilter(format);
    setSelectedQuestionTypes([]);
  }

  function handleResetFilters() {
    setQuery("");
    setSkillFilter("ALL");
    setStatusFilter("ALL");
    setFormatFilter("ALL");
    setSelectedQuestionTypes([]);
  }

  function updateCreateForm(patch: Partial<CreateTestForm>) {
    setCreateForm((current) => ({ ...current, ...patch }));
  }

  function selectCreateSkill(skill: AuthoringSkill) {
    const format = defaultFormatForSkill(skill);
    setCreateForm((current) => ({
      ...current,
      skill,
      format,
      durationMinutes: defaultDuration(skill, format),
    }));
    setSelectedSourceIds([]);
  }

  function selectCreateFormat(format: CreateFormat) {
    setCreateForm((current) => ({
      ...current,
      format,
      durationMinutes: defaultDuration(current.skill, format),
    }));
    if (format !== "FULL") setSelectedSourceIds([]);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setCreateForm(defaultCreateForm);
    setSelectedSourceIds([]);
    setCreating(false);
  }

  async function handleCreateTest() {
    if (!createForm.title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const tags = Array.from(new Set([createForm.format, createForm.skill, ...parseTags(createForm.tagsText)]));
      const created = await apiFetch<TestBankItem>("/admin/test-bank", {
        method: "POST",
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim() || null,
          skill: createForm.skill,
          testType: testTypeForFormat(createForm.format),
          durationMinutes: createForm.durationMinutes,
          version: "v1.0",
          tags,
          builderContent: buildBuilderContent(createForm, selectedSourceTests),
        }),
      });
      setTests((current) => [created, ...current]);
      closeCreateModal();
      navigate(`/test-builder/${createForm.skill.toLowerCase()}/${created.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo đề thi");
      setCreating(false);
    }
  }

  async function handleArchive(test: TestBankItem) {
    const confirmed = window.confirm(`Archive đề "${test.title}"? Đề sẽ bị ẩn khỏi danh sách mặc định nhưng không bị xóa dữ liệu.`);
    if (!confirmed) return;
    try {
      await apiFetch<void>(`/admin/test-bank/${test.id}`, { method: "DELETE" });
      setTests((current) => current.filter((item) => item.id !== test.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể archive đề thi");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#8f4458]">
            NỘI DUNG ĐÀO TẠO
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#211A1D] md:text-4xl">
            Ngân hàng đề thi IELTS
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">
            Tạo, lọc, duyệt và tái sử dụng đề theo kỹ năng và cấu trúc. Khi tổ chức bài kiểm tra, bạn có thể chọn các đề đã xuất bản để ghép thành Mock, Placement hoặc Review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenBulkImport}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#e3dce2] bg-white px-4 text-sm font-bold text-[#211A1D] transition hover:bg-[#f1eef4]"
          >
            <UploadSimple size={18} weight="bold" />
            Import Excel/CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <Plus size={18} weight="bold" />
            Tạo đề mới
          </button>
        </div>
      </header>

      <section className="space-y-3" aria-label="Phân loại kỹ năng và cấu trúc đề">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#8f4458]">
            Phân loại kỹ năng &amp; cấu trúc đề
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-[#8f4458] hover:underline"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {skillCards.map((card) => (
            <SkillCard
              key={card.skill}
              config={card}
              skillFilter={skillFilter}
              formatFilter={formatFilter}
              onSelect={handleSelectSkillFormat}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[18px] border border-[#e3dce2] bg-white p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm theo tên hoặc mã đề</span>
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A6E]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên đề, mã đề, tag..."
            className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] bg-white pl-10 pr-4 text-xs focus:border-[#8f4458] focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={skillFilter}
            onChange={(event) => {
              setSkillFilter(event.target.value as TestSkill | "ALL");
              setSelectedQuestionTypes([]);
            }}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Tất cả kỹ năng</option>
            <option value="READING">Reading</option>
            <option value="LISTENING">Listening</option>
            <option value="WRITING">Writing</option>
            <option value="SPEAKING">Speaking</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ContentLifecycleStatus | "ALL")}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">Chờ duyệt</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </section>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {(skillFilter !== "ALL" || formatFilter !== "ALL") && (
          <aside className="w-full shrink-0 rounded-[18px] border border-[#e3dce2] bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:w-72">
            <div className="border-b border-[#e3dce2] pb-3">
              <h3 className="font-display text-sm font-extrabold text-[#211A1D]">Loại câu hỏi / task</h3>
              <p className="mt-1 text-[11px] leading-5 text-[#746A6E]">Lọc sâu theo tag/dạng bài đã gắn trong đề.</p>
            </div>
            <div className="mt-4 space-y-2">
              {selectedQuestionTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedQuestionTypes([])}
                  className="mb-2 text-[11px] font-bold text-[#8f4458] hover:underline"
                >
                  Xóa lựa chọn loại bài
                </button>
              )}
              {selectedTypes.map((item) => {
                const checked = selectedQuestionTypes.includes(item.id);
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuestionTypes((current) => (
                        current.includes(item.id)
                          ? current.filter((value) => value !== item.id)
                          : [...current, item.id]
                      ));
                    }}
                    className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-xl border px-3 text-left text-xs font-bold transition ${
                      checked
                        ? "border-[#8f4458]/30 bg-[#f7e7ec] text-[#8f4458]"
                        : "border-transparent text-[#211A1D] hover:bg-[#f8f6fa]"
                    }`}
                  >
                    <span className={`grid h-5 w-5 place-items-center rounded-md border shrink-0 ${checked ? "border-[#8f4458] bg-[#8f4458]" : "border-[#cdbfc6] bg-white"}`}>
                      {checked && <Check size={13} weight="bold" className="text-white" />}
                    </span>
                    {ItemIcon && (
                      <span className={`grid h-6 w-6 place-items-center rounded-lg ${item.iconBg ?? "bg-stone-100"} ${item.iconColor ?? "text-stone-700"} shrink-0`}>
                        <ItemIcon size={14} weight="fill" />
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        <section className="min-w-0 flex-1">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-[#b4232d]">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-[18px] border border-[#e3dce2] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3dce2] bg-[#fbf9fb] px-4 py-3">
              <div>
                <h2 className="font-display text-sm font-extrabold text-[#211A1D]">Danh sách đề thi</h2>
                <p className="text-[11px] text-[#746A6E]">
                  {loading ? "Đang tải..." : `Hiển thị ${filteredTests.length} đề`}
                </p>
              </div>
              <span className="rounded-full bg-[#f7e7ec] px-3 py-1 text-[11px] font-bold text-[#8f4458]">
                API-backed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#f1eef4] text-[11px] font-bold uppercase tracking-wider text-[#746A6E]">
                    <th className="p-3.5">Mã &amp; tên đề</th>
                    <th className="p-3.5">Kỹ năng</th>
                    <th className="p-3.5">Cấu trúc</th>
                    <th className="p-3.5">Số câu</th>
                    <th className="p-3.5">Thời lượng</th>
                    <th className="p-3.5">Phiên bản</th>
                    <th className="p-3.5">Cập nhật</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3dce2]">
                  {loading && (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-[#746A6E]">
                        <SpinnerGap className="mr-2 inline animate-spin" />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredTests.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-[#746A6E]">
                        Chưa có đề thi phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-[#f8f6fa]">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
                            <Exam size={18} weight="duotone" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-[#8f4458]">{test.code}</span>
                            <p className="max-w-[320px] truncate font-semibold text-[#211A1D]">{test.title}</p>
                            {test.tags.length > 0 && (
                              <p className="mt-0.5 max-w-[320px] truncate text-[11px] text-[#746A6E]">
                                {test.tags.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-[#211A1D]">{test.skill}</td>
                      <td className="p-3.5 font-semibold text-[#211A1D]">{formatLabels[formatOf(test)]}</td>
                      <td className="p-3.5 font-semibold text-[#211A1D]">{test.totalQuestions} câu</td>
                      <td className="p-3.5 text-[#746A6E]">{test.durationMinutes} phút</td>
                      <td className="p-3.5 font-bold text-[#8f4458]">{test.version}</td>
                      <td className="p-3.5 text-[#746A6E]">{dateLabel(test.updatedAt)}</td>
                      <td className="p-3.5">{statusBadge(test.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTest(test)}
                            className="rounded-lg p-1.5 text-[#746A6E] hover:bg-[#f1eef4]"
                            title="Xem trước"
                            aria-label={`Xem trước ${test.title}`}
                          >
                            <Eye size={16} />
                          </button>
                          <Link
                            to={`/test-builder/${test.skill.toLowerCase()}/${test.id}`}
                            className="rounded-lg p-1.5 text-[#8f4458] hover:bg-[#f7e7ec]"
                            title="Mở Test Builder"
                            aria-label={`Mở Test Builder cho ${test.title}`}
                          >
                            <NotePencil size={16} />
                          </Link>
                          {test.status !== "PUBLISHED" && test.status !== "ARCHIVED" && (
                            <button
                              type="button"
                              onClick={() => setPublishingTest(test)}
                              className="rounded-lg p-1.5 text-[#237653] hover:bg-emerald-50"
                              title="Xuất bản"
                              aria-label={`Xuất bản ${test.title}`}
                            >
                              <ShieldCheck size={16} />
                            </button>
                          )}
                          {test.status !== "ARCHIVED" && (
                            <button
                              type="button"
                              onClick={() => void handleArchive(test)}
                              className="rounded-lg p-1.5 text-[#b4232d] hover:bg-rose-50"
                              title="Archive đề"
                              aria-label={`Archive ${test.title}`}
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="custom-scrollbar max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[24px] bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#e3dce2] p-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8f4458]">
                  Test Bank Builder
                </span>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-[#211A1D]">Khởi tạo đề thi mới</h3>
                <p className="mt-1 text-sm text-[#746A6E]">
                  Chọn kỹ năng, loại đề và cấu hình ban đầu. Sau khi tạo, hệ thống mở builder tương ứng.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e3dce2] text-[#746A6E] hover:bg-[#f1eef4]"
                aria-label="Đóng modal tạo đề"
              >
                ×
              </button>
            </header>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                    Tên đề thi *
                  </label>
                  <input
                    value={createForm.title}
                    onChange={(event) => updateCreateForm({ title: event.target.value })}
                    placeholder="VD: IELTS Reading Passage 1 - Form Completion Strategy"
                    className="min-h-[46px] w-full rounded-xl border border-[#e3dce2] px-3.5 text-sm focus:border-[#8f4458] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                    Kỹ năng
                  </span>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {skillCards.map((item) => {
                      const Icon = item.icon;
                      const selected = createForm.skill === item.skill;
                      return (
                        <button
                          key={item.skill}
                          type="button"
                          onClick={() => selectCreateSkill(item.skill)}
                          className={`min-h-[86px] rounded-2xl border p-3 text-left transition ${
                            selected
                              ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447] ring-2 ring-[#8f4458]/15"
                              : "border-[#e3dce2] bg-white text-[#211A1D] hover:bg-[#f8f6fa]"
                          }`}
                        >
                          <Icon size={22} weight="duotone" />
                          <span className="mt-2 block text-sm font-extrabold">{item.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[#746A6E]">{item.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                    Loại đề / section
                  </span>
                  <div className="grid gap-3 md:grid-cols-2">
                    {skillCards.find((item) => item.skill === createForm.skill)?.formats.map((format) => {
                      const selected = createForm.format === format.value;
                      return (
                        <button
                          key={format.value}
                          type="button"
                          onClick={() => selectCreateFormat(format.value)}
                          className={`min-h-[74px] rounded-2xl border p-4 text-left transition ${
                            selected ? "border-[#8f4458] bg-[#f7e7ec]" : "border-[#e3dce2] bg-white hover:bg-[#f8f6fa]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-display text-sm font-extrabold text-[#211A1D]">{format.label}</span>
                            <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? "border-[#8f4458] bg-[#8f4458]" : "border-[#cdbfc6]"}`}>
                              {selected && <Check size={12} weight="bold" className="text-white" />}
                            </span>
                          </span>
                          <span className="mt-1 block text-[11px] leading-4 text-[#746A6E]">{format.helper}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {createForm.skill === "READING" && createForm.format === "FULL" && (
                  <div className="rounded-2xl border border-[#e3dce2] bg-[#fbf9fb] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display text-sm font-extrabold text-[#211A1D]">Ghép Reading Full Test từ Passage đã tạo</h4>
                        <p className="mt-1 text-xs leading-5 text-[#746A6E]">
                          Chọn tối đa 3 Reading passage lẻ. Chưa đủ 3 passage vẫn tạo được, các slot còn lại sẽ để trống để hoàn thiện sau.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#8f4458]">
                        {selectedSourceIds.length}/3
                      </span>
                    </div>

                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                      {readingSingleSources.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#e3dce2] bg-white p-4 text-sm text-[#746A6E]">
                          Chưa có passage lẻ để ghép. Bạn có thể tạo full test trống rồi bổ sung passage trong builder.
                        </div>
                      )}
                      {readingSingleSources.map((test) => {
                        const selected = selectedSourceIds.includes(test.id);
                        const disabled = !selected && selectedSourceIds.length >= 3;
                        return (
                          <button
                            key={test.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedSourceIds((current) => (
                                current.includes(test.id)
                                  ? current.filter((id) => id !== test.id)
                                  : [...current, test.id].slice(0, 3)
                              ));
                            }}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                              selected
                                ? "border-[#8f4458] bg-[#f7e7ec]"
                                : "border-[#e3dce2] bg-white hover:bg-[#f8f6fa] disabled:cursor-not-allowed disabled:opacity-50"
                            }`}
                          >
                            <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border ${selected ? "border-[#8f4458] bg-[#8f4458]" : "border-[#cdbfc6]"}`}>
                              {selected && <Check size={12} weight="bold" className="text-white" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-[#8f4458]">{test.code} • {formatLabels[formatOf(test)]}</span>
                              <span className="block truncate text-sm font-bold text-[#211A1D]">{test.title}</span>
                              <span className="block text-[11px] text-[#746A6E]">{test.totalQuestions} câu • cập nhật {dateLabel(test.updatedAt)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                      Thời lượng phút
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={createForm.durationMinutes}
                      onChange={(event) => updateCreateForm({ durationMinutes: Number(event.target.value) })}
                      className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                      Tags
                    </label>
                    <input
                      value={createForm.tagsText}
                      onChange={(event) => updateCreateForm({ tagsText: event.target.value })}
                      placeholder="Cam 18, T/F/NG, Forecast..."
                      className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5f565b]">
                    Ghi chú mô tả
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(event) => updateCreateForm({ description: event.target.value })}
                    placeholder="Mô tả nguồn đề, cách sử dụng, lưu ý cho giáo viên..."
                    className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm focus:border-[#8f4458] focus:outline-none"
                  />
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-[#e3dce2] bg-[#f8f6fa] p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#8f4458] shadow-sm">
                    <Cards size={20} weight="duotone" />
                  </span>
                  <h4 className="mt-4 font-display text-lg font-extrabold text-[#211A1D]">Tóm tắt cấu hình</h4>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#746A6E]">Kỹ năng</dt>
                      <dd className="font-bold text-[#211A1D]">{skillLabels[createForm.skill]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#746A6E]">Loại đề</dt>
                      <dd className="font-bold text-[#211A1D]">{formatLabels[createForm.format]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#746A6E]">Dự kiến</dt>
                      <dd className="font-bold text-[#211A1D]">{expectedQuestionCount(createForm.skill, createForm.format)} câu</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#746A6E]">Thời lượng</dt>
                      <dd className="font-bold text-[#211A1D]">{createForm.durationMinutes} phút</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-start gap-2">
                    <WarningCircle size={18} className="mt-0.5 shrink-0 text-[#8a6000]" />
                    <p className="text-xs leading-5 text-[#6f4f00]">
                      Bước này chỉ khởi tạo draft. Đề chỉ hiển thị cho học viên sau khi builder được hoàn thiện và xuất bản.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[#e3dce2] p-5">
              <button
                type="button"
                onClick={closeCreateModal}
                className="min-h-[42px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold text-[#211A1D] hover:bg-[#f1eef4]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleCreateTest()}
                disabled={!createForm.title.trim() || createForm.durationMinutes <= 0 || creating}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
                {creating ? "Đang tạo..." : "Tạo draft & mở builder"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {publishingTest && (
        <PublishValidationModal
          test={publishingTest}
          onClose={() => setPublishingTest(null)}
          onPublished={async () => {
            const updated = await apiFetch<TestBankItem>(`/admin/test-bank/${publishingTest.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: "PUBLISHED" }),
            });
            setTests((current) => current.map((test) => (test.id === updated.id ? updated : test)));
            setPublishingTest(null);
          }}
        />
      )}

      {previewTest && (
        <TestPreviewModal test={previewTest} onClose={() => setPreviewTest(null)} />
      )}
    </div>
  );
}
