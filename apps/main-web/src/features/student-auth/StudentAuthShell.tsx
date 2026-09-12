import { BookOpenText, CheckCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export function StudentAuthShell({ children, compact = false }: Props) {
  return <main className="grid min-h-dvh bg-[#2e2729] lg:grid-cols-[42%_58%]">
    <aside className={`relative hidden min-h-dvh overflow-hidden border-r border-white/10 px-[clamp(2.5rem,5vw,6rem)] text-white lg:flex lg:flex-col lg:justify-between ${compact ? "py-7" : "py-10"}`}>
      <div className="pointer-events-none absolute -bottom-48 -right-48 size-[620px] rounded-full border border-[#df8f9d]/25" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-[420px] rounded-full border border-[#df8f9d]/20" aria-hidden="true" />

      <Link href="/" className="relative z-10 inline-flex min-h-11 w-fit items-center gap-3 rounded-xl pr-3 font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c94c]">
        <img className="size-12 rounded-full border border-white/20 object-cover" src="/logo.jpg" alt="" />
        <span>The IELTS Spells</span>
      </Link>

      <div className={`relative z-10 max-w-xl ${compact ? "py-7" : "py-14"}`}>
        <p className="flex items-center gap-2 text-sm font-bold text-[#f1a4b2]"><Sparkle size={18} weight="fill" aria-hidden="true" /> Cast the spells, claim the band</p>
        <h2 className={`max-w-[10ch] font-display font-extrabold leading-[1.04] tracking-[-0.045em] ${compact ? "mt-4 text-[clamp(2.6rem,4.1vw,4.35rem)]" : "mt-6 text-[clamp(2.75rem,4.7vw,5rem)]"}`}>Học đúng trọng tâm. Tiến bộ có bằng chứng.</h2>
        <p className={`max-w-lg text-base text-[#d8ced1] ${compact ? "mt-5 leading-6" : "mt-7 leading-7"}`}>Một tài khoản để nhận bài, tiếp tục phần đang làm và theo dõi kết quả Reading trong suốt lộ trình.</p>
      </div>

      <div className={`relative z-10 flex max-w-lg items-start gap-4 border-t border-white/10 ${compact ? "pt-4" : "pt-6"}`}>
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5c94c] text-[#2e2729]"><BookOpenText size={23} weight="fill" aria-hidden="true" /></div>
        <div>
          <p className="font-bold">Không mất tiến độ đang học</p>
          <p className="mt-1 flex items-center gap-2 text-sm leading-6 text-[#bfb3b7]"><CheckCircle className="shrink-0 text-[#83d9b3]" size={18} weight="fill" aria-hidden="true" /> Bài được giao, câu trả lời và kết quả luôn ở đúng chỗ</p>
        </div>
      </div>
    </aside>

    <section className={`min-h-dvh bg-[var(--surface)] px-5 sm:px-8 lg:px-[clamp(4rem,8vw,9rem)] ${compact ? "py-4 lg:py-5" : "py-6 lg:py-8"}`}>
      <div className={`mx-auto flex w-full max-w-[440px] flex-col ${compact ? "min-h-[calc(100dvh-2rem)] lg:min-h-[calc(100dvh-2.5rem)]" : "min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100dvh-4rem)]"}`}>
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3 rounded-xl pr-3 font-bold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">
            <img className="size-10 rounded-full border border-[var(--border)] object-cover" src="/logo.jpg" alt="" />
            <span>The IELTS Spells</span>
          </Link>
        </div>
        <div className={`my-auto ${compact ? "py-1" : "py-2"}`}>{children}</div>
        <p className={`${compact ? "mt-3" : "mt-8"} text-center text-sm text-[var(--text-muted)]`}>Cần hỗ trợ? <a className="font-bold text-[var(--brand-pink)] underline decoration-transparent underline-offset-4 transition hover:decoration-current" href="mailto:support@theieltssspells.vn">Liên hệ trung tâm</a></p>
      </div>
    </section>
  </main>;
}
