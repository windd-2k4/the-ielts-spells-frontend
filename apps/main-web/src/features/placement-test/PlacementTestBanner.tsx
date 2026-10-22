"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { fetchCurrentPlacementTest } from "./placementTestApi";
import type { StudentPlacementTestRecord } from "./placementTestTypes";
import styles from "./PlacementTestBanner.module.css";

export function PlacementTestBanner() {
  const { session } = useStudentSession();
  const studentId = session?.user?.id;
  const [placement, setPlacement] = useState<StudentPlacementTestRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    void fetchCurrentPlacementTest(studentId).then((data) => {
      if (isMounted) {
        setPlacement(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (loading) return null;

  // If student has already completed the placement test, hide the banner as requested in Ảnh 1
  if (placement && placement.status === "COMPLETED") {
    return null;
  }

  const isContinue = placement && placement.status === "IN_PROGRESS";

  return (
    <aside className={styles.bannerCard} aria-label="Gợi ý làm bài test đầu vào">
      <div className={styles.leftGroup}>
        <div className={styles.mascotCircle} aria-hidden="true">
          🌱
        </div>
        <div className={styles.textContent}>
          <div className={styles.badgeTitleRow}>
            <span className={styles.highlightPill}>Phá đảo tất cả</span>
            <h3 className={styles.title}>dạng đề IELTS cùng The IELTS Spells!</h3>
          </div>
          <p className={styles.subtitle}>
            Chốt đầu vào, mục tiêu, thời gian và nhận Practice Plan được &ldquo;may đo&rdquo; miễn phí cho bạn!
          </p>
        </div>
      </div>

      <Link
        href={isContinue ? "/student/placement-test/mocktest" : "/student/placement-test"}
        className={styles.ctaButton}
      >
        <span>{isContinue ? "Tiếp tục bài test" : "Tạo Practice Plan"}</span>
        <ArrowRight size={16} weight="bold" />
      </Link>
    </aside>
  );
}
