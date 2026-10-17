"use client";

import {
  BookOpenText,
  CalendarBlank,
  Check,
  Headphones,
  Microphone,
  PencilLine,
  SpinnerGap,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import type { StudentSkillTargets } from "./studentPortalApi";
import { BAND_OPTIONS } from "./StudentTargetBandControl";
import styles from "./StudentLearningSetupGate.module.css";

type NullableSkillTargets = { [Key in keyof StudentSkillTargets]: number | null };
type SkillTargetStrings = { [Key in keyof StudentSkillTargets]: string };

interface StudentLearningSetupGateProps {
  currentBand: number | null;
  targetBand: number | null;
  skillTargets: NullableSkillTargets;
  onSave: (
    targetBand: number,
    skillTargets: StudentSkillTargets,
    noExamPlan: boolean,
    plannedExamDate: string | null,
  ) => Promise<string | null>;
}

const SKILLS: Array<{ key: keyof StudentSkillTargets; label: string; short: string; icon: ReactNode }> = [
  { key: "listeningTarget", label: "Listening", short: "L", icon: <Headphones size={19} weight="duotone" /> },
  { key: "readingTarget", label: "Reading", short: "R", icon: <BookOpenText size={19} weight="duotone" /> },
  { key: "writingTarget", label: "Writing", short: "W", icon: <PencilLine size={19} weight="duotone" /> },
  { key: "speakingTarget", label: "Speaking", short: "S", icon: <Microphone size={19} weight="duotone" /> },
];

export function StudentLearningSetupGate({ currentBand, targetBand, skillTargets, onSave }: StudentLearningSetupGateProps) {
  const options = useMemo(() => BAND_OPTIONS.filter((value) => currentBand == null || value >= currentBand), [currentBand]);
  const fallback = targetBand?.toFixed(1) ?? "";
  const [selectedBand, setSelectedBand] = useState(fallback);
  const [selectedSkills, setSelectedSkills] = useState<SkillTargetStrings>({
    listeningTarget: skillTargets.listeningTarget?.toFixed(1) ?? fallback,
    readingTarget: skillTargets.readingTarget?.toFixed(1) ?? fallback,
    writingTarget: skillTargets.writingTarget?.toFixed(1) ?? fallback,
    speakingTarget: skillTargets.speakingTarget?.toFixed(1) ?? fallback,
  });
  const [skillsTouched, setSkillsTouched] = useState(false);
  const [examChoice, setExamChoice] = useState<"" | "NONE" | "DATE">("");
  const [plannedExamDate, setPlannedExamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const skillsComplete = Object.values(selectedSkills).every(Boolean);
  const valid = Boolean(selectedBand && skillsComplete && examChoice && (examChoice === "NONE" || plannedExamDate));

  function selectOverall(value: string) {
    setSelectedBand(value);
    if (!skillsTouched) {
      setSelectedSkills({ listeningTarget: value, readingTarget: value, writingTarget: value, speakingTarget: value });
    }
  }

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setError("");
    const parsedSkills: StudentSkillTargets = {
      listeningTarget: Number(selectedSkills.listeningTarget),
      readingTarget: Number(selectedSkills.readingTarget),
      writingTarget: Number(selectedSkills.writingTarget),
      speakingTarget: Number(selectedSkills.speakingTarget),
    };
    const saveError = await onSave(
      Number(selectedBand),
      parsedSkills,
      examChoice === "NONE",
      examChoice === "DATE" ? plannedExamDate : null,
    );
    setSaving(false);
    if (saveError) setError(saveError);
  }

  return (
    <main className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <section className={styles.frame} aria-labelledby="learning-setup-title">
        <aside className={styles.vision}>
          <div className={styles.brand}><span><Target size={20} weight="fill" /></span>The IELTS Spells</div>
          <div className={styles.visionCopy}>
            <span className={styles.kicker}>Góc học tập của bạn</span>
            <h2>Mục tiêu rõ,<br />lộ trình ngắn hơn.</h2>
            <p>Chọn mức Band bạn muốn đạt. Hệ thống sẽ dùng dữ liệu này để cá nhân hóa nhịp học và gợi ý tiếp theo.</p>
          </div>

          <div className={styles.goalMap} aria-label="Bản đồ mục tiêu IELTS">
            <div className={styles.goalCore}>
              <small>Overall</small>
              <strong>{selectedBand || "—"}</strong>
              <span>Band mục tiêu</span>
            </div>
            <div className={styles.skillOrbit}>
              {SKILLS.map((skill) => (
                <div key={skill.key}><span>{skill.short}</span><strong>{selectedSkills[skill.key] || "—"}</strong></div>
              ))}
            </div>
          </div>

          <div className={styles.visionFoot}><TrendUp size={17} weight="bold" />Bạn có thể thay đổi mục tiêu bất cứ lúc nào</div>
        </aside>

        <div className={styles.formPanel}>
          <header className={styles.formHeader}>
            <div>
              <span className={styles.step}>Thiết lập ban đầu · 1 phút</span>
              <h1 id="learning-setup-title">Xây mục tiêu IELTS của bạn</h1>
              <p>Hoàn tất một lần để bắt đầu góc học tập.</p>
            </div>
            <span className={styles.progress}>1 / 1</span>
          </header>

          <div className={styles.formBody}>
            <section className={styles.formSection} aria-labelledby="overall-goal-label">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionIcon}><Target size={19} weight="duotone" /></span>
                <div><h3 id="overall-goal-label">Mục tiêu tổng</h3><p>Chọn Overall trước, sau đó điều chỉnh từng kỹ năng.</p></div>
              </div>
              <label className={styles.overallSelect}>
                <span>Overall</span>
                <select value={selectedBand} onChange={(event) => selectOverall(event.target.value)} disabled={saving}>
                  <option value="">Chọn Band</option>
                  {options.map((value) => <option key={value} value={value.toFixed(1)}>IELTS {value.toFixed(1)}</option>)}
                </select>
              </label>
            </section>

            <section className={styles.formSection} aria-labelledby="skill-goals-label">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionIcon}><TrendUp size={19} weight="duotone" /></span>
                <div><h3 id="skill-goals-label">Mục tiêu từng kỹ năng</h3><p>Mỗi kỹ năng có thể chọn một mức khác nhau.</p></div>
              </div>
              <div className={styles.skillGrid}>
                {SKILLS.map((skill) => (
                  <label key={skill.key} className={styles.skillField}>
                    <span>{skill.icon}{skill.label}</span>
                    <select
                      value={selectedSkills[skill.key]}
                      disabled={saving}
                      onChange={(event) => {
                        setSkillsTouched(true);
                        setSelectedSkills((current) => ({ ...current, [skill.key]: event.target.value }));
                      }}
                    >
                      <option value="">Chọn</option>
                      {BAND_OPTIONS.map((value) => <option key={value} value={value.toFixed(1)}>{value.toFixed(1)}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            <fieldset className={styles.formSection}>
              <legend className={styles.sectionHeading}>
                <span className={styles.sectionIcon}><CalendarBlank size={19} weight="duotone" /></span>
                <span><strong>Ngày dự định thi</strong><small>Thông tin này không bắt buộc.</small></span>
              </legend>
              <div className={styles.examChoices}>
                <label data-selected={examChoice === "NONE" || undefined}>
                  <input type="radio" name="setup-exam-plan" checked={examChoice === "NONE"} onChange={() => setExamChoice("NONE")} disabled={saving} />
                  <span><strong>Chưa có dự định thi</strong><small>Cập nhật sau khi có kế hoạch</small></span>
                  {examChoice === "NONE" && <Check size={17} weight="bold" />}
                </label>
                <label data-selected={examChoice === "DATE" || undefined}>
                  <input type="radio" name="setup-exam-plan" checked={examChoice === "DATE"} onChange={() => setExamChoice("DATE")} disabled={saving} />
                  <span><strong>Đã có ngày dự kiến</strong><small>Giúp theo dõi số ngày còn lại</small></span>
                  {examChoice === "DATE" && <Check size={17} weight="bold" />}
                </label>
              </div>
              {examChoice === "DATE" && <input aria-label="Ngày dự định thi" type="date" min={minDate} value={plannedExamDate} onChange={(event) => setPlannedExamDate(event.target.value)} disabled={saving} className={styles.dateInput} />}
            </fieldset>
          </div>

          <footer className={styles.formFooter}>
            <div>{error ? <p role="alert">{error}</p> : <span>Dữ liệu chỉ dùng để cá nhân hóa lộ trình học.</span>}</div>
            <button type="button" onClick={() => void submit()} disabled={!valid || saving}>
              {saving ? <SpinnerGap size={18} className={styles.spin} /> : <Check size={18} weight="bold" />}
              {saving ? "Đang lưu..." : "Lưu và vào góc học tập"}
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}
