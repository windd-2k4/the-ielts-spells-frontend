"use client";

import { useState, FormEvent } from "react";
import ScrollReveal from "./ScrollReveal";
import { PaperPlaneRight, CheckCircle, Sparkle, PhoneCall, ShieldCheck, Spinner } from "@phosphor-icons/react";

export default function ConsultationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    currentBand: "0-3.0",
    targetBand: "6.5",
    course: "stepping-stone",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.fullName.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 9) {
      setErrorMessage("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9-10 chữ số).");
      return;
    }

    setIsSubmitting(true);

    // Simulate async submission call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <section id="consultation" className="section-padding bg-[#FEFDF5] relative">
      <div className="lp-container">
        <div className="bg-white rounded-3xl border-2 border-[#F5C842] shadow-2xl p-8 sm:p-12 relative overflow-hidden">
          {/* Top Decorative Sparkle Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FEF9C3] rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FEF9C3] text-[#894C5B] rounded-full text-xs font-bold uppercase tracking-wider border border-[#F3E8C4]">
                  <Sparkle size={16} weight="fill" className="text-[#F5C842]" />
                  <span>Tư Vấn Miễn Phí</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={1}>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E1B18] leading-tight">
                  Nhận tư vấn lộ trình <br />
                  <span className="text-[#894C5B]">&amp; Test đầu vào 0đ</span>
                </h2>
              </ScrollReveal>

              <ScrollReveal delay={2}>
                <p className="text-sm sm:text-base text-[#5C5752] leading-relaxed">
                  Đội ngũ cố vấn chuyên môn tại The IELTS Spells sẽ liên hệ đánh giá hổng kiến thức và đề xuất lộ trình tinh gọn nhất cho mục tiêu của bạn.
                </p>
              </ScrollReveal>

              {/* Guarantees List */}
              <ScrollReveal delay={2}>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#1E1B18]">
                    <CheckCircle size={20} weight="fill" className="text-[#F5C842] shrink-0" />
                    <span>Bài kiểm tra xếp lớp 4 kỹ năng chuẩn IDP/BC</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#1E1B18]">
                    <CheckCircle size={20} weight="fill" className="text-[#F5C842] shrink-0" />
                    <span>Phân tích chi tiết điểm mạnh &amp; hổng kiến thức</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#1E1B18]">
                    <CheckCircle size={20} weight="fill" className="text-[#F5C842] shrink-0" />
                    <span>Tặng kèm bộ tài liệu từ vựng IELTS Spells độc quyền</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Hotlines */}
              <ScrollReveal delay={3}>
                <div className="p-4 rounded-2xl bg-[#FEFDF5] border border-[#F3E8C4] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F5C842] text-[#1E1B18] flex items-center justify-center shrink-0 shadow-sm">
                    <PhoneCall size={24} weight="bold" />
                  </div>
                  <div>
                    <p className="text-xs text-[#5C5752]">Hotline Hỗ Trợ Direct:</p>
                    <p className="font-display text-xs sm:text-sm font-bold text-[#894C5B]">0374.253.258 (Ms. Jane) - 0382.715.051 (Ms. Linh Thuỷ)</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={1}>
                {isSubmitted ? (
                  <div className="p-8 sm:p-10 bg-[#FEFDF5] rounded-3xl border border-[#F3E8C4] text-center space-y-6 animate-in zoom-in-95">
                    <div className="w-20 h-20 rounded-full bg-[#FEF9C3] text-[#894C5B] flex items-center justify-center mx-auto border-4 border-[#F5C842]">
                      <CheckCircle size={48} weight="fill" className="text-[#F5C842]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-extrabold text-[#1E1B18]">
                        Đăng Ký Thành Công!
                      </h3>
                      <p className="text-sm text-[#5C5752] max-w-md mx-auto">
                        Cảm ơn <strong>{formData.fullName}</strong> đã tin tưởng The IELTS Spells. Chuyên viên tư vấn sẽ liên hệ với bạn qua SĐT <strong>{formData.phone}</strong> trong vòng 15 phút tới!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          fullName: "",
                          phone: "",
                          email: "",
                          currentBand: "0-3.0",
                          targetBand: "6.5",
                          course: "stepping-stone",
                          notes: "",
                        });
                      }}
                      className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#F5C842] text-[#1E1B18] hover:bg-[#E5B520] transition-all"
                    >
                      Gửi yêu cầu mới
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-[#FEFDF5] rounded-3xl border border-[#F3E8C4] space-y-4">
                    <div className="border-b border-[#F3E8C4] pb-3 mb-2">
                      <h3 className="font-display text-xl font-bold text-[#1E1B18]">
                        Điền Thông Tin Tiếp Nhận Tư Vấn
                      </h3>
                      <p className="text-xs text-[#5C5752]">Cam kết bảo mật thông tin cá nhân 100%</p>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                        {errorMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1E1B18]">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Nguyễn Văn An"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1E1B18]">Số điện thoại (Zalo) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="Ví dụ: 0988123456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1B18]">Địa chỉ Email</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1E1B18]">Trình độ hiện tại</label>
                        <select
                          value={formData.currentBand}
                          onChange={(e) => setFormData({ ...formData, currentBand: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                        >
                          <option value="0-3.0">Mất gốc / Mới bắt đầu (0 - 3.0)</option>
                          <option value="3.0-5.0">Nền tảng căn bản (3.0 - 5.0)</option>
                          <option value="5.0-6.0">Khá (5.0 - 6.0)</option>
                          <option value="6.0+">Nâng cao (6.0+)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1E1B18]">Mục tiêu Band điểm</label>
                        <select
                          value={formData.targetBand}
                          onChange={(e) => setFormData({ ...formData, targetBand: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                        >
                          <option value="5.5">Mục tiêu 5.5 Band</option>
                          <option value="6.5">Mục tiêu 6.5 Band (Dấu mốc chuẩn)</option>
                          <option value="7.0">Mục tiêu 7.0 Band</option>
                          <option value="7.5+">Mục tiêu 7.5 - 8.5 Band</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1B18]">Khóa học quan tâm</label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                      >
                        <option value="kickstart">Khoá Cơ Bản Kickstart (Cho người mới bắt đầu)</option>
                        <option value="stepping-stone">Khoá Xây Nền Stepping Stone (Đầu vào 4.0+)</option>
                        <option value="lr-intensive">Khoá Chuyên Sâu Listening &amp; Reading Intensive</option>
                        <option value="sw-intensive">Khoá Chuyên Sâu Speaking &amp; Writing Intensive</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E1B18]">Ghi chú thêm (Không bắt buộc)</label>
                      <textarea
                        rows={2}
                        placeholder="Thời gian rảnh, mong muốn riêng..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#F3E8C4] bg-white text-sm text-[#1E1B18] focus:outline-none focus:border-[#F5C842] focus:ring-2 focus:ring-[#F5C842]/20 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-[#F5C842] hover:bg-[#E5B520] text-[#1E1B18] font-extrabold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size={20} className="animate-spin" />
                          <span>Đang gửi thông tin...</span>
                        </>
                      ) : (
                        <>
                          <PaperPlaneRight size={20} weight="bold" />
                          <span>Đăng Ký Tư Vấn &amp; Test Đầu Vào</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
