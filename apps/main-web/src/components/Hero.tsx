"use client";

import ScrollReveal from "./ScrollReveal";
import { Sparkle, MagicWand, Star, ArrowRight, CheckCircle } from "@phosphor-icons/react";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#FEFDF5]">
      {/* Decorative Radial Pastel Glow Highlights */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#FEF9C3] rounded-full blur-3xl opacity-70 -z-10 animate-soft-pulse" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#FDE68A]/40 rounded-full blur-3xl -z-10" />

      <div className="lp-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF9C3] text-[#894C5B] rounded-full border border-[#F3E8C4] shadow-sm font-semibold text-xs uppercase tracking-wider">
                <MagicWand size={18} weight="fill" className="text-[#F5C842]" />
                <span>The IELTS Spells • Học Thuật Kỳ Diệu</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E1B18] leading-[1.1] tracking-tight">
                Cast the Spells, <br />
                <span className="relative inline-block text-[#894C5B] italic">
                  Claim the Band
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-[#F5C842]/40 -z-10 rounded" />
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <p className="text-lg sm:text-xl text-[#5C5752] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Chinh phục IELTS bằng một lộ trình rõ ràng, kết hợp giữa phương pháp học thuật tinh gọn và sự hỗ trợ từ các giáo viên từ 8.0 - 8.5 IELTS hàng đầu.
              </p>
            </ScrollReveal>

            {/* Quick Core Benefits List */}
            <ScrollReveal delay={2}>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2 text-sm text-[#1E1B18] font-medium">
                <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-[#F3E8C4]">
                  <CheckCircle size={18} weight="fill" className="text-[#F5C842]" />
                  <span>Hỗ Trợ Tận Tâm</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-[#F3E8C4]">
                  <CheckCircle size={18} weight="fill" className="text-[#F5C842]" />
                  <span>Đội ngũ giảng viên chuyên nghiệp</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-[#F3E8C4]">
                  <CheckCircle size={18} weight="fill" className="text-[#F5C842]" />
                  <span>Sỉ số nhóm nhỏ</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Call to Actions */}
            <ScrollReveal delay={3}>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => scrollToSection("consultation")}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-[#F5C842] text-[#1E1B18] hover:bg-[#E5B520] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  <span>Tư Vấn & Test Đầu Vào</span>
                  <ArrowRight size={18} weight="bold" />
                </button>
                <button
                  onClick={() => scrollToSection("courses")}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-white text-[#894C5B] border-2 border-[#894C5B]/20 hover:bg-[#F7E5EA] transition-all flex items-center justify-center gap-2"
                >
                  <span>Khám Phá Khóa Học</span>
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Hero Visual Sticker & Badges */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <ScrollReveal delay={2}>
              <div className="relative mx-auto max-w-md">
                {/* Main Sticker Image Card */}
                <div className="sticker-card rounded-3xl overflow-hidden bg-white aspect-[4/5] relative">
                  <img
                    src="/banner.png"
                    alt="Giảng viên IELTS Spells hướng dẫn học viên"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Subtle Pastel Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/60 via-transparent to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#FDE68A]">IELTS Academic Master</p>
                    <p className="text-xl font-bold font-display">Luyện Thi IELTS Chuẩn Tác Phong</p>
                    <p className="text-xs text-white/80">Phương pháp tư duy logic &amp; Phản xạ tự nhiên</p>
                  </div>
                </div>

                {/* Floating Badge 1: Sparkle Icon Top Right */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#F5C842] text-[#894C5B] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white animate-float">
                  <Sparkle size={36} weight="fill" />
                </div>

                {/* Floating Badge 2: Stats Badge Bottom Left */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-[#F3E8C4] flex items-center gap-3 animate-float" style={{ animationDelay: "1.5s" }}>
                  <div className="w-12 h-12 rounded-xl bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center">
                    <Star size={24} weight="fill" className="text-[#F5C842]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#1E1B18] font-display">Tăng từ 0.5-1.5 Band</p>
                    <p className="text-xs text-[#5C5752] font-medium">Sau mỗi khóa học</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
