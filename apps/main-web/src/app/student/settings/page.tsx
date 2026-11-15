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
  Headphones,
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
  Camera,
  Pencil,
  Copy,
  Info,
} from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { updateStudentProfile, uploadStudentAvatar } from "@/features/student-hub/studentPortalApi";

type TabId =
  | "profile"
  | "photo"
  | "security"
  | "subscriptions"
  | "privacy"
  | "notifications"
  | "preferences"
  | "close";

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

  // Profile form state (Udemy style: First Name, Last Name, Headline, Biography, Language)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [biography, setBiography] = useState("");
  const [language, setLanguage] = useState("vi");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Photo state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null);

  // Password state
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

  // Email edit info modal state
  const [showEmailEditNotice, setShowEmailEditNotice] = useState(false);

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

  // Privacy toggles
  const [showProfileToClass, setShowProfileToClass] = useState(true);
  const [showLeaderboardScore, setShowLeaderboardScore] = useState(true);
  const [allowTeacherFeedbackShare, setAllowTeacherFeedbackShare] = useState(true);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Sync initial profile values
  useEffect(() => {
    if (data?.profile) {
      const full = (data.profile.fullName || "").trim();
      const parts = full.split(" ");
      if (parts.length > 1) {
        setFirstName(parts[parts.length - 1]);
        setLastName(parts.slice(0, -1).join(" "));
      } else {
        setFirstName(full);
        setLastName("");
      }
      setPhone(data.profile.phone || "");
    }
  }, [data?.profile]);

  // Load custom headline, bio & language
  useEffect(() => {
    try {
      const storedHeadline = localStorage.getItem("student_headline") || (session?.user?.user_metadata?.headline as string) || "";
      const storedBio = localStorage.getItem("student_bio") || (session?.user?.user_metadata?.biography as string) || "";
      const storedLang = localStorage.getItem("student_language") || "vi";
      if (storedHeadline) setHeadline(storedHeadline);
      if (storedBio) setBiography(storedBio);
      if (storedLang) setLanguage(storedLang);

      const storedPrivClass = localStorage.getItem("student_priv_class");
      if (storedPrivClass !== null) setShowProfileToClass(storedPrivClass === "true");

      const storedPrivLead = localStorage.getItem("student_priv_lead");
      if (storedPrivLead !== null) setShowLeaderboardScore(storedPrivLead === "true");

      const storedPrivFeedback = localStorage.getItem("student_priv_feedback");
      if (storedPrivFeedback !== null) setAllowTeacherFeedbackShare(storedPrivFeedback === "true");
    } catch {
      // Ignore
    }
  }, [session?.user]);

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
    if (
      requestedTab &&
      [
        "profile",
        "photo",
        "security",
        "subscriptions",
        "privacy",
        "notifications",
        "preferences",
        "close",
      ].includes(requestedTab)
    ) {
      setActiveTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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

  function switchTab(id: TabId) {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  }

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const combinedName = `${lastName} ${firstName}`.trim();
    if (!combinedName) {
      setProfileErrorMsg("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateStudentProfile(combinedName, phone.trim());

      try {
        await supabase.auth.updateUser({
          data: {
            full_name: combinedName,
            phone: phone.trim(),
            headline: headline.trim(),
            biography: biography.trim(),
            language,
          },
        });
      } catch {
        // Suppress session error
      }

      try {
        localStorage.setItem("student_headline", headline.trim());
        localStorage.setItem("student_bio", biography.trim());
        localStorage.setItem("student_language", language);
      } catch {}

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

  const handleAvatarSelection = (file: File | null) => {
    setAvatarSuccessMsg(null);
    setAvatarErrorMsg(null);
    if (!file) return;
    setAvatarFile(null);
    setAvatarPreview(null);

    const supportedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!supportedTypes.includes(file.type)) {
      setAvatarErrorMsg("Vui lòng chọn ảnh PNG, JPG, WebP hoặc GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErrorMsg("Ảnh đại diện không được vượt quá 5 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setIsSavingAvatar(true);
    setAvatarSuccessMsg(null);
    setAvatarErrorMsg(null);
    try {
      const updated = await uploadStudentAvatar(avatarFile);
      try {
        await supabase.auth.updateUser({ data: { avatar_url: updated.avatarPath } });
      } catch {
        // Suppress
      }
      await refresh();
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarSuccessMsg("Ảnh đại diện đã được cập nhật thành công.");
      setTimeout(() => setAvatarSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setAvatarErrorMsg(err instanceof Error ? err.message : "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setIsSavingAvatar(false);
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

  // Privacy preference helper
  const savePrivacyPref = (key: string, value: boolean) => {
    try {
      localStorage.setItem(key, String(value));
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2000);
    } catch {}
  };

  if (loading || !data) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-1 pb-8 sm:px-6 sm:pt-2 sm:pb-10 animate-pulse" role="status" aria-label="Đang tải cài đặt tài khoản">
        <div className="h-10 w-64 bg-gray-200 rounded-2xl mb-6" />
        <div className="border border-[#F0E6E8] dark:border-[#403640] bg-white dark:bg-[#221E24] rounded-3xl shadow-[0_12px_40px_rgba(190,79,116,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[580px] overflow-hidden">
          <div className="w-full md:w-[260px] border-r border-[#D1D7DC] dark:border-[#403640] p-6 space-y-4">
            <div className="w-28 h-28 rounded-full bg-gray-200 mx-auto" />
            <div className="h-4 bg-gray-200 rounded-xl w-3/4 mx-auto" />
            <div className="space-y-2 pt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-8 space-y-4">
            <div className="h-6 bg-gray-200 rounded-xl w-1/3" />
            <div className="h-4 bg-gray-100 rounded-xl w-1/2" />
            <div className="h-12 bg-gray-100 rounded-xl mt-6" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Sidebar navigation menu items matching Udemy
  const SIDEBAR_TABS = [
    { id: "profile" as const, label: "Hồ sơ cá nhân", en: "Profile", icon: User },
    { id: "photo" as const, label: "Ảnh đại diện", en: "Photo", icon: Camera },
    { id: "security" as const, label: "Bảo mật tài khoản", en: "Account Security", icon: Lock },
    { id: "subscriptions" as const, label: "Khóa học & Gói học", en: "Subscriptions", icon: BookOpenText },
    { id: "privacy" as const, label: "Quyền riêng tư", en: "Privacy", icon: ShieldCheck },
    { id: "notifications" as const, label: "Tùy chọn thông báo", en: "Notification Preferences", icon: Bell },
    { id: "preferences" as const, label: "Tùy chọn luyện thi", en: "Practice Settings", icon: Sliders },
    { id: "close" as const, label: "Đăng xuất tài khoản", en: "Sign out", icon: SignOut },
  ];

  return (
    <div className="w-full font-sans text-[#2D222A] dark:text-[#F5F0F3] pt-0.5 pb-10 sm:pt-1 sm:pb-12">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6">
        {/* Main Clean 2-Column Settings Shell */}
        <div className="border border-[#F0E6E8] dark:border-[#403640] bg-white dark:bg-[#221E24] rounded-3xl shadow-[0_10px_35px_rgba(190,79,116,0.05)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden min-h-[640px]">
          
          {/* ===================================================================
              LEFT SIDEBAR: COMPACT & ELEGANT
          =================================================================== */}
          <aside className="w-full md:w-[250px] shrink-0 border-b md:border-b-0 md:border-r border-[#F0E6E8] dark:border-[#403640] bg-[#FDFBFB] dark:bg-[#1E1921] flex flex-col justify-between">
            <div>
              {/* User Avatar & Info */}
              <div className="pt-6 pb-4 px-5 text-center border-b border-[#F0E6E8] dark:border-[#403640]">
                <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-[#BE4F74] to-[#E17A9B] text-white flex items-center justify-center ring-4 ring-rose-100/80 dark:ring-[#392630] shadow-sm">
                  {profile?.avatarPath ? (
                    <img
                      src={profile.avatarPath}
                      alt={profile?.fullName || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight">
                      {profile?.fullName
                        ? profile.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(-2)
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3] truncate">
                  {profile?.fullName || "Học viên The IELTS Spells"}
                </h2>

                <Link
                  href="/student/learning-profile"
                  className="mt-0.5 inline-block text-xs font-semibold text-[#BE4F74] hover:text-[#933652] dark:text-[#E17A9B] dark:hover:text-[#F492B1] hover:underline transition-colors"
                >
                  Xem hồ sơ công khai
                </Link>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-2.5" aria-label="Danh mục cài đặt">
                <ul className="space-y-1">
                  {SIDEBAR_TABS.map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComp = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => switchTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl transition-all text-left ${
                            isActive
                              ? "bg-gradient-to-r from-[#BE4F74] to-[#C95B80] text-white font-bold shadow-[0_3px_12px_rgba(190,79,116,0.25)]"
                              : "text-[#695B65] dark:text-[#BEB2BC] hover:bg-[#F9EFF2] dark:hover:bg-[#2C2630] hover:text-[#BE4F74] dark:hover:text-[#F5F0F3] font-medium"
                          }`}
                        >
                          <IconComp size={17} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Quick Support */}
            <div className="p-4 border-t border-[#F0E6E8] dark:border-[#403640] text-center text-xs text-[#8A7B84] dark:text-[#91858F]">
              <span>Cần trợ giúp? </span>
              <a href="mailto:support@theieltsspells.vn" className="font-bold text-[#BE4F74] dark:text-[#E17A9B] hover:underline">
                Liên hệ hỗ trợ
              </a>
            </div>
          </aside>

          {/* ===================================================================
              RIGHT CONTENT AREA
          =================================================================== */}
          <section className="flex-1 p-6 sm:p-9 bg-white dark:bg-[#221E24] overflow-y-auto">
            
            {/* ===================================================================
                TAB 1: HỒ SƠ CÁ NHÂN
            =================================================================== */}
            {activeTab === "profile" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Hồ sơ cá nhân
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Quản lý thông tin hiển thị và hồ sơ học tập của bạn.
                  </p>
                </header>

                {profileSuccessMsg && (
                  <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 shadow-sm">
                    <CheckCircle size={17} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-800 px-4 py-2.5 text-xs font-semibold text-rose-900 dark:text-rose-300 shadow-sm">
                    <WarningCircle size={17} weight="fill" className="text-rose-600 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="student-last-name" className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                        Họ và tên đệm
                      </label>
                      <input
                        id="student-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nguyễn Văn"
                        className="w-full h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] text-[#2D222A] dark:text-[#F5F0F3] px-3.5 text-sm rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950/40 focus:bg-white dark:focus:bg-[#221E24] transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="student-first-name" className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                        Tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="student-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Phong"
                        className="w-full h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] text-[#2D222A] dark:text-[#F5F0F3] px-3.5 text-sm rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950/40 focus:bg-white dark:focus:bg-[#221E24] transition-all"
                      />
                    </div>
                  </div>

                  {/* Headline */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="student-headline" className="text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC]">
                        Tiêu đề hồ sơ
                      </label>
                      <span className="text-[11px] text-[#8A7B84] dark:text-[#91858F] font-mono">
                        {headline.length}/60
                      </span>
                    </div>
                    <input
                      id="student-headline"
                      type="text"
                      maxLength={60}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="IELTS Scholar · Target Band 7.5+"
                      className="w-full h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] text-[#2D222A] dark:text-[#F5F0F3] px-3.5 text-sm rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950/40 focus:bg-white dark:focus:bg-[#221E24] transition-all"
                    />
                  </div>

                  {/* Biography */}
                  <div>
                    <label htmlFor="student-biography" className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                      Giới thiệu bản thân
                    </label>

                    <div className="border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1A161C] overflow-hidden focus-within:border-[#BE4F74] focus-within:ring-2 focus-within:ring-rose-100 dark:focus-within:ring-rose-950/40 transition-all">
                      <div className="flex items-center gap-1 border-b border-[#F0E6E8] dark:border-[#403640] bg-[#F7EEF1] dark:bg-[#221E24] px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => setBiography((prev) => prev ? `**${prev}**` : "**Văn bản in đậm**")}
                          title="In đậm (Bold)"
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs text-[#BE4F74] dark:text-[#E17A9B] hover:bg-white dark:hover:bg-[#2C2630] rounded"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => setBiography((prev) => prev ? `*${prev}*` : "*Văn bản in nghiêng*")}
                          title="In nghiêng (Italic)"
                          className="w-6 h-6 flex items-center justify-center italic text-xs text-[#BE4F74] dark:text-[#E17A9B] hover:bg-white dark:hover:bg-[#2C2630] rounded"
                        >
                          I
                        </button>
                      </div>

                      <textarea
                        id="student-biography"
                        rows={3}
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        placeholder="Chia sẻ ngắn gọn về mục tiêu và định hướng học tập của bạn..."
                        className="w-full p-3 text-sm text-[#2D222A] dark:text-[#F5F0F3] bg-transparent outline-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label htmlFor="student-language" className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                      Ngôn ngữ hiển thị
                    </label>
                    <select
                      id="student-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full max-w-xs h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] px-3.5 text-sm text-[#2D222A] dark:text-[#F5F0F3] rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 transition-all"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>

                  {/* Academic Profile Details */}
                  <div className="pt-3 border-t border-[#F0E6E8] dark:border-[#403640]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-3">
                      Thông tin học viên
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF9FA] dark:bg-[#1E1821] p-4 rounded-xl border border-[#F2E5E9] dark:border-[#403640]">
                      <div>
                        <label htmlFor="student-phone" className="block text-[11px] font-bold text-[#8A7B84] dark:text-[#BEB2BC] uppercase tracking-wider mb-1">
                          Số điện thoại
                        </label>
                        <input
                          id="student-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full h-9 border border-[#E8D8DE] dark:border-[#403640] bg-white dark:bg-[#221E24] px-3 text-xs text-[#2D222A] dark:text-[#F5F0F3] rounded-lg outline-none focus:border-[#BE4F74]"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-[#8A7B84] dark:text-[#BEB2BC] uppercase tracking-wider mb-1">
                          Mã định danh
                        </span>
                        <div className="h-9 border border-[#E8D8DE] dark:border-[#403640] bg-[#FAF5F7] dark:bg-[#20181D] px-3 flex items-center justify-between font-mono text-xs font-bold text-[#BE4F74] dark:text-[#E17A9B] rounded-lg">
                          <span>{profile?.studentCode || "Chưa cấp mã"}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">ID</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-[#8A7B84] dark:text-[#BEB2BC] uppercase tracking-wider mb-1">
                          Khóa học hiện tại
                        </span>
                        <div className="h-9 border border-[#E8D8DE] dark:border-[#403640] bg-[#FAF5F7] dark:bg-[#20181D] px-3 flex items-center text-xs font-semibold text-[#2D222A] dark:text-[#F5F0F3] rounded-lg truncate">
                          {activeCourse ? `${activeCourse.courseCode} · ${activeCourse.courseName}` : "Chưa đăng ký khóa"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-[#8A7B84] dark:text-[#BEB2BC] uppercase tracking-wider mb-1">
                          Mục tiêu Band
                        </span>
                        <div className="h-9 border border-[#E8D8DE] dark:border-[#403640] bg-[#FAF5F7] dark:bg-[#20181D] px-3 flex items-center justify-between text-xs font-bold text-[#BE4F74] dark:text-[#E17A9B] rounded-lg">
                          <span>{profile?.targetBand ? `Band ${profile.targetBand.toFixed(1)}` : "Chưa đặt"}</span>
                          <Link href="/student/learning-profile" className="text-[11px] font-bold text-[#BE4F74] hover:underline">
                            Đổi mục tiêu
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="h-10 bg-gradient-to-r from-[#BE4F74] to-[#A83E5E] hover:from-[#A83E5E] hover:to-[#933652] text-white font-bold px-7 text-xs sm:text-sm rounded-xl shadow-[0_3px_12px_rgba(190,79,116,0.25)] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================================================================
                TAB 2: ẢNH ĐẠI DIỆN
            =================================================================== */}
            {activeTab === "photo" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Ảnh đại diện
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Cập nhật hình ảnh hiển thị trên hồ sơ học tập và kết quả thi.
                  </p>
                </header>

                {avatarSuccessMsg && (
                  <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 shadow-sm">
                    <CheckCircle size={17} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>{avatarSuccessMsg}</span>
                  </div>
                )}

                {avatarErrorMsg && (
                  <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-800 px-4 py-2.5 text-xs font-semibold text-rose-900 dark:text-rose-300 shadow-sm">
                    <WarningCircle size={17} weight="fill" className="text-rose-600 shrink-0" />
                    <span>{avatarErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Image Preview Box */}
                  <div className="w-full max-w-md bg-[#FCF8F9] dark:bg-[#1E1821] border border-dashed border-[#E5D7DC] dark:border-[#403640] rounded-2xl p-7 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full overflow-hidden ring-4 ring-white dark:ring-[#2C2630] border-2 border-rose-200 dark:border-[#554050] bg-gradient-to-tr from-[#BE4F74] to-[#E17A9B] flex items-center justify-center text-white text-4xl font-bold shadow-md">
                      {avatarPreview || profile?.avatarPath ? (
                        <img
                          src={avatarPreview || profile?.avatarPath || ""}
                          alt="Ảnh đại diện"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={56} weight="fill" className="text-white/80" />
                      )}
                    </div>
                  </div>

                  {/* File Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                      Chọn tệp ảnh
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center max-w-md gap-2.5">
                      <div className="flex-1 h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] px-3.5 flex items-center text-xs text-[#2D222A] dark:text-[#F5F0F3] rounded-xl truncate">
                        {avatarFile ? avatarFile.name : "Chưa chọn tệp"}
                      </div>

                      <label
                        htmlFor="photo-file-input"
                        className="h-10 px-5 border border-[#BE4F74] text-[#BE4F74] dark:border-[#E17A9B] dark:text-[#E17A9B] font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-[#FFF0F3] dark:hover:bg-[#34242E] rounded-xl transition-all shrink-0"
                      >
                        <span>Tải ảnh lên</span>
                      </label>
                      <input
                        id="photo-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          handleAvatarSelection(e.target.files?.[0] || null);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#8A7B84] dark:text-[#91858F]">
                      Hỗ trợ PNG, JPG, WebP (tối đa 5 MB). Khuyên dùng ảnh vuông 1:1.
                    </p>
                  </div>

                  {/* Save Photo Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={!avatarFile || isSavingAvatar}
                      className="h-10 bg-gradient-to-r from-[#BE4F74] to-[#A83E5E] hover:from-[#A83E5E] hover:to-[#933652] text-white font-bold px-7 text-xs sm:text-sm rounded-xl shadow-[0_3px_12px_rgba(190,79,116,0.25)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingAvatar ? "Đang lưu..." : "Lưu ảnh đại diện"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 3: BẢO MẬT TÀI KHOẢN
            =================================================================== */}
            {activeTab === "security" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Bảo mật tài khoản
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Quản lý email đăng nhập và mật khẩu truy cập.
                  </p>
                </header>

                <div className="space-y-6">
                  {/* Email Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-1.5">
                      Email đăng nhập
                    </label>

                    <div className="flex items-center justify-between border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1E1821] p-3.5 rounded-xl max-w-lg">
                      <span className="text-xs sm:text-sm text-[#2D222A] dark:text-[#F5F0F3]">
                        {profile?.email || session?.user?.email}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowEmailEditNotice(!showEmailEditNotice)}
                        className="p-1.5 border border-[#E5D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] hover:bg-rose-50 text-[#BE4F74] dark:text-[#E17A9B] rounded-lg transition-colors"
                        title="Đổi địa chỉ email"
                      >
                        <Pencil size={15} weight="bold" />
                      </button>
                    </div>

                    {showEmailEditNotice && (
                      <div className="mt-2.5 max-w-lg p-3 border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900 text-xs text-rose-950 dark:text-rose-200 rounded-xl flex items-start gap-2.5 shadow-sm">
                        <Info size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Để bảo vệ học bạ và chứng chỉ, việc đổi email cần xác thực qua trung tâm. Vui lòng liên hệ <a href="mailto:support@theieltsspells.vn" className="underline font-bold">support@theieltsspells.vn</a>.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Password Change Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] -mb-1">
                      Đổi mật khẩu
                    </label>

                    {passwordSuccessMsg && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 shadow-sm">
                        <CheckCircle size={17} weight="fill" className="text-emerald-600 shrink-0" />
                        <span>{passwordSuccessMsg}</span>
                      </div>
                    )}

                    {passwordErrorMsg && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-800 px-4 py-2.5 text-xs font-semibold text-rose-900 dark:text-rose-300 shadow-sm">
                        <WarningCircle size={17} weight="fill" className="text-rose-600 shrink-0" />
                        <span>{passwordErrorMsg}</span>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <div className="relative">
                        <input
                          id="udemy-new-password"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                          className="w-full h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] text-[#2D222A] dark:text-[#F5F0F3] px-3.5 pr-10 text-sm rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          aria-label={showNewPassword ? "Ẩn" : "Hiện"}
                        >
                          {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {newPassword && (
                        <div className="mt-2 p-2.5 bg-[#FCFAFB] dark:bg-[#1E1821] border border-[#E5D7DC] dark:border-[#403640] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="text-[#8A7B84] dark:text-[#91858F]">Độ mạnh:</span>
                            <span className={passwordStrengthScore <= 1 ? "text-rose-600" : passwordStrengthScore <= 3 ? "text-amber-600" : "text-emerald-600"}>
                              {passwordStrengthScore <= 1 ? "Yếu" : passwordStrengthScore <= 3 ? "Trung bình" : "Rất tốt"}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1">
                            <div className={`rounded-full ${passwordStrengthScore >= 1 ? (passwordStrengthScore <= 1 ? "bg-rose-500" : "bg-amber-500") : "bg-gray-200"}`} />
                            <div className={`rounded-full ${passwordStrengthScore >= 2 ? (passwordStrengthScore <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-gray-200"}`} />
                            <div className={`rounded-full ${passwordStrengthScore >= 3 ? "bg-emerald-500" : "bg-gray-200"}`} />
                            <div className={`rounded-full ${passwordStrengthScore >= 4 ? "bg-emerald-500" : "bg-gray-200"}`} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="relative">
                        <input
                          id="udemy-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-10 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] text-[#2D222A] dark:text-[#F5F0F3] px-3.5 pr-10 text-sm rounded-xl outline-none focus:border-[#BE4F74] focus:ring-2 focus:ring-rose-100 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          aria-label={showConfirmPassword ? "Ẩn" : "Hiện"}
                        >
                          {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="h-10 bg-gradient-to-r from-[#BE4F74] to-[#A83E5E] hover:from-[#A83E5E] hover:to-[#933652] text-white font-bold px-7 text-xs sm:text-sm rounded-xl shadow-[0_3px_12px_rgba(190,79,116,0.25)] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isChangingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
                    </button>
                  </form>

                  {/* Multi-factor Authentication (MFA) */}
                  <div className="pt-4 border-t border-[#F0E6E8] dark:border-[#403640] max-w-lg">
                    <div className="border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1E1821] p-4 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#2D222A] dark:text-[#F5F0F3]">
                          Xác thực đa yếu tố (2FA)
                        </h4>
                        <p className="text-[11px] text-[#8A7B84] dark:text-[#91858F] mt-0.5">
                          Bảo vệ tài khoản bằng mã gửi về email khi đăng nhập trên thiết bị lạ.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full shrink-0">
                        <Check size={11} weight="bold" /> Đang bật
                      </span>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="max-w-lg space-y-3">
                    <div className="border border-[#E5D7DC] dark:border-[#403640] p-3.5 rounded-xl bg-white dark:bg-[#221E24] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-rose-50 dark:bg-[#2C2430] rounded-lg flex items-center justify-center text-[#BE4F74] dark:text-[#E17A9B]">
                          <Laptop size={17} weight="bold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D222A] dark:text-[#F5F0F3]">Thiết bị này</p>
                          <p className="text-[10px] text-[#8A7B84] dark:text-[#91858F]">Đang hoạt động · SSL Encrypted</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1A161C] rounded-xl text-xs">
                      <span className="text-[#695B65] dark:text-[#BEB2BC]">Quên mật khẩu?</span>
                      <button
                        type="button"
                        onClick={handleSendForgotPassword}
                        disabled={forgotSending}
                        className="font-bold text-[#BE4F74] dark:text-[#E17A9B] hover:underline disabled:opacity-50"
                      >
                        {forgotSending ? "Đang gửi..." : "Gửi email khôi phục"}
                      </button>
                    </div>

                    {forgotSuccess && (
                      <div className="p-2.5 border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 rounded-xl">
                        Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư đến.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 4: KHÓA HỌC & GÓI HỌC
            =================================================================== */}
            {activeTab === "subscriptions" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Khóa học của bạn
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Danh sách các lớp học IELTS bạn đang theo học.
                  </p>
                </header>

                <div className="space-y-3.5 max-w-lg">
                  {data.enrollments && data.enrollments.length > 0 ? (
                    data.enrollments.map((enr) => (
                      <div key={enr.enrollmentId} className="border border-[#F0E6E8] dark:border-[#403640] p-4 bg-[#FCFAFB] dark:bg-[#1E1821] rounded-2xl space-y-2.5 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-rose-100 text-[#BE4F74] dark:bg-[#34242C] dark:text-[#E17A9B] text-[10px] font-bold uppercase tracking-wider rounded-full mb-1">
                              {enr.status === "ACTIVE" ? "Đang học" : enr.status}
                            </span>
                            <h3 className="text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">
                              {enr.courseCode} · {enr.courseName}
                            </h3>
                          </div>
                          <span className="text-[11px] font-bold text-[#7957A2] dark:text-[#C4B5FD] px-2.5 py-0.5 bg-[#F5EEF9] dark:bg-[#342749] rounded-full">
                            Target {enr.courseTargetBand ? `Band ${enr.courseTargetBand}` : "IELTS"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#8A7B84] dark:text-[#BEB2BC] border-t border-[#F0E6E8] dark:border-[#403640]">
                          <div>
                            <span>Tiến độ: </span>
                            <strong className="text-[#2D222A] dark:text-[#F5F0F3]">{enr.completedSessions} / {enr.totalSessions} buổi</strong>
                          </div>
                          <div className="truncate">
                            <span>Giảng viên: </span>
                            <strong className="text-[#2D222A] dark:text-[#F5F0F3]">{enr.primaryTeacherName || "The IELTS Spells"}</strong>
                          </div>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/student/courses/${enr.courseId}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-[#BE4F74] to-[#A83E5E] text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            <span>Vào lớp học</span>
                            <ArrowRight size={13} weight="bold" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 border border-[#F0E6E8] dark:border-[#403640] rounded-2xl text-center text-xs text-[#8A7B84] dark:text-[#BEB2BC]">
                      Bạn chưa đăng ký khóa học nào.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 5: QUYỀN RIÊNG TƯ
            =================================================================== */}
            {activeTab === "privacy" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Quyền riêng tư
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Kiểm soát thông tin hiển thị với học viên trong lớp.
                  </p>
                </header>

                {privacySaved && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                    <span>Đã lưu cài đặt.</span>
                  </div>
                )}

                <div className="space-y-3.5 max-w-lg">
                  <div className="flex items-center justify-between p-3.5 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                    <div className="pr-3">
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Hiển thị hồ sơ công khai</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC] mt-0.5">
                        Cho phép các bạn học viên trong lớp nhìn thấy mục tiêu Band điểm của bạn.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showProfileToClass}
                      onChange={(e) => {
                        setShowProfileToClass(e.target.checked);
                        savePrivacyPref("student_priv_class", e.target.checked);
                      }}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                    <div className="pr-3">
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Bảng vàng vinh danh (Leaderboard)</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC] mt-0.5">
                        Hiển thị điểm thi thử và chuỗi ngày học trên bảng thành tích chung.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLeaderboardScore}
                      onChange={(e) => {
                        setShowLeaderboardScore(e.target.checked);
                        savePrivacyPref("student_priv_lead", e.target.checked);
                      }}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                    <div className="pr-3">
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Chia sẻ bài viết tham khảo</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC] mt-0.5">
                        Cho phép trích dẫn bài Writing đạt band cao làm tài liệu mẫu (đã ẩn danh).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowTeacherFeedbackShare}
                      onChange={(e) => {
                        setAllowTeacherFeedbackShare(e.target.checked);
                        savePrivacyPref("student_priv_feedback", e.target.checked);
                      }}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 6: TÙY CHỌN THÔNG BÁO
            =================================================================== */}
            {activeTab === "notifications" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Tùy chọn thông báo
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Cài đặt nhắc nhở lịch học và kết quả bài thi.
                  </p>
                </header>

                {notificationSaved && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                    <span>Đã lưu tùy chọn thông báo.</span>
                  </div>
                )}

                <div className="border border-[#F0E6E8] dark:border-[#403640] rounded-2xl overflow-hidden divide-y divide-[#F0E6E8] dark:divide-[#3D3338] max-w-lg">
                  <div className="p-3.5 flex items-center justify-between bg-white dark:bg-[#221E24]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Bài tập và hạn nộp</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Nhắc hạn nộp trước 24 giờ khi bài tập sắp hết hạn.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.assignmentDeadlineReminder}
                      onChange={() => handleToggleNotif("assignmentDeadlineReminder")}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-white dark:bg-[#221E24]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Lớp học sắp bắt đầu</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Thông báo trước giờ học 30 phút.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.upcomingClassReminder}
                      onChange={() => handleToggleNotif("upcomingClassReminder")}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-white dark:bg-[#221E24]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Kết quả chấm bài</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Thông báo khi bài thi của bạn được chấm xong.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.gradingCompletedAlert}
                      onChange={() => handleToggleNotif("gradingCompletedAlert")}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-white dark:bg-[#221E24]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Báo cáo tuần</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Tóm tắt tiến độ học tập gửi vào Chủ Nhật hàng tuần.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyProgressDigest}
                      onChange={() => handleToggleNotif("weeklyProgressDigest")}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-white dark:bg-[#221E24]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Âm thanh thông báo</p>
                      <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Phát âm thanh nhẹ khi có nhắc nhở mới.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.browserSoundAlert}
                      onChange={() => handleToggleNotif("browserSoundAlert")}
                      className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 7: TÙY CHỌN LUYỆN THI
            =================================================================== */}
            {activeTab === "preferences" && (
              <div className="max-w-2xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Tùy chọn luyện thi
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Tùy chỉnh kỹ năng mặc định và chế độ làm bài thi.
                  </p>
                </header>

                {prefSaved && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                    <span>Đã cập nhật tùy chọn.</span>
                  </div>
                )}

                <div className="space-y-5 max-w-lg">
                  {/* Default Skill Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-2">
                      Kỹ năng mở mặc định khi vào Luyện đề
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "READING", label: "Reading", icon: BookOpenText },
                        { id: "LISTENING", label: "Listening", icon: Headphones },
                        { id: "WRITING", label: "Writing", icon: PencilSimpleLine },
                        { id: "SPEAKING", label: "Speaking", icon: Microphone },
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isSel = defaultPracticeSkill === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setDefaultPracticeSkill(item.id as "READING" | "LISTENING" | "WRITING" | "SPEAKING");
                              savePracticePref("student_default_practice_skill", item.id);
                            }}
                            className={`p-2.5 border text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
                              isSel
                                ? "border-[#BE4F74] bg-[#BE4F74] text-white font-bold shadow-sm"
                                : "border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1E1821] text-[#695B65] dark:text-[#BEB2BC] hover:border-[#BE4F74] hover:text-[#BE4F74]"
                            }`}
                          >
                            <IconComp size={15} weight={isSel ? "bold" : "regular"} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reading Font Size */}
                  <div className="pt-3 border-t border-[#F0E6E8] dark:border-[#403640]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#695B65] dark:text-[#BEB2BC] mb-2">
                      Cỡ chữ bài đọc (Reading)
                    </label>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { size: "sm" as const, label: "Nhỏ (14px)" },
                        { size: "md" as const, label: "Chuẩn (16px)" },
                        { size: "lg" as const, label: "Lớn (18px)" },
                      ].map((item) => (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => {
                            setExamFontSize(item.size);
                            savePracticePref("student_exam_font_size", item.size);
                          }}
                          className={`p-2 border text-xs font-bold text-center rounded-xl transition-all ${
                            examFontSize === item.size
                              ? "border-[#BE4F74] bg-[#BE4F74] text-white font-bold shadow-sm"
                              : "border-[#E5D7DC] dark:border-[#403640] bg-[#FCFAFB] dark:bg-[#1E1821] text-[#695B65] dark:text-[#BEB2BC] hover:border-[#BE4F74]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="pt-3 border-t border-[#F0E6E8] dark:border-[#403640] space-y-3">
                    <div className="flex items-center justify-between p-3 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                      <div className="pr-3">
                        <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Tự động lưu câu trả lời</p>
                        <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Đồng bộ đáp án liên tục để không bị gián đoạn.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSaveAnswers}
                        onChange={(e) => {
                          setAutoSaveAnswers(e.target.checked);
                          savePracticePref("student_exam_auto_save", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                      <div className="pr-3">
                        <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Cảnh báo 5 phút cuối</p>
                        <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Đổi màu đồng hồ nhắc rà soát bài trước khi nộp.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={countdownWarning}
                        onChange={(e) => {
                          setCountdownWarning(e.target.checked);
                          savePracticePref("student_exam_countdown_warn", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-[#E5D7DC] dark:border-[#403640] rounded-xl bg-[#FCFAFB] dark:bg-[#1E1821]">
                      <div className="pr-3">
                        <p className="text-xs sm:text-sm font-bold text-[#2D222A] dark:text-[#F5F0F3]">Chế độ tập trung (Focus Mode)</p>
                        <p className="text-[11px] text-[#8A7B84] dark:text-[#BEB2BC]">Tạm ẩn các thông báo ngoài lề khi đang làm bài.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={focusMode}
                        onChange={(e) => {
                          setFocusMode(e.target.checked);
                          savePracticePref("student_exam_focus_mode", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded accent-[#BE4F74] dark:accent-[#E17A9B] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 8: ĐĂNG XUẤT
            =================================================================== */}
            {activeTab === "close" && (
              <div className="max-w-xl animate-in fade-in duration-150">
                <header className="border-b border-[#F0E6E8] dark:border-[#403640] pb-5 mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D222A] dark:text-[#F5F0F3]">
                    Đăng xuất tài khoản
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7D6E77] dark:text-[#BEB2BC] mt-1">
                    Đăng xuất khỏi phiên làm việc hiện tại trên thiết bị này.
                  </p>
                </header>

                <div className="space-y-5">
                  <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-sm">
                    <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                      <WarningCircle size={16} weight="fill" className="text-amber-600 dark:text-amber-400 shrink-0" />
                      Lưu ý trước khi đăng xuất:
                    </p>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                      Mọi tiến độ học tập và bài làm đã nộp đều được tự động lưu an toàn trên hệ thống.
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="h-10 bg-gradient-to-r from-[#BE4F74] to-[#A83E5E] hover:from-[#A83E5E] hover:to-[#933652] text-white font-bold px-7 text-xs sm:text-sm rounded-xl shadow-[0_3px_12px_rgba(190,79,116,0.25)] active:scale-[0.98] transition-all"
                    >
                      Xác nhận đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </div>
  );
}
