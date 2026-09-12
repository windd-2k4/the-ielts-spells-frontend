"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle, ClockCounterClockwise, Flame, PlayCircle, Target } from "@phosphor-icons/react";
import type { StudentPortalOverview } from "./studentPortalApi";
import { formatBand, formatDateTime } from "./studentPortalViewModel";
import { StudentTargetBandControl } from "./StudentTargetBandControl";

interface StudentHeroWelcomeProps {
  data: StudentPortalOverview;
  unsubmittedAttempt?: { id: string; title: string; skill: string } | null;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function StudentHeroWelcome({ data, unsubmittedAttempt }: StudentHeroWelcomeProps) {
  const firstName = data.profile.fullName.trim().split(/\s+/).at(-1) || "Học viên";

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#71404D] bg-[#6E3D49] text-white shadow-[0_18px_45px_rgba(72,35,46,0.12)]">
      <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-6 sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F1C8D2]">Góc học tập cá nhân</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {firstName}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
            Ưu tiên bài cần hoàn thành, theo dõi lịch học và tiến gần hơn tới Band mục tiêu của bạn.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={<Target size={18} />} label="Mục tiêu" value={formatBand(data.profile.targetBand)} />
            <Metric icon={<BookOpenText size={18} />} label="Bài chờ làm" value={String(data.metrics.pendingTests)} />
            <Metric icon={<CheckCircle size={18} />} label="Bài đã nộp" value={String(data.metrics.completedAttempts)} />
            <Metric icon={<Flame size={18} />} label="Chuỗi học" value={`${data.metrics.currentStreakDays} ngày`} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={unsubmittedAttempt ? `/student/reading/attempts/${unsubmittedAttempt.id}` : "/student/assignments"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F5C842] px-5 text-sm font-bold text-[#292528] transition hover:-translate-y-px hover:bg-[#E8B92F]"
            >
              {unsubmittedAttempt ? <PlayCircle size={19} weight="fill" /> : <BookOpenText size={19} weight="bold" />}
              <span>{unsubmittedAttempt ? "Tiếp tục bài đang làm" : "Xem bài được giao"}</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
              <ClockCounterClockwise size={15} />
              {data.metrics.lastActivityAt
                ? `Hoạt động gần nhất ${formatDateTime(data.metrics.lastActivityAt)}`
                : "Chưa có hoạt động luyện tập"}
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.07] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F1C8D2]">Điều chỉnh lộ trình</p>
          <h3 className="mt-2 text-lg font-bold">Bạn đang hướng tới Band nào?</h3>
          <p className="mt-1 text-xs leading-5 text-white/65">
            Có thể thay đổi bất cứ lúc nào. Gợi ý khóa học sẽ được cập nhật theo dữ liệu thật.
          </p>
          <div className="mt-4 rounded-2xl bg-[#FFFCF8] p-3 text-[#292528]">
            <StudentTargetBandControl compact />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
      <span className="text-[#F5C842]">{icon}</span>
      <p className="mt-2 text-[11px] text-white/60">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
