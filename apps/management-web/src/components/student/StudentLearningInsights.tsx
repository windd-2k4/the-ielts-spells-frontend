import {
  ArrowClockwise,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  BookOpenText,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ChartBar,
  CheckCircle,
  CircleNotch,
  Clock,
  ClockCounterClockwise,
  Columns,
  Copy,
  DownloadSimple,
  Exam,
  Eye,
  Headphones,
  Info,
  Lightbulb,
  ListBullets,
  MagnifyingGlass,
  MicrophoneStage,
  MinusCircle,
  PenNib,
  Table,
  Timer,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { StudentAttemptDetail, StudentLearningInsights as Insights } from "../../academic-types";
import { apiFetch } from "../../lib/api";
import TeacherReadingReviewWorkspace from "./reading-review/TeacherReadingReviewWorkspace";

type Props = {
  studentId: string;
  data: Insights | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

type LearningAttempt = Insights["attempts"][number];
type SortKey = "TIME" | "RESULT";
type SortDirection = "asc" | "desc";

const skillLabel: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GENERAL: "Tổng hợp",
};

const statusLabel: Record<string, string> = {
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Chưa chấm",
  GRADED: "Đã chấm",
  EXPIRED: "Hết hạn",
};

export default function StudentLearningInsights({ studentId, data, loading, error, onRetry }: Props) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("TIME");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAttempt, setSelectedAttempt] = useState<LearningAttempt | null>(null);

  const attempts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const filtered = (data?.attempts ?? []).filter(item => {
      const haystack = `${item.title} ${item.courseName ?? ""} ${item.courseCode ?? ""}`.toLocaleLowerCase("vi");
      const activityTime = new Date(item.lastActivityAt).getTime();
      return (!normalized || haystack.includes(normalized))
        && (skill === "ALL" || item.skill === skill)
        && (status === "ALL" || item.status === status)
        && (from == null || activityTime >= from)
        && (to == null || activityTime <= to);
    });

    return filtered.sort((left, right) => {
      const leftValue = sortKey === "TIME" ? new Date(left.lastActivityAt).getTime() : resultPercent(left) ?? -1;
      const rightValue = sortKey === "TIME" ? new Date(right.lastActivityAt).getTime() : resultPercent(right) ?? -1;
      return (leftValue - rightValue) * (sortDirection === "asc" ? 1 : -1);
    });
  }, [data?.attempts, dateFrom, dateTo, query, skill, sortDirection, sortKey, status]);

  useEffect(() => setPage(1), [dateFrom, dateTo, pageSize, query, skill, sortDirection, sortKey, status]);

  const totalPages = Math.max(1, Math.ceil(attempts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const shownAttempts = attempts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const clearFilters = () => {
    setQuery("");
    setSkill("ALL");
    setStatus("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const exportCsv = () => {
    const rows = attempts.map(item => [
      item.title,
      skillLabel[item.skill] ?? item.skill,
      String(item.attemptNo),
      item.courseName ?? "Tự luyện",
      formatDateTime(item.lastActivityAt),
      item.score == null ? "Chưa chấm" : score(item.score, item.maxScore),
      item.accuracy == null ? "" : `${item.accuracy}%`,
      statusLabel[item.status] ?? item.status,
    ]);
    const csv = [["Bài làm", "Kỹ năng", "Lần", "Khóa học", "Thời gian", "Kết quả", "Độ chính xác", "Trạng thái"], ...rows]
      .map(row => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lich-su-lam-bai-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <InsightsSkeleton />;
  if (error) return <State title="Không tải được dữ liệu học tập" text={error} action={onRetry} />;
  if (!data) return <State title="Chưa có dữ liệu" text="Hệ thống chưa ghi nhận dữ liệu học tập của học viên này." />;

  const { summary } = data;
  const support = supportMeta(summary.supportLevel);
  const skillOptions = [...new Set(data.attempts.map(item => item.skill))];
  const filterCount = [query.trim(), skill !== "ALL", status !== "ALL", dateFrom, dateTo].filter(Boolean).length;

  const toggleSort = (next: SortKey) => {
    if (sortKey === next) setSortDirection(value => value === "asc" ? "desc" : "asc");
    else {
      setSortKey(next);
      setSortDirection("desc");
    }
  };

  return (
    <div className="flex flex-col gap-4 text-[#2B2228]">
      <SummaryStrip summary={summary} support={support} onShowInProgress={() => setStatus("IN_PROGRESS")} />

      <AttemptsSection
        attempts={attempts}
        shownAttempts={shownAttempts}
        query={query}
        skill={skill}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        skillOptions={skillOptions}
        filterCount={filterCount}
        sortKey={sortKey}
        sortDirection={sortDirection}
        page={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        onQueryChange={setQuery}
        onSkillChange={setSkill}
        onStatusChange={setStatus}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
        onSort={toggleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onExport={exportCsv}
        onSelect={setSelectedAttempt}
      />

      <div className="profile-enter profile-enter-delay-3 grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <SkillsSection skills={data.skills} attempts={data.attempts} />
        <MistakesSection mistakes={data.recurringMistakes} attempts={data.attempts} onFilterSkill={setSkill} onShowInProgress={() => setStatus("IN_PROGRESS")} />
      </div>

      {selectedAttempt && (
        <AttemptReviewScreen
          studentId={studentId}
          item={selectedAttempt}
          attemptsList={attempts}
          onNavigateAttempt={setSelectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  );
}

function SummaryStrip({ summary, support, onShowInProgress }: { summary: Insights["summary"]; support: ReturnType<typeof supportMeta>; onShowInProgress: () => void }) {
  const metrics = [
    { label: "Bài đã hoàn tất", value: summary.completedAttempts.toLocaleString("vi-VN"), note: `${summary.inProgressAttempts} bài đang làm` },
    { label: "Độ chính xác", value: percent(summary.averageAccuracy), note: "Trên câu đã trả lời", warn: summary.averageAccuracy != null && summary.averageAccuracy < 60 },
    { label: "Điểm TB / thang điểm", value: percent(summary.averageScorePercent), note: "Chuẩn hóa từng đề", tooltip: "Tỷ lệ giữa điểm đạt được và tổng điểm tối đa của từng đề, sau đó lấy trung bình." },
    { label: "Tổng lượt làm", value: summary.totalAttempts.toLocaleString("vi-VN"), note: "Tất cả lượt ghi nhận" },
  ];

  return (
    <section className="profile-enter overflow-hidden rounded-xl border border-[#E6DDE1] border-t-[3px] border-t-[#8B3F56] bg-white shadow-[0_6px_18px_rgba(43,34,40,0.03)]">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-[-0.02em] sm:text-xl">Kết quả & lỗi thường gặp</h2>
          <span title={support.description} className={`inline-flex cursor-help items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${support.badgeClass}`}><span className="h-1.5 w-1.5 rounded-full bg-current" /> {support.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B5E65]">
          <InlineTextMetric icon={<CalendarBlank size={15} />} label="Hoạt động gần nhất" value={formatDateTime(summary.lastActivityAt)} />
          <InlineTextMetric icon={<Timer size={15} />} label="Thời lượng ghi nhận" value={formatMinutes(summary.totalStudyMinutes)} />
        </div>
      </div>

      <div className="grid grid-cols-2 border-y border-[#E6DDE1] bg-[#FDFBFC] lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`min-w-0 px-4 py-2.5 ${index % 2 ? "border-l border-[#E6DDE1]" : ""} ${index >= 2 ? "border-t border-[#E6DDE1] lg:border-t-0" : ""} ${index > 0 ? "lg:border-l lg:border-[#E6DDE1]" : ""}`}>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B5E65]">{metric.label}{metric.tooltip && <span title={metric.tooltip} aria-label={metric.tooltip} className="cursor-help text-[#8B3F56]"><Info size={12} /></span>}</div>
            <div className="mt-0.5 flex items-baseline gap-2"><strong className={`text-[28px] font-semibold leading-none tabular-nums tracking-[-0.04em] ${metric.warn ? "text-[#D9A441]" : "text-[#2B2228]"}`}>{metric.value}</strong><span className="truncate text-[11px] text-[#6B5E65]">{metric.note}</span></div>
          </div>
        ))}
      </div>

      {summary.inProgressAttempts > 0 && (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 bg-[#FBF3E2] px-4 py-1.5 text-xs text-[#6B5E65]">
          <span className="inline-flex items-center gap-2"><WarningCircle size={15} weight="fill" className="text-[#D9A441]" /> Có {summary.inProgressAttempts} bài làm đang dang dở.</span>
          <button onClick={onShowInProgress} className="font-semibold text-[#6E2F43] underline decoration-[#C9973F] underline-offset-4 hover:text-[#8B3F56]">Xem bài đang làm</button>
        </div>
      )}
    </section>
  );
}

function InlineTextMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="text-[#8B3F56]">{icon}</span><span>{label}:</span><strong className="font-semibold tabular-nums text-[#2B2228]">{value}</strong></span>;
}

function AttemptsSection({
  attempts, shownAttempts, query, skill, status, dateFrom, dateTo, skillOptions, filterCount,
  sortKey, sortDirection, page, pageSize, totalPages, onQueryChange, onSkillChange,
  onStatusChange, onDateFromChange, onDateToChange, onClearFilters, onSort, onPageChange,
  onPageSizeChange, onExport, onSelect,
}: {
  attempts: LearningAttempt[];
  shownAttempts: LearningAttempt[];
  query: string;
  skill: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  skillOptions: string[];
  filterCount: number;
  sortKey: SortKey;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
  totalPages: number;
  onQueryChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  onSort: (value: SortKey) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onExport: () => void;
  onSelect: (value: LearningAttempt) => void;
}) {
  const start = attempts.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, attempts.length);
  const chips = [
    query.trim() ? { key: "query", label: `Từ khóa: ${query.trim()}`, clear: () => onQueryChange("") } : null,
    skill !== "ALL" ? { key: "skill", label: skillLabel[skill] ?? skill, clear: () => onSkillChange("ALL") } : null,
    status !== "ALL" ? { key: "status", label: statusLabel[status] ?? status, clear: () => onStatusChange("ALL") } : null,
    dateFrom ? { key: "from", label: `Từ ${formatInputDate(dateFrom)}`, clear: () => onDateFromChange("") } : null,
    dateTo ? { key: "to", label: `Đến ${formatInputDate(dateTo)}`, clear: () => onDateToChange("") } : null,
  ].filter((item): item is { key: string; label: string; clear: () => void } => item != null);

  return (
    <section className="profile-enter profile-enter-delay-1 overflow-hidden rounded-xl border border-[#E6DDE1] bg-white shadow-[0_6px_18px_rgba(43,34,40,0.03)]">
      <header className="border-b border-[#E6DDE1] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-baseline gap-3"><h2 className="text-lg font-semibold">Lịch sử làm bài chi tiết</h2><span className="text-xs font-medium tabular-nums text-[#6B5E65]">{attempts.length} lượt</span></div>
          <button onClick={onExport} disabled={!attempts.length} className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl border border-[#E6DDE1] bg-white px-3 text-sm font-semibold text-[#8B3F56] transition hover:border-[#8B3F56] hover:bg-[#F3E6EB] disabled:cursor-not-allowed disabled:opacity-50"><DownloadSimple size={17} /> Xuất CSV</button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_160px_150px_150px]">
          <label className="relative"><span className="sr-only">Tìm bài làm</span><MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5E65]" size={17} /><input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Tìm bài hoặc khóa học" className="min-h-10 w-full rounded-xl border border-[#E6DDE1] bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[#8B3F56] focus:ring-2 focus:ring-[#8B3F56]/10" /></label>
          <FilterSelect label="Lọc theo kỹ năng" value={skill} onChange={onSkillChange}><option value="ALL">Mọi kỹ năng</option>{skillOptions.map(value => <option key={value} value={value}>{skillLabel[value] ?? value}</option>)}</FilterSelect>
          <FilterSelect label="Lọc theo trạng thái" value={status} onChange={onStatusChange}><option value="ALL">Mọi trạng thái</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FilterSelect>
          <DateInput label="Từ ngày" value={dateFrom} onChange={onDateFromChange} max={dateTo || undefined} />
          <DateInput label="Đến ngày" value={dateTo} onChange={onDateToChange} min={dateFrom || undefined} />
        </div>

        {chips.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={`${filterCount} bộ lọc đang áp dụng`}>{chips.map(item => <button key={item.key} onClick={item.clear} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#F3E6EB] px-2.5 text-xs font-medium text-[#8B3F56] transition hover:bg-[#E6DDE1]">{item.label}<X size={12} aria-hidden="true" /></button>)}<button onClick={onClearFilters} className="min-h-8 px-2 text-xs font-semibold text-[#6E2F43] underline underline-offset-4">Xóa lọc</button></div>}
      </header>

      {attempts.length ? (
        <>
          <div className="hidden max-h-[590px] overflow-auto sm:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F7F2F4] text-[10px] font-bold uppercase tracking-[0.07em] text-[#6B5E65] shadow-[0_1px_0_#E6DDE1]"><tr><th className="px-4 py-3">Bài làm</th><th className="px-4 py-3"><SortButton active={sortKey === "TIME"} direction={sortDirection} onClick={() => onSort("TIME")}>Thời gian</SortButton></th><th className="px-4 py-3"><SortButton active={sortKey === "RESULT"} direction={sortDirection} onClick={() => onSort("RESULT")}>Kết quả</SortButton></th><th className="px-4 py-3">Chi tiết câu trả lời</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Hành động</th></tr></thead>
              <tbody className="divide-y divide-[#E6DDE1]">
                {shownAttempts.map(item => <tr key={item.id} tabIndex={0} onClick={() => onSelect(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onSelect(item); }} className="h-16 cursor-pointer align-middle outline-none transition-colors hover:bg-[#F7F2F4] focus-visible:bg-[#F7F2F4] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8B3F56]/30"><td className="px-4 py-2.5"><AttemptIdentity item={item} /></td><td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#6B5E65]">{formatDateTime(item.lastActivityAt)}</td><td className="px-4 py-2.5"><ResultValue item={item} /></td><td className="px-4 py-2.5"><AnswerBreakdown item={item} /></td><td className="px-4 py-2.5"><AttemptStatus value={item.status} /></td><td className="px-4 py-2.5 text-right"><button onClick={event => { event.stopPropagation(); onSelect(item); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#E6DDE1] bg-white px-3 text-xs font-semibold text-[#8B3F56] transition hover:border-[#8B3F56] hover:bg-[#F3E6EB]"><Eye size={15} /> Xem chi tiết</button></td></tr>)}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#E6DDE1] sm:hidden">{shownAttempts.map(item => <article key={item.id} onClick={() => onSelect(item)} className="cursor-pointer p-4 transition hover:bg-[#F7F2F4]"><AttemptIdentity item={item} /><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><DetailItem label="Thời gian" value={formatDateTime(item.lastActivityAt)} /><div><span className="block text-[#6B5E65]">Trạng thái</span><span className="mt-1 block"><AttemptStatus value={item.status} /></span></div><div className="col-span-2"><ResultValue item={item} /></div><div className="col-span-2"><AnswerBreakdown item={item} /></div></div><button onClick={event => { event.stopPropagation(); onSelect(item); }} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#F3E6EB] px-4 text-sm font-semibold text-[#8B3F56]">Xem chi tiết <CaretRight size={16} /></button></article>)}</div>
          <Pagination page={page} pageSize={pageSize} total={attempts.length} totalPages={totalPages} start={start} end={end} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </>
      ) : <div className="px-4 py-10 text-center"><MagnifyingGlass size={28} className="mx-auto text-[#8B3F56]" /><strong className="mt-3 block">Không có lượt làm nào khớp bộ lọc</strong><p className="mt-1 text-sm text-[#6B5E65]">Hãy đổi điều kiện tìm kiếm hoặc xóa các bộ lọc đang áp dụng.</p>{filterCount > 0 && <button onClick={onClearFilters} className="mt-4 min-h-10 rounded-xl bg-[#8B3F56] px-4 text-sm font-semibold text-white transition hover:bg-[#6E2F43]">Xóa lọc</button>}</div>}
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="min-h-10 w-full rounded-xl border border-[#E6DDE1] bg-white px-3 text-sm font-medium text-[#2B2228] outline-none transition focus:border-[#8B3F56] focus:ring-2 focus:ring-[#8B3F56]/10">{children}</select></label>;
}

function DateInput({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return <label><span className="sr-only">{label}</span><input type="date" aria-label={label} value={value} min={min} max={max} onChange={event => onChange(event.target.value)} className="min-h-10 w-full rounded-xl border border-[#E6DDE1] bg-white px-3 text-sm text-[#2B2228] outline-none transition focus:border-[#8B3F56] focus:ring-2 focus:ring-[#8B3F56]/10" /></label>;
}

function SortButton({ active, direction, onClick, children }: { active: boolean; direction: SortDirection; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-1.5 transition hover:bg-white ${active ? "text-[#8B3F56]" : "text-[#6B5E65]"}`}>{children}{active ? direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowDown size={12} className="opacity-40" />}</button>;
}

function Pagination({ page, pageSize, total, totalPages, start, end, onPageChange, onPageSizeChange }: { page: number; pageSize: number; total: number; totalPages: number; start: number; end: number; onPageChange: (value: number) => void; onPageSizeChange: (value: number) => void }) {
  const items = paginationItems(page, totalPages);
  return <footer className="grid items-center gap-3 border-t border-[#E6DDE1] bg-[#FDFBFC] px-4 py-3 text-xs text-[#6B5E65] md:grid-cols-[1fr_auto_1fr]"><span className="tabular-nums">Hiển thị {start}–{end} / {total} lượt</span><nav aria-label="Phân trang lịch sử làm bài" className="hidden items-center justify-center gap-1 sm:flex"><PageButton label="Trang trước" disabled={page === 1} onClick={() => onPageChange(page - 1)}><CaretLeft size={15} /></PageButton>{items.map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="grid h-8 w-8 place-items-center">…</span> : <PageButton key={item} label={`Trang ${item}`} active={item === page} onClick={() => onPageChange(item)}>{item}</PageButton>)}<PageButton label="Trang sau" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><CaretRight size={15} /></PageButton></nav><div className="flex items-center justify-between gap-2 sm:justify-end"><div className="flex items-center gap-1 sm:hidden"><PageButton label="Trang trước" disabled={page === 1} onClick={() => onPageChange(page - 1)}><CaretLeft size={15} /></PageButton><span className="px-2 font-semibold tabular-nums text-[#2B2228]">Trang {page}/{totalPages}</span><PageButton label="Trang sau" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><CaretRight size={15} /></PageButton></div><label className="inline-flex items-center gap-2"><span className="hidden sm:inline">Số dòng</span><select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} className="min-h-9 rounded-lg border border-[#E6DDE1] bg-white px-2 font-medium text-[#2B2228] outline-none focus:border-[#8B3F56]"><option value={10}>10 / trang</option><option value={20}>20 / trang</option><option value={50}>50 / trang</option></select></label></div></footer>;
}

function PageButton({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <button aria-label={label} aria-current={active ? "page" : undefined} disabled={disabled} onClick={onClick} className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-[#8B3F56] text-white" : "border border-transparent text-[#6B5E65] hover:border-[#E6DDE1] hover:bg-white hover:text-[#8B3F56]"}`}>{children}</button>;
}

function AttemptIdentity({ item }: { item: LearningAttempt }) {
  return <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F3E6EB] text-[#8B3F56]">{skillMeta(item.skill).icon}</span><div className="min-w-0"><strong className="block max-w-xs truncate text-sm font-semibold">{item.title}</strong><span className="mt-0.5 block text-xs text-[#6B5E65]">{skillLabel[item.skill] ?? item.skill} · Lần {item.attemptNo} · {item.courseName ? item.courseName : "Tự luyện"}</span></div></div>;
}

function ResultValue({ item }: { item: LearningAttempt }) {
  if (item.score == null) return <span className="text-xs font-medium text-[#6B5E65]">Chưa chấm</span>;
  return <div><strong className="block text-sm font-semibold tabular-nums">{score(item.score, item.maxScore)}</strong>{item.accuracy != null && <span className="mt-0.5 block text-xs text-[#6B5E65]">Chính xác {percent(item.accuracy)}</span>}</div>;
}

function AnswerBreakdown({ item }: { item: LearningAttempt }) {
  const total = item.correctCount + item.incorrectCount + item.unansweredCount;
  const width = (value: number) => total ? `${value / total * 100}%` : "0%";
  return <div className="min-w-[210px]"><div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B5E65]"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#3E8E6B]" />{item.correctCount} đúng</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#C0392B]" />{item.incorrectCount} sai</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#6B5E65]" />{item.unansweredCount} chưa trả lời</span></div><div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-[#E6DDE1]"><span className="bg-[#3E8E6B]" style={{ width: width(item.correctCount) }} /><span className="bg-[#C0392B]" style={{ width: width(item.incorrectCount) }} /><span className="bg-[#6B5E65]" style={{ width: width(item.unansweredCount) }} /></div></div>;
}

function SkillsSection({ skills, attempts }: { skills: Insights["skills"]; attempts: LearningAttempt[] }) {
  const coreSkills = ["LISTENING", "READING", "WRITING", "SPEAKING"].sort((left, right) => Number(hasSkillData(skills, right)) - Number(hasSkillData(skills, left)));
  return <section className="flex h-full flex-col rounded-xl border border-[#E6DDE1] bg-white p-4 shadow-[0_6px_18px_rgba(43,34,40,0.03)]"><header className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Năng lực theo kỹ năng</h2><p className="mt-0.5 text-xs text-[#6B5E65]">Độ chính xác, điểm và xu hướng từ dữ liệu thực tế.</p></div><span className="w-fit text-[11px] font-medium text-[#6B5E65]">Không quy đổi Band IELTS</span></header><div className="flex-1 divide-y divide-[#E6DDE1]">{coreSkills.map((currentSkill, index) => <SkillProgress key={currentSkill} skill={currentSkill} item={skills.find(candidate => candidate.skill === currentSkill)} attempts={attempts} index={index} />)}</div></section>;
}

function SkillProgress({ skill, item, attempts, index }: { skill: string; item: Insights["skills"][number] | undefined; attempts: LearningAttempt[]; index: number }) {
  const series = skillSeries(attempts, skill);
  const trend = skillTrend(series);
  const hasData = item?.accuracy != null;
  return <article className={`grid items-center gap-3 py-3.5 first:pt-1 last:pb-0 ${hasData ? "md:grid-cols-[minmax(155px,1.1fr)_minmax(180px,1.5fr)_72px_88px_96px]" : "md:grid-cols-[minmax(155px,1fr)_minmax(180px,2fr)_160px]"}`}><div className="flex min-w-0 items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${hasData ? "bg-[#F3E6EB] text-[#8B3F56]" : "bg-[#F7F2F4] text-[#6B5E65]"}`}>{skillMeta(skill).icon}</span><div className="min-w-0"><strong className="block text-sm font-semibold">{skillLabel[skill]}</strong><span className="block truncate text-[11px] text-[#6B5E65]">{item ? `${item.attempts} lượt · ${item.answeredQuestions} câu` : "Chưa có bài hoàn tất"}</span></div></div><div><div className="h-1.5 overflow-hidden rounded-full bg-[#E6DDE1]">{hasData && <div className="insights-progress h-full rounded-full bg-[#8B3F56]" style={{ "--progress-width": `${item.accuracy}%`, "--progress-delay": `${index * 80}ms` } as CSSProperties} />}</div>{hasData && <div className="mt-2"><Sparkline values={series} label={`Xu hướng ${skillLabel[skill]} trong ${series.length} lượt gần nhất`} /></div>}</div>{hasData ? <><div><span className="block text-[10px] uppercase text-[#6B5E65]">Chính xác</span><strong className="mt-0.5 block text-sm font-semibold tabular-nums text-[#8B3F56]">{percent(item.accuracy)}</strong></div><div><span className="block text-[10px] uppercase text-[#6B5E65]">Điểm TB</span><strong className="mt-0.5 block text-sm font-semibold tabular-nums">{percent(item.averageScorePercent)}</strong></div><TrendValue trend={trend} /></> : <span className="text-xs font-medium text-[#6B5E65]">Chưa có dữ liệu</span>}</article>;
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (!values.length) return <div className="h-5 rounded bg-[#F7F2F4]" aria-label="Chưa có dữ liệu xu hướng" />;
  const points = values.map((value, index) => `${values.length === 1 ? 50 : index * 100 / (values.length - 1)},${22 - value * 0.2}`).join(" ");
  return <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-5 w-full" role="img" aria-label={label}><line x1="0" y1="22" x2="100" y2="22" stroke="#E6DDE1" strokeWidth="1" /><polyline points={points} fill="none" stroke="#8B3F56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}

function TrendValue({ trend }: { trend: number | null }) {
  if (trend == null) return <div><span className="block text-[10px] uppercase text-[#6B5E65]">Xu hướng</span><span className="mt-0.5 block text-xs text-[#6B5E65]">Chưa đủ kỳ trước</span></div>;
  const positive = trend >= 0;
  return <div><span className="block text-[10px] uppercase text-[#6B5E65]">Xu hướng</span><strong className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${positive ? "text-[#3E8E6B]" : "text-[#C0392B]"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{positive ? "+" : ""}{Math.round(trend)}%</strong></div>;
}

function MistakesSection({ mistakes, attempts, onFilterSkill, onShowInProgress }: { mistakes: Insights["recurringMistakes"]; attempts: LearningAttempt[]; onFilterSkill: (value: string) => void; onShowInProgress: () => void }) {
  const sortedMistakes = [...mistakes].sort((left, right) => right.errorCount - left.errorCount).slice(0, 5);
  const maxErrors = Math.max(1, ...sortedMistakes.map(item => item.errorCount));
  const suggestions = actionSuggestions(mistakes, attempts);
  return <section className="flex h-full flex-col rounded-xl border border-[#E6DDE1] bg-white p-4 shadow-[0_6px_18px_rgba(43,34,40,0.03)]"><header className="mb-3"><h2 className="text-lg font-semibold">Lỗi thường gặp</h2><p className="mt-0.5 text-xs text-[#6B5E65]">Dạng lỗi lặp lại ít nhất 2 lần.</p></header>{sortedMistakes.length ? <div className="flex-1 divide-y divide-[#E6DDE1]">{sortedMistakes.map(item => <article key={`${item.skill}-${item.questionType}`} className="py-3 first:pt-0"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm font-semibold">{item.questionType}</strong><span className="text-[11px] text-[#6B5E65]">{skillLabel[item.skill] ?? item.skill} · {item.affectedAttempts} lượt</span></div><span className="shrink-0 text-xs font-semibold tabular-nums text-[#C0392B]">{item.errorCount} lỗi</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E6DDE1]"><span className="block h-full rounded-full bg-[#C0392B]" style={{ width: `${item.errorCount / maxErrors * 100}%` }} /></div><button onClick={() => onFilterSkill(item.skill)} className="mt-2 text-[11px] font-semibold text-[#8B3F56] underline underline-offset-4">Xem các bài {skillLabel[item.skill] ?? item.skill}</button></article>)}</div> : <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#E6DDE1] bg-[#FDFBFC] p-5 text-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#F3E6EB] text-[#8B3F56]"><CheckCircle size={21} /></span><strong className="mt-3 text-sm">Chưa có lỗi lặp lại</strong><p className="mt-1 max-w-xs text-xs leading-5 text-[#6B5E65]">Hệ thống ghi nhận lỗi khi một dạng lỗi lặp lại từ 2 lần. Hãy tiếp tục theo dõi sau các bài làm tiếp theo.</p></div>}<div className="mt-3 rounded-xl bg-[#F3E6EB] p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs font-semibold text-[#6E2F43]">Gợi ý hành động</strong>{attempts.some(item => item.status === "IN_PROGRESS") && <button onClick={onShowInProgress} className="text-[11px] font-semibold text-[#8B3F56] underline underline-offset-4">Lọc bài đang làm</button>}</div><ul className="mt-2 space-y-1.5 text-xs text-[#2B2228]">{suggestions.map(item => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9973F]" />{item}</li>)}</ul></div></section>;
}

type QuestionFilter = "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED";
type ViewMode = "WORKSPACE" | "BREAKDOWN" | "FULL_LIST";

type SectionInfo = {
  sectionNo: number;
  title: string;
  contentHtml: string;
  questions: StudentAttemptDetail["questions"];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  total: number;
};

function AttemptReviewScreen({
  studentId,
  item,
  attemptsList = [],
  onNavigateAttempt,
  onClose,
}: {
  studentId: string;
  item: LearningAttempt;
  attemptsList?: LearningAttempt[];
  onNavigateAttempt?: (attempt: LearningAttempt) => void;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<StudentAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("ALL");
  const [selectedQuestionKey, setSelectedQuestionKey] = useState("");
  const [activeSectionTitle, setActiveSectionTitle] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("WORKSPACE");
  const [showOverview, setShowOverview] = useState(true);
  const [passageFontSize, setPassageFontSize] = useState<number>(15);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiFetch<StudentAttemptDetail>(`/admin/students/${studentId}/learning-insights/attempts/${item.id}`)
      .then(value => {
        if (!active) return;
        setDetail(value);
        setSelectedQuestionKey(value.questions[0]?.questionKey ?? "");
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : "Không tải được chi tiết lượt làm.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [item.id, reloadKey, studentId]);

  const questions = detail?.questions ?? [];
  const skill = detail?.skill ?? item.skill;
  const isListening = skill === "LISTENING";
  const isWriting = skill === "WRITING";
  const sectionPrefix = isListening ? "Part" : "Passage";

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { type: string; total: number; correct: number; incorrect: number; unanswered: number }>();
    for (const q of questions) {
      const type = q.questionType || "GENERAL";
      const cur = map.get(type) || { type, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      cur.total += 1;
      if (q.correct === true) cur.correct += 1;
      else if (q.correct === false) cur.incorrect += 1;
      else cur.unanswered += 1;
      map.set(type, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [questions]);

  // Build sectionsList mapping each section to its questions & contentHtml
  const sectionsList = useMemo<SectionInfo[]>(() => {
    if (!questions.length) return [];

    if (detail?.sections && detail.sections.length > 0) {
      return detail.sections.map((sec, idx) => {
        const secNo = sec.sectionNo ?? idx + 1;
        const secQuestions = questions.filter(q => {
          if (q.sectionTitle && sec.title && (q.sectionTitle.toLowerCase().trim() === sec.title.toLowerCase().trim() || sec.title.toLowerCase().includes(q.sectionTitle.toLowerCase()))) {
            return true;
          }
          if (isListening) {
            if (secNo === 1) return q.questionNo <= 10;
            if (secNo === 2) return q.questionNo > 10 && q.questionNo <= 20;
            if (secNo === 3) return q.questionNo > 20 && q.questionNo <= 30;
            return q.questionNo > 30;
          }
          // Reading
          if (secNo === 1) return q.questionNo <= 13;
          if (secNo === 2) return q.questionNo > 13 && q.questionNo <= 26;
          return q.questionNo > 26;
        });

        const correctCount = secQuestions.filter(q => q.correct === true).length;
        const incorrectCount = secQuestions.filter(q => q.correct === false).length;
        const unansweredCount = secQuestions.filter(q => !q.studentAnswers || q.studentAnswers.length === 0).length;

        return {
          sectionNo: secNo,
          title: sec.title || `${sectionPrefix} ${secNo}`,
          contentHtml: sec.contentHtml || "",
          questions: secQuestions,
          correctCount,
          incorrectCount,
          unansweredCount,
          total: secQuestions.length,
        };
      });
    }

    // Fallback if detail.sections is not available
    const fallback = extractSections(questions, skill);
    return fallback.map((fb, idx) => {
      const secQuestions = questions.filter(q => fb.questionKeys.includes(q.questionKey));
      return {
        sectionNo: idx + 1,
        title: fb.title,
        contentHtml: "",
        questions: secQuestions,
        correctCount: fb.correctCount,
        incorrectCount: fb.incorrectCount,
        unansweredCount: fb.unansweredCount,
        total: fb.total,
      };
    });
  }, [detail?.sections, questions, skill, isListening, sectionPrefix]);

  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.questionKey === selectedQuestionKey)
      ?? questions[0]
      ?? null;
  }, [questions, selectedQuestionKey]);

  // Handle escape to close & arrow keys navigation
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (viewMode === "WORKSPACE" && questions.length > 0) {
        const curIndex = questions.findIndex(q => q.questionKey === selectedQuestionKey);
        if (event.key === "ArrowLeft" && curIndex > 0) {
          event.preventDefault();
          const prevKey = questions[curIndex - 1].questionKey;
          setSelectedQuestionKey(prevKey);
          const matched = sectionsList.find(s => s.questions.some(q => q.questionKey === prevKey));
          if (matched && activeSectionTitle !== "ALL") {
            setActiveSectionTitle(matched.title);
          }
        } else if (event.key === "ArrowRight" && curIndex >= 0 && curIndex < questions.length - 1) {
          event.preventDefault();
          const nextKey = questions[curIndex + 1].questionKey;
          setSelectedQuestionKey(nextKey);
          const matched = sectionsList.find(s => s.questions.some(q => q.questionKey === nextKey));
          if (matched && activeSectionTitle !== "ALL") {
            setActiveSectionTitle(matched.title);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSectionTitle, onClose, questions, sectionsList, selectedQuestionKey, viewMode]);

  const currentSection = useMemo(() => {
    if (activeSectionTitle !== "ALL") {
      const found = sectionsList.find(s => s.title === activeSectionTitle);
      if (found) return found;
    }
    if (selectedQuestion) {
      const found = sectionsList.find(s => s.questions.some(q => q.questionKey === selectedQuestion.questionKey));
      if (found) return found;
    }
    return sectionsList[0];
  }, [activeSectionTitle, sectionsList, selectedQuestion]);

  const totalQuestions = questions.length || Math.max(detail?.maxScore ?? 0, 1);
  const correctPct = detail ? Math.round((detail.correctCount / totalQuestions) * 100) : 0;

  const currentIndex = attemptsList.findIndex(a => a.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < attemptsList.length - 1;
  const onPrev = hasPrev && onNavigateAttempt ? () => onNavigateAttempt(attemptsList[currentIndex - 1]) : undefined;
  const onNext = hasNext && onNavigateAttempt ? () => onNavigateAttempt(attemptsList[currentIndex + 1]) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-[#2B2228]/55 p-0 backdrop-blur-[3px] sm:p-2 md:p-3" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="attempt-review-title" className="mx-auto flex h-[100dvh] w-full max-w-[1680px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[calc(100dvh-1rem)] sm:rounded-2xl sm:border sm:border-[#E6DDE1]">

        {/* Top Header Toolbar */}
        <header className="shrink-0 border-b border-[#E6DDE1] bg-white px-3 sm:px-5 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Left: Icon, Eyebrow, Status, Skill, Attempt, Title */}
            <div className="flex items-center gap-3 min-w-0">
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-2xs ${
                item.skill === "LISTENING" ? "bg-[#8F4458]" : item.skill === "READING" ? "bg-[#2563EB]" : item.skill === "WRITING" ? "bg-[#D97706]" : "bg-[#059669]"
              }`}>
                {skillMeta(item.skill).icon}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8B3F56]">Chi tiết bài thi IELTS</span>
                  <AttemptStatus value={detail?.status ?? item.status} />
                  <span className="rounded-full bg-[#F3E6EB] px-2 py-0.5 text-[11px] font-bold text-[#8B3F56]">
                    {skillLabel[detail?.skill ?? item.skill] ?? detail?.skill ?? item.skill}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    Lần {detail?.attemptNo ?? item.attemptNo}
                  </span>
                </div>
                <h1 id="attempt-review-title" className="truncate text-sm sm:text-base font-black tracking-tight text-[#2B2228] mt-0.5 max-w-[280px] sm:max-w-md lg:max-xl">
                  {detail?.title ?? item.title}
                </h1>
              </div>
            </div>

            {/* Right: Score Pill, View Mode Toggle & Close Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {detail && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-700 tabular-nums shadow-2xs">
                    {detail.correctCount}/{totalQuestions} câu đúng ({correctPct}%)
                  </span>
                  <span className="hidden md:inline-flex rounded-full bg-[#F3E6EB] border border-[#E6DDE1] px-2.5 py-1 text-xs font-black text-[#8B3F56]">
                    {estimateIeltsBand(detail.correctCount, totalQuestions, detail.skill)}
                  </span>
                </div>
              )}

              {/* Prev / Next Attempt navigation */}
              {attemptsList.length > 1 && onNavigateAttempt && (
                <div className="hidden lg:inline-flex items-center rounded-xl border border-[#E6DDE1] bg-[#F7F2F4] p-0.5 text-xs font-bold" role="group" aria-label="Điều hướng các lượt làm">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={onPrev}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                      hasPrev ? "text-[#2B2228] hover:bg-white hover:text-[#8B3F56]" : "text-slate-300 cursor-not-allowed"
                    }`}
                    title="Bài làm trước"
                  >
                    <CaretLeft size={13} weight="bold" />
                    <span>Bài trước</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={onNext}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                      hasNext ? "text-[#2B2228] hover:bg-white hover:text-[#8B3F56]" : "text-slate-300 cursor-not-allowed"
                    }`}
                    title="Bài làm sau"
                  >
                    <span>Bài sau</span>
                    <CaretRight size={13} weight="bold" />
                  </button>
                </div>
              )}

              <div className="hidden sm:inline-flex items-center rounded-xl border border-[#E6DDE1] bg-[#F7F2F4] p-1 text-xs font-bold" role="tablist">
                <button
                  type="button"
                  onClick={() => setViewMode("WORKSPACE")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    viewMode === "WORKSPACE" ? "bg-white text-[#8B3F56] shadow-2xs font-black" : "text-[#6B5E65] hover:text-[#2B2228]"
                  }`}
                  title="Phòng thi chia cột chuẩn IELTS"
                >
                  <Columns size={14} weight="bold" />
                  <span>Phòng thi IELTS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("FULL_LIST")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    viewMode === "FULL_LIST" ? "bg-white text-[#8B3F56] shadow-2xs font-black" : "text-[#6B5E65] hover:text-[#2B2228]"
                  }`}
                  title="Xem toàn bộ câu hỏi liên tục"
                >
                  <ListBullets size={14} weight="bold" />
                  <span>Toàn bộ câu hỏi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng chi tiết bài làm"
                className="grid size-9 place-items-center rounded-xl border border-[#E6DDE1] text-[#6B5E65] transition hover:border-[#8B3F56] hover:bg-[#F3E6EB] hover:text-[#8B3F56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3F56]"
                title="Đóng (ESC)"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

          </div>
        </header>

        {loading ? (
          <AttemptReviewLoading />
        ) : error ? (
          <div className="grid flex-1 place-items-center p-6">
            <div className="max-w-md text-center">
              <WarningCircle className="mx-auto text-[#C0392B]" size={36} weight="duotone" />
              <h3 className="mt-3 text-base font-bold text-[#2B2228]">Không tải được chi tiết lượt làm</h3>
              <p className="mt-1 text-sm leading-6 text-[#6B5E65]">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey(value => value + 1)}
                className="mt-4 rounded-xl bg-[#8B3F56] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#6E2F43] shadow-xs"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : detail ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">

            {/* =========================================================================
               PHẦN Ở TRÊN: TỔNG QUAN, SỐ CÂU ĐÚNG SAI, PHÂN TÍCH DẠNG BÀI
               ========================================================================= */}
            <div className="shrink-0 border-b border-[#E6DDE1] bg-[#FAF7F8]/50 p-3 sm:p-5 transition-all">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-[#8B3F56]/10 text-[#8B3F56]">
                    <ChartBar size={15} weight="bold" />
                  </span>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2B2228]">
                    Tổng quan kết quả & Phân tích dạng bài
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOverview(v => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6DDE1] bg-white px-2.5 py-1 text-xs font-bold text-[#6B5E65] hover:border-[#8B3F56] hover:text-[#8B3F56] transition shadow-2xs"
                >
                  <span>{showOverview ? "Thu gọn tổng quan" : "Mở rộng tổng quan"}</span>
                  {showOverview ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
                </button>
              </div>

              {showOverview ? (
                <div className="space-y-4">
                  {/* 6 Metric Cards: KẾT QUẢ, ĐỘ CHÍNH XÁC, CÂU ĐÚNG, CÂU SAI, BỎ QUA, THỜI LƯỢNG */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                    {/* KẾT QUẢ */}
                    <div className="rounded-xl border border-[#E6DDE1] bg-white p-3 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B5E65]">Kết quả</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-[#2B2228] tabular-nums">
                          {detail.correctCount}/{totalQuestions}
                        </span>
                        <span className="text-xs font-semibold text-[#6B5E65]">câu</span>
                      </div>
                    </div>

                    {/* ĐỘ CHÍNH XÁC */}
                    <div className="rounded-xl border border-[#E6DDE1] bg-white p-3 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B5E65]">Độ chính xác</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className={`text-xl sm:text-2xl font-black tabular-nums ${
                          correctPct >= 70 ? "text-emerald-600" : correctPct >= 50 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {correctPct}%
                        </span>
                      </div>
                    </div>

                    {/* CÂU ĐÚNG */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        <span>Câu đúng</span>
                        <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
                          {detail.correctCount}
                        </span>
                        <span className="text-xs font-medium text-emerald-800">câu</span>
                      </div>
                    </div>

                    {/* CÂU SAI */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-800">
                        <span>Câu sai</span>
                        <XCircle size={15} weight="fill" className="text-rose-600" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-rose-700 tabular-nums">
                          {detail.incorrectCount}
                        </span>
                        <span className="text-xs font-medium text-rose-800">câu</span>
                      </div>
                    </div>

                    {/* BỎ QUA / CHƯA TRẢ LỜI */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        <span>BỎ QUA</span>
                        <MinusCircle size={15} weight="fill" className="text-slate-400" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-slate-700 tabular-nums">
                          {detail.unansweredCount}
                        </span>
                        <span className="text-xs font-medium text-slate-600">câu</span>
                      </div>
                    </div>

                    {/* THỜI LƯỢNG */}
                    <div className="rounded-xl border border-[#E6DDE1] bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B5E65]">
                        <span>Thời lượng</span>
                        <Clock size={15} weight="bold" className="text-[#8B3F56]" />
                      </div>
                      <div className="mt-1">
                        <span className="text-base sm:text-lg font-black text-[#2B2228] tabular-nums block">
                          {formatDuration(detail.durationSeconds || 0)}
                        </span>
                        {detail.allowedDurationSeconds > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium block truncate">
                            Giới hạn: {formatDuration(detail.allowedDurationSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bảng phân tích chi tiết theo từng dạng bài */}
                  {typeBreakdown.length > 0 && (
                    <div className="rounded-xl border border-[#E6DDE1] bg-white overflow-hidden shadow-2xs">
                      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#FAF7F8] border-b border-[#E6DDE1]">
                        <div className="flex items-center gap-2">
                          <Table size={15} weight="bold" className="text-[#8B3F56]" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2B2228]">
                            Bảng phân tích chi tiết theo dạng câu hỏi
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#6B5E65]">
                          {typeBreakdown.length} dạng câu hỏi
                        </span>
                      </div>

                      <div className="max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-[#F7F2F4] text-[10px] font-bold uppercase tracking-wider text-[#6B5E65] border-b border-[#E6DDE1]">
                            <tr>
                              <th scope="col" className="px-4 py-2">Dạng câu hỏi</th>
                              <th scope="col" className="px-3 py-2 text-center">Tổng câu</th>
                              <th scope="col" className="px-3 py-2 text-center text-emerald-700 bg-emerald-50">Đúng</th>
                              <th scope="col" className="px-3 py-2 text-center text-rose-700 bg-rose-50">Sai</th>
                              <th scope="col" className="px-3 py-2 text-center text-slate-600">Bỏ qua</th>
                              <th scope="col" className="px-4 py-2 text-right">Tỷ lệ chính xác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6DDE1] font-medium text-[#2B2228]">
                            {typeBreakdown.map(row => {
                              const acc = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                              return (
                                <tr key={row.type} className="hover:bg-slate-50/80 transition">
                                  <td className="px-4 py-2 font-bold">
                                    <span className="block text-xs text-[#2B2228]">{readableQuestionType(row.type)}</span>
                                    <span className="block text-[10px] font-mono text-slate-400">{row.type}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center font-extrabold tabular-nums">{row.total}</td>
                                  <td className="px-3 py-2 text-center font-black text-emerald-600 bg-emerald-50/30 tabular-nums">{row.correct}</td>
                                  <td className="px-3 py-2 text-center font-black text-rose-600 bg-rose-50/30 tabular-nums">{row.incorrect}</td>
                                  <td className="px-3 py-2 text-center font-bold text-slate-400 tabular-nums">{row.unanswered}</td>
                                  <td className="px-4 py-2 text-right font-black tabular-nums">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${acc}%` }} />
                                      </div>
                                      <span className={acc >= 70 ? "text-emerald-600" : acc >= 50 ? "text-amber-600" : "text-rose-600"}>
                                        {acc}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Dòng tóm tắt khi thu gọn */
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-[#6B5E65]">
                  <span className="text-[#2B2228] font-black">
                    Kết quả: <strong className="text-[#8B3F56]">{detail.correctCount}/{totalQuestions} ({correctPct}%)</strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{detail.correctCount} Đúng</span>
                  <span>•</span>
                  <span className="text-rose-700 font-bold">{detail.incorrectCount} Sai</span>
                  <span>•</span>
                  <span className="text-slate-600">{detail.unansweredCount} Bỏ qua</span>
                  <span>•</span>
                  <span>Thời lượng: <strong className="text-[#2B2228]">{formatDuration(detail.durationSeconds || 0)}</strong></span>
                </div>
              )}
            </div>

            {/* =========================================================================
               PHẦN Ở DƯỚI: BÀI LÀM CỦA HỌC VIÊN
               ========================================================================= */}
            <div className="flex-1 min-h-[550px] flex flex-col bg-white">
              {isWriting ? (
                <WritingAttemptView detail={detail} fontSize={passageFontSize} onFontSizeChange={setPassageFontSize} />
              ) : viewMode === "FULL_LIST" ? (
                <FullQuestionListView
                  detail={detail}
                  questions={questions.filter(q => matchesQuestionFilter(q, filter))}
                  filter={filter}
                  onFilterChange={setFilter}
                />
              ) : (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {skill === "READING" ? (
                    <TeacherReadingReviewWorkspace
                      currentSection={currentSection}
                      selectedQuestion={selectedQuestion}
                      questions={questions}
                      sectionsList={sectionsList}
                      activeSectionTitle={activeSectionTitle}
                      onSelectQuestionKey={setSelectedQuestionKey}
                      onSelectSectionTitle={setActiveSectionTitle}
                      passageFontSize={passageFontSize}
                      onFontSizeChange={setPassageFontSize}
                    />
                  ) : (
                    <TeacherWorkspaceSplit
                      currentSection={currentSection}
                      selectedQuestion={selectedQuestion}
                      questions={questions}
                      sectionsList={sectionsList}
                      activeSectionTitle={activeSectionTitle}
                      onSelectQuestionKey={setSelectedQuestionKey}
                      onSelectSectionTitle={setActiveSectionTitle}
                      passageFontSize={passageFontSize}
                      onFontSizeChange={setPassageFontSize}
                    />
                  )}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </section>
    </div>
  );
}

function TeacherWorkspaceSplit({
  currentSection,
  selectedQuestion,
  questions,
  sectionsList,
  activeSectionTitle,
  onSelectQuestionKey,
  onSelectSectionTitle,
  passageFontSize,
  onFontSizeChange,
}: {
  currentSection: SectionInfo | undefined;
  selectedQuestion: StudentAttemptDetail["questions"][number] | null;
  questions: StudentAttemptDetail["questions"];
  sectionsList: SectionInfo[];
  activeSectionTitle: string;
  onSelectQuestionKey: (key: string) => void;
  onSelectSectionTitle: (title: string) => void;
  passageFontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
}) {
  const visibleQuestions = currentSection?.questions.length ? currentSection.questions : questions;
  const rangeStart = visibleQuestions.length ? Math.min(...visibleQuestions.map(question => question.questionNo)) : 0;
  const rangeEnd = visibleQuestions.length ? Math.max(...visibleQuestions.map(question => question.questionNo)) : 0;
  const rangeLabel = rangeStart && rangeEnd ? `${rangeStart}-${rangeEnd}` : "—";
  const sectionLabel = currentSection?.title || selectedQuestion?.sectionTitle || "Phần bài thi";

  const questionGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      title: string | null;
      instructions: string | null;
      questions: StudentAttemptDetail["questions"];
    }> = [];
    for (const question of visibleQuestions) {
      const key = `${question.groupTitle ?? ""}::${question.groupInstructions ?? ""}::${question.questionType}`;
      const last = groups.at(-1);
      if (last?.key === key) last.questions.push(question);
      else groups.push({
        key,
        title: question.groupTitle,
        instructions: question.groupInstructions ?? null,
        questions: [question],
      });
    }
    return groups;
  }, [visibleQuestions]);

  const selectQuestion = (question: StudentAttemptDetail["questions"][number]) => {
    onSelectQuestionKey(question.questionKey);
    document.getElementById(`teacher-review-${question.questionKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F5F2]" aria-label="Bài làm theo bố cục IELTS">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E4D8C2] bg-[#FFF8E8] px-4 py-2 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#7A351C]">Reading · {sectionLabel}</p>
          <p className="mt-0.5 text-xs text-[#865231]">Read the passage and answer questions {rangeLabel}.</p>
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-[#7A351C]">{visibleQuestions.length} câu hỏi</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto bg-white lg:grid-cols-[minmax(360px,42%)_minmax(420px,1fr)_190px] lg:overflow-hidden">
        <article className="flex min-h-[420px] flex-col overflow-hidden border-b border-[#D7D7D2] bg-white lg:min-h-0 lg:border-b-0 lg:border-r" aria-label="Nội dung bài đọc">
          <div className="flex shrink-0 items-center justify-between border-b border-[#E3E3DF] bg-white px-4 py-2.5 sm:px-6">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7276]">Reading passage {currentSection?.sectionNo ?? 1}</span>
              <strong className="mt-0.5 block truncate text-sm font-semibold text-[#222222]">{sectionLabel}</strong>
            </div>
            <div className="flex items-center rounded-md border border-[#D8D8D3] bg-white" role="group" aria-label="Cỡ chữ bài đọc">
              <button
                type="button"
                onClick={() => onFontSizeChange(previous => Math.max(13, previous - 1))}
                className="grid size-8 place-items-center text-xs font-semibold text-[#444444] transition hover:bg-[#F1F1ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8B3F56]"
                aria-label="Giảm cỡ chữ"
              >
                A-
              </button>
              <span className="border-x border-[#D8D8D3] px-2 text-[11px] font-semibold tabular-nums text-[#666666]">{passageFontSize}px</span>
              <button
                type="button"
                onClick={() => onFontSizeChange(previous => Math.min(22, previous + 1))}
                className="grid size-8 place-items-center text-xs font-semibold text-[#444444] transition hover:bg-[#F1F1ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8B3F56]"
                aria-label="Tăng cỡ chữ"
              >
                A+
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            {currentSection?.contentHtml ? (
              <div
                className="prose prose-slate mx-auto max-w-[76ch] text-[#202020] leading-[1.75] [&_h1]:font-sans [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-sans [&_h3]:font-bold [&_p]:mb-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#CFCFC9] [&_th]:bg-[#F5F5F2] [&_th]:p-2 [&_td]:border [&_td]:border-[#CFCFC9] [&_td]:p-2"
                style={{ fontSize: `${passageFontSize}px` }}
                dangerouslySetInnerHTML={{ __html: currentSection.contentHtml }}
              />
            ) : (
              <div className="mx-auto max-w-lg rounded-xl border border-dashed border-[#D7D7D2] bg-[#FAFAF8] px-6 py-8 text-center">
                <BookOpenText className="mx-auto text-[#8B3F56]" size={28} weight="duotone" />
                <p className="mt-3 text-sm font-bold text-[#2B2228]">Chưa nhận được nội dung passage</p>
                <p className="mt-1 text-xs leading-5 text-[#6B6668]">Passage phải được lấy từ phiên bản đề đã chốt. Hệ thống không dùng nội dung câu hỏi để thay thế.</p>
              </div>
            )}
          </div>
        </article>

        <div className="flex min-h-[420px] min-w-0 flex-col overflow-hidden bg-white lg:min-h-0" aria-label="Chi tiết câu hỏi và đáp án">
          <div className="shrink-0 border-b border-[#E3E3DF] bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong className="block text-base font-bold text-[#171717]">Questions {rangeLabel}</strong>
                <p className="mt-0.5 text-sm leading-5 text-[#555555]">
                  Xem toàn bộ câu hỏi của passage và đối chiếu đáp án đã nộp.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-[#6B6668]" aria-label="Chú thích trạng thái">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#247052]" />Đúng</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#B42335]" />Sai</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#A9AFB5]" />Bỏ qua</span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 scroll-smooth overflow-y-auto px-4 py-4 sm:px-6">
            {questionGroups.length ? (
              <div className="space-y-6">
                {questionGroups.map(group => (
                  <section key={group.key} className="border-b border-[#E3E3DF] pb-6 last:border-b-0">
                    <header className="mb-3">
                      {group.title && <h3 className="text-sm font-bold text-[#1F1F1F]">{group.title}</h3>}
                      {group.instructions && <p className="mt-1 text-xs leading-5 text-[#666166]">{group.instructions}</p>}
                    </header>
                    <div className="space-y-3">
                      {group.questions.map(question => (
                        <TeacherQuestionRow
                          key={question.questionKey}
                          question={question}
                          selected={question.questionKey === selectedQuestion?.questionKey}
                          onSelect={() => onSelectQuestionKey(question.questionKey)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid h-48 place-items-center text-center text-sm text-[#6B5E65]">Passage này chưa có câu hỏi.</div>
            )}
          </div>
        </div>

        <aside className="border-t border-[#D7D7D2] bg-[#FAFAF8] p-3 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0" aria-label="Điều hướng câu hỏi">
          <div className="rounded-lg border border-[#DDD9D6] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B6668]">Kết quả passage</span>
            <strong className="mt-1 block text-lg tabular-nums text-[#171717]">{currentSection?.correctCount ?? 0}/{visibleQuestions.length} câu đúng</strong>
          </div>

          <nav className="mt-3 space-y-3" aria-label="Chọn passage">
            {sectionsList.map(section => {
              const active = currentSection?.title === section.title;
              return (
                <div key={section.title}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSectionTitle(section.title);
                      if (section.questions.length) onSelectQuestionKey(section.questions[0].questionKey);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3F56] ${active ? "bg-[#F3E6EB] text-[#8B3F56]" : "text-[#2B2228] hover:bg-[#F1F1ED]"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{section.title || `Phần ${section.sectionNo}`}</span>
                    <span className="tabular-nums">{section.correctCount}/{section.total}</span>
                  </button>
                  {active && (
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {visibleQuestions.map(question => {
                        const selected = question.questionKey === selectedQuestion?.questionKey;
                        const state = questionState(question);
                        const marker = state === "correct" ? "border-[#247052]" : state === "incorrect" ? "border-[#B42335]" : "border-[#A9AFB5]";
                        return (
                          <button
                            key={question.questionKey}
                            type="button"
                            onClick={() => selectQuestion(question)}
                            className={`relative grid h-9 place-items-center rounded-md border bg-white text-xs font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3F56] ${marker} ${selected ? "ring-2 ring-[#8B3F56] ring-offset-1" : "hover:bg-[#F7F7F4]"}`}
                            aria-current={selected ? "step" : undefined}
                          >
                            {question.questionNo}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <p className="mt-4 text-[10px] leading-4 text-[#777174]">Chọn số câu để chuyển nhanh đến vị trí tương ứng.</p>
        </aside>
      </div>
    </section>
  );
}

function TeacherQuestionRow({
  question,
  selected,
  onSelect,
}: {
  question: StudentAttemptDetail["questions"][number];
  selected: boolean;
  onSelect: () => void;
}) {
  const state = questionState(question);

  return (
    <article
      id={`teacher-review-${question.questionKey}`}
      className={`scroll-mt-3 rounded-lg border bg-white p-3 transition ${selected ? "border-[#8B3F56] shadow-[0_0_0_2px_rgba(139,63,86,0.10)]" : "border-[#E1DFDC]"}`}
      onClick={onSelect}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${state === "correct" ? "bg-[#E8F6EE] text-[#247052]" : state === "incorrect" ? "bg-[#FDECEF] text-[#B42335]" : "bg-[#EEF0F2] text-[#68717A]"}`}>{question.questionNo}</span>
          <span className="truncate text-[11px] font-semibold text-[#777174]">{readableQuestionType(question.questionType)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <QuestionStateBadge state={state} />
          <span className="text-[11px] font-bold tabular-nums text-[#4E494C]">{formatQuestionScore(question.score, question.maxScore)}</span>
        </div>
      </header>

      {question.prompt && (
        <section className="mt-2 text-sm leading-6 text-[#202020]" aria-label="Nội dung câu hỏi">
          <FormattedPrompt content={question.prompt} fontSize={14} activeQuestionNo={question.questionNo} />
        </section>
      )}

      <section className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Đối chiếu đáp án">
        <AnswerSummary label="Học viên" answers={question.studentAnswers} tone={state === "correct" ? "correct" : state === "incorrect" ? "incorrect" : "empty"} />
        <AnswerSummary label="Đáp án đúng" answers={question.correctAnswers} tone="correct" />
      </section>
    </article>
  );
}

function AnswerSummary({ label, answers, tone }: { label: string; answers: string[]; tone: "correct" | "incorrect" | "empty" }) {
  const toneClass = tone === "correct"
    ? "border-[#B7DDC9] bg-[#F3FBF7] text-[#18513D]"
    : tone === "incorrect"
      ? "border-[#F0C1C8] bg-[#FFF6F7] text-[#9B1C2E]"
      : "border-[#D8DADC] bg-[#F7F8F8] text-[#68717A]";
  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <span className="block text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
      <strong className="mt-1 block text-xs leading-5">{answers.length ? answers.join(", ") : "Bỏ qua"}</strong>
    </div>
  );
}

/* =========================================================================
   BREAKDOWN VIEW (Bảng phân tích dạng bài chi tiết)
   ========================================================================= */
function QuestionBreakdownView({ detail }: { detail: StudentAttemptDetail }) {
  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { type: string; total: number; correct: number; incorrect: number; unanswered: number }>();
    for (const q of detail.questions) {
      const type = q.questionType || "GENERAL";
      const cur = map.get(type) || { type, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      cur.total += 1;
      if (q.correct === true) cur.correct += 1;
      else if (q.correct === false) cur.incorrect += 1;
      else cur.unanswered += 1;
      map.set(type, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [detail.questions]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-white">
      <div>
        <h3 className="text-lg font-black text-[#2B2228]">
          Bảng phân tích dạng bài chi tiết
        </h3>
        <p className="text-xs text-[#6B5E65] mt-0.5">
          Thống kê kết quả phân loại theo từng dạng câu hỏi trong đề thi này
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E6DDE1] shadow-2xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#FAF7F8] text-xs font-extrabold uppercase tracking-wider text-[#6B5E65] border-b border-[#E6DDE1]">
            <tr>
              <th scope="col" className="px-5 py-3">Dạng câu hỏi</th>
              <th scope="col" className="px-4 py-3 text-center">Tổng số câu</th>
              <th scope="col" className="px-4 py-3 text-center text-emerald-700 bg-emerald-500/10">Đúng</th>
              <th scope="col" className="px-4 py-3 text-center text-rose-700">Sai</th>
              <th scope="col" className="px-4 py-3 text-center text-slate-600">Bỏ qua</th>
              <th scope="col" className="px-5 py-3 text-right">Tỷ lệ chính xác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6DDE1] bg-white font-medium text-[#2B2228]">
            {typeBreakdown.map(row => {
              const acc = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
              return (
                <tr key={row.type} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5 font-bold">
                    <span className="block text-sm text-[#2B2228]">{readableQuestionType(row.type)}</span>
                    <span className="block text-[11px] font-mono text-slate-400">{row.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-extrabold tabular-nums">{row.total}</td>
                  <td className="px-4 py-3.5 text-center font-black text-emerald-600 bg-emerald-50/40 tabular-nums">
                    {row.correct}
                  </td>
                  <td className="px-4 py-3.5 text-center font-black text-rose-600 tabular-nums">
                    {row.incorrect}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-400 tabular-nums">
                    {row.unanswered}
                  </td>
                  <td className="px-5 py-3.5 text-right font-black tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${acc}%` }} />
                      </div>
                      <span className={acc >= 70 ? "text-emerald-600" : acc >= 50 ? "text-amber-600" : "text-rose-600"}>
                        {acc}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   FULL QUESTION LIST VIEW (Toàn bộ câu hỏi liên tục)
   ========================================================================= */
function FullQuestionListView({
  detail,
  questions,
  filter,
  onFilterChange,
}: {
  detail: StudentAttemptDetail;
  questions: StudentAttemptDetail["questions"];
  filter: QuestionFilter;
  onFilterChange: (f: QuestionFilter) => void;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 bg-[#FAF7F8]/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DDE1] pb-3 bg-white p-4 rounded-xl shadow-2xs">
        <div>
          <h3 className="text-base font-black text-[#2B2228]">Toàn bộ {questions.length} câu hỏi</h3>
          <p className="text-xs text-[#6B5E65]">Xem danh sách đối chiếu toàn bộ câu hỏi trong bài làm</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => onFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "ALL" ? "bg-[#8B3F56] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Tất cả ({detail.questions.length})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("CORRECT")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "CORRECT" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
          >
            Đúng ({detail.correctCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("INCORRECT")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "INCORRECT" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"}`}
          >
            Sai ({detail.incorrectCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("UNANSWERED")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "UNANSWERED" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            Bỏ qua ({detail.unansweredCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const state = questionState(q);
          return (
            <article key={q.questionKey} className="rounded-xl border border-[#E6DDE1] bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-[#2B2228]">Câu {q.questionNo}</h4>
                  <span className="rounded-md bg-[#8B3F56]/10 px-2 py-0.5 text-xs font-bold text-[#8B3F56]">
                    {readableQuestionType(q.questionType)}
                  </span>
                  {q.sectionTitle && (
                    <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                      ({q.sectionTitle})
                    </span>
                  )}
                </div>
                <QuestionStateBadge state={state} />
              </div>

              {/* Answers */}
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <span className="font-bold text-slate-500 block mb-1">Học viên chọn:</span>
                  <span className={`font-mono font-bold text-sm ${
                    state === "correct" ? "text-emerald-700" : state === "incorrect" ? "text-rose-700" : "text-slate-500 italic"
                  }`}>
                    {q.studentAnswers.length ? q.studentAnswers.join(", ") : "(Bỏ qua)"}
                  </span>
                </div>

                <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-200">
                  <span className="font-bold text-emerald-800 block mb-1">Đáp án đúng chuẩn:</span>
                  <span className="font-mono font-bold text-sm text-emerald-900">
                    {q.correctAnswers.length ? q.correctAnswers.join(", ") : "—"}
                  </span>
                </div>
              </div>

            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   WRITING ATTEMPT VIEW (Chuyên biệt cho IELTS Writing)
   ========================================================================= */
function WritingAttemptView({
  detail,
  fontSize,
  onFontSizeChange,
}: {
  detail: StudentAttemptDetail;
  fontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
}) {
  const [selectedTaskIdx, setSelectedTaskIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const activeQuestion = detail.questions[selectedTaskIdx] || detail.questions[0];

  const essayText = activeQuestion?.studentAnswers?.join("\n\n") || "";
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const isTask1 = (activeQuestion?.groupTitle || activeQuestion?.prompt || "").toLowerCase().includes("task 1") || activeQuestion?.questionNo === 1;
  const targetWords = isTask1 ? 150 : 250;
  const isWordCountMet = wordCount >= targetWords;

  const handleCopy = () => {
    void navigator.clipboard.writeText(essayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E6DDE1] overflow-hidden bg-white">

      {/* Left: Writing Prompt */}
      <div className="flex min-h-0 flex-col overflow-hidden bg-[#FAF7F8]/40">
        <div className="shrink-0 flex items-center justify-between border-b border-[#E6DDE1] bg-white px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-amber-500/10 text-amber-700">
              <PenNib size={15} weight="bold" />
            </span>
            <span className="text-xs font-black text-[#2B2228]">
              {activeQuestion?.groupTitle || `IELTS Writing Task ${selectedTaskIdx + 1}`}
            </span>
          </div>

          {detail.questions.length > 1 && (
            <div className="flex items-center gap-1 bg-[#F7F2F4] rounded-lg p-0.5 border border-[#E6DDE1]">
              {detail.questions.map((q, idx) => (
                <button
                  key={q.questionKey}
                  type="button"
                  onClick={() => setSelectedTaskIdx(idx)}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${selectedTaskIdx === idx ? "bg-white text-[#8B3F56] shadow-2xs" : "text-slate-600"}`}
                >
                  Task {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1">
              Yêu cầu đề bài (Writing Prompt)
            </span>
            <FormattedPrompt content={activeQuestion?.prompt ?? null} fontSize={fontSize} />
          </div>
        </div>
      </div>

      {/* Right: Student's Submitted Essay */}
      <div className="flex min-h-0 flex-col overflow-hidden bg-white">
        <div className="shrink-0 flex items-center justify-between border-b border-[#E6DDE1] bg-white px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#2B2228]">Bài làm của học viên</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isWordCountMet ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              {wordCount} từ ({isWordCountMet ? `Đạt chuẩn ≥${targetWords}` : `Chưa đủ ${targetWords} từ`})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E6DDE1] px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              title="Sao chép bài viết"
            >
              <Copy size={13} />
              <span>{copied ? "Đã chép" : "Sao chép"}</span>
            </button>

            <div className="flex items-center gap-1 bg-[#F7F2F4] rounded-lg p-0.5 border border-[#E6DDE1]">
              <button
                type="button"
                onClick={() => onFontSizeChange(p => Math.max(13, p - 1))}
                className="grid size-5 place-items-center rounded text-xs font-bold"
              >
                A-
              </button>
              <span className="px-1 text-[11px] font-mono font-bold text-slate-600">{fontSize}px</span>
              <button
                type="button"
                onClick={() => onFontSizeChange(p => Math.min(20, p + 1))}
                className="grid size-5 place-items-center rounded text-xs font-bold"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
          <article
            className="rounded-xl border border-[#E6DDE1] bg-[#FAF7F8]/20 p-5 font-serif leading-relaxed text-[#2B2228] whitespace-pre-wrap shadow-2xs"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {essayText || <span className="italic text-slate-400">Học viên chưa nhập nội dung bài viết.</span>}
          </article>

          {activeQuestion?.explanation && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
              <h4 className="text-xs font-extrabold text-[#2B2228] mb-1 flex items-center gap-1.5">
                <Lightbulb size={16} className="text-amber-600" weight="fill" />
                Nhận xét &amp; Góp ý từ giáo viên
              </h4>
              <p className="text-xs leading-relaxed text-[#2B2228] whitespace-pre-wrap">
                {activeQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* =========================================================================
   HELPER UTILITIES & SUBCOMPONENTS
   ========================================================================= */
function FormattedPrompt({ content, fontSize = 15, activeQuestionNo }: { content: string | null; fontSize?: number; activeQuestionNo?: number }) {
  if (!content) {
    return <p className="text-xs italic text-[#6B5E65]">Đề bài chưa có nội dung văn bản đi kèm.</p>;
  }

  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    return (
      <div
        className="prose prose-sm max-w-none text-[#2B2228] leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#E6DDE1] [&_th]:p-2 [&_th]:bg-[#F7F2F4] [&_td]:border [&_td]:border-[#E6DDE1] [&_td]:p-2"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="space-y-3 leading-relaxed text-[#2B2228]" style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}>
      {content.split(/\n\s*\n/).map((para, idx) => (
        <p key={idx} className="whitespace-pre-wrap">
          {para}
        </p>
      ))}
    </div>
  );
}

type SectionTabInfo = {
  title: string;
  rangeLabel: string;
  questionKeys: string[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  total: number;
};

function extractSections(questions: StudentAttemptDetail["questions"], skill: string): SectionTabInfo[] {
  if (!questions.length) return [];
  const map = new Map<string, StudentAttemptDetail["questions"]>();

  for (const q of questions) {
    let secTitle = q.sectionTitle?.trim();
    if (!secTitle) {
      if (skill === "LISTENING") {
        secTitle = q.questionNo <= 10 ? "Part 1" : q.questionNo <= 20 ? "Part 2" : q.questionNo <= 30 ? "Part 3" : "Part 4";
      } else if (skill === "READING") {
        secTitle = q.questionNo <= 13 ? "Passage 1" : q.questionNo <= 26 ? "Passage 2" : "Passage 3";
      } else if (skill === "WRITING") {
        secTitle = q.questionNo <= 1 ? "Task 1" : "Task 2";
      } else if (skill === "SPEAKING") {
        secTitle = q.questionNo <= 1 ? "Part 1" : q.questionNo <= 2 ? "Part 2" : "Part 3";
      } else {
        secTitle = "Phần 1";
      }
    }
    const list = map.get(secTitle) || [];
    list.push(q);
    map.set(secTitle, list);
  }

  return Array.from(map.entries()).map(([title, items]) => {
    const minNo = Math.min(...items.map(q => q.questionNo));
    const maxNo = Math.max(...items.map(q => q.questionNo));
    const correctCount = items.filter(q => q.correct === true).length;
    const incorrectCount = items.filter(q => q.correct === false).length;
    const unansweredCount = items.filter(q => !q.studentAnswers?.length).length;
    return {
      title,
      rangeLabel: minNo === maxNo ? `Câu ${minNo}` : `Câu ${minNo} - ${maxNo}`,
      questionKeys: items.map(q => q.questionKey),
      correctCount,
      incorrectCount,
      unansweredCount,
      total: items.length,
    };
  });
}

function estimateIeltsBand(correctCount: number, maxScore: number, skill: string): string {
  if (maxScore !== 40) {
    if (maxScore <= 0) return "—";
    const ratio = correctCount / maxScore;
    const band = Math.round((ratio * 8 + 1) * 2) / 2;
    return `Band ${band.toFixed(1)}`;
  }
  const isReading = skill === "READING";
  if (correctCount >= 39) return "Band 9.0";
  if (correctCount >= 37) return "Band 8.5";
  if (correctCount >= 35) return "Band 8.0";
  if (correctCount >= (isReading ? 33 : 32)) return "Band 7.5";
  if (correctCount >= 30) return "Band 7.0";
  if (correctCount >= (isReading ? 27 : 26)) return "Band 6.5";
  if (correctCount >= 23) return "Band 6.0";
  if (correctCount >= (isReading ? 19 : 18)) return "Band 5.5";
  if (correctCount >= 15) return "Band 5.0";
  if (correctCount >= 13) return "Band 4.5";
  if (correctCount >= 10) return "Band 4.0";
  if (correctCount >= 8) return "Band 3.5";
  if (correctCount >= 6) return "Band 3.0";
  if (correctCount >= 4) return "Band 2.5";
  if (correctCount >= 2) return "Band 2.0";
  return "Band 1.0";
}

function QuestionStateBadge({ state, compact = false }: { state: ReturnType<typeof questionState>; compact?: boolean }) {
  const sizeClass = compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  if (state === "correct") return <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 font-black text-emerald-700 ${sizeClass}`}><CheckCircle size={compact ? 11 : 14} weight="fill" />Đúng</span>;
  if (state === "incorrect") return <span className={`inline-flex items-center gap-1 rounded-full bg-rose-500/15 font-black text-rose-700 ${sizeClass}`}><XCircle size={compact ? 11 : 14} weight="fill" />Sai</span>;
  if (state === "answered") return <span className={`inline-flex items-center gap-1 rounded-full bg-blue-500/15 font-black text-blue-700 ${sizeClass}`}><ClockCounterClockwise size={compact ? 11 : 14} />Chưa chấm</span>;
  return <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 font-bold text-slate-500 ${sizeClass}`}><MinusCircle size={compact ? 11 : 14} />Bỏ qua</span>;
}

function AttemptReviewLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-2 gap-px border-b border-[#E6DDE1] bg-[#E6DDE1] sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse bg-[#F7F2F4]" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-2 divide-x divide-[#E6DDE1]">
        <div className="p-6 space-y-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-[#F7F2F4]" />
          <div className="h-32 animate-pulse rounded-xl bg-[#F7F2F4]" />
          <div className="h-48 animate-pulse rounded-xl bg-[#F7F2F4]" />
        </div>
        <div className="grid place-items-center p-6">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#6B5E65]">
            <CircleNotch className="animate-spin text-[#8B3F56]" size={22} />
            Đang tải dữ liệu bài thi chuẩn IELTS…
          </span>
        </div>
      </div>
    </div>
  );
}

function questionState(question: StudentAttemptDetail["questions"][number]) {
  if (question.correct === true) return "correct" as const;
  if (question.correct === false) return "incorrect" as const;
  return question.studentAnswers.length ? "answered" as const : "unanswered" as const;
}

function matchesQuestionFilter(question: StudentAttemptDetail["questions"][number], filter: QuestionFilter) {
  const state = questionState(question);
  if (filter === "ALL") return true;
  if (filter === "CORRECT") return state === "correct";
  if (filter === "INCORRECT") return state === "incorrect";
  return state === "unanswered";
}

function readableQuestionType(type: string): string {
  const upper = (type || "").toUpperCase();
  if (upper.includes("FILL") || upper.includes("BLANK") || upper.includes("GAP")) return "Điền vào chỗ trống (Fill In Blank)";
  if (upper.includes("MULTIPLE") || upper.includes("CHOICE")) return "Trắc nghiệm (Multiple Choice)";
  if (upper.includes("TRUE_FALSE") || upper.includes("NOT_GIVEN")) return "True / False / Not Given";
  if (upper.includes("YES_NO")) return "Yes / No / Not Given";
  if (upper.includes("MATCHING") && upper.includes("HEADING")) return "Nối tiêu đề (Matching Headings)";
  if (upper.includes("MATCHING")) return "Nối thông tin (Matching)";
  if (upper.includes("SUMMARY")) return "Tóm tắt (Summary Completion)";
  if (upper.includes("SENTENCE")) return "Hoàn thành câu (Sentence Completion)";
  if (upper.includes("MAP") || upper.includes("DIAGRAM") || upper.includes("LABEL")) return "Gán nhãn sơ đồ (Diagram Labeling)";
  if (upper.includes("FLOW_CHART")) return "Lưu đồ (Flow Chart Completion)";
  if (upper.includes("SHORT_ANSWER")) return "Trả lời ngắn (Short Answer)";
  if (upper.includes("WRITING_TASK_1") || upper.includes("TASK_1")) return "Writing Task 1";
  if (upper.includes("WRITING_TASK_2") || upper.includes("TASK_2")) return "Writing Task 2";
  if (upper.includes("SPEAKING_PART_1")) return "Speaking Part 1";
  if (upper.includes("SPEAKING_PART_2")) return "Speaking Part 2";
  if (upper.includes("SPEAKING_PART_3")) return "Speaking Part 3";
  return type.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

function formatQuestionScore(value: number, max: number) {
  return max > 0 ? `${value.toLocaleString("vi-VN")} / ${max.toLocaleString("vi-VN")} điểm` : "Chưa có điểm";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-[#6B5E65]">{label}</span><strong className="mt-1 block font-medium tabular-nums">{value}</strong></div>;
}

function AttemptStatus({ value }: { value: string }) {
  if (value === "IN_PROGRESS") return <StatusPill className="bg-[#F3E6EB] text-[#8B3F56]" icon={<ArrowClockwise size={13} />}>{statusLabel[value]}</StatusPill>;
  if (value === "GRADED") return <StatusPill className="bg-[#3E8E6B]/10 text-[#3E8E6B]" icon={<CheckCircle size={13} weight="fill" />}>{statusLabel[value]}</StatusPill>;
  if (value === "EXPIRED") return <StatusPill className="bg-[#D9A441]/10 text-[#D9A441]" icon={<WarningCircle size={13} weight="fill" />}>{statusLabel[value]}</StatusPill>;
  return <StatusPill className="border border-[#E6DDE1] bg-white text-[#6B5E65]" icon={<ClockCounterClockwise size={13} />}>{statusLabel[value] ?? value}</StatusPill>;
}

function StatusPill({ className, icon, children }: { className: string; icon: ReactNode; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{icon}{children}</span>;
}

function State({ title, text, action }: { title: string; text: string; action?: () => void }) {
  return <div className="bg-white p-10 text-center"><strong className="block text-[#2B2228]">{title}</strong><p className="mx-auto mt-2 max-w-lg text-sm text-[#6B5E65]">{text}</p>{action && <button onClick={action} className="mt-4 min-h-10 rounded-xl border border-[#8B3F56] px-4 text-sm font-semibold text-[#8B3F56] hover:bg-[#F3E6EB]">Thử lại</button>}</div>;
}

function InsightsSkeleton() {
  return <div className="space-y-4" aria-label="Đang tải dữ liệu học tập"><div className="h-36 animate-pulse rounded-xl bg-[#F7F2F4]" /><div className="overflow-hidden rounded-xl border border-[#E6DDE1] bg-white"><div className="h-28 animate-pulse bg-[#F7F2F4]" />{Array.from({ length: 6 }, (_, index) => <div key={index} className="mx-4 h-16 animate-pulse border-b border-[#E6DDE1] bg-white" />)}</div></div>;
}

function skillMeta(skill: string) {
  if (skill === "LISTENING") return { icon: <Headphones size={17} weight="duotone" /> };
  if (skill === "READING") return { icon: <BookOpenText size={17} weight="duotone" /> };
  if (skill === "WRITING") return { icon: <PenNib size={17} weight="duotone" /> };
  if (skill === "SPEAKING") return { icon: <MicrophoneStage size={17} weight="duotone" /> };
  return { icon: <Exam size={17} weight="duotone" /> };
}

function supportMeta(level: Insights["summary"]["supportLevel"]) {
  if (level === "NEEDS_ATTENTION") return { label: "Cần ưu tiên hỗ trợ", description: "Dữ liệu cho thấy học viên cần được liên hệ và xây dựng kế hoạch cải thiện cụ thể.", badgeClass: "bg-[#C0392B]/10 text-[#C0392B]" };
  if (level === "WATCH") return { label: "Cần theo dõi", description: "Có tín hiệu cần lưu ý. Nên kiểm tra tiến độ trong buổi học hoặc lần tư vấn gần nhất.", badgeClass: "bg-[#FBF3E2] text-[#C9973F]" };
  if (level === "ON_TRACK") return { label: "Đúng tiến độ", description: "Kết quả gần đây chưa ghi nhận dấu hiệu cần can thiệp.", badgeClass: "bg-[#3E8E6B]/10 text-[#3E8E6B]" };
  return { label: "Đang thu thập dữ liệu", description: "Cần ít nhất một bài hoàn tất trước khi hệ thống đưa ra nhận định tổng quan.", badgeClass: "bg-[#F7F2F4] text-[#6B5E65]" };
}

function skillSeries(attempts: LearningAttempt[], skill: string) {
  return attempts.filter(item => item.skill === skill && item.accuracy != null).sort((left, right) => new Date(left.lastActivityAt).getTime() - new Date(right.lastActivityAt).getTime()).slice(-7).map(item => item.accuracy as number);
}

function skillTrend(series: number[]) {
  if (series.length < 2) return null;
  const split = Math.ceil(series.length / 2);
  const previous = series.slice(0, split);
  const recent = series.slice(split);
  if (!recent.length) return null;
  return average(recent) - average(previous);
}

function actionSuggestions(mistakes: Insights["recurringMistakes"], attempts: LearningAttempt[]) {
  const suggestions: string[] = [];
  const inProgress = attempts.filter(item => item.status === "IN_PROGRESS").length;
  if (inProgress) suggestions.push(`Nhắc hoàn thành ${inProgress} bài đang làm`);
  const accuracyBySkill = ["LISTENING", "READING", "WRITING", "SPEAKING"].map(skill => ({ skill, values: skillSeries(attempts, skill) })).filter(item => item.values.length).map(item => ({ skill: item.skill, accuracy: average(item.values) })).sort((left, right) => left.accuracy - right.accuracy);
  if (accuracyBySkill[0]) suggestions.push(`Giao thêm bài ${skillLabel[accuracyBySkill[0].skill]}`);
  const topMistake = [...mistakes].sort((left, right) => right.errorCount - left.errorCount)[0];
  if (topMistake) suggestions.push(`Ôn lại dạng ${topMistake.questionType}`);
  if (!suggestions.length) suggestions.push("Tiếp tục theo dõi sau các bài làm tiếp theo");
  return suggestions.slice(0, 3);
}

function hasSkillData(skills: Insights["skills"], skill: string) {
  return skills.some(item => item.skill === skill && item.accuracy != null);
}

function paginationItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (page >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", page, "ellipsis", totalPages];
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resultPercent(item: LearningAttempt) {
  if (item.score == null || !item.maxScore) return null;
  return item.score / item.maxScore * 100;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatInputDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Chưa có";
}

function percent(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function formatMinutes(value: number) {
  if (value < 60) return `${value.toLocaleString("vi-VN")} phút`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

function formatDuration(value: number) {
  const totalSeconds = Math.max(0, Math.round(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours} giờ ${minutes.toString().padStart(2, "0")} phút`;
  if (minutes) return `${minutes} phút ${seconds.toString().padStart(2, "0")} giây`;
  return `${seconds} giây`;
}

function score(value: number | null, max: number) {
  return value == null ? "Chưa chấm" : `${value.toLocaleString("vi-VN")} / ${max.toLocaleString("vi-VN")}`;
}
