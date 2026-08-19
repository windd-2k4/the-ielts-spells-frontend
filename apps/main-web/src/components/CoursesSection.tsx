"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { Clock, Check, X, ArrowRight, Star } from "@phosphor-icons/react";

interface Course {
  id: string;
  category: "kickstart" | "stepping-stone" | "intensive";
  badge: string;
  title: string;
  level: string;
  duration: string;
  target: string;
  highlights: string[];
  description: string;
  popular?: boolean;
  image: string;
  detailImage: string;
}

const COURSES: Course[] = [
  {
    id: "kickstart",
    category: "kickstart",
    badge: "Cơ Bản",
    title: "IELTS Kickstart",
    level: "Mới bắt đầu",
    duration: "12 Tuần (36 buổi)",
    target: "Lấy gốc căn bản & Chuẩn IPA",
    highlights: [
      "Lấy lại gốc từ vựng & ngữ pháp trọng tâm",
      "Chuẩn hóa phát âm bảng IPA quốc tế",
      "Làm quen phản xạ tiếng Anh tự nhiên",
    ],
    description: "Khoá học cơ bản dành cho người mới bắt đầu hoặc mất gốc. Giúp xây dựng nền tảng vững chắc về ngữ pháp, từ vựng cốt lõi và phát âm IPA chuẩn.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    detailImage: "/SteppingStone.jpg",
  },
  {
    id: "stepping-stone",
    category: "stepping-stone",
    badge: "Xây Nền",
    title: "Stepping Stone",
    level: "Đầu vào 4.0+",
    duration: "16 Tuần (48 buổi)",
    target: "Bứt phá 4 kỹ năng cơ bản",
    highlights: [
      "Củng cố kiến thức cho đầu vào từ 4.0+",
      "Chiến thuật làm bài Reading & Listening",
      "Viết đoạn văn & phản xạ Speaking cơ bản",
    ],
    description: "Khoá học xây nền kiến thức vững chắc cho học viên từ 4.0 trở lên. Mở rộng tư duy phát triển câu phức và rèn luyện 4 kỹ năng cơ bản.",
    popular: true,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    detailImage: "/SteppingStone.jpg",
  },
  {
    id: "lr-intensive",
    category: "intensive",
    badge: "Chuyên Sâu (Intensive)",
    title: "Listening & Reading Intensive",
    level: "Chuyên sâu L&R",
    duration: "8 Tuần (24 buổi)",
    target: "Chuyên sâu L&R Band 6.5+",
    highlights: [
      "Chuyên sâu cặp kỹ năng Listening + Reading",
      "Phương pháp Skimming/Scanning khoanh đáp án",
      "Luyện bộ đề dự đoán bẫy thi thật",
    ],
    description: "Khoá học chuyên sâu dành riêng cho cặp kỹ năng Listening & Reading. Tập trung bẫy đề thi thật, chiến thuật Skimming/Scanning và bí kíp khoanh vùng đáp án.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    detailImage: "/IntensiveLR.jpg",
  },
  {
    id: "sw-intensive",
    category: "intensive",
    badge: "Chuyên Sâu (Intensive)",
    title: "Speaking & Writing Intensive",
    level: "Chuyên sâu S&W",
    duration: "10 Tuần (30 buổi)",
    target: "Chuyên sâu S&W Band 6.5+",
    highlights: [
      "Chuyên sâu cặp kỹ năng Speaking + Writing",
      "Chấm chữa bài 1:1 chi tiết từng câu văn",
      "Rèn tư duy phát triển ý luận & phát âm tự nhiên",
    ],
    description: "Khoá học chuyên sâu dành riêng cho cặp kỹ năng Speaking & Writing. Chấm chữa bài 1:1 chi tiết từng câu văn, chuẩn hóa phát âm và tư duy phát triển ý luận.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    detailImage: "/IntensiveSW.jpg",
  },
];

export default function CoursesSection() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses =
    activeTab === "all" ? COURSES : COURSES.filter((c) => c.category === activeTab);

  return (
    <section id="courses" className="section-padding bg-white relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Header & Filter Tabs */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-xl">
              <div className="inline-block px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
                Các Khóa Học IELTS
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18]">
                Lộ trình thiết kế chuẩn <br />
                <span className="text-[#894C5B]">cho từng mục tiêu</span>
              </h2>
              <p className="text-base text-[#5C5752]">
                Chọn khóa học phù hợp với xuất phát điểm và nhu cầu bứt phá của bạn.
              </p>
            </div>

            {/* Tabs Filter */}
            <div className="flex flex-wrap gap-2 bg-[#FEFDF5] p-1.5 rounded-2xl border border-[#F3E8C4]">
              {[
                { id: "all", label: "Tất cả" },
                { id: "kickstart", label: "Khoá Cơ Bản Kickstart" },
                { id: "stepping-stone", label: "Khoá Xây Nền Stepping Stone" },
                { id: "intensive", label: "Khoá Chuyên Sâu (Intensive)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#F5C842] text-[#1E1B18] shadow-sm font-bold"
                      : "text-[#5C5752] hover:text-[#1E1B18] hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCourses.map((course, idx) => (
            <ScrollReveal key={course.id} delay={((idx % 4) + 1) as 1 | 2 | 3}>
              <div
                className={`bg-[#FEFDF5] rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between h-full group hover:shadow-xl ${
                  course.popular
                    ? "border-2 border-[#F5C842] shadow-md relative"
                    : "border-[#F3E8C4] hover:border-[#F5C842]"
                }`}
              >
                {course.popular && (
                  <div className="absolute top-4 right-4 z-10 bg-[#F5C842] text-[#1E1B18] px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1">
                    <Star size={14} weight="fill" />
                    <span>NỔI BẬT</span>
                  </div>
                )}

                <div>
                  {/* Card Image */}
                  <div className="h-48 relative overflow-hidden bg-gray-100">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs gap-2">
                      <span className="bg-[#894C5B] px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap shrink-0">
                        {course.level}
                      </span>
                      <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0">
                        <Clock size={14} className="shrink-0" />
                        <span>{course.duration}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-xl font-bold text-[#1E1B18] group-hover:text-[#894C5B] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#5C5752] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-[#F3E8C4]/60">
                      {course.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#1E1B18]">
                          <Check size={16} weight="bold" className="text-[#F5C842] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="w-full py-3 rounded-2xl border-2 border-[#F5C842] bg-[#F5C842]/10 hover:bg-[#F5C842] text-[#1E1B18] font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>Xem Chi Tiết Khóa Học</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Pure Image Detail Lightbox Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-[#F3E8C4] shadow-2xl relative p-3 sm:p-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-all z-20 shadow-lg backdrop-blur-sm"
              title="Đóng chi tiết"
            >
              <X size={22} weight="bold" />
            </button>

            {/* High-res Poster Image Only */}
            <div className="w-full h-auto rounded-2xl overflow-hidden bg-[#FEFDF5] border border-[#F3E8C4]">
              <img
                src={selectedCourse.detailImage}
                alt={`Chi tiết khóa học ${selectedCourse.title}`}
                className="w-full h-auto object-contain rounded-2xl block"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
