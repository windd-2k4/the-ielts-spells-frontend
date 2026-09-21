import {
  Article,
  Cards,
  ChartBar,
  ChartLineUp,
  ChartPie,
  Chats,
  CheckCircle,
  Checks,
  ClipboardText,
  Compass,
  GitMerge,
  ListChecks,
  ListNumbers,
  MapPin,
  Notebook,
  NotePencil,
  PuzzlePiece,
  Table,
  Tag,
  Textbox,
  TextColumns,
  ThumbsUp,
  TreeStructure,
  TrendUp,
  User,
} from "@phosphor-icons/react";
import type { IeltsSkill } from "@ielts/contracts";
import type { ComponentType } from "react";

type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}>;

export type PracticeQuestionType = {
  id: string;
  label: string;
  icon: PhosphorIcon;
  iconBg: string;
  iconColor: string;
};

export const questionTypesBySkill: Record<IeltsSkill, PracticeQuestionType[]> = {
  READING: [
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
  ],
  LISTENING: [
    { id: "FILL_IN_BLANK", label: "Form / Note / Table Completion", icon: ClipboardText, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { id: "MAP_DIAGRAM_LABEL", label: "Map / Diagram Label", icon: Compass, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
    { id: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: ListChecks, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { id: "MULTIPLE_ANSWERS", label: "Multiple Answers", icon: Checks, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
    { id: "MATCHING_INFORMATION", label: "Matching", icon: PuzzlePiece, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { id: "SUMMARY_COMPLETION", label: "Summary Completion", icon: Notebook, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  ],
  WRITING: [
    { id: "LINE_GRAPH", label: "Line Graph", icon: TrendUp, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    { id: "BAR_CHART", label: "Bar Chart", icon: ChartBar, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { id: "PIE_CHART", label: "Pie Chart", icon: ChartPie, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { id: "TABLE", label: "Table", icon: Table, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { id: "MIXED_GRAPH", label: "Mixed Graph", icon: ChartLineUp, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { id: "MAP", label: "Map", icon: MapPin, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
    { id: "PROCESS", label: "Process", icon: GitMerge, iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
    { id: "ESSAY", label: "Essay Task 2", icon: Article, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
  ],
  SPEAKING: [
    { id: "PERSONAL_QUESTIONS", label: "Personal Questions", icon: User, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { id: "CUE_CARD", label: "Cue Card", icon: Cards, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { id: "DISCUSSION", label: "Discussion", icon: Chats, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  ],
};

export function questionTypeOption(skill: IeltsSkill, id: string) {
  return questionTypesBySkill[skill].find((item) => item.id === id);
}
