"use client";

import Link from "next/link";
import { CalendarDots, ChartBar, PencilSimple, Target } from "@phosphor-icons/react";
import type { StudentPortalOverview } from "./studentPortalApi";
import { formatBand } from "./studentPortalViewModel";
import styles from "./StudentStudyPulse.module.css";

const skills = ["Reading", "Listening", "Writing", "Speaking"] as const;
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

export function StudentStudyPulse({ data }: { data: StudentPortalOverview }) {
  const today = new Date();
  const activity = data.activityCalendar ?? [];
  const activityByDate = new Map(activity.map((item) => [item.activityDate, item]));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const calendarStart = startOfWeek(monthStart);
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
  const weekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekItems = weekDays.map((date) => ({ date, activity: activityByDate.get(dateKey(date)) }));
  const weeklyTotals = weekItems.reduce((total, item) => ({
    reading: total.reading + (item.activity?.reading ?? 0),
    listening: total.listening + (item.activity?.listening ?? 0),
    writing: total.writing + (item.activity?.writing ?? 0),
    speaking: total.speaking + (item.activity?.speaking ?? 0),
    totalAttempts: total.totalAttempts + (item.activity?.totalAttempts ?? 0),
  }), { reading: 0, listening: 0, writing: 0, speaking: 0, totalAttempts: 0 });

  const examEnrollment = data.enrollments.find((item) => item.actualExamDate)
    ?? data.enrollments.find((item) => item.plannedExamMonth);
  const examDate = examEnrollment?.actualExamDate ?? null;
  const plannedMonth = examEnrollment?.plannedExamMonth ?? null;
  const examDateObject = examDate ? parseLocalDate(examDate) : null;
  const daysRemaining = examDateObject
    ? Math.max(0, Math.ceil((examDateObject.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000))
    : null;

  return (
    <section className={styles.pulse} aria-labelledby="study-pulse-title">
      <div className={styles.sectionTitle}>
        <div>
          <p>Learning dashboard</p>
          <h2 id="study-pulse-title">Mục tiêu &amp; nhịp học của bạn</h2>
        </div>
        <Link href="/student/progress">Xem phân tích chi tiết</Link>
      </div>

      <div className={styles.topGrid}>
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3><Target size={18} weight="duotone" /> Mục tiêu của bạn</h3>
            <Link href="#learning-goal" aria-label="Chỉnh sửa band mục tiêu"><PencilSimple size={17} /></Link>
          </header>
          <div className={styles.scoreGrid}>
            <div className={styles.overallScore}>
              <span>Overall</span>
              <strong>{data.profile.currentBand == null ? "—" : formatBand(data.profile.currentBand)}</strong>
              <small>{data.profile.targetBand == null ? "Chưa đặt mục tiêu" : `Mục tiêu ${formatBand(data.profile.targetBand)}`}</small>
            </div>
            {skills.map((skill) => (
              <div key={skill} className={styles.skillScore}>
                <span>{skill}</span>
                <strong>—</strong>
                <small>Chưa đánh giá</small>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3><CalendarDots size={18} weight="duotone" /> Lịch thi IELTS</h3>
            <span className={styles.examStatus}>{examEnrollment?.examRegistrationStatus === "REGISTERED" ? "Đã đăng ký" : "Chưa xác nhận"}</span>
          </header>
          <div className={styles.examGrid}>
            <div>
              <span>Ngày dự thi</span>
              <strong>{examDateObject ? examDateObject.toLocaleDateString("vi-VN") : plannedMonth ? `Tháng ${parseLocalDate(plannedMonth).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}` : "— / — / —"}</strong>
              <small>{examDate ? "Lịch thi đã được trung tâm xác nhận" : plannedMonth ? "Tháng dự kiến từ hồ sơ ghi danh" : "Chưa có lịch thi trong hồ sơ"}</small>
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
              <h3><ChartBar size={18} weight="duotone" /> Biểu đồ chăm chỉ</h3>
              <p>Mỗi ô đậm thể hiện số bài đã nộp trong ngày.</p>
            </div>
            <span className={styles.legend}><i /> Có nộp bài</span>
          </header>
          <div className={styles.calendar}>
            <div className={styles.monthLabel}>Tháng {String(today.getMonth() + 1).padStart(2, "0")} / {today.getFullYear()}</div>
            <div className={styles.weekdays}>{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className={styles.calendarGrid}>
              {calendarDays.map((date) => {
                const item = activityByDate.get(dateKey(date));
                const intensity = Math.min(item?.totalAttempts ?? 0, 3);
                const outside = date.getMonth() !== today.getMonth();
                const current = dateKey(date) === dateKey(today);
                return (
                  <div key={dateKey(date)} className={styles.day} data-level={intensity} data-outside={outside || undefined} data-today={current || undefined} title={`${date.toLocaleDateString("vi-VN")}: ${item?.totalAttempts ?? 0} bài đã nộp`}>
                    <span>{date.getDate()}</span>
                    {intensity > 0 && <i aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <div><h3>Hoạt động trong tuần</h3><p>Dữ liệu từ những bài đã nộp thành công.</p></div>
            <strong className={styles.weekTotal}>{weeklyTotals.totalAttempts} bài</strong>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.weekTable}>
              <thead><tr><th>Ngày</th><th>R</th><th>L</th><th>W</th><th>S</th><th>Tổng</th></tr></thead>
              <tbody>
                {weekItems.map(({ date, activity: item }) => (
                  <tr key={dateKey(date)} data-today={dateKey(date) === dateKey(today) || undefined}>
                    <th scope="row">{date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</th>
                    <td>{item?.reading || "—"}</td><td>{item?.listening || "—"}</td><td>{item?.writing || "—"}</td><td>{item?.speaking || "—"}</td><td>{item?.totalAttempts || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th scope="row">Tổng</th><td>{weeklyTotals.reading}</td><td>{weeklyTotals.listening}</td><td>{weeklyTotals.writing}</td><td>{weeklyTotals.speaking}</td><td>{weeklyTotals.totalAttempts}</td></tr></tfoot>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
