import {
  ArrowRight, CheckCircle, ShieldCheck, WarningCircle, X,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { TestBankItem, ValidationIssue } from "../../library-types";

type Props = {
  test: TestBankItem;
  onClose: () => void;
  onPublished: () => Promise<void> | void;
};

export default function PublishValidationModal({ test, onClose, onPublished }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const content = test.builderContent ?? {};
  const hasBuilderContent = Object.keys(content).length > 0;
  const issues: ValidationIssue[] = [];
  if (!hasBuilderContent && test.totalQuestions === 0) {
    issues.push({
      id: "empty-test",
      severity: "ERROR",
      sectionTitle: "Nội dung đề",
      message: "Đề chưa có section, task hoặc câu hỏi nào được lưu.",
      targetId: "test-builder-workspace",
    });
  }
  if (!test.durationMinutes || test.durationMinutes <= 0) {
    issues.push({
      id: "duration",
      severity: "ERROR",
      sectionTitle: "Thông tin chung",
      message: "Thời lượng làm bài phải lớn hơn 0 phút.",
      targetId: "test-builder-header",
    });
  }

  const hasBlockingErrors = issues.some((i) => i.severity === "ERROR");
  const errorCount = issues.filter((i) => i.severity === "ERROR").length;
  const warningCount = issues.filter((i) => i.severity === "WARNING").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-[22px] bg-white p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e3dce2] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-xl ${
                hasBlockingErrors ? "bg-rose-50 text-[#b4232d]" : "bg-emerald-50 text-[#237653]"
              }`}
            >
              {hasBlockingErrors ? <WarningCircle size={26} /> : <ShieldCheck size={26} />}
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-[#211A1D]">
                Kiểm tra trước khi xuất bản đề thi
              </h3>
              <p className="text-xs text-[#746A6E]">
                {test.code} • {test.title}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1 text-[#746A6E] hover:bg-[#f1eef4]">
            <X size={20} />
          </button>
        </div>

        {/* Summary Stats Badges */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <span className="text-[11px] font-extrabold uppercase text-[#b4232d]">
              Lỗi bắt buộc (Blocking Errors)
            </span>
            <p className="mt-1 text-2xl font-black text-[#b4232d]">{errorCount}</p>
            <p className="mt-0.5 text-[11px] text-[#746A6E]">Phải sửa hết lỗi này mới được xuất bản.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <span className="text-[11px] font-extrabold uppercase text-[#8a6000]">
              Cảnh báo (Warnings)
            </span>
            <p className="mt-1 text-2xl font-black text-[#8a6000]">{warningCount}</p>
            <p className="mt-0.5 text-[11px] text-[#746A6E]">Khuyến nghị hoàn thiện thêm.</p>
          </div>
        </div>

        {/* Detailed Issues List */}
        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-[#211A1D] uppercase tracking-wider">
            Danh sách mục cần xử lý
          </h4>

          <div className="custom-scrollbar max-h-56 overflow-y-auto space-y-2.5">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 ${
                  issue.severity === "ERROR"
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <WarningCircle
                    size={18}
                    className={`mt-0.5 shrink-0 ${
                      issue.severity === "ERROR" ? "text-[#b4232d]" : "text-[#8a6000]"
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-[#211A1D]">
                      [{issue.sectionTitle}] {issue.questionNo ? `Câu ${issue.questionNo}` : ""}
                    </span>
                    <p className="mt-0.5 text-xs text-[#746A6E]">{issue.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    // Scroll to target element
                    const el = document.getElementById(issue.targetId);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
                >
                  <span>Đi đến vị trí lỗi</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex items-center justify-between border-t border-[#e3dce2] pt-4">
          <p className="text-xs text-[#746A6E]">
            {hasBlockingErrors
              ? "Vui lòng sửa tất cả lỗi bắt buộc để tiếp tục."
              : "Đề thi đủ điều kiện xuất bản lên hệ thống."}
          </p>

          <div className="flex gap-3">
            {publishError && <p className="max-w-52 text-xs font-semibold text-[#b4232d]">{publishError}</p>}
            <button
              onClick={onClose}
              className="min-h-[42px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                setPublishing(true);
                setPublishError("");
                try { await onPublished(); }
                catch (reason) { setPublishError(reason instanceof Error ? reason.message : "Không thể xuất bản đề"); }
                finally { setPublishing(false); }
              }}
              disabled={hasBlockingErrors || publishing}
              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck size={18} />
              {publishing ? "Đang xuất bản..." : "Xác nhận Xuất bản"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
