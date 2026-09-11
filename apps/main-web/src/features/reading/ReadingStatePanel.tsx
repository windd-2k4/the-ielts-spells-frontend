import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

type ReadingStatePanelProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "error";
};

export function ReadingStatePanel({ title, message, actionLabel, onAction, tone = "neutral" }: ReadingStatePanelProps) {
  const iconClass = tone === "error" ? "text-[var(--danger)]" : "text-[var(--brand-pink)]";
  return <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center shadow-[var(--shadow)]" role={tone === "error" ? "alert" : undefined}>
    <WarningCircle size={34} className={`mx-auto ${iconClass}`} weight="fill" aria-hidden="true" />
    <h2 className="mt-4 text-xl font-bold text-[var(--text)]">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">{message}</p>
    {actionLabel && onAction ? <button type="button" onClick={onAction} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2"><ArrowClockwise size={18} aria-hidden="true" />{actionLabel}</button> : null}
  </section>;
}
