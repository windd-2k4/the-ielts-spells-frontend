"use client";

import { useState, useEffect } from "react";
import { BrandMark } from "@ielts/ui";
import { List, X, PhoneCall, Wrench, Warning } from "@phosphor-icons/react";

interface NavItem {
  id: string;
  label: string;
  isDev?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Trang chủ" },
  { id: "about", label: "Giới thiệu" },
  { id: "benefits", label: "Quyền lợi" },
  { id: "courses", label: "Khóa học" },
  { id: "teachers", label: "Giáo viên" },
  { id: "feedback", label: "Feedback" },
  { id: "practice", label: "Luyện đề", isDev: true },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Development Popup State
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devModalFeature, setDevModalFeature] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section scroll spy logic for standard section IDs
      const sectionItems = NAV_ITEMS.filter((item) => !item.isDev);
      const sections = sectionItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sectionItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleNavClick = (item: NavItem) => {
    setMobileMenuOpen(false);
    if (item.isDev) {
      setDevModalFeature(item.label);
      setDevModalOpen(true);
      return;
    }
    scrollToSection(item.id);
  };

  const triggerDevModal = (featureName: string) => {
    setMobileMenuOpen(false);
    setDevModalFeature(featureName);
    setDevModalOpen(true);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-header shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="lp-container flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("hero");
            }}
            className="flex items-center gap-2.5 group text-xl font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            <img
              src="/logo.jpg"
              alt="The IELTS Spells Logo"
              className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0 border border-[#F3E8C4]"
            />
            <BrandMark />
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#FFFDF0]/90 p-1.5 rounded-full border border-[#F3E8C4] backdrop-blur-md shrink-0">
            {NAV_ITEMS.map((item) => {
              const isActive = !item.isDev && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#F5C842] text-[#1E1B18] font-bold shadow-sm"
                      : "text-[#5C5752] hover:text-[#1E1B18] hover:bg-white/60"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => triggerDevModal("Đăng nhập tài khoản")}
              className="px-4 py-2.5 rounded-full text-sm font-semibold text-[#894C5B] hover:bg-[#F7E5EA] transition-colors whitespace-nowrap"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => scrollToSection("consultation")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#F5C842] text-[#1E1B18] hover:bg-[#E5B520] shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
            >
              <PhoneCall size={16} weight="bold" />
              <span>Tư vấn miễn phí</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#FEF9C3] text-[#1E1B18] border border-[#F3E8C4] hover:bg-[#F5C842] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[73px] bg-[#FEFDF5] border-b border-[#F3E8C4] shadow-xl p-6 transition-all animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`text-left px-4 py-3 rounded-xl font-medium text-base transition-colors ${
                    !item.isDev && activeSection === item.id
                      ? "bg-[#F5C842] text-[#1E1B18] font-bold"
                      : "text-[#5C5752] hover:bg-[#FEF9C3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-[#F3E8C4] flex flex-col gap-3">
                <button
                  onClick={() => triggerDevModal("Đăng nhập hệ thống")}
                  className="w-full text-center py-3 rounded-xl font-semibold text-[#894C5B] bg-[#F7E5EA]"
                >
                  Đăng nhập hệ thống
                </button>
                <button
                  onClick={() => scrollToSection("consultation")}
                  className="w-full text-center py-3 rounded-xl font-bold bg-[#F5C842] text-[#1E1B18] shadow-md"
                >
                  Nhận tư vấn lộ trình miễn phí
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Feature Under Development Modal */}
      {devModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDevModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-[#F3E8C4] shadow-2xl text-center space-y-5 relative animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-[#FEF9C3] text-[#894C5B] border-2 border-[#F3E8C4] flex items-center justify-center mx-auto shadow-sm">
              <Wrench size={32} weight="fill" className="text-[#894C5B]" />
            </div>

            {/* Content Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7E5EA] text-[#894C5B] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Warning size={14} weight="bold" />
                <span>Thông Báo Tính Năng</span>
              </div>
              <h3 className="font-display text-2xl font-extrabold text-[#1E1B18]">
                Chức Năng Đang Phát Triển
              </h3>
              <p className="text-sm text-[#5C5752] leading-relaxed">
                Tính năng <strong className="text-[#894C5B]">"{devModalFeature}"</strong> đang được hệ thống hoàn thiện kỹ lưỡng và sẽ sớm ra mắt trong thời gian tới. Cảm ơn bạn đã quan tâm!
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setDevModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-[#F5C842] text-[#1E1B18] font-extrabold hover:bg-[#E5B520] active:scale-95 transition-all shadow-md text-sm"
            >
              Đã hiểu &amp; Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
