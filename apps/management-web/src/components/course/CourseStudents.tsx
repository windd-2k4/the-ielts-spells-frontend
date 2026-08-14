import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowSquareOut, ArrowsLeftRight, CalendarBlank, CaretDown, Check, CheckCircle, Clock,
  DotsThreeVertical, FloppyDisk, MagnifyingGlass, Minus, PauseCircle, PlayCircle, Plus,
  SignOut, Sparkle, SpinnerGap, Student, Trophy, WarningCircle, X,
} from "@phosphor-icons/react";
import type {
  ClassActivityProgress, Course, Enrollment, EnrollmentStatus, Page, SkillPair, StudentSummary,
} from "../../academic-types";
import { classStatusLabel, enrollmentStatusLabel, skillPairLabel } from "../../academic-types";
import { apiFetch } from "../../lib/api";

type Roster = { enrollment: Enrollment; student: StudentSummary }[];
type ExamStatus = "NOT_REGISTERED" | "REGISTERED" | "ISSUE";
type ExamDraft = {
  plannedExamMonth: string;
  actualExamDate: string;
  examRegistrationStatus: ExamStatus;
  targetNote: string;
};

interface CourseStudentsProps {
  courseId: string;
  skillPair: SkillPair;
  roster: Roster;
  onSelectStudent: (studentId: string) => void;
  onRosterChanged: () => Promise<void> | void;
}

const statusLabel: Record<ExamStatus, string> = {
  NOT_REGISTERED: "Chưa đăng ký",
  REGISTERED: "Đã đăng ký",
  ISSUE: "Có vấn đề",
};

const statusTone: Record<ExamStatus, string> = {
  NOT_REGISTERED: "border-sky-300 bg-sky-100 text-sky-800 font-bold",
  REGISTERED: "border-primary bg-primary text-on-primary font-bold shadow-xs",
  ISSUE: "border-amber-500 bg-amber-500 text-white font-bold shadow-xs",
};

function monthInput(value: string | null) {
  return value ? value.slice(0, 7) : "";
}

function draftOf(enrollment: Enrollment): ExamDraft {
  return {
    plannedExamMonth: monthInput(enrollment.plannedExamMonth),
    actualExamDate: enrollment.actualExamDate ?? "",
    examRegistrationStatus: enrollment.examRegistrationStatus ?? "NOT_REGISTERED",
    targetNote: enrollment.targetNote ?? "",
  };
}

export default function CourseStudents({ courseId, skillPair, roster, onSelectStudent, onRosterChanged }: CourseStudentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ExamStatus>("ALL");
  const [progress, setProgress] = useState<ClassActivityProgress[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ExamDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [actionTarget, setActionTarget] = useState<Roster[number] | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setDrafts(Object.fromEntries(roster.map(item => [item.enrollment.id, draftOf(item.enrollment)])));
  }, [roster]);

  useEffect(() => {
    void apiFetch<ClassActivityProgress[]>(`/admin/courses/${courseId}/progress`)
      .then(setProgress)
      .catch(() => setProgress([]));
  }, [courseId]);

  // Handle Ctrl + Wheel zoom on the table container
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          const delta = e.deltaY < 0 ? 10 : -10;
          return Math.min(150, Math.max(60, prev + delta));
        });
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoomLevel(prev => Math.min(150, prev + 10));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoomLevel(prev => Math.max(60, prev - 10));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoomLevel(100);
      }
    }
  };

  const skills = skillPair === "LISTENING_READING"
    ? (["LISTENING", "READING"] as const)
    : (["SPEAKING", "WRITING"] as const);

  const filteredRoster = useMemo(() => roster.filter(item => {
    const text = `${item.student.fullName} ${item.student.studentCode} ${item.student.email ?? ""} ${item.student.phone ?? ""}`.toLowerCase();
    const status = drafts[item.enrollment.id]?.examRegistrationStatus ?? item.enrollment.examRegistrationStatus ?? "NOT_REGISTERED";
    return text.includes(deferredQuery.trim().toLowerCase()) && (statusFilter === "ALL" || status === statusFilter);
  }), [deferredQuery, drafts, roster, statusFilter]);

  const registered = roster.filter(item => (drafts[item.enrollment.id]?.examRegistrationStatus ?? item.enrollment.examRegistrationStatus) === "REGISTERED").length;
  const withoutPlan = roster.filter(item => !(drafts[item.enrollment.id]?.plannedExamMonth ?? item.enrollment.plannedExamMonth)).length;
  const issues = roster.filter(item => (drafts[item.enrollment.id]?.examRegistrationStatus ?? item.enrollment.examRegistrationStatus) === "ISSUE").length;

  function patchDraft(id: string, patch: Partial<ExamDraft>) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function scoreValues(studentId: string, skill: string) {
    return progress
      .filter(activity => activity.skill === skill && ["ONLINE_TEST", "MANUAL_RESULT"].includes(activity.activityType))
      .flatMap(activity => activity.attempts.filter(attempt => attempt.studentId === studentId && attempt.score != null))
      .sort((a, b) => (a.submittedAt ?? a.completedAt ?? "").localeCompare(b.submittedAt ?? b.completedAt ?? ""))
      .slice(-2)
      .map(attempt => attempt.score);
  }

  async function save(item: Roster[number]) {
    const draft = drafts[item.enrollment.id];
    if (!draft) return;
    setSavingId(item.enrollment.id);
    setError("");
    try {
      await apiFetch(`/admin/enrollments/${item.enrollment.id}/exam-plan`, {
        method: "PATCH",
        body: JSON.stringify({
          plannedExamMonth: draft.plannedExamMonth ? `${draft.plannedExamMonth}-01` : null,
          actualExamDate: draft.actualExamDate || null,
          examRegistrationStatus: draft.examRegistrationStatus,
          targetNote: draft.targetNote.trim() || null,
        }),
      });
      setSavedId(item.enrollment.id);
      window.setTimeout(() => setSavedId(current => current === item.enrollment.id ? null : current), 2200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể cập nhật kế hoạch thi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<Student size={22} className="text-[#a83b58]" />}
          label="HỌC VIÊN TRONG KHÓA"
          value={roster.length}
          note="Theo lượt ghi danh hiện tại"
          gradient="from-[#fff0f3] via-surface to-[#fcebee]/50 border-[#e8d2d7]"
          iconBg="bg-[#fcebee] text-[#a83b58] border border-[#e8d2d7]"
        />
        <Metric
          icon={<CheckCircle size={22} className="text-emerald-600" />}
          label="ĐÃ ĐĂNG KÝ THI"
          value={registered}
          note={`${withoutPlan} học viên chưa có tháng dự kiến`}
          gradient="from-emerald-50/80 via-surface to-teal-50/30 border-emerald-200/80"
          iconBg="bg-emerald-100/80 text-emerald-700 border border-emerald-200"
        />
        <Metric
          icon={<WarningCircle size={22} className={issues > 0 ? "text-amber-600" : "text-slate-400"} />}
          label="CẦN XỬ LÝ"
          value={issues}
          note={issues > 0 ? "Lỗi đăng ký hoặc thông tin chưa khớp" : "Mọi thông tin đều hợp lệ"}
          alert={issues > 0}
          gradient={issues > 0 ? "from-amber-50/80 via-surface to-rose-50/40 border-amber-300" : "from-slate-50/80 via-surface to-slate-50/30 border-outline-variant/40"}
          iconBg={issues > 0 ? "bg-amber-100/80 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500 border border-slate-200"}
        />
      </div>

      {/* Filter, Search & Zoom Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e8d2d7] bg-surface p-4 shadow-xs lg:flex-row lg:items-center justify-between">
        <label className="relative max-w-xl flex-1">
          <span className="sr-only">Tìm học viên</span>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a83b58]/70" size={18} />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên học viên, Zalo, email, SĐT hoặc mã HV..."
            className="min-h-11 w-full rounded-xl border border-[#e8d2d7] bg-surface pl-11 pr-4 text-sm font-medium outline-none transition focus:border-[#a83b58] focus:ring-2 focus:ring-[#a83b58]/15"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Styled Select with generous right padding & chevron */}
          <div className="relative inline-flex items-center min-w-[220px]">
            <select
              aria-label="Lọc trạng thái đăng ký thi"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              className="min-h-11 w-full appearance-none rounded-xl border border-[#e8d2d7] bg-white pl-4 pr-10 text-sm font-bold text-[#7a253b] outline-none transition focus:border-[#a83b58] focus:ring-2 focus:ring-[#a83b58]/15 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tất cả trạng thái thi</option>
              <option value="NOT_REGISTERED">Chưa đăng ký</option>
              <option value="REGISTERED">Đã đăng ký</option>
              <option value="ISSUE">Có vấn đề</option>
            </select>
            <CaretDown size={16} className="pointer-events-none absolute right-3.5 text-[#7a253b]" />
          </div>

          {/* Interactive Zoom Controls */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#e8d2d7] bg-surface px-2.5 py-1.5 text-xs font-bold text-on-surface-variant shadow-2xs">
            <span className="text-[11px] text-outline uppercase tracking-wider mr-1 hidden sm:inline">Thu phóng:</span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
              disabled={zoomLevel <= 60}
              title="Thu nhỏ bảng (Ctrl + -)"
              className="grid h-7 w-7 place-items-center rounded-lg border border-[#e8d2d7] hover:bg-[#fcebee] hover:text-[#a83b58] transition active:scale-95 disabled:opacity-40"
            >
              <Minus size={14} weight="bold" />
            </button>
            <span className="min-w-11 text-center font-black tabular-nums text-[#a83b58]">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              disabled={zoomLevel >= 150}
              title="Phóng to bảng (Ctrl + +)"
              className="grid h-7 w-7 place-items-center rounded-lg border border-[#e8d2d7] hover:bg-[#fcebee] hover:text-[#a83b58] transition active:scale-95 disabled:opacity-40"
            >
              <Plus size={14} weight="bold" />
            </button>
            {zoomLevel !== 100 && (
              <button
                onClick={() => setZoomLevel(100)}
                title="Đặt lại 100%"
                className="ml-1 rounded-md bg-[#fcebee] px-2 py-1 text-[11px] font-extrabold text-[#a83b58] hover:bg-[#f9edf0] transition"
              >
                100%
              </button>
            )}
          </div>

          <span className="ml-auto rounded-xl bg-[#fcebee] px-3.5 py-2.5 text-xs font-black tabular-nums text-[#a83b58] border border-[#e8d2d7] shadow-2xs">
            {filteredRoster.length} / {roster.length} học viên
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 shadow-sm">
          <WarningCircle size={20} className="shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Main Sheet-Inspired Table */}
      {filteredRoster.length > 0 ? (
        <div
          ref={tableContainerRef}
          onKeyDown={handleTableKeyDown}
          tabIndex={0}
          className="overflow-hidden rounded-2xl border border-[#e8d2d7] bg-surface shadow-md focus:outline-none focus:ring-2 focus:ring-[#a83b58]/20"
        >
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#a83b58]/30" style={{ zoom: `${zoomLevel}%` }}>
            <table className="w-full min-w-[1440px] border-collapse text-left text-xs">
              <thead>
                {/* Header Row 1: Unified Solid Brand Header Bar */}
                <tr className="bg-[#a83b58] text-white">
                  <th colSpan={7} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider shadow-xs border-r border-white/20">
                    <span className="flex items-center gap-2">
                      <Sparkle size={16} className="text-white/90" />
                      THÔNG TIN HỌC VIÊN & KẾ HOẠCH THI
                    </span>
                  </th>
                  <th colSpan={2} className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider shadow-xs border-r border-white/20">
                    ĐIỂM TEST (LẦN 1)
                  </th>
                  <th colSpan={2} className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider shadow-xs border-r border-white/20">
                    ĐIỂM TEST (LẦN 2)
                  </th>
                  <th colSpan={1} className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider shadow-xs">
                    THAO TÁC
                  </th>
                </tr>

                {/* Header Row 2: Opaque Solid #f9edf0 Sub-headers (NO bleed-through during scroll!) */}
                <tr className="bg-[#f9edf0] border-b-2 border-[#e8d2d7] text-[11px] font-black uppercase tracking-wider text-[#7a253b]">
                  <th className="sticky left-0 z-30 bg-[#f9edf0] px-3 py-2.5 text-center border-r border-[#e8d2d7] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    STT
                  </th>
                  <th className="sticky left-12 z-30 min-w-64 bg-[#f9edf0] px-4 py-2.5 text-left border-r border-[#e8d2d7] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    Tên học viên (Zalo)
                  </th>
                  <th className="min-w-56 bg-[#f9edf0] px-4 py-2.5 text-left border-r border-[#e8d2d7]/50">
                    Email cá nhân
                  </th>
                  <th className="min-w-40 bg-[#f9edf0] px-4 py-2.5 text-left">
                    Tháng dự định thi
                  </th>
                  <th className="min-w-40 bg-[#f9edf0] px-4 py-2.5 text-left">
                    Ngày thi thực tế
                  </th>
                  <th className="min-w-44 bg-[#f9edf0] px-4 py-2.5 text-left">
                    Đã đăng ký thi chưa
                  </th>
                  <th className="min-w-44 bg-[#f9edf0] px-4 py-2.5 text-left border-r border-[#e8d2d7]">
                    Mục tiêu
                  </th>

                  {skills.map(skill => (
                    <th key={`${skill}-1`} className="min-w-36 bg-[#f2e2e6] px-4 py-2.5 text-center text-[#7a253b] border-r border-[#e8d2d7]">
                      {skillLabel(skill)}
                    </th>
                  ))}

                  {skills.map(skill => (
                    <th key={`${skill}-2`} className="min-w-36 bg-[#faebd7] px-4 py-2.5 text-center text-[#78350f] border-r border-[#e8d2d7]">
                      {skillLabel(skill)}
                    </th>
                  ))}

                  <th className="sticky right-0 z-30 bg-[#f9edf0] px-4 py-2.5 text-right border-l border-[#e8d2d7] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e8d2d7]/60 font-medium">
                {filteredRoster.map((item, index) => {
                  const draft = drafts[item.enrollment.id] ?? draftOf(item.enrollment);
                  return (
                    <tr key={item.enrollment.id} className="group align-middle transition hover:bg-[#fff0f3]">
                      {/* Sticky Index Column (SOLID White BG) */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-[#fff0f3] px-3 py-3 text-center text-xs font-black tabular-nums text-[#7a253b] border-r border-[#e8d2d7]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.04)]">
                        {index + 1}
                      </td>

                      {/* Sticky Student Name Column (SOLID White BG) */}
                      <td className="sticky left-12 z-10 bg-white group-hover:bg-[#fff0f3] px-4 py-3 border-r border-[#e8d2d7]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.04)]">
                        <button
                          onClick={() => onSelectStudent(item.student.id)}
                          className="flex max-w-60 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#a83b58]/30 rounded-lg p-1 transition -ml-1"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e8d2d7] bg-[#fcebee] text-xs font-black text-[#a83b58] shadow-2xs">
                            {item.student.fullName.charAt(0)}
                          </span>
                          <span className="min-w-0">
                            <strong className="block truncate text-xs font-bold text-slate-900 group-hover:text-[#a83b58] transition">
                              {item.student.fullName}
                            </strong>
                            <small className="block truncate text-[11px] font-semibold text-[#a83b58]/80 mt-0.5">
                              {item.student.phone || "Chưa có Zalo"} · {item.student.studentCode}
                            </small>
                          </span>
                        </button>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-xs text-slate-600 border-r border-[#e8d2d7]/30">
                        {item.student.email ? (
                          <span className="truncate max-w-[200px] block" title={item.student.email}>
                            {item.student.email}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Tháng dự kiến thi */}
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={`Tháng dự kiến thi của ${item.student.fullName}`}
                          type="month"
                          value={draft.plannedExamMonth}
                          onChange={event => patchDraft(item.enrollment.id, { plannedExamMonth: event.target.value })}
                          className={cellInput}
                        />
                      </td>

                      {/* Ngày thi thực tế */}
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={`Ngày thi của ${item.student.fullName}`}
                          type="date"
                          value={draft.actualExamDate}
                          onChange={event => patchDraft(item.enrollment.id, { actualExamDate: event.target.value })}
                          className={cellInput}
                        />
                      </td>

                      {/* Đã đăng ký thi chưa */}
                      <td className="px-3 py-2.5">
                        <div className="relative flex items-center">
                          <select
                            aria-label={`Trạng thái đăng ký thi của ${item.student.fullName}`}
                            value={draft.examRegistrationStatus}
                            onChange={event => patchDraft(item.enrollment.id, { examRegistrationStatus: event.target.value as ExamStatus })}
                            className={`${cellInput} appearance-none cursor-pointer text-center pr-7 pl-2 ${statusTone[draft.examRegistrationStatus]}`}
                          >
                            {Object.entries(statusLabel).map(([value, label]) => (
                              <option key={value} value={value} className="bg-white text-slate-800 font-medium">
                                {label}
                              </option>
                            ))}
                          </select>
                          <CaretDown size={14} className="pointer-events-none absolute right-2 opacity-80" />
                        </div>
                      </td>

                      {/* Mục tiêu */}
                      <td className="px-3 py-2.5 border-r border-[#e8d2d7]">
                        <input
                          value={draft.targetNote}
                          onChange={event => patchDraft(item.enrollment.id, { targetNote: event.target.value })}
                          placeholder={item.student.targetBand ? `${item.student.targetBand} overall` : "Chưa đặt"}
                          className={cellInput}
                        />
                      </td>

                      {/* Test 1 Scores */}
                      {skills.map(skill => (
                        <ScoreCell
                          key={`${skill}-1`}
                          value={scoreValues(item.student.id, skill)[0]}
                          variant="test1"
                        />
                      ))}

                      {/* Test 2 Scores */}
                      {skills.map(skill => (
                        <ScoreCell
                          key={`${skill}-2`}
                          value={scoreValues(item.student.id, skill)[1]}
                          variant="test2"
                        />
                      ))}

                      {/* Sticky action column: exam plan and enrollment lifecycle */}
                      <td className="sticky right-0 z-10 bg-white group-hover:bg-[#fff0f3] px-3 py-2.5 text-right shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] border-l border-[#e8d2d7]">
                        <div className="flex min-w-[184px] items-center justify-end gap-2">
                          <button
                            disabled={savingId === item.enrollment.id}
                            onClick={() => void save(item)}
                            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-60 ${savedId === item.enrollment.id ? "bg-emerald-600 text-white" : "bg-[#a83b58] hover:bg-[#881337] text-white"}`}
                          >
                            {savingId === item.enrollment.id ? <SpinnerGap className="animate-spin text-white" size={15} /> : savedId === item.enrollment.id ? <Check size={15} weight="bold" /> : <FloppyDisk size={15} className="text-white" />}
                            <span className="text-white">{savedId === item.enrollment.id ? "Đã lưu" : "Lưu"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionTarget(item)}
                            aria-label={`Quản lý lượt ghi danh của ${item.student.fullName}`}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d9b9c1] bg-white px-3 text-xs font-bold text-[#7a253b] transition hover:border-[#a83b58] hover:bg-[#fcebee] focus:outline-none focus:ring-2 focus:ring-[#a83b58]/25"
                          >
                            <DotsThreeVertical size={16} weight="bold" /> Quản lý
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Notes & Zoom Hint */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e8d2d7] bg-[#f9edf0] px-5 py-3 text-xs font-semibold text-[#7a253b]">
            <span className="flex items-center gap-2">
              <Sparkle size={16} className="text-[#a83b58]" />
              Bấm vào bảng & dùng <strong>Ctrl + Lăn chuột</strong> hoặc nút <strong>+ / -</strong> trên thanh công cụ để phóng to / thu nhỏ.
            </span>
            <span className="flex items-center gap-2">
              <CalendarBlank size={16} className="text-[#a83b58]" />
              Tháng dự kiến thi lưu tự động ngày đầu tháng. Điểm test hiển thị kết quả thực tế.
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#e8d2d7] bg-surface px-8 py-16 text-center shadow-xs">
          <Student className="mx-auto text-[#a83b58]/40" size={44} />
          <h3 className="mt-4 font-display text-lg font-bold text-slate-800">Chưa tìm thấy học viên phù hợp</h3>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Ghi danh học viên vào khóa hoặc điều chỉnh từ khóa tìm kiếm & bộ lọc.
          </p>
        </div>
      )}
      {actionTarget && (
        <EnrollmentLifecycleModal
          item={actionTarget}
          currentCourseId={courseId}
          onClose={() => setActionTarget(null)}
          onOpenProfile={() => {
            onSelectStudent(actionTarget.student.id);
            setActionTarget(null);
          }}
          onChanged={async () => {
            setActionTarget(null);
            await onRosterChanged();
          }}
        />
      )}
    </div>
  );
}

type LifecycleAction = "ACTIVATE" | "PAUSE" | "RESUME" | "TRANSFER" | "COMPLETE" | "WITHDRAW";

const lifecycleMeta: Record<LifecycleAction, { label: string; description: string; icon: typeof PlayCircle; tone: string }> = {
  ACTIVATE: { label: "Xác nhận ghi danh", description: "Kích hoạt lượt học và đưa học viên vào danh sách đang học.", icon: CheckCircle, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  PAUSE: { label: "Bảo lưu", description: "Tạm dừng lượt học; lịch sử và kết quả vẫn được giữ nguyên.", icon: PauseCircle, tone: "text-amber-800 bg-amber-50 border-amber-200" },
  RESUME: { label: "Tiếp tục học", description: "Mở lại lượt học đang bảo lưu tại khóa này.", icon: PlayCircle, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  TRANSFER: { label: "Chuyển khóa", description: "Tạo lượt ghi danh mới ở khóa đích và đóng lượt hiện tại.", icon: ArrowsLeftRight, tone: "text-sky-800 bg-sky-50 border-sky-200" },
  COMPLETE: { label: "Hoàn thành khóa", description: "Kết thúc lượt học với trạng thái hoàn thành.", icon: Trophy, tone: "text-violet-800 bg-violet-50 border-violet-200" },
  WITHDRAW: { label: "Rút khỏi khóa", description: "Kết thúc lượt ghi danh nhưng vẫn giữ lịch sử học vụ.", icon: SignOut, tone: "text-rose-800 bg-rose-50 border-rose-200" },
};

function allowedActions(status: EnrollmentStatus): LifecycleAction[] {
  if (status === "PENDING") return ["ACTIVATE", "WITHDRAW"];
  if (status === "ACTIVE") return ["PAUSE", "TRANSFER", "COMPLETE", "WITHDRAW"];
  if (status === "PAUSED") return ["RESUME", "TRANSFER", "WITHDRAW"];
  return [];
}

function EnrollmentLifecycleModal({ item, currentCourseId, onClose, onOpenProfile, onChanged }: {
  item: Roster[number];
  currentCourseId: string;
  onClose: () => void;
  onOpenProfile: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [action, setAction] = useState<LifecycleAction | null>(null);
  const [reason, setReason] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const actions = allowedActions(item.enrollment.status);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  useEffect(() => {
    if (action !== "TRANSFER" || courses.length) return;
    void apiFetch<Page<Course>>("/admin/courses?size=100&sort=startsOn,asc")
      .then(page => setCourses(page.content.filter(course => course.id !== currentCourseId && ["OPEN", "ACTIVE"].includes(course.status))))
      .catch(value => setError(value instanceof Error ? value.message : "Không tải được danh sách khóa đích."));
  }, [action, courses.length, currentCourseId]);

  const requiresReason = action === "PAUSE" || action === "TRANSFER" || action === "WITHDRAW";

  async function submit() {
    if (!action) return;
    if (requiresReason && !reason.trim()) { setError("Vui lòng nhập lý do để lưu vết học vụ."); return; }
    if (action === "TRANSFER" && !targetCourseId) { setError("Vui lòng chọn khóa học đích."); return; }
    setSaving(true); setError("");
    try {
      if (action === "TRANSFER") {
        const transfer = await apiFetch<{ id: string }>(`/admin/enrollments/${item.enrollment.id}/transfers`, {
          method: "POST",
          body: JSON.stringify({ targetCourseId, reason: reason.trim(), feeAdjustment: 0, reservationId: null, notes: null }),
        });
        await apiFetch(`/admin/enrollments/transfers/${transfer.id}/approve`, { method: "PATCH" });
      } else {
        const status: EnrollmentStatus = action === "ACTIVATE" || action === "RESUME" ? "ACTIVE"
          : action === "PAUSE" ? "PAUSED"
          : action === "COMPLETE" ? "COMPLETED" : "WITHDRAWN";
        const auditLine = reason.trim() ? `[${new Date().toLocaleDateString("vi-VN")}] ${lifecycleMeta[action].label}: ${reason.trim()}` : null;
        await apiFetch(`/admin/enrollments/${item.enrollment.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status, notes: [item.enrollment.notes, auditLine].filter(Boolean).join("\n") || null }),
        });
      }
      await onChanged();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể cập nhật lượt ghi danh.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="enrollment-actions-title" onMouseDown={event => { if (event.currentTarget === event.target && !saving) onClose(); }}>
      <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#ead5da] bg-[#fffafb] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ead5da] bg-[#fffafb]/95 px-6 py-5 backdrop-blur">
          <div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a83b58]">Học vụ · Lượt ghi danh</p><h2 id="enrollment-actions-title" className="mt-1 font-display text-2xl font-black text-slate-950">{item.student.fullName}</h2><p className="mt-1 text-sm text-slate-600">{item.student.studentCode} · <strong>{enrollmentStatusLabel[item.enrollment.status]}</strong></p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Đóng" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e3cbd1] bg-white text-slate-700 hover:bg-[#fcebee] disabled:opacity-50"><X size={20}/></button>
        </header>
        <div className="space-y-5 p-6">
          <button type="button" onClick={onOpenProfile} className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-[#dfc5cc] bg-white px-4 text-left text-sm font-bold text-[#7a253b] transition hover:border-[#a83b58] hover:bg-[#fff0f3]"><span className="flex items-center gap-3"><ArrowSquareOut size={20}/> Mở hồ sơ học viên</span><span className="text-xs font-semibold text-slate-500">Thông tin và toàn bộ lịch sử học</span></button>

          {actions.length ? <div><p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-600">Thao tác được phép</p><div className="grid gap-3 sm:grid-cols-2">{actions.map(value => { const meta=lifecycleMeta[value]; const Icon=meta.icon; return <button key={value} type="button" onClick={() => { setAction(value); setError(""); }} className={`min-h-[92px] rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${action===value ? `${meta.tone} ring-2 ring-[#a83b58]/20` : "border-[#ead5da] bg-white text-slate-800 hover:border-[#c88e9d]"}`}><span className="flex items-center gap-2 font-black"><Icon size={20}/>{meta.label}</span><span className="mt-2 block text-xs font-medium leading-5 opacity-75">{meta.description}</span></button>})}</div></div> : <div className="rounded-2xl border border-[#ead5da] bg-slate-50 p-4 text-sm text-slate-600">Lượt ghi danh này đã kết thúc. Hệ thống chỉ cho xem hồ sơ và lịch sử, không cho sửa trạng thái.</div>}

          {action && <div className="rounded-2xl border border-[#dfc5cc] bg-white p-5"><h3 className="font-display text-lg font-black text-slate-950">{lifecycleMeta[action].label}</h3>{action === "TRANSFER" && <label className="mt-4 block text-sm font-bold text-slate-700">Khóa học đích<select value={targetCourseId} onChange={event=>setTargetCourseId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border-[#dfc5cc] bg-white text-sm focus:border-[#a83b58] focus:ring-[#a83b58]"><option value="">Chọn khóa học phù hợp</option>{courses.map(course=><option key={course.id} value={course.id}>{course.code} · {course.name} · {skillPairLabel[course.skillPair]} · {classStatusLabel[course.status]}</option>)}</select></label>}<label className="mt-4 block text-sm font-bold text-slate-700">Lý do {requiresReason && <span className="text-rose-600">*</span>}<textarea rows={3} value={reason} onChange={event=>setReason(event.target.value)} placeholder={requiresReason ? "Nhập lý do để lưu vào lịch sử học vụ..." : "Ghi chú bổ sung (không bắt buộc)..."} className="mt-1.5 w-full rounded-xl border-[#dfc5cc] bg-white text-sm focus:border-[#a83b58] focus:ring-[#a83b58]"/></label></div>}
          {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><WarningCircle className="mt-0.5 shrink-0" size={18}/>{error}</div>}
        </div>
        <footer className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#ead5da] bg-[#fffafb]/95 px-6 py-4 backdrop-blur"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-[#dfc5cc] bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Đóng</button>{action && <button type="button" onClick={() => void submit()} disabled={saving} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-60 ${action === "WITHDRAW" ? "bg-rose-700 hover:bg-rose-800" : "bg-[#93475a] hover:bg-[#7a253b]"}`}>{saving && <SpinnerGap className="animate-spin" size={18}/>} Xác nhận</button>}</footer>
      </section>
    </div>
  );
}

const cellInput =
  "min-h-9 w-full rounded-lg border border-[#e8d2d7] bg-white px-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#a83b58] focus:ring-2 focus:ring-[#a83b58]/15";

function skillLabel(skill: string) {
  return ({ LISTENING: "Listening", READING: "Reading", SPEAKING: "Speaking", WRITING: "Writing" } as Record<string, string>)[skill] ?? skill;
}

function ScoreCell({ value, variant }: { value: number | null | undefined; variant: "test1" | "test2" }) {
  const badgeStyle =
    variant === "test1"
      ? "bg-[#fcebee] border-[#e8d2d7] text-[#a83b58] font-black"
      : "bg-amber-50 border-amber-200 text-[#78350f] font-black";

  return (
    <td className="px-3 py-2.5 text-center border-r border-[#e8d2d7]/50">
      {value == null ? (
        <span className="text-slate-300 font-medium text-xs">—</span>
      ) : (
        <span className={`inline-flex min-w-[46px] items-center justify-center rounded-md border px-2 py-1 text-xs font-black tabular-nums shadow-2xs ${badgeStyle}`}>
          {Number(value).toFixed(1)}
        </span>
      )}
    </td>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  alert = false,
  gradient,
  iconBg,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  note: string;
  alert?: boolean;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-xs transition hover:shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">{label}</p>
          <p className={`mt-2 font-display text-3xl font-black tabular-nums ${alert ? "text-amber-700" : "text-slate-900"}`}>
            {value}
          </p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl shadow-2xs ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-xs font-semibold text-slate-500">{note}</p>
    </div>
  );
}
