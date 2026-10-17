import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Check, CheckSquare, Clock, Ear, ImageSquare, LockKey, MagnifyingGlass,
  Microphone, Pencil, Square, WarningCircle,
} from "@phosphor-icons/react";
import type {
  ActivityAttempt, ActivityChecklistItem, ClassActivityProgress, ClassSession, SkillPair,
} from "../../academic-types";
import { apiFetch } from "../../lib/api";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
}

type Roster = { enrollment: { id: string; courseId: string; studentId: string; status: string }; student: StudentSummary }[];
type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

interface CourseProgressProps {
  courseId: string;
  skillPair: SkillPair;
  roster: Roster;
  initialSessions?: ClassSession[];
  onSelectStudent?: (studentId: string) => void;
}

const STANDARD_TASKS = [
  { key: "translation", label: "Dịch bài" },
  { key: "vocabulary", label: "Từ vựng + test" },
  { key: "reread", label: "Đọc hiểu không cần từ vựng" },
] as const;

const REPORT_ROWS = [
  { key: "result", label: "Kết quả" },
  { key: "errors", label: "Phân tích lỗi sai" },
  ...STANDARD_TASKS,
  { key: "duration", label: "Tổng thời gian làm bài" },
  { key: "comprehension", label: "Mức độ thấu hiểu" },
] as const;
type ReportRow = typeof REPORT_ROWS[number];

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)}g ${minutes % 60}p`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function latestAttempt(activity: ClassActivityProgress, studentId: string) {
  return activity.attempts
    .filter((attempt) => attempt.studentId === studentId)
    .sort((left, right) => right.attemptNo - left.attemptNo)[0];
}

function isExerciseComplete(attempt?: ActivityAttempt) {
  return Boolean(attempt && (
    attempt.completedAt || attempt.submittedAt || attempt.evidence?.length ||
    ["SUBMITTED", "WAITING_REVIEW", "NEEDS_REVISION", "COMPLETED"].includes(attempt.status)
  ));
}

function taskKey(label: string) {
  const normalized = label.toLocaleLowerCase("vi");
  if (normalized.includes("dịch")) return "translation";
  if (normalized.includes("từ vựng")) return "vocabulary";
  if (normalized.includes("không cần từ") || normalized.includes("đọc hiểu")) return "reread";
  return null;
}

function checklistFor(activity: ClassActivityProgress) {
  const resolved = new Map<string, ActivityChecklistItem>();
  (activity.checklistItems ?? []).forEach((item) => {
    const key = taskKey(item.label);
    if (key && !resolved.has(key)) resolved.set(key, item);
  });
  return resolved;
}

function TaskState({ activity, attempt, task }: {
  activity: ClassActivityProgress;
  attempt?: ActivityAttempt;
  task: typeof STANDARD_TASKS[number];
}) {
  const item = checklistFor(activity).get(task.key);
  const complete = item
    ? attempt?.checklistResults?.some((result) => result.checklistItemId === item.id && result.completed)
    : false;
  const unlocked = isExerciseComplete(attempt);

  if (!unlocked) {
    return <span className="inline-flex text-on-surface-variant/65" role="img" aria-label="Đã khóa" title="Học viên cần hoàn thành đề hoặc gửi minh chứng trước"><LockKey size={16} /></span>;
  }
  if (complete) {
    return <span className="inline-flex text-emerald-700" role="img" aria-label="Đã tích" title="Đã hoàn thành"><CheckSquare size={18} weight="fill" /></span>;
  }
  return <span className="inline-flex text-on-surface-variant" role="img" aria-label="Chưa tích" title="Chưa hoàn thành"><Square size={18} /></span>;
}

function StudentMetric({ activity, studentId, row }: {
  activity: ClassActivityProgress;
  studentId: string;
  row: ReportRow;
}) {
  const attempt = latestAttempt(activity, studentId);
  if (row.key === "result") {
    if (!isExerciseComplete(attempt)) return <span className="text-on-surface-variant">Chưa hoàn thành</span>;
    const score = attempt?.score == null ? "Chưa chấm" : attempt.maxScore ? `${attempt.score}/${attempt.maxScore}` : String(attempt.score);
    return <span className="inline-flex rounded-full bg-primary-container/25 px-2.5 py-1 font-extrabold text-primary">{score}</span>;
  }
  if (row.key === "errors") {
    return <span className={attempt?.errorAnalysis ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{attempt?.errorAnalysis || "Chưa có phân tích"}</span>;
  }
  const task = STANDARD_TASKS.find((item) => item.key === row.key);
  if (task) return <TaskState activity={activity} attempt={attempt} task={task} />;
  if (row.key === "duration") {
    return <span className="inline-flex items-center gap-1 font-bold tabular-nums"><Clock size={14} className="text-on-surface-variant" />{formatDuration(attempt?.durationSeconds ?? null)}</span>;
  }
  if (attempt?.comprehensionPercent == null) return <span className="text-on-surface-variant">—</span>;
  return <div className="mx-auto w-24"><strong className="text-xs tabular-nums">{attempt.comprehensionPercent}%</strong><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${attempt.comprehensionPercent}%` }} /></div></div>;
}

export default function CourseProgress({ courseId, skillPair, roster, initialSessions, onSelectStudent }: CourseProgressProps) {
  const skillTabs = skillPair === "LISTENING_READING"
    ? ([{ id: "LISTENING", label: "Listening", icon: Ear }, { id: "READING", label: "Reading", icon: BookOpen }] as const)
    : ([{ id: "SPEAKING", label: "Speaking", icon: Microphone }, { id: "WRITING", label: "Writing", icon: Pencil }] as const);
  const [selectedSkill, setSelectedSkill] = useState<SkillType>(skillTabs[0].id);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [progress, setProgress] = useState<ClassActivityProgress[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const request = initialSessions?.length
      ? Promise.resolve(initialSessions)
      : apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`);
    void request.then((classSessions) => {
      if (cancelled) return;
      setSessions(classSessions);
      setSelectedSessionId((current) => current && classSessions.some(session => session.id === current)
        ? current
        : classSessions[0]?.id || "");
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách session.");
    });
    return () => { cancelled = true; };
  }, [courseId, initialSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setProgress([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ sessionId: selectedSessionId, skill: selectedSkill });
    void apiFetch<ClassActivityProgress[]>(`/admin/courses/${courseId}/progress?${query}`)
      .then(value => { if (!cancelled) setProgress(value); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải báo cáo tiến độ.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, selectedSessionId, selectedSkill]);

  useEffect(() => setSelectedSkill(skillTabs[0].id), [skillPair]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const activities = useMemo(() => progress.filter((activity) => (
    activity.skill === selectedSkill && activity.sessionId === selectedSessionId
  )), [progress, selectedSessionId, selectedSkill]);
  const filteredRoster = useMemo(() => {
    const query = studentQuery.trim().toLocaleLowerCase("vi");
    return query ? roster.filter(({ student }) => `${student.fullName} ${student.studentCode}`.toLocaleLowerCase("vi").includes(query)) : roster;
  }, [roster, studentQuery]);
  const completedCells = activities.reduce((sum, activity) => sum + activity.attempts.filter(isExerciseComplete).length, 0);
  const totalCells = Math.max(1, activities.length * roster.length);

  return (
    <div className="space-y-3">
      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 shadow-xs" aria-label="Bộ lọc báo cáo tiến độ">
        <div className="flex rounded-lg bg-surface-container-low p-1">
          {skillTabs.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.id} type="button" onClick={() => setSelectedSkill(tab.id)} aria-pressed={selectedSkill === tab.id} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors ${selectedSkill === tab.id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface"}`}><Icon size={16} />{tab.label}</button>;
          })}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <label className="relative block">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="search" value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Tìm học viên" aria-label="Tìm học viên theo tên hoặc mã" className="h-9 w-52 rounded-lg border border-outline-variant/50 bg-surface pl-9 pr-3 text-xs font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-1 focus:ring-primary" />
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-primary-container/15 px-3 py-2 text-xs font-bold text-primary" title="Số bài học viên đã hoàn thành hoặc đã nộp minh chứng">
            <Check size={15} weight="bold" /> {Math.round((completedCells / totalCells) * 100)}% hoàn thành
          </div>
        </div>
      </section>

      {error ? <div role="alert" className="flex items-center gap-2 rounded-xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm font-semibold text-error"><WarningCircle size={18} />{error}</div> : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-fixed border-collapse text-left text-xs">
            <colgroup>
              <col className="w-24" />
              <col className="w-44" />
              <col className="w-36" />
              {filteredRoster.map(({ student }) => <col key={student.id} className="w-48" />)}
            </colgroup>
            <thead className="bg-surface-container-low text-[11px] font-extrabold text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th colSpan={3} className="sticky left-0 z-30 border-r border-outline-variant/35 bg-surface-container-low p-1.5">
                  <select aria-label="Chọn session báo cáo" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-primary/25 bg-surface px-3 text-xs font-extrabold text-on-surface shadow-sm focus:border-primary focus:ring-primary">
                    {sessions.map((session) => <option key={session.id} value={session.id}>Session {session.sessionNo} · {session.title || "Chưa đặt tên"}</option>)}
                  </select>
                </th>
                {filteredRoster.map(({ student }) => <th key={student.id} className="border-r border-outline-variant/25 px-2 py-2 text-center">
                  <button type="button" onClick={() => onSelectStudent?.(student.id)} className="font-extrabold text-on-surface hover:text-primary hover:underline">{student.fullName}</button>
                </th>)}
              </tr>
            </thead>
            {!loading && filteredRoster.length > 0 && activities.map((activity) => {
              const scheduleValue = activity.dueAt || selectedSession?.startsAt;
              const completed = activity.attempts.filter(isExerciseComplete).length;
              const evidence = activity.attempts.reduce((sum, attempt) => sum + (attempt.evidence?.length || 0), 0);
              return <tbody key={activity.classActivityId} className="border-b-2 border-outline-variant/45">
                {REPORT_ROWS.map((row, rowIndex) => <tr key={row.key} className="border-b border-outline-variant/20 align-middle hover:bg-surface-container-low/35">
                  {rowIndex === 0 ? <th rowSpan={REPORT_ROWS.length} scope="rowgroup" className="sticky left-0 z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 align-top">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">{activity.dueAt ? "Deadline" : "Ngày học"}</span>
                    <time className="mt-1 block font-bold leading-5 text-on-surface">{formatDateTime(scheduleValue)}</time>
                  </th> : null}
                  {rowIndex === 0 ? <th rowSpan={REPORT_ROWS.length} scope="rowgroup" className="sticky left-24 z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 align-top">
                    <div className="flex items-start gap-2"><BookOpen size={17} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block leading-5 text-on-surface">{activity.title}</strong><span className="mt-1 block text-[10px] font-semibold text-on-surface-variant">{completed}/{roster.length} hoàn thành</span>{evidence ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary"><ImageSquare size={13} />{evidence} minh chứng</span> : null}</div></div>
                  </th> : null}
                  <th scope="row" className="sticky left-[17rem] z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 text-[11px] font-bold leading-4 text-on-surface">{row.label}</th>
                  {filteredRoster.map(({ student }) => <td key={student.id} className="border-r border-outline-variant/20 px-2 py-2 text-center leading-5 text-on-surface"><StudentMetric activity={activity} studentId={student.id} row={row} /></td>)}
                </tr>)}
              </tbody>;
            })}
            {!loading && (!activities.length || !filteredRoster.length) ? <tbody><tr><td colSpan={Math.max(3, filteredRoster.length + 3)} className="px-6 py-14 text-center text-sm text-on-surface-variant">{!activities.length ? "Session này chưa có bài được xuất bản cho kỹ năng đã chọn." : roster.length ? "Không tìm thấy học viên phù hợp." : "Khóa học chưa có học viên."}</td></tr></tbody> : null}
            {loading ? <tbody><tr><td colSpan={Math.max(3, filteredRoster.length + 3)} className="px-6 py-14 text-center text-sm text-on-surface-variant">Đang tải báo cáo tiến độ…</td></tr></tbody> : null}
          </table>
        </div>
      </section>
    </div>
  );
}
