"use client";

import { CalendarCheck, Clock, User, VideoCamera } from "@phosphor-icons/react";
import { StudentEmptyState } from "@/features/student-hub/StudentEmptyState";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { formatDateTime } from "@/features/student-hub/studentPortalViewModel";

export default function StudentSchedulePage() {
  const { data, loading } = useStudentPortal();
  const sessions = data?.upcomingSessions ?? [];

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Thời khóa biểu</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Lịch học sắp tới</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Lịch và giáo viên dạy buổi được đồng bộ trực tiếp từ management-web.</p>
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[22px] border border-[#E8E2D5] bg-white" />)}</div>
      ) : sessions.length === 0 ? (
        <StudentEmptyState
          icon={<CalendarCheck size={36} weight="duotone" className="text-[#894C5B]" />}
          title="Chưa có buổi học sắp tới"
          description="Khi khóa đang hoạt động được xếp lịch, buổi học sẽ tự động xuất hiện ở đây."
          actionLabel="Xem khóa học của tôi"
          actionHref="/student/courses"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <article key={session.sessionId} className="grid gap-4 rounded-[22px] border border-[#E8E2D5] bg-white p-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <div className="rounded-2xl bg-[#F7E5EA] p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#894C5B]">Buổi {session.sessionNo}</p>
                <p className="mt-1 text-sm font-bold text-[#292528]">{new Date(session.startsAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#292528]">{session.title || session.courseName}</h3>
                <p className="mt-1 text-xs text-[#6F676C]">{session.courseCode} · {session.courseName}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6F676C]">
                  <span className="inline-flex items-center gap-1.5"><Clock size={15} />{formatDateTime(session.startsAt)}</span>
                  <span className="inline-flex items-center gap-1.5"><User size={15} />{session.teacherName || "Đang cập nhật giáo viên"}</span>
                </div>
              </div>
              {session.zoomUrl ? (
                <a href={session.zoomUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#894C5B] px-4 text-xs font-bold text-white hover:bg-[#753E4B]">
                  <VideoCamera size={17} weight="fill" /> Vào phòng học
                </a>
              ) : <span className="text-xs font-semibold text-[#6F676C]">Chưa có link học</span>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
