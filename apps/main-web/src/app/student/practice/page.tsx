"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Headphones, Microphone, PencilCircle } from "@phosphor-icons/react";

const skills = [
  { id: "reading", name: "Reading", description: "Làm các đề Reading đã được xuất bản và giao cho khóa học của bạn.", available: true, href: "/student/reading", icon: <BookOpenText size={23} weight="duotone" /> },
  { id: "listening", name: "Listening", description: "Player và ngân hàng đề Listening đang được hoàn thiện.", available: false, href: "#", icon: <Headphones size={23} weight="duotone" /> },
  { id: "writing", name: "Writing", description: "Luồng nộp bài và giáo viên chấm Writing đang được hoàn thiện.", available: false, href: "#", icon: <PencilCircle size={23} weight="duotone" /> },
  { id: "speaking", name: "Speaking", description: "Luồng ghi âm và nhận phản hồi Speaking đang được hoàn thiện.", available: false, href: "#", icon: <Microphone size={23} weight="duotone" /> },
];

export default function StudentPracticePage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Luyện tập kỹ năng</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Luyện đề IELTS</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Chỉ những kỹ năng đã có quy trình xuất bản và chấm điểm thật mới được mở.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill) => (
          <article key={skill.id} className="rounded-[22px] border border-[#E8E2D5] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F7E5EA] text-[#894C5B]">{skill.icon}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${skill.available ? "bg-[#E8F7EF] text-[#247052]" : "bg-[#F7F5F4] text-[#6F676C]"}`}>
                {skill.available ? "Sẵn sàng" : "Đang phát triển"}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#292528]">IELTS {skill.name}</h3>
            <p className="mt-2 min-h-10 text-xs leading-5 text-[#6F676C]">{skill.description}</p>
            {skill.available ? (
              <Link href={skill.href} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#894C5B] px-4 text-xs font-bold text-white hover:bg-[#753E4B]">Mở bài được giao <ArrowRight size={14} weight="bold" /></Link>
            ) : (
              <button type="button" disabled className="mt-5 min-h-11 w-full rounded-xl bg-[#F7F5F4] px-4 text-xs font-bold text-[#9A9296]">Chưa khả dụng</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
