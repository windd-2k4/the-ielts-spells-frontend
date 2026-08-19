import { Command, X } from "@phosphor-icons/react";

type Props = {
  onClose: () => void;
};

const shortcuts = [
  { key: "Ctrl/Cmd + S", description: "Lưu nháp tiến độ đề thi ngay lập tức" },
  { key: "Ctrl/Cmd + P", description: "Mở chế độ Xem trước giả lập học viên (Preview)" },
  { key: "Ctrl/Cmd + Enter", description: "Lưu câu hỏi hiện tại và tự động thêm câu mới" },
  { key: "Alt + Mũi tên Lên/Xuống", description: "Thay đổi thứ tự sắp xếp câu hỏi" },
  { key: "Tab", description: "Di chuyển qua lại giữa các ô nhập liệu hợp lý" },
  { key: "?", description: "Mở hộp thoại Xem danh sách Phím tắt này" },
];

export default function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
              <Command size={18} />
            </span>
            <h3 className="font-display text-base font-bold text-[#211A1D]">Danh sách Phím tắt (Shortcuts)</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#746A6E] hover:bg-[#f1eef4]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between rounded-xl border border-[#e3dce2] bg-[#F8F6FA] p-3 text-xs"
            >
              <span className="text-[#746A6E] font-medium">{sc.description}</span>
              <kbd className="rounded-lg border border-[#e3dce2] bg-white px-2.5 py-1 font-mono font-bold text-[#8f4458] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="min-h-[40px] rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
