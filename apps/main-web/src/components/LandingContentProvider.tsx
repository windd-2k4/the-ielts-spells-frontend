"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { PublicLandingContent, PublicLandingSection } from "@/lib/landingContent";

const LandingContentContext = createContext<PublicLandingContent | null>(null);

export function LandingContentProvider({ content, children }: { content: PublicLandingContent | null; children: ReactNode }) {
  return <LandingContentContext.Provider value={content}>{children}</LandingContentContext.Provider>;
}

export function useLandingSection(id: string): PublicLandingSection | null {
  const content = useContext(LandingContentContext);
  return content?.sections.find((section) => section.id === id && section.enabled !== false) ?? null;
}
