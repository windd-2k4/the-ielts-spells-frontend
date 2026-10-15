"use client";

import { useEffect, useState } from "react";
import { BookOpen, Microphone, SpinnerGap } from "@phosphor-icons/react";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";

export interface CourseCoverMediaImageProps {
  coverImageUrl?: string | null;
  coverImageAltText?: string | null;
  courseName: string;
  skillPair?: string | null; // "LISTENING_READING" | "SPEAKING_WRITING" or text containing Listening
  className?: string;
  imageClassName?: string;
}

export function CourseCoverMediaImage({
  coverImageUrl,
  coverImageAltText,
  courseName,
  skillPair,
  className = "w-full h-full",
  imageClassName = "w-full h-full object-cover",
}: CourseCoverMediaImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(coverImageUrl));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!coverImageUrl) {
      setObjectUrl(null);
      setLoading(false);
      setHasError(false);
      return;
    }

    let active = true;
    let nextObjectUrl = "";
    setLoading(true);
    setHasError(false);

    apiMediaUrl(coverImageUrl)
      .then((url) => {
        if (!active) return;
        nextObjectUrl = url;
        setObjectUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setHasError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (nextObjectUrl) {
        revokeMediaUrl(nextObjectUrl);
      }
    };
  }, [coverImageUrl]);

  const isLR =
    skillPair === "LISTENING_READING" ||
    (skillPair != null && skillPair.toLowerCase().includes("listening"));

  // If we have a successfully loaded object URL and no error, render the actual cover image
  if (objectUrl && !hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={objectUrl}
          alt={coverImageAltText || `Ảnh minh họa khóa học ${courseName}`}
          className={imageClassName}
          loading="lazy"
        />
      </div>
    );
  }

  // If loading the custom image, show a smooth skeleton shimmer
  if (loading) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden animate-pulse ${
          isLR ? "bg-[#FDF2F4]" : "bg-[#F6EEFD]"
        } ${className}`}
        aria-label="Đang tải ảnh khóa học"
      >
        <SpinnerGap
          size={24}
          className={`animate-spin ${isLR ? "text-[#894C5B]" : "text-[#7C3AED]"}`}
          aria-hidden="true"
        />
      </div>
    );
  }

  // Fallback: If no cover image was provided ("không có thì không để") or failed to load,
  // render the exact skill placeholder matching the management web design!
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden select-none ${
        isLR ? "bg-[#FDF2F4]" : "bg-[#F6EEFD]"
      } ${className}`}
      aria-label={isLR ? "Khóa học Listening & Reading" : "Khóa học Speaking & Writing"}
    >
      {/* Decorative concentric geometric rings */}
      <span
        className={`absolute -right-8 -top-12 h-36 w-36 rounded-full border-[24px] opacity-35 ${
          isLR ? "border-[#894C5B]/20" : "border-[#7C3AED]/20"
        }`}
        aria-hidden="true"
      />
      <span
        className={`absolute -bottom-12 -left-8 h-28 w-28 rounded-full opacity-50 ${
          isLR ? "bg-[#894C5B]/10" : "bg-[#7C3AED]/20"
        }`}
        aria-hidden="true"
      />

      {/* Centered skill badge tile */}
      <div className="relative z-1 flex flex-col items-center gap-2 text-center px-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/90 shadow-xs ${
            isLR ? "text-[#894C5B]" : "text-[#7C3AED]"
          }`}
        >
          {isLR ? (
            <BookOpen size={26} weight="duotone" aria-hidden="true" />
          ) : (
            <Microphone size={26} weight="duotone" aria-hidden="true" />
          )}
        </span>
        <span className="text-xs font-bold text-[#6F676C]">
          {isLR ? "Listening & Reading" : "Speaking & Writing"}
        </span>
      </div>
    </div>
  );
}
