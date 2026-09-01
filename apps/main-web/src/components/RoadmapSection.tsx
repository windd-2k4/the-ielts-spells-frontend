"use client";

import ScrollReveal from "./ScrollReveal";
import { Path, NumberCircleOne, NumberCircleTwo, NumberCircleThree, NumberCircleFour, Star } from "@phosphor-icons/react";

const STAGES = [
  {
    num: "01",
    title: "Xây nền (Foundation)",
    subtitle: "Level 4.0 - 5.0+",
    desc: "Củng cố ngữ pháp ứng dụng, nạp từ vựng chủ đề và chuẩn hóa tư duy phát triển câu phức.",
    icon: NumberCircleOne,
  },
  {
    num: "02",
    title: "Kỹ năng (Skillset)",
    subtitle: "Level 4.5 - 5.5",
    desc: "Rèn tư duy Skimming/Scanning, nắm vững bố cục bài luận Writing Task 1 & 2 và phản xạ Part 1 Speaking.",
    icon: NumberCircleTwo,
  },
  {
    num: "03",
    title: "Chiến thuật (Strategies)",
    subtitle: "Level 5.0 - 6.5+",
    desc: "Làm chủ phương pháp né bẫy Listening/Reading, nâng cấp cấu trúc câu phức và tự tin thảo luận Part 2&3.",
    icon: NumberCircleThree,
  },
  {
    num: "04",
    title: "Bứt phá (Mastery)",
    subtitle: "Target 7.0 - 8.5",
    desc: "Luyện giải bộ đề dự đoán sát thực tế, chấm chữa 1:1 chuyên sâu và thi thử dưới áp lực phòng thi.",
    icon: NumberCircleFour,
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="section-padding bg-[#1E1B18] text-white relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F5C842]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#894C5B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="lp-container relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FEF9C3]/10 text-[#F5C842] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F5C842]/20">
              <Path size={16} />
              <span>Lộ Trình Đào Tạo</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              Hành trình bứt phá từ mất gốc <br />
              <span className="text-[#F5C842]">đến Band điểm ước mơ</span>
            </h2>
            <p className="text-base text-white/70">
              Mỗi giai đoạn được thiết kế đồng bộ giúp bạn tự tin tiến bước mà không bị ngợp hay nản lòng.
            </p>
          </div>
        </ScrollReveal>

        {/* Roadmap Steps */}
        <div className="relative">
          {/* Progress Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C842]/20 via-[#F5C842] to-[#894C5B] -translate-y-1/2 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {STAGES.map((stage, idx) => {
              const isLast = idx === STAGES.length - 1;
              return (
                <ScrollReveal key={idx} delay={((idx + 1) as 1 | 2 | 3)}>
                  <div className="bg-[#282420] p-6 rounded-3xl border border-white/10 hover:border-[#F5C842] transition-all flex flex-col justify-between h-full group">
                    <div className="space-y-4">
                      {/* Step Badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-extrabold text-lg shadow-md transition-transform group-hover:scale-110 ${
                            isLast
                              ? "bg-[#F5C842] text-[#1E1B18]"
                              : "bg-white/10 text-[#F5C842] group-hover:bg-[#F5C842] group-hover:text-[#1E1B18]"
                          }`}
                        >
                          {isLast ? <Star size={24} weight="fill" /> : stage.num}
                        </div>
                        <span className="text-xs font-bold text-[#F5C842] bg-[#F5C842]/10 px-3 py-1 rounded-full border border-[#F5C842]/20">
                          {stage.subtitle}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-display text-lg font-bold text-white group-hover:text-[#F5C842] transition-colors">
                          {stage.title}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {stage.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                      <span>Bước {idx + 1} / 4</span>
                      <span className="text-[#F5C842]">Chất lượng 8.0+</span>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
