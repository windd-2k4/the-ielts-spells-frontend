"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  CalendarBlank,
  Check,
  CheckCircle,
  Copy,
  Gear,
  GraduationCap,
  IdentificationCard,
  Phone,
  Target,
  User,
} from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentTargetBandControl } from "@/features/student-hub/StudentTargetBandControl";
import { formatBand } from "@/features/student-hub/studentPortalViewModel";

function splitFullName(fullName: string) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { lastName: "—", firstName: "—" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: "—", firstName: parts[0] };
  }
  const firstName = parts.pop() || "";
  const lastName = parts.join(" ");
  return { lastName, firstName };
}

export default function StudentLearningProfilePage() {
  const { data, loading } = useStudentPortal();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const profile = data?.profile;
  const activeCourse = data?.enrollments?.find((e) => e.status === "ACTIVE") ?? data?.enrollments?.[0];
  const { lastName, firstName } = useMemo(() => splitFullName(profile?.fullName || ""), [profile?.fullName]);

  const handleCopyCode = () => {
    if (profile?.studentCode) {
      void navigator.clipboard.writeText(profile.studentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyEmail = () => {
    if (profile?.email) {
      void navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  if (loading || !data || !profile) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-pulse py-6">
        <div className="h-16 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-44 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* Page Header */}
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B] dark:text-rose-400">
          Hồ sơ cá nhân
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Hồ sơ học tập
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Thông tin nhận diện và mục tiêu đang được lưu trong hệ thống quản lý trung tâm.
        </p>
      </header>

      {/* Card 1: Identity & Metric Facts (Square & Crisp - Vuông vức, chuyên nghiệp) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#894C5B] to-[#BA4B69] text-2xl font-black text-white shadow-xs shrink-0 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
              {profile.avatarPath ? (
                <img src={profile.avatarPath} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {profile.fullName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profile.email || "Chưa có email"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F7E5EA] dark:bg-rose-950/40 px-2.5 py-1 text-xs font-mono font-bold text-[#894C5B] dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                  <IdentificationCard size={14} weight="bold" />
                  <span>{profile.studentCode}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  title="Sao chép mã học viên"
                >
                  {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedCode ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>
          </div>

          <Link
            href="/student/settings"
            className="inline-flex items-center gap-2 self-start sm:self-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
          >
            <Gear size={16} weight="bold" className="text-[#894C5B] dark:text-rose-400" />
            <span>Cài đặt tài khoản &amp; Bảo mật</span>
          </Link>
        </div>

        {/* 4 Metric Facts (Square & Crisp) */}
        <dl className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileFact
            icon={<User size={18} weight="bold" />}
            label="Số điện thoại"
            value={profile.phone || "Chưa cập nhật"}
          />
          <ProfileFact
            icon={<CalendarBlank size={18} weight="bold" />}
            label="Ngày tham gia"
            value={new Date(profile.joinedAt).toLocaleDateString("vi-VN")}
          />
          <ProfileFact
            icon={<BookOpenText size={18} weight="bold" />}
            label="Band hiện tại"
            value={formatBand(profile.currentBand)}
          />
          <ProfileFact
            icon={<Target size={18} weight="bold" />}
            label="Lượt làm đã nộp"
            value={String(data.metrics.completedAttempts)}
          />
        </dl>
      </section>

      {/* Card 2: Thông tin tài khoản (SePay-Style Key-Value Table - Thẻ vuông vức chuyên nghiệp) */}
      <section className="space-y-2.5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 px-1">
          Thông tin tài khoản
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {/* Họ và đệm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Họ và đệm</span>
              <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {lastName}
              </span>
            </div>

            {/* Tên */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Tên</span>
              <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {firstName}
              </span>
            </div>

            {/* Tên đăng nhập */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Tên đăng nhập (Mã HV)</span>
              <div className="sm:col-span-2 flex items-center gap-2 mt-0.5 sm:mt-0">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {profile.studentCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  title="Sao chép tên đăng nhập"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Email liên hệ</span>
              <div className="sm:col-span-2 flex items-center gap-2 mt-0.5 sm:mt-0">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {profile.email || "—"}
                </span>
                {profile.email && (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="Sao chép email"
                  >
                    {copiedEmail ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                )}
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Mật khẩu</span>
              <div className="sm:col-span-2 flex items-center gap-3 mt-0.5 sm:mt-0">
                <span className="font-mono text-slate-400 tracking-widest">••••••••</span>
                <Link
                  href="/student/settings?tab=security"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Đổi mật khẩu
                </Link>
              </div>
            </div>

            {/* Ngày tạo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Ngày tạo tài khoản</span>
              <span className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {new Date(profile.joinedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>

            {/* Trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Trạng thái</span>
              <span className="sm:col-span-2 inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-0">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Kích hoạt</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Card 3: Thông tin học vụ & Khóa học (SePay Key-Value Table - Thẻ vuông vức) */}
      <section className="space-y-2.5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 px-1">
          Thông tin học vụ &amp; Khóa học
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Khóa học ghi danh</span>
              <div className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {activeCourse ? (
                  <Link
                    href={`/student/courses/${activeCourse.courseId}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1.5"
                  >
                    <span>{activeCourse.courseName || activeCourse.courseCode}</span>
                    <span className="text-[11px] font-normal text-slate-400">({activeCourse.courseCode})</span>
                  </Link>
                ) : (
                  <span className="text-slate-400 font-normal">Chưa ghi danh khóa học</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Band hiện tại</span>
              <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {formatBand(profile.currentBand)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 items-center">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Lượt làm bài đã nộp</span>
              <span className="sm:col-span-2 font-bold text-slate-800 dark:text-slate-200 mt-0.5 sm:mt-0">
                {data.metrics.completedAttempts} lượt
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Card 4: Band mục tiêu mong muốn */}
      <section className="space-y-2.5">
        <StudentTargetBandControl />
      </section>
    </div>
  );
}

function ProfileFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition shadow-2xs">
      <span className="text-[#894C5B] dark:text-rose-400">{icon}</span>
      <dt className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
