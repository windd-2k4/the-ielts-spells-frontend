"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { Star, X, CheckCircle, ArrowRight, Sparkle } from "@phosphor-icons/react";

interface Teacher {
  id: string;
  name: string;
  role: string;
  score: string;
  subScore: string;
  avatar: string;
  profileImage: string;
}

const TEACHERS: Teacher[] = [
  {
    id: "jane",
    name: "Ms. Jane",
    role: "Giáo viên",
    score: "IELTS 8.5",
    subScore: "8.5 W - 7.5 S",
    avatar: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20Image/JaneProfile.jpg",
    profileImage: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20gi%C3%A1o%20vi%C3%AAn/Jane.png",
  },
  {
    id: "linh-thuy",
    name: "Ms. Linh Thuỷ",
    role: "Giáo viên",
    score: "IELTS 8.5",
    subScore: "8.0 SW",
    avatar: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20Image/ThuyProfile.jpg",
    profileImage: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20gi%C3%A1o%20vi%C3%AAn/LT.png",
  },
  {
    id: "huynh-phu",
    name: "Mr. Huỳnh Phú",
    role: "Giáo viên",
    score: "IELTS 8.0",
    subScore: "9.0 Listening",
    avatar: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20Image/Phu_profile.png",
    profileImage: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20gi%C3%A1o%20vi%C3%AAn/HP.png",
  },
  {
    id: "phuong-thanh",
    name: "Ms. Phương Thanh",
    role: "Giáo viên",
    score: "IELTS 8.0",
    subScore: "8.0 Writing",
    avatar: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20Image/ThanhProfile.jpg",
    profileImage: "/Profile%20gi%C3%A1o%20vi%C3%AAn/Profile%20gi%C3%A1o%20vi%C3%AAn/PT.png",
  },
];

export default function TeachersSection() {
  const [activeTeacher, setActiveTeacher] = useState<Teacher>(TEACHERS[0]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const scrollToConsultation = () => {
    const element = document.getElementById("consultation");
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section id="teachers" className="section-padding bg-[#FEFDF5] relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-block px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
              Đội Ngũ Giảng Viên
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18]">
              Gặp gỡ các <span className="text-[#894C5B]">"Pháp sư" IELTS</span> đồng hành
            </h2>
            <p className="text-base text-[#5C5752]">
              100% giảng viên sở hữu IELTS 8.0 - 8.5+ Overall. Chọn giảng viên ở danh sách bên trái để xem profile chi tiết và bằng cấp chứng chỉ.
            </p>
          </div>
        </ScrollReveal>

        {/* Master-Detail Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          {/* Left Column: Teacher Selector Grid + Quality Commitment Box */}
          <div className="lg:col-span-5 space-y-5">
            {/* 2x2 Teacher Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {TEACHERS.map((teacher) => {
                const isSelected = activeTeacher.id === teacher.id;
                return (
                  <button
                    key={teacher.id}
                    onClick={() => setActiveTeacher(teacher)}
                    className={`p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group ${
                      isSelected
                        ? "bg-[#F7E5EA] border-[#894C5B] shadow-lg ring-2 ring-[#894C5B]/20 -translate-y-0.5"
                        : "bg-white border-[#F3E8C4] hover:border-[#F5C842] hover:bg-[#FEF9C3]/40 shadow-sm"
                    }`}
                  >
                    {/* Active Indicator Pin */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-[#894C5B]">
                        <CheckCircle size={18} weight="fill" />
                      </div>
                    )}

                    {/* Circle Avatar (From Profile Image folder) */}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 mb-3 shadow-md shrink-0 transition-transform group-hover:scale-105 ${
                        isSelected ? "border-[#894C5B]" : "border-[#F5C842]"
                      }`}
                    >
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Info */}
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1E1B18] line-clamp-1">
                      {teacher.name}
                    </h3>
                    <p className="text-xs text-[#894C5B] font-semibold mt-0.5 line-clamp-1">
                      {teacher.role}
                    </p>

                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/80 rounded-full border border-[#F3E8C4] text-[10px] font-bold text-[#1E1B18]">
                      <Star size={12} weight="fill" className="text-[#F5C842]" />
                      <span>{teacher.score}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quality Commitment & Guidance Box */}
            <div className="bg-gradient-to-br from-[#FEF9C3]/80 via-white to-[#F7E5EA]/80 rounded-3xl p-5 border border-[#F3E8C4] shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 text-[#894C5B] font-extrabold text-sm">
                <Sparkle size={20} weight="fill" className="text-[#F5C842]" />
                <span>Cam Kết Chất Lượng Giảng Dạy</span>
              </div>

              <ul className="space-y-2.5 text-xs text-[#1E1B18] font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-[#F5C842] shrink-0 mt-0.5" />
                  <span>100% Giảng viên đạt IELTS 8.0 - 8.5+ Overall &amp; chứng chỉ sư phạm chuẩn</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-[#F5C842] shrink-0 mt-0.5" />
                  <span>Chấm chữa bài 1:1 chi tiết từng câu văn &amp; rèn phản xạ Speaking thực chiến</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-[#F5C842] shrink-0 mt-0.5" />
                  <span>Theo sát lộ trình cá nhân hóa giúp học viên bứt phá band điểm mục tiêu</span>
                </li>
              </ul>

              <button
                onClick={scrollToConsultation}
                className="w-full mt-2 py-3 rounded-2xl bg-[#894C5B] hover:bg-[#6D3B48] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <span>Tư Vấn Chọn Giảng Viên Phù Hợp</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Right Column: Active Teacher Spotlight Details Poster */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#F3E8C4] shadow-xl relative overflow-hidden group">
              {/* Header inside Showcase card */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F3E8C4]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-extrabold text-[#1E1B18]">
                      {activeTeacher.name}
                    </h3>
                    <span className="bg-[#F5C842] text-[#1E1B18] px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1">
                      <Star size={12} weight="fill" />
                      {activeTeacher.score}
                    </span>
                  </div>
                  <p className="text-xs text-[#894C5B] font-bold mt-0.5">
                    {activeTeacher.role} • {activeTeacher.subScore}
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#F5C842] hover:bg-[#E5B520] text-[#1E1B18] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Xem chi tiết profile"
                >
                  <span>Xem Chi Tiết</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>

              {/* Profile Image Banner Container */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="relative rounded-2xl overflow-hidden bg-[#FEFDF5] border border-[#F3E8C4] cursor-pointer group/img"
              >
                <img
                  src={activeTeacher.profileImage}
                  alt={`Profile & bằng cấp ${activeTeacher.name}`}
                  className="w-full h-auto object-contain rounded-2xl block transition-transform duration-300 group-hover/img:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-black/75 text-white text-xs font-bold rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
                    <ArrowRight size={16} weight="bold" />
                    Bấm để xem chi tiết profile &amp; bằng cấp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Detail Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-[#F3E8C4] shadow-2xl relative p-3 sm:p-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-all z-20 shadow-lg backdrop-blur-sm"
              title="Đóng"
            >
              <X size={22} weight="bold" />
            </button>

            <div className="w-full h-auto rounded-2xl overflow-hidden bg-[#FEFDF5] border border-[#F3E8C4]">
              <img
                src={activeTeacher.profileImage}
                alt={`Chi tiết profile ${activeTeacher.name}`}
                className="w-full h-auto object-contain rounded-2xl block"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
