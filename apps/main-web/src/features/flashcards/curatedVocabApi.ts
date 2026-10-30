"use client";

import { apiFetch } from "@/lib/api";
import { VocabularyCard, VocabularyMasteryStatus } from "./flashcardApi";

export type DeckCategory = "BASIC" | "ADVANCED" | "INTENSIVE";

export interface CuratedDeckSummary {
  id: string;
  slug: string;
  name: string;
  category: DeckCategory;
  description: string;
  totalWords: number;
  notLearnedCount: number;
  familiarCount: number;
  masteredCount: number;
  orderIndex: number;
}

export interface SentenceChunk {
  vi: string;
  en: string;
}

export interface SentenceExercise {
  vi: string;
  en: string;
  ck?: SentenceChunk[];
}

export interface CuratedExerciseJson {
  cwe?: SentenceExercise;
  cwh?: SentenceExercise;
  w3e?: SentenceExercise;
  w3h?: SentenceExercise;
}

export interface CuratedVocabItem {
  id: string;
  deckId: string;
  term: string;
  partOfSpeech: string | null;
  phonetic: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleSentenceVi: string | null;
  chunk: string | null;
  collocationsJson: string | null;
  exerciseJson: string | null;
  tip: string | null;
  drillsJson: string | null;
  orderIndex: number;
  masteryStatus: VocabularyMasteryStatus;
  reviewCount: number;
  lastReviewedAt: string | null;
  savedInNotebook: boolean;
}

export interface CuratedDeckDetail {
  deck: CuratedDeckSummary;
  items: CuratedVocabItem[];
}

export interface CuratedStudySession {
  deckId: string;
  deckName: string;
  sessionSize: number;
  items: CuratedVocabItem[];
}

export function getCuratedDecks() {
  return apiFetch<CuratedDeckSummary[]>("/student/curated-vocabulary/decks");
}

export function getCuratedDeckDetail(deckId: string) {
  return apiFetch<CuratedDeckDetail>(`/student/curated-vocabulary/decks/${deckId}`);
}

export function startCuratedStudySession(deckId: string) {
  return apiFetch<CuratedStudySession>(`/student/curated-vocabulary/decks/${deckId}/session`);
}

export function updateCuratedItemProgress(
  deckId: string,
  itemId: string,
  masteryStatus: VocabularyMasteryStatus
) {
  return apiFetch<CuratedVocabItem>(
    `/student/curated-vocabulary/decks/${deckId}/items/${itemId}/progress`,
    {
      method: "PATCH",
      body: JSON.stringify({ masteryStatus }),
    }
  );
}

export function saveCuratedItemToNotebook(itemId: string) {
  return apiFetch<VocabularyCard>(
    `/student/curated-vocabulary/items/${itemId}/save-to-notebook`,
    {
      method: "POST",
    }
  );
}
