"use client";

import { BrandMark } from "@ielts/ui";
import { Phone, EnvelopeSimple, Clock, FacebookLogo, InstagramLogo, TiktokLogo, MonitorPlay } from "@phosphor-icons/react";

export default function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#1E1B18] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      <div className="lp-container relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-2.5 text-xl font-bold">
              <img
                src="/logo.jpg"
                alt="The IELTS Spells Logo"
                className="w-9 h-9 rounded-full object-cover shadow-sm shrink-0 border border-white/20"
              />
              <BrandMark />
            </div>

            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              Hệ thống đào tạo IELTS Online chất lượng cao với phương pháp học thuật tinh gọn Spells Academic. Học 100% Online qua Zoom linh hoạt và đồng hành 1:1.
            </p>

            {/* Social Channels - Icons Only */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com/the.ielts.spells1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C842] hover:bg-[#F5C842] hover:text-[#1E1B18] transition-all hover:scale-105 shadow-sm"
                aria-label="Facebook Page"
                title="Facebook: facebook.com/the.ielts.spells1"
              >
                <FacebookLogo size={22} weight="fill" />
              </a>
              <a
                href="https://www.tiktok.com/@theieltsspells"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C842] hover:bg-[#F5C842] hover:text-[#1E1B18] transition-all hover:scale-105 shadow-sm"
                aria-label="TikTok Channel"
                title="TikTok: @theieltsspells"
              >
                <TiktokLogo size={22} weight="fill" />
              </a>
              <a
                href="https://www.instagram.com/theieltsspells"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C842] hover:bg-[#F5C842] hover:text-[#1E1B18] transition-all hover:scale-105 shadow-sm"
                aria-label="Instagram Page"
                title="Instagram: @theieltsspells"
              >
                <InstagramLogo size={22} weight="fill" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-display text-base font-bold text-[#F5C842] uppercase tracking-wider">
              Khám Phá Spells
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <button onClick={() => scrollToSection("hero")} className="hover:text-[#F5C842] transition-colors">
                  Trang Chủ
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("about")} className="hover:text-[#F5C842] transition-colors">
                  Giới Thiệu Phương Pháp
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("courses")} className="hover:text-[#F5C842] transition-colors">
                  Các Khóa Học IELTS
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("teachers")} className="hover:text-[#F5C842] transition-colors">
                  Đội Ngũ Giảng Viên 8.5
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("feedback")} className="hover:text-[#F5C842] transition-colors">
                  Bảng Vàng Học Viên
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("consultation")} className="hover:text-[#F5C842] transition-colors">
                  Đăng Ký Test Đầu Vào 0đ
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-display text-base font-bold text-[#F5C842] uppercase tracking-wider">
              Thông Tin Liên Hệ &amp; Tư Vấn
            </h4>

            <div className="space-y-4 text-sm text-white/80">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <MonitorPlay size={22} className="text-[#F5C842] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block text-xs uppercase tracking-wide">Hình thức đào tạo:</span>
                  <span className="text-white/90 text-xs sm:text-sm">Học 100% Online qua Zoom (Tương tác trực tiếp 1:1 &amp; Nhóm nhỏ)</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <Phone size={22} className="text-[#F5C842] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block text-xs uppercase tracking-wide">Hotlines Giảng Viên Direct:</span>
                  <div className="text-white/90 text-xs sm:text-sm space-y-0.5">
                    <p>• <strong>0374.253.258</strong> (Ms. Jane)</p>
                    <p>• <strong>0382.715.051</strong> (Ms. Linh Thuỷ)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EnvelopeSimple size={20} className="text-[#F5C842] shrink-0" />
                <span>Email: contact@theieltsspells.edu.vn</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[#F5C842] shrink-0" />
                <span>Giờ hỗ trợ: 08:00 - 22:00 (Thứ 2 - Chủ Nhật)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© {new Date().getFullYear()} The IELTS Spells. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Đầu Trang</a>
            <a href="#" className="hover:text-white transition-colors">Chính Sách Bảo Mật</a>
            <a href="#" className="hover:text-white transition-colors">Điều Khoản Sử Dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
