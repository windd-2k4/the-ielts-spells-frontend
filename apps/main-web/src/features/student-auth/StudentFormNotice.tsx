import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function StudentFormNotice({ kind, children, compact = false }: { kind: "error" | "success"; children: ReactNode; compact?: boolean }) {
  return <div
    className={`${compact ? "mt-3 py-2.5 leading-5" : "mt-5 py-3 leading-6"} flex items-start gap-3 rounded-xl border px-4 text-sm ${kind === "error" ? "border-[#e6b8c0] bg-[#fff0f3] text-[#98485a]" : "border-[#b8dfcf] bg-[#eefaf5] text-[#216b50]"}`}
    role={kind === "error" ? "alert" : "status"}
    aria-live="polite"
  >
    {kind === "error" ? <WarningCircle className="mt-0.5 shrink-0" size={19} weight="fill" aria-hidden="true" /> : <CheckCircle className="mt-0.5 shrink-0" size={19} weight="fill" aria-hidden="true" />}
    <span>{children}</span>
  </div>;
}
