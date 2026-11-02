"use client";

import { apiFetch, apiKeepalivePost } from "@/lib/api";

export interface AdaptiveRecommendation {
  id: string;
  componentCode: string;
  componentName: string;
  masteryProbability: number;
  confidence: number;
  evidenceCount: number;
  title: string;
  reason: string;
  durationMinutes: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  href: string;
  createdAt: string;
}

export function getAdaptiveRecommendation(signal?: AbortSignal) {
  return apiFetch<AdaptiveRecommendation | undefined>(
    "/student/adaptive-learning/recommendation",
    { signal },
  );
}

export function acceptAdaptiveRecommendation(recommendationId: string) {
  return apiKeepalivePost(
    `/student/adaptive-learning/recommendations/${recommendationId}/accept`,
  );
}

