import {
  ArrowsClockwise,
  CalendarBlank,
  CaretDown,
  CaretUp,
  CheckCircle,
  CheckSquare,
  FileXls,
  MagnifyingGlass,
  Receipt,
  SpinnerGap,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUpload } from "../../lib/api";

type RowStatus = "READY" | "WARNING" | "BLOCKED" | "IMPORTED";
type SortKey = "sequence" | "payer" | "amount" | "paidDate" | "source" | "status";
type SortDirection = "asc" | "desc";

interface ImportRow {
  rowKey: string;
  sheetName: string;
  rowNumber: number;
  sequenceNumber?: string;
  payerName: string;
  amount?: number;
  paidDate?: string;
  note?: string;
  status: RowStatus;
  messages: string[];
}

interface ImportPreview {
  fileName: string;
  fileHash: string;
  period: string;
  totalRows: number;
  readyRows: number;
  warningRows: number;
  blockedRows: number;
  alreadyImportedRows: number;
  totalAmount: number;
  warnings: string[];
  rows: ImportRow[];
}

interface ImportResult {
  createdCount: number;
  skippedCount: number;
  totalAmount: number;
}

interface LegacyTransactionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const money = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

function formatDate(value?: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function LegacyTransactionImportDialog({
  open,
  onClose,
  onImported,
}: LegacyTransactionImportDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [period, setPeriod] = useState(currentMonth);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Filter & search state for the accounting table
  const [statusFilter, setStatusFilter] = useState<RowStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("paidDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const readyRows = useMemo(
    () => preview?.rows.filter((row) => row.status === "READY") ?? [],
    [preview],
  );

  const importableRows = useMemo(
    () => preview?.rows.filter((row) => row.status === "READY" || row.status === "WARNING") ?? [],
    [preview],
  );

  const recentReadyRows = useMemo(
    () => [...readyRows].sort((left, right) => {
      const dateOrder = (right.paidDate ?? "").localeCompare(left.paidDate ?? "");
      return dateOrder || right.rowNumber - left.rowNumber;
    }),
    [readyRows],
  );

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    const rows = preview.rows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        row.payerName.toLowerCase().includes(q) ||
        (row.sequenceNumber && row.sequenceNumber.toLowerCase().includes(q)) ||
        (row.note && row.note.toLowerCase().includes(q)) ||
        (row.sheetName && row.sheetName.toLowerCase().includes(q)) ||
        row.messages.some((msg) => msg.toLowerCase().includes(q))
      );
    });

    const statusRank: Record<RowStatus, number> = {
      READY: 1,
      WARNING: 2,
      BLOCKED: 3,
      IMPORTED: 4,
    };
    const direction = sortDirection === "asc" ? 1 : -1;

    return [...rows].sort((left, right) => {
      let comparison = 0;
      if (sortKey === "sequence") {
        comparison = (left.sequenceNumber ?? `${left.rowNumber}`).localeCompare(
          right.sequenceNumber ?? `${right.rowNumber}`,
          "vi",
          { numeric: true, sensitivity: "base" },
        );
      } else if (sortKey === "payer") {
        comparison = left.payerName.localeCompare(right.payerName, "vi", { sensitivity: "base" });
      } else if (sortKey === "amount") {
        comparison = (left.amount ?? Number.NEGATIVE_INFINITY) - (right.amount ?? Number.NEGATIVE_INFINITY);
      } else if (sortKey === "paidDate") {
        comparison = (left.paidDate ?? "").localeCompare(right.paidDate ?? "");
      } else if (sortKey === "source") {
        comparison = left.sheetName.localeCompare(right.sheetName, "vi", { sensitivity: "base" });
      } else {
        comparison = statusRank[left.status] - statusRank[right.status];
      }

      return (comparison || left.rowNumber - right.rowNumber) * direction;
    });
  }, [preview, searchQuery, sortDirection, sortKey, statusFilter]);

  const selectedAmount = useMemo(
    () =>
      preview?.rows.reduce(
        (total, row) => (selected.has(row.rowKey) ? total + (row.amount ?? 0) : total),
        0,
      ) ?? 0,
    [preview, selected],
  );

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPeriod(currentMonth());
    setPreview(null);
    setSelected(new Set());
    setError(null);
    setResult(null);
    setStatusFilter("ALL");
    setSearchQuery("");
    setIsEditingSource(false);
    setShowAllWarnings(false);
    setBatchSize(10);
    setSortKey("paidDate");
    setSortDirection("desc");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading && !importing) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, loading, importing, onClose]);

  if (!open) return null;

  const buildForm = () => {
    if (!file) throw new Error("Hãy chọn file Excel");
    const form = new FormData();
    form.append("file", file);
    form.append("period", period);
    return form;
  };

  const handlePreview = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const response = await apiUpload<ImportPreview>(
        "/admin/billing/legacy-imports/preview",
        buildForm(),
      );
      setPreview(response);
      setSelected(
        new Set(
          response.rows
            .filter((row) => row.status === "READY")
            .map((row) => row.rowKey),
        ),
      );
      setIsEditingSource(false);
      setStatusFilter("ALL");
      setSearchQuery("");
      setSortKey("paidDate");
      setSortDirection("desc");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không đọc được file Excel",
      );
      setPreview(null);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      setError("Hãy chọn ít nhất một giao dịch hợp lệ");
      return;
    }
    if (
      !window.confirm(
        `Tạo ${selected.size} giao dịch lịch sử và hóa đơn nháp? Hệ thống chưa phát hành hóa đơn ở bước này.`,
      )
    ) {
      return;
    }

    setError(null);
    setImporting(true);
    try {
      const form = buildForm();
      selected.forEach((rowKey) => form.append("rowKeys", rowKey));
      const response = await apiUpload<ImportResult>(
        "/admin/billing/legacy-imports/import",
        form,
      );
      setResult(response);
      setSelected(new Set());
      onImported();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không tạo được hóa đơn nháp",
      );
    } finally {
      setImporting(false);
    }
  };

  const toggleAll = () => {
    // Toggle all importable rows in the current filtered view
    const targetRows = filteredRows.filter(
      (row) => row.status === "READY" || row.status === "WARNING",
    );
    const allSelected =
      targetRows.length > 0 && targetRows.every((row) => selected.has(row.rowKey));

    setSelected((current) => {
      const next = new Set(current);
      if (allSelected) {
        targetRows.forEach((row) => next.delete(row.rowKey));
      } else {
        targetRows.forEach((row) => next.add(row.rowKey));
      }
      return next;
    });
  };

  const toggleRow = (rowKey: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const selectRecentBatch = () => {
    setSelected(new Set(recentReadyRows.slice(0, batchSize).map((row) => row.rowKey)));
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const areAllFilteredSelected =
    filteredRows.filter((r) => r.status === "READY" || r.status === "WARNING").length > 0 &&
    filteredRows
      .filter((r) => r.status === "READY" || r.status === "WARNING")
      .every((row) => selected.has(row.rowKey));

  const areAllImportableSelected =
    importableRows.length > 0 && importableRows.every((row) => selected.has(row.rowKey));

  const toggleSelectAll = () => {
    setSelected(
      areAllImportableSelected
        ? new Set()
        : new Set(importableRows.map((row) => row.rowKey)),
    );
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === "asc" ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />;
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legacy-import-title"
        className="flex h-[92vh] max-h-[92vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl"
      >
        {/* ===================== TOP HEADER (FIXED) ===================== */}
        <header className="shrink-0 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <FileXls size={22} weight="duotone" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legacy-import-title" className="text-base font-bold text-on-surface sm:text-lg">
                  Nhập giao dịch cũ từ Excel
                </h2>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Kế toán đối soát
                </span>
              </div>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Đối chiếu sao kê thu học phí trước khi tạo giao dịch lịch sử và hóa đơn nháp (không tự động phát hành CQT).
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={loading || importing}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            aria-label="Đóng cửa sổ nhập giao dịch"
          >
            <X size={18} />
          </button>
        </header>

        {/* ===================== CONTROLS & KPIS (FIXED TOP STRIP) ===================== */}
        <div className="shrink-0 bg-surface">
          {/* 1. NGUỒN DỮ LIỆU BAR */}
          {!preview || isEditingSource ? (
            /* Spacious Input Mode (Before preview or when editing source) */
            <div className="border-b border-outline-variant/30 bg-surface-container-low/30 px-5 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    File Excel sao kê (.xlsx, .xls) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setPreview(null);
                      setResult(null);
                      setError(null);
                    }}
                    className="block w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-1.5 text-xs text-on-surface file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Kỳ đối soát <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <CalendarBlank
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      type="month"
                      value={period}
                      onChange={(event) => {
                        setPeriod(event.target.value);
                        setPreview(null);
                        setResult(null);
                      }}
                      className="block w-full rounded-xl border border-outline-variant/50 bg-surface pl-9 pr-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!file || !period || loading || importing}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs"
                  >
                    {loading ? <SpinnerGap className="animate-spin" size={16} /> : <FileXls size={16} />}
                    {loading ? "Đang đọc file..." : "Kiểm tra dữ liệu"}
                  </button>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSource(false)}
                      className="h-9 rounded-xl border border-outline-variant/50 px-3 text-xs font-semibold text-on-surface hover:bg-surface-container"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Compact Header Bar (After preview: Saves vertical space!) */
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-low/40 px-5 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Tệp nguồn:
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-2.5 py-1 font-semibold text-on-surface shadow-2xs">
                  <FileXls size={15} className="text-emerald-600" weight="fill" />
                  <span className="max-w-[320px] truncate" title={preview.fileName}>
                    {preview.fileName}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-2.5 py-1 font-semibold text-on-surface shadow-2xs">
                  <CalendarBlank size={14} className="text-primary" />
                  Kỳ đối soát: {preview.period}
                </span>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {preview.totalRows} giao dịch
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSource(true)}
                disabled={loading || importing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <ArrowsClockwise size={13} />
                Đổi file / kỳ khác
              </button>
            </div>
          )}

          {/* 2. ERROR / SUCCESS BANNERS */}
          {error && (
            <div
              className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
              role="alert"
            >
              <WarningCircle className="shrink-0 text-rose-600" size={17} weight="fill" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {result && (
            <div
              className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              role="status"
            >
              <CheckCircle className="shrink-0 text-emerald-600" size={17} weight="fill" />
              <span>
                <strong>Thành công!</strong> Đã tạo {result.createdCount} giao dịch và xếp hàng tạo hóa đơn nháp (Tổng tiền:{" "}
                <span className="font-mono font-bold tabular-nums">{money.format(result.totalAmount)} ₫</span>).
                {result.skippedCount > 0 ? ` Bỏ qua ${result.skippedCount} dòng.` : ""}
              </span>
            </div>
          )}

          {/* 3. BẢNG KIỂM SOÁT ĐỐI CHIẾU & KPI STRIP (Interactive Accounting Filter Bar) */}
          {preview && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface px-5 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Kiểm soát:
                </span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    statusFilter === "ALL"
                      ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold ring-1 ring-primary/30"
                      : "border-outline-variant/40 bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container"
                  }`}
                  title="Xem tất cả các dòng"
                >
                  <span>Tất cả</span>
                  <span className="rounded-full bg-slate-200/90 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {preview.totalRows}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("READY")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    statusFilter === "READY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs font-bold ring-1 ring-emerald-400"
                      : "border-emerald-200/70 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-50"
                  }`}
                  title="Xem các dòng sẵn sàng tạo nháp"
                >
                  <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                  <span>Sẵn sàng</span>
                  <span className="rounded-full bg-emerald-200/80 dark:bg-emerald-800/80 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 dark:text-emerald-100 font-mono">
                    {preview.readyRows}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("WARNING")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    statusFilter === "WARNING"
                      ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 shadow-2xs font-bold ring-1 ring-amber-400"
                      : "border-amber-200/70 bg-amber-50/50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-50"
                  }`}
                  title="Xem các dòng cần kế toán kiểm tra lại"
                >
                  <WarningCircle size={13} weight="fill" className="text-amber-500" />
                  <span>Cần kiểm tra</span>
                  <span className="rounded-full bg-amber-200/80 dark:bg-amber-800/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:text-amber-100 font-mono">
                    {preview.warningRows}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("BLOCKED")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    statusFilter === "BLOCKED"
                      ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs font-bold ring-1 ring-rose-400"
                      : "border-rose-200/70 bg-rose-50/50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-50"
                  }`}
                  title="Xem các dòng bị chặn không thể nhập"
                >
                  <X size={12} weight="bold" className="text-rose-600" />
                  <span>Bị chặn</span>
                  <span className="rounded-full bg-rose-200/80 dark:bg-rose-800/80 px-1.5 py-0.2 text-[10px] font-bold text-rose-900 dark:text-rose-100 font-mono">
                    {preview.blockedRows}
                  </span>
                </button>
                {preview.alreadyImportedRows > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("IMPORTED")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                      statusFilter === "IMPORTED"
                        ? "border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold ring-1 ring-slate-400"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>Đã nhập</span>
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {preview.alreadyImportedRows}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-on-surface-variant">Tổng tiền hợp lệ:</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-primary tabular-nums border border-primary/20">
                  {money.format(preview.totalAmount)} ₫
                </span>
              </div>
            </div>
          )}

          {/* 4. COMPACT RECONCILIATION WARNING (Single sleek row) */}
          {preview && preview.warnings.length > 0 && (
            <div
              className="flex items-center justify-between gap-3 border-b border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-900/60 px-5 py-1.5 text-xs text-amber-900 dark:text-amber-300"
              role="status"
            >
              <div className="flex items-center gap-2 min-w-0">
                <WarningCircle className="shrink-0 text-amber-600 dark:text-amber-400" size={15} weight="fill" />
                <span className="font-bold text-[11px] uppercase tracking-wider shrink-0 text-amber-950 dark:text-amber-200">
                  Cần đối chiếu:
                </span>
                <span className="truncate text-xs font-medium">
                  {preview.warnings.join(" · ")}
                </span>
              </div>
              {preview.warnings.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllWarnings(!showAllWarnings)}
                  className="shrink-0 text-[11px] font-semibold text-amber-800 dark:text-amber-300 underline hover:text-amber-950"
                >
                  {showAllWarnings ? "Thu gọn" : `Chi tiết (${preview.warnings.length})`}
                </button>
              )}
            </div>
          )}
          {showAllWarnings && preview && preview.warnings.length > 1 && (
            <div className="border-b border-amber-200 bg-amber-50/60 px-5 py-2 text-xs text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-200">
              <ul className="list-disc space-y-1 pl-5">
                {preview.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ===================== MAIN DATA TABLE (EXPANDS TO FILL HEIGHT) ===================== */}
        <div className="flex-1 min-h-0 flex flex-col bg-surface overflow-hidden">
          {!preview ? (
            /* Empty prompt before inspecting file */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-container text-primary/80 mb-3 shadow-inner">
                <FileXls size={36} weight="duotone" />
              </div>
              <h3 className="text-base font-bold text-on-surface">Chưa có dữ liệu sao kê</h3>
              <p className="mt-1 max-w-md text-xs text-on-surface-variant leading-relaxed">
                Vui lòng chọn file Excel sao kê ngân hàng và chọn đúng kỳ đối soát ở thanh công cụ phía trên, sau đó bấm{" "}
                <strong>“Kiểm tra dữ liệu”</strong> để hệ thống tiến hành đối chiếu.
              </p>
            </div>
          ) : (
            /* Accounting Grid View */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Table Sub-header toolbar */}
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-surface-container-low/30 border-b border-outline-variant/20">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <Receipt size={14} className="text-primary" />
                    Bảng kê chi tiết giao dịch
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    (Hiển thị <strong>{filteredRows.length}</strong> / {preview.rows.length} dòng)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={importableRows.length === 0 || importing || Boolean(result)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface px-3 text-xs font-bold text-on-surface transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    title={areAllImportableSelected ? "Bỏ chọn tất cả giao dịch có thể nhập" : "Chọn tất cả giao dịch có thể nhập"}
                  >
                    <CheckSquare size={15} weight={areAllImportableSelected ? "fill" : "regular"} />
                    {areAllImportableSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>

                  <div className="flex h-9 items-center overflow-hidden rounded-lg border border-outline-variant/60 bg-surface shadow-2xs">
                    <label htmlFor="legacy-import-batch-size" className="px-2.5 text-[11px] font-semibold text-on-surface-variant">
                      Lô gần nhất
                    </label>
                    <select
                      id="legacy-import-batch-size"
                      value={batchSize}
                      onChange={(event) => setBatchSize(Number(event.target.value))}
                      className="h-full min-w-14 border-l border-outline-variant/40 bg-transparent px-2 text-xs font-bold text-on-surface outline-none"
                      aria-label="Số hóa đơn trong một lô"
                    >
                      {[10, 20, 30, 50].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={selectRecentBatch}
                      disabled={recentReadyRows.length === 0 || importing || Boolean(result)}
                      className="h-full border-l border-outline-variant/40 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                      title={`Chọn tối đa ${batchSize} giao dịch sẵn sàng, mới nhất trước`}
                    >
                      Chọn {Math.min(batchSize, recentReadyRows.length)}
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <MagnifyingGlass
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên, STT, nội dung..."
                      className="h-7 w-48 sm:w-60 rounded-lg border border-outline-variant/50 bg-surface pl-8 pr-6 text-xs text-on-surface outline-none focus:border-primary transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="hidden sm:block text-[11px] text-on-surface-variant font-medium" aria-live="polite">
                    Đã chọn: <strong className="text-on-surface">{selected.size}</strong> dòng · Tổng chọn:{" "}
                    <strong className="font-mono font-bold text-primary tabular-nums">
                      {money.format(selectedAmount)} ₫
                    </strong>
                  </div>
                </div>
              </div>

              {/* Scrollable Table Container */}
              <div className="flex-1 min-h-0 overflow-auto bg-surface">
                <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs shadow-2xs">
                    <tr className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <th className="w-12 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={areAllFilteredSelected}
                          onChange={toggleAll}
                          disabled={importableRows.length === 0}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                          aria-label="Chọn tất cả giao dịch hợp lệ"
                        />
                      </th>
                      <th
                        aria-sort={sortKey === "sequence" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="w-16 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("sequence")}
                          className="inline-flex items-center gap-1 font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo STT"
                        >
                          STT {sortIcon("sequence")}
                        </button>
                      </th>
                      <th
                        aria-sort={sortKey === "payer" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("payer")}
                          className="inline-flex items-center gap-1 text-left font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo người nộp"
                        >
                          Người nộp / Nội dung chuyển khoản {sortIcon("payer")}
                        </button>
                      </th>
                      <th
                        aria-sort={sortKey === "amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="w-40 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-right"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("amount")}
                          className="ml-auto inline-flex items-center gap-1 font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo số tiền"
                        >
                          Số tiền (VNĐ) {sortIcon("amount")}
                        </button>
                      </th>
                      <th
                        aria-sort={sortKey === "paidDate" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="w-32 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("paidDate")}
                          className="inline-flex items-center gap-1 font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo ngày tiền vào"
                        >
                          Ngày tiền vào {sortIcon("paidDate")}
                        </button>
                      </th>
                      <th
                        aria-sort={sortKey === "source" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="w-36 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("source")}
                          className="inline-flex items-center gap-1 font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo nguồn Excel"
                        >
                          Nguồn Excel {sortIcon("source")}
                        </button>
                      </th>
                      <th
                        aria-sort={sortKey === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        className="w-64 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="inline-flex items-center gap-1 font-bold transition-colors hover:text-primary"
                          aria-label="Sắp xếp theo trạng thái kiểm tra"
                        >
                          Trạng thái kiểm tra {sortIcon("status")}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/60">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-on-surface-variant text-xs">
                          Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const importable = row.status === "READY" || row.status === "WARNING";
                        const isRowSelected = selected.has(row.rowKey);
                        const rowTone =
                          row.status === "BLOCKED"
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : row.status === "WARNING"
                              ? "bg-amber-50/40 dark:bg-amber-950/20"
                              : row.status === "IMPORTED"
                                ? "bg-slate-100/50 dark:bg-slate-800/40 text-on-surface-variant opacity-75"
                                : isRowSelected
                                  ? "bg-primary/[0.03] dark:bg-primary/[0.06]"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40";

                        return (
                          <tr
                            key={row.rowKey}
                            className={`align-top transition-colors ${rowTone} ${
                              isRowSelected ? "font-medium" : ""
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={() => toggleRow(row.rowKey)}
                                disabled={!importable}
                                className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 disabled:opacity-40"
                                aria-label={`Chọn giao dịch STT ${row.sequenceNumber || row.rowNumber}`}
                              />
                            </td>

                            {/* STT */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                              {row.sequenceNumber || (
                                <span className="text-on-surface-variant/60 font-normal">#{row.rowNumber}</span>
                              )}
                            </td>

                            {/* Người mua / Ghi chú */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-on-surface">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {row.payerName || "—"}
                              </div>
                              {row.note && (
                                <div className="mt-0.5 text-[11px] text-on-surface-variant leading-relaxed">
                                  {row.note}
                                </div>
                              )}
                            </td>

                            {/* Số tiền (Accounting Style) */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                              {row.amount == null ? (
                                "—"
                              ) : (
                                <span className={row.amount > 0 ? "text-slate-900 dark:text-slate-100" : ""}>
                                  {money.format(row.amount)} ₫
                                </span>
                              )}
                            </td>

                            {/* Ngày tiền vào */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              {formatDate(row.paidDate)}
                            </td>

                            {/* Nguồn dữ liệu Excel */}
                            <td className="border-r border-slate-200/60 dark:border-slate-700/50 px-3 py-2 text-on-surface-variant">
                              <div className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                {row.sheetName}
                              </div>
                              <div className="mt-0.5 text-[10px] text-on-surface-variant font-mono">
                                Dòng {row.rowNumber}
                              </div>
                            </td>

                            {/* Trạng thái kiểm tra */}
                            <td className="px-3 py-2">
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                                    row.status === "READY"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                      : row.status === "WARNING"
                                        ? "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                                        : row.status === "IMPORTED"
                                          ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                          : "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                                  }`}
                                >
                                  {row.status === "READY" ? (
                                    <>
                                      <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                                      Sẵn sàng
                                    </>
                                  ) : row.status === "WARNING" ? (
                                    <>
                                      <WarningCircle size={12} weight="fill" className="text-amber-500" />
                                      Cần kiểm tra
                                    </>
                                  ) : row.status === "IMPORTED" ? (
                                    <>
                                      <CheckCircle size={12} className="text-slate-500" />
                                      Đã nhập
                                    </>
                                  ) : (
                                    <>
                                      <X size={12} weight="bold" className="text-rose-600" />
                                      Bị chặn
                                    </>
                                  )}
                                </span>
                              </div>
                              {row.messages.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {row.messages.map((message) => (
                                    <div
                                      key={message}
                                      className={`text-[10px] leading-tight font-medium ${
                                        row.status === "BLOCKED"
                                          ? "text-rose-700 dark:text-rose-400"
                                          : "text-amber-800 dark:text-amber-400"
                                      }`}
                                    >
                                      • {message}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10 border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs font-semibold text-slate-800 dark:text-slate-100 shadow-[0_-2px_6px_rgba(0,0,0,0.06)]">
                    <tr>
                      <td colSpan={3} className="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-right font-bold text-xs uppercase tracking-wide">
                        Tổng cộng đã chọn ({selected.size} dòng):
                      </td>
                      <td className="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-right font-mono font-bold tabular-nums text-primary text-xs sm:text-sm">
                        {money.format(selectedAmount)} ₫
                      </td>
                      <td colSpan={3} className="px-3 py-2.5 text-[11px] font-normal text-on-surface-variant">
                        Chỉ các dòng được chọn ở trạng thái <em>Sẵn sàng</em> hoặc <em>Cần kiểm tra</em> mới được tạo hóa đơn nháp.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ===================== BOTTOM ACTION FOOTER (FIXED) ===================== */}
        <footer className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface-container-low/60 px-5 py-3">
          <div className="text-xs text-on-surface-variant">
            {preview ? (
              <div className="flex items-center gap-2">
                <span>
                  Đã chọn <strong className="text-on-surface font-bold">{selected.size}</strong> /{" "}
                  {preview.rows.length} dòng
                </span>
                <span className="text-outline">·</span>
                <span>
                  Tổng tiền chọn:{" "}
                  <strong className="font-mono font-bold text-primary tabular-nums">
                    {money.format(selectedAmount)} ₫
                  </strong>
                </span>
              </div>
            ) : (
              "Chọn file Excel và kỳ đối soát để bắt đầu kiểm tra."
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || importing}
              className="min-h-10 rounded-xl border border-outline-variant/50 px-4 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!preview || selected.size === 0 || loading || importing || Boolean(result)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-on-primary hover:opacity-90 transition-all disabled:opacity-50 shadow-2xs"
            >
              {importing && <SpinnerGap className="animate-spin" size={16} />}
              {selected.size > 0 ? `Tạo ${selected.size} hóa đơn nháp` : "Tạo hóa đơn nháp"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
