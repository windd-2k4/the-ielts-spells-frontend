"use client";

import ScrollReveal from "./ScrollReveal";
import { ChartLineUp, Handshake, CheckCircle, Clock, ShieldCheck, Sparkle, ArrowRight } from "@phosphor-icons/react";

export default function BenefitsSection() {
  return (
    <section id="benefits" className="section-padding bg-[#FEFDF5] relative border-b border-[#F3E8C4]">
      <div className="lp-container">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
              <Sparkle size={16} weight="fill" className="text-[#F5C842]" />
              <span>Quyền Lợi Học Viên</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18]">
              Đồng hành sát sao &amp; <br />
              <span className="text-[#894C5B]">Theo dõi tiến độ học tập thực tế</span>
            </h2>
            <p className="text-base text-[#5C5752]">
              Tại The IELTS Spells, chúng tôi đảm bảo trải nghiệm học tập minh bạch, nơi sự tiến bộ của bạn được đo lường chính xác và hỗ trợ liên tục.
            </p>
          </div>
        </ScrollReveal>

        {/* 2 Primary Core Student Benefits with Authentic Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Benefit 1: Progress Tracking */}
          <ScrollReveal delay={1}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#F3E8C4] hover:border-[#F5C842] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full group">
              <div className="space-y-6">
                {/* Image Showcase with Rounded Corners & Sticker Effect */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#F3E8C4] aspect-[16/10] bg-gray-100 shadow-md group-hover:scale-[1.01] transition-transform duration-500">
                  <img
                    src="/kiemtratiendo.jpg"
                    alt="Kiểm tra & theo dõi tiến độ học tập IELTS Spells"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-4 right-4 bg-[#F5C842] text-[#1E1B18] px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1">
                    <ChartLineUp size={16} weight="bold" />
                    <span>Cập nhật Realtime</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center font-bold shrink-0">
                      <ChartLineUp size={26} weight="duotone" />
                    </div>
                    <h3 className="font-display text-2xl font-extrabold text-[#1E1B18] group-hover:text-[#894C5B] transition-colors">
                      Theo Dõi Tiến Độ &amp; Đánh Giá Năng Lực
                    </h3>
                  </div>

                  <p className="text-sm text-[#5C5752] leading-relaxed">
                    Hệ thống báo cáo chi tiết theo dõi từng kỹ năng Listening, Reading, Writing, Speaking. Học viên và phụ huynh dễ dàng thấy rõ sự tăng trưởng band điểm và các điểm cần cải thiện sau từng bài test.
                  </p>

                  <div className="space-y-2 pt-3 border-t border-[#F3E8C4]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Báo cáo kết quả kiểm tra định kỳ 4 kỹ năng chuẩn IELTS</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Phân tích chính xác lỗ hổng kiến thức để bù đắp kịp thời</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Minh bạch tình trạng điểm danh, lịch học và lộ trình cá nhân</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#F3E8C4] flex items-center justify-between text-xs font-bold text-[#894C5B]">
                <span>Quyền lợi quản lý học tập độc quyền</span>
                <span className="flex items-center gap-1 text-[#1E1B18] group-hover:translate-x-1 transition-transform">
                  Chi tiết <ArrowRight size={14} weight="bold" />
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Benefit 2: Student Care & Support */}
          <ScrollReveal delay={2}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#F3E8C4] hover:border-[#F5C842] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full group">
              <div className="space-y-6">
                {/* Image Showcase with Rounded Corners & Sticker Effect */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#F3E8C4] aspect-[16/10] bg-gray-100 shadow-md group-hover:scale-[1.01] transition-transform duration-500">
                  <img
                    src="/chamsochocsinh.jpg"
                    alt="Chăm sóc & hỗ trợ học viên tận tâm The IELTS Spells"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-4 right-4 bg-[#894C5B] text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1">
                    <Handshake size={16} weight="bold" />
                    <span>Đồng hành 1:1</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center font-bold shrink-0">
                      <Handshake size={26} weight="duotone" />
                    </div>
                    <h3 className="font-display text-2xl font-extrabold text-[#1E1B18] group-hover:text-[#894C5B] transition-colors">
                      Chăm Sóc &amp; Hỗ Trợ Học Viên Tận Tâm
                    </h3>
                  </div>

                  <p className="text-sm text-[#5C5752] leading-relaxed">
                    Đội ngũ cố vấn học tập và giảng viên đồng hành sát sao cùng từng học viên. Luôn sẵn sàng giải đáp thắc mắc bài tập, đôn đốc lịch học và hỗ trợ tinh thần giúp học viên duy trì động lực cao nhất.
                  </p>

                  <div className="space-y-2 pt-3 border-t border-[#F3E8C4]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Trợ giảng &amp; cố vấn giải đáp thắc mắc bài tập 24/7</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Nhắc nhở lịch học &amp; bổ trợ kiến thức riêng cho học viên nghỉ</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18]">
                      <CheckCircle size={18} weight="fill" className="text-[#F5C842] shrink-0" />
                      <span>Tư vấn định hướng chiến thuật thi và tâm lý phòng thi thực tế</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#F3E8C4] flex items-center justify-between text-xs font-bold text-[#894C5B]">
                <span>Dịch vụ hỗ trợ học viên tận tâm</span>
                <span className="flex items-center gap-1 text-[#1E1B18] group-hover:translate-x-1 transition-transform">
                  Chi tiết <ArrowRight size={14} weight="bold" />
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Supporting Guarantees Bar Below */}
        <ScrollReveal delay={3}>
          <div className="mt-12 p-6 rounded-3xl bg-white border border-[#F3E8C4] shadow-sm flex flex-wrap items-center justify-around gap-6 text-center">
            <div className="flex items-center gap-3 text-sm font-bold text-[#1E1B18]">
              <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center">
                <ShieldCheck size={22} weight="fill" className="text-[#F5C842]" />
              </div>
              <span>Cam Kết Đầu Ra Bằng Hợp Đồng</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-bold text-[#1E1B18]">
              <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center">
                <Clock size={22} weight="fill" className="text-[#F5C842]" />
              </div>
              <span>Lớp Học Sĩ Số Tinh Gọn 20-25 Bạn</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-bold text-[#1E1B18]">
              <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center">
                <Sparkle size={22} weight="fill" className="text-[#F5C842]" />
              </div>
              <span>Giáo Trình Học Thuật Tinh Gọn</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
