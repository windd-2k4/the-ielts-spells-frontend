export type PublicLandingSection = {
  id: string;
  type: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryCta?: string;
  secondaryCta?: string;
  mediaPath?: string;
  enabled?: boolean;
};

export type PublicLandingContent = {
  sections: PublicLandingSection[];
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1").replace(/\/$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function getPublicLandingContent(): Promise<PublicLandingContent | null> {
  try {
    const response = await fetch(`${apiUrl}/public/home`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !isRecord(payload.landingPage) || !isRecord(payload.landingPage.content)) return null;
    const rawSections = payload.landingPage.content.sections;
    if (!Array.isArray(rawSections)) return null;

    return {
      sections: rawSections.flatMap((value) => {
        if (!isRecord(value)) return [];
        const id = readString(value.id);
        if (!id) return [];
        return [{
          id,
          type: readString(value.type) ?? "feature",
          eyebrow: readString(value.eyebrow),
          title: readString(value.title),
          description: readString(value.description),
          primaryCta: readString(value.primaryCta),
          secondaryCta: readString(value.secondaryCta),
          mediaPath: readString(value.mediaPath),
          enabled: value.enabled !== false,
        }];
      }),
    };
  } catch {
    // The existing static landing page remains the safe public fallback when CMS is unavailable.
    return null;
  }
}
