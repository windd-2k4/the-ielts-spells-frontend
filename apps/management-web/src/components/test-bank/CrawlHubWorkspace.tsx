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
  Rocket
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
  };
  parsedStructure?: {
    title?: string;
    builderContent?: any;
    summary?: {
      passageCount?: number;
      questionGroupCount?: number;
      totalQuestions?: number;
    };
  };
}

export function CrawlHubWorkspace() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"staging" | "sources">("staging");

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
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail / Action Modal State
  const [selectedRawTest, setSelectedRawTest] = useState<RawCrawledTest | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("NVIDIA");
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

  // Fetch Raw Tests
  const fetchRawTests = async () => {
    setIsRawLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedSkill !== "ALL") params.append("skill", selectedSkill);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      params.append("page", String(page));
      params.append("size", "15");

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
    }
  }, [activeTab, page, selectedSkill, selectedStatus]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchRawTests();
  };

  // Handle Trigger Crawl
  const handleTriggerCrawl = async (sourceId: string) => {
    setTriggeringSourceId(sourceId);
    try {
      await apiFetch(`/admin/crawl-hub/sources/${sourceId}/trigger`, { method: "POST" });
      setFeedback({ type: "success", text: "Đã kích hoạt crawl thành công! Đề thô mới đã được lưu vào kho Staging." });
      fetchSources();
      if (activeTab === "staging") fetchRawTests();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Không thể kích hoạt crawl: " + err.message });
    } finally {
      setTriggeringSourceId(null);
    }
  };

  // Handle Save Source (Create/Update)
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
          crawlerType: editingSource.crawlerType || "scrapy",
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
      setFeedback({ type: "success", text: "Đã phân tách cấu trúc đề bằng AI thành công!" });
      fetchRawTests();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi phân tách AI: " + err.message });
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Import to Test Bank
  const handleImportToTestBank = async () => {
    if (!selectedRawTest) return;
    setIsImporting(true);
    setFeedback(null);

    try {
      const updated = await apiFetch<RawCrawledTest>(`/admin/crawl-hub/raw-tests/${selectedRawTest.id}/import`, {
        method: "POST",
      });

      setSelectedRawTest(updated);
      setFeedback({ type: "success", text: "🚀 Đã chuyển đề thi thành công vào Test Bank ở trạng thái DRAFT!" });
      fetchRawTests();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Lỗi chuyển đề vào Test Bank: " + err.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="test-bank-container">
      {/* Top Header */}
      <div className="test-bank-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6366f1", fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
            <Robot size={18} /> Giai đoạn 2 • Automated Scraping Hub
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Kho Đề Crawl & Quản lý Nguồn (Crawl Hub)</h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Thu thập đề thi tự động từ các nguồn Open Source, xem đề thô staging, phân tách AI và lưu trực tiếp thành Bản nháp Test Bank.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/test-bank" className="secondary-button" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <FileText size={18} /> Quay lại Test Bank
          </Link>
          <button
            className="primary-button"
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            onClick={() => {
              setEditingSource({ name: "", sourceUrl: "", crawlerType: "scrapy", targetSkill: "READING", isActive: true });
              setSourceModalOpen(true);
            }}
          >
            <Plus size={18} /> Thêm nguồn Crawl
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {feedback.type === "success" ? <CheckCircle size={20} /> : <WarningCircle size={20} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("staging")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "staging" ? "2px solid #4f46e5" : "2px solid transparent",
            color: activeTab === "staging" ? "#4f46e5" : "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Database size={18} /> Kho Đề Crawl Staging ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "sources" ? "2px solid #4f46e5" : "2px solid transparent",
            color: activeTab === "sources" ? "#4f46e5" : "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Robot size={18} /> Nguồn Crawl Tự Động ({sources.length})
        </button>
      </div>

      {/* TAB 1: KHO ĐỀ STAGING */}
      {activeTab === "staging" && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "260px", display: "flex", gap: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <MagnifyingGlass size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thô..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
              <button type="submit" className="secondary-button" style={{ padding: "8px 16px" }}>
                Lọc
              </button>
            </form>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Funnel size={18} style={{ color: "#64748b" }} />
              <select
                value={selectedSkill}
                onChange={(e) => { setSelectedSkill(e.target.value); setPage(0); }}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              >
                <option value="ALL">Tất cả Kỹ năng</option>
                <option value="READING">Reading</option>
                <option value="LISTENING">Listening</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              >
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="pending">Chờ xử lý (Pending)</option>
                <option value="parsed">Đã phân tách AI (Parsed)</option>
                <option value="imported">Đã vào Test Bank (Imported)</option>
                <option value="rejected">Bị từ chối (Rejected)</option>
              </select>

              <button onClick={() => fetchRawTests()} className="icon-button" title="Làm mới">
                <ArrowClockwise size={18} />
              </button>
            </div>
          </div>

          {/* Table of Raw Tests */}
          {isRawLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <SpinnerGap size={32} className="spin" style={{ marginBottom: "8px" }} />
              <div>Đang tải dữ liệu đề thô Staging...</div>
            </div>
          ) : rawTests.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <Database size={48} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 6px 0", color: "#334155" }}>Kho đề Staging đang trống</h3>
              <p style={{ color: "#64748b", margin: 0 }}>Chuyển sang tab Nguồn Crawl và nhấn "Crawl ngay" để nạp dữ liệu mới.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                    <th style={{ padding: "12px 16px" }}>Tiêu đề Đề Crawl</th>
                    <th style={{ padding: "12px 16px" }}>Kỹ năng</th>
                    <th style={{ padding: "12px 16px" }}>Nguồn</th>
                    <th style={{ padding: "12px 16px" }}>Thời gian Crawl</th>
                    <th style={{ padding: "12px 16px" }}>Trạng thái</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rawTests.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                        <div>{item.title}</div>
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#6366f1", fontWeight: 400 }}>
                            {item.sourceUrl}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#e0e7ff", color: "#3730a3", fontSize: "12px", fontWeight: 600 }}>
                          {item.skill}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{item.sourceName || "Nguồn Khác"}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "13px" }}>
                        {new Date(item.crawledAt).toLocaleString("vi-VN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {item.status === "pending" && <span style={{ padding: "4px 8px", borderRadius: "12px", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: 600 }}>Chờ xử lý</span>}
                        {item.status === "parsed" && <span style={{ padding: "4px 8px", borderRadius: "12px", background: "#e0f2fe", color: "#075985", fontSize: "12px", fontWeight: 600 }}>Đã Parse AI</span>}
                        {item.status === "imported" && <span style={{ padding: "4px 8px", borderRadius: "12px", background: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: 600 }}>Đã vào Test Bank</span>}
                        {item.status === "rejected" && <span style={{ padding: "4px 8px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", fontSize: "12px", fontWeight: 600 }}>Từ chối</span>}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedRawTest(item)}
                          className="secondary-button"
                          style={{ padding: "6px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={16} /> Xem & Parse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Trang {page + 1} / {totalPages} (Tổng {totalCount} đề)</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="secondary-button" style={{ padding: "4px 10px", fontSize: "13px" }}>Trước</button>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="secondary-button" style={{ padding: "4px 10px", fontSize: "13px" }}>Sau</button>
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
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <SpinnerGap size={32} className="spin" />
              <div>Đang tải nguồn crawl...</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {sources.map((src) => (
                <div key={src.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>{src.name}</h3>
                      <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: src.isActive ? "#dcfce7" : "#f1f5f9", color: src.isActive ? "#15803d" : "#64748b" }}>
                        {src.isActive ? "Đang hoạt động" : "Tắt"}
                      </span>
                    </div>

                    <a href={src.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#6366f1", wordBreak: "break-all", display: "block", marginBottom: "12px" }}>
                      {src.sourceUrl}
                    </a>

                    <div style={{ fontSize: "13px", color: "#475569", display: "grid", gap: "6px", marginBottom: "16px" }}>
                      <div><strong>Loại Engine:</strong> {src.crawlerType}</div>
                      <div><strong>Kỹ năng mục tiêu:</strong> {src.targetSkill}</div>
                      <div><strong>Lịch Cron:</strong> <code>{src.scheduleCron || "N/A"}</code></div>
                      <div><strong>Tổng số bài đã crawl:</strong> <strong style={{ color: "#4f46e5" }}>{src.totalCrawled}</strong></div>
                      {src.lastCrawledAt && <div><strong>Chạy gần nhất:</strong> {new Date(src.lastCrawledAt).toLocaleString("vi-VN")}</div>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    <button
                      disabled={triggeringSourceId === src.id}
                      onClick={() => handleTriggerCrawl(src.id)}
                      className="primary-button"
                      style={{ flex: 1, padding: "8px", fontSize: "13px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
                    >
                      {triggeringSourceId === src.id ? <SpinnerGap className="spin" size={16} /> : <Lightning size={16} />}
                      {triggeringSourceId === src.id ? "Đang Crawl..." : "Crawl ngay"}
                    </button>
                    <button
                      onClick={() => { setEditingSource(src); setSourceModalOpen(true); }}
                      className="secondary-button"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "500px", maxWidth: "90vw", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{editingSource?.id ? "Chỉnh sửa Nguồn Crawl" : "Thêm Nguồn Crawl Mới"}</h2>
              <button onClick={() => setSourceModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveSource} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Tên Nguồn *</label>
                <input
                  type="text"
                  required
                  value={editingSource?.name || ""}
                  onChange={(e) => setEditingSource(s => ({ ...s, name: e.target.value }))}
                  placeholder="VD: Open IELTS Reading Repository"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>URL Nguồn Open Source *</label>
                <input
                  type="url"
                  required
                  value={editingSource?.sourceUrl || ""}
                  onChange={(e) => setEditingSource(s => ({ ...s, sourceUrl: e.target.value }))}
                  placeholder="https://raw.githubusercontent.com/..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Loại Engine</label>
                  <select
                    value={editingSource?.crawlerType || "scrapy"}
                    onChange={(e) => setEditingSource(s => ({ ...s, crawlerType: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="scrapy">Python Scrapy</option>
                    <option value="playwright">Node Playwright</option>
                    <option value="rss">RSS / GitHub API</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Kỹ năng Mục tiêu</label>
                  <select
                    value={editingSource?.targetSkill || "READING"}
                    onChange={(e) => setEditingSource(s => ({ ...s, targetSkill: e.target.value as any }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="READING">Reading</option>
                    <option value="LISTENING">Listening</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Lịch chạy tự động (Cron expression)</label>
                <input
                  type="text"
                  value={editingSource?.scheduleCron || "0 0 * * *"}
                  onChange={(e) => setEditingSource(s => ({ ...s, scheduleCron: e.target.value }))}
                  placeholder="0 0 * * * (Mỗi ngày lúc 00:00)"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setSourceModalOpen(false)} className="secondary-button">Hủy</button>
                <button type="submit" className="primary-button">Lưu Cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT & PARSE AI FOR RAW TEST */}
      {selectedRawTest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "900px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Chi tiết Đề Thô & AI Parser</h2>
                <div style={{ fontSize: "13px", color: "#64748b" }}>{selectedRawTest.title}</div>
              </div>
              <button onClick={() => setSelectedRawTest(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "grid", gap: "20px" }}>
              {/* Controls bar */}
              <div style={{ background: "#f1f5f9", padding: "14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Chọn mô hình AI:</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="NVIDIA">NVIDIA NIM API (Model cấu hình trong .env)</option>
                    <option value="GEMINI">Gemini 1.5 Flash API</option>
                    <option value="OFFLINE_REGEX">Offline Smart Regex Parser (Không tốn API Key)</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={isParsing}
                    onClick={handleParseTest}
                    className="primary-button"
                    style={{ padding: "8px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  >
                    {isParsing ? <SpinnerGap className="spin" size={16} /> : <Sparkle size={16} />}
                    {isParsing ? "AI đang tách đề..." : "⚡ Phân tách bằng AI"}
                  </button>

                  <button
                    disabled={isImporting}
                    onClick={handleImportToTestBank}
                    className="primary-button"
                    style={{ padding: "8px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    {isImporting ? <SpinnerGap className="spin" size={16} /> : <Rocket size={16} />}
                    {isImporting ? "Đang lưu..." : "🚀 Chuyển thành Bản Nháp"}
                  </button>
                </div>
              </div>

              {/* Parsed Structure Preview or Raw Text */}
              {selectedRawTest.parsedStructure?.builderContent ? (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>👁️ Cấu trúc Đề thi đã phân tách (Preview):</h3>
                  <AiImportStructurePreview
                    skill={selectedRawTest.skill}
                    builderContent={selectedRawTest.parsedStructure.builderContent}
                    questionCount={selectedRawTest.parsedStructure.summary?.totalQuestions || 0}
                  />
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>📄 Văn bản thô thu thập từ Crawler:</h3>
                  <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "16px", borderRadius: "8px", fontSize: "13px", maxHeight: "350px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                    {selectedRawTest.rawPayload?.extracted_text || selectedRawTest.rawPayload?.html || "Không có văn bản thô."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
