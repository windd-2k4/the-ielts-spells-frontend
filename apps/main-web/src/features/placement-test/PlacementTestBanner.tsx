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

  // If student has already completed the placement test, hide the banner
  if (placement && placement.status === "COMPLETED") {
    return null;
  }

  const isContinue = placement && placement.status === "IN_PROGRESS";

  return (
    <aside className={styles.bannerCard} aria-label="Gợi ý làm bài test đầu vào">
      <div className={styles.leftGroup}>
        <div className={styles.mascotCircle} aria-hidden="true">
          <Sparkle size={24} weight="fill" />
        </div>
        <div className={styles.textContent}>
          <div className={styles.badgeTitleRow}>
            <span className={styles.highlightPill}>Kiểm tra 4 kỹ năng FREE</span>
            <h3 className={styles.title}>Đo lường năng lực chuẩn IELTS cùng The IELTS Spells!</h3>
          </div>
          <p className={styles.subtitle}>
            Chốt band hiện tại, mục tiêu và nhận kế hoạch luyện tập được thiết kế riêng cho bạn hoàn toàn miễn phí.
          </p>
        </div>
      </div>

      <Link
        href={isContinue ? "/student/placement-test/mocktest" : "/student/placement-test"}
        className={styles.ctaButton}
      >
        <span>{isContinue ? "Tiếp tục bài test" : "Làm test đầu vào ngay"}</span>
        <ArrowRight size={16} weight="bold" />
      </Link>
    </aside>
  );
}
