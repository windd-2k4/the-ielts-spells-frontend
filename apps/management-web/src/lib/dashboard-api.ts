import type { Course } from "../academic-types";
import { apiFetch } from "./api";

export type AdminDashboard = {
  activeEnrollments: number;
  openCourses: number;
  activeCourses: number;
  totalCourses: number;
  upcomingCourses: Array<{
    id: string;
    code: string;
    name: string;
    capacity: number;
    startsOn: string;
    status: Course["status"];
  }>;
};

export type ContentHubDashboard = {
  summary: {
    resources: number;
    tests: number;
    media: number;
    awaitingReview: number;
    inUse: number;
  };
  recentResources: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    skill: string;
    updatedAt: string;
  }>;
  draftTests: Array<{
    id: string;
    code: string;
    title: string;
    skill: string;
    totalQuestions: number;
    updatedAt: string;
  }>;
};

const pending = new Map<string, Promise<unknown>>();

function deduplicatedGet<T>(path: string): Promise<T> {
  const existing = pending.get(path) as Promise<T> | undefined;
  if (existing) return existing;

  const request = apiFetch<T>(path).finally(() => {
    if (pending.get(path) === request) pending.delete(path);
  });
  pending.set(path, request);
  return request;
}

export function getAdminDashboard() {
  return deduplicatedGet<AdminDashboard>("/admin/dashboard");
}

export function getContentHubDashboard() {
  return deduplicatedGet<ContentHubDashboard>("/admin/library/dashboard");
}
