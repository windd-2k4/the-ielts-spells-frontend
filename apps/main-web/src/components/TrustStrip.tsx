"use client";

import ScrollReveal from "./ScrollReveal";
import { Users, GraduationCap, Trophy, ChalkboardTeacher } from "@phosphor-icons/react";

const METRICS = [
  {
    icon: Users,
    value: "100+",
    label: "Học viên mới / tháng",
    subtext: "Hệ thống học viên tăng trưởng đều đặn",
  },
  {
    icon: GraduationCap,
    value: "88%",
    label: "Hoàn thành mục tiêu",
    subtext: "Đạt band cam kết sau lộ trình",
  },
  {
    icon: Trophy,
    value: "8.5",
    label: "Band điểm cao nhất",
    subtext: "Nhiều học viên đạt 8.0 - 8.5 Listening/Reading",
  },
  {
    icon: ChalkboardTeacher,
    value: "5+",
    label: "Giảng viên IELTS 8.0+",
    subtext: "100% có chứng chỉ sư phạm quốc tế",
  },
];

export default function TrustStrip() {
  return (
    <section className="py-12 bg-[#1E1B18] text-white border-y border-[#38332E]">
      <div className="lp-container">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {METRICS.map((metric, idx) => {
              const IconComp = metric.icon;
              return (
                <div
                  key={idx}
                  className={`text-center space-y-2 ${idx > 0 ? "pt-6 md:pt-0 md:pl-6" : ""}`}
                >
                  <div className="inline-flex p-3 rounded-2xl bg-[#FEF9C3]/10 text-[#F5C842] mb-1">
                    <IconComp size={28} weight="duotone" />
                  </div>
                  <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5C842]">
                    {metric.value}
                  </p>
                  <p className="text-sm font-semibold text-white/90">{metric.label}</p>
                  <p className="text-xs text-white/60">{metric.subtext}</p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
