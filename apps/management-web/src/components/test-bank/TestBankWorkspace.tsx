import {
  Archive, Copy, Exam, Eye, Funnel, MagnifyingGlass, NotePencil, Plus, ShieldCheck,
  SpinnerGap, Trash, UploadSimple, WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ContentLifecycleStatus, TestBankItem, TestPurpose, TestSkill } from "../../library-types";
import PublishValidationModal from "../test-builder/PublishValidationModal";
import TestPreviewModal from "../test-builder/TestPreviewModal";
import { apiFetch } from "../../lib/api";
import type { Page } from "../../academic-types";

type Props = {
  onOpenBulkImport: () => void;
};

const purposeLabels: Record<TestPurpose, string> = {
  PLACEMENT: "Placement Test",
  PRACTICE: "Practice Test",
  PROGRESS: "Progress Test",
  MOCK_TEST: "Mock Test",
};

const statusBadge = (status: ContentLifecycleStatus) => {
  switch (status) {
    case "PUBLISHED":
      return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">Published</span>;
    case "IN_REVIEW":
      return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-[#8a6000]">Chờ duyệt</span>;
    case "DRAFT":
      return <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-[#746A6E]">Draft</span>;
    case "ARCHIVED":
      return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-[#b4232d]">Archived</span>;
  }
};

export function TestBankWorkspace({ onOpenBulkImport }: Props) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<TestPurpose | "ALL">("ALL");
  const [skillFilter, setSkillFilter] = useState<TestSkill | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ContentLifecycleStatus | "ALL">("ALL");
  const [publishingTest, setPublishingTest] = useState<TestBankItem | null>(null);
  const [previewTest, setPreviewTest] = useState<TestBankItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New test selection modal state
  const [newSkill, setNewSkill] = useState<"reading" | "listening" | "writing" | "speaking">("reading");
  const [newTitle, setNewTitle] = useState("");
  const [newPurpose, setNewPurpose] = useState<TestPurpose>("MOCK_TEST");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiFetch<Page<TestBankItem>>("/admin/test-bank?size=100")
      .then((page) => active && setTests(page.content))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filteredTests = tests.filter((t) => {
    if (purposeFilter !== "ALL" && t.purpose !== purposeFilter) return false;
    if (skillFilter !== "ALL" && t.skill !== skillFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (query.trim() && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.code.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  async function handleCreateTest() {
    if (!newTitle.trim()) return;
    try {
      setError("");
      const created = await apiFetch<TestBankItem>("/admin/test-bank", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: null,
          purpose: newPurpose,
          skill: newSkill.toUpperCase(),
          testType: "SINGLE_SKILL",
          difficulty: "Chưa phân loại",
          durationMinutes: newSkill === "speaking" ? 15 : 60,
          version: "v1.0",
          tags: [],
          builderContent: {},
        }),
      });
      setTests((current) => [created, ...current]);
      setShowCreateModal(false);
      navigate(`/test-builder/${newSkill}/${created.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo đề thi");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#8f4458]">
            NỘI DUNG ĐÀO TẠO
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl text-[#211A1D]">
            Ngân hàng đề thi IELTS
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">
            Tạo, quản lý và duyệt ngân hàng đề Placement, Practice, Progress & Mock Test. Tái sử dụng theo phiên bản chuẩn mà không sao chép dữ liệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenBulkImport}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#e3dce2] bg-white px-4 text-sm font-bold text-[#211A1D] transition hover:bg-[#f1eef4]"
          >
            <UploadSimple size={18} weight="bold" />
            Import Excel/CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <Plus size={18} weight="bold" />
            Tạo đề mới
          </button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#e3dce2] bg-white p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm theo tên hoặc mã đề</span>
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A6E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên đề, mã đề (VD: TST-R012)..."
            className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] bg-white pl-10 pr-4 text-xs focus:border-[#8f4458] focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value as TestPurpose | "ALL")}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Mọi mục đích</option>
            <option value="PLACEMENT">Placement Test</option>
            <option value="PRACTICE">Practice Test</option>
            <option value="PROGRESS">Progress Test</option>
            <option value="MOCK_TEST">Mock Test</option>
          </select>

          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value as TestSkill | "ALL")}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Tất cả kỹ năng</option>
            <option value="READING">Reading</option>
            <option value="LISTENING">Listening</option>
            <option value="WRITING">Writing</option>
            <option value="SPEAKING">Speaking</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContentLifecycleStatus | "ALL")}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">Chờ duyệt</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-[#b4232d]">{error}</div>}
      <div className="overflow-hidden rounded-[18px] border border-[#e3dce2] bg-white shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f1eef4] text-[#746A6E] font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3.5">Mã & Tên đề</th>
              <th className="p-3.5">Mục đích</th>
              <th className="p-3.5">Kỹ năng</th>
              <th className="p-3.5">Section</th>
              <th className="p-3.5">Số câu</th>
              <th className="p-3.5">Thời lượng</th>
              <th className="p-3.5">Phiên bản</th>
              <th className="p-3.5">Người tạo</th>
              <th className="p-3.5">Cập nhật</th>
              <th className="p-3.5">Trạng thái</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3dce2]">
            {loading && <tr><td colSpan={11} className="p-10 text-center text-[#746A6E]"><SpinnerGap className="mr-2 inline animate-spin" />Đang tải dữ liệu...</td></tr>}
            {!loading && filteredTests.length === 0 && <tr><td colSpan={11} className="p-10 text-center text-[#746A6E]">Chưa có đề thi phù hợp.</td></tr>}
            {filteredTests.map((test) => (
              <tr key={test.id} className="hover:bg-[#f7f5f9]">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
                      <Exam size={18} weight="duotone" />
                    </span>
                    <div>
                      <span className="font-bold text-[#8f4458]">{test.code}</span>
                      <p className="font-semibold text-[#211A1D] line-clamp-1">{test.title}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="rounded-full bg-[#f1eef4] px-2.5 py-0.5 text-[11px] font-bold text-[#746A6E]">
                    {purposeLabels[test.purpose]}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-[#211A1D]">{test.skill}</td>
                <td className="p-3.5 font-semibold text-[#211A1D]">{test.sectionsCount} section</td>
                <td className="p-3.5 font-semibold text-[#211A1D]">{test.totalQuestions} câu</td>
                <td className="p-3.5 text-[#746A6E]">{test.durationMinutes} phút</td>
                <td className="p-3.5 font-bold text-[#8f4458]">{test.version}</td>
                <td className="p-3.5 text-[#746A6E]">{test.createdBy}</td>
                <td className="p-3.5 text-[#746A6E]">
                  {new Date(test.updatedAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-3.5">{statusBadge(test.status)}</td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setPreviewTest(test)}
                      className="rounded-lg p-1.5 text-[#746A6E] hover:bg-[#f1eef4]"
                      title="Xem trước (Preview)"
                    >
                      <Eye size={16} />
                    </button>
                    <Link
                      to={`/test-builder/${test.skill.toLowerCase()}/${test.id}`}
                      className="rounded-lg p-1.5 text-[#8f4458] hover:bg-[#f7e7ec]"
                      title="Mở Test Builder"
                    >
                      <NotePencil size={16} />
                    </Link>
                    {test.status !== "PUBLISHED" && (
                      <button
                        onClick={() => setPublishingTest(test)}
                        className="rounded-lg p-1.5 text-[#237653] hover:bg-emerald-50"
                        title="Xuất bản đề thi"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE NEW TEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl space-y-5">
            <h3 className="font-display text-lg font-bold text-[#211A1D]">Khởi tạo đề thi mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#211A1D] mb-1">Tên đề thi</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: IELTS Reading Practice Test 14..."
                  className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3.5 text-sm focus:border-[#8f4458] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#211A1D] mb-1">Kỹ năng</label>
                <select
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value as any)}
                  className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
                >
                  <option value="reading">Reading (Split-Screen Builder)</option>
                  <option value="listening">Listening (Audio & Transcript Builder)</option>
                  <option value="writing">Writing (Task 1 & Task 2 Builder)</option>
                  <option value="speaking">Speaking (Part 1, 2, 3 Builder)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#211A1D] mb-1">Mục đích sử dụng</label>
                <select
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value as TestPurpose)}
                  className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
                >
                  <option value="MOCK_TEST">Mock Test</option>
                  <option value="PRACTICE">Practice Test</option>
                  <option value="PROGRESS">Progress Test</option>
                  <option value="PLACEMENT">Placement Test</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e3dce2] pt-4">
              <button onClick={() => setShowCreateModal(false)} className="min-h-[42px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold">
                Hủy
              </button>
              <button
                onClick={handleCreateTest}
                disabled={!newTitle.trim()}
                className="min-h-[42px] rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white hover:bg-[#743447] disabled:opacity-50"
              >
                Mở Test Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH VALIDATION MODAL */}
      {publishingTest && (
        <PublishValidationModal
          test={publishingTest}
          onClose={() => setPublishingTest(null)}
          onPublished={async () => {
            const updated = await apiFetch<TestBankItem>(`/admin/test-bank/${publishingTest.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: "PUBLISHED" }),
            });
            setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setPublishingTest(null);
          }}
        />
      )}

      {/* PREVIEW MODAL */}
      {previewTest && (
        <TestPreviewModal
          test={previewTest}
          onClose={() => setPreviewTest(null)}
        />
      )}
    </div>
  );
}
