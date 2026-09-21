export type ReadingFontScale = "standard" | "large" | "extra-large";

export const READING_FONT_SCALE_STORAGE_KEY = "ielts_exam_text_size_v2";

export const READING_FONT_SCALE_OPTIONS: Array<{
  value: ReadingFontScale;
  label: string;
  glyph: string;
  pixels: number;
  points: number;
  lineHeight: number;
}> = [
  { value: "standard", label: "Nhỏ", glyph: "S", pixels: 14, points: 10, lineHeight: 1.6 },
  { value: "large", label: "Vừa", glyph: "M", pixels: 18, points: 13, lineHeight: 1.65 },
  { value: "extra-large", label: "Lớn", glyph: "L", pixels: 22, points: 16, lineHeight: 1.7 },
];

export function isReadingFontScale(value: string | null): value is ReadingFontScale {
  return value === "standard" || value === "large" || value === "extra-large";
}

export function migrateLegacyReadingFontScale(value: string | null): ReadingFontScale {
  if (value === "normal" || value === "medium") return "large";
  if (value === "large") return "extra-large";
  return "standard";
}
