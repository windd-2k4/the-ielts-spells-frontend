"use client";

import { BookOpenText, CalendarBlank, IdentificationCard, User } from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentTargetBandControl } from "@/features/student-hub/StudentTargetBandControl";
import { formatBand } from "@/features/student-hub/studentPortalViewModel";

export default function StudentLearningProfilePage() {
  const { data, loading } = useStudentPortal();

  if (loading || !data) return <div className="h-96 animate-pulse rounded-[22px] border border-[#E8E2D5] bg-white" />;
  const profile = data.profile;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Hồ sơ cá nhân</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Hồ sơ học tập</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Thông tin nhận diện và mục tiêu đang được lưu trong hệ thống quản lý trung tâm.</p>
      </header>

      <section className="rounded-[22px] border border-[#E8E2D5] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 border-b border-[#E8E2D5] pb-6 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-[#894C5B] text-2xl font-bold text-white">
            {profile.avatarPath ? <img src={profile.avatarPath} alt="" className="h-full w-full object-cover" /> : profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#292528]">{profile.fullName}</h3>
            <p className="mt-1 text-sm text-[#6F676C]">{profile.email || "Chưa có email"}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F7E5EA] px-3 py-1 text-xs font-bold text-[#894C5B]">
              <IdentificationCard size={15} /> {profile.studentCode}
            </p>
          </div>
        </div>
        <dl className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileFact icon={<User size={18} />} label="Số điện thoại" value={profile.phone || "Chưa cập nhật"} />
          <ProfileFact icon={<CalendarBlank size={18} />} label="Ngày tham gia" value={new Date(profile.joinedAt).toLocaleDateString("vi-VN")} />
          <ProfileFact icon={<BookOpenText size={18} />} label="Band hiện tại" value={formatBand(profile.currentBand)} />
          <ProfileFact icon={<BookOpenText size={18} />} label="Lượt làm đã nộp" value={String(data.metrics.completedAttempts)} />
        </dl>
      </section>

      <StudentTargetBandControl />
    </div>
  );
}

function ProfileFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F7F5F4] p-4">
      <span className="text-[#894C5B]">{icon}</span>
      <dt className="mt-3 text-[11px] text-[#6F676C]">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-[#292528]">{value}</dd>
    </div>
  );
}
