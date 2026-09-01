"use client";

import ScrollReveal from "./ScrollReveal";
import { CheckCircle, Target, Brain, ChartLineUp } from "@phosphor-icons/react";

const PILLARS = [
  {
    icon: Target,
    title: "Đúng trình độ đầu vào",
    desc: "Bài test xếp lớp 4 kỹ năng chuẩn IELTS giúp xác định chính xác hổng kiến thức và thiết kế lộ trình cá nhân hóa.",
  },
  {
    icon: Brain,
    title: "Đúng phương pháp học thuật",
    desc: "Tập trung vào bản chất ngôn ngữ, chiến thuật giải đề thông minh thay vì học vẹt hay học thuộc lòng đề mẫu.",
  },
  {
    icon: ChartLineUp,
    title: "Theo dõi tiến độ liên tục",
    desc: "Hệ thống báo cáo điểm số hàng tuần cùng phản hồi chi tiết từ giáo viên giúp bạn thấy rõ sự tăng trưởng từng ngày.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="section-padding bg-white relative overflow-hidden border-b border-[#F3E8C4]">
      <div className="lp-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Visual Classroom Image */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <ScrollReveal>
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FFFDF0] aspect-[4/3]">
                  <img
                    src="/gioithieu.png"
                    alt="Không gian lớp học The IELTS Spells"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/40 via-transparent to-transparent" />
                </div>

                {/* Floating Highlight Card */}
                <div className="absolute -bottom-6 -right-4 sm:right-6 bg-[#FFFDF0] border-2 border-[#F5C842] p-5 rounded-2xl shadow-xl max-w-xs space-y-1">
                  <div className="flex items-center gap-2 text-[#894C5B] font-bold text-sm">
                    <CheckCircle size={20} weight="fill" className="text-[#F5C842]" />
                    <span>Lớp học sỉ số nhóm nhỏ</span>
                  </div>
                  <p className="text-xs text-[#5C5752]">
                    Đảm bảo từng học viên đều được giáo viên trực tiếp sửa bài và thực hành Speaking hàng buổi.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Narrative & Pillars */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
            <ScrollReveal>
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
                  Về The IELTS Spells
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18] leading-tight">
                  Không chỉ học IELTS — <br />
                  <span className="text-[#894C5B] italic">bạn học cách tiến bộ</span>
                </h2>
                <p className="text-base sm:text-lg text-[#5C5752] leading-relaxed">
                  Tại The IELTS Spells, chúng tôi tin rằng mỗi học viên đều sở hữu tiềm năng bứt phá. Chúng tôi mang tới giải pháp tinh gọn, giúp bạn chinh phục bằng tư duy học thuật thực chất thay vì áp lực học mẹo.
                </p>
              </div>
            </ScrollReveal>

            {/* Core Pillars List */}
            <div className="space-y-6">
              {PILLARS.map((pillar, idx) => {
                const IconComp = pillar.icon;
                return (
                  <ScrollReveal key={idx} delay={(idx + 1) as 1 | 2 | 3}>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FEFDF5] border border-[#F3E8C4] hover:bg-[#FEF9C3]/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-[#F5C842] text-[#1E1B18] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <IconComp size={24} weight="bold" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display text-base font-bold text-[#1E1B18]">{pillar.title}</h3>
                        <p className="text-sm text-[#5C5752] leading-relaxed">{pillar.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
