import Link from "next/link";
import { ArrowRight, CalendarBlank, Compass, GraduationCap } from "@phosphor-icons/react";
import type { StudentCourseRecommendation } from "./studentPortalApi";
import { formatBand, skillPairLabel } from "./studentPortalViewModel";

export function StudentCourseRecommendations({ courses, hasTarget }: { courses: StudentCourseRecommendation[]; hasTarget: boolean }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Bước tiếp theo</p>
          <h2 className="mt-1 text-xl font-bold text-[#292528]">{hasTarget ? "Gợi ý theo mục tiêu" : "Khóa học đang tuyển sinh"}</h2>
          <p className="mt-1 text-xs text-[#6F676C]">
            {hasTarget ? "Tham khảo theo band mục tiêu. Cố vấn sẽ hỗ trợ xác định khóa phù hợp với đầu vào của bạn." : "Tìm hiểu chương trình học và trao đổi với cố vấn trước khi ghi danh."}
          </p>
        </div>
        <Compass size={25} className="shrink-0 text-[#894C5B]" weight="duotone" />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#DED7DA] bg-white px-5 py-8 text-center">
          <GraduationCap size={28} className="mx-auto text-[#894C5B]" weight="duotone" />
          <p className="mt-3 text-sm font-bold text-[#292528]">Chưa có khóa công khai đang mở</p>
          <p className="mt-1 text-xs text-[#6F676C]">Bạn có thể gửi yêu cầu tư vấn để trung tâm hỗ trợ xếp lộ trình.</p>
          <Link href="/#consultation" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#894C5B] px-4 text-xs font-bold text-white">
            Liên hệ tư vấn <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      ) : (
        <div className={`grid gap-3 ${courses.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {courses.slice(0, 3).map((course) => (
            <article key={course.courseId} className="flex flex-col rounded-2xl border border-[#E8E2D5] bg-white p-5 transition-colors hover:border-[#CDAAB3]">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#F7E5EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#894C5B]">{course.code}</span>
                <span className="text-xs font-bold text-[#6F676C]">
                  {course.targetBand == null ? "Chưa đặt Band" : `Band ${formatBand(course.targetBand)}`}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold leading-snug text-[#292528]">{course.name}</h3>
              <p className="mt-1 text-xs text-[#6F676C]">{skillPairLabel(course.skillPair)}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#6F676C]">{course.reason}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
                <span className="flex items-center gap-1.5 text-[#6F676C]"><CalendarBlank size={15} /> {new Date(course.startsOn).toLocaleDateString("vi-VN")}</span>
                <Link href="/#consultation" className="inline-flex items-center gap-1 font-bold text-[#894C5B] hover:underline">Nhận tư vấn <ArrowRight size={13} /></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
