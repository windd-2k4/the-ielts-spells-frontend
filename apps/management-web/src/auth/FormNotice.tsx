import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

export function FormNotice({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div className={`form-notice ${kind}`} role={kind === "error" ? "alert" : "status"} aria-live="polite">
      {kind === "error" ? <WarningCircle weight="fill" /> : <CheckCircle weight="fill" />}
      <span>{children}</span>
    </div>
  );
}
