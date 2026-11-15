import type { ReactNode } from "react";
import logo from "../../assest/logo.jpg";
import sidePoster from "../../assest/ielts-side-poster.jpg";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-fullscreen-layout">
      {/* Top Navbar matching the professional TOEFL style */}
      <header className="auth-fullscreen-header">
        <a href="/" className="auth-nav-brand" aria-label="The IELTS Spells, về trang chủ">
          <img src={logo} alt="The IELTS Spells Logo" className="auth-nav-logo" />
          <div className="auth-nav-brand-text">
            <span className="auth-nav-title">The IELTS Spells</span>
            <span className="auth-nav-badge">Management Portal</span>
          </div>
        </a>

        <div className="auth-nav-actions">
          <span className="auth-nav-tag">Hệ thống nội bộ</span>
          <span className="auth-nav-divider" />
          <span className="auth-nav-lang">Tiếng Việt (VN)</span>
          <a
            href="mailto:support@theieltsspells.vn"
            className="auth-nav-help-btn"
            title="Liên hệ bộ phận kỹ thuật"
          >
            Trợ giúp kỹ thuật
          </a>
        </div>
      </header>

      {/* Fullscreen Split Main Content */}
      <main className="auth-fullscreen-main">
        {/* Left Side: The IELTS Spells Visual Showcase */}
        <section className="auth-side-panel" aria-label="Giới thiệu The IELTS Spells">
          <div className="side-poster-card">
            <img
              src={sidePoster}
              alt="The IELTS Spells - Master IELTS with confidence"
              className="side-poster-img"
            />
          </div>
        </section>

        {/* Right Side: Professional Sign In Form Panel */}
        <section className="auth-form-panel">
          <div className="auth-form-wrapper">{children}</div>
        </section>
      </main>
    </div>
  );
}
