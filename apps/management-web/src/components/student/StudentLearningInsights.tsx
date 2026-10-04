import {
  ArrowClockwise,
  BookOpenText,
  CheckCircle,
  ClockCounterClockwise,
  Exam,
  Flag,
  MagnifyingGlass,
  Target,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import type { StudentLearningInsights as Insights } from "../../academic-types";

type Props = {
  data: Insights | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

const skillLabel: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GENERAL: "Tổng hợp",
};

const statusLabel: Record<string, string> = {
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  GRADED: "Đã chấm",
  EXPIRED: "Hết hạn",
};

export default function StudentLearningInsights({ data, loading, error, onRetry }: Props) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("ALL");

  const attempts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return (data?.attempts ?? []).filter(item =>
      (skill === "ALL" || item.skill === skill)
      && (!normalized || `${item.title} ${item.courseName ?? ""} ${item.courseCode ?? ""}`.toLocaleLowerCase("vi").includes(normalized))
    );
  }, [data?.attempts, query, skill]);

  if (loading) return <InsightsSkeleton />;
  if (error) return <State title="Không tải được dữ liệu học tập" text={error} action={onRetry} />;
  if (!data) return <State title="Chưa có dữ liệu" text="Hệ thống chưa ghi nhận dữ liệu học tập của học viên này." />;

  const { summary } = data;
  const support = supportMeta(summary.supportLevel);

  return (
    <div className="space-y-6">
      <section className={`rounded-[22px] border p-5 md:p-6 ${support.className}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface/75">
              <Flag size={22} weight="fill" />
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.08em]">Đánh giá tổng quan</span>
              <h2 className="mt-1 font-display text-xl font-bold text-on-surface">{support.label}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-on-surface-variant">{support.description}</p>
            </div>
          </div>
          <span className="w-fit rounded-lg bg-surface/80 px-3 py-2 text-xs font-black">
            Hoạt động gần nhất: {formatDateTime(summary.lastActivityAt)}
          </span>
        </div>
        {summary.supportReasons.length > 0 && (
          <ul className="mt-4 grid gap-2 border-t border-current/10 pt-4 text-sm sm:grid-cols-2">
            {summary.supportReasons.map(reason => (
              <li key={reason} className="flex gap-2">
                <WarningCircle className="mt-0.5 shrink-0" size={17} weight="fill" /> {reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số học tập">
        <Metric icon={<Exam size={21} />} label="Bài đã hoàn tất" value={summary.completedAttempts.toLocaleString("vi-VN")} note={`${summary.inProgressAttempts} bài đang làm`} />
        <Metric icon={<Target size={21} />} label="Độ chính xác" value={percent(summary.averageAccuracy)} note="Trên các câu đã trả lời" />
        <Metric icon={<BookOpenText size={21} />} label="Điểm trung bình" value={percent(summary.averageScorePercent)} note="Theo thang điểm từng đề" />
        <Metric icon={<ClockCounterClockwise size={21} />} label="Tổng lượt làm" value={summary.totalAttempts.toLocaleString("vi-VN")} note="50 lượt gần nhất trong bảng" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="rounded-[22px] border border-outline-variant/35 bg-surface p-5 md:p-6">
          <header className="mb-5">
            <h2 className="font-display text-xl font-bold">Năng lực theo kỹ năng</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Số liệu tính từ câu trả lời và điểm đã lưu, không nội suy thành Band IELTS.</p>
          </header>
          {data.skills.length ? (
            <div className="space-y-5">
              {data.skills.map(item => (
                <div key={item.skill}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <strong className="text-sm text-on-surface">{skillLabel[item.skill] ?? item.skill}</strong>
                      <span className="ml-2 text-xs text-on-surface-variant">{item.attempts} lượt · {item.answeredQuestions} câu</span>
                    </div>
                    <strong className="text-xl tabular-nums text-primary">{percent(item.accuracy)}</strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.accuracy ?? 0}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
                    <span>{item.correctAnswers} câu đúng</span>
                    <span>Điểm trung bình {percent(item.averageScorePercent)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty text="Chưa đủ bài hoàn tất để phân tích theo kỹ năng." />}
        </section>

        <section className="rounded-[22px] border border-outline-variant/35 bg-surface p-5 md:p-6">
          <header className="mb-5">
            <h2 className="font-display text-xl font-bold">Lỗi thường gặp</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Chỉ hiển thị dạng lỗi lặp lại ít nhất 2 lần.</p>
          </header>
          {data.recurringMistakes.length ? (
            <div className="divide-y divide-outline-variant/25">
              {data.recurringMistakes.map(item => (
                <article key={`${item.skill}-${item.questionType}`} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm">{item.questionType}</strong>
                      <span className="mt-1 block text-xs font-bold text-primary">{skillLabel[item.skill] ?? item.skill}</span>
                    </div>
                    <span className="rounded-lg bg-error-container/25 px-2.5 py-1 text-xs font-black text-error">{item.errorCount} lỗi</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">Xuất hiện trong {item.affectedAttempts} lượt làm. {item.recommendation}</p>
                </article>
              ))}
            </div>
          ) : <Empty text="Chưa phát hiện dạng lỗi nào lặp lại." positive />}
        </section>
      </div>

      <section className="overflow-hidden rounded-[22px] border border-outline-variant/35 bg-surface">
        <header className="flex flex-col gap-4 border-b border-outline-variant/25 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Lịch sử làm bài chi tiết</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Theo dõi điểm, độ chính xác, câu sai và bài làm dang dở.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Tìm bài làm</span>
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={17} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên bài hoặc khóa học" className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface py-2 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-64" />
            </label>
            <label>
              <span className="sr-only">Lọc theo kỹ năng</span>
              <select value={skill} onChange={event => setSkill(event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold outline-none focus:border-primary sm:w-40">
                <option value="ALL">Tất cả kỹ năng</option>
                {[...new Set(data.attempts.map(item => item.skill))].map(value => <option key={value} value={value}>{skillLabel[value] ?? value}</option>)}
              </select>
            </label>
          </div>
        </header>

        {attempts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] font-black uppercase tracking-[0.07em] text-on-surface-variant">
                <tr><th className="px-5 py-4">Bài làm</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Kết quả</th><th className="px-5 py-4">Chi tiết câu trả lời</th><th className="px-5 py-4">Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {attempts.map(item => (
                  <tr key={item.id} className="align-top transition hover:bg-primary-container/[0.06]">
                    <td className="px-5 py-4">
                      <strong className="block max-w-xs text-on-surface">{item.title}</strong>
                      <span className="mt-1 block text-xs text-on-surface-variant">{skillLabel[item.skill] ?? item.skill} · Lần {item.attemptNo}</span>
                      <span className="mt-1 block text-xs text-on-surface-variant">{item.courseName ? `${item.courseName} (${item.courseCode})` : "Tự luyện"}</span>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-on-surface-variant">{formatDateTime(item.lastActivityAt)}</td>
                    <td className="px-5 py-4"><strong className="block text-lg tabular-nums text-primary">{score(item.score, item.maxScore)}</strong><span className="text-xs text-on-surface-variant">Độ chính xác {percent(item.accuracy)}</span></td>
                    <td className="px-5 py-4"><span className="font-bold text-emerald-700">{item.correctCount} đúng</span><span className="mx-2 text-outline">·</span><span className="font-bold text-error">{item.incorrectCount} sai</span><span className="mt-1 block text-xs text-on-surface-variant">{item.unansweredCount} chưa trả lời</span></td>
                    <td className="px-5 py-4"><AttemptStatus value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <State title="Không có bài làm phù hợp" text="Hãy thay đổi từ khóa hoặc bộ lọc kỹ năng." />}
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <article className="rounded-[18px] border border-outline-variant/35 bg-surface p-5"><div className="flex items-center justify-between text-primary"><span className="text-sm font-semibold text-on-surface-variant">{label}</span>{icon}</div><strong className="mt-4 block text-3xl tabular-nums">{value}</strong><span className="mt-1 block text-xs text-on-surface-variant">{note}</span></article>;
}

function AttemptStatus({ value }: { value: string }) {
  const active = value === "IN_PROGRESS";
  return <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ${active ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{active ? <ArrowClockwise size={14} /> : <CheckCircle size={14} weight="fill" />}{statusLabel[value] ?? value}</span>;
}

function Empty({ text, positive = false }: { text: string; positive?: boolean }) {
  return <div className="rounded-xl border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">{positive && <CheckCircle className="mx-auto mb-2 text-emerald-700" size={24} weight="fill" />}{text}</div>;
}

function State({ title, text, action }: { title: string; text: string; action?: () => void }) {
  return <div className="rounded-[22px] border border-dashed border-outline-variant/50 bg-surface p-10 text-center"><strong className="block text-on-surface">{title}</strong><p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-variant">{text}</p>{action && <button onClick={action} className="mt-4 min-h-10 rounded-xl border border-primary/40 px-4 text-sm font-bold text-primary hover:bg-primary-container/15">Thử lại</button>}</div>;
}

function InsightsSkeleton() {
  return <div className="space-y-4" aria-label="Đang tải dữ liệu học tập"><div className="h-32 animate-pulse rounded-[22px] bg-surface-container-low" /><div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-[18px] bg-surface-container-low" />)}</div><div className="h-80 animate-pulse rounded-[22px] bg-surface-container-low" /></div>;
}

function supportMeta(level: Insights["summary"]["supportLevel"]) {
  if (level === "NEEDS_ATTENTION") return { label: "Cần ưu tiên hỗ trợ", description: "Dữ liệu cho thấy học viên cần được liên hệ và xây dựng kế hoạch cải thiện cụ thể.", className: "border-error/30 bg-error-container/10 text-error" };
  if (level === "WATCH") return { label: "Cần theo dõi", description: "Có tín hiệu cần lưu ý. Nên kiểm tra lại tiến độ trong buổi học hoặc lần tư vấn gần nhất.", className: "border-amber-300/60 bg-amber-50/70 text-amber-900" };
  if (level === "ON_TRACK") return { label: "Đang theo đúng tiến độ", description: "Hoạt động và kết quả gần đây chưa ghi nhận dấu hiệu cần can thiệp.", className: "border-emerald-200 bg-emerald-50/70 text-emerald-800" };
  return { label: "Chưa đủ dữ liệu đánh giá", description: "Cần ít nhất một bài hoàn tất trước khi hệ thống đưa ra nhận định tổng quan.", className: "border-outline-variant/45 bg-surface-container-low text-on-surface-variant" };
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Chưa có";
}

function percent(value: number | null) {
  return value == null ? "Chưa có" : `${value}%`;
}

function score(value: number | null, max: number) {
  return value == null ? "Chưa chấm" : `${value.toLocaleString("vi-VN")} / ${max.toLocaleString("vi-VN")}`;
}
