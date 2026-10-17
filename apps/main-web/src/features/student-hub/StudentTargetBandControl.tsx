"use client";

import { CheckCircle, FloppyDisk, SpinnerGap, Target, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useStudentPortal } from "./StudentPortalProvider";
import type { StudentSkillTargets } from "./studentPortalApi";

interface StudentTargetBandControlProps {
  compact?: boolean;
  id?: string;
}

export const BAND_OPTIONS = Array.from({ length: 11 }, (_, index) => 4 + index * 0.5);
const SKILLS: Array<{ key: keyof StudentSkillTargets; label: string }> = [
  { key: "listeningTarget", label: "Listening" },
  { key: "readingTarget", label: "Reading" },
  { key: "writingTarget", label: "Writing" },
  { key: "speakingTarget", label: "Speaking" },
];

export function StudentTargetBandControl({ compact = false, id }: StudentTargetBandControlProps) {
  const { data, saveTargetBand } = useStudentPortal();
  const currentBand = data?.profile.currentBand ?? null;
  const targetBand = data?.profile.targetBand ?? null;
  const options = useMemo(
    () => BAND_OPTIONS.filter((value) => currentBand == null || value >= currentBand),
    [currentBand],
  );
  const [selected, setSelected] = useState(targetBand?.toFixed(1) ?? "");
  const [skillTargets, setSkillTargets] = useState<Record<keyof StudentSkillTargets, string>>({
    listeningTarget: (data?.profile.listeningTarget ?? targetBand)?.toFixed(1) ?? "",
    readingTarget: (data?.profile.readingTarget ?? targetBand)?.toFixed(1) ?? "",
    writingTarget: (data?.profile.writingTarget ?? targetBand)?.toFixed(1) ?? "",
    speakingTarget: (data?.profile.speakingTarget ?? targetBand)?.toFixed(1) ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const controlId = id ?? (compact ? "dashboard-target-band" : "profile-target-band");
  const hasChanges = selected !== targetBand?.toFixed(1)
    || skillTargets.listeningTarget !== data?.profile.listeningTarget?.toFixed(1)
    || skillTargets.readingTarget !== data?.profile.readingTarget?.toFixed(1)
    || skillTargets.writingTarget !== data?.profile.writingTarget?.toFixed(1)
    || skillTargets.speakingTarget !== data?.profile.speakingTarget?.toFixed(1);

  useEffect(() => {
    setSelected(targetBand?.toFixed(1) ?? "");
    setSkillTargets({
      listeningTarget: (data?.profile.listeningTarget ?? targetBand)?.toFixed(1) ?? "",
      readingTarget: (data?.profile.readingTarget ?? targetBand)?.toFixed(1) ?? "",
      writingTarget: (data?.profile.writingTarget ?? targetBand)?.toFixed(1) ?? "",
      speakingTarget: (data?.profile.speakingTarget ?? targetBand)?.toFixed(1) ?? "",
    });
  }, [data?.profile.listeningTarget, data?.profile.readingTarget, data?.profile.speakingTarget, data?.profile.writingTarget, targetBand]);

  async function handleSave() {
    const parsed = Number(selected);
    const parsedSkills: StudentSkillTargets = {
      listeningTarget: Number(skillTargets.listeningTarget),
      readingTarget: Number(skillTargets.readingTarget),
      writingTarget: Number(skillTargets.writingTarget),
      speakingTarget: Number(skillTargets.speakingTarget),
    };
    if (!selected || !Number.isFinite(parsed) || !options.includes(parsed)
        || Object.values(parsedSkills).some((value) => !BAND_OPTIONS.includes(value))) {
      setNotice({ kind: "error", text: "Vui lòng chọn Band mục tiêu." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const error = await saveTargetBand(parsed, parsedSkills);
    setSaving(false);
    setNotice(error
      ? { kind: "error", text: error }
      : { kind: "success", text: "Đã cập nhật mục tiêu và lộ trình." });
  }

  return (
    <div className={compact ? "space-y-2" : "rounded-xl border border-[#E8E2D5] bg-white p-4 shadow-2xs space-y-3"}>
      {!compact && (
        <div className="flex items-start gap-2.5">
          <span className="p-1.5 rounded-lg bg-[#F7E5EA] text-[#894C5B]">
            <Target size={18} weight="bold" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B18] font-sans">Band mục tiêu mong muốn</h3>
            <p className="text-[11px] text-[#6F676C] leading-snug">
              Thiết lập Band mục tiêu để hệ thống cập nhật danh sách khóa học và lộ trình phù hợp.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-2 pt-3">
        <label className="text-xs font-medium text-[#5C5752]" htmlFor={controlId}>
          Band IELTS mong muốn
        </label>
        <select
          id={controlId}
          value={selected}
          disabled={saving}
          onChange={(event) => {
            setSelected(event.target.value);
            setNotice(null);
          }}
          className="h-11 min-w-0 rounded-lg border border-[#E8E2D5] bg-white px-3 text-sm text-[#1E1B18] transition focus:border-[#894C5B]"
        >
          <option value="">Chọn band mục tiêu</option>
          {options.map((value) => <option key={value} value={value.toFixed(1)}>IELTS Band {value.toFixed(1)}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((skill) => (
            <label key={skill.key} className="grid gap-1 text-[11px] font-semibold text-[#6F676C]">
              {skill.label}
              <select
                value={skillTargets[skill.key]}
                disabled={saving}
                onChange={(event) => {
                  setSkillTargets((current) => ({ ...current, [skill.key]: event.target.value }));
                  setNotice(null);
                }}
                className="h-10 min-w-0 rounded-lg border border-[#E8E2D5] bg-white px-2 text-sm text-[#1E1B18] focus:border-[#894C5B]"
              >
                <option value="">Chọn band</option>
                {BAND_OPTIONS.map((value) => <option key={value} value={value.toFixed(1)}>{value.toFixed(1)}</option>)}
              </select>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={saving || !selected || !hasChanges}
          onClick={() => void handleSave()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E8CFD5] bg-white px-3.5 text-sm font-semibold text-[#894C5B] transition hover:bg-[#F7E5EA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
          <span>{saving ? "Lưu..." : "Lưu mục tiêu"}</span>
        </button>
      </div>

      {notice && (
        <p
          className={`flex items-center gap-1 text-[11px] font-semibold ${notice.kind === "success" ? "text-[#137333]" : "text-[#B42335]"}`}
          role="status"
          aria-live="polite"
        >
          {notice.kind === "success" ? <CheckCircle size={14} weight="fill" /> : <WarningCircle size={14} weight="fill" />}
          {notice.text}
        </p>
      )}
    </div>
  );
}
