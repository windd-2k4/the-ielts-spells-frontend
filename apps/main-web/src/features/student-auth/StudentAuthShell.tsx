"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MainWebBackdrop } from "./MainWebBackdrop";
import styles from "./ModernAuth.module.css";

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export function StudentAuthShell({ children }: Props) {
  return (
    <main className={styles.pageWrapper}>
      {/* 1. Main Web blurred in background */}
      <MainWebBackdrop />

      {/* 2. Frosted glass dark overlay */}
      <div className={styles.backdropOverlay} aria-hidden="true" />

      {/* 3. Top navigation header */}
      <header className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>
        <Link href="/" className={styles.brandLink}>
          <img src="/logo-spells.png" alt="" className={styles.brandLogo} />
          <span>The IELTS Spells</span>
        </Link>
      </header>

      {/* 4. Perfectly centered single card container */}
      <div className={styles.singleCardContainer}>
        {children}
      </div>

      {/* 5. Footer */}
      <footer className={styles.footerText}>
        <span>Cần hỗ trợ? </span>
        <a href="mailto:support@theieltssspells.vn" className={styles.supportLink}>
          Liên hệ trung tâm
        </a>
      </footer>
    </main>
  );
}
