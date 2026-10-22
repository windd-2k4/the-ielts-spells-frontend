"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  CircleNotch,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import {
  evaluatePlacementTest,
  fetchCurrentPlacementTest,
  getAttemptDetails,
  linkPlacementAttempt,
  startOrRestartPlacementTest,
} from "@/features/placement-test/placementTestApi";
import {
  FIXED_PLACEMENT_TESTS,
  type PlacementSurveyData,
  type StudentPlacementTestRecord,
} from "@/features/placement-test/placementTestTypes";
import { startOrResumeSelfPractice } from "@/features/reading/readingApi";
import { startOrResumeWritingSelfPractice } from "@/features/writing/writingApi";
import { startOrResumeSpeakingSelfPractice } from "@/features/speaking/speakingApi";
import { SurveyModal } from "@/features/placement-test/SurveyModal";
import styles from "./MocktestPage.module.css";

interface AttemptStatusInfo {
  submitted: boolean;
  timeTakenStr?: string;
}

export default function PlacementMocktestPage() {
  const router = useRouter();
  const { session } = useStudentSession();
  const studentId = session?.user?.id;

  const [placement, setPlacement] = useState<StudentPlacementTestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [attemptStatuses, setAttemptStatuses] = useState<Record<string, AttemptStatusInfo>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState(15);
  const [launchingSkill, setLaunchingSkill] = useState<string | null>(null);

  // Load placement test and linked attempt statuses
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      const data = await fetchCurrentPlacementTest(studentId!);
      if (!isMounted) return;

      if (!data) {
        router.replace("/student/placement-test");
        return;
      }

      setPlacement(data);
      setLoading(false);

      // Check linked attempts
      const statusMap: Record<string, AttemptStatusInfo> = {};
      const checkList: Array<{ key: string; id?: string | null }> = [
        { key: "reading", id: data.readingAttemptId },
        { key: "listening", id: data.listeningAttemptId },
        { key: "writingT1", id: data.writingT1AttemptId },
        { key: "writingT2", id: data.writingT2AttemptId },
        { key: "speaking", id: data.speakingAttemptId },
      ];

      for (const item of checkList) {
        if (!item.id) {
          statusMap[item.key] = { submitted: false };
          continue;
        }
        try {
          const skillType = (item.key === "writingT1" || item.key === "writingT2")
            ? "writing"
            : (item.key as "reading" | "listening" | "speaking");
          const att = await getAttemptDetails(item.id, skillType);
          const isDone = Boolean(
            att?.status &&
            att.status.toLowerCase() !== "in_progress"
          );
          let timeTakenStr: string | undefined = undefined;
          if (att?.started_at && att?.submitted_at) {
            const start = new Date(att.started_at).getTime();
            const end = new Date(att.submitted_at).getTime();
            const diffSec = Math.max(0, Math.floor((end - start) / 1000));
            const mm = Math.floor(diffSec / 60).toString().padStart(2, "0");
            const ss = (diffSec % 60).toString().padStart(2, "0");
            timeTakenStr = `${mm}:${ss}`;
          } else if (isDone) {
            timeTakenStr = "Đã nộp";
          }
          statusMap[item.key] = { submitted: isDone, timeTakenStr };
        } catch {
          statusMap[item.key] = { submitted: false };
        }
      }

      if (isMounted) {
        setAttemptStatuses(statusMap);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [studentId, router]);

  // Elapsed timer tick
  useEffect(() => {
    if (!placement?.startedAt) return;
    const startTime = new Date(placement.startedAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [placement?.startedAt]);

  // Calculate completed count
  const completedCount = useMemo(() => {
    const keys = ["reading", "listening", "writingT1", "writingT2", "speaking"];
    return keys.filter((k) => attemptStatuses[k]?.submitted).length;
  }, [attemptStatuses]);

  // If 5/5 completed and not yet graded, trigger evaluation (Ảnh 4)
  useEffect(() => {
    if (completedCount === 5 && placement && placement.status !== "COMPLETED" && !isGrading) {
      setIsGrading(true);
      const progressTimer = setInterval(() => {
        setGradingProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 500);

      void evaluatePlacementTest(placement).then((updated) => {
        clearInterval(progressTimer);
        setGradingProgress(100);
        setTimeout(() => {
          router.replace("/student/placement-test/result");
        }, 1200);
      });
    }
  }, [completedCount, placement, isGrading, router]);

  // Timer format
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const isOvertime = elapsedSeconds > 165 * 60; // 2h45m

  // Action handlers to start/resume tests
  async function handleLaunchTest(skillKey: "reading" | "listening" | "writingT1" | "writingT2" | "speaking") {
    if (!placement) return;
    setLaunchingSkill(skillKey);

    try {
      let attemptId = "";
      if (skillKey === "reading") {
        const att = await startOrResumeSelfPractice(FIXED_PLACEMENT_TESTS.READING.versionId, "reading");
        attemptId = att.attemptId;
        await linkPlacementAttempt(placement.id, "reading", attemptId);
        router.push(`/student/reading/attempts/${attemptId}?from=placement`);
      } else if (skillKey === "listening") {
        const att = await startOrResumeSelfPractice(FIXED_PLACEMENT_TESTS.LISTENING.versionId, "listening");
        attemptId = att.attemptId;
        await linkPlacementAttempt(placement.id, "listening", attemptId);
        router.push(`/student/listening/attempts/${attemptId}?from=placement`);
      } else if (skillKey === "writingT1") {
        const att = await startOrResumeWritingSelfPractice(FIXED_PLACEMENT_TESTS.WRITING_T1.versionId);
        attemptId = att.attemptId;
        await linkPlacementAttempt(placement.id, "writingT1", attemptId);
        router.push(`/student/writing/attempts/${attemptId}?from=placement`);
      } else if (skillKey === "writingT2") {
        const att = await startOrResumeWritingSelfPractice(FIXED_PLACEMENT_TESTS.WRITING_T2.versionId);
        attemptId = att.attemptId;
        await linkPlacementAttempt(placement.id, "writingT2", attemptId);
        router.push(`/student/writing/attempts/${attemptId}?from=placement`);
      } else if (skillKey === "speaking") {
        const att = await startOrResumeSpeakingSelfPractice(FIXED_PLACEMENT_TESTS.SPEAKING.versionId);
        attemptId = att.attemptId;
        await linkPlacementAttempt(placement.id, "speaking", attemptId);
        router.push(`/student/speaking/attempts/${attemptId}?from=placement`);
      }
    } catch (err) {
      alert("Không thể khởi động bài thi: " + (err instanceof Error ? err.message : "Vui lòng thử lại"));
      setLaunchingSkill(null);
    }
  }

  async function handleSurveyUpdate(surveyData: PlacementSurveyData) {
    if (!studentId) return;
    const updated = await startOrRestartPlacementTest(studentId, surveyData);
    setPlacement(updated);
    setShowSurveyModal(false);
  }

  if (loading || !placement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CircleNotch size={32} className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Stepper (Ảnh 3) */}
      <div className={styles.stepperRow} aria-label="Tiến trình làm bài test đầu vào">
        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepCircle} ${styles.stepCircleDone}`}>
            <Check size={16} weight="bold" />
          </div>
          <span>Khảo sát</span>
        </div>

        <div className={`${styles.stepConnector} ${completedCount === 5 ? styles.stepConnectorDone : ""}`} />

        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepCircle} ${completedCount === 5 ? styles.stepCircleDone : styles.stepCircleActive}`}>
            {completedCount === 5 ? <Check size={16} weight="bold" /> : "2"}
          </div>
          <span>Mocktest</span>
        </div>

        <div className={`${styles.stepConnector} ${placement?.status === "COMPLETED" ? styles.stepConnectorDone : ""}`} />

        <div className={`${styles.stepItem} ${placement?.status === "COMPLETED" ? styles.stepItemActive : ""}`}>
          <div className={`${styles.stepCircle} ${placement?.status === "COMPLETED" ? styles.stepCircleDone : ""}`}>
            3
          </div>
          <span>Kết quả</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Card: Countdown & Timer */}
        <div className={styles.timerCard}>
          <h3 className={styles.cardTitle}>Test đầu vào Intensive</h3>

          <span className={styles.timerStateLabel}>
            {completedCount === 5 ? "BẠN ĐÃ HOÀN THÀNH BÀI THI" : "BẠN ĐÃ BẮT ĐẦU ĐƯỢC"}
          </span>

          <div className={styles.clockDisplay}>
            {hours.toString().padStart(2, "0")} : {minutes.toString().padStart(2, "0")} : {seconds.toString().padStart(2, "0")}
          </div>

          <div className={styles.clockUnits}>
            <span>GIỜ</span>
            <span>PHÚT</span>
            <span>GIÂY</span>
          </div>

          {isOvertime && (
            <div className={styles.overtimeWarning}>
              ⓘ Bạn đã vượt quá thời gian thi tiêu chuẩn (2 giờ 45 phút)
            </div>
          )}

          <button
            type="button"
            className={styles.redoSurveyBtn}
            onClick={() => setShowSurveyModal(true)}
          >
            <ArrowCounterClockwise size={15} weight="bold" />
            <span>Làm lại khảo sát</span>
          </button>
        </div>

        {/* Right Card: Tests List */}
        <div className={styles.testsCard}>
          <div className={styles.testsHeader}>
            <h2 className={styles.testsTitle}>Phần thi của bạn</h2>
            <span className={styles.testsCompletedCount}>
              {completedCount}/5 đã hoàn thành
            </span>
          </div>

          <div className={styles.testsList}>
            {/* 1. Reading */}
            {(() => {
              const isDone = attemptStatuses.reading?.submitted;
              const timeStr = attemptStatuses.reading?.timeTakenStr;
              return (
                <div className={`${styles.testRow} ${isDone ? styles.testRowDone : ""}`}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.statusIcon} ${isDone ? styles.statusIconDone : styles.statusIconPending}`}>
                      <Check size={14} weight="bold" />
                    </div>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>Reading</span>
                      {isDone && timeStr ? (
                        <span className={styles.completedTimeText}>Làm trong: {timeStr}</span>
                      ) : (
                        <span className={styles.skillDuration}>60 phút</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.questionCount}>40 câu</span>
                    {isDone ? (
                      <button type="button" className={styles.actionBtnDone} disabled>
                        Đã xong
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnStart}
                        onClick={() => handleLaunchTest("reading")}
                        disabled={launchingSkill === "reading"}
                      >
                        {launchingSkill === "reading" ? "Đang mở..." : "Làm bài"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. Listening */}
            {(() => {
              const isDone = attemptStatuses.listening?.submitted;
              const timeStr = attemptStatuses.listening?.timeTakenStr;
              return (
                <div className={`${styles.testRow} ${isDone ? styles.testRowDone : ""}`}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.statusIcon} ${isDone ? styles.statusIconDone : styles.statusIconPending}`}>
                      <Check size={14} weight="bold" />
                    </div>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>Listening</span>
                      {isDone && timeStr ? (
                        <span className={styles.completedTimeText}>Làm trong: {timeStr}</span>
                      ) : (
                        <span className={styles.skillDuration}>27 phút</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.questionCount}>40 câu</span>
                    {isDone ? (
                      <button type="button" className={styles.actionBtnDone} disabled>
                        Đã xong
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnStart}
                        onClick={() => handleLaunchTest("listening")}
                        disabled={launchingSkill === "listening"}
                      >
                        {launchingSkill === "listening" ? "Đang mở..." : "Làm bài"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3. Writing Task 1 */}
            {(() => {
              const isDone = attemptStatuses.writingT1?.submitted;
              const timeStr = attemptStatuses.writingT1?.timeTakenStr;
              return (
                <div className={`${styles.testRow} ${isDone ? styles.testRowDone : ""}`}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.statusIcon} ${isDone ? styles.statusIconDone : styles.statusIconPending}`}>
                      <Check size={14} weight="bold" />
                    </div>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>Writing Task 1</span>
                      {isDone && timeStr ? (
                        <span className={styles.completedTimeText}>Làm trong: {timeStr}</span>
                      ) : (
                        <span className={styles.skillDuration}>20 phút</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.questionCount}>1 câu</span>
                    {isDone ? (
                      <button type="button" className={styles.actionBtnDone} disabled>
                        Đã xong
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnStart}
                        onClick={() => handleLaunchTest("writingT1")}
                        disabled={launchingSkill === "writingT1"}
                      >
                        {launchingSkill === "writingT1" ? "Đang mở..." : "Làm bài"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 4. Writing Task 2 */}
            {(() => {
              const isDone = attemptStatuses.writingT2?.submitted;
              const timeStr = attemptStatuses.writingT2?.timeTakenStr;
              return (
                <div className={`${styles.testRow} ${isDone ? styles.testRowDone : ""}`}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.statusIcon} ${isDone ? styles.statusIconDone : styles.statusIconPending}`}>
                      <Check size={14} weight="bold" />
                    </div>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>Writing Task 2</span>
                      {isDone && timeStr ? (
                        <span className={styles.completedTimeText}>Làm trong: {timeStr}</span>
                      ) : (
                        <span className={styles.skillDuration}>40 phút</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.questionCount}>1 câu</span>
                    {isDone ? (
                      <button type="button" className={styles.actionBtnDone} disabled>
                        Đã xong
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnStart}
                        onClick={() => handleLaunchTest("writingT2")}
                        disabled={launchingSkill === "writingT2"}
                      >
                        {launchingSkill === "writingT2" ? "Đang mở..." : "Làm bài"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 5. Speaking */}
            {(() => {
              const isDone = attemptStatuses.speaking?.submitted;
              const timeStr = attemptStatuses.speaking?.timeTakenStr;
              return (
                <div className={`${styles.testRow} ${isDone ? styles.testRowDone : ""}`}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.statusIcon} ${isDone ? styles.statusIconDone : styles.statusIconPending}`}>
                      <Check size={14} weight="bold" />
                    </div>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>Speaking</span>
                      {isDone && timeStr ? (
                        <span className={styles.completedTimeText}>Làm trong: {timeStr}</span>
                      ) : (
                        <span className={styles.skillDuration}>13 phút</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.questionCount}>17 câu</span>
                    {isDone ? (
                      <button type="button" className={styles.actionBtnDone} disabled>
                        Đã xong
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnStart}
                        onClick={() => handleLaunchTest("speaking")}
                        disabled={launchingSkill === "speaking"}
                      >
                        {launchingSkill === "speaking" ? "Đang mở..." : "Làm bài"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Grading Progress Bar (Ảnh 4) */}
      {isGrading && (
        <div className={styles.gradingContainer}>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${gradingProgress}%` }}
            />
          </div>
          <p className={styles.gradingMessage}>
            <span className={styles.beanAvatar}>🌱</span>
            <span>Giáo sư Đậu đang miệt mài chấm bài... Bạn đừng tắt trình duyệt nhé!</span>
          </p>
        </div>
      )}

      {/* Survey Modal */}
      <SurveyModal
        isOpen={showSurveyModal}
        initialData={{
          targetBand: placement.targetBand,
          examDate: placement.examDate,
          studyHoursPerWeek: placement.studyHoursPerWeek,
        }}
        onClose={() => setShowSurveyModal(false)}
        onSubmit={handleSurveyUpdate}
      />
    </div>
  );
}
