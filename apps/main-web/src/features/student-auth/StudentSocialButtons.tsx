"use client";

import { FacebookLogo, GoogleLogo } from "@phosphor-icons/react";

type Props = {
  compact?: boolean;
  disabled?: boolean;
  onSelect: (provider: "google" | "facebook") => void;
};

export function StudentSocialButtons({ compact = false, disabled, onSelect }: Props) {
  return <div className={`${compact ? "mt-4" : "mt-6"} grid gap-3 sm:grid-cols-2`}>
    <button
      type="button"
      onClick={() => onSelect("google")}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--text)] transition hover:border-[#cfc0c4] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "min-h-11" : "min-h-12"}`}
    >
      <GoogleLogo size={21} weight="bold" aria-hidden="true" /> Google
    </button>
    <button
      type="button"
      onClick={() => onSelect("facebook")}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--text)] transition hover:border-[#cfc0c4] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "min-h-11" : "min-h-12"}`}
    >
      <FacebookLogo className="text-[#2563a8]" size={21} weight="fill" aria-hidden="true" /> Facebook
    </button>
  </div>;
}
