import Link from "next/link";
import { ArrowRight, CalendarBlank, Clock, VideoCamera } from "@phosphor-icons/react";
import type { StudentPortalSession } from "./studentPortalApi";
import { formatDateTime } from "./studentPortalViewModel";

export function StudentSchedulePreview({ sessions }: { sessions: StudentPortalSession[] }) {
  const nextSession = sessions[0];

  return (
    <section className="rounded-[22px] border border-[#E8E2D5] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Lịch học</p>
          <h3 className="mt-1 text-lg font-bold text-[#292528]">Buổi học tiếp theo</h3>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FEF9C3] text-[#894C5B]">
          <CalendarBlank size={21} weight="duotone" />
        </span>
      </div>

      {nextSession ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-[#292528]">{nextSession.title || `Buổi ${nextSession.sessionNo}`}</p>
          <p className="mt-1 text-xs text-[#6F676C]">{nextSession.courseCode} · {nextSession.courseName}</p>
          <div className="mt-4 space-y-2 text-xs text-[#6F676C]">
            <p className="flex items-center gap-2"><Clock size={16} className="text-[#894C5B]" />{formatDateTime(nextSession.startsAt)}</p>
            <p>Giáo viên: <strong className="text-[#292528]">{nextSession.teacherName || "Đang cập nhật"}</strong></p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {nextSession.zoomUrl && (
              <a href={nextSession.zoomUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#894C5B] px-4 text-xs font-bold text-white transition hover:bg-[#753E4B]">
                <VideoCamera size={17} weight="fill" /> Vào phòng học
              </a>
            )}
            <Link href="/student/schedule" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DED7DA] px-4 text-xs font-bold text-[#894C5B] hover:bg-[#F7E5EA]">
              Xem lịch đầy đủ <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-[#F7F5F4] p-4">
          <p className="text-sm font-semibold text-[#292528]">Chưa có buổi học sắp tới</p>
          <p className="mt-1 text-xs leading-5 text-[#6F676C]">Lịch sẽ xuất hiện khi management-web xếp buổi học cho khóa đang hoạt động.</p>
        </div>
      )}
    </section>
  );
}
