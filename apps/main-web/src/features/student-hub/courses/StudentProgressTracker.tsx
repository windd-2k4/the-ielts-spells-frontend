"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, ImageSquare, LockKey, UploadSimple } from "@phosphor-icons/react";
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
  const [minutes, setMinutes] = useState(task.durationSeconds == null ? "" : String(Math.round(task.durationSeconds / 60)));
  const [comprehension, setComprehension] = useState(task.comprehensionPercent == null ? "" : String(task.comprehensionPercent));
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return <article className={styles.activity}>
    <div>
      <span className={styles.eyebrow}>{task.skill} · Bài được giao</span>
      <h3>{task.title}</h3>
      <div className={styles.meta}>
        <span>{unlocked ? <CheckCircle size={15} weight="fill" color="#168765" /> : <LockKey size={14} />} {unlocked ? "Đã hoàn thành đề" : "Chưa hoàn thành đề"}</span>
        {task.score != null ? <span>Kết quả {task.score}/{task.maxScore ?? "—"}</span> : null}
        {task.evidenceCount ? <span><ImageSquare size={14} /> {task.evidenceCount} minh chứng</span> : null}
      </div>
      {!unlocked ? <Link className={styles.assignmentLink} href="/student/assignments">Làm bài được giao</Link> : null}
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

export default function StudentProgressTracker({ courseId }: { courseId: string }) {
  const [tasks, setTasks] = useState<StudentProgressTask[]>([]);
  const [sessionNo, setSessionNo] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await fetchStudentCourseProgress(courseId);
      setTasks(result);
      setSessionNo((current) => current ?? result[0]?.sessionNo ?? null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải tiến độ tự học.");
    }
  }

  useEffect(() => { void load(); }, [courseId]);
  const sessions = useMemo(() => Array.from(new Map(tasks.map((task) => [task.sessionNo, task.sessionTitle])).entries()), [tasks]);
  const visible = tasks.filter((task) => task.sessionNo === sessionNo);

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
      {visible.length ? visible.map((task) => <ProgressActivity key={task.classActivityId} courseId={courseId} task={task} reload={load} />) : <div className={styles.empty}>Session này chưa có bài được giao.</div>}
    </div>
  </section>;
}
