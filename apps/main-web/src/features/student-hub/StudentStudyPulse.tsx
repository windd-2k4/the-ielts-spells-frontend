"use client";

import {
  BookOpenText,
  CalendarDots,
  ChartBar,
  FloppyDisk,
  Headphones,
  Microphone,
  PencilLine,
  PencilSimple,
  SpinnerGap,
  Target,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getStudentPortalActivity, type StudentPortalDailyActivity, type StudentPortalOverview } from "./studentPortalApi";
import { useStudentPortal } from "./StudentPortalProvider";
import { StudentTargetBandControl } from "./StudentTargetBandControl";
import { formatBand } from "./studentPortalViewModel";
import styles from "./StudentStudyPulse.module.css";

const skills = [
  { label: "Reading", target: "readingTarget", icon: BookOpenText },
  { label: "Listening", target: "listeningTarget", icon: Headphones },
  { label: "Writing", target: "writingTarget", icon: PencilLine },
  { label: "Speaking", target: "speakingTarget", icon: Microphone },
] as const;
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7;
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -day);
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function MonthPicker({ id, value, max, loading, onChange }: {
  id: string;
  value: string;
  max: string;
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.monthPicker} htmlFor={id}>
      <span>Tháng</span>
      <input
        id={id}
        type="month"
        value={value}
        max={max}
        disabled={loading}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StudentExamPlanEditor({ status, plannedExamDate }: {
  status: "PLANNED" | "NONE" | null;
  plannedExamDate: string | null;
}) {
  const { saveExamPlan } = useStudentPortal();
  const [choice, setChoice] = useState<"NONE" | "DATE">(status === "PLANNED" ? "DATE" : "NONE");
  const [date, setDate] = useState(plannedExamDate ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  async function save() {
    if (choice === "DATE" && !date) return;
    setSaving(true);
    setNotice(null);
    const error = await saveExamPlan(choice === "NONE", choice === "DATE" ? date : null);
    setSaving(false);
    setNotice(error
      ? { kind: "error", text: error }
      : { kind: "success", text: "Đã lưu kế hoạch thi." });
  }

  return (
    <div className={styles.inlineEditor}>
      <div className={styles.examPlanChoices}>
        <label><input type="radio" name="dashboard-exam-plan" checked={choice === "NONE"} onChange={() => setChoice("NONE")} disabled={saving} />Chưa có dự định thi</label>
        <label><input type="radio" name="dashboard-exam-plan" checked={choice === "DATE"} onChange={() => setChoice("DATE")} disabled={saving} />Có ngày dự kiến</label>
        {choice === "DATE" && <input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} disabled={saving} />}
        <button type="button" onClick={() => void save()} disabled={saving || (choice === "DATE" && !date)}>{saving ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} />}Lưu</button>
      </div>
      {notice && <p role={notice.kind === "error" ? "alert" : "status"} data-error={notice.kind === "error" || undefined}>{notice.text}</p>}
    </div>
  );
}

export function StudentStudyPulse({ data }: { data: StudentPortalOverview }) {
  const today = new Date();
  const currentMonth = monthKey(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [activity, setActivity] = useState<StudentPortalDailyActivity[]>(data.activityCalendar ?? []);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingExamPlan, setEditingExamPlan] = useState(false);
  const selectedMonthDate = parseLocalDate(`${selectedMonth}-01`);
  const activityByDate = new Map(activity.map((item) => [item.activityDate, item]));
  const monthStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
  const calendarStart = startOfWeek(monthStart);
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
  const monthDays = Array.from(
    { length: new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0).getDate() },
    (_, index) => new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), index + 1),
  );
  const monthItems = monthDays.map((date) => ({ date, activity: activityByDate.get(dateKey(date)) }));
  const monthlyTotals = monthItems.reduce((total, item) => ({
    reading: total.reading + (item.activity?.reading ?? 0),
    listening: total.listening + (item.activity?.listening ?? 0),
    writing: total.writing + (item.activity?.writing ?? 0),
    speaking: total.speaking + (item.activity?.speaking ?? 0),
    totalAttempts: total.totalAttempts + (item.activity?.totalAttempts ?? 0),
  }), { reading: 0, listening: 0, writing: 0, speaking: 0, totalAttempts: 0 });

  useEffect(() => {
    const controller = new AbortController();
    setActivityLoading(true);
    setActivityError(null);
    void getStudentPortalActivity(selectedMonth, controller.signal)
      .then(setActivity)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setActivityError(error instanceof Error ? error.message : "Không thể tải hoạt động của tháng đã chọn.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setActivityLoading(false);
      });
    return () => controller.abort();
  }, [selectedMonth]);

  const examEnrollment = data.enrollments.find((item) => item.actualExamDate)
    ?? data.enrollments.find((item) => item.plannedExamMonth);
  const profilePlanSelected = data.profile.examPlanStatus != null;
  const confirmedExamDate = examEnrollment?.actualExamDate ?? null;
  const examDate = confirmedExamDate ?? (data.profile.examPlanStatus === "PLANNED" ? data.profile.plannedExamDate : null);
  const plannedMonth = profilePlanSelected ? null : examEnrollment?.plannedExamMonth ?? null;
  const examDateObject = examDate ? parseLocalDate(examDate) : null;
  const daysRemaining = examDateObject
    ? Math.max(0, Math.ceil((examDateObject.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000))
    : null;

  return (
    <section className={styles.pulse} aria-label="Góc số liệu học tập">
      <div className={styles.topGrid}>
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3><Target size={18} weight="duotone" /> Your IELTS goal</h3>
            <button type="button" onClick={() => setEditingGoal((current) => !current)} aria-label="Chỉnh sửa band mục tiêu" aria-expanded={editingGoal}><PencilSimple size={17} /></button>
          </header>
          {editingGoal && <div className={styles.inlineEditor}><StudentTargetBandControl compact id="pulse-target-band" /></div>}
          <div className={styles.scoreGrid}>
            <div className={styles.overallScore}>
              <span><i><Target size={16} weight="duotone" /></i>Overall</span>
              <strong>{data.profile.targetBand == null ? "—" : formatBand(data.profile.targetBand)}</strong>
            </div>
            {skills.map((skill) => {
              const SkillIcon = skill.icon;
              return (
                <div key={skill.label} className={styles.skillScore}>
                  <span><i><SkillIcon size={16} weight="duotone" /></i>{skill.label}</span>
                  <strong>{data.profile[skill.target] == null ? "—" : formatBand(data.profile[skill.target])}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3><CalendarDots size={18} weight="duotone" /> IELTS exam plan</h3>
            <div className={styles.cardActions}><span className={styles.examStatus}>{examEnrollment?.examRegistrationStatus === "REGISTERED" ? "Đã đăng ký" : data.profile.examPlanStatus === "NONE" ? "Chưa có dự định" : "Dự kiến"}</span><button type="button" onClick={() => setEditingExamPlan((current) => !current)} aria-label="Chỉnh sửa kế hoạch thi" aria-expanded={editingExamPlan}><PencilSimple size={17} /></button></div>
          </header>
          {editingExamPlan && <StudentExamPlanEditor status={data.profile.examPlanStatus} plannedExamDate={data.profile.plannedExamDate} />}
          <div className={styles.examGrid}>
            <div>
              <span>Ngày dự thi</span>
              <strong>{examDateObject ? examDateObject.toLocaleDateString("vi-VN") : !profilePlanSelected && plannedMonth ? `Tháng ${parseLocalDate(plannedMonth).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}` : "Chưa có dự định"}</strong>
              <small>{confirmedExamDate ? "Lịch thi đã được trung tâm xác nhận" : examDate ? "Ngày dự kiến của bạn" : plannedMonth ? "Tháng dự kiến từ hồ sơ ghi danh" : "Có thể cập nhật bất cứ lúc nào"}</small>
            </div>
            <div>
              <span>Số ngày còn lại</span>
              <strong>{daysRemaining == null ? "— ngày" : `${daysRemaining} ngày`}</strong>
              <small>{daysRemaining == null ? "Sẽ tính khi có ngày thi chính thức" : "Cùng giữ nhịp học đều đặn"}</small>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.insightGrid}>
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h3><ChartBar size={18} weight="duotone" /> Study consistency</h3>
              <p>Ô càng đậm, số lượt nộp trong ngày càng nhiều.</p>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.legend} aria-label="Mức độ hoạt động từ thấp đến cao"><span><i /><i /><i /></span> Mức độ hoạt động</span>
              <MonthPicker id="calendar-activity-month" value={selectedMonth} max={currentMonth} loading={activityLoading} onChange={setSelectedMonth} />
            </div>
          </header>
          <div className={styles.calendar}>
            <div className={styles.monthLabel}>{selectedMonthDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</div>
            {activityError && <p className={styles.activityNotice} role="alert">{activityError}</p>}
            <div className={styles.weekdays}>{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className={styles.calendarGrid}>
              {calendarDays.map((date) => {
                const item = activityByDate.get(dateKey(date));
                const intensity = Math.min(item?.totalAttempts ?? 0, 3);
                const outside = date.getMonth() !== selectedMonthDate.getMonth() || date.getFullYear() !== selectedMonthDate.getFullYear();
                const current = dateKey(date) === dateKey(today);
                const attempts = item?.totalAttempts ?? 0;
                return (
                  <div
                    key={dateKey(date)}
                    className={styles.day}
                    data-level={intensity}
                    data-outside={outside || undefined}
                    data-today={current || undefined}
                    aria-label={`${date.toLocaleDateString("vi-VN")}: ${attempts} bài đã nộp`}
                    title={`${date.toLocaleDateString("vi-VN")}: ${attempts} bài đã nộp`}
                  >
                    <span className={styles.dayNumber}>{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <div><h3>Monthly activity</h3><p>Dữ liệu từ những bài đã nộp thành công.</p></div>
            <div className={styles.headerActions}>
              <strong className={styles.weekTotal}>{monthlyTotals.totalAttempts} bài</strong>
              <MonthPicker id="table-activity-month" value={selectedMonth} max={currentMonth} loading={activityLoading} onChange={setSelectedMonth} />
            </div>
          </header>
          <div className={styles.tableWrap} aria-busy={activityLoading}>
            <table className={styles.weekTable}>
              <thead><tr><th>Ngày</th><th>R</th><th>L</th><th>W</th><th>S</th><th>Tổng</th></tr></thead>
              <tbody>
                {monthItems.map(({ date, activity: item }) => (
                  <tr key={dateKey(date)} data-today={dateKey(date) === dateKey(today) || undefined}>
                    <th scope="row">{date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</th>
                    {[item?.reading, item?.listening, item?.writing, item?.speaking, item?.totalAttempts].map((value, index) => <td key={index} data-empty={!value || undefined}>{value || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th scope="row">Tổng</th><td>{monthlyTotals.reading}</td><td>{monthlyTotals.listening}</td><td>{monthlyTotals.writing}</td><td>{monthlyTotals.speaking}</td><td>{monthlyTotals.totalAttempts}</td></tr></tfoot>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
