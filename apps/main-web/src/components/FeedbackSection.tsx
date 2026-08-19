"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { MagnifyingGlassPlus, X, Trophy, Sparkle } from "@phosphor-icons/react";

interface HonorStudent {
  id: number;
  name: string;
  band: string;
  subscores: string;
  image: string;
}

const BANG_VANG_ITEMS: HonorStudent[] = [
  {
    id: 1,
    name: "Nhật Minh",
    band: "Overall 7.5",
    subscores: "L 8.5 • R 9.0 • W 6.5 • S 6.5",
    image: "/Bảng Vàng/Bảng Vàng/1.jpg",
  },
  {
    id: 2,
    name: "Mai Hương",
    band: "Overall 6.0",
    subscores: "L 6.0 • R 6.0 • W 6.5 • S 6.0",
    image: "/Bảng Vàng/Bảng Vàng/2.jpg",
  },
  {
    id: 3,
    name: "Thanh Trà",
    band: "Overall 6.0",
    subscores: "L 5.0 • R 6.5 • W 6.5 • S 5.5",
    image: "/Bảng Vàng/Bảng Vàng/3.jpg",
  },
  {
    id: 4,
    name: "Học Viên Spells 04",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/4.jpg",
  },
  {
    id: 5,
    name: "Học Viên Spells 05",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/5.jpg",
  },
  {
    id: 6,
    name: "Học Viên Spells 06",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/6.jpg",
  },
  {
    id: 7,
    name: "Học Viên Spells 07",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/7.jpg",
  },
  {
    id: 8,
    name: "Học Viên Spells 08",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/8.jpg",
  },
];

export default function FeedbackSection() {
  const [selectedStudent, setSelectedStudent] = useState<HonorStudent | null>(null);

  return (
    <section id="feedback" className="section-padding bg-[#FEFDF5] relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
              <Trophy size={16} weight="fill" className="text-[#F5C842]" />
              <span>Bảng Vàng Vinh Danh</span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1E1B18] tracking-tight">
              Tiến bộ được thể hiện bằng kết quả
            </h2>
            
            <p className="text-base sm:text-lg text-[#5C5752] font-medium">
              Câu chuyện thật từ các học viên đã "luyện phép" thành công.
            </p>
          </div>
        </ScrollReveal>

        {/* Bảng Vàng Grid Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {BANG_VANG_ITEMS.map((item, idx) => (
            <ScrollReveal key={item.id} delay={((idx % 4) + 1) as 1 | 2 | 3}>
              <div
                onClick={() => setSelectedStudent(item)}
                className="bg-white rounded-3xl overflow-hidden border-2 border-[#F3E8C4] hover:border-[#F5C842] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer relative"
              >
                {/* Poster Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 p-2">
                  <img
                    src={item.image}
                    alt={`Bảng vàng vinh danh ${item.name}`}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Hover Overlay with Zoom Icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center rounded-2xl m-2">
                    <div className="w-12 h-12 rounded-full bg-[#F5C842] text-[#1E1B18] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <MagnifyingGlassPlus size={24} weight="bold" />
                    </div>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 z-10 bg-[#894C5B] text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1">
                    <Sparkle size={12} weight="fill" className="text-[#F5C842]" />
                    <span>{item.band}</span>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="p-4 space-y-1 text-center bg-[#FEFDF5] border-t border-[#F3E8C4]">
                  <h3 className="font-display text-base font-extrabold text-[#1E1B18] group-hover:text-[#894C5B] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#5C5752] font-semibold">
                    {item.subscores}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Pure High-Res Lightbox Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto border border-[#F3E8C4] shadow-2xl relative p-3 sm:p-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-all z-20 shadow-lg backdrop-blur-sm"
              title="Đóng Bảng Vàng"
            >
              <X size={22} weight="bold" />
            </button>

            {/* High-Res Bảng Vàng Image */}
            <div className="w-full h-auto rounded-2xl overflow-hidden bg-[#FEFDF5]">
              <img
                src={selectedStudent.image}
                alt={`Bảng vàng vinh danh ${selectedStudent.name}`}
                className="w-full h-auto object-contain rounded-2xl block mx-auto max-h-[88vh]"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
