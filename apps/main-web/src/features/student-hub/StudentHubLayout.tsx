"use client";

import { useState } from "react";
import { StudentTopbar } from "./StudentTopbar";
import { StudentMobileNav } from "./StudentMobileNav";
import styles from "./StudentHubLayout.module.css";

export function StudentHubLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#student-main-content">Đến nội dung học tập</a>
      <div className={styles.workspace}>
        <StudentTopbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        <main id="student-main-content" tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>

      <StudentMobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
