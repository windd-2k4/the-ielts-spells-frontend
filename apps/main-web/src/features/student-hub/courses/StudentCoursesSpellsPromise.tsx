"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Robot,
  GraduationCap,
  Sparkle,
  CaretRight,
  CheckCircle,
} from "@phosphor-icons/react";

export function StudentCoursesSpellsPromise() {
  const pillars = [
    {
      icon: ShieldCheck,
      badge: "Pháp Lý & Cam Kết",
      title: "Cam Kết Đầu Ra Bằng Văn Bản",
      description:
        "Ký kết hợp đồng đào tạo pháp lý trước khai giảng. Học viên được hỗ trợ học lại hoặc bổ trợ miễn phí nếu đáp ứng 90% điều kiện chuyên cần mà chưa đạt Band mục tiêu.",
      highlights: ["Hợp đồng pháp lý minh bạch", "Bảo lưu kết quả linh hoạt", "Hỗ trợ học lại không phụ phí"],
      accentColor: "#F4C430",
    },
    {
      icon: Robot,
      badge: "Học Liệu & Công Nghệ",
      title: "Giảng Viên 8.5+ & AI Tutor 24/7",
      description:
        "Sự kết hợp giữa đội ngũ giảng viên giàu kinh nghiệm thực chiến và Trợ lý AI The Spells hỗ trợ tra cứu từ vựng, giải thích chi tiết đáp án và phân tích điểm yếu.",
      highlights: ["Giảng viên chuyên môn cao", "AI giải thích đề thi", "Hỗ trợ học tập 24/7"],
      accentColor: "#A5B4FC",
    },
    {
      icon: GraduationCap,
      badge: "Mô Phỏng Thực Chiến",
      title: "Phòng Thi Chuẩn IDP & BC",
      description:
        "Luyện đề trên giao diện Computer-Delivered chính xác như kỳ thi thật tại IDP và British Council. Ngân hàng đề thi bám sát xu hướng khảo thí thực tế.",
      highlights: ["Giao diện CD thi thật", "Ngân hàng đề cập nhật", "Phân tích điểm số chi tiết"],
      accentColor: "#6EE7B7",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#241a20] via-[#1c1318] to-[#140d12] p-8 md:p-12 text-white shadow-xl border border-[#F4C430]/25">
      {/* Background Decorative Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#894C5B]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#F4C430]/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#F4C430_0.7px,transparent_0.7px)] opacity-10 [background-size:22px_22px]" />

      <div className="relative z-10 space-y-10">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#894C5B]/40 border border-[#F4C430]/40 text-[#FDE047] text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
            <Sparkle size={13} weight="fill" className="text-[#F4C430]" />
            <span>The Spells Guarantee</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
            Cam Kết Đào Tạo Chuẩn{" "}
            <span className="bg-gradient-to-r from-[#FDE047] via-[#F4C430] to-[#E5A817] bg-clip-text text-transparent">
              The IELTS Spells
            </span>
          </h2>

          <p className="mt-3 text-sm text-amber-100/75 leading-relaxed font-light">
            Mỗi chương trình học tại The IELTS Spells là một lộ trình được bảo chứng toàn diện về phương pháp học thuật, chuyên môn giảng dạy và sự đồng hành tận tâm.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl bg-white/[0.04] p-7 backdrop-blur-md border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#F4C430]/40 hover:bg-white/[0.08]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${pillar.accentColor}15`,
                        borderColor: `${pillar.accentColor}40`,
                        color: pillar.accentColor,
                      }}
                    >
                      <Icon size={22} weight="bold" />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-[#FDE047] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed font-light mb-5">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  {pillar.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-white/85 font-medium">
                      <CheckCircle size={14} weight="fill" className="shrink-0 text-[#F4C430]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Consultation & Test Level Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-5 rounded-2xl bg-gradient-to-r from-[#894C5B]/40 to-[#F4C430]/10 border border-[#F4C430]/30">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430]/20 border border-[#F4C430]/40 flex items-center justify-center text-[#F4C430] shrink-0">
              <GraduationCap size={22} weight="bold" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Chưa chắc chắn về Band điểm hiện tại?</h4>
              <p className="text-xs text-white/70">
                Thực hiện bài kiểm tra trình độ trên hệ thống mô phỏng để nhận tư vấn lộ trình chuẩn xác.
              </p>
            </div>
          </div>

          <Link
            href="/student/practice"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F4C430] to-[#E5A817] text-[#241a20] text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
          >
            <span>Luyện Thi Thử Ngay</span>
            <CaretRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
