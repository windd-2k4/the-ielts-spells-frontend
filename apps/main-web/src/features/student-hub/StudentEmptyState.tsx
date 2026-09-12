"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight } from "@phosphor-icons/react";

interface StudentEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  compact?: boolean;
}

export function StudentEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  compact = false,
}: StudentEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#E5DFD3] bg-[#FFFDF7] ${
        compact ? "p-5 sm:p-6" : "p-8 sm:p-12"
      }`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FEF9C3] text-[#894C5B] border border-[#F3E8C4] flex items-center justify-center mb-3.5 shadow-xs">
        {icon || <FolderOpen size={28} weight="duotone" className="text-[#894C5B]" />}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-[#1E1B18] mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-[#78726A] max-w-md leading-relaxed mb-4">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#894C5B] text-white hover:bg-[#723c4a] shadow-sm transition-all active:scale-95"
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      )}

      {actionLabel && !actionHref && onActionClick && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#894C5B] text-white hover:bg-[#723c4a] shadow-sm transition-all active:scale-95"
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}
