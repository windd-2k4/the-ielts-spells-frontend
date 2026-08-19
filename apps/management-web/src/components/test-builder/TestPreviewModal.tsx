import {
  Desktop, DeviceMobile, DeviceTablet, Eye, EyeSlash, X,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { TestBankItem } from "../../library-types";

type Props = {
  test: TestBankItem;
  onClose: () => void;
};

export default function TestPreviewModal({ test, onClose }: Props) {
  const [device, setDevice] = useState<"DESKTOP" | "TABLET" | "MOBILE">("DESKTOP");
  const [mode, setMode] = useState<"TAKE" | "REVIEW">("TAKE");
  const [showAnswers, setShowAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Controls Bar */}
      <header className="flex shrink-0 items-center justify-between rounded-xl bg-white px-6 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f4458]">
              CHẾ ĐỘ XEM TRƯỚC GIẢ LẬP HỌC VIÊN
            </span>
            <h3 className="font-display text-sm font-bold text-[#211A1D]">{test.title}</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">
            {test.skill} • {test.durationMinutes} phút
          </span>
        </div>

        {/* Controls: Device & Mode & Toggles */}
        <div className="flex items-center gap-4">
          {/* Device Frame Switcher */}
          <div className="flex items-center rounded-xl bg-[#f1eef4] p-1">
            <button
              onClick={() => setDevice("DESKTOP")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                device === "DESKTOP" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Desktop"
            >
              <Desktop size={18} />
            </button>
            <button
              onClick={() => setDevice("TABLET")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                device === "TABLET" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Tablet"
            >
              <DeviceTablet size={18} />
            </button>
            <button
              onClick={() => setDevice("MOBILE")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                device === "MOBILE" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Mobile"
            >
              <DeviceMobile size={18} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-[#e3dce2] bg-white p-1">
            <button
              onClick={() => setMode("TAKE")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                mode === "TAKE" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
              }`}
            >
              Chế độ làm bài
            </button>
            <button
              onClick={() => setMode("REVIEW")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                mode === "REVIEW" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
              }`}
            >
              Chế độ xem lại
            </button>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 border-l border-[#e3dce2] pl-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#746A6E]">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
                className="accent-[#8f4458]"
              />
              Hiện đáp án
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-[#746A6E]">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={(e) => setShowExplanations(e.target.checked)}
                className="accent-[#8f4458]"
              />
              Hiện giải thích
            </label>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1eef4] text-[#211A1D] hover:bg-rose-50 hover:text-[#b4232d]"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Device Frame Viewport Container */}
      <main className="custom-scrollbar flex flex-1 items-center justify-center overflow-auto p-4">
        <div
          className={`bg-white transition-all duration-300 overflow-hidden flex flex-col shadow-2xl ${
            device === "DESKTOP"
              ? "preview-desktop rounded-[20px]"
              : device === "TABLET"
              ? "preview-tablet"
              : "preview-mobile"
          }`}
        >
          {/* Simulated Student Header */}
          <div className="flex items-center justify-between border-b border-[#e3dce2] bg-[#F8F6FA] px-6 py-3">
            <span className="font-display text-sm font-bold text-[#8f4458]">The IELTS Spells Student Exam</span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#b4232d]">
              Thời gian còn lại: 58:24
            </span>
          </div>

          {/* Simulated Test Body */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-xl border border-[#e3dce2] bg-[#f7e7ec]/30 p-4">
              <h4 className="font-display text-sm font-bold text-[#743447]">
                READING PASSAGE 1: The Impact of Artificial Intelligence on Modern Meteorology
              </h4>
              <p className="mt-2 text-xs leading-6 text-[#211A1D]">
                Weather forecasting has undergone a revolutionary transformation in recent years, driven primarily by advancements in artificial intelligence (AI) and machine learning algorithms...
              </p>
            </div>

            {/* Questions preview */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[#e3dce2] p-4 space-y-2">
                <p className="text-xs font-bold text-[#211A1D]">
                  Question 1: Numerical weather prediction models process massive thermodynamic equations.
                </p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${showAnswers ? "bg-emerald-50 border-emerald-300 text-[#237653]" : "bg-white"}`}>
                    TRUE {showAnswers && "✓ (Đáp án đúng)"}
                  </span>
                  <span className="px-3 py-1 rounded-lg border text-xs text-[#746A6E]">FALSE</span>
                  <span className="px-3 py-1 rounded-lg border text-xs text-[#746A6E]">NOT GIVEN</span>
                </div>
                {showExplanations && (
                  <p className="mt-2 text-xs text-[#746A6E] bg-[#f1eef4] p-2.5 rounded-lg border border-[#e3dce2]">
                    💡 <strong>Giải thích:</strong> Đoạn 1 nêu rõ NWP models thực thi các phương trình nhiệt động lực học.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
