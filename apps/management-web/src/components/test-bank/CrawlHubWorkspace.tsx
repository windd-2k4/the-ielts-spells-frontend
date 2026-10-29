import {
  ArrowClockwise,
  CheckCircle,
  Clock,
  Database,
  Eye,
  Funnel,
  Lightning,
  MagnifyingGlass,
  Plus,
  Sparkle,
  SpinnerGap,
  Trash,
  WarningCircle,
  X,
  Robot,
  FileText,
  Rocket,
  SpeakerHigh,
  BookOpen,
  ArrowSquareOut,
  CheckSquare,
  Square,
  Code,
  ListChecks,
  Check,
  ListBullets,
  SquaresFour
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import AiImportStructurePreview from "./AiImportStructurePreview";

export interface CrawlSource {
  id: string;
  name: string;
  sourceUrl: string;
  crawlerType: string;
  targetSkill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  config?: Record<string, unknown>;
  scheduleCron?: string;
  isActive: boolean;
  lastCrawledAt?: string;
  lastStatus?: "idle" | "running" | "success" | "failed";
  totalCrawled: number;
  createdAt: string;
  updatedAt: string;
}

export interface RawCrawledTest {
  id: string;
  sourceId?: string;
  sourceName?: string;
  sourceTestId?: string;
  title: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  sourceUrl?: string;
  status: "pending" | "parsed" | "imported" | "rejected";
  importedTestId?: string;
  errorMessage?: string;
  crawledAt: string;
  importedAt?: string;
  rawPayload?: {
    extracted_text?: string;
    html?: string;
    crawled_at?: string;
    crawler_type?: string;
    raw?: any;
  };
  parsedStructure?: {
    title?: string;
    skill?: string;
    testType?: string;
    durationMinutes?: number;
    questionCount?: number;
    builderContent?: any;
    summary?: {
      passageCount?: number;
      questionGroupCount?: number;
      totalQuestions?: number;
    };
  };
}

export interface StagingStats {
  total: number;
  reading: number;
  listening: number;
  parsed: number;
  imported: number;
  pending: number;
}

export function CrawlHubWorkspace() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"staging" | "sources">("staging");

  // View mode: list vs grid (persisted in localStorage)
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("crawl_hub_view_mode") as "list" | "grid") || "list";
  });

  const handleSetViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("crawl_hub_view_mode", mode);
  };

  // Crawl Sources State
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Partial<CrawlSource> | null>(null);
  const [triggeringSourceId, setTriggeringSourceId] = useState<string | null>(null);

  // Raw Tests Staging State
  const [rawTests, setRawTests] = useState<RawCrawledTest[]>([]);
  const [isRawLoading, setIsRawLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Database-wide accurate stats
  const [stats, setStats] = useState<StagingStats>({
    total: 0,
    reading: 0,
    listening: 0,
    parsed: 0,
    imported: 0,
    pending: 0,
  });

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchOperating, setIsBatchOperating] = useState(false);

  // Individual Row Actions Loading State
  const [importingId, setImportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Detail / Action Modal State
  const [selectedRawTest, setSelectedRawTest] = useState<RawCrawledTest | null>(null);
  const [modalTab, setModalTab] = useState<"preview" | "json" | "raw">("preview");
  const [isParsing, setIsParsing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("OFFLINE_REGEX");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Sources
  const fetchSources = async () => {
    setIsSourcesLoading(true);
    try {
      const data = await apiFetch<CrawlSource[]>("/admin/crawl-hub/sources");
      setSources(data || []);
    } catch (err: any) {
      console.error("Lỗi tải danh sách nguồn crawl:", err);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  // Fetch Accurate Database-Wide Stats
  const fetchStats = async () => {
    try {
      const res = await apiFetch<StagingStats>("/admin/crawl-hub/raw-tests/stats");
      if (res) {
        setStats(res);
      }
    } catch (err: any) {
      console.error("Lỗi tải thống kê kho đề:", err);
    }
  };

  // Fetch Raw Tests
  const fetchRawTests = async () => {
    setIsRawLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (selectedSkill !== "ALL") params.append("skill", selectedSkill);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      params.append("page", String(page));
      params.append("size", String(pageSize));

      const res = await apiFetch<{ content: RawCrawledTest[]; totalPages: number; totalElements: number }>(
        `/admin/crawl-hub/raw-tests?${params.toString()}`
      );
      setRawTests(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalElements || 0);
    } catch (err: any) {
      console.error("Lỗi tải danh sách đề thô:", err);
    } finally {
      setIsRawLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sources") {
      fetchSources();
    } else {
      fetchRawTests();
      fetchStats();
    }
  }, [activeTab, page, pageSize, selectedSkill, selectedStatus]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchRawTests();
  };

  // Trigger Crawl
  const handleTriggerCrawl = async (sourceId: string) => {
    setTriggeringSourceId(sourceId);
    try {
      await apiFetch(`/admin/crawl-hub/sources/${sourceId}/trigger`, { method: "POST" });
      setFeedback({ type: "success", text: "Đã kích hoạt crawl thành công! Đề mới đã được lưu vào kho Staging." });
      fetchSources();
      if (activeTab === "staging") {
        fetchRawTests();
        fetchStats();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: "Không thể kích hoạt crawl: " + err.message });
    } finally {
      setTriggeringSourceId(null);
    }
  };

  // Save Source (Create/Update)
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource?.name || !editingSource?.sourceUrl) return;

    try {
      const isEdit = Boolean(editingSource.id);
      const url = isEdit ? `/admin/crawl-hub/sources/${editingSource.id}` : "/admin/crawl-hub/sources";
      const method = isEdit ? "PUT" : "POST";

      await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: editingSource.name,
          sourceUrl: editingSource.sourceUrl,
          crawlerType: editingSource.crawlerType || "api",
          targetSkill: editingSource.targetSkill || "READING",
          scheduleCron: editingSource.scheduleCron || "0 0 * * *",
          isActive: editingSource.isActive ?? true,
        }),
      });

      setSourceModalOpen(false);
      setEditingSource(null);
      setFeedback({ type: "success", text: isEdit ? "Cập nhật nguồn crawl thành công!" : "Tạo nguồn crawl mới thành công!" });
      fetchSources();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi lưu nguồn crawl: " + err.message });
    }
  };

  // 1-Click Import to Test Bank (Single Test)
  const handleImportSingle = async (testId: string) => {
    setImportingId(testId);
    setFeedback(null);
    try {
      const updated = await apiFetch<RawCrawledTest>(`/admin/crawl-hub/raw-tests/${testId}/import`, {
        method: "POST",
      });
      setFeedback({ type: "success", text: `🚀 Đã chuyển đề "${updated.title}" thành Bản Nháp trong Test Bank!` });
      setRawTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
      if (selectedRawTest?.id === testId) {
        setSelectedRawTest(updated);
      }
      fetchStats();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi chuyển đề vào Test Bank: " + err.message });
    } finally {
      setImportingId(null);
    }
  };

  // Batch Import Selected Tests
  const handleBatchImport = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Bạn có chắc muốn chuyển ${count} đề đã chọn thành bản nháp trong Test Bank không?`)) {
      return;
    }

    setIsBatchOperating(true);
    setFeedback(null);
    let successCount = 0;
    let failCount = 0;

    for (const testId of Array.from(selectedIds)) {
      try {
        await apiFetch(`/admin/crawl-hub/raw-tests/${testId}/import`, { method: "POST" });
        successCount++;
      } catch (err) {
        console.error(`Lỗi import đề ${testId}:`, err);
        failCount++;
      }
    }

    setIsBatchOperating(false);
    setSelectedIds(new Set());
    setFeedback({
      type: successCount > 0 ? "success" : "error",
      text: `🚀 Hoàn tất chuyển đổi: ${successCount} thành công, ${failCount} thất bại. Các bài đã chuyển sẽ xuất hiện trong Test Bank!`,
    });
    fetchRawTests();
    fetchStats();
  };

  // Delete Single Raw Test
  const handleDeleteSingle = async (testId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đề "${title}" khỏi kho Staging không?`)) {
      return;
    }
    setDeletingId(testId);
    try {
      await apiFetch(`/admin/crawl-hub/raw-tests/${testId}`, { method: "DELETE" });
      setFeedback({ type: "success", text: `Đã xóa đề "${title}" khỏi Staging.` });
      setRawTests((prev) => prev.filter((t) => t.id !== testId));
      if (selectedRawTest?.id === testId) setSelectedRawTest(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
      fetchStats();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi khi xóa đề: " + err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Batch Delete Selected Tests
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Bạn có chắc muốn xóa ${count} đề đã chọn khỏi kho Staging không? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    setIsBatchOperating(true);
    let successCount = 0;
    for (const testId of Array.from(selectedIds)) {
      try {
        await apiFetch(`/admin/crawl-hub/raw-tests/${testId}`, { method: "DELETE" });
        successCount++;
      } catch (err) {
        console.error(`Lỗi xóa đề ${testId}:`, err);
      }
    }

    setIsBatchOperating(false);
    setSelectedIds(new Set());
    setFeedback({ type: "success", text: `Đã xóa thành công ${successCount}/${count} đề khỏi kho Staging.` });
    fetchRawTests();
    fetchStats();
  };

  // Handle Parse AI for selected test
  const handleParseTest = async () => {
    if (!selectedRawTest) return;
    setIsParsing(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (selectedProvider) params.append("provider", selectedProvider);

      const updated = await apiFetch<RawCrawledTest>(`/admin/crawl-hub/raw-tests/${selectedRawTest.id}/parse?${params.toString()}`, {
        method: "POST",
      });

      setSelectedRawTest(updated);
      setFeedback({ type: "success", text: "Đã phân tách cấu trúc đề thi bằng AI thành công!" });
      fetchRawTests();
      fetchStats();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi phân tách AI: " + err.message });
    } finally {
      setIsParsing(false);
    }
  };

  // Selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === rawTests.length && rawTests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rawTests.map((t) => t.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="test-bank-container pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wide uppercase mb-1">
            <Robot size={18} /> Giai đoạn 2 • Automated Crawl Hub Staging
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kho Đề Thu Thập & Quản Lý Nguồn Crawl</h1>
          <p className="text-slate-500 text-sm mt-0.5 max-w-2xl">
            Đề thi sau khi crawl sẽ lưu an toàn trong kho Staging này để kiểm tra và chuẩn hóa. Chỉ chuyển thành Bản Nháp trong Test Bank khi bạn nhấn xác nhận.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/test-bank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition shadow-2xs"
          >
            <FileText size={16} /> Về Kho Đề Chính
          </Link>
          <button
            onClick={() => {
              setEditingSource({ name: "", sourceUrl: "", crawlerType: "api", targetSkill: "READING", isActive: true });
              setSourceModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition shadow-xs"
          >
            <Plus size={16} /> Thêm Nguồn Crawl
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl mb-5 flex items-center justify-between border text-xs font-medium transition ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle size={18} className="text-emerald-600" /> : <WarningCircle size={18} className="text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75 transition">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("staging")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition -mb-px ${
            activeTab === "staging" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database size={18} /> Kho Đề Staging ({stats.total || totalCount})
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition -mb-px ${
            activeTab === "sources" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Robot size={18} /> Nguồn Crawl Tự Động ({sources.length})
        </button>
      </div>

      {/* TAB 1: KHO ĐỀ STAGING */}
      {activeTab === "staging" && (
        <div className="space-y-4">
          {/* Accurate Database-Wide Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Card 1: Tất cả đề */}
            <div
              onClick={() => { setSelectedSkill("ALL"); setSelectedStatus("ALL"); setPage(0); }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs ${
                selectedSkill === "ALL" && selectedStatus === "ALL"
                  ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white hover:border-indigo-300"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database size={15} className="text-slate-600" /> Tất Cả Đề Staging
              </div>
              <div className="mt-1.5 text-2xl font-bold text-slate-900">{stats.total || totalCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tổng số đề thu thập</div>
            </div>

            {/* Card 2: Reading */}
            <div
              onClick={() => { setSelectedSkill("READING"); setSelectedStatus("ALL"); setPage(0); }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs ${
                selectedSkill === "READING"
                  ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              }`}
            >
              <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={15} /> Đề Reading
              </div>
              <div className="mt-1.5 text-2xl font-bold text-indigo-900">{stats.reading}</div>
              <div className="text-[11px] text-indigo-500 mt-0.5">Bài đọc & câu hỏi</div>
            </div>

            {/* Card 3: Listening */}
            <div
              onClick={() => { setSelectedSkill("LISTENING"); setSelectedStatus("ALL"); setPage(0); }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs ${
                selectedSkill === "LISTENING"
                  ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <SpeakerHigh size={15} /> Đề Listening
              </div>
              <div className="mt-1.5 text-2xl font-bold text-emerald-900">{stats.listening}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Kèm Audio & Bản đồ</div>
            </div>

            {/* Card 4: Sẵn Sàng (Parsed) */}
            <div
              onClick={() => { setSelectedStatus("parsed"); setPage(0); }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs ${
                selectedStatus === "parsed"
                  ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-200"
                  : "border-slate-200 bg-white hover:border-sky-200"
              }`}
            >
              <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkle size={15} /> Sẵn Sàng (Parsed)
              </div>
              <div className="mt-1.5 text-2xl font-bold text-sky-900">{stats.parsed}</div>
              <div className="text-[11px] text-sky-600 mt-0.5">Đã phân tách chuẩn</div>
            </div>

            {/* Card 5: Đã Vào Test Bank */}
            <div
              onClick={() => { setSelectedStatus("imported"); setPage(0); }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs ${
                selectedStatus === "imported"
                  ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Check size={15} weight="bold" /> Đã Vào Test Bank
              </div>
              <div className="mt-1.5 text-2xl font-bold text-emerald-900">{stats.imported}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Đã chuyển bản nháp</div>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề hoặc nguồn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
                Lọc
              </button>
            </form>

            {/* Filter Pills, Mode Switcher, and Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Skill Pill Selector */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => { setSelectedSkill("ALL"); setPage(0); }}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${selectedSkill === "ALL" ? "bg-white text-indigo-600 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedSkill("READING"); setPage(0); }}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${selectedSkill === "READING" ? "bg-white text-indigo-600 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <BookOpen size={13} /> Reading
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedSkill("LISTENING"); setPage(0); }}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${selectedSkill === "LISTENING" ? "bg-white text-emerald-600 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <SpeakerHigh size={13} /> Listening
                </button>
              </div>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="parsed">⚡ Đã Phân Tách (Parsed)</option>
                <option value="imported">🚀 Đã Vào Test Bank (Imported)</option>
                <option value="pending">⏳ Chờ Xử Lý (Pending)</option>
              </select>

              {/* View Mode Toggle: List vs Grid */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetViewMode("list")}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === "list" ? "bg-white text-indigo-600 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Chế độ danh sách bảng"
                >
                  <ListBullets size={15} /> Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode("grid")}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === "grid" ? "bg-white text-indigo-600 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Chế độ lưới Card"
                >
                  <SquaresFour size={15} /> Lưới (Grid)
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => { fetchRawTests(); fetchStats(); }}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
                title="Làm mới danh sách"
              >
                <ArrowClockwise size={16} />
              </button>
            </div>
          </div>

          {/* Batch Actions Bar (when items are selected) */}
          {selectedIds.size > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-950 font-bold">
                <CheckSquare size={18} className="text-indigo-600" />
                <span>Đã chọn {selectedIds.size} đề thi trong kho Staging</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isBatchOperating}
                  onClick={handleBatchImport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isBatchOperating ? <SpinnerGap size={14} className="spin" /> : <Rocket size={14} />}
                  Chuyển {selectedIds.size} đề thành Bản Nháp
                </button>

                <button
                  disabled={isBatchOperating}
                  onClick={handleBatchDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold transition shadow-2xs disabled:opacity-50"
                >
                  <Trash size={14} /> Xóa {selectedIds.size} đề
                </button>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Loading or Empty State */}
          {isRawLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <SpinnerGap size={32} className="spin text-indigo-600 mx-auto mb-2" />
              <div className="text-xs font-semibold">Đang tải danh sách đề thi Staging...</div>
            </div>
          ) : rawTests.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Database size={44} className="text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 mb-1">Không tìm thấy đề thi phù hợp</h3>
              <p className="text-xs text-slate-500">Hãy thử thay đổi bộ lọc tìm kiếm hoặc kích hoạt nguồn crawl tự động.</p>
            </div>
          ) : viewMode === "list" ? (
            /* ================= VIEW 1: TABLE (LIST) ================= */
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === rawTests.length && rawTests.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="py-3 px-4">Đề Thi & Nguồn</th>
                      <th className="py-3 px-4">Kỹ Năng</th>
                      <th className="py-3 px-4">Cấu Trúc & Số Câu</th>
                      <th className="py-3 px-4">Trạng Thái Staging</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawTests.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const isReading = item.skill === "READING";
                      const qCount = item.parsedStructure?.questionCount || item.parsedStructure?.summary?.totalQuestions || 0;
                      const hasAudio = !isReading;
                      const isImported = item.status === "imported" || Boolean(item.importedTestId);

                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/80 transition ${isSelected ? "bg-indigo-50/30" : ""}`}>
                          {/* Checkbox */}
                          <td className="py-3 px-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Title & Source Link */}
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[11px] text-slate-400 font-medium">{item.sourceName || "YouPass IELTS"}</span>
                              {item.sourceUrl && (
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  Xem link gốc <ArrowSquareOut size={11} />
                                </a>
                              )}
                              <span className="text-[10px] text-slate-400">
                                Crawl: {new Date(item.crawledAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </td>

                          {/* Skill Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                isReading
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isReading ? <BookOpen size={13} /> : <SpeakerHigh size={13} />}
                              {item.skill}
                            </span>
                          </td>

                          {/* Structure & Questions Count */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{qCount} câu hỏi</span>
                              {hasAudio && (
                                <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                  🎧 Audio
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.parsedStructure?.testType === "FULL_TEST" ? "Full Test (60p)" : "Single Skill (20-30p)"}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {isImported ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                <Check size={12} weight="bold" /> Đã Vào Test Bank
                              </span>
                            ) : item.status === "parsed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                                <Sparkle size={12} weight="fill" /> Đã Phân Tách AI
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                <Clock size={12} /> Chờ Xử Lý
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isImported ? (
                                <button
                                  type="button"
                                  disabled={importingId === item.id}
                                  onClick={() => handleImportSingle(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs disabled:opacity-50"
                                  title="Chuyển ngay đề này thành Bản Nháp trong Test Bank"
                                >
                                  {importingId === item.id ? <SpinnerGap size={13} className="spin" /> : <Rocket size={13} />}
                                  Lưu Bản Nháp
                                </button>
                              ) : (
                                <Link
                                  to="/test-bank"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition"
                                >
                                  Xem Trong Test Bank
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => { setSelectedRawTest(item); setModalTab("preview"); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-2xs"
                                title="Xem chi tiết đề thi và kiểm tra cấu trúc"
                              >
                                <Eye size={14} /> Chi tiết
                              </button>

                              <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteSingle(item.id, item.title)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                                title="Xóa đề khỏi Staging"
                              >
                                {deletingId === item.id ? <SpinnerGap size={14} className="spin" /> : <Trash size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                  <span>
                    Trang {page + 1} / {totalPages} (Tổng {stats.total || totalCount} đề thi)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                    >
                      Trước
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= VIEW 2: GRID (CARD LAYOUT) ================= */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawTests.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isReading = item.skill === "READING";
                  const qCount = item.parsedStructure?.questionCount || item.parsedStructure?.summary?.totalQuestions || 0;
                  const hasAudio = !isReading;
                  const isImported = item.status === "imported" || Boolean(item.importedTestId);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border bg-white p-4 flex flex-col justify-between transition shadow-2xs hover:shadow-sm ${
                        isSelected ? "border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-300" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        {/* Top meta */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                isReading
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isReading ? <BookOpen size={12} /> : <SpeakerHigh size={12} />}
                              {item.skill}
                            </span>
                          </div>

                          {isImported ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Check size={11} weight="bold" /> Đã Vào Test Bank
                            </span>
                          ) : item.status === "parsed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                              <Sparkle size={11} weight="fill" /> Đã Phân Tách
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <Clock size={11} /> Chờ Xử Lý
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2.5 min-h-[2.5rem]">
                          {item.title}
                        </h3>

                        {/* Pills & Meta */}
                        <div className="space-y-2 mb-4 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[11px]">
                              {qCount} câu hỏi
                            </span>
                            {hasAudio && (
                              <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 font-semibold text-[11px] flex items-center gap-1">
                                <SpeakerHigh size={11} /> Audio
                              </span>
                            )}
                            <span className="rounded bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 text-[11px]">
                              {item.parsedStructure?.testType === "FULL_TEST" ? "60p" : "20-30p"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="truncate max-w-[140px]">{item.sourceName || "YouPass IELTS"}</span>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline"
                              >
                                Link gốc <ArrowSquareOut size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                        {!isImported ? (
                          <button
                            type="button"
                            disabled={importingId === item.id}
                            onClick={() => handleImportSingle(item.id)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-2xs disabled:opacity-50"
                          >
                            {importingId === item.id ? <SpinnerGap size={13} className="spin" /> : <Rocket size={13} />}
                            Lưu Bản Nháp
                          </button>
                        ) : (
                          <Link
                            to="/test-bank"
                            className="flex-1 py-1.5 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs text-center hover:bg-emerald-100 transition"
                          >
                            Vào Test Bank
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => { setSelectedRawTest(item); setModalTab("preview"); }}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 transition shadow-2xs"
                        >
                          <Eye size={13} /> Chi tiết
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteSingle(item.id, item.title)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa đề khỏi Staging"
                        >
                          {deletingId === item.id ? <SpinnerGap size={13} className="spin" /> : <Trash size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border border-slate-200 bg-white rounded-xl text-xs text-slate-500 mt-4">
                  <span>
                    Trang {page + 1} / {totalPages} (Tổng {stats.total || totalCount} đề thi)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                    >
                      Trước
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUẢN LÝ NGUỒN CRAWL */}
      {activeTab === "sources" && (
        <div>
          {isSourcesLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <SpinnerGap size={32} className="spin text-indigo-600 mx-auto mb-2" />
              <div className="text-xs font-semibold">Đang tải danh sách nguồn crawl...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((src) => (
                <div key={src.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{src.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${src.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                        {src.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </div>

                    <a href={src.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline break-all block mb-3">
                      {src.sourceUrl}
                    </a>

                    <div className="text-xs text-slate-600 space-y-1.5 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div><strong>Kỹ năng:</strong> {src.targetSkill}</div>
                      <div><strong>Engine:</strong> {src.crawlerType}</div>
                      <div><strong>Cron:</strong> <code className="text-indigo-600">{src.scheduleCron || "N/A"}</code></div>
                      <div><strong>Đã thu thập:</strong> <span className="font-bold text-indigo-700">{src.totalCrawled} bài</span></div>
                      {src.lastCrawledAt && <div><strong>Chạy gần nhất:</strong> {new Date(src.lastCrawledAt).toLocaleString("vi-VN")}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      disabled={triggeringSourceId === src.id}
                      onClick={() => handleTriggerCrawl(src.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      {triggeringSourceId === src.id ? <SpinnerGap size={14} className="spin" /> : <Lightning size={14} />}
                      {triggeringSourceId === src.id ? "Đang crawl..." : "Crawl Ngay"}
                    </button>
                    <button
                      onClick={() => { setEditingSource(src); setSourceModalOpen(true); }}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                    >
                      Sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL THÊM / SỬA NGUỒN CRAWL */}
      {sourceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-bold text-slate-900 text-base">{editingSource?.id ? "Chỉnh Sửa Nguồn Crawl" : "Thêm Nguồn Crawl Mới"}</h2>
              <button onClick={() => setSourceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Nguồn *</label>
                <input
                  type="text"
                  required
                  value={editingSource?.name || ""}
                  onChange={(e) => setEditingSource((s) => ({ ...s, name: e.target.value }))}
                  placeholder="VD: YouPass IELTS Reading Practice"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Trang Nguồn *</label>
                <input
                  type="url"
                  required
                  value={editingSource?.sourceUrl || ""}
                  onChange={(e) => setEditingSource((s) => ({ ...s, sourceUrl: e.target.value }))}
                  placeholder="https://youpass.vn/luyen-thi/ielts/reading"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại Engine</label>
                  <select
                    value={editingSource?.crawlerType || "api"}
                    onChange={(e) => setEditingSource((s) => ({ ...s, crawlerType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="api">YouPass Direct API</option>
                    <option value="scrapy">Python Crawler</option>
                    <option value="playwright">Node Playwright</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kỹ Năng Mục Tiêu</label>
                  <select
                    value={editingSource?.targetSkill || "READING"}
                    onChange={(e) => setEditingSource((s) => ({ ...s, targetSkill: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="READING">Reading</option>
                    <option value="LISTENING">Listening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lịch chạy định kỳ (Cron)</label>
                <input
                  type="text"
                  value={editingSource?.scheduleCron || "0 0 * * *"}
                  onChange={(e) => setEditingSource((s) => ({ ...s, scheduleCron: e.target.value }))}
                  placeholder="0 0 * * * (Mỗi ngày)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setSourceModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RICH INSPECTION & PREVIEW MODAL */}
      {selectedRawTest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedRawTest.skill === "READING" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {selectedRawTest.skill}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{selectedRawTest.sourceName || "YouPass"}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{selectedRawTest.title}</h2>
              </div>
              <button
                onClick={() => setSelectedRawTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Action Bar & Sub-Tabs */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab("preview")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    modalTab === "preview" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Eye size={15} /> Xem Trực Quan
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("json")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    modalTab === "json" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Code size={15} /> Cấu Trúc JSON
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("raw")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    modalTab === "raw" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText size={15} /> Dữ Liệu Gốc
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedRawTest.status !== "imported" && (
                  <button
                    disabled={importingId === selectedRawTest.id}
                    onClick={() => handleImportSingle(selectedRawTest.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {importingId === selectedRawTest.id ? <SpinnerGap size={14} className="spin" /> : <Rocket size={14} />}
                    🚀 Lưu Thành Bản Nháp Test Bank
                  </button>
                )}
                {selectedRawTest.status === "imported" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 font-bold text-emerald-800">
                    <Check size={14} /> Đã vào Test Bank
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {modalTab === "preview" && (
                selectedRawTest.parsedStructure?.builderContent ? (
                  <AiImportStructurePreview
                    skill={selectedRawTest.skill}
                    builderContent={selectedRawTest.parsedStructure.builderContent}
                    questionCount={selectedRawTest.parsedStructure.questionCount || 0}
                  />
                ) : (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                    <WarningCircle size={32} className="mx-auto mb-2 text-amber-500" />
                    <p className="font-semibold text-xs">Đề này chưa có cấu trúc phân tách hoàn chỉnh.</p>
                  </div>
                )
              )}

              {modalTab === "json" && (
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 overflow-x-auto text-xs text-slate-100 font-mono">
                  <pre>{JSON.stringify(selectedRawTest.parsedStructure || {}, null, 2)}</pre>
                </div>
              )}

              {modalTab === "raw" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 overflow-x-auto text-xs text-slate-700">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedRawTest.rawPayload || {}, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
