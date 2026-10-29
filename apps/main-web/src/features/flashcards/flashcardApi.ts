"use client";

import { apiFetch } from "@/lib/api";

export type VocabularyMasteryStatus = "NOT_LEARNED" | "FAMILIAR" | "MASTERED";

export interface VocabularyTopic {
  id: string;
  name: string;
  cardCount: number;
  masteredCount: number;
}

export interface VocabularyCard {
  id: string;
  topicId: string;
  term: string;
  meaning: string | null;
  exampleSentence: string | null;
  partOfSpeech: string | null;
  note: string | null;
  sourceLabel: string | null;
  masteryStatus: VocabularyMasteryStatus;
  createdAt: string;
  lastReviewedAt: string | null;
}

export interface VocabularyNotebook {
  summary: { total: number; notLearned: number; familiar: number; mastered: number };
  topics: VocabularyTopic[];
  cards: VocabularyCard[];
}

export interface SaveVocabularyCardInput {
  topicId?: string | null;
  term: string;
  meaning?: string | null;
  exampleSentence?: string | null;
  partOfSpeech?: string | null;
  note?: string | null;
  sourceLabel?: string | null;
}

export function getVocabularyNotebook() {
  return apiFetch<VocabularyNotebook>("/student/vocabulary");
}

export function createVocabularyTopic(name: string) {
  return apiFetch<VocabularyTopic>("/student/vocabulary/topics", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function addVocabularyCard(input: SaveVocabularyCardInput) {
  return apiFetch<VocabularyCard>("/student/vocabulary/cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVocabularyCard(cardId: string, input: SaveVocabularyCardInput) {
  return apiFetch<VocabularyCard>(`/student/vocabulary/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateVocabularyMastery(cardId: string, status: VocabularyMasteryStatus) {
  return apiFetch<VocabularyCard>(`/student/vocabulary/cards/${cardId}/mastery`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteVocabularyCard(cardId: string) {
  return apiFetch<void>(`/student/vocabulary/cards/${cardId}`, { method: "DELETE" });
}

