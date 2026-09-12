"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  compact?: boolean;
  label: string;
  error?: string;
};

export function StudentPasswordField({ compact = false, label, error, id, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return <div>
    <label htmlFor={id} className={`${compact ? "mb-1.5" : "mb-2"} block text-sm font-bold text-[var(--text)]`}>{label}</label>
    <div className="relative">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${compact ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-[var(--border)] bg-white px-4 pr-12 text-base text-[var(--text)] outline-none transition placeholder:text-[#aaa2a5] focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={props.disabled}
        className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
      >
        {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
    {error ? <p id={errorId} className="mt-1.5 text-sm text-[var(--danger)]">{error}</p> : null}
  </div>;
}
