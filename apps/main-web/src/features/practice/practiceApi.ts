"use client";

import type {
  IeltsSkill,
  PageResponse,
  PracticeProgressFilter,
  StudentPracticeCatalogItem,
} from "@ielts/contracts";
import { apiFetch } from "@/lib/api";

export interface PracticeCatalogQuery {
  skill: IeltsSkill;
  query?: string;
  testType?: "ALL" | "FULL_TEST" | "SINGLE_SKILL";
  format?: string;
  questionTypes?: string[];
  progress?: PracticeProgressFilter;
  page?: number;
  size?: number;
}

export function getPracticeCatalog(filters: PracticeCatalogQuery) {
  const params = new URLSearchParams({
    skill: filters.skill,
    testType: filters.testType ?? "ALL",
    format: filters.format ?? "ALL",
    progress: filters.progress ?? "ALL",
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 24),
  });
  if (filters.query?.trim()) params.set("query", filters.query.trim());
  if (filters.questionTypes?.length) params.set("questionTypes", filters.questionTypes.join(","));
  return apiFetch<PageResponse<StudentPracticeCatalogItem>>(`/student/practice-tests?${params.toString()}`);
}
