"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretRight,
  CircleNotch,
  ShareNetwork,
  Warning,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { fetchCurrentPlacementTest } from "@/features/placement-test/placementTestApi";
import type { StudentPlacementTestRecord } from "@/features/placement-test/placementTestTypes";
import { PlacementStamp } from "@/features/placement-test/PlacementStamp";
import { PlacementReportSection } from "@/features/placement-test/PlacementReportSection";
import styles from "./PlacementResultPage.module.css";

export default function PlacementResultPage() {
  const router = useRouter();
  const { session } = useStudentSession();
  const studentId = session?.user?.id;
  const studentName = session?.user?.user_metadata?.full_name || "Đức Võ";

  const [placement, setPlacement] = useState<StudentPlacementTestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    void fetchCurrentPlacementTest(studentId).then((data) => {
      if (!isMounted) return;
      if (!data) {
        router.replace("/student/placement-test");
        return;
      }
      setPlacement(data);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [studentId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CircleNotch size={32} className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (!placement) return null;

  const estimatedOverall = placement.estimatedOverallBand ?? 5.0;
  const targetBand = placement.targetBand ?? 6.5;
  const isChallenging = estimatedOverall < targetBand - 0.5;

  const daysRemaining = placement.examDate
    ? Math.max(0, Math.ceil((new Date(placement.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 174;

  const studyHours = placement.studyHoursPerWeek || 17;

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const report = placement.detailedReport;

  return (
    <div className={styles.container}>
      {/* Top Header (Ảnh 5) */}
      <div className={styles.reportHeader}>
        <div className={styles.stampPosition}>
          <PlacementStamp type={isChallenging ? "CHALLENGING" : "FEASIBLE"} />
        </div>

        <span className={styles.topBrand}>
          The IELTS Spells Academic &middot; {new Date().toLocaleDateString("vi-VN")}
        </span>
        <h1 className={styles.reportTitle}>Báo cáo kết quả bài test</h1>
        <h2 className={styles.studentName}>{studentName}</h2>

        <p className={styles.reportDesc}>
          Dưới đây là bản phân tích trình độ dựa trên bài test đầu vào - bao gồm điểm ước lượng, đánh giá khả năng đạt target, phân tích lỗi chi tiết, và chiến lược ôn thi được thiết kế riêng cho bạn.
        </p>

        <button type="button" className={styles.shareBtn} onClick={handleShare}>
          <ShareNetwork size={16} weight="bold" />
          <span>{copied ? "Đã sao chép link!" : "Chia sẻ kết quả"}</span>
        </button>
      </div>

      {/* Score Overview Card (Ảnh 5) */}
      <div className={styles.scoreCard}>
        {/* Estimated Overall */}
        <div className={styles.scoreSide}>
          <div className={styles.scoreLabel}>Estimated overall band score</div>
          <div className={styles.estimatedOverallNumber}>{estimatedOverall.toFixed(1)}</div>
          <div className={styles.skillsBreakdownGrid}>
            <div className={styles.skillPill}>
              <span>Reading</span>
              <span className={styles.skillPillVal}>
                {(placement.estimatedReadingBand ?? 3.5).toFixed(1)}
              </span>
            </div>
            <div className={styles.skillPill}>
              <span>Listening</span>
              <span className={styles.skillPillVal}>
                {(placement.estimatedListeningBand ?? 2.5).toFixed(1)}
              </span>
            </div>
            <div className={styles.skillPill}>
              <span>Writing</span>
              <span className={styles.skillPillVal}>
                {(placement.estimatedWritingBand ?? 8.0).toFixed(1)}
              </span>
            </div>
            <div className={styles.skillPill}>
              <span>Speaking</span>
              <span className={styles.skillPillVal}>
                {(placement.estimatedSpeakingBand ?? 5.5).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <CaretRight size={28} weight="bold" className={styles.arrowBetween} />

        {/* Target Band */}
        <div className={styles.scoreSide}>
          <div className={styles.scoreLabel}>Target band</div>
          <div className={styles.targetBandNumber}>{targetBand.toFixed(1)}</div>
          <div className={styles.targetMetaInfo}>
            <span>
              Số ngày còn lại: <strong>{daysRemaining} ngày</strong>
            </span>
            <span>
              Thời gian học: <strong>{studyHours} giờ/tuần</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Feasibility Assessment (Ảnh 5) */}
      <section className={styles.feasibilitySection} aria-labelledby="feasibility-title">
        <h3 id="feasibility-title" className={styles.feasibilityTitle}>
          Đánh giá khả thi
        </h3>
        <div
          className={styles.feasibilityCallout}
          style={
            isChallenging
              ? { border: "1px solid #FEE2E2", background: "#FEF2F2" }
              : { border: "1px solid #D1FAE5", background: "#ECFDF5" }
          }
        >
          <Warning
            size={22}
            weight="fill"
            className={styles.calloutIcon}
            style={{ color: isChallenging ? "#EF4444" : "#10B981" }}
          />
          <div>
            <h4
              className={styles.calloutHeading}
              style={{ color: isChallenging ? "#991B1B" : "#065F46" }}
            >
              {isChallenging ? "Mục tiêu thách thức" : "Mục tiêu khả thi nên có chiến lược"}
            </h4>
            <p
              className={styles.calloutText}
              style={{ color: isChallenging ? "#7F1D1D" : "#047857" }}
            >
              {isChallenging
                ? `Với khoảng cách giữa Band hiện tại (${estimatedOverall.toFixed(1)}) và Band mục tiêu (${targetBand.toFixed(1)}), bạn cần bứt phá mạnh mẽ ở 2 kỹ năng Reading và Listening. Hãy dành ít nhất ${studyHours} giờ/tuần để luyện tập có chiến lược theo danh sách kiến thức trọng tâm bên dưới.`
                : `Điểm số hiện tại của bạn (${estimatedOverall.toFixed(1)}) rất gần với mục tiêu (${targetBand.toFixed(1)}). Bạn hoàn toàn có thể đạt target trong vòng ${daysRemaining} ngày nếu duy trì nhịp độ học tập ổn định.`}
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Analysis & Knowledge to Learn (Ảnh 6, 7, 8, 9, 10) */}
      <section aria-labelledby="detailed-title">
        <h3 id="detailed-title" className={styles.detailedSectionTitle}>
          Phân tích chi tiết &amp; Kiến thức cần học
        </h3>

        {report?.reading && <PlacementReportSection data={report.reading} defaultOpen={true} />}
        {report?.listening && <PlacementReportSection data={report.listening} />}
        {report?.writingTask1 && <PlacementReportSection data={report.writingTask1} />}
        {report?.writingTask2 && <PlacementReportSection data={report.writingTask2} />}
        {report?.speaking && <PlacementReportSection data={report.speaking} />}
      </section>
    </div>
  );
}
