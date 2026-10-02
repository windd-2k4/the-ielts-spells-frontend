"use client";

import type { SaveWritingResponseItem, StudentWritingAttempt } from "@ielts/contracts";
import { ArrowLeft, CheckCircle, CircleNotch, Clock, FloppyDisk, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { getWritingAttempt, saveWritingResponses, submitWritingAttempt } from "./writingApi";
import styles from "./WritingAttemptPlayer.module.css";

type SaveState = "idle" | "saving" | "saved" | "offline" | "failed";

function wordCount(value: string) {
  const text = value.trim();
  return text ? text.split(/\s+/).length : 0;
}

function formatTime(total: number) {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function draftKey(attemptId: string) { return `writing-attempt-draft:${attemptId}`; }

function readDraft(attemptId: string): SaveWritingResponseItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(attemptId)) ?? "[]") as SaveWritingResponseItem[];
    return Array.isArray(value) ? value.filter((item) => item && typeof item.taskKey === "string" && typeof item.text === "string" && typeof item.clientRevision === "number") : [];
  } catch { return []; }
}

function storeDraft(attemptId: string, responses: SaveWritingResponseItem[]) {
  try { localStorage.setItem(draftKey(attemptId), JSON.stringify(responses)); } catch {}
}

function clearDraft(attemptId: string) {
  try { localStorage.removeItem(draftKey(attemptId)); } catch {}
}

export function WritingAttemptPlayer({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><WritingAttemptContent attemptId={attemptId} /></StudentSessionGate>;
}

function WritingAttemptContent({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<StudentWritingAttempt | null>(null);
  const [activeTaskKey, setActiveTaskKey] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitStartedRef = useRef(false);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    let active = true;
    void getWritingAttempt(attemptId)
      .then((value) => {
        if (!active) return;
        if (value.status !== "IN_PROGRESS") {
          router.replace(`/student/writing/attempts/${attemptId}/result`);
          return;
        }
        const nextAnswers: Record<string, string> = {};
        const nextRevisions: Record<string, number> = {};
        value.responses.forEach((response) => {
          nextAnswers[response.taskKey] = response.text;
          nextRevisions[response.taskKey] = response.clientRevision;
        });
        const local = readDraft(attemptId);
        const recovered = new Set<string>();
        local.forEach((response) => {
          if (response.clientRevision > (nextRevisions[response.taskKey] ?? -1)) {
            nextAnswers[response.taskKey] = response.text;
            nextRevisions[response.taskKey] = response.clientRevision;
            recovered.add(response.taskKey);
          }
        });
        setAttempt(value);
        setAnswers(nextAnswers);
        setRevisions(nextRevisions);
        setDirtyKeys(recovered);
        setActiveTaskKey(value.tasks[0]?.taskKey ?? "");
        setRemaining(value.remainingSeconds);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải bài Writing."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attemptId, router]);

  const pendingPayload = useMemo(() => Array.from(dirtyKeys).map((taskKey) => ({
    taskKey,
    text: answers[taskKey] ?? "",
    clientRevision: revisions[taskKey] ?? 0,
  })), [answers, dirtyKeys, revisions]);

  const flush = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;
    if (!pendingPayload.length) return true;
    if (!navigator.onLine) { setSaveState("offline"); return false; }
    const snapshot = pendingPayload;
    setSaveState("saving");
    const operation = (async () => {
      try {
        await saveWritingResponses(attemptId, snapshot);
        setDirtyKeys((current) => {
          const next = new Set(current);
          snapshot.forEach((item) => {
            if ((revisions[item.taskKey] ?? 0) === item.clientRevision) next.delete(item.taskKey);
          });
          return next;
        });
        setSaveState("saved");
        return true;
      } catch (reason) {
        setSaveState(navigator.onLine ? "failed" : "offline");
        setError(reason instanceof Error ? reason.message : "Không thể tự động lưu bài viết.");
        return false;
      } finally {
        savePromiseRef.current = null;
      }
    })();
    savePromiseRef.current = operation;
    return operation;
  }, [attemptId, pendingPayload, revisions]);

  useEffect(() => {
    if (!pendingPayload.length || saveState === "saving") return;
    storeDraft(attemptId, pendingPayload);
    const timeout = window.setTimeout(() => { void flush(); }, 1200);
    return () => window.clearTimeout(timeout);
  }, [attemptId, flush, pendingPayload, saveState]);

  useEffect(() => {
    if (!dirtyKeys.size) clearDraft(attemptId);
  }, [attemptId, dirtyKeys.size]);

  useEffect(() => {
    const online = () => { if (dirtyKeys.size) void flush(); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [dirtyKeys.size, flush]);

  const submit = useCallback(async (automatic = false) => {
    if (submitStartedRef.current) return;
    if (!automatic && !window.confirm("Bạn chắc chắn muốn nộp bài Writing? Sau khi nộp, bài viết không thể chỉnh sửa.")) return;
    submitStartedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const saved = await flush();
      if (!saved && dirtyKeys.size) throw new Error("Bài còn thay đổi chưa đồng bộ. Hãy kiểm tra kết nối mạng rồi thử lại.");
      await submitWritingAttempt(attemptId);
      clearDraft(attemptId);
      router.replace(`/student/writing/attempts/${attemptId}/result`);
    } catch (reason) {
      submitStartedRef.current = false;
      setSubmitting(false);
      setError(reason instanceof Error ? reason.message : "Không thể nộp bài Writing.");
    }
  }, [attemptId, dirtyKeys.size, flush, router]);

  useEffect(() => {
    if (!attempt) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void submit(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, submit]);

  if (loading) return <div className={styles.state}><CircleNotch size={26} className={styles.spin} /> Đang chuẩn bị phòng thi Writing...</div>;
  if (!attempt) return <div className={styles.state}><WarningCircle size={28} /><strong>Không thể mở bài Writing</strong><p>{error}</p><Link href="/student/practice?skill=WRITING">Quay lại danh mục</Link></div>;

  const activeTask = attempt.tasks.find((task) => task.taskKey === activeTaskKey) ?? attempt.tasks[0];
  if (!activeTask) return <div className={styles.state}>Đề Writing chưa có task hợp lệ.</div>;
  const currentText = answers[activeTask.taskKey] ?? "";
  const words = wordCount(currentText);

  function updateAnswer(text: string) {
    const taskKey = activeTask.taskKey;
    const nextRevisions = { ...revisions, [taskKey]: (revisions[taskKey] ?? 0) + 1 };
    const nextAnswers = { ...answers, [taskKey]: text };
    setAnswers(nextAnswers);
    setRevisions(nextRevisions);
    setDirtyKeys((current) => new Set(current).add(taskKey));
    setSaveState(navigator.onLine ? "idle" : "offline");
    storeDraft(attemptId, Object.keys(nextAnswers).map((key) => ({ taskKey: key, text: nextAnswers[key] ?? "", clientRevision: nextRevisions[key] ?? 0 })));
  }

  return (
    <main className={styles.examShell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href="/student/practice?skill=WRITING" aria-label="Thoát bài thi"><ArrowLeft size={20} /></Link>
          <div><span>The IELTS Spells</span><strong>{attempt.title}</strong></div>
        </div>
        <div className={`${styles.timer} ${remaining < 300 ? styles.urgent : ""}`}><Clock size={19} /><span>{formatTime(remaining)}</span></div>
        <div className={styles.headerActions}>
          <span className={styles.saveState} aria-live="polite">
            {saveState === "saving" ? <CircleNotch className={styles.spin} /> : saveState === "saved" ? <CheckCircle /> : <FloppyDisk />}
            {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : saveState === "offline" ? "Saved on this device" : saveState === "failed" ? "Save failed" : "Autosave"}
          </span>
          <button type="button" onClick={() => void submit(false)} disabled={submitting} className={styles.submit}>
            {submitting ? <CircleNotch className={styles.spin} /> : <PaperPlaneTilt />} Submit
          </button>
        </div>
      </header>

      <nav className={styles.taskTabs} aria-label="Writing tasks">
        {attempt.tasks.map((task) => {
          const count = wordCount(answers[task.taskKey] ?? "");
          return <button key={task.taskKey} type="button" onClick={() => setActiveTaskKey(task.taskKey)} aria-current={task.taskKey === activeTask.taskKey ? "page" : undefined}>
            <span>Task {task.taskNo}</span><small>{count} / {task.minWords} words</small>
          </button>;
        })}
      </nav>

      {error ? <div role="alert" className={styles.error}><WarningCircle size={17} />{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div> : null}

      <section className={styles.workspace}>
        <article className={styles.promptPane}>
          <div className={styles.partLabel}>Writing Task {activeTask.taskNo}</div>
          <h1>{activeTask.title}</h1>
          <p className={styles.instruction}>You should spend about {activeTask.suggestedTimeMinutes} minutes on this task.</p>
          {activeTask.imageUrl ? <img src={activeTask.imageUrl} alt={activeTask.imageAltText ?? "Writing task material"} className={styles.taskImage} /> : null}
          <div className={styles.promptHtml} dangerouslySetInnerHTML={{ __html: activeTask.promptHtml }} />
          <p className={styles.minimum}>Write at least <strong>{activeTask.minWords} words.</strong></p>
        </article>

        <section className={styles.answerPane} aria-label={`Answer for Writing Task ${activeTask.taskNo}`}>
          <div className={styles.answerHeading}><div><span>Your answer</span><small>Task {activeTask.taskNo}</small></div><strong className={words < activeTask.minWords ? styles.belowMinimum : styles.metMinimum}>{words} words</strong></div>
          <textarea value={currentText} onChange={(event) => updateAnswer(event.target.value)} spellCheck aria-label={`Writing Task ${activeTask.taskNo} answer`} placeholder="Type your answer here..." autoFocus />
          <footer><span>Your work is saved automatically.</span><span>{words < activeTask.minWords ? `${activeTask.minWords - words} more words recommended` : "Minimum word count reached"}</span></footer>
        </section>
      </section>
    </main>
  );
}
