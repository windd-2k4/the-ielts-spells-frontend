"use client";

import Link from "next/link";
import { ArrowRight, Brain, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { StudentAiStatusCard } from "@/features/student-hub/StudentAiStatusCard";

export default function StudentAITutorPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Trợ lý học tập</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">AI Tutor</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Khu vực giải thích lỗi sai và đề xuất bài luyện theo năng lực cá nhân.</p>
      </header>
      <StudentAiStatusCard />
      <section className="rounded-[22px] border border-[#E8E2D5] bg-white p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FEF9C3] text-[#894C5B]"><Brain size={23} weight="duotone" /></span>
          <div>
            <h3 className="font-bold text-[#292528]">Trong lúc chờ AI Tutor</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#6F676C]">
              <li className="flex gap-2"><CheckCircle size={18} className="mt-0.5 shrink-0 text-[#247052]" />Hoàn thành bài Reading được giao để tích lũy dữ liệu thật.</li>
              <li className="flex gap-2"><CheckCircle size={18} className="mt-0.5 shrink-0 text-[#247052]" />Đặt Band mục tiêu để nhận gợi ý khóa học theo quy tắc hiện tại.</li>
              <li className="flex gap-2"><Sparkle size={18} className="mt-0.5 shrink-0 text-[#894C5B]" />Khi AI được cấu hình, lịch sử này sẽ là đầu vào cho đề xuất cá nhân hóa.</li>
            </ul>
            <Link href="/student/assignments" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#894C5B] px-4 text-xs font-bold text-white">Xem bài của tôi <ArrowRight size={14} weight="bold" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
