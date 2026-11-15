"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRinging, CheckCircle, Clock, ImageSquare, LockKey, UploadSimple } from "@phosphor-icons/react";
import {
  fetchStudentCourseProgress,
  type StudentProgressTask,
  updateStudentProgressChecklist,
  updateStudentProgressSummary,
  uploadStudentProgressEvidence,
} from "../studentPortalApi";
import styles from "./StudentProgressTracker.module.css";

function completed(task: StudentProgressTask) {
  return Boolean(task.attemptId && (
    task.evidenceCount || ["SUBMITTED", "WAITING_REVIEW", "NEEDS_REVISION", "COMPLETED"].includes(task.status || "")
  ));
}

function ProgressActivity({ courseId, task, reload }: {
  courseId: string;
  task: StudentProgressTask;
  reload: () => Promise<void>;
}) {
  const unlocked = completed(task);
  const effectiveDeadline = task.effectiveDueAt;
  const requiredChecklistDone = task.checklist.filter((item) => item.required).every((item) => item.completed);
  const progressReportDone = requiredChecklistDone && Boolean(task.errorAnalysis?.trim());
  const reviewHref = task.attemptId
    ? `/student/${task.skill.toLowerCase()}/attempts/${task.attemptId}/result?review=1`
    : null;
  const minutesToDeadline = effectiveDeadline
    ? Math.round((new Date(effectiveDeadline).getTime() - Date.now()) / 60_000)
    : null;
  const shouldRemindReview = unlocked && !progressReportDone && minutesToDeadline != null && minutesToDeadline > 0 && minutesToDeadline <= 60;
  const [minutes, setMinutes] = useState(task.durationSeconds == null ? "" : String(Math.round(task.durationSeconds / 60)));
  const [comprehension, setComprehension] = useState(task.comprehensionPercent == null ? "" : String(task.comprehensionPercent));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError("");
    try {
      await action();
      await reload();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Không thể lưu thay đổi.");
    } finally {
      setBusy(false);
    }
  }

  return <article id={`student-activity-${task.classActivityId}`} className={styles.activity}>
    <div>
      <span className={styles.eyebrow}>{task.skill} · Đề được giao</span>
      <h3>{task.title}</h3>
      <div className={styles.meta}>
        <span>{unlocked ? <CheckCircle size={15} weight="fill" color="#168765" /> : <LockKey size={14} />} {unlocked ? "Đã hoàn thành đề" : "Chưa hoàn thành đề"}</span>
        {task.late ? <span className={styles.lateState}>Nộp muộn</span> : null}
        {effectiveDeadline ? <span>Hạn hiệu lực {new Date(effectiveDeadline).toLocaleString("vi-VN")}</span> : null}
        {task.score != null ? <span>Kết quả {task.score}/{task.maxScore ?? "—"}</span> : null}
        {task.evidenceCount ? <span><ImageSquare size={14} /> {task.evidenceCount} minh chứng</span> : null}
      </div>
      {!unlocked ? <Link className={styles.assignmentLink} href="/student/assignments">Làm đề được giao</Link> : null}
      {shouldRemindReview ? <div className={styles.reviewReminder} role="status"><BellRinging size={17} weight="fill" /><span><strong>Còn {minutesToDeadline} phút</strong> · Bạn chưa hoàn tất checklist sau bài làm.</span></div> : null}
      {unlocked && !progressReportDone && reviewHref ? <Link className={styles.reviewLink} href={reviewHref}>Hoàn tất phân tích <ArrowRight size={15} weight="bold" /></Link> : null}
      <label className={styles.evidenceButton}>
        <UploadSimple size={16} />
        {task.evidenceCount ? "Thêm ảnh minh chứng" : "Tôi làm ngoài web · Gửi ảnh"}
        <input
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void run(() => uploadStudentProgressEvidence(courseId, task.classActivityId, file));
            event.target.value = "";
          }}
        />
      </label>
      {actionError ? <div role="alert" className={styles.notice}>{actionError}</div> : null}
    </div>

    <div className={styles.checklist}>
      <p className={styles.checklistTitle}>Tự học sau khi hoàn thành đề</p>
      {task.checklist.map((item) => <label key={item.id} className={styles.checkItem}>
        <input
          type="checkbox"
          checked={item.completed}
          disabled={!unlocked || !task.attemptId || busy}
          onChange={(event) => {
            if (task.attemptId) void run(() => updateStudentProgressChecklist(courseId, task.attemptId!, item.id, event.target.checked));
          }}
        />
        <span>{item.label}</span>
      </label>)}
      {!unlocked ? <span className={styles.lockNote}><LockKey size={14} /> Hoàn thành đề hoặc gửi ảnh minh chứng để mở các bước này.</span> : null}
    </div>

    <div className={styles.summary}>
      <label className={styles.field}>Tổng thời gian làm bài (phút)
        <input type="number" min="0" inputMode="numeric" value={minutes} disabled={!unlocked || busy} onChange={(event) => setMinutes(event.target.value)} />
      </label>
      <label className={styles.field}>Mức độ thấu hiểu (%)
        <input type="number" min="0" max="100" inputMode="numeric" value={comprehension} disabled={!unlocked || busy} onChange={(event) => setComprehension(event.target.value)} />
      </label>
      <button
        type="button"
        className={styles.saveButton}
        disabled={!unlocked || !task.attemptId || busy}
        onClick={() => task.attemptId && void run(() => updateStudentProgressSummary(
          courseId,
          task.attemptId!,
          minutes === "" ? null : Number(minutes) * 60,
          comprehension === "" ? null : Number(comprehension),
        ))}
      ><Clock size={16} /> Lưu báo cáo</button>
    </div>
  </article>;
}

export default function StudentProgressTracker({ courseId, focusActivityId }: { courseId: string; focusActivityId?: string | null }) {
  const [tasks, setTasks] = useState<StudentProgressTask[]>([]);
  const [sessionNo, setSessionNo] = useState<number | null>(null);
  const [error, setError] = useState("");
  const focusHandled = useRef(false);

  async function load() {
    try {
      const result = await fetchStudentCourseProgress(courseId);
      setTasks(result);
      const focused = focusActivityId ? result.find(task => task.classActivityId === focusActivityId) : null;
      setSessionNo((current) => focused?.sessionNo ?? current ?? result[0]?.sessionNo ?? null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải tiến độ tự học.");
    }
  }

  useEffect(() => {
    focusHandled.current = false;
    void load();
  }, [courseId, focusActivityId]);
  const sessions = useMemo(() => Array.from(new Map(tasks.map((task) => [task.sessionNo, task.sessionTitle])).entries()), [tasks]);
  const visible = tasks.filter((task) => task.sessionNo === sessionNo);

  useEffect(() => {
    if (focusHandled.current || !focusActivityId || !visible.some(task => task.classActivityId === focusActivityId)) return;
    focusHandled.current = true;
    window.requestAnimationFrame(() => document.getElementById(`student-activity-${focusActivityId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [focusActivityId, visible]);

  return <section className={styles.tracker} aria-label="Tiến độ tự học theo session">
    <div className={styles.toolbar}>
      <label htmlFor="student-progress-session">Tiến độ theo session</label>
      <select id="student-progress-session" value={sessionNo ?? ""} onChange={(event) => setSessionNo(Number(event.target.value))}>
        {sessions.map(([number, title]) => <option key={number} value={number}>Session {number} · {title}</option>)}
      </select>
      <span className={styles.hint}>Hoàn thành đề trước, sau đó mới tích các bước tự học.</span>
    </div>
    {error ? <div role="alert" className={styles.notice}>{error}</div> : null}
    <div className={styles.list}>
      {visible.length ? visible.map((task) => <ProgressActivity key={task.classActivityId} courseId={courseId} task={task} reload={load} />) : <div className={styles.empty}>Session này chưa có đề được giao.</div>}
    </div>
  </section>;
}
