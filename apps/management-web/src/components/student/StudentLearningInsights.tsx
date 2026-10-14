import {
  ArrowClockwise,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  BookOpenText,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Clock,
  ClockCounterClockwise,
  DownloadSimple,
  Exam,
  Eye,
  Headphones,
  Info,
  ListChecks,
  MagnifyingGlass,
  MicrophoneStage,
  PenNib,
  Timer,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { StudentAttemptDetail, StudentLearningInsights as Insights } from "../../academic-types";
import { apiFetch } from "../../lib/api";

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

      {selectedAttempt && <AttemptReviewScreen studentId={studentId} item={selectedAttempt} onClose={() => setSelectedAttempt(null)} />}
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

function AttemptReviewScreen({ studentId, item, onClose }: { studentId: string; item: LearningAttempt; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("ALL");
  const [selectedQuestionKey, setSelectedQuestionKey] = useState("");
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const questions = detail?.questions ?? [];
  const filteredQuestions = questions.filter(question => matchesQuestionFilter(question, filter));
  const selectedQuestion = filteredQuestions.find(question => question.questionKey === selectedQuestionKey) ?? filteredQuestions[0] ?? null;
  const selectedIndex = selectedQuestion ? filteredQuestions.findIndex(question => question.questionKey === selectedQuestion.questionKey) : -1;
  const answeredCount = detail ? detail.correctCount + detail.incorrectCount : 0;
  const accuracy = answeredCount ? Math.round(detail!.correctCount / answeredCount * 100) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2B2228]/45 p-0 backdrop-blur-[2px] sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="attempt-review-title" className="mx-auto flex h-[100dvh] w-full max-w-[1480px] flex-col overflow-hidden bg-[#FDFBFC] shadow-2xl sm:h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border sm:border-[#E6DDE1]">
        <header className="shrink-0 border-b border-[#E6DDE1] bg-white px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B3F56]">Chi tiết lượt làm</span>
                <AttemptStatus value={detail?.status ?? item.status} />
                <span className="rounded-full bg-[#F3E6EB] px-2.5 py-1 text-xs font-semibold text-[#8B3F56]">{skillLabel[detail?.skill ?? item.skill] ?? detail?.skill ?? item.skill}</span>
                <span className="text-xs text-[#6B5E65]">Lần {detail?.attemptNo ?? item.attemptNo}</span>
              </div>
              <h2 id="attempt-review-title" className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] sm:text-xl">{detail?.title ?? item.title}</h2>
              <p className="mt-0.5 text-xs text-[#6B5E65]">Đáp án, kết quả và thời lượng lấy trực tiếp từ lượt làm đã lưu.</p>
            </div>
            <button type="button" onClick={onClose} autoFocus aria-label="Đóng chi tiết lượt làm" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E6DDE1] text-[#6B5E65] transition hover:border-[#8B3F56] hover:bg-[#F3E6EB] hover:text-[#8B3F56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3F56]">
              <X size={20} />
            </button>
          </div>
        </header>

        {loading ? <AttemptReviewLoading /> : error ? (
          <div className="grid flex-1 place-items-center p-6">
            <div className="max-w-md text-center">
              <WarningCircle className="mx-auto text-[#C0392B]" size={34} weight="duotone" />
              <h3 className="mt-3 text-base font-semibold">Không tải được chi tiết lượt làm</h3>
              <p className="mt-1 text-sm leading-6 text-[#6B5E65]">{error}</p>
              <button type="button" onClick={() => setReloadKey(value => value + 1)} className="mt-4 rounded-xl bg-[#8B3F56] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6E2F43]">Thử lại</button>
            </div>
          </div>
        ) : detail ? (
          <>
            <AttemptReviewSummary detail={detail} accuracy={accuracy} />
            <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="flex min-h-0 min-w-0 flex-col border-b border-[#E6DDE1] bg-white lg:border-b-0 lg:border-r">
                <div className="border-b border-[#E6DDE1] p-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={17} className="text-[#8B3F56]" />Danh sách câu hỏi</h3>
                  <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-[#F7F2F4] p-1" aria-label="Lọc câu hỏi">
                    {questionFilterOptions(detail).map(option => (
                      <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${filter === option.value ? "bg-white text-[#8B3F56] shadow-sm" : "text-[#6B5E65] hover:text-[#2B2228]"}`}>{option.label} ({option.count})</button>
                    ))}
                  </div>
                </div>
                <div className="flex max-h-52 gap-2 overflow-x-auto p-3 lg:max-h-none lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
                  {filteredQuestions.map(question => (
                    <QuestionNavigationItem key={question.questionKey} question={question} active={question.questionKey === selectedQuestion?.questionKey} onSelect={() => setSelectedQuestionKey(question.questionKey)} />
                  ))}
                  {!filteredQuestions.length && <p className="m-auto min-w-56 p-4 text-center text-xs leading-5 text-[#6B5E65]">Không có câu hỏi nào thuộc trạng thái này.</p>}
                </div>
              </aside>

              <main className="min-h-0 min-w-0 overflow-y-auto p-4 sm:p-5 lg:p-6">
                {selectedQuestion ? (
                  <QuestionReview detail={detail} question={selectedQuestion} index={selectedIndex} total={filteredQuestions.length} onPrevious={() => setSelectedQuestionKey(filteredQuestions[selectedIndex - 1]?.questionKey ?? selectedQuestion.questionKey)} onNext={() => setSelectedQuestionKey(filteredQuestions[selectedIndex + 1]?.questionKey ?? selectedQuestion.questionKey)} />
                ) : (
                  <div className="grid h-full min-h-64 place-items-center rounded-xl border border-dashed border-[#E6DDE1] bg-white p-6 text-center text-sm text-[#6B5E65]">Lượt làm này chưa có dữ liệu câu trả lời để hiển thị.</div>
                )}
              </main>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function AttemptReviewSummary({ detail, accuracy }: { detail: StudentAttemptDetail; accuracy: number | null }) {
  const metrics = [
    { label: "Kết quả", value: detail.score == null ? "Chưa chấm" : score(detail.score, detail.maxScore), className: "text-[#2B2228]", tone: "bg-[#F3E6EB]/55 before:bg-[#8B3F56]" },
    { label: "Độ chính xác", value: percent(accuracy), className: "text-[#8B3F56]", tone: "bg-[#F3E6EB]/35 before:bg-[#8B3F56]" },
    { label: "Câu đúng", value: String(detail.correctCount), className: "text-[#3E8E6B]", tone: "bg-[#3E8E6B]/[0.045] before:bg-[#3E8E6B]" },
    { label: "Câu sai", value: String(detail.incorrectCount), className: "text-[#C0392B]", tone: "bg-[#C0392B]/[0.04] before:bg-[#C0392B]" },
    { label: "Chưa trả lời", value: String(detail.unansweredCount), className: "text-[#6B5E65]", tone: "bg-[#F7F2F4] before:bg-[#6B5E65]" },
  ];
  return (
    <section className="shrink-0 border-b border-[#E6DDE1] bg-[#F7F2F4] px-4 py-3 sm:px-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#E6DDE1] bg-white sm:grid-cols-5">
          {metrics.map((metric, index) => <div key={metric.label} className={`relative px-3 py-2.5 before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${metric.tone} ${index ? "border-l border-[#E6DDE1]" : ""} ${index >= 2 ? "border-t border-[#E6DDE1] sm:border-t-0" : ""}`}><span className="block text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6B5E65]">{metric.label}</span><strong className={`mt-0.5 block text-lg font-semibold tabular-nums ${metric.className}`}>{metric.value}</strong></div>)}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B5E65]">
          <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-[#8B3F56]" />Thời lượng: <strong className="text-[#2B2228]">{formatDuration(detail.durationSeconds)}</strong></span>
          {detail.allowedDurationSeconds > 0 && <span>Giới hạn: <strong className="text-[#2B2228]">{formatDuration(detail.allowedDurationSeconds)}</strong></span>}
          <span>Hoạt động cuối: <strong className="text-[#2B2228]">{formatDateTime(detail.lastActivityAt)}</strong></span>
        </div>
      </div>
    </section>
  );
}

function QuestionNavigationItem({ question, active, onSelect }: { question: StudentAttemptDetail["questions"][number]; active: boolean; onSelect: () => void }) {
  const state = questionState(question);
  return (
    <button type="button" onClick={onSelect} className={`min-w-56 rounded-xl border p-3 text-left transition lg:min-w-0 ${active ? "border-[#8B3F56] bg-[#F3E6EB] shadow-[inset_3px_0_0_#8B3F56]" : "border-[#E6DDE1] bg-white hover:bg-[#F7F2F4]"}`}>
      <div className="flex items-center justify-between gap-2"><strong className="text-sm">{question.questionNo > 0 ? `Câu ${question.questionNo}` : "Bài viết"}</strong><QuestionStateBadge state={state} compact /></div>
      <p className="mt-1 truncate text-[11px] text-[#6B5E65]">{readableQuestionType(question.questionType)}</p>
    </button>
  );
}

function QuestionReview({ detail, question, index, total, onPrevious, onNext }: { detail: StudentAttemptDetail; question: StudentAttemptDetail["questions"][number]; index: number; total: number; onPrevious: () => void; onNext: () => void }) {
  const state = questionState(question);
  const isWriting = detail.skill === "WRITING" || question.questionType === "WRITING_TASK";
  const [showPrompt, setShowPrompt] = useState(false);
  const resultTone = state === "correct" ? "border-t-[#3E8E6B]" : state === "incorrect" ? "border-t-[#C0392B]" : state === "answered" ? "border-t-[#3A6EA5]" : "border-t-[#8B3F56]";

  useEffect(() => setShowPrompt(false), [question.questionKey]);

  return (
    <article className="mx-auto w-full min-w-0 max-w-5xl">
      <header className="flex flex-col gap-3 border-b border-[#E6DDE1] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5E65]">
            {question.sectionTitle && <span>{question.sectionTitle}</span>}
            {question.sectionTitle && question.groupTitle && <span aria-hidden="true">•</span>}
            {question.groupTitle && <span>{question.groupTitle}</span>}
          </div>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em]">{question.questionNo > 0 ? `Câu ${question.questionNo}` : isWriting ? "Nội dung bài viết" : "Câu trả lời"}</h3>
          <p className="mt-1 text-xs font-medium text-[#8B3F56]">{readableQuestionType(question.questionType)}</p>
        </div>
      </header>

      <section className={`mt-4 rounded-2xl border border-[#E6DDE1] border-t-[3px] bg-white p-4 shadow-[0_8px_24px_rgba(43,34,40,0.05)] ${resultTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DDE1] pb-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2B2228]"><ListChecks size={18} className="text-[#8B3F56]" />Kết quả câu hỏi</h4>
            <p className="mt-0.5 text-xs text-[#6B5E65]">Đối chiếu câu trả lời đã lưu với đáp án của đề.</p>
          </div>
          <div className="flex items-center gap-3"><QuestionStateBadge state={state} /><span className="rounded-lg bg-[#F7F2F4] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#2B2228]">{formatQuestionScore(question.score, question.maxScore)}</span></div>
        </div>

        {isWriting ? (
          <AnswerPanel title="Bài viết đã nộp" values={question.studentAnswers} state="neutral" empty="Học viên chưa nhập nội dung bài viết." multiline />
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <AnswerPanel title="Câu trả lời của học viên" values={question.studentAnswers} state={state === "correct" ? "success" : state === "incorrect" ? "error" : "neutral"} empty="Chưa trả lời" />
            <AnswerPanel title="Đáp án đúng" values={question.correctAnswers} state="success" empty="Chưa có đáp án được lưu" />
          </div>
        )}
      </section>

      {question.prompt && (
        <section className="mt-4 overflow-hidden rounded-xl border border-[#E6DDE1] bg-white">
          <button type="button" aria-expanded={showPrompt} onClick={() => setShowPrompt(value => !value)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#F7F2F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8B3F56]">
            <span className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F3E6EB] text-[#8B3F56]"><BookOpenText size={17} weight="duotone" /></span><span><strong className="block text-sm font-semibold text-[#2B2228]">Đề bài</strong><span className="block text-xs text-[#6B5E65]">{showPrompt ? "Thu gọn để tập trung vào kết quả" : "Đang ẩn để ưu tiên phần kết quả"}</span></span></span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E6DDE1] bg-[#FDFBFC] px-2.5 py-1.5 text-xs font-semibold text-[#8B3F56]">{showPrompt ? "Ẩn đề bài" : "Hiện đề bài"}<CaretRight size={14} className={`transition-transform ${showPrompt ? "rotate-90" : ""}`} /></span>
          </button>
          {showPrompt && <div className="border-t border-[#E6DDE1] bg-[#FDFBFC] px-4 py-3"><p className="whitespace-pre-wrap text-sm leading-6 text-[#2B2228]">{plainText(question.prompt)}</p></div>}
        </section>
      )}

      <section className="mt-4 rounded-xl border border-[#C9973F]/35 bg-[#C9973F]/[0.055] p-4 shadow-[inset_3px_0_0_#C9973F]">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#8B3F56]"><Info size={17} weight="fill" /></span><div><h4 className="text-sm font-semibold">Giải thích đáp án</h4><p className="text-xs text-[#6B5E65]">Nội dung lời giải đã được lưu cùng phiên bản đề.</p></div></div>
        <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${question.explanation ? "text-[#2B2228]" : "text-[#6B5E65]"}`}>{question.explanation ? plainText(question.explanation) : "Câu này chưa có lời giải chi tiết."}</p>
      </section>

      <footer className="mt-5 flex items-center justify-between border-t border-[#E6DDE1] pt-4">
        <button type="button" onClick={onPrevious} disabled={index <= 0} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DDE1] bg-white px-3 py-2 text-xs font-semibold transition hover:border-[#8B3F56] hover:text-[#8B3F56] disabled:cursor-not-allowed disabled:opacity-35"><CaretLeft size={15} />Câu trước</button>
        <span className="text-xs tabular-nums text-[#6B5E65]">{index + 1} / {total}</span>
        <button type="button" onClick={onNext} disabled={index < 0 || index >= total - 1} className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B3F56] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6E2F43] disabled:cursor-not-allowed disabled:opacity-35">Câu sau<CaretRight size={15} /></button>
      </footer>
    </article>
  );
}

function AnswerPanel({ title, values, state, empty, multiline = false }: { title: string; values: string[]; state: "success" | "error" | "neutral"; empty: string; multiline?: boolean }) {
  const tones = state === "success" ? "border-[#3E8E6B]/35 bg-[#3E8E6B]/[0.07] shadow-[inset_3px_0_0_#3E8E6B]" : state === "error" ? "border-[#C0392B]/35 bg-[#C0392B]/[0.065] shadow-[inset_3px_0_0_#C0392B]" : "border-[#E6DDE1] bg-[#FDFBFC] shadow-[inset_3px_0_0_#8B3F56]";
  const icon = state === "success" ? <CheckCircle size={16} weight="fill" className="text-[#3E8E6B]" /> : state === "error" ? <XCircle size={16} weight="fill" className="text-[#C0392B]" /> : <ClockCounterClockwise size={16} className="text-[#8B3F56]" />;
  return <section className={`${multiline ? "mt-3" : ""} rounded-xl border p-4 ${tones}`}><h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#2B2228]">{icon}{title}</h4>{values.length ? <div className={`mt-2 ${multiline ? "whitespace-pre-wrap text-sm leading-7" : "flex flex-wrap gap-2"}`}>{multiline ? values.join("\n") : values.map((value, index) => <span key={`${value}-${index}`} className="rounded-lg border border-current/15 bg-white px-2.5 py-1.5 text-sm font-semibold shadow-sm">{value}</span>)}</div> : <p className="mt-2 text-sm italic text-[#6B5E65]">{empty}</p>}</section>;
}

function QuestionStateBadge({ state, compact = false }: { state: ReturnType<typeof questionState>; compact?: boolean }) {
  const sizeClass = compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  if (state === "correct") return <span className={`inline-flex items-center gap-1 rounded-full bg-[#3E8E6B]/10 font-semibold text-[#3E8E6B] ${sizeClass}`}><CheckCircle size={compact ? 11 : 14} weight="fill" />Đúng</span>;
  if (state === "incorrect") return <span className={`inline-flex items-center gap-1 rounded-full bg-[#C0392B]/10 font-semibold text-[#C0392B] ${sizeClass}`}><XCircle size={compact ? 11 : 14} weight="fill" />Sai</span>;
  if (state === "answered") return <span className={`inline-flex items-center gap-1 rounded-full bg-[#3A6EA5]/10 font-semibold text-[#3A6EA5] ${sizeClass}`}><ClockCounterClockwise size={compact ? 11 : 14} />Chưa chấm</span>;
  return <span className={`inline-flex items-center gap-1 rounded-full bg-[#F7F2F4] font-semibold text-[#6B5E65] ${sizeClass}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />Bỏ qua</span>;
}

function AttemptReviewLoading() {
  return <div className="flex flex-1 flex-col"><div className="grid grid-cols-2 gap-px border-b border-[#E6DDE1] bg-[#E6DDE1] sm:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse bg-[#F7F2F4]" />)}</div><div className="grid min-h-0 flex-1 lg:grid-cols-[300px_1fr]"><div className="hidden space-y-2 border-r border-[#E6DDE1] bg-white p-3 lg:block">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-[#F7F2F4]" />)}</div><div className="grid place-items-center"><span className="inline-flex items-center gap-2 text-sm font-medium text-[#6B5E65]"><CircleNotch className="animate-spin text-[#8B3F56]" size={20} />Đang tải chi tiết lượt làm…</span></div></div></div>;
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

function questionFilterOptions(detail: StudentAttemptDetail): Array<{ value: QuestionFilter; label: string; count: number }> {
  return [
    { value: "ALL", label: "Tất cả", count: detail.questions.length },
    { value: "CORRECT", label: "Đúng", count: detail.correctCount },
    { value: "INCORRECT", label: "Sai", count: detail.incorrectCount },
    { value: "UNANSWERED", label: "Bỏ qua", count: detail.unansweredCount },
  ];
}

function readableQuestionType(value: string) {
  return value.replaceAll("_", " ").toLocaleLowerCase("vi").replace(/(^|\s)\S/g, character => character.toLocaleUpperCase("vi"));
}

function plainText(value: string) {
  return new DOMParser().parseFromString(value, "text/html").body.textContent ?? value;
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
