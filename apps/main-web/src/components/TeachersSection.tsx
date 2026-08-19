"use client";

import ScrollReveal from "./ScrollReveal";
import { Certificate, Star, Quotes } from "@phosphor-icons/react";

const TEACHERS = [
  {
    name: "Ms. Jane",
    role: "Writing & Speaking Specialist",
    score: "IELTS 8.5",
    subScore: "8.5W - 7.5S",
    exp: "IELTS 8.5 Overall",
    bio: "__________________Updating________________________",
    image: "/Jane.jpg",
    quote: "________________Updating_________________________",
    bgColor: "from-[#F5C842]/10 to-[#894C5B]/5",
  },
  {
    name: "Ms. Linh Thuỷ",
    role: "Speaking & Writing Mentor",
    score: "IELTS 8.5",
    subScore: "8.0 S-W",
    exp: "IELTS 8.5 Overall",
    bio: "__________________Updating________________________",
    image: "/Linh.jpg",
    quote: "__________________Updating________________________",
    bgColor: "from-[#894C5B]/10 to-[#F5C842]/5",
  },
];

export default function TeachersSection() {
  return (
    <section id="teachers" className="section-padding bg-[#FEFDF5] relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-block px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
              Đội Ngũ Giảng Viên
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18]">
              Gặp gỡ các <span className="text-[#894C5B]">"Pháp sư" IELTS</span> đồng hành
            </h2>
            <p className="text-base text-[#5C5752]">
              100% giảng viên sở hữu IELTS 8.5 Overall, tinh thần tận tâm đồng hành cùng học viên bứt phá mục tiêu.
            </p>
          </div>
        </ScrollReveal>

        {/* Teachers Grid - 2 Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {TEACHERS.map((teacher, idx) => (
            <ScrollReveal key={idx} delay={((idx % 2) + 1) as 1 | 2}>
              <div className="bg-white rounded-3xl overflow-hidden border-2 border-[#F3E8C4] hover:border-[#F5C842] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group p-5">
                <div className="space-y-5">
                  {/* Photo Frame */}
                  <div className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b ${teacher.bgColor} border border-[#F3E8C4] p-3 flex items-center justify-center`}>
                    <img
                      src={teacher.image}
                      alt={teacher.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 filter drop-shadow-lg"
                      style={{ imageRendering: "crisp-edges" }}
                    />

                    {/* Band Badge Overlay */}
                    <div className="absolute top-3 right-3 bg-[#F5C842] text-[#1E1B18] px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5 border border-white">
                      <Star size={14} weight="fill" />
                      <span>{teacher.score}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4 px-1">
                    <div>
                      <p className="text-xs font-extrabold text-[#894C5B] uppercase tracking-wider">{teacher.role}</p>
                      <h3 className="font-display text-2xl font-extrabold text-[#1E1B18] mt-0.5">{teacher.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#894C5B] font-bold bg-[#F7E5EA] px-3 py-1.5 rounded-xl w-fit border border-[#F3E8C4]">
                      <Certificate size={16} weight="bold" />
                      <span>{teacher.exp} ({teacher.subScore})</span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#5C5752] leading-relaxed">
                      {teacher.bio}
                    </p>

                    <div className="p-4 rounded-2xl bg-[#FEFDF5] border border-[#F3E8C4] italic text-xs text-[#1E1B18] space-y-1.5 relative">
                      <Quotes size={18} className="text-[#F5C842]" weight="fill" />
                      <p className="leading-relaxed font-medium">"{teacher.quote}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
