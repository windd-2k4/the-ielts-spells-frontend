"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  ChartLineUp,
  Books,
  Clock,
  User,
  VideoCamera,
  Trophy,
  ArrowSquareOut,
  Sparkle,
  ShieldCheck,
  Headphones,
  Article,
  Microphone,
  PenNib,
  Check,
  Lightning,
  Target,
  FilePdf,
  FileAudio,
  Fire,
  Play,
  LockKey,
} from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import {
  fetchSystemCourses,
  type DatabaseCourseItem,
  type StudentPortalEnrollment,
} from "@/features/student-hub/studentPortalApi";
import { skillPairLabel } from "@/features/student-hub/studentPortalViewModel";

type DetailTab = "roadmap" | "attendance" | "skills" | "resources";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const rawCourseId = params?.courseId as string;

  const { data, loading: portalLoading } = useStudentPortal();
  const [systemCourses, setSystemCourses] = useState<DatabaseCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("roadmap");

  // Load courses
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingCourses(true);
      try {
        const courses = await fetchSystemCourses();
        if (isMounted) setSystemCourses(courses);
      } catch (err) {
        console.error("Error loading system courses:", err);
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Match enrollment
  const enrollment: StudentPortalEnrollment | null = useMemo(() => {
    if (!data?.enrollments || !rawCourseId) return null;
    return (
      data.enrollments.find(
        (e) =>
          e.courseId === rawCourseId ||
          e.courseCode.toLowerCase() === rawCourseId.toLowerCase(),
      ) ?? null
    );
  }, [data?.enrollments, rawCourseId]);

  // Match course
  const course: DatabaseCourseItem | null = useMemo(() => {
    const found = systemCourses.find(
      (c) =>
        c.id === rawCourseId ||
        c.code.toLowerCase() === rawCourseId.toLowerCase(),
    );
    if (found) return found;
    if (enrollment) {
      return {
        id: enrollment.courseId,
        code: enrollment.courseCode,
        name: enrollment.courseName,
        description: enrollment.description,
        level: enrollment.level,
        skillPair: enrollment.skillPair,
        targetBand: enrollment.courseTargetBand,
        totalSessions: enrollment.totalSessions,
        tuitionAmount: null,
        capacity: 24,
        startsOn: enrollment.startsOn,
        endsOn: enrollment.endsOn,
        status: enrollment.status === "ACTIVE" ? "ACTIVE" : "OPEN",
        isPublic: true,
        isActive: true,
      };
    }
    return null;
  }, [systemCourses, rawCourseId, enrollment]);

  const totalSessions = course?.totalSessions || enrollment?.totalSessions || 12;
  const completedSessions = enrollment?.completedSessions || 1;
  const progressPercent =
    totalSessions > 0 ? Math.min(100, Math.round((completedSessions / totalSessions) * 100)) : 0;

  const studentName = data?.profile.fullName?.split(" ").slice(-2).join(" ") || "Học viên";
  const targetBand = data?.profile.targetBand ?? course?.targetBand ?? 6.5;
  const currentBand = data?.profile.currentBand ?? 5.5;
  const teacherName = enrollment?.primaryTeacherName || "Giảng viên IELTS Spells";

  // Concise, structured session milestones (No long text walls!)
  const roadmapSessions = useMemo(() => {
    const isLR = course?.skillPair === "LISTENING_READING";

    const lrMilestones = [
      { no: 1, title: "Diagnostic Test & Skimming", tag: "Chiến thuật", time: "Thứ 2, 14/09 · 18:30" },
      { no: 2, title: "Listening: Form Completion", tag: "Kỹ năng nghe", time: "Thứ 4, 16/09 · 18:30" },
      { no: 3, title: "Reading: True / False / Not Given", tag: "Kỹ năng đọc", time: "Thứ 2, 21/09 · 18:30" },
      { no: 4, title: "Listening: Map-Labelling", tag: "Kỹ năng nghe", time: "Thứ 4, 23/09 · 18:30" },
      { no: 5, title: "Reading: Matching Headings", tag: "Kỹ năng đọc", time: "Thứ 2, 28/09 · 18:30" },
      { no: 6, title: "Mid-term Assessment Review", tag: "Đánh giá", time: "Thứ 4, 30/09 · 18:30" },
      { no: 7, title: "Listening: Sentence Completion", tag: "Luyện đề", time: "Thứ 2, 05/10 · 18:30" },
      { no: 8, title: "Reading: Matching Features", tag: "Luyện đề", time: "Thứ 4, 07/10 · 18:30" },
      { no: 9, title: "Full Practice Test 1", tag: "Thi thử", time: "Thứ 2, 12/10 · 18:30" },
      { no: 10, title: "Listening Forecast: Distractors", tag: "Forecast 2026", time: "Thứ 4, 14/10 · 18:30" },
      { no: 11, title: "Reading Forecast: Tối ưu 60 phút", tag: "Forecast 2026", time: "Thứ 2, 19/10 · 18:30" },
      { no: 12, title: "Final Assessment & Chuẩn đầu ra", tag: "Tổng kết", time: "Thứ 4, 21/10 · 18:30" },
    ];

    const swMilestones = [
      { no: 1, title: "Diagnostic Speaking & Writing", tag: "Đánh giá", time: "Thứ 2, 14/09 · 18:30" },
      { no: 2, title: "Speaking Part 1: Fluency", tag: "Phản xạ nói", time: "Thứ 4, 16/09 · 18:30" },
      { no: 3, title: "Writing Task 1: Line & Bar Chart", tag: "Báo cáo", time: "Thứ 2, 21/09 · 18:30" },
      { no: 4, title: "Writing Task 2: Opinion Essay", tag: "Nghị luận", time: "Thứ 4, 23/09 · 18:30" },
    ];

    const source = isLR ? lrMilestones : swMilestones;
    return source.slice(0, totalSessions).map((s) => {
      const isDone = s.no <= completedSessions;
      const isNext = s.no === completedSessions + 1;
      return {
        ...s,
        status: isDone ? ("DONE" as const) : isNext ? ("CURRENT" as const) : ("LOCKED" as const),
      };
    });
  }, [course?.skillPair, totalSessions, completedSessions]);

  const currentSession = roadmapSessions.find((s) => s.status === "CURRENT") || roadmapSessions[0];

  if (loadingCourses || portalLoading) {
    return (
      <div className="py-12 space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-5 w-40 bg-stone-200 rounded-lg" />
        <div className="h-44 bg-white rounded-3xl border border-[#E8E2D5]" />
        <div className="h-64 bg-white rounded-3xl border border-[#E8E2D5]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center mx-auto">
          <Books size={28} weight="bold" />
        </div>
        <h2 className="text-lg font-bold text-[#292528]">Không tìm thấy khóa học</h2>
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#894C5B] text-white text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách khóa học</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <div>
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C857B] hover:text-[#894C5B] transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Quay lại Khóa học của tôi</span>
        </Link>
      </div>

      {/* 1. COMPACT HERO HEADER (Minimal text, maximum visual delight) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#241a20] via-[#2c1a24] to-[#1a1217] text-white p-6 sm:p-7 shadow-lg border border-[#F4C430]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#894C5B] text-white text-[10px] font-extrabold tracking-wider uppercase">
                {course.code}
              </span>
              <span className="text-xs text-stone-300">· {skillPairLabel(course.skillPair)}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-serif">
              {course.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-300 pt-1">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-[#F4C430]" />
                <span>{teacherName}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Target size={14} />
                <span>Mục tiêu Band {targetBand.toFixed(1)}</span>
              </span>
            </div>
          </div>

          {/* Right Stats Quick Gauge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Progress Gauge */}
            <div className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center space-y-1">
              <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
                Tiến độ khóa học
              </span>
              <div className="text-xl font-black text-amber-300">
                {completedSessions}/{totalSessions} <span className="text-xs font-normal text-stone-400">buổi</span>
              </div>
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-[#F4C430] to-amber-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Attendance Gauge */}
            <div className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center space-y-1">
              <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
                Chuyên cần
              </span>
              <div className="text-xl font-black text-emerald-400">100%</div>
              <span className="text-[10px] text-emerald-300 font-bold block">Đạt chuẩn đầu ra</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NEXT SESSION ACTION BANNER (Clear, single-action focus) */}
      {currentSession && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430] text-[#241a20] flex items-center justify-center shrink-0 shadow-2xs">
              <Lightning size={20} weight="fill" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#894C5B]">
                  Buổi tiếp theo
                </span>
                <span className="text-xs text-[#8C857B]">· {currentSession.time}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1E1B18]">
                Buổi {currentSession.no}: {currentSession.title}
              </h3>
            </div>
          </div>

          <a
            href="https://zoom.us/j/1234567890"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98"
          >
            <VideoCamera size={16} weight="bold" />
            <span>Vào lớp Online</span>
          </a>
        </section>
      )}

      {/* 3. SLEEK SEGMENTED TAB CONTROLS (Clean, minimal, 4 core dimensions) */}
      <div className="flex p-1 rounded-2xl bg-[#F4EFEA] border border-[#E8E2D5] max-w-lg">
        {[
          { id: "roadmap", label: "Lộ trình", icon: CalendarBlank, count: totalSessions },
          { id: "attendance", label: "Điểm danh", icon: CheckCircle, badge: "100%" },
          { id: "skills", label: "Kỹ năng & AI", icon: ChartLineUp },
          { id: "resources", label: "Học liệu", icon: Books, count: 4 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-[#894C5B] shadow-xs"
                  : "text-[#6F676C] hover:text-[#292528]"
              }`}
            >
              <Icon size={15} weight={isActive ? "bold" : "regular"} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: LỘ TRÌNH (Visual milestone cards, 0 clutter, scan in 3 seconds) */}
      {activeTab === "roadmap" && (
        <section className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-[#6F676C]">
            <span>Lộ trình {totalSessions} buổi học</span>
            <span className="font-bold text-[#894C5B]">Đã hoàn thành {completedSessions}/{totalSessions} buổi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roadmapSessions.map((session) => {
              const isDone = session.status === "DONE";
              const isCurrent = session.status === "CURRENT";

              return (
                <div
                  key={session.no}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? "bg-white border-emerald-200 shadow-2xs"
                      : isCurrent
                        ? "bg-[#FFFDF7] border-[#F4C430] shadow-xs ring-1 ring-[#F4C430]/30"
                        : "bg-white/60 border-[#E8E2D5] opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Visual Node */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isDone
                          ? "bg-emerald-100 text-emerald-800"
                          : isCurrent
                            ? "bg-[#894C5B] text-white"
                            : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {isDone ? <Check size={16} weight="bold" /> : session.no}
                    </div>

                    {/* Milestone Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-[#894C5B] uppercase tracking-wider">
                          Buổi {session.no}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[10px] font-medium">
                          {session.tag}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1B18] truncate">
                        {session.title}
                      </h4>
                      <p className="text-[11px] text-[#8C857B]">{session.time}</p>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <a
                        href="https://zoom.us/j/1234567890"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-2xs"
                      >
                        <Play size={11} weight="fill" />
                        <span>Học ngay</span>
                      </a>
                    ) : isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle size={13} weight="fill" />
                        <span>Đã học</span>
                      </span>
                    ) : (
                      <span className="text-stone-400 text-xs">
                        <LockKey size={16} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: ĐIỂM DANH (Visual Streak, Badges, 0 admin clutter) */}
      {activeTab === "attendance" && (
        <section className="space-y-5 animate-fadeIn">
          {/* Visual Streak & Commitment Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Fire size={24} weight="fill" className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#292528]">
                  Chuỗi Chuyên Cần 100%
                </h3>
                <p className="text-xs text-[#6F676C]">
                  Đã tham gia đầy đủ {completedSessions} buổi học · Đủ điều kiện bảo lưu & cam kết đầu ra
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ Cam kết Band {targetBand.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Clean 12-session attendance tracker chips */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#8C857B] uppercase tracking-wider">
              Nhật ký tham gia các buổi học
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {roadmapSessions.map((s) => {
                const isAttended = s.status === "DONE";
                const isNext = s.status === "CURRENT";

                return (
                  <div
                    key={s.no}
                    className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                      isAttended
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : isNext
                          ? "bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300/40"
                          : "bg-[#FAF8F5] border-[#E8E2D5] text-stone-500"
                    }`}
                  >
                    <div className="text-[10px] font-bold">Buổi {s.no}</div>
                    <div className="text-xs font-extrabold">
                      {isAttended ? "Có mặt" : isNext ? "Tiếp theo" : "Chưa học"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: KỸ NĂNG & AI SPELL TUTOR (Punchy, Visual gauges, 1-line insights) */}
      {activeTab === "skills" && (
        <section className="space-y-5 animate-fadeIn">
          {/* AI Magic Companion Tip (Punchy & Motivating) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#894C5B]/10 via-[#F4C430]/10 to-transparent border border-[#894C5B]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#894C5B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkle size={20} weight="fill" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#894C5B]">
                  AI Spell Tutor Đồng Hành
                </h4>
                <p className="text-xs sm:text-sm text-[#292528] font-medium">
                  {studentName} ơi! Kỹ năng đọc Skimming của bạn đã đạt <strong>100%</strong>. Hãy tập trung thêm vào dạng Form Completion ở buổi tới nhé!
                </p>
              </div>
            </div>

            <Link
              href="/student/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#894C5B] text-white text-xs font-bold hover:bg-[#68303d] transition-all shrink-0 shadow-2xs"
            >
              <span>Luyện tập ngay</span>
              <Trophy size={14} weight="bold" />
            </Link>
          </div>

          {/* 4 Visual Skill Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Reading", score: "88%", band: "Band 6.5", icon: Article, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Listening", score: "82%", band: "Band 6.0", icon: Headphones, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Writing", score: "6.0", band: "Band 6.0", icon: PenNib, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Speaking", score: "6.5", band: "Band 6.5", icon: Microphone, color: "text-rose-600", bg: "bg-rose-50" },
            ].map((skill) => {
              const Icon = skill.icon;
              return (
                <div key={skill.label} className="p-4 rounded-2xl bg-white border border-[#E8E2D5] space-y-2 text-center shadow-2xs">
                  <div className={`w-8 h-8 rounded-xl ${skill.bg} ${skill.color} flex items-center justify-center mx-auto`}>
                    <Icon size={18} weight="bold" />
                  </div>
                  <div className="text-xs font-bold text-[#554B50]">{skill.label}</div>
                  <div className="text-xl font-black text-[#1E1B18]">{skill.score}</div>
                  <span className="inline-block text-[10px] font-bold text-[#894C5B] bg-[#F7E5EA] px-2 py-0.5 rounded-full">
                    {skill.band}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: HỌC LIỆU (Instant access cards, 0 text walls) */}
      {activeTab === "resources" && (
        <section className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-[#6F676C]">
            <span>Kho tài liệu chính khóa ({course.name})</span>
            <span className="text-[11px] text-[#8C857B]">Lưu trữ đám mây Google Drive</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "res-1",
                title: "Reading Skimming Checklist",
                type: "PDF",
                tag: "Chiến thuật làm bài",
                icon: FilePdf,
                color: "text-rose-700 bg-rose-50",
                url: "https://ielts.org/",
              },
              {
                id: "res-2",
                title: "Cambridge 18 Audio Tracks & Scripts",
                type: "AUDIO",
                tag: "Luyện nghe chuẩn",
                icon: FileAudio,
                color: "text-emerald-700 bg-emerald-50",
                url: "https://ielts.org/",
              },
              {
                id: "res-3",
                title: "Bài tập: Remote Work (EX-SEED-LR-001)",
                type: "EXERCISE",
                tag: "Thực hành ngay",
                icon: Trophy,
                color: "text-amber-700 bg-amber-50",
                url: "/student/practice",
              },
              {
                id: "res-4",
                title: "Writing Task 2 Academic Vocab Pack",
                type: "PDF",
                tag: "Từ vựng C1",
                icon: FilePdf,
                color: "text-indigo-700 bg-indigo-50",
                url: "https://ielts.org/for-test-takers/test-format",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-[#E8E2D5] hover:border-[#894C5B]/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon size={20} weight="bold" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#894C5B] uppercase tracking-wider">
                        {item.tag}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1B18] truncate">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.type === "EXERCISE" ? (
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#894C5B] text-white text-xs font-bold hover:bg-[#68303d] transition-all"
                      >
                        <span>Làm bài</span>
                        <ArrowSquareOut size={13} />
                      </Link>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-[#894C5B] hover:bg-[#F7E5EA]/60 text-xs font-bold transition-all"
                      >
                        <span>Mở Drive</span>
                        <ArrowSquareOut size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
