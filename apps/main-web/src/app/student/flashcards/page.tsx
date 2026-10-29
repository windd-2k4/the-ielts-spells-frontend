import { FlashcardNotebook } from "@/features/flashcards/FlashcardNotebook";
import { Suspense } from "react";

export default function StudentFlashcardsPage() {
  return <Suspense fallback={null}><FlashcardNotebook /></Suspense>;
}

