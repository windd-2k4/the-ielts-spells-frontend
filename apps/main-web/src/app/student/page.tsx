"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { StudentAiStatusCard } from "@/features/student-hub/StudentAiStatusCard";
import { StudentCourseRecommendations } from "@/features/student-hub/StudentCourseRecommendations";
import { StudentHeroWelcome } from "@/features/student-hub/StudentHeroWelcome";
import { StudentMyCoursesSection, type CourseEnrollmentItem } from "@/features/student-hub/StudentMyCoursesSection";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentProgressSnapshot } from "@/features/student-hub/StudentProgressSnapshot";
import { StudentRecentAttemptsSection, type RecentAttemptItem } from "@/features/student-hub/StudentRecentAttemptsSection";
import { StudentRoadmapMilestones } from "@/features/student-hub/StudentRoadmapMilestones";
import { StudentSchedulePreview } from "@/features/student-hub/StudentSchedulePreview";
import { StudentUpcomingTasks } from "@/features/student-hub/StudentUpcomingTasks";
import { buildStudentRoadmap, formatDateTime, skillPairLabel } from "@/features/student-hub/studentPortalViewModel";

export default function StudentDashboardPage() {
  return <StudentDashboardContent />;
}

function StudentDashboardContent() {
  const { data, loading, error, refresh } = useStudentPortal();

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-[24px] border border-[#E8E2D5] bg-white p-6 text-center">
        <div className="max-w-md">
          <WarningCircle size={38} className="mx-auto text-[#B42335]" weight="duotone" />
          <h2 className="mt-4 text-xl font-bold text-[#292528]">Không tải được góc học tập</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F676C]">{error}</p>
          <button type="button" onClick={() => void refresh()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#894C5B] px-5 text-sm font-bold text-white">
            <ArrowClockwise size={17} weight="bold" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeAttempt = data.recentAttempts.find((attempt) => attempt.status === "IN_PROGRESS");
  const pendingAssignments = data.readingAssignments.filter((item) => item.attemptsUsed < item.maxAttempts);
  const tasks = [
    ...pendingAssignments.slice(0, 2).map((item) => ({
      id: item.assignmentId,
      title: item.title,
      type: "assignment" as const,
      skillPair: item.courseName,
      dueDate: item.closesAt ? new Date(item.closesAt).toLocaleDateString("vi-VN") : "Không giới hạn",
      actionUrl: "/student/reading",
      actionLabel: item.activeAttemptExpiresAt ? "Tiếp tục làm bài" : "Mở bài Reading",
    })),
    ...data.upcomingSessions.slice(0, 1).map((session) => ({
      id: session.sessionId,
      title: session.title || `${session.courseName} · Buổi ${session.sessionNo}`,
      type: "session" as const,
      skillPair: session.courseName,
      sessionTime: formatDateTime(session.startsAt),
      actionUrl: "/student/schedule",
      actionLabel: "Xem lịch học",
    })),
  ];

  const courses: CourseEnrollmentItem[] = data.enrollments.map((item) => ({
    id: item.enrollmentId,
    courseId: item.courseId,
    courseTitle: item.courseName,
    skillPair: skillPairLabel(item.skillPair),
    teacherName: item.primaryTeacherName || "Chưa phân công",
    progressPercent: item.totalSessions > 0 ? Math.min(100, Math.round((item.completedSessions / item.totalSessions) * 100)) : 0,
    completedSessions: item.completedSessions,
    totalSessions: item.totalSessions,
    nextSessionText: item.nextSessionAt ? formatDateTime(item.nextSessionAt) : undefined,
    status: item.status,
    href: `/student/courses#course-${item.courseId}`,
  }));

  const attempts: RecentAttemptItem[] = data.recentAttempts.map((attempt) => ({
    id: attempt.attemptId,
    testTitle: attempt.title,
    skill: "IELTS Reading",
    completedDate: formatDateTime(attempt.submittedAt ?? attempt.startedAt),
    scoreText: attempt.submittedAt && attempt.score != null
      ? `${attempt.correctCount ?? 0}/${attempt.totalQuestions} câu · ${Math.round((attempt.score / Math.max(attempt.maxScore, 1)) * 100)}%`
      : "Đang làm dở",
    reviewUrl: attempt.submittedAt
      ? `/student/reading/attempts/${attempt.attemptId}/result`
      : `/student/reading/attempts/${attempt.attemptId}`,
  }));

  return (
    <div className="space-y-8">
      <StudentHeroWelcome
        data={data}
        unsubmittedAttempt={activeAttempt ? { id: activeAttempt.attemptId, title: activeAttempt.title, skill: "Reading" } : null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        <StudentUpcomingTasks tasks={tasks} loading={false} />
        <StudentSchedulePreview sessions={data.upcomingSessions} />
      </div>

      <StudentMyCoursesSection courses={courses} loading={false} />
      <StudentProgressSnapshot data={data} />
      <StudentRoadmapMilestones milestones={buildStudentRoadmap(data)} />
      <StudentCourseRecommendations courses={data.recommendedCourses} hasTarget={data.profile.targetBand != null} />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <StudentRecentAttemptsSection attempts={attempts} />
        <StudentAiStatusCard />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải dữ liệu học tập">
      <div className="h-72 animate-pulse rounded-[24px] bg-[#7B4855]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[22px] border border-[#E8E2D5] bg-white" />)}
      </div>
    </div>
  );
}
