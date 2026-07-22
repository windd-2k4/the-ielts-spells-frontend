import { ArrowClockwise, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
          {eyebrow}
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-on-background">
          {title}
        </h1>
        <p className="text-sm md:text-body-md text-on-surface-variant mt-1 max-w-2xl">
          {description}
        </p>
      </div>
      {action && <div className="flex shrink-0">{action}</div>}
    </header>
  );
}

export function PrimaryAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      className="bg-primary hover:opacity-90 active:scale-[0.98] text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
      onClick={onClick}
    >
      <Plus size={16} weight="bold" />
      {children}
    </button>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative flex items-center w-full md:w-80">
      <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
        search
      </span>
      <input
        className="w-full pl-10 pr-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all placeholder:text-outline"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function LoadState({ loading, error, empty, onRetry }: { loading: boolean; error: string; empty: boolean; onRetry: () => void }) {
  if (loading) {
    return (
      <div className="space-y-3 py-6" aria-label="Đang tải">
        <div className="h-16 w-full bg-surface-container-highest/40 animate-pulse rounded-xl" />
        <div className="h-16 w-full bg-surface-container-highest/40 animate-pulse rounded-xl" />
        <div className="h-16 w-full bg-surface-container-highest/40 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-error-container/10 border border-error/20 p-8 rounded-2xl text-center space-y-3" role="alert">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
        <h3 className="font-display font-semibold text-on-surface text-lg">Không tải được dữ liệu</h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-surface hover:bg-surface-container-high border border-outline-variant/60 text-on-surface px-4 py-2 rounded-xl text-sm font-label-md transition-colors"
        >
          <ArrowClockwise size={16} />
          Thử lại
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/30 p-10 rounded-2xl text-center space-y-3">
        <span className="material-symbols-outlined text-outline text-4xl">inbox</span>
        <h3 className="font-display font-semibold text-on-surface text-lg">Chưa có dữ liệu</h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto">Hãy tạo bản ghi đầu tiên để bắt đầu quản lý học vụ.</p>
      </div>
    );
  }
  return null;
}

export function Drawer({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-sm flex justify-end"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="bg-surface w-full max-w-lg h-full p-6 md:p-8 shadow-2xl flex flex-col overflow-y-auto transform transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{description}</p>
          </div>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant/60 rounded-xl bg-surface hover:bg-surface-container text-on-surface transition-colors"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1">{children}</div>
      </aside>
    </div>
  );
}

export function StatusBadge({ value, children }: { value: string; children: ReactNode }) {
  const norm = value.toLowerCase();
  let colorClasses = "bg-surface-container text-on-surface-variant border-outline-variant/50";
  
  if (["active", "in_progress", "enrolling", "true"].includes(norm)) {
    colorClasses = "bg-primary-container/20 text-primary border-primary/20";
  } else if (["inactive", "cancelled", "dropped", "offboarded", "false"].includes(norm)) {
    colorClasses = "bg-error-container/20 text-error border-error/20";
  } else if (["planned", "pending", "invited"].includes(norm)) {
    colorClasses = "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary-fixed/40";
  } else if (["completed"].includes(norm)) {
    colorClasses = "bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed/50";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colorClasses}`}>
      {children}
    </span>
  );
}
