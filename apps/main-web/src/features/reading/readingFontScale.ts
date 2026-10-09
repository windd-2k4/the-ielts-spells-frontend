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
  { value: "standard", label: "Nhỏ", glyph: "S", pixels: 12, points: 9, lineHeight: 4 / 3 },
  { value: "large", label: "Vừa", glyph: "M", pixels: 16, points: 12, lineHeight: 1.5 },
  { value: "extra-large", label: "Lớn", glyph: "L", pixels: 20, points: 15, lineHeight: 1.6 },
];

export function isReadingFontScale(value: string | null): value is ReadingFontScale {
  return value === "standard" || value === "large" || value === "extra-large";
}

export function migrateLegacyReadingFontScale(value: string | null): ReadingFontScale {
  if (value === "normal" || value === "medium") return "large";
  if (value === "large") return "extra-large";
  return "standard";
}
