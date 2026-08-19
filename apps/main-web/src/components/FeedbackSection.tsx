"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import {
  MagnifyingGlassPlus,
  X,
  Trophy,
  Sparkle,
  Quotes,
  CheckCircle,
  ChatTeardropText,
  CaretRight,
} from "@phosphor-icons/react";

interface HonorStudent {
  id: number;
  name: string;
  band: string;
  subscores: string;
  image: string;
}

interface IntensiveFeedback {
  id: number;
  name: string;
  image: string;
  highlight: string;
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
    name: "Đan Khanh",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/4.jpg",
  },
  {
    id: 5,
    name: "Thảo Duyên",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/5.jpg",
  },
  {
    id: 6,
    name: "Tiến Lộc",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/6.jpg",
  },
  {
    id: 7,
    name: "Minh Thư",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/7.jpg",
  },
  {
    id: 8,
    name: "Thu Trang",
    band: "Thành Tích Xuất Sắc",
    subscores: "Bứt phá Band điểm",
    image: "/Bảng Vàng/Bảng Vàng/8.jpg",
  },
];

const INTENSIVE_LR_FEEDBACKS: IntensiveFeedback[] = [
  {
    id: 1,
    name: "Diễm Quỳnh",
    image: "/Intensive LR/Intensive LR/Diễm Quỳnh.PNG",
    highlight: "Đã tiết kiệm 1/4 thời gian khi áp dụng Dual Track, thừa 5-7p check bài",
  },
  {
    id: 2,
    name: "Gia Linh",
    image: "/Intensive LR/Intensive LR/Gia Linh.PNG",
    highlight: "Tài liệu hệ thống rõ ràng, cung cấp 80% từ vựng bài đọc",
  },
  {
    id: 3,
    name: "Hoàng Linh",
    image: "/Intensive LR/Intensive LR/Hoàng Linh.PNG",
    highlight: "Làm bài Reading 20p đúng hết, Listening tập trung nghe hiểu tốt hơn",
  },
  {
    id: 4,
    name: "Khánh Linh",
    image: "/Intensive LR/Intensive LR/Khánh Linh.PNG",
    highlight: "Cách hướng dẫn chỉ bài, tìm keywords dễ hiểu hơn trước rất nhiều",
  },
  {
    id: 5,
    name: "Hồng Phúc",
    image: "/Intensive LR/Intensive LR/Hồng Phúc.PNG",
    highlight: "Học đúng phương pháp, điểm Listening & Reading tăng vượt bậc",
  },
  {
    id: 6,
    name: "Thảo My",
    image: "/Intensive LR/Intensive LR/Thảo My.PNG",
    highlight: "Thấy rõ sự tiến bộ từng ngày qua báo cáo chi tiết từ giáo viên",
  },
];

interface LightboxItem {
  image: string;
  title: string;
  subtitle?: string;
}

export default function FeedbackSection() {
  const [selectedItem, setSelectedItem] = useState<LightboxItem | null>(null);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  return (
    <section id="feedback" className="section-padding bg-[#FEFDF5] relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Main Header */}
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
                onClick={() =>
                  setSelectedItem({
                    image: item.image,
                    title: `Bảng Vàng Vinh Danh: ${item.name}`,
                    subtitle: `${item.band} • ${item.subscores}`,
                  })
                }
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
                  <p className="text-xs text-[#5C5752] font-semibold">{item.subscores}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Extension Section: "VÀ CÒN HƠN THẾ NỮA..." */}
        <div className="mt-20 pt-16 border-t-2 border-dashed border-[#F3E8C4]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Stacked Image Cards Deck (Cụm ảnh xếp lớp 3D) */}
            <div className="lg:col-span-6">
              <ScrollReveal>
                <div className="relative group mx-auto max-w-md lg:max-w-none flex justify-center items-center py-6 sm:py-10">
                  {/* Background Soft Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F5C842]/20 via-[#F7E5EA]/30 to-[#FEF9C3]/40 rounded-3xl blur-3xl -z-10 group-hover:scale-105 transition-transform duration-500" />

                  {/* Stacked Cards Frame */}
                  <div className="relative w-[230px] sm:w-[270px] h-[330px] sm:h-[390px] flex items-center justify-center">
                    {/* Stack Hover Hint Badge */}
                    <div className="absolute -top-5 -right-2 sm:-right-6 z-40 bg-[#894C5B] text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-lg border-2 border-white flex items-center gap-1.5 animate-bounce">
                      <Sparkle size={14} weight="fill" className="text-[#F5C842]" />
                      <span>Rê chuột để xòe ảnh ✨</span>
                    </div>

                    {/* Card 1 - Backmost Left */}
                    <div
                      onClick={() =>
                        setSelectedItem({
                          image: INTENSIVE_LR_FEEDBACKS[0].image,
                          title: `Feedback Học Viên ${INTENSIVE_LR_FEEDBACKS[0].name}`,
                          subtitle: INTENSIVE_LR_FEEDBACKS[0].highlight,
                        })
                      }
                      className="absolute w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-[#FFFDF0] shadow-md group-hover:shadow-xl bg-white transition-all duration-500 ease-out cursor-pointer transform -rotate-12 -translate-x-10 translate-y-3 group-hover:-rotate-[18deg] group-hover:-translate-x-24 group-hover:translate-y-1 hover:!z-50 hover:!scale-105 group/card"
                    >
                      <img
                        src={INTENSIVE_LR_FEEDBACKS[0].image}
                        alt={`Feedback ${INTENSIVE_LR_FEEDBACKS[0].name}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover/card:bg-transparent transition-colors" />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[11px] font-bold text-center border border-white/20">
                        {INTENSIVE_LR_FEEDBACKS[0].name} • Reading 8.0
                      </div>
                    </div>

                    {/* Card 2 - Backmost Right */}
                    <div
                      onClick={() =>
                        setSelectedItem({
                          image: INTENSIVE_LR_FEEDBACKS[1].image,
                          title: `Feedback Học Viên ${INTENSIVE_LR_FEEDBACKS[1].name}`,
                          subtitle: INTENSIVE_LR_FEEDBACKS[1].highlight,
                        })
                      }
                      className="absolute w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-[#FFFDF0] shadow-md group-hover:shadow-xl bg-white transition-all duration-500 ease-out cursor-pointer transform rotate-12 translate-x-10 translate-y-5 group-hover:rotate-[18deg] group-hover:translate-x-24 group-hover:translate-y-3 hover:!z-50 hover:!scale-105 group/card"
                    >
                      <img
                        src={INTENSIVE_LR_FEEDBACKS[1].image}
                        alt={`Feedback ${INTENSIVE_LR_FEEDBACKS[1].name}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover/card:bg-transparent transition-colors" />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[11px] font-bold text-center border border-white/20">
                        {INTENSIVE_LR_FEEDBACKS[1].name} • Intensive LR
                      </div>
                    </div>

                    {/* Card 3 - Middle Layer */}
                    <div
                      onClick={() =>
                        setSelectedItem({
                          image: INTENSIVE_LR_FEEDBACKS[2].image,
                          title: `Feedback Học Viên ${INTENSIVE_LR_FEEDBACKS[2].name}`,
                          subtitle: INTENSIVE_LR_FEEDBACKS[2].highlight,
                        })
                      }
                      className="absolute w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-[#FFFDF0] shadow-lg group-hover:shadow-2xl bg-white transition-all duration-500 ease-out cursor-pointer transform -rotate-4 -translate-y-2 group-hover:-rotate-6 group-hover:-translate-y-8 hover:!z-50 hover:!scale-105 z-10 group/card"
                    >
                      <img
                        src={INTENSIVE_LR_FEEDBACKS[2].image}
                        alt={`Feedback ${INTENSIVE_LR_FEEDBACKS[2].name}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[11px] font-bold text-center border border-white/20">
                        {INTENSIVE_LR_FEEDBACKS[2].name} • Listening &amp; Reading
                      </div>
                    </div>

                    {/* Card 4 - Top Front Main Card */}
                    <div
                      onClick={() =>
                        setSelectedItem({
                          image: INTENSIVE_LR_FEEDBACKS[3].image,
                          title: `Feedback Học Viên ${INTENSIVE_LR_FEEDBACKS[3].name}`,
                          subtitle: INTENSIVE_LR_FEEDBACKS[3].highlight,
                        })
                      }
                      className="absolute w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-[#FFFDF0] shadow-2xl bg-white transition-all duration-500 ease-out cursor-pointer transform rotate-2 group-hover:rotate-0 group-hover:scale-105 z-20 hover:!z-50 group/card"
                    >
                      <img
                        src={INTENSIVE_LR_FEEDBACKS[3].image}
                        alt={`Feedback ${INTENSIVE_LR_FEEDBACKS[3].name}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#F5C842] text-[#1E1B18] flex items-center justify-center shadow-lg transform scale-90 group-hover/card:scale-100 transition-transform">
                          <MagnifyingGlassPlus size={24} weight="bold" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-[#1E1B18]/85 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center justify-between border border-white/10 shadow-md">
                        <span>{INTENSIVE_LR_FEEDBACKS[3].name}</span>
                        <span className="text-[#F5C842] text-[11px] px-2 py-0.5 rounded-full bg-white/10">Intensive LR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Large Motivational Quote & Extension Text */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal>
                <div className="space-y-5">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FEF9C3] text-[#894C5B] rounded-full border border-[#F3E8C4] shadow-sm font-extrabold text-xs uppercase tracking-wider">
                    <ChatTeardropText size={16} weight="fill" className="text-[#894C5B]" />
                    <span>Và Còn Hơn Thế Nữa...</span>
                  </div>

                  {/* Large Inspiring Quote (Phông to) */}
                  <div className="relative pl-6 border-l-4 border-[#F5C842] space-y-3 pt-1">
                    <Quotes size={48} weight="fill" className="text-[#894C5B]/15 absolute -top-4 -left-3 -z-10" />
                    <blockquote className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E1B18] leading-snug sm:leading-tight tracking-tight">
                      “Thành công trong IELTS không đến từ sự may mắn ngắn hạn, mà là quả ngọt của những nỗ lực bền bỉ và phương pháp đúng đắn mỗi ngày.”
                    </blockquote>
                    <p className="text-xs sm:text-sm font-bold text-[#894C5B] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-8 h-0.5 bg-[#894C5B]/40 inline-block" />
                      <span>Triết Lý Học Thuật Spells Academic</span>
                    </p>
                  </div>

                  {/* Subtitle & Narrative */}
                  <p className="text-base sm:text-lg text-[#5C5752] font-medium leading-relaxed">
                    Hàng trăm tin nhắn trao đổi bài tập, lời cảm ơn chân thành và báo điểm bứt phá từ các học viên lớp{" "}
                    <strong className="text-[#894C5B]">Intensive Listening &amp; Reading</strong> chính là minh chứng rõ nhất cho sự đồng hành 1:1 tận tâm và lộ trình học chuẩn xác.
                  </p>

                  {/* Feature Highlights Bullets */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2.5 text-sm text-[#1E1B18] font-bold">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Chữa bài chi tiết 1:1 &amp; Sửa lỗi tư duy làm bài trực tiếp</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-[#1E1B18] font-bold">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Phương pháp Dual Track giúp làm Reading thừa 5-10 phút check đáp án</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-[#1E1B18] font-bold">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Nghe hiểu sâu bản chất thay vì học thuộc lòng hay bắt từ khóa ngẫu nhiên</span>
                    </div>
                  </div>

                  {/* Toggle Gallery Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#894C5B] text-white font-extrabold text-sm hover:bg-[#723d4b] active:scale-95 transition-all shadow-md hover:shadow-lg"
                    >
                      <span>{showAllFeedbacks ? "Thu gọn kho feedback" : "Khám phá tất cả feedback Intensive LR"}</span>
                      <CaretRight size={16} weight="bold" className={`transition-transform duration-300 ${showAllFeedbacks ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Expanded Gallery Grid for All Intensive LR Feedbacks */}
          {showAllFeedbacks && (
            <div className="mt-12 pt-8 border-t border-[#F3E8C4] animate-in fade-in slide-in-from-top-4 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-extrabold text-[#1E1B18]">
                    Kho Phản Hồi Chân Thực • Intensive LR
                  </h3>
                  <p className="text-sm text-[#5C5752] font-medium">
                    Nhấp vào từng hình ảnh để xem toàn màn hình đoạn trao đổi và báo điểm của học viên.
                  </p>
                </div>
                <div className="px-3 py-1 bg-[#FEF9C3] text-[#894C5B] border border-[#F3E8C4] rounded-full text-xs font-bold">
                  {INTENSIVE_LR_FEEDBACKS.length} Hình Ảnh Phản Hồi
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {INTENSIVE_LR_FEEDBACKS.map((fb) => (
                  <div
                    key={fb.id}
                    onClick={() =>
                      setSelectedItem({
                        image: fb.image,
                        title: `Phản Hồi Học Viên ${fb.name}`,
                        subtitle: fb.highlight,
                      })
                    }
                    className="bg-white rounded-3xl overflow-hidden border-2 border-[#F3E8C4] hover:border-[#F5C842] shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer p-2 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-50">
                      <img
                        src={fb.image}
                        alt={`Feedback ${fb.name}`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#F5C842] text-[#1E1B18] flex items-center justify-center shadow-lg">
                          <MagnifyingGlassPlus size={20} weight="bold" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 text-center space-y-1">
                      <p className="font-display font-extrabold text-[#1E1B18] text-sm group-hover:text-[#894C5B] transition-colors">
                        {fb.name}
                      </p>
                      <p className="text-xs text-[#5C5752] font-semibold line-clamp-2">{fb.highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Pure High-Res Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto border border-[#F3E8C4] shadow-2xl relative p-3 sm:p-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F3E8C4] pr-10">
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#1E1B18]">{selectedItem.title}</h3>
                {selectedItem.subtitle && (
                  <p className="text-xs text-[#894C5B] font-semibold">{selectedItem.subtitle}</p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-all z-20 shadow-lg backdrop-blur-sm"
              title="Đóng xem chi tiết"
            >
              <X size={20} weight="bold" />
            </button>

            {/* High-Res Image Container */}
            <div className="w-full h-auto rounded-2xl overflow-hidden bg-[#FEFDF5] border border-[#F3E8C4]">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-auto object-contain rounded-2xl block mx-auto max-h-[80vh]"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

