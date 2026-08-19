import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import AboutSection from "@/components/AboutSection";
import BenefitsSection from "@/components/BenefitsSection";
import CoursesSection from "@/components/CoursesSection";
import RoadmapSection from "@/components/RoadmapSection";
import TeachersSection from "@/components/TeachersSection";
import FeedbackSection from "@/components/FeedbackSection";
import ConsultationForm from "@/components/ConsultationForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FEFDF5] text-[#1E1B18] font-sans antialiased">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Hero Banner */}
      <Hero />

      {/* 3. Achievements & Trust Strip */}
      <TrustStrip />

      {/* 4. Về Chúng Tôi / Triết Lý Học Thuật */}
      <AboutSection />

      {/* 5. Quyền Lợi Học Viên Bento Grid */}
      <BenefitsSection />

      {/* 6. Danh Sách Khóa Học & Filter Modal */}
      <CoursesSection />

      {/* 7. Lộ Trình 4 Giai Đoạn */}
      <RoadmapSection />

      {/* 8. Đội Ngũ Giảng Viên 8.0-8.5 */}
      <TeachersSection />

      {/* 9. Feedback & Kết Quả Học Viên */}
      <FeedbackSection />

      {/* 10. Form Tiếp Nhận Tư Vấn */}
      <ConsultationForm />

      {/* 11. Footer Liên Hệ */}
      <Footer />
    </main>
  );
}
