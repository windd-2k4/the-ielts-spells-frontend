import { Robot, Sparkle } from "@phosphor-icons/react";

export function StudentAiStatusCard() {
  return (
    <section className="rounded-[22px] border border-[#E8E2D5] bg-[#F7E5EA] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#894C5B]">
          <Robot size={23} weight="duotone" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-[#292528]">AI Tutor cá nhân hóa</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#894C5B]">
              <Sparkle size={11} weight="fill" /> Đang phát triển
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#6F676C]">
            Phân tích lỗi sai và hội thoại AI chưa được cấu hình. Hiện tại lộ trình và khóa học được gợi ý bằng quy tắc minh bạch từ Band mục tiêu, ghi danh và kết quả thật.
          </p>
        </div>
      </div>
    </section>
  );
}
