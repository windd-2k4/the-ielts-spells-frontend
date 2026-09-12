"use client";

import { CheckCircle, FloppyDisk, SpinnerGap, Target, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useStudentPortal } from "./StudentPortalProvider";

interface StudentTargetBandControlProps {
  compact?: boolean;
}

const BAND_OPTIONS = Array.from({ length: 11 }, (_, index) => 4 + index * 0.5);

export function StudentTargetBandControl({ compact = false }: StudentTargetBandControlProps) {
  const { data, saveTargetBand } = useStudentPortal();
  const currentBand = data?.profile.currentBand ?? null;
  const targetBand = data?.profile.targetBand ?? null;
  const options = useMemo(
    () => BAND_OPTIONS.filter((value) => currentBand == null || value >= currentBand),
    [currentBand],
  );
  const [selected, setSelected] = useState(targetBand?.toFixed(1) ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSelected(targetBand?.toFixed(1) ?? "");
  }, [targetBand]);

  async function handleSave() {
    const parsed = Number(selected);
    if (!Number.isFinite(parsed)) {
      setNotice({ kind: "error", text: "Vui lòng chọn Band mục tiêu." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const error = await saveTargetBand(parsed);
    setSaving(false);
    setNotice(error
      ? { kind: "error", text: error }
      : { kind: "success", text: "Đã cập nhật mục tiêu và lộ trình." });
  }

  return (
    <div className={compact ? "space-y-2" : "rounded-[22px] border border-[#E8E2D5] bg-white p-5 shadow-[0_10px_30px_rgba(69,44,51,0.05)]"}>
      {!compact && (
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F7E5EA] text-[#894C5B]">
            <Target size={21} weight="duotone" />
          </span>
          <div>
            <h2 className="font-bold text-[#292528]">Band mục tiêu của bạn</h2>
            <p className="mt-0.5 text-xs leading-5 text-[#6F676C]">
              Mục tiêu này dùng để sắp xếp lộ trình và khóa học phù hợp.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={compact ? "dashboard-target-band" : "profile-target-band"}>
          Band IELTS mong muốn
        </label>
        <select
          id={compact ? "dashboard-target-band" : "profile-target-band"}
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            setNotice(null);
          }}
          className="min-h-11 flex-1 rounded-xl border border-[#DED7DA] bg-[#FFFCF8] px-3 text-sm font-semibold text-[#292528] outline-none transition focus:border-[#C85F78] focus:ring-4 focus:ring-[#F7E5EA]"
        >
          <option value="">Chọn Band mục tiêu</option>
          {options.map((value) => <option key={value} value={value.toFixed(1)}>IELTS {value.toFixed(1)}</option>)}
        </select>
        <button
          type="button"
          disabled={saving || !selected || selected === targetBand?.toFixed(1)}
          onClick={() => void handleSave()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#894C5B] px-4 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-[#753E4B] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {saving ? <SpinnerGap size={18} className="animate-spin" /> : <FloppyDisk size={18} weight="bold" />}
          <span>{saving ? "Đang lưu" : "Lưu mục tiêu"}</span>
        </button>
      </div>

      {notice && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${notice.kind === "success" ? "text-[#247052]" : "text-[#B42335]"}`}
          role="status"
          aria-live="polite"
        >
          {notice.kind === "success" ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
          {notice.text}
        </p>
      )}
    </div>
  );
}
