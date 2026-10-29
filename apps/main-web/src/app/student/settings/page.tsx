"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  Envelope,
  Eye,
  EyeSlash,
  FloppyDisk,
  Gear,
  GraduationCap,
  Headphones,
  IdentificationCard,
  Key,
  Laptop,
  Lock,
  Microphone,
  PencilSimpleLine,
  Phone,
  ShieldCheck,
  SignOut,
  Sliders,
  Sparkle,
  Student,
  Target,
  TextT,
  User,
  WarningCircle,
  ArrowRight,
  BookOpenText,
  CalendarBlank,
  Copy,
  Info,
  ShieldWarning,
  CaretRight,
} from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

type TabId = "profile" | "security" | "notifications" | "preferences";

interface NotificationConfig {
  upcomingClassReminder: boolean;
  assignmentDeadlineReminder: boolean;
  gradingCompletedAlert: boolean;
  weeklyProgressDigest: boolean;
  browserSoundAlert: boolean;
  inAppNotification: boolean;
  emailNotification: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationConfig = {
  upcomingClassReminder: true,
  assignmentDeadlineReminder: true,
  gradingCompletedAlert: true,
  weeklyProgressDigest: true,
  browserSoundAlert: false,
  inAppNotification: true,
  emailNotification: true,
};

export default function StudentSettingsPage() {
  const { data, loading, refresh } = useStudentPortal();
  const { session, signOut } = useStudentSession();

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Forgot password request state
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationConfig>(DEFAULT_NOTIFICATIONS);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  // Exam preference state
  const [defaultPracticeSkill, setDefaultPracticeSkill] = useState<"READING" | "LISTENING" | "WRITING" | "SPEAKING">("READING");
  const [examFontSize, setExamFontSize] = useState<"sm" | "md" | "lg">("md");
  const [autoSaveAnswers, setAutoSaveAnswers] = useState(true);
  const [countdownWarning, setCountdownWarning] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  // Sync initial profile values
  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.fullName || "");
      setPhone(data.profile.phone || "");
    }
  }, [data?.profile]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedSkill = localStorage.getItem("student_default_practice_skill");
      if (storedSkill && ["READING", "LISTENING", "WRITING", "SPEAKING"].includes(storedSkill)) {
        setDefaultPracticeSkill(storedSkill as "READING" | "LISTENING" | "WRITING" | "SPEAKING");
      }

      const storedFontSize = localStorage.getItem("student_exam_font_size");
      if (storedFontSize === "sm" || storedFontSize === "md" || storedFontSize === "lg") {
        setExamFontSize(storedFontSize);
      }

      const storedAutoSave = localStorage.getItem("student_exam_auto_save");
      if (storedAutoSave !== null) {
        setAutoSaveAnswers(storedAutoSave === "true");
      }

      const storedCountdown = localStorage.getItem("student_exam_countdown_warn");
      if (storedCountdown !== null) {
        setCountdownWarning(storedCountdown === "true");
      }

      const storedFocusMode = localStorage.getItem("student_exam_focus_mode");
      if (storedFocusMode !== null) {
        setFocusMode(storedFocusMode === "true");
      }
    } catch {
      // Ignore local storage parse errors
    }
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab") as TabId | null;
    if (requestedTab && ["profile", "security", "notifications", "preferences"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void apiFetch<NotificationConfig>("/student/notifications/preferences")
      .then((value) => {
        if (active) {
          setNotifications((curr) => ({ ...curr, ...value }));
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem("student_notif_prefs");
          if (active && stored) {
            setNotifications((curr) => ({ ...curr, ...JSON.parse(stored) }));
          }
        } catch {
          /* use defaults */
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const profile = data?.profile;
  const activeCourse = data?.enrollments?.find((e) => e.status === "ACTIVE") ?? data?.enrollments?.[0];

  // Copy student code helper
  const handleCopyCode = () => {
    if (profile?.studentCode) {
      void navigator.clipboard.writeText(profile.studentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileErrorMsg("Họ và tên không được để trống.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiFetch("/auth/student/onboarding", {
        method: "POST",
        body: JSON.stringify({ fullName: trimmedName, phone: phone.trim() }),
      });

      try {
        await supabase.auth.updateUser({
          data: { full_name: trimmedName, phone: phone.trim() },
        });
      } catch {
        // Suppress if supabase client session error
      }

      await refresh();
      setProfileSuccessMsg("Thông tin hồ sơ cá nhân đã được lưu thành công.");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      caseMix: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const passwordStrengthScore = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.caseMix) score++;
    if (passwordCriteria.number) score++;
    if (passwordCriteria.special) score++;
    return score;
  }, [newPassword, passwordCriteria]);

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 8) {
      setPasswordErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordErrorMsg(error.message || "Không thể cập nhật mật khẩu. Vui lòng thử lại.");
      } else {
        setPasswordSuccessMsg("Mật khẩu đã được thay đổi thành công! Vui lòng ghi nhớ mật khẩu mới.");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      }
    } catch {
      setPasswordErrorMsg("Đã xảy ra sự cố khi đổi mật khẩu. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Forgot Password Email Send
  const handleSendForgotPassword = async () => {
    const userEmail = profile?.email || session?.user?.email;
    if (!userEmail) {
      setForgotError("Không tìm thấy địa chỉ email của tài khoản.");
      return;
    }

    setForgotSending(true);
    setForgotSuccess(false);
    setForgotError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined,
      });
      if (error) throw error;
      setForgotSuccess(true);
      setTimeout(() => setForgotSuccess(false), 8000);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Không thể gửi email khôi phục lúc này.");
    } finally {
      setForgotSending(false);
    }
  };

  // Toggle Notification setting
  const handleToggleNotif = async (key: keyof NotificationConfig) => {
    if (notificationSaving) return;
    const previous = notifications;
    const next = { ...previous, [key]: !previous[key] };
    setNotifications(next);
    setNotificationSaving(true);
    setNotificationError("");
    try {
      const saved = await apiFetch<NotificationConfig>("/student/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setNotifications((curr) => ({ ...curr, ...saved }));
      try {
        localStorage.setItem("student_notif_prefs", JSON.stringify(next));
      } catch {}
      setNotificationSaved(true);
      setTimeout(() => setNotificationSaved(false), 2000);
    } catch (reason) {
      try {
        localStorage.setItem("student_notif_prefs", JSON.stringify(next));
        setNotificationSaved(true);
        setTimeout(() => setNotificationSaved(false), 2000);
      } catch {
        setNotifications(previous);
        setNotificationError(reason instanceof Error ? reason.message : "Không thể lưu cài đặt thông báo.");
      }
    } finally {
      setNotificationSaving(false);
    }
  };

  // Change Practice Preference helper
  const savePracticePref = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2000);
    } catch {}
  };

  if (loading || !data) {
    return (
      <div className="w-full space-y-6 animate-pulse" role="status" aria-label="Đang tải cài đặt tài khoản">
        <div className="h-28 w-full rounded-2xl bg-white border border-[#E8E2D5]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <div className="lg:col-span-4 h-96 rounded-2xl bg-white border border-[#E8E2D5]" />
          <div className="lg:col-span-8 h-96 rounded-2xl bg-white border border-[#E8E2D5]" />
        </div>
      </div>
    );
  }

  const tabList: { id: TabId; label: string; subLabel: string; icon: typeof User }[] = [
    {
      id: "profile",
      label: "Hồ sơ cá nhân",
      subLabel: "Định danh & thông tin liên hệ",
      icon: User,
    },
    {
      id: "security",
      label: "Mật khẩu & Bảo mật",
      subLabel: "Mật khẩu, phiên & xác thực",
      icon: ShieldCheck,
    },
    {
      id: "notifications",
      label: "Thông báo & Nhắc nhở",
      subLabel: "Bài tập, kết quả & ca học",
      icon: Bell,
    },
    {
      id: "preferences",
      label: "Tùy chọn luyện thi",
      subLabel: "Phòng luyện đề & mục tiêu IELTS",
      icon: Sliders,
    },
  ];

  return (
    <div className="w-full space-y-7 pb-16">
      {/* =========================================================================
          1. TOP PAGE HEADER & HERO BANNER (Đồng bộ toàn chiều rộng 1280px)
      ========================================================================= */}
      <header className="relative overflow-hidden rounded-2xl border border-[#EADBDE] bg-gradient-to-r from-white via-[#FCF8F9] to-[#F9EFF2] p-6 sm:p-7 shadow-xs">
        <div className="absolute -right-8 -top-8 size-48 rounded-full bg-[#894C5B]/5 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-10 size-40 rounded-full bg-[#BA4B69]/5 blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F7E5EA] px-3 py-1 text-xs font-black text-[#894C5B] uppercase tracking-[0.1em]">
              <Gear size={14} weight="bold" />
              <span>Cài đặt hệ thống học vụ</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#292528] sm:text-3xl">
              Cài đặt tài khoản
            </h1>
            <p className="text-xs sm:text-sm text-[#6F676C] max-w-2xl leading-relaxed">
              Quản lý hồ sơ định danh học tập, cấu hình bảo mật đăng nhập, kiểm soát kênh nhận thông báo và cá nhân hóa trải nghiệm phòng thi IELTS.
            </p>
          </div>

          {/* Quick Academic Status Widget */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Học viên chính thức</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-[#EADBDE] bg-white px-3 py-1.5 text-xs text-[#292528] shadow-2xs">
              <span className="font-bold text-[#6F676C]">Mục tiêu:</span>
              <span className="font-black text-[#894C5B] bg-[#F7E5EA] px-1.5 py-0.5 rounded text-[11px]">
                Band {profile?.targetBand ? profile.targetBand.toFixed(1) : "—"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. TWO-COLUMN WORKSPACE: LEFT SIDEBAR + RIGHT CONTENT AREA
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* ---------------------------------------------------------------------
            LEFT COLUMN: IDENTITY SUMMARY & VERTICAL NAVIGATION
        --------------------------------------------------------------------- */}
        <aside className="lg:col-span-4 xl:col-span-3.5 space-y-5 lg:sticky lg:top-5">
          {/* Identity Mini Card */}
          <div className="rounded-2xl border border-[#EADBDE] bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative grid h-15 w-15 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#894C5B] to-[#5A2C37] text-2xl font-black text-white shadow-sm shrink-0">
                {profile?.avatarPath ? (
                  <img src={profile.avatarPath} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.fullName?.charAt(0).toUpperCase() || "H"
                )}
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-[#292528] truncate leading-tight">
                  {profile?.fullName || "Học viên"}
                </h2>
                <p className="text-xs text-[#6F676C] truncate mt-0.5" title={profile?.email || session?.user?.email || ""}>
                  {profile?.email || session?.user?.email || "—"}
                </p>

                {/* Student Code Pill with Copy */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#894C5B] bg-[#F7E5EA] px-2 py-0.5 rounded-md">
                    <IdentificationCard size={13} weight="bold" />
                    {profile?.studentCode || "Chưa cấp mã"}
                  </span>

                  {profile?.studentCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center text-[10px] text-[#6F676C] hover:text-[#894C5B] p-1 rounded hover:bg-[#F7F5F4] transition-colors"
                      title="Sao chép mã học viên"
                      aria-label="Sao chép mã học viên"
                    >
                      {copiedCode ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check size={11} weight="bold" /> Đã chép
                        </span>
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E8E2D5]/70 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-[#FAF8F8] p-2.5">
                <span className="text-[#8C827A] block font-semibold">Khóa học</span>
                <span className="font-bold text-[#292528] truncate block mt-0.5" title={activeCourse?.courseName || "Chưa ghi danh"}>
                  {activeCourse?.courseCode || "Chưa có"}
                </span>
              </div>
              <div className="rounded-xl bg-[#FAF8F8] p-2.5">
                <span className="text-[#8C827A] block font-semibold">Ngày tham gia</span>
                <span className="font-bold text-[#292528] block mt-0.5">
                  {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>

            <Link
              href="/student/learning-profile"
              className="mt-3.5 w-full inline-flex items-center justify-between rounded-xl border border-[#E8E2D5] bg-[#FAF8F8] px-3.5 py-2 text-xs font-bold text-[#6F676C] hover:text-[#894C5B] hover:border-[#894C5B]/40 hover:bg-[#FDF6F7] transition-all"
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap size={15} weight="bold" className="text-[#894C5B]" />
                <span>Xem hồ sơ học tập chi tiết</span>
              </span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          {/* Navigation Menu (Vertical Tabs) */}
          <nav
            className="rounded-2xl border border-[#EADBDE] bg-white p-2.5 shadow-xs space-y-1"
            aria-label="Danh mục cài đặt tài khoản"
          >
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#8C827A]">
              Tùy chọn thiết lập
            </div>

            {tabList.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-[#894C5B] to-[#713B47] text-white shadow-sm ring-1 ring-[#894C5B]"
                      : "text-[#292528] hover:bg-[#FDF6F7] hover:text-[#894C5B]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl text-base shrink-0 transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#F7E5EA] text-[#894C5B]"
                      }`}
                    >
                      <IconComp size={18} weight={isActive ? "fill" : "bold"} />
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-black truncate ${isActive ? "text-white" : "text-[#292528]"}`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${isActive ? "text-rose-100" : "text-[#8C827A]"}`}>
                        {item.subLabel}
                      </div>
                    </div>
                  </div>

                  <CaretRight
                    size={15}
                    weight="bold"
                    className={`shrink-0 transition-transform ${
                      isActive ? "text-white translate-x-0.5" : "text-[#D5CEC7]"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Quick Help Card */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF8F8] p-4 text-xs text-[#6F676C] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#292528]">
              <Info size={15} weight="bold" className="text-[#894C5B]" />
              <span>Hỗ trợ học vụ The IELTS Spells</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Nếu bạn cần thay đổi email đăng nhập hoặc chuyển đổi khóa học, vui lòng liên hệ phòng giáo vụ để được xác thực an toàn.
            </p>
          </div>
        </aside>

        {/* ---------------------------------------------------------------------
            RIGHT COLUMN: TAB DETAILS & INTERACTIVE PANELS
        --------------------------------------------------------------------- */}
        <main className="lg:col-span-8 xl:col-span-8.5 space-y-6">
          {/* ===================================================================
              TAB 1: HỒ SƠ CÁ NHÂN
          =================================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Form Feedback Messages */}
              {profileSuccessMsg && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-bold text-emerald-800 shadow-2xs">
                  <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-bold text-rose-800 shadow-2xs">
                  <WarningCircle size={18} weight="fill" className="text-rose-600 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {/* NHÓM 1: THÔNG TIN CÁ NHÂN (CHỈNH SỬA ĐƯỢC) */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D5] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F7E5EA] text-[#894C5B] shrink-0">
                      <User size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        1. Thông tin cá nhân
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Tên hiển thị học tập và số điện thoại liên lạc khi cần hỗ trợ khẩn cấp.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#894C5B] bg-[#F7E5EA] px-2.5 py-1 rounded-lg self-start sm:self-center">
                    <PencilSimpleLine size={13} weight="bold" /> Cho phép chỉnh sửa
                  </span>
                </header>

                <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="student-fullname" className="block text-xs font-bold text-[#292528]">
                        Họ và tên học viên <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative mt-2">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]">
                          <User size={16} />
                        </span>
                        <input
                          id="student-fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl border border-[#D5CEC7] bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#292528] placeholder:text-[#A8A29E] transition-all focus:border-[#894C5B] focus:outline-none focus:ring-4 focus:ring-[#894C5B]/10"
                          placeholder="Ví dụ: Nguyễn Hoàng Phong"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#8C827A]">
                        Hiển thị trên bảng điểm, chứng nhận và kết quả chấm bài thi IELTS.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="student-phone" className="block text-xs font-bold text-[#292528]">
                        Số điện thoại liên hệ
                      </label>
                      <div className="relative mt-2">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]">
                          <Phone size={16} />
                        </span>
                        <input
                          id="student-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-[#D5CEC7] bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#292528] placeholder:text-[#A8A29E] transition-all focus:border-[#894C5B] focus:outline-none focus:ring-4 focus:ring-[#894C5B]/10"
                          placeholder="Ví dụ: 0912 345 678"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#8C827A]">
                        Dùng khi giáo viên hoặc tư vấn viên cần liên hệ nhắc lịch học trực tiếp.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-[#E8E2D5]">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#894C5B] to-[#713B47] px-6 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:from-[#7B3F4E] hover:to-[#5E303B] hover:shadow-md active:scale-[0.99] disabled:opacity-50"
                    >
                      <FloppyDisk size={16} weight="bold" />
                      <span>{isSavingProfile ? "Đang lưu thông tin..." : "Lưu thay đổi hồ sơ"}</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* NHÓM 2: THÔNG TIN TÀI KHOẢN (CHỈ ĐỌC - READ ONLY) */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D5] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                      <IdentificationCard size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        2. Thông tin tài khoản hệ thống
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Các thông số định danh học vụ cố định trên nền tảng The IELTS Spells.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-center">
                    <Lock size={12} weight="bold" /> Chỉ đọc (Read-only)
                  </span>
                </header>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Email đăng nhập */}
                  <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                      <Envelope size={12} weight="bold" /> Email đăng nhập
                    </span>
                    <span className="block text-xs font-black text-[#292528] truncate" title={profile?.email || session?.user?.email || ""}>
                      {profile?.email || session?.user?.email || "—"}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      <Check size={11} weight="bold" /> Đã xác thực
                    </span>
                  </div>

                  {/* Mã học viên */}
                  <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-[#894C5B] uppercase tracking-wider flex items-center gap-1">
                      <IdentificationCard size={12} weight="bold" /> Mã học viên
                    </span>
                    <span className="block text-xs font-black font-mono text-[#894C5B]">
                      {profile?.studentCode || "—"}
                    </span>
                    <span className="block text-[10px] text-[#8C827A] mt-2">
                      Định danh duy nhất
                    </span>
                  </div>

                  {/* Ngày kích hoạt */}
                  <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/40 to-white p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
                      <CalendarBlank size={12} weight="bold" /> Ngày kích hoạt
                    </span>
                    <span className="block text-xs font-black text-[#292528]">
                      {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("vi-VN") : "—"}
                    </span>
                    <span className="block text-[10px] text-[#8C827A] mt-2">
                      Kích hoạt học vụ
                    </span>
                  </div>

                  {/* Trạng thái tài khoản */}
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} weight="bold" /> Trạng thái
                    </span>
                    <span className="block text-xs font-black text-emerald-700">
                      Đang hoạt động
                    </span>
                    <span className="block text-[10px] text-[#8C827A] mt-2">
                      Ghi danh chính khóa
                    </span>
                  </div>
                </div>
              </section>

              {/* NHÓM 3: LIÊN KẾT HỒ SƠ HỌC TẬP */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D5] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-800 shrink-0">
                      <GraduationCap size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        3. Liên kết hồ sơ học tập &amp; Khóa học
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Tóm tắt thông tin lớp học và mục tiêu IELTS đang theo đuổi tại trung tâm.
                      </p>
                    </div>
                  </div>
                </header>

                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#EADBDE] bg-gradient-to-r from-[#FAF8F8] to-[#FDF6F7] p-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#6F676C]">Khóa học đang học:</span>
                      <strong className="text-xs font-black text-[#292528]">
                        {activeCourse ? `${activeCourse.courseCode} · ${activeCourse.courseName}` : "Chưa có khóa học đang hoạt động"}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="font-bold text-[#6F676C]">Mục tiêu IELTS:</span>
                      <span className="font-black text-[#894C5B] bg-[#F7E5EA] px-2.5 py-0.5 rounded-md shadow-2xs">
                        Band {profile?.targetBand ? profile.targetBand.toFixed(1) : "Chưa đặt"}
                      </span>
                      <span className="text-[11px] text-[#8C827A]">
                        (R: {profile?.readingTarget || "—"} · L: {profile?.listeningTarget || "—"} · W: {profile?.writingTarget || "—"} · S: {profile?.speakingTarget || "—"})
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/student/learning-profile"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#894C5B] bg-white px-4 py-2.5 text-xs font-bold text-[#894C5B] hover:bg-[#F7E5EA] transition-all shadow-2xs shrink-0 self-start sm:self-center"
                  >
                    <span>Xem hồ sơ học tập chi tiết</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </section>
            </div>
          )}

          {/* ===================================================================
              TAB 2: MẬT KHẨU & BẢO MẬT
          =================================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Nhóm 1: Đổi mật khẩu tài khoản */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F7E5EA] text-[#894C5B] shrink-0">
                    <Key size={18} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                      Đổi mật khẩu tài khoản
                    </h3>
                    <p className="text-xs text-[#6F676C] mt-0.5">
                      Bảo vệ bài làm, kết quả thi và thông tin học tập bằng mật khẩu an toàn.
                    </p>
                  </div>
                </header>

                <form onSubmit={handleChangePassword} className="mt-5 max-w-xl space-y-4">
                  {passwordSuccessMsg && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-bold text-emerald-800">
                      <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                      <span>{passwordSuccessMsg}</span>
                    </div>
                  )}

                  {passwordErrorMsg && (
                    <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-bold text-rose-800">
                      <WarningCircle size={18} weight="fill" className="text-rose-600 shrink-0" />
                      <span>{passwordErrorMsg}</span>
                    </div>
                  )}

                  {/* Mật khẩu mới */}
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-bold text-[#292528]">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]">
                        <Lock size={16} />
                      </span>
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#D5CEC7] bg-white pl-10 pr-10 py-2.5 text-sm font-semibold text-[#292528] placeholder:text-[#A8A29E] transition-all focus:border-[#894C5B] focus:outline-none focus:ring-4 focus:ring-[#894C5B]/10"
                        placeholder="Nhập tối thiểu 8 ký tự an toàn"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#292528]"
                        aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Interactive Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3 space-y-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F8] p-3.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#6F676C]">Độ an toàn mật khẩu:</span>
                          <span
                            className={
                              passwordStrengthScore <= 1
                                ? "text-rose-600"
                                : passwordStrengthScore <= 3
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }
                          >
                            {passwordStrengthScore <= 1 ? "Yếu" : passwordStrengthScore <= 3 ? "Trung bình" : "Rất an toàn"}
                          </span>
                        </div>

                        {/* 4-bar segments */}
                        <div className="grid grid-cols-4 gap-1.5 h-1.5">
                          <div className={`rounded-full transition-all ${passwordStrengthScore >= 1 ? (passwordStrengthScore <= 1 ? "bg-rose-500" : passwordStrengthScore <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-[#E8E2D5]"}`} />
                          <div className={`rounded-full transition-all ${passwordStrengthScore >= 2 ? (passwordStrengthScore <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-[#E8E2D5]"}`} />
                          <div className={`rounded-full transition-all ${passwordStrengthScore >= 3 ? (passwordStrengthScore <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-[#E8E2D5]"}`} />
                          <div className={`rounded-full transition-all ${passwordStrengthScore >= 4 ? "bg-emerald-500" : "bg-[#E8E2D5]"}`} />
                        </div>

                        {/* Criteria Checklist */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                          <span className={`flex items-center gap-1 ${passwordCriteria.length ? "text-emerald-700 font-bold" : "text-[#8C827A]"}`}>
                            <Check size={10} weight="bold" /> Tối thiểu 8 ký tự
                          </span>
                          <span className={`flex items-center gap-1 ${passwordCriteria.caseMix ? "text-emerald-700 font-bold" : "text-[#8C827A]"}`}>
                            <Check size={10} weight="bold" /> Chữ hoa &amp; chữ thường
                          </span>
                          <span className={`flex items-center gap-1 ${passwordCriteria.number ? "text-emerald-700 font-bold" : "text-[#8C827A]"}`}>
                            <Check size={10} weight="bold" /> Có ít nhất 1 chữ số
                          </span>
                          <span className={`flex items-center gap-1 ${passwordCriteria.special ? "text-emerald-700 font-bold" : "text-[#8C827A]"}`}>
                            <Check size={10} weight="bold" /> Ký tự đặc biệt (!@#$)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-bold text-[#292528]">
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]">
                        <Key size={16} />
                      </span>
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#D5CEC7] bg-white pl-10 pr-10 py-2.5 text-sm font-semibold text-[#292528] placeholder:text-[#A8A29E] transition-all focus:border-[#894C5B] focus:outline-none focus:ring-4 focus:ring-[#894C5B]/10"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#292528]"
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#894C5B] to-[#713B47] px-6 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:from-[#7B3F4E] hover:to-[#5E303B] hover:shadow-md active:scale-[0.99] disabled:opacity-50"
                    >
                      <ShieldCheck size={16} weight="bold" />
                      <span>{isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Nhóm 2: Quên mật khẩu & Khôi phục qua email */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700 shrink-0">
                    <Envelope size={18} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                      Khôi phục mật khẩu qua Email
                    </h3>
                    <p className="text-xs text-[#6F676C] mt-0.5">
                      Nhận liên kết bảo mật để thiết lập lại mật khẩu trong trường hợp không nhớ mật khẩu cũ.
                    </p>
                  </div>
                </header>

                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#292528]">
                      Gửi thư xác thực khôi phục đến: <strong className="text-blue-900">{profile?.email || session?.user?.email}</strong>
                    </p>
                    <p className="text-[11px] text-[#6F676C]">
                      Liên kết bảo mật có thời hạn 60 phút. Vui lòng kiểm tra hộp thư đến hoặc thư rác (spam).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendForgotPassword}
                    disabled={forgotSending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-all shrink-0 disabled:opacity-50"
                  >
                    <Envelope size={15} weight="bold" />
                    <span>{forgotSending ? "Đang gửi email..." : "Gửi email khôi phục"}</span>
                  </button>
                </div>

                {forgotSuccess && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>Liên kết đặt lại mật khẩu đã được gửi thành công đến hòm thư của bạn!</span>
                  </div>
                )}

                {forgotError && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
                    <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
              </section>

              {/* Nhóm 3: Phiên đăng nhập hiện tại */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                    <Laptop size={18} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                      Phiên đăng nhập hiện tại
                    </h3>
                    <p className="text-xs text-[#6F676C] mt-0.5">
                      Kiểm soát thiết bị và phiên làm việc đang kết nối tới tài khoản học viên.
                    </p>
                  </div>
                </header>

                <div className="mt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                        <Laptop size={22} weight="bold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-[#292528]">Thiết bị này (Trình duyệt Web)</p>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Đang hoạt động
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Tài khoản: {session?.user?.email || profile?.email} · Phiên mã hóa SSL/JWT
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="inline-flex items-center justify-center gap-2 self-start sm:self-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs"
                    >
                      <SignOut size={14} weight="bold" />
                      <span>Đăng xuất phiên này</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F8] p-4 text-xs text-[#6F676C] space-y-1">
                    <p className="font-bold text-[#292528] flex items-center gap-1.5">
                      <ShieldCheck size={15} weight="bold" className="text-[#894C5B]" />
                      Chính sách an toàn bảo mật tài khoản:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Hệ thống áp dụng chuẩn mã hóa phiên làm việc định danh. Khi bạn đổi mật khẩu thành công, tất cả các phiên đăng nhập khác sẽ tự động bị hủy để bảo đảm quyền riêng tư cho kết quả bài làm và học bạ của bạn.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===================================================================
              TAB 3: THÔNG BÁO & NHẮC NHỞ
          =================================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                      <Bell size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        Sự kiện thông báo học tập
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Tùy chọn nhận lời nhắc cho từng loại sự kiện trong quá trình học tập.
                      </p>
                    </div>
                  </div>

                  {notificationSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      <CheckCircle size={14} weight="fill" /> Đã tự động lưu
                    </span>
                  )}
                  {notificationError && (
                    <span role="alert" className="text-xs font-bold text-rose-700">
                      {notificationError}
                    </span>
                  )}
                </header>

                <div className="mt-5 divide-y divide-[#E8E2D5]/70">
                  {/* Nhóm 1: Bài tập và hạn nộp */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3.5 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-700 shrink-0 mt-0.5">
                        <PencilSimpleLine size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">
                          Bài tập và hạn nộp bài
                        </p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Nhắc bài tập mới được giao, cảnh báo bài tập sắp đến hạn chót (trước 24 giờ) hoặc bài nộp trễ.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.assignmentDeadlineReminder}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("assignmentDeadlineReminder")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.assignmentDeadlineReminder ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.assignmentDeadlineReminder ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Nhóm 2: Kết quả và nhận xét */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3.5 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                        <CheckCircle size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">
                          Kết quả và nhận xét chấm bài
                        </p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Thông báo ngay khi bài Writing/Speaking có điểm số chính thức, kèm nhận xét chi tiết của giáo viên và AI.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.gradingCompletedAlert}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("gradingCompletedAlert")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.gradingCompletedAlert ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.gradingCompletedAlert ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Nhóm 3: Lịch học và điểm danh */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3.5 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                        <Clock size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">
                          Lịch học và nhắc ca học trực tuyến
                        </p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Nhắc buổi học trực tiếp hoặc ca học Zoom trước 30 phút, cập nhật thay đổi thời khóa biểu.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.upcomingClassReminder}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("upcomingClassReminder")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.upcomingClassReminder ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.upcomingClassReminder ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Nhóm 4: Tiến độ học tập */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3.5 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-700 shrink-0 mt-0.5">
                        <Sparkle size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">
                          Tiến độ học tập và tự học định kỳ
                        </p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Nhắc nhở hoàn thành checklist tự học trong tuần và gửi báo cáo phân tích tiến độ vào sáng thứ Hai.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.weeklyProgressDigest}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("weeklyProgressDigest")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.weeklyProgressDigest ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.weeklyProgressDigest ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Kênh nhận thông báo */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4">
                  <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                    Kênh nhận thông báo
                  </h3>
                  <p className="text-xs text-[#6F676C] mt-0.5">
                    Lựa chọn phương tiện bạn muốn nhận tin tức và thông báo từ hệ thống.
                  </p>
                </header>

                <div className="mt-5 divide-y divide-[#E8E2D5]/70">
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF8F8] text-[#894C5B] shrink-0">
                        <Bell size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">Thông báo trong hệ thống (In-app)</p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Hiển thị chấm đỏ và danh sách tại biểu tượng quả chuông trên thanh điều hướng.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.inAppNotification}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("inAppNotification")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.inAppNotification ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.inAppNotification ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF8F8] text-[#894C5B] shrink-0">
                        <Envelope size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">Email thông báo học tập</p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Gửi thư thông báo về địa chỉ {profile?.email || session?.user?.email} cho bài thi và ca học quan trọng.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.emailNotification}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("emailNotification")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.emailNotification ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.emailNotification ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3 pr-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF8F8] text-[#894C5B] shrink-0">
                        <Headphones size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#292528]">Âm thanh thông báo trên trình duyệt</p>
                        <p className="text-[11px] text-[#6F676C] mt-0.5">
                          Phát chuông âm thanh nhẹ khi có tin nhắn hoặc thông báo mới trong lúc đang mở cổng học tập.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.browserSoundAlert}
                      disabled={notificationSaving}
                      onClick={() => handleToggleNotif("browserSoundAlert")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifications.browserSoundAlert ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications.browserSoundAlert ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===================================================================
              TAB 4: TÙY CHỌN LUYỆN THI
          =================================================================== */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* NHÓM 1: MỤC TIÊU IELTS (ĐỒNG BỘ DUY NHẤT) */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F7E5EA] text-[#894C5B] shrink-0">
                      <Target size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        Mục tiêu IELTS chuẩn hóa
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Dữ liệu mục tiêu band điểm đồng bộ duy nhất với Hồ sơ học tập và hệ thống phân tích AI.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/student/learning-profile"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#894C5B] bg-white px-3.5 py-2 text-xs font-bold text-[#894C5B] hover:bg-[#F7E5EA] transition-all shadow-2xs shrink-0 self-start sm:self-center"
                  >
                    <span>Chỉnh sửa mục tiêu</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </header>

                <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Overall */}
                  <div className="rounded-xl border border-[#894C5B]/40 bg-gradient-to-br from-[#F7E5EA] to-[#FDF2F4] p-4 text-center shadow-2xs">
                    <span className="text-[10px] font-black text-[#894C5B] uppercase tracking-wider block">
                      Overall Target
                    </span>
                    <span className="mt-1 block text-2xl font-black text-[#894C5B]">
                      {profile?.targetBand ? profile.targetBand.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] text-[#6F676C] mt-1 block font-semibold">
                      Band mục tiêu tổng
                    </span>
                  </div>

                  {/* Reading */}
                  <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 text-center shadow-2xs">
                    <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">
                      Reading
                    </span>
                    <span className="mt-1 block text-xl font-black text-sky-900">
                      {profile?.readingTarget ? profile.readingTarget.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] text-[#6F676C] mt-1 block">Mục tiêu kỹ năng</span>
                  </div>

                  {/* Listening */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 text-center shadow-2xs">
                    <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
                      Listening
                    </span>
                    <span className="mt-1 block text-xl font-black text-indigo-900">
                      {profile?.listeningTarget ? profile.listeningTarget.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] text-[#6F676C] mt-1 block">Mục tiêu kỹ năng</span>
                  </div>

                  {/* Writing */}
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-center shadow-2xs">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                      Writing
                    </span>
                    <span className="mt-1 block text-xl font-black text-amber-900">
                      {profile?.writingTarget ? profile.writingTarget.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] text-[#6F676C] mt-1 block">Mục tiêu kỹ năng</span>
                  </div>

                  {/* Speaking */}
                  <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 text-center shadow-2xs">
                    <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                      Speaking
                    </span>
                    <span className="mt-1 block text-xl font-black text-rose-900">
                      {profile?.speakingTarget ? profile.speakingTarget.toFixed(1) : "—"}
                    </span>
                    <span className="text-[10px] text-[#6F676C] mt-1 block">Mục tiêu kỹ năng</span>
                  </div>
                </div>

                {/* Ngày thi dự kiến */}
                <div className="mt-4 p-3.5 rounded-xl border border-[#E8E2D5] bg-[#FAF8F8] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#6F676C] flex items-center gap-1.5">
                    <CalendarBlank size={15} weight="bold" className="text-[#894C5B]" />
                    <span>Ngày dự kiến thi IELTS thực tế:</span>
                  </span>
                  <strong className="font-black text-[#292528]">
                    {profile?.plannedExamDate
                      ? new Date(profile.plannedExamDate).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "Chưa lên lịch ngày thi"}
                  </strong>
                </div>
              </section>

              {/* NHÓM 2: TRẢI NGHIỆM PHÒNG LUYỆN TẬP */}
              <section className="rounded-2xl border border-[#EADBDE] bg-white p-6 sm:p-7 shadow-xs">
                <header className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                      <Sliders size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-[#292528] uppercase tracking-wider">
                        Trải nghiệm phòng luyện thi
                      </h3>
                      <p className="text-xs text-[#6F676C] mt-0.5">
                        Tùy chỉnh thị giác, cỡ chữ và các tính năng hỗ trợ khi bước vào làm bài thi.
                      </p>
                    </div>
                  </div>

                  {prefSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      <CheckCircle size={14} weight="fill" /> Đã cập nhật
                    </span>
                  )}
                </header>

                <div className="mt-5 space-y-6">
                  {/* 1. Kỹ năng mở mặc định khi vào khu vực Luyện đề */}
                  <div>
                    <label className="block text-xs font-bold text-[#292528]">
                      Kỹ năng mở mặc định khi vào Luyện đề
                    </label>
                    <p className="text-[11px] text-[#8C827A] mt-0.5">
                      Tự động chuyển đến tab kỹ năng này khi bạn truy cập trang Cổng luyện đề IELTS.
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "READING", label: "Reading", icon: BookOpenText, color: "sky" },
                        { id: "LISTENING", label: "Listening", icon: Headphones, color: "indigo" },
                        { id: "WRITING", label: "Writing", icon: PencilSimpleLine, color: "amber" },
                        { id: "SPEAKING", label: "Speaking", icon: Microphone, color: "rose" },
                      ].map((skillItem) => {
                        const IconComp = skillItem.icon;
                        const isSelected = defaultPracticeSkill === skillItem.id;
                        return (
                          <button
                            key={skillItem.id}
                            type="button"
                            onClick={() => {
                              setDefaultPracticeSkill(skillItem.id as "READING" | "LISTENING" | "WRITING" | "SPEAKING");
                              savePracticePref("student_default_practice_skill", skillItem.id);
                            }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "border-[#894C5B] bg-[#F7E5EA] text-[#894C5B] shadow-2xs ring-1 ring-[#894C5B]"
                                : "border-[#E8E2D5] bg-white text-[#6F676C] hover:bg-[#FAF8F8] hover:text-[#292528]"
                            }`}
                          >
                            <IconComp size={16} weight={isSelected ? "bold" : "regular"} />
                            <span>{skillItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Cỡ chữ bài đọc */}
                  <div className="border-t border-[#E8E2D5]/70 pt-5">
                    <label className="block text-xs font-bold text-[#292528]">
                      Cỡ chữ hiển thị bài đọc (Reading) &amp; đề thi
                    </label>
                    <p className="text-[11px] text-[#8C827A] mt-0.5">
                      Chọn kích thước chữ văn bản phù hợp với thị lực khi đọc các bài Passage dài 800 - 1000 từ.
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
                      {[
                        { size: "sm" as const, label: "Nhỏ (14px)", iconSize: 16 },
                        { size: "md" as const, label: "Chuẩn (16px)", iconSize: 20 },
                        { size: "lg" as const, label: "Lớn (18px)", iconSize: 24 },
                      ].map((item) => (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => {
                            setExamFontSize(item.size);
                            savePracticePref("student_exam_font_size", item.size);
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                            examFontSize === item.size
                              ? "border-[#894C5B] bg-[#F7E5EA] text-[#894C5B] font-black shadow-2xs ring-1 ring-[#894C5B]"
                              : "border-[#E8E2D5] bg-white text-[#6F676C] hover:bg-[#FAF8F8]"
                          }`}
                        >
                          <TextT size={item.iconSize} />
                          <span className="mt-1 text-[11px]">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Preview Box */}
                    <div className="mt-3.5 rounded-xl border border-[#EADBDE] bg-[#FAF8F8] p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">
                        Xem trước hiển thị văn bản thực tế:
                      </span>
                      <p
                        className={`mt-2 text-[#292528] leading-relaxed transition-all font-serif ${
                          examFontSize === "sm"
                            ? "text-[14px]"
                            : examFontSize === "lg"
                            ? "text-[18px]"
                            : "text-[16px]"
                        }`}
                      >
                        “The IELTS Academic Reading test assesses a wide variety of reading skills, including reading for gist, reading for main ideas, reading for detail, skimming, and understanding logical argument.”
                      </p>
                    </div>
                  </div>

                  {/* 3. Tự động lưu đáp án */}
                  <div className="flex items-center justify-between border-t border-[#E8E2D5]/70 pt-5">
                    <div className="pr-4">
                      <p className="text-xs font-bold text-[#292528]">Tự động lưu câu trả lời khi làm bài</p>
                      <p className="text-[11px] text-[#6F676C] mt-0.5">
                        Tự động đồng bộ đáp án sau mỗi lần chọn câu để tránh mất dữ liệu khi đường truyền gián đoạn.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoSaveAnswers}
                      onClick={() => {
                        const next = !autoSaveAnswers;
                        setAutoSaveAnswers(next);
                        savePracticePref("student_exam_auto_save", String(next));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoSaveAnswers ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoSaveAnswers ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 4. Cảnh báo đếm ngược 5 phút cuối */}
                  <div className="flex items-center justify-between border-t border-[#E8E2D5]/70 pt-5">
                    <div className="pr-4">
                      <p className="text-xs font-bold text-[#292528]">Cảnh báo đếm ngược khi còn 5 phút cuối giờ</p>
                      <p className="text-[11px] text-[#6F676C] mt-0.5">
                        Đồng hồ phòng thi đổi màu cảnh báo và rung nhẹ nhắc nhở bạn kiểm tra lại phiếu trả lời.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={countdownWarning}
                      onClick={() => {
                        const next = !countdownWarning;
                        setCountdownWarning(next);
                        savePracticePref("student_exam_countdown_warn", String(next));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        countdownWarning ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          countdownWarning ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 5. Chế độ tập trung (Focus Mode) */}
                  <div className="flex items-center justify-between border-t border-[#E8E2D5]/70 pt-5">
                    <div className="pr-4">
                      <p className="text-xs font-bold text-[#292528]">Chế độ làm bài tập trung (Focus Mode)</p>
                      <p className="text-[11px] text-[#6F676C] mt-0.5">
                        Ẩn thanh điều hướng phụ và thông báo bên ngoài trong suốt thời gian bấm giờ làm bài.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={focusMode}
                      onClick={() => {
                        const next = !focusMode;
                        setFocusMode(next);
                        savePracticePref("student_exam_focus_mode", String(next));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        focusMode ? "bg-[#894C5B]" : "bg-[#D5CEC7]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          focusMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Lưu ý nguyên tắc quan trọng */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <WarningCircle size={16} weight="fill" className="text-amber-600" />
                      Quy tắc phòng thi The IELTS Spells:
                    </p>
                    <p className="mt-1 leading-relaxed text-[11px]">
                      Các tùy chọn cá nhân này áp dụng cho phòng luyện tập tự do. Đối với các bài kiểm tra do giáo viên giao, các quy định bắt buộc về thời lượng, số lượt làm hoặc thời điểm xem đáp án sẽ áp dụng theo đúng cấu hình của bài thi đó.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
