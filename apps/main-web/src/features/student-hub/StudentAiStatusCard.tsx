import { Robot, Sparkle } from "@phosphor-icons/react";

export function StudentAiStatusCard() {
  return (
    <section className="rounded-[22px] border border-[#E8E2D5] dark:border-[#403640] bg-[#F7E5EA] dark:bg-[#392630] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white dark:bg-[#221E24] text-[#894C5B] dark:text-[#E17A9B]">
          <Robot size={23} weight="duotone" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-[#292528] dark:text-[#F5F0F3]">AI Tutor cá nhân hóa</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-[#221E24] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#894C5B] dark:text-[#E17A9B]">
              <Sparkle size={11} weight="fill" /> Đang phát triển
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#6F676C] dark:text-[#BEB2BC]">
            Phân tích lỗi sai và hội thoại AI chưa được cấu hình. Hiện tại lộ trình và khóa học được gợi ý bằng quy tắc minh bạch từ Band mục tiêu, ghi danh và kết quả thật.
          </p>
        </div>
      </div>
    </section>
  );
}
