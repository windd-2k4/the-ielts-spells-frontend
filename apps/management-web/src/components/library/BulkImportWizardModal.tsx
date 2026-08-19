import {
  ArrowLeft, ArrowRight, Check, DownloadSimple, FileCsv, ShieldCheck, UploadSimple, WarningCircle, X,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { BulkImportRow } from "../../library-types";
import { apiFetch } from "../../lib/api";

type Props = {
  onClose: () => void;
};

const steps = [
  "1. File mẫu",
  "2. Upload",
  "3. Ánh xạ cột",
  "4. Xem trước",
  "5. Kiểm tra lỗi",
  "6. Import",
  "7. Báo cáo",
];

export default function BulkImportWizardModal({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [report, setReport] = useState({ success: 0, failed: 0 });
  const [error, setError] = useState("");

  const downloadTemplate = () => {
    const csv = "code,title,skill,category,description\n,IELTS Listening Form Completion,LISTENING,PRACTICE_SET,Tài liệu luyện tập\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "IELTS_Import_Template.csv"; anchor.click();
    URL.revokeObjectURL(url);
  };

  const readCsv = async (file: File) => {
    setError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Hiện tại luồng import thật hỗ trợ CSV. Vui lòng dùng file mẫu CSV.");
      return;
    }
    const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const headers = (lines.shift() ?? "").split(",").map(value => value.trim().toLowerCase());
    const index = (name: string) => headers.indexOf(name);
    const allowedSkills = new Set(["LISTENING", "READING", "WRITING", "SPEAKING"]);
    const parsed = lines.map((line, rowIndex) => {
      const values = line.split(",").map(value => value.trim());
      const title = values[index("title")] ?? "";
      const skill = (values[index("skill")] ?? "").toUpperCase();
      const category = values[index("category")] ?? "";
      const errors = [!title && "Thiếu title", !allowedSkills.has(skill) && "Skill không hợp lệ", !category && "Thiếu category"].filter(Boolean);
      return {
        rowIndex: rowIndex + 2,
        code: values[index("code")] || "Tự sinh",
        title,
        skill,
        category,
        status: errors.length ? "ERROR" : "VALID",
        errorMessage: errors.join("; "),
      } as BulkImportRow;
    });
    setRows(parsed); setFileUploaded(true);
  };

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError("");
    let success = 0; let failed = 0;
    for (const row of rows.filter(value => value.status === "VALID")) {
      try {
        await apiFetch("/admin/library/resources", {
          method: "POST",
          body: JSON.stringify({ title: row.title, description: null, skill: row.skill, category: row.category,
            resourceType: "LINK", scope: "GLOBAL", courseId: null, externalUrl: null, teacherOnly: false, status: "DRAFT" }),
        });
        success += 1;
      } catch { failed += 1; }
    }
    setReport({ success, failed }); setIsImporting(false); setCurrentStep(7);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[22px] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#e3dce2] px-6 py-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f4458]">
              QUY TRÌNH HÀNG LOẠT
            </span>
            <h3 className="font-display text-lg font-bold text-[#211A1D]">
              Nhập dữ liệu hàng loạt (Bulk Import Wizard)
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#746A6E] hover:bg-[#f1eef4]">
            <X size={20} />
          </button>
        </header>

        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-[#e3dce2] bg-[#F8F6FA] px-6 py-3 overflow-x-auto">
          {steps.map((label, idx) => {
            const stepNo = idx + 1;
            const isCurrent = currentStep === stepNo;
            const isDone = currentStep > stepNo;

            return (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <span
                  className={`wizard-step-badge ${
                    isDone ? "wizard-step-done" : isCurrent ? "wizard-step-active" : "wizard-step-pending"
                  }`}
                >
                  {isDone ? <Check size={14} /> : stepNo}
                </span>
                <span
                  className={`text-xs font-bold ${
                    isCurrent ? "text-[#8f4458]" : "text-[#746A6E]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Body */}
        <main className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-5">
          {currentStep === 1 && (
            <div className="space-y-4 text-center py-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7e7ec] text-[#8f4458] mx-auto">
                <FileCsv size={32} />
              </span>
              <h4 className="font-display text-base font-bold text-[#211A1D]">Tải xuống File Mẫu Excel/CSV</h4>
              <p className="mx-auto max-w-md text-xs leading-5 text-[#746A6E]">
                Tải file mẫu chuẩn định dạng đã được cấu hình sẵn các cột Mã, Tên, Kỹ năng, Nhóm nội dung và Mô tả.
              </p>
              <button onClick={downloadTemplate} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447]">
                <DownloadSimple size={18} />
                Tải file mẫu IELTS_Import_Template.csv
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 text-center py-4">
              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#8f4458]/40 bg-[#f7e7ec]/30 p-8 hover:bg-[#f7e7ec]/60 transition">
                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={event => {
                  const file = event.target.files?.[0]; if (file) void readCsv(file);
                }} />
                <UploadSimple size={36} className="mx-auto text-[#8f4458]" />
                <h4 className="mt-3 font-display text-sm font-bold text-[#211A1D]">
                  {fileUploaded ? `Đã đọc ${rows.length} dòng dữ liệu` : "Bấm để chọn file CSV"}
                </h4>
                <p className="mt-1 text-xs text-[#746A6E]">Hỗ trợ CSV UTF-8 (Tối đa 20MB)</p>
              </label>
              {error && <p className="text-xs font-semibold text-[#b4232d]">{error}</p>}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-[#211A1D]">Ánh xạ cột dữ liệu (Column Mapping)</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-[#e3dce2] p-3 text-xs">
                  <span className="font-bold text-[#211A1D]">Cột trong File của bạn: "Code"</span>
                  <span className="text-[#8f4458] font-bold">→ Ánh xạ với: Mã học liệu (Document Code)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#e3dce2] p-3 text-xs">
                  <span className="font-bold text-[#211A1D]">Cột trong File của bạn: "Title"</span>
                  <span className="text-[#8f4458] font-bold">→ Ánh xạ với: Tên học liệu (Title)</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-[#211A1D]">Xem trước dữ liệu (Data Preview)</h4>
              <div className="overflow-hidden rounded-xl border border-[#e3dce2]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f1eef4] font-bold text-[#746A6E]">
                    <tr>
                      <th className="p-2.5">Mã</th>
                      <th className="p-2.5">Tên học liệu</th>
                      <th className="p-2.5">Kỹ năng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3dce2]">
                    {rows.map((r) => (
                      <tr key={r.rowIndex}>
                        <td className="p-2.5 font-bold text-[#8f4458]">{r.code}</td>
                        <td className="p-2.5 font-semibold text-[#211A1D]">{r.title}</td>
                        <td className="p-2.5 text-[#746A6E]">{r.skill}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-[#211A1D]">Kiểm tra lỗi theo từng dòng (Row Validation)</h4>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.rowIndex}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                      r.status === "VALID" ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"
                    }`}
                  >
                    <span className="font-bold text-[#211A1D]">Dòng {r.rowIndex}: {r.title}</span>
                    {r.status === "VALID" ? (
                      <span className="font-bold text-[#237653]">✓ Hợp lệ</span>
                    ) : (
                      <span className="font-bold text-[#b4232d]">✕ Lỗi: {r.errorMessage}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4 text-center py-6">
              <ShieldCheck size={40} className="mx-auto text-[#237653]" />
              <h4 className="font-display text-base font-bold text-[#211A1D]">Sẵn sàng Import các dòng hợp lệ</h4>
              <p className="text-xs text-[#746A6E]">{rows.filter(row => row.status === "VALID").length} dòng hợp lệ sẽ được tạo ở trạng thái nháp; dòng lỗi được bỏ qua.</p>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#8f4458] px-6 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
              >
                {isImporting ? "Đang xử lý import..." : "Tiến hành Import ngay"}
              </button>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4 text-center py-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-[#237653] mx-auto">
                <Check size={32} />
              </span>
              <h4 className="font-display text-lg font-bold text-[#211A1D]">Import dữ liệu hoàn tất!</h4>
              <p className="text-xs font-semibold text-[#237653]">Đã tạo thành công {report.success} học liệu. {report.failed ? `${report.failed} dòng gọi API thất bại.` : ""}</p>
            </div>
          )}
        </main>

        {/* Footer Navigation */}
        <footer className="flex items-center justify-between border-t border-[#e3dce2] bg-white px-6 py-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || currentStep === 7}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#e3dce2] px-4 text-xs font-bold text-[#211A1D] disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>

          {currentStep < 6 && (
            <button
              onClick={handleNext}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white hover:bg-[#743447]"
            >
              <span>Tiếp theo</span>
              <ArrowRight size={16} />
            </button>
          )}

          {currentStep === 7 && (
            <button
              onClick={onClose}
              className="min-h-[40px] rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white hover:bg-[#743447]"
            >
              Hoàn tất & Đóng
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
