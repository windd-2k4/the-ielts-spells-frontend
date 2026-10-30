"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRinging, CheckCircle, Clock, ImageSquare, LockKey, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import {
  fetchStudentAssignmentRevisions,
  fetchStudentCourseProgress,
  saveStudentAssignmentAudio,
  saveStudentAssignmentReflection,
  saveStudentAssignmentSubmission,
  type StudentProgressTask,
  updateStudentProgressChecklist,
  updateStudentProgressSummary,
  uploadStudentProgressEvidence,
} from "../studentPortalApi";
import styles from "./StudentProgressTracker.module.css";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";

const RUBRIC_LABELS: Record<string, string> = {
  TASK_ACHIEVEMENT: "Task Achievement",
  TASK_RESPONSE: "Task Achievement / Response",
  COHERENCE_COHESION: "Coherence & Cohesion",
  FLUENCY_COHERENCE: "Fluency & Coherence",
  LEXICAL_RESOURCE: "Lexical Resource",
  GRAMMATICAL_RANGE_ACCURACY: "Grammatical Range & Accuracy",
  PRONUNCIATION: "Pronunciation",
};

function AuthenticatedAudio({ url }: { url: string }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void apiMediaUrl(url).then((resolved) => {
      objectUrl = resolved;
      if (active) setSource(resolved);
      else revokeMediaUrl(resolved);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) revokeMediaUrl(objectUrl);
    };
  }, [url]);
  return source ? <audio controls preload="metadata" src={source} className={styles.audioPlayer}>Trình duyệt không hỗ trợ audio.</audio> : <small>Đang tải audio…</small>;
}

function completed(task: StudentProgressTask) {
  return Boolean(task.attemptId && (
    task.evidenceCount || ["SUBMITTED", "WAITING_REVIEW", "NEEDS_REVISION", "COMPLETED"].includes(task.status || "")
  ));
}

function hasFeedback(task: StudentProgressTask) {
  return Boolean(task.feedbackAt || task.feedback || task.criteria?.length || task.annotations?.length);
}

function highlightedSubmission(text: string, annotations: StudentProgressTask["annotations"]) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  [...annotations].sort((left, right) => left.startOffset - right.startOffset).forEach((annotation, index) => {
    const start = Math.max(cursor, annotation.startOffset);
    const end = Math.max(start, annotation.endOffset);
    if (start > cursor) parts.push(text.slice(cursor, start));
    if (end > start) {
      parts.push(<mark key={`${annotation.id ?? "annotation"}-${index}`} className={styles.inlineHighlight} title={annotation.comment}>{text.slice(start, end)}</mark>);
      cursor = end;
    }
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function textChange(before: string, after: string) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  return { removed: before.slice(start, beforeEnd), added: after.slice(start, afterEnd) };
}

function ProgressActivity({ courseId, task, reload }: {
  courseId: string;
  task: StudentProgressTask;
  reload: () => Promise<void>;
}) {
  const unlocked = completed(task);
  const hasSubmitted = Boolean(task.submissionStatus && task.submissionStatus !== "DRAFT");
  const revisionRequested = ["REVISION_REQUESTED", "REJECTED"].includes(task.reviewStatus ?? "");
  const canEditSubmission = task.canEdit;
  const canSubmit = task.canSubmit;
  const reflectionExpired = Boolean(task.reflectionDueAt && new Date(task.reflectionDueAt).getTime() < Date.now());
  const canReflect = hasFeedback(task) && !reflectionExpired;
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
  const [submissionText, setSubmissionText] = useState(task.submissionText ?? "");
  const [reflection, setReflection] = useState(task.reflection ?? "");
  const [audioFiles, setAudioFiles] = useState<Array<{ id: string; title: string; file: File }>>([]);
  const [revisions, setRevisions] = useState<Awaited<ReturnType<typeof fetchStudentAssignmentRevisions>>>([]);
  const [compareAttemptNo, setCompareAttemptNo] = useState<number | null>(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [actionError, setActionError] = useState("");
  const audioPreviewUrls = useMemo(() => audioFiles.map((item) => ({
    id: item.id,
    url: URL.createObjectURL(item.file),
  })), [audioFiles]);

  useEffect(() => () => {
    audioPreviewUrls.forEach((item) => URL.revokeObjectURL(item.url));
  }, [audioPreviewUrls]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError("");
    try {
      await action();
      await reload();
      return true;
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Không thể lưu thay đổi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveSubmission(submit: boolean) {
    await run(() => saveStudentAssignmentSubmission(courseId, task.classActivityId, submissionText, submit));
  }

  async function saveStudentReflection() {
    if (!task.attemptId) return;
    await run(() => saveStudentAssignmentReflection(courseId, task.attemptId!, reflection));
  }

  async function saveAudioGroup(submit: boolean) {
    if (!audioFiles.length) {
      setActionError("Hãy chọn ít nhất một file audio Speaking trước.");
      return;
    }
    if (await run(async () => {
      for (const [index, item] of audioFiles.entries()) {
        await saveStudentAssignmentAudio(
          courseId,
          task.classActivityId,
          item.file,
          item.id,
          item.title.trim() || `Bài nói ${index + 1}`,
          index,
          false,
        );
      }
      if (submit) await saveStudentAssignmentSubmission(courseId, task.classActivityId, submissionText, true);
    })) {
      setAudioFiles([]);
    }
  }

  async function toggleRevisions() {
    if (showRevisions) {
      setShowRevisions(false);
      return;
    }
    setLoadingRevisions(true);
    setActionError("");
    try {
      const nextRevisions = await fetchStudentAssignmentRevisions(courseId, task.classActivityId);
      setRevisions(nextRevisions);
      setCompareAttemptNo(null);
      setShowRevisions(true);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Không thể tải lịch sử revision.");
    } finally {
      setLoadingRevisions(false);
    }
  }

  const compareIndex = compareAttemptNo == null ? -1 : revisions.findIndex((revision) => revision.attemptNo === compareAttemptNo);
  const compareCurrent = compareIndex >= 0 ? revisions[compareIndex] : null;
  const comparePrevious = compareIndex >= 0 ? revisions[compareIndex + 1] ?? null : null;
  const compareDelta = compareCurrent && comparePrevious && compareCurrent.textContent && comparePrevious.textContent
    ? textChange(comparePrevious.textContent, compareCurrent.textContent)
    : null;

  return <article id={`student-activity-${task.classActivityId}`} className={styles.activity}>
    <div>
      <span className={styles.eyebrow}>{task.skill} · Bài được giao</span>
      <h3>{task.title}</h3>
      <div className={styles.meta}>
        <span>{unlocked ? <CheckCircle size={15} weight="fill" color="#168765" /> : <LockKey size={14} />} {unlocked ? "Đã hoàn thành đề" : "Chưa hoàn thành đề"}</span>
        {task.late ? <span className={styles.lateState}>Nộp muộn</span> : null}
        {effectiveDeadline ? <span>Hạn hiệu lực {new Date(effectiveDeadline).toLocaleString("vi-VN")}</span> : null}
        {task.extensionDueAt && task.assignmentDueAt ? <span>Deadline gốc {new Date(task.assignmentDueAt).toLocaleString("vi-VN")}</span> : null}
        {task.latePolicy ? <span>{task.latePolicy === "BLOCK" ? "Chặn sau hạn" : task.latePolicy === "ALLOW" ? "Cho nộp sau hạn" : "Nộp sau hạn sẽ đánh dấu muộn"}</span> : null}
        {task.lateGraceMinutes > 0 ? <span>Grace {task.lateGraceMinutes} phút</span> : null}
        {task.extensionDueAt ? <span>Gia hạn đến {new Date(task.extensionDueAt).toLocaleString("vi-VN")}</span> : null}
        {task.score != null ? <span>Kết quả {task.score}/{task.maxScore ?? "—"}</span> : null}
        {task.evidenceCount ? <span><ImageSquare size={14} /> {task.evidenceCount} minh chứng</span> : null}
      </div>
      {!unlocked ? <Link className={styles.assignmentLink} href="/student/assignments">Làm bài được giao</Link> : null}
      {shouldRemindReview ? <div className={styles.reviewReminder} role="status"><BellRinging size={17} weight="fill" /><span><strong>Còn {minutesToDeadline} phút</strong> · Bạn chưa hoàn tất checklist sau bài làm.</span></div> : null}
      {unlocked && !progressReportDone && reviewHref ? <Link className={styles.reviewLink} href={reviewHref}>Hoàn tất phân tích <ArrowRight size={15} weight="bold" /></Link> : null}
      {task.assignmentId ? <div className={styles.assignmentForm}>
        <label className={styles.field}>Nội dung submission
          <textarea rows={5} value={submissionText} disabled={busy || !canEditSubmission} onChange={(event) => setSubmissionText(event.target.value)} placeholder={task.assignmentDescription ?? "Nhập bài làm của bạn…"} />
        </label>
        <div className={styles.assignmentActions}>
          <button type="button" className={styles.saveButton} disabled={busy || !canEditSubmission} onClick={() => void saveSubmission(false)}>Lưu nháp</button>
          <button type="button" className={styles.assignmentLink} disabled={busy || !canSubmit} onClick={() => void saveSubmission(true)}>{revisionRequested ? "Nộp bản sửa" : "Nộp bài"}</button>
        </div>
        {task.lockReason ? <small className={styles.lockNote}><LockKey size={14} /> {task.lockReason}</small> : null}
        {task.skill === "SPEAKING" ? <div className={styles.audioSubmission}>
          <label className={styles.field}>Nhóm audio Speaking
            <input
              type="file"
              multiple
              accept="audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,audio/x-wav"
              disabled={busy || !canEditSubmission}
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                setAudioFiles((current) => [...current, ...selected.map((file, index) => ({
                  id: `response-${Date.now()}-${current.length + index + 1}`,
                  title: `Bài nói ${current.length + index + 1}`,
                  file,
                }))]);
                event.target.value = "";
              }}
            />
          </label>
          {audioFiles.length ? <div className={styles.audioGroup}>{audioFiles.map((item, index) => <div className={styles.audioItem} key={item.id}>
            <div className={styles.audioItemHeader}>
              <input aria-label={`Tên audio ${index + 1}`} value={item.title} disabled={busy || !canEditSubmission} onChange={(event) => setAudioFiles((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry))} />
              <button type="button" aria-label={`Xóa ${item.title}`} disabled={busy || !canEditSubmission} onClick={() => setAudioFiles((current) => current.filter((entry) => entry.id !== item.id))}><Trash size={16} /></button>
            </div>
            <small>{item.file.name}</small>
            <audio controls preload="metadata" src={audioPreviewUrls.find((preview) => preview.id === item.id)?.url} className={styles.audioPlayer}>Trình duyệt không hỗ trợ audio.</audio>
          </div>)}</div> : <span className={styles.audioState}><Plus size={14} /> Có thể chọn và nộp nhiều audio trong cùng một attempt.</span>}
          {task.audioFiles?.length ? <div className={styles.audioGroup}>{task.audioFiles.map((audio, index) => <div key={audio.id} className={styles.audioItem}><strong>{audio.promptTitle || `Bài nói ${index + 1}`}</strong><small>{audio.originalName}</small><AuthenticatedAudio url={audio.url} /></div>)}</div> : null}
          {task.audioSubmitted ? <span className={styles.audioState}>Attempt hiện tại đã có {task.audioFiles?.length || ""} audio được lưu; bạn có thể bổ sung thêm phần.</span> : null}
          <div className={styles.assignmentActions}>
            <button type="button" className={styles.saveButton} disabled={busy || !canEditSubmission || !audioFiles.length} onClick={() => void saveAudioGroup(false)}>Lưu nhóm audio</button>
            <button type="button" className={styles.assignmentLink} disabled={busy || !canSubmit || !audioFiles.length} onClick={() => void saveAudioGroup(true)}>{revisionRequested ? "Nộp nhóm audio sửa" : "Nộp nhóm audio"}</button>
          </div>
        </div> : null}
        {task.feedback || task.criteria?.length || task.annotations?.length ? <div className={styles.feedback}><strong>Feedback giáo viên</strong>{task.feedback ? <p>{task.feedback}</p> : null}{task.skill === "WRITING" && task.submissionText && task.annotations?.length ? <div className={styles.annotatedSubmission}><small>Bài viết có đánh dấu inline comment</small><p>{highlightedSubmission(task.submissionText, task.annotations)}</p></div> : null}{task.criteria?.length ? <div className={styles.rubricFeedback}>{task.criteria.map((criterion) => <div key={criterion.criterion}><span>{RUBRIC_LABELS[criterion.criterion] ?? criterion.criterion}</span><b>{criterion.score == null ? "—" : criterion.score}</b>{criterion.feedback ? <small>{criterion.feedback}</small> : null}</div>)}</div> : null}{task.annotations?.length ? <div className={styles.annotationFeedback}>{task.annotations.map((annotation) => <div key={annotation.id}><blockquote>“{annotation.quotedText}”</blockquote><p>{annotation.comment}</p>{annotation.suggestion ? <small>Gợi ý: {annotation.suggestion}</small> : null}</div>)}</div> : null}</div> : null}
        {hasFeedback(task) ? <label className={styles.field}>Reflection sau feedback{task.reflectionDueAt ? <small>Hạn: {new Date(task.reflectionDueAt).toLocaleString("vi-VN")}{reflectionExpired ? " · Đã hết hạn" : ""}</small> : null}
          <textarea rows={3} value={reflection} disabled={busy || !canReflect} onChange={(event) => setReflection(event.target.value)} placeholder="Tôi đã sửa gì? Lỗi nào sẽ tránh ở lần sau?" />
          <button type="button" className={styles.saveButton} disabled={!task.attemptId || busy || !canReflect} onClick={() => void saveStudentReflection()}>Lưu reflection</button>
        </label> : null}
        <button type="button" className={styles.historyButton} disabled={busy || loadingRevisions} onClick={() => void toggleRevisions()}>
          {loadingRevisions ? "Đang tải lịch sử…" : showRevisions ? "Ẩn lịch sử revision" : "Xem lịch sử revision"}
        </button>
        {showRevisions ? <div className={styles.revisionHistory} aria-label="Lịch sử các lần nộp bài">
          {revisions.length ? revisions.map((revision, revisionIndex) => <div className={styles.revisionRow} key={revision.attemptId}>
            <div className={styles.revisionHeader}><strong>Lần {revision.attemptNo}</strong><span>{revision.submittedAt ? new Date(revision.submittedAt).toLocaleString("vi-VN") : "Bản nháp"}</span><em>{revision.score == null ? revision.status : `${revision.score}/${task.maxScore ?? "—"}`}</em></div>
            <small>{revision.reviewStatus ?? "Chưa có feedback"}{revision.audioSubmitted ? " · Có audio" : ""}{revision.extensionDueAt ? ` · Gia hạn đến ${new Date(revision.extensionDueAt).toLocaleString("vi-VN")}` : ""}</small>
            {revision.feedback ? <p>{revision.feedback}</p> : null}
            {revision.reflection ? <p className={styles.revisionReflection}>Reflection: {revision.reflection}</p> : null}
            {revisions[revisionIndex + 1] ? <button type="button" className={styles.compareButton} onClick={() => setCompareAttemptNo(revision.attemptNo)}>{compareAttemptNo === revision.attemptNo ? "Đang xem so sánh" : `So sánh với lần ${revisions[revisionIndex + 1].attemptNo}`}</button> : null}
          </div>) : <span className={styles.historyEmpty}>Chưa có lịch sử submission.</span>}
          {compareCurrent && comparePrevious ? <div className={styles.revisionCompare}><div className={styles.revisionCompareHeader}><strong>So sánh lần {comparePrevious.attemptNo} → lần {compareCurrent.attemptNo}</strong><button type="button" onClick={() => setCompareAttemptNo(null)}>Ẩn</button></div><div className={styles.revisionCompareGrid}><section><small>Bản trước</small><p>{comparePrevious.textContent || (comparePrevious.audioSubmitted ? "Có audio Speaking" : "Không có nội dung text")}</p></section><section><small>Bản sau</small><p>{compareCurrent.textContent || (compareCurrent.audioSubmitted ? "Có audio Speaking" : "Không có nội dung text")}</p></section></div>{compareDelta ? <div className={styles.revisionDelta}><small>Phần thay đổi chính</small>{compareDelta.removed ? <p><b>Xóa:</b> <del>{compareDelta.removed}</del></p> : null}{compareDelta.added ? <p><b>Thêm:</b> <mark>{compareDelta.added}</mark></p> : null}{!compareDelta.removed && !compareDelta.added ? <p>Text không thay đổi.</p> : null}</div> : <p className={styles.revisionDelta}>Với Speaking, lịch sử hiện so sánh trạng thái audio và feedback của hai lần nộp.</p>}</div> : null}
        </div> : null}
        {actionError ? <div role="alert" className={styles.notice}>{actionError}</div> : null}
      </div> : null}
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
      {visible.length ? visible.map((task) => <ProgressActivity key={task.classActivityId} courseId={courseId} task={task} reload={load} />) : <div className={styles.empty}>Session này chưa có bài được giao.</div>}
    </div>
  </section>;
}
