"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight } from "@phosphor-icons/react";

interface StudentEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  badgeTag?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  compact?: boolean;
}

export function StudentEmptyState({
  icon,
  title,
  description,
  badgeTag,
  actionLabel,
  actionHref,
  onActionClick,
  secondaryActionLabel,
  secondaryActionHref,
  compact = false,
}: StudentEmptyStateProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#E5DFD3] bg-gradient-to-b from-[#FFFDF9] to-[#FEFBF2] ${
        compact ? "p-5 sm:p-6" : "p-8 sm:p-12"
      } shadow-2xs transition-all hover:border-[#D0C5B0]`}
    >
      {badgeTag && (
        <span className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F7E5EA] text-[#894C5B] border border-[#F0C4CE]/50">
          {badgeTag}
        </span>
      )}

      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FEF9C3] text-[#894C5B] border border-[#F3E8C4] flex items-center justify-center mb-3.5 shadow-xs relative group">
        <div className="absolute inset-0 rounded-2xl bg-[#F5C842]/20 blur-sm group-hover:blur-md transition-all -z-10" />
        {icon || <FolderOpen size={28} weight="duotone" className="text-[#894C5B]" />}
      </div>

      <h4 className="text-base sm:text-lg font-bold text-[#1E1B18] mb-1 font-sans">{title}</h4>
      <p className="text-xs sm:text-sm text-[#78726A] max-w-md leading-relaxed mb-5">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#894C5B] text-white hover:bg-[#723c4a] shadow-sm transition-all active:scale-95"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        )}

        {actionLabel && !actionHref && onActionClick && (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#894C5B] text-white hover:bg-[#723c4a] shadow-sm transition-all active:scale-95"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        )}

        {secondaryActionLabel && secondaryActionHref && (
          <Link
            href={secondaryActionHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white text-[#5C5752] hover:text-[#1E1B18] border border-[#E8E2D5] hover:bg-[#FEF9C3] transition-all"
          >
            <span>{secondaryActionLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

