import { BookOpenText, CheckCircle, Sparkle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import logo from "../../assest/logo.jpg";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="Giới thiệu The IELTS Spells">
        <a className="brand-link" href="/" aria-label="The IELTS Spells, về trang chính">
          <img src={logo} alt="" />
          <span>The IELTS Spells</span>
        </a>

        <div className="brand-story">
          <span className="brand-eyebrow"><Sparkle weight="fill" /> Cast the spells, claim the band</span>
          <h2>Mỗi buổi học đều đưa bạn gần hơn tới band điểm mục tiêu.</h2>
          <p>Một nơi để học viên theo dõi tiến độ và giáo viên đồng hành bằng dữ liệu rõ ràng.</p>
        </div>

        <div className="brand-proof">
          <BookOpenText aria-hidden="true" />
          <div>
            <strong>Lộ trình được theo sát</strong>
            <span><CheckCircle weight="fill" /> Bài tập, lịch học và phản hồi trong một hệ thống</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand">
          <img src={logo} alt="" />
          <span>The IELTS Spells</span>
        </div>
        <div className="auth-content">{children}</div>
        <p className="auth-footer">Cần hỗ trợ? <a href="mailto:support@theieltssspells.vn">Liên hệ trung tâm</a></p>
      </section>
    </main>
  );
}
