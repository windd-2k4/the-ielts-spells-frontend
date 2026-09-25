"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BookOpenText,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
  DownloadSimple,
  FilePdf,
  FileText,
  Headphones,
  Lightning,
  MagnifyingGlass,
  MicrophoneStage,
  PlayCircle,
  Sparkle,
  Target,
  TrendDown,
  TrendUp,
  User,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CourseWorkspaceData } from "../studentPortalApi";
import styles from "./StudentCourseWorkspace.module.css";

interface StudentCourseWorkspaceProps {
  data: CourseWorkspaceData;
}

type TabType = "overview" | "roadmap" | "library" | "reports";

export function StudentCourseWorkspace({ data }: StudentCourseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [libraryFilter, setLibraryFilter] = useState<string>("ALL");
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [studyLogSkillFilter, setStudyLogSkillFilter] = useState<string>("ALL");
  const [studyLogPlatformFilter, setStudyLogPlatformFilter] = useState<string>("ALL");

  const {
    course,
    enrollment,
    nextAction,
    nextSession,
    sessions = [],
    resources = [],
    skills,
    studyLogs = [],
    weaknesses = [],
    goalProgress,
    teacherFeedback = [],
  } = data;

  // Progress calculations
  const completedSessions = enrollment.completedSessions || 0;
  const totalSessions = enrollment.totalSessions || course.totalSessions || sessions.length || 1;
  const sessionProgressPercent = Math.min(100, Math.round((completedSessions / totalSessions) * 100));

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchType =
        libraryFilter === "ALL" ||
        (libraryFilter === "PDF" && (res.fileRole === "MAIN" || res.resourceType === "DOCUMENT")) ||
        (libraryFilter === "AUDIO" && (res.fileRole === "AUDIO" || res.resourceType === "AUDIO")) ||
        (libraryFilter === "TRANSCRIPT" && res.fileRole === "TRANSCRIPT") ||
        (libraryFilter === "KEY" && res.fileRole === "ANSWER_KEY") ||
        (libraryFilter === "VOCAB" && (res.fileRole === "VOCABULARY" || res.resourceType === "VOCABULARY")) ||
        (libraryFilter === "VIDEO" && res.resourceType === "VIDEO");

      const matchSearch =
        !librarySearch.trim() ||
        res.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        res.code.toLowerCase().includes(librarySearch.toLowerCase());

      return matchType && matchSearch;
    });
  }, [resources, libraryFilter, librarySearch]);

  // Filtered study logs
  const filteredStudyLogs = useMemo(() => {
    return studyLogs.filter((log) => {
      const matchSkill =
        studyLogSkillFilter === "ALL" ||
        log.skill.toUpperCase() === studyLogSkillFilter.toUpperCase();

      const matchPlatform =
        studyLogPlatformFilter === "ALL" ||
        (studyLogPlatformFilter === "SYSTEM" && log.source === "SYSTEM") ||
        (studyLogPlatformFilter === "EXTERNAL" && log.source !== "SYSTEM");

      return matchSkill && matchPlatform;
    });
  }, [studyLogs, studyLogSkillFilter, studyLogPlatformFilter]);

  const isListeningReading = course.skillPair === "LISTENING_READING";

  return (
    <div className={styles.workspacePage}>
      {/* 1. Course Header Banner */}
      <header className={styles.courseHeader}>
        <div className={styles.headerGlow} />
        <Link href="/student/courses" className={styles.backLink}>
          <ArrowLeft size={16} weight="bold" /> Khóa học của tôi
        </Link>

        <div className={styles.headerContent}>
          <div>
            <div className={styles.badgeRow}>
              <span className={styles.codeBadge}>{course.code}</span>
              <span className={styles.skillBadge}>
                {isListeningReading ? "Listening & Reading" : "Speaking & Writing"}
              </span>
              {course.level && <span className={styles.codeBadge}>Cấp độ {course.level}</span>}
              {course.targetBand && (
                <span className={styles.targetBadge}>Mục tiêu Band {course.targetBand}</span>
              )}
            </div>

            <h1>{course.name}</h1>
            <p>{course.description || "Không gian học tập, luyện đề và lộ trình chuyên sâu."}</p>

            <div className={styles.metaRow}>
              {course.primaryTeacherName && (
                <span className={styles.metaItem}>
                  <User size={15} weight="bold" /> Giảng viên: <strong>{course.primaryTeacherName}</strong>
                </span>
              )}
              {course.startsOn && (
                <span className={styles.metaItem}>
                  <CalendarBlank size={15} weight="bold" /> Lịch học:{" "}
                  <strong>
                    {new Date(course.startsOn).toLocaleDateString("vi-VN")}
                    {course.endsOn ? ` - ${new Date(course.endsOn).toLocaleDateString("vi-VN")}` : ""}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerProgressCard}>
            <div className={styles.progressLabelRow}>
              <span>Tiến độ buổi học</span>
              <strong>
                {completedSessions}/{totalSessions} buổi
              </strong>
            </div>
            <div className={styles.trackOuter}>
              <div className={styles.trackInner} style={{ width: `${sessionProgressPercent}%` }} />
            </div>
            <div className={styles.progressSubRow}>
              <span>{sessionProgressPercent}% hoàn thành</span>
              <span>Trạng thái: {enrollment.status === "ACTIVE" ? "Đang học" : enrollment.status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Nổi Bật: Việc Cần Làm Tiếp Theo (Next Action Engine) */}
      <section className={styles.nextActionHero} aria-labelledby="next-action-heading">
        <div className={styles.nextActionKickerRow}>
          <span className={styles.kickerTag}>
            <Lightning size={16} weight="fill" /> Việc cần làm tiếp theo
          </span>
          <span
            className={`${styles.priorityBadge} ${
              nextAction.priority === "HIGH"
                ? styles.priorityHigh
                : nextAction.priority === "MEDIUM"
                ? styles.priorityMedium
                : styles.priorityLow
            }`}
          >
            {nextAction.contextBadge}
          </span>
        </div>

        <div className={styles.nextActionMain}>
          <div>
            <h2 id="next-action-heading" className={styles.nextActionTitle}>
              {nextAction.title}
            </h2>
            <p className={styles.nextActionDesc}>{nextAction.description}</p>
          </div>

          <div>
            {nextAction.ctaUrl.startsWith("http") ? (
              <a
                href={nextAction.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.nextActionCtaBtn}
              >
                {nextAction.actionType === "UPCOMING_SESSION" ? (
                  <VideoCamera size={19} weight="fill" />
                ) : (
                  <PlayCircle size={19} weight="fill" />
                )}
                {nextAction.ctaLabel}
                <ArrowSquareOut size={16} />
              </a>
            ) : (
              <Link href={nextAction.ctaUrl} className={styles.nextActionCtaBtn}>
                <PlayCircle size={19} weight="fill" />
                {nextAction.ctaLabel}
                <ArrowRight size={16} weight="bold" />
              </Link>
            )}
          </div>
        </div>

        {/* 5 Tiêu chuẩn ưu tiên học tập */}
        <div className={styles.nextActionRulesStrip}>
          <span
            className={`${styles.ruleChip} ${
              nextAction.actionType === "ASSIGNMENT_DUE" ? styles.ruleChipActive : ""
            }`}
          >
            1. Làm bài được giao gần nhất
          </span>
          <span
            className={`${styles.ruleChip} ${
              nextAction.actionType === "REVISION_REQUIRED" ? styles.ruleChipActive : ""
            }`}
          >
            2. Hoàn thành báo cáo còn thiếu
          </span>
          <span
            className={`${styles.ruleChip} ${
              nextAction.actionType === "RETRY_LOW_SCORE" ? styles.ruleChipActive : ""
            }`}
          >
            3. Luyện lại bài có kết quả thấp
          </span>
          <span
            className={`${styles.ruleChip} ${
              nextAction.actionType === "UPCOMING_SESSION" ? styles.ruleChipActive : ""
            }`}
          >
            4. Tham gia buổi học sắp tới
          </span>
          <span
            className={`${styles.ruleChip} ${
              nextAction.actionType === "SELF_PRACTICE" ? styles.ruleChipActive : ""
            }`}
          >
            5. Tự luyện nếu không có nhiệm vụ bắt buộc
          </span>
        </div>
      </section>

      {/* 3. Navigation Tabs */}
      <nav className={styles.tabNavStrip} aria-label="Các phân khu chức năng">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`${styles.navTabBtn} ${activeTab === "overview" ? styles.navTabBtnActive : ""}`}
        >
          <Target size={18} weight={activeTab === "overview" ? "fill" : "regular"} />
          Tổng quan &amp; Tiết học tới
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`${styles.navTabBtn} ${activeTab === "roadmap" ? styles.navTabBtnActive : ""}`}
        >
          <CalendarCheck size={18} weight={activeTab === "roadmap" ? "fill" : "regular"} />
          Lộ trình khóa học <span className={styles.tabCountPill}>{sessions.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`${styles.navTabBtn} ${activeTab === "library" ? styles.navTabBtnActive : ""}`}
        >
          <BookOpenText size={18} weight={activeTab === "library" ? "fill" : "regular"} />
          Kho học liệu <span className={styles.tabCountPill}>{resources.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`${styles.navTabBtn} ${activeTab === "reports" ? styles.navTabBtnActive : ""}`}
        >
          <TrendUp size={18} weight={activeTab === "reports" ? "fill" : "regular"} />
          Báo cáo &amp; Nhật ký <span className={styles.tabCountPill}>{studyLogs.length}</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: TỔNG QUAN & TIẾT HỌC TỚI
         ========================================================================= */}
      {activeTab === "overview" && (
        <div className={styles.bentoGrid}>
          {/* Cột Trái (8 phần): Tiết học tiếp theo & Điểm yếu lặp lại */}
          <div className={styles.bentoCol8}>
            {/* Tiết học tiếp theo */}
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <VideoCamera size={19} weight="duotone" className="text-[#894C5B]" />
                    Tiết học tiếp theo của khóa
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Thông tin phòng học Zoom và tài liệu cần chuẩn bị trước buổi học
                  </p>
                </div>
                {nextSession && (
                  <span className={styles.skillBadge}>Buổi {nextSession.sessionNo}</span>
                )}
              </div>

              {nextSession ? (
                <div className={styles.nextClassBox}>
                  <div className={styles.nextClassTimeRow}>
                    <span className={styles.timeBadge}>
                      <Clock size={15} weight="bold" />
                      {nextSession.startsAt
                        ? new Date(nextSession.startsAt).toLocaleString("vi-VN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Chưa xếp giờ"}
                    </span>
                    {nextSession.zoomUrl ? (
                      <a
                        href={nextSession.zoomUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.zoomBtn}
                      >
                        <VideoCamera size={16} weight="fill" /> Vào lớp Zoom
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">Link Zoom sẽ cập nhật</span>
                    )}
                  </div>

                  <h4 className={styles.nextClassSessionTitle}>
                    Buổi {nextSession.sessionNo}: {nextSession.title || "Nội dung theo giáo trình"}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {nextSession.phaseName ? `Giai đoạn: ${nextSession.phaseName}` : "Lộ trình đào tạo"}{" "}
                    {nextSession.teacherName ? `· Giảng viên: ${nextSession.teacherName}` : ""}
                  </p>

                  <div className="mt-3 pt-3 border-t border-rose-100/60">
                    <strong className="text-xs font-bold text-gray-800 block mb-1">
                      📚 Tài liệu cần chuẩn bị trước buổi học:
                    </strong>
                    <ul className={styles.prepList}>
                      {nextSession.prepMaterials.map((mat, i) => (
                        <li key={i}>{mat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 pt-2">
                    <strong className="text-xs font-bold text-gray-800 block mb-1">
                      ✅ Nhiệm vụ cần hoàn thành trước khi vào lớp:
                    </strong>
                    <ul className={styles.prepList}>
                      {nextSession.prerequisiteTasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyStateClean}>
                  <CalendarCheck size={28} weight="duotone" />
                  <p>Hiện chưa có buổi học sắp tới nào được lên lịch.</p>
                </div>
              )}
            </article>

            {/* Điểm yếu đang lặp lại (Weakness Radar) */}
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <TrendDown size={19} weight="duotone" className="text-rose-600" />
                    Điểm yếu đang lặp lại
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Tổng hợp từ các câu sai thực tế trong bài thi (chỉ xuất hiện khi có đủ dữ liệu thật)
                  </p>
                </div>
              </div>

              {weaknesses.length > 0 ? (
                <div>
                  {weaknesses.map((item, index) => (
                    <div key={index} className={styles.weaknessAlert}>
                      <WarningCircle size={20} weight="fill" className={styles.weaknessIcon} />
                      <div className={styles.weaknessText}>
                        <h4>
                          {item.questionType} (Sai {item.errorCount} lần)
                        </h4>
                        <p>{item.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateClean}>
                  <CheckCircle size={32} weight="fill" />
                  <p className="font-semibold text-gray-800 mt-2">
                    Chưa phát hiện điểm yếu lặp lại
                  </p>
                  <span className="text-xs text-gray-500 block max-w-md mx-auto mt-1">
                    Hệ thống chỉ cảnh báo khi phát hiện học viên sai cùng một dạng bài từ 2 lần trở lên
                    để bảo đảm tính xác thực và không suy đoán số liệu giả.
                  </span>
                </div>
              )}
            </article>
          </div>

          {/* Cột Phải (4 phần): Tiến độ mục tiêu & Phản hồi giáo viên */}
          <div className={styles.bentoCol4}>
            {/* Tiến độ theo mục tiêu tuần */}
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>
                  <Target size={18} weight="duotone" className="text-[#894C5B]" /> Tiến độ mục tiêu
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Bài hoàn thành tuần này</span>
                    <strong className="text-gray-900 font-bold">
                      {goalProgress.weeklyCompletedCount}/{goalProgress.weeklyTarget} bài
                    </strong>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#894C5B] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (goalProgress.weeklyCompletedCount / Math.max(1, goalProgress.weeklyTarget)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Tỷ lệ nhiệm vụ đúng hạn</span>
                    <strong className="text-emerald-600 font-bold">
                      {goalProgress.onTimeRate}%
                    </strong>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${goalProgress.onTimeRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Tiến độ buổi học</span>
                    <strong className="text-indigo-600 font-bold">
                      {sessionProgressPercent}%
                    </strong>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${sessionProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>

            {/* Phản hồi của giáo viên */}
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>
                  <Sparkle size={18} weight="duotone" className="text-amber-600" />
                  Nhận xét của giáo viên
                </h3>
              </div>

              {teacherFeedback.length > 0 ? (
                <div className="space-y-3">
                  {teacherFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 rounded-xl border border-gray-100 bg-[#fdfbf9] text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="text-gray-900 font-bold">{fb.teacherName}</strong>
                        {fb.isRevisionRequired && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                            Cần làm lại
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 italic">&ldquo;{fb.feedback}&rdquo;</p>
                      {fb.verifiedScore != null && (
                        <div className="text-emerald-700 font-bold text-[11px]">
                          Điểm đánh giá: {fb.verifiedScore}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateClean}>
                  <FileText size={24} weight="duotone" />
                  <p className="text-xs text-gray-500 mt-1">Chưa có nhận xét mới từ giáo viên.</p>
                </div>
              )}
            </article>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LỘ TRÌNH KHÓA HỌC THEO BUỔI (ROADMAP)
         ========================================================================= */}
      {activeTab === "roadmap" && (
        <div className={styles.roadmapTimeline}>
          {sessions.length > 0 ? (
            sessions.map((sess) => {
              const isDone = sess.status === "COMPLETED";
              const isNext = sess.status === "SCHEDULED";

              return (
                <article key={sess.id} className={styles.sessionCard}>
                  <div className={styles.sessionIndex}>
                    <span>{String(sess.sessionNo).padStart(2, "0")}</span>
                    <small>Buổi</small>
                  </div>

                  <div className={styles.sessionMain}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-[#894C5B] uppercase tracking-wide">
                        {sess.phaseName || "Lộ trình đào tạo"}
                      </span>
                    </div>

                    <h3>{sess.title || `Buổi học ${sess.sessionNo}`}</h3>

                    <div className={styles.sessionMeta}>
                      <span>
                        <CalendarBlank size={14} className="inline mr-1" />
                        {sess.startsAt
                          ? new Date(sess.startsAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Chưa xếp lịch"}
                      </span>
                      {sess.teacherName && (
                        <span>
                          <User size={14} className="inline mr-1" />
                          {sess.teacherName}
                        </span>
                      )}
                    </div>

                    {/* Bài tập hoặc Recording của buổi */}
                    {sess.zoomUrl && isNext && (
                      <div className="mt-3">
                        <a
                          href={sess.zoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <VideoCamera size={14} weight="fill" /> Link phòng học trực tuyến
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`${styles.sessionStatusPill} ${
                        isDone
                          ? styles.statusCompleted
                          : isNext
                          ? styles.statusScheduled
                          : styles.statusCancelled
                      }`}
                    >
                      {isDone ? "Đã học" : isNext ? "Sắp tới" : "Đã hủy"}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.card}>
              <div className={styles.emptyStateClean}>
                <CalendarBlank size={32} weight="duotone" />
                <p className="mt-2 text-gray-700 font-semibold">Chưa có lịch buổi học</p>
                <span className="text-xs text-gray-500">
                  Lộ trình chi tiết sẽ được hiển thị khi trung tâm sắp xếp thời khóa biểu.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: KHO HỌC LIỆU CỦA KHÓA HỌC (CURATED LIBRARY)
         ========================================================================= */}
      {activeTab === "library" && (
        <div>
          {/* Header Kho học liệu: Bộ lọc phân loại & Tìm kiếm */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
            <div className={styles.libraryFilters}>
              <button
                type="button"
                onClick={() => setLibraryFilter("ALL")}
                className={`${styles.filterPill} ${libraryFilter === "ALL" ? styles.filterPillActive : ""}`}
              >
                Tất cả ({resources.length})
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("PDF")}
                className={`${styles.filterPill} ${libraryFilter === "PDF" ? styles.filterPillActive : ""}`}
              >
                📄 Slide &amp; PDF
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("AUDIO")}
                className={`${styles.filterPill} ${libraryFilter === "AUDIO" ? styles.filterPillActive : ""}`}
              >
                🎧 Audio
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("TRANSCRIPT")}
                className={`${styles.filterPill} ${
                  libraryFilter === "TRANSCRIPT" ? styles.filterPillActive : ""
                }`}
              >
                📝 Transcript
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("KEY")}
                className={`${styles.filterPill} ${libraryFilter === "KEY" ? styles.filterPillActive : ""}`}
              >
                🔑 Đáp án
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("VOCAB")}
                className={`${styles.filterPill} ${libraryFilter === "VOCAB" ? styles.filterPillActive : ""}`}
              >
                📚 Vocabulary
              </button>
              <button
                type="button"
                onClick={() => setLibraryFilter("VIDEO")}
                className={`${styles.filterPill} ${libraryFilter === "VIDEO" ? styles.filterPillActive : ""}`}
              >
                🎥 Recording
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Tìm tài liệu..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-gray-200 bg-white focus:outline-none focus:border-[#894C5B]"
              />
            </div>
          </div>

          {/* Grid tài liệu */}
          {filteredResources.length > 0 ? (
            <div className={styles.resourceGrid}>
              {filteredResources.map((res) => {
                const isPdf = res.fileRole === "MAIN" || res.resourceType === "DOCUMENT";
                const isAudio = res.fileRole === "AUDIO" || res.resourceType === "AUDIO";
                const isKey = res.fileRole === "ANSWER_KEY";
                const isTranscript = res.fileRole === "TRANSCRIPT";

                return (
                  <article key={res.id} className={styles.resourceCard}>
                    <div className="flex items-start gap-3">
                      <div className={styles.resTypeIcon}>
                        {isPdf ? (
                          <FilePdf size={22} weight="duotone" />
                        ) : isAudio ? (
                          <Headphones size={22} weight="duotone" />
                        ) : isKey ? (
                          <CheckCircle size={22} weight="duotone" />
                        ) : isTranscript ? (
                          <FileText size={22} weight="duotone" />
                        ) : (
                          <BookOpenText size={22} weight="duotone" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {res.skill} · {res.resourceType}
                          </span>
                          {res.sessionNo != null && (
                            <span className="text-[10px] font-bold text-[#894C5B] bg-rose-50 px-1.5 py-0.2 rounded">
                              Buổi {res.sessionNo}
                            </span>
                          )}
                        </div>
                        <h4>{res.title}</h4>
                      </div>
                    </div>

                    <div>
                      {res.externalUrl ? (
                        <a
                          href={res.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.resDownloadBtn}
                        >
                          <DownloadSimple size={15} weight="bold" /> Xem &amp; Tải tài liệu
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic block text-center">
                          Tài liệu nội bộ
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.emptyStateClean}>
                <BookOpenText size={32} weight="duotone" />
                <p className="mt-2 text-gray-700 font-semibold">Không tìm thấy tài liệu phù hợp</p>
                <span className="text-xs text-gray-500">
                  Tài liệu của khóa học sẽ được cập nhật liên tục theo từng buổi học.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: BÁO CÁO KỸ NĂNG & NHẬT KÝ HỌC TẬP
         ========================================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* 1. Báo cáo năng lực kỹ năng */}
          <article className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>
                  <TrendUp size={19} weight="duotone" className="text-[#894C5B]" />
                  Báo cáo cá nhân hóa theo kỹ năng
                </h3>
                <p className={styles.cardSubtitle}>
                  Thống kê kết quả từ các bài kiểm tra thực tế trong hệ thống
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-[#fdfbf9]">
                <span className="text-xs text-gray-500 font-medium">Độ chính xác Reading</span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {skills.readingAccuracy != null ? `${skills.readingAccuracy}%` : "—"}
                </div>
                <small className="text-[11px] text-gray-500">Từ các bài thi đã nộp</small>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-[#fdfbf9]">
                <span className="text-xs text-gray-500 font-medium">Độ chính xác Listening</span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {skills.listeningAccuracy != null ? `${skills.listeningAccuracy}%` : "—"}
                </div>
                <small className="text-[11px] text-gray-500">Chưa có bài đánh giá</small>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-[#fdfbf9]">
                <span className="text-xs text-gray-500 font-medium">Số bài test hoàn thành</span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {skills.totalCompletedTests}
                </div>
                <small className="text-[11px] text-gray-500">
                  {skills.totalQuestionsAnswered} câu đã trả lời
                </small>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-[#fdfbf9]">
                <span className="text-xs text-gray-500 font-medium">Band mục tiêu</span>
                <div className="text-2xl font-black text-[#894C5B] mt-1">
                  {skills.targetBand != null ? skills.targetBand : "—"}
                </div>
                <small className="text-[11px] text-gray-500">
                  Hiện tại: {skills.overallBand != null ? skills.overallBand : "Chưa test"}
                </small>
              </div>
            </div>
          </article>

          {/* 2. Nhật ký học tập (Study Log Table) */}
          <article className={styles.card}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className={styles.cardTitle}>
                  <BookOpenText size={18} weight="duotone" className="text-[#894C5B]" />
                  Nhật ký học tập &amp; Lịch sử làm bài
                </h3>
                <p className={styles.cardSubtitle}>
                  Danh sách bài làm, phân biệt rõ kết quả tự động từ hệ thống và tự báo cáo
                </p>
              </div>

              {/* Bộ lọc bảng */}
              <div className="flex items-center gap-2">
                <select
                  value={studyLogSkillFilter}
                  onChange={(e) => setStudyLogSkillFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="ALL">Tất cả kỹ năng</option>
                  <option value="READING">Reading</option>
                  <option value="LISTENING">Listening</option>
                  <option value="WRITING">Writing</option>
                  <option value="SPEAKING">Speaking</option>
                </select>

                <select
                  value={studyLogPlatformFilter}
                  onChange={(e) => setStudyLogPlatformFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="ALL">Tất cả nguồn</option>
                  <option value="SYSTEM">Hệ thống xác nhận</option>
                  <option value="EXTERNAL">Tự báo cáo</option>
                </select>
              </div>
            </div>

            {filteredStudyLogs.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.studyLogTable}>
                  <thead>
                    <tr>
                      <th>Tên bài làm / Đề thi</th>
                      <th>Kỹ năng</th>
                      <th>Điểm &amp; Tỷ lệ</th>
                      <th>Nguồn dữ liệu</th>
                      <th>Thời gian nộp</th>
                      <th className="text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudyLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <strong>{log.testTitle}</strong>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-gray-700">{log.skill}</span>
                        </td>
                        <td>
                          {log.score != null ? (
                            <strong className="text-gray-900 font-bold">
                              {log.correctCount != null
                                ? `${log.correctCount}/${log.totalQuestions} câu`
                                : `${log.score}/${log.maxScore}`}
                            </strong>
                          ) : (
                            <span className="text-gray-400">Đang làm dở</span>
                          )}
                        </td>
                        <td>
                          {log.source === "SYSTEM" ? (
                            <span className={styles.sourceBadgeVerified}>
                              <CheckCircle size={12} weight="fill" /> Hệ thống
                            </span>
                          ) : (
                            <span className={styles.sourceBadgeReported}>
                              <User size={12} weight="bold" /> Tự báo cáo
                            </span>
                          )}
                        </td>
                        <td className="text-gray-500 text-xs">
                          {log.completedAt
                            ? new Date(log.completedAt).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="text-right">
                          <Link
                            href={log.reviewUrl}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#894C5B] hover:underline"
                          >
                            Mở bài làm <ArrowRight size={13} weight="bold" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyStateClean}>
                <BookOpenText size={28} weight="duotone" />
                <p className="mt-2 text-gray-700 font-semibold">Chưa có lịch sử làm bài</p>
                <span className="text-xs text-gray-500">
                  Khi bạn hoàn thành các bài thi hoặc báo cáo, kết quả sẽ tự động lưu lại ở đây.
                </span>
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
