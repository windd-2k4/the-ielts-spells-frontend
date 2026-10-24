"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  CaretRight,
  Sparkle,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { fetchCurrentPlacementTest, startOrRestartPlacementTest } from "@/features/placement-test/placementTestApi";
import type { PlacementSurveyData, StudentPlacementTestRecord } from "@/features/placement-test/placementTestTypes";
import { PlacementStamp } from "@/features/placement-test/PlacementStamp";
import { SurveyModal } from "@/features/placement-test/SurveyModal";
import styles from "./PlacementLandingPage.module.css";

export default function PlacementTestLandingPage() {
  const router = useRouter();
  const { session } = useStudentSession();
  const studentId = session?.user?.id;
  const studentName = session?.user?.user_metadata?.full_name || "Học viên";

  const [placement, setPlacement] = useState<StudentPlacementTestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

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

  async function handleSurveySubmit(surveyData: PlacementSurveyData) {
    if (!studentId) return;
    const record = await startOrRestartPlacementTest(studentId, surveyData);
    setPlacement(record);
    setShowSurveyModal(false);
    router.push("/student/placement-test/mocktest");
  }

  function handleStartClick() {
    if (placement?.status === "IN_PROGRESS") {
      router.push("/student/placement-test/mocktest");
    } else if (placement?.status === "COMPLETED") {
      router.push("/student/placement-test/result");
    } else {
      setShowSurveyModal(true);
    }
  }

  return (
    <div className={styles.container}>
      {/* Sub Navigation */}
      <nav className={styles.subnav} aria-label="Menu kiểm tra đầu vào">
        <span className={styles.subnavItem}>
          <Sparkle size={17} weight="fill" />
          Test đầu vào 4 kỹ năng FREE
        </span>
      </nav>

      <div className={styles.mainGrid}>
        {/* Left: Preview Report Mockup */}
        <div className={styles.previewWrapper}>
          <div className={styles.previewCard}>
            <div className={styles.stampPosition}>
              <PlacementStamp type="FEASIBLE" />
            </div>

            <div className={styles.cardHeader}>
              <div>
                <span className={styles.brandEyebrow}>
                  The IELTS Spells Academic
                </span>
                <h2 className={styles.reportHeading}>Báo cáo kết quả bài test</h2>
                <div className={styles.authorBadgeRow}>
                  <span className={styles.authorBadge}>Ban Học Thuật The IELTS Spells</span>
                  <span className={styles.verifiedDot}>&bull; Đã chứng thực</span>
                </div>
                <p className={styles.cardDesc}>
                  Bản phân tích năng lực chuẩn hóa 4 kỹ năng IELTS Academic dựa trên kết quả thi thực tế - bao gồm điểm ước lượng, đánh giá khả năng đạt target, phân tích lỗi chi tiết, và chiến lược ôn thi được thiết kế riêng cho bạn.
                </p>
              </div>
            </div>

            {/* Score row mockup */}
            <div className={styles.scoreRow}>
              <div className={styles.scoreBox}>
                <div className={styles.scoreLabel}>Overall estimate band</div>
                <div className={styles.scoreBig}>6.5</div>
                <div className={styles.miniGrid}>
                  <div className={styles.miniItem}>
                    <span>Reading</span>
                    <span className={styles.miniVal}>7.5</span>
                  </div>
                  <div className={styles.miniItem}>
                    <span>Listening</span>
                    <span className={styles.miniVal}>6.0</span>
                  </div>
                  <div className={styles.miniItem}>
                    <span>Writing</span>
                    <span className={styles.miniVal}>6.0</span>
                  </div>
                  <div className={styles.miniItem}>
                    <span>Speaking</span>
                    <span className={styles.miniVal}>5.5</span>
                  </div>
                </div>
              </div>

              <CaretRight size={22} weight="bold" className={styles.arrowIcon} />

              <div className={styles.scoreBox}>
                <div className={styles.scoreLabel}>Target band</div>
                <div className={styles.scoreTargetBig}>7.5</div>
                <div className={styles.targetMeta}>
                  <span>Số ngày còn lại: <strong>180 ngày</strong></span>
                  <span>Thời gian học: <strong>10 giờ/tuần</strong></span>
                </div>
              </div>
            </div>

            {/* Reading preview snippet */}
            <div className={styles.previewSnippet}>
              <div className={styles.snippetHeader}>
                <div className={styles.snippetTitle}>
                  <BookOpenText size={16} weight="duotone" className="text-[#894C5B]" />
                  <span>Reading</span>
                </div>
                <span className={styles.snippetBadge}>Band 7.5</span>
              </div>
              <p className={styles.snippetText}>
                Bạn đã làm rất tốt phần Scanning và Skimming, tuy nhiên vẫn cần lưu ý nhận diện paraphrase ở các dạng bài khó như Matching Headings và Distractor Identification...
              </p>
            </div>
          </div>
        </div>

        {/* Right: Content introduction & steps */}
        <div className={styles.introCol}>
          <span className={styles.pillBadge}>
            <Sparkle size={15} weight="fill" />
            Kiểm tra năng lực IELTS Academic miễn phí
          </span>

          <h1 className={styles.mainTitle}>
            Học đúng chỗ yếu nhất thay vì &ldquo;cày&rdquo; nhiều đề nhưng không có chiến lược.
          </h1>

          <p className={styles.introDesc}>
            Không cần làm thêm 100 đề nữa, bạn cần biết chính xác kỹ năng nào, dạng bài nào đang kéo điểm xuống. The IELTS Spells phân tích bài test của bạn và chỉ ra điều đó chỉ qua 2 bước:
          </p>

          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div>
                <h4 className={styles.stepTitle}>Trả lời khảo sát (2p)</h4>
                <p className={styles.stepText}>
                  Giúp hệ thống hiểu mục tiêu và động lực học của bạn, từ đó đưa ra đề xuất và lộ trình phù hợp.
                </p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={`${styles.stepNumber} ${styles.stepNumberAlt}`}>2</div>
              <div>
                <h4 className={styles.stepTitle}>Làm bài mocktest (3h)</h4>
                <p className={styles.stepText}>
                  Thi thử 4 kỹ năng y như thi thật. Nhận báo cáo chấm chữa chi tiết từng dạng bài với Hệ thống The IELTS Spells.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.benefitsList}>
            <p className={styles.benefitsTitle}>Qua đó bạn:</p>
            <div className={styles.benefitItem}>
              <span className={styles.checkDot} />
              <span>Biết chính xác năng lực hiện tại chi tiết ở từng kĩ năng</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.checkDot} />
              <span>Đề xuất chiến lược cải thiện band điểm thiết thực</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.checkDot} />
              <span>Cách học đạt band IELTS hiệu quả với The IELTS Spells</span>
            </div>
          </div>

          <div>
            <button type="button" className={styles.ctaBtn} onClick={handleStartClick}>
              <span>
                {placement?.status === "IN_PROGRESS"
                  ? "Tiếp tục bài Mocktest"
                  : placement?.status === "COMPLETED"
                  ? "Xem kết quả bài test"
                  : "Bắt đầu ngay"}
              </span>
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Survey Modal */}
      <SurveyModal
        isOpen={showSurveyModal}
        initialData={{
          targetBand: placement?.targetBand || 6.5,
          examDate: placement?.examDate,
          studyHoursPerWeek: placement?.studyHoursPerWeek || 10,
        }}
        onClose={() => setShowSurveyModal(false)}
        onSubmit={handleSurveySubmit}
      />
    </div>
  );
}
