import Link from "next/link";
import { ArrowRight, BookOpenText, ChartLineUp, Headphones, Microphone, PencilCircle } from "@phosphor-icons/react";
import type { StudentPortalOverview } from "./studentPortalApi";
import { formatBand } from "./studentPortalViewModel";

export function StudentProgressSnapshot({ data }: { data: StudentPortalOverview }) {
  const completedReading = data.recentAttempts.filter(
    (attempt) => attempt.submittedAt && attempt.score != null && attempt.maxScore > 0,
  );
  const totalScore = completedReading.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
  const totalMaxScore = completedReading.reduce((sum, attempt) => sum + attempt.maxScore, 0);
  const readingAccuracy = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : null;

  const skills = [
    { id: "reading", name: "Reading", icon: <BookOpenText size={18} />, value: readingAccuracy == null ? null : `${readingAccuracy}%`, note: completedReading.length > 0 ? `${completedReading.length} bài đã nộp` : "Chưa có bài đã nộp" },
    { id: "listening", name: "Listening", icon: <Headphones size={18} />, value: null, note: "Chưa có dữ liệu đánh giá" },
    { id: "writing", name: "Writing", icon: <PencilCircle size={18} />, value: null, note: "Chưa có dữ liệu đánh giá" },
    { id: "speaking", name: "Speaking", icon: <Microphone size={18} />, value: null, note: "Chưa có dữ liệu đánh giá" },
  ];

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Dữ liệu năng lực</p>
          <h2 className="mt-1 text-xl font-bold text-[#292528]">Tiến độ IELTS</h2>
          <p className="mt-1 text-xs text-[#6F676C]">Chỉ hiển thị kết quả đã được hệ thống ghi nhận.</p>
        </div>
        <Link href="/student/progress" className="hidden items-center gap-1 text-xs font-bold text-[#894C5B] hover:underline sm:flex">Chi tiết <ArrowRight size={13} /></Link>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#E8E2D5] bg-white">
        <div className="grid gap-px bg-[#E8E2D5] sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
            <div key={skill.id} className="bg-white p-4">
              <div className="flex items-center justify-between text-[#894C5B]">
                {skill.icon}
                <span className="text-lg font-bold text-[#292528]">{skill.value ?? "—"}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-[#292528]">{skill.name}</p>
              <p className="mt-1 text-[11px] text-[#6F676C]">{skill.note}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 bg-[#F7F5F4] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>Band hiện tại: <strong className="text-[#292528]">{formatBand(data.profile.currentBand)}</strong></span>
          <span>Mục tiêu: <strong className="text-[#894C5B]">{formatBand(data.profile.targetBand)}</strong></span>
          <span className="inline-flex items-center gap-1.5 text-[#6F676C]"><ChartLineUp size={15} /> Band kỹ năng chỉ hiện khi có kết quả tương ứng.</span>
        </div>
      </div>
    </section>
  );
}
