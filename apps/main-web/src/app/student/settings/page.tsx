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
        <div className="h-10 w-64 bg-gray-200 rounded-none mb-6" />
        <div className="border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#221E24] rounded-none flex flex-col md:flex-row min-h-[580px]">
          <div className="w-full md:w-[260px] border-r border-[#D1D7DC] dark:border-[#403640] p-6 space-y-4">
            <div className="w-28 h-28 rounded-full bg-gray-200 mx-auto" />
            <div className="h-4 bg-gray-200 rounded-none w-3/4 mx-auto" />
            <div className="space-y-2 pt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-none" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-8 space-y-4">
            <div className="h-6 bg-gray-200 rounded-none w-1/3" />
            <div className="h-4 bg-gray-100 rounded-none w-1/2" />
            <div className="h-12 bg-gray-100 rounded-none mt-6" />
            <div className="h-12 bg-gray-100 rounded-none" />
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
    <div className="w-full font-sans text-[#1C1D1F] dark:text-[#F5F0F3] pt-0.5 pb-10 sm:pt-1 sm:pb-12">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        {/* Main Udemy-style 2-Column Settings Box */}
        <div className="border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#221E24] rounded-none shadow-none flex flex-col md:flex-row overflow-hidden min-h-[640px]">
          
          {/* ===================================================================
              LEFT SIDEBAR COLUMN (UDEMY STYLE)
          =================================================================== */}
          <aside className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#221E24] flex flex-col justify-between">
            <div>
              {/* User Avatar & Name Section */}
              <div className="pt-8 pb-5 px-6 text-center border-b border-[#D1D7DC] dark:border-[#403640]">
                <div className="relative mx-auto w-28 h-28 rounded-full overflow-hidden bg-[#1C1D1F] dark:bg-[#2C2630] text-white flex items-center justify-center shadow-none">
                  {profile?.avatarPath ? (
                    <img
                      src={profile.avatarPath}
                      alt={profile?.fullName || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold tracking-tight">
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

                <h2 className="mt-3.5 text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3] truncate">
                  {profile?.fullName || "Học viên The IELTS Spells"}
                </h2>

                <Link
                  href="/student/learning-profile"
                  className="mt-1 inline-block text-xs font-bold text-[#6D55A8] hover:text-[#523E84] dark:text-[#C4B5FD] dark:hover:text-[#DDD3FA] hover:underline transition-colors"
                >
                  Xem hồ sơ công khai
                </Link>
              </div>

              {/* Navigation Menu Links */}
              <nav className="py-2" aria-label="Danh mục cài đặt">
                <ul className="space-y-0.5">
                  {SIDEBAR_TABS.map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComp = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => switchTab(item.id)}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-sm rounded-none transition-colors text-left ${
                            isActive
                              ? "bg-[#6D55A8] text-white font-bold dark:bg-[#735BA2] dark:text-white"
                              : "text-[#1C1D1F] dark:text-[#BEB2BC] hover:bg-[#F7F9FA] dark:hover:bg-[#2C2630] hover:text-[#1C1D1F] dark:hover:text-[#F5F0F3] font-medium"
                          }`}
                        >
                          <IconComp size={17} weight={isActive ? "bold" : "regular"} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Quick Support Tag */}
            <div className="p-5 border-t border-[#D1D7DC] dark:border-[#403640] text-center text-xs text-[#6A6F73] dark:text-[#BEB2BC]">
              <span>Cần trợ giúp? </span>
              <a href="mailto:support@theieltssspells.vn" className="font-bold text-[#6D55A8] dark:text-[#C4B5FD] hover:underline">
                Liên hệ hỗ trợ
              </a>
            </div>
          </aside>

          {/* ===================================================================
              RIGHT CONTENT AREA (UDEMY STYLE)
          =================================================================== */}
          <section className="flex-1 p-6 sm:p-10 bg-white dark:bg-[#221E24] overflow-y-auto">
            
            {/* ===================================================================
                TAB 1: PUBLIC PROFILE (HỒ SƠ CÁ NHÂN)
            =================================================================== */}
            {activeTab === "profile" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Hồ sơ cá nhân
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Thêm thông tin chi tiết về bản thân và mục tiêu học tập IELTS của bạn.
                  </p>
                </header>

                {profileSuccessMsg && (
                  <div className="mb-6 flex items-center gap-3 border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    <CheckCircle size={20} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="mb-6 flex items-center gap-3 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 px-4 py-3 text-sm font-semibold text-rose-900 dark:text-rose-300">
                    <WarningCircle size={20} weight="fill" className="text-rose-600 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Basics: First Name & Last Name */}
                  <div>
                    <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-3">
                      Thông tin cơ bản:
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="student-last-name" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                          Họ và tên đệm
                        </label>
                        <input
                          id="student-last-name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Nguyễn Văn"
                          className="w-full h-11 border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] text-[#1C1D1F] dark:text-[#F5F0F3] px-3.5 text-sm rounded-none outline-none focus:border-[#1C1D1F] dark:focus:border-[#BEADEC] focus:ring-1 focus:ring-[#1C1D1F] dark:focus:ring-[#BEADEC] transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="student-first-name" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                          Tên <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="student-first-name"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Phong"
                          className="w-full h-11 border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] text-[#1C1D1F] dark:text-[#F5F0F3] px-3.5 text-sm rounded-none outline-none focus:border-[#1C1D1F] dark:focus:border-[#BEADEC] focus:ring-1 focus:ring-[#1C1D1F] dark:focus:ring-[#BEADEC] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Headline */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="student-headline" className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">
                        Tiêu đề hồ sơ (Headline)
                      </label>
                      <span className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">
                        {60 - headline.length} ký tự còn lại
                      </span>
                    </div>
                    <input
                      id="student-headline"
                      type="text"
                      maxLength={60}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="IELTS Scholar - Target Band 7.5+ | Dedicated Learner"
                      className="w-full h-11 border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] text-[#1C1D1F] dark:text-[#F5F0F3] px-3.5 text-sm rounded-none outline-none focus:border-[#1C1D1F] dark:focus:border-[#BEADEC] focus:ring-1 focus:ring-[#1C1D1F] dark:focus:ring-[#BEADEC] transition-all"
                    />
                    <p className="mt-1 text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">
                      Thêm một tiêu đề chuyên môn, ví dụ: &quot;IELTS Scholar - Target Band 7.5+&quot; hoặc &quot;Học viên The IELTS Spells&quot;.
                    </p>
                  </div>

                  {/* Biography (with rich formatting bar) */}
                  <div>
                    <label htmlFor="student-biography" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                      Giới thiệu bản thân (Biography)
                    </label>

                    {/* Simple formatting toolbar */}
                    <div className="border border-[#D1D7DC] dark:border-[#403640] rounded-none bg-white dark:bg-[#2C2630] overflow-hidden">
                      <div className="flex items-center gap-1 border-b border-[#D1D7DC] dark:border-[#403640] bg-[#FAF8F7] dark:bg-[#221E24] px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setBiography((prev) => prev ? `**${prev}**` : "**Văn bản in đậm**")}
                          title="In đậm (Bold)"
                          className="w-7 h-7 flex items-center justify-center font-bold text-sm text-[#1C1D1F] dark:text-[#F5F0F3] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-none"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => setBiography((prev) => prev ? `*${prev}*` : "*Văn bản in nghiêng*")}
                          title="In nghiêng (Italic)"
                          className="w-7 h-7 flex items-center justify-center italic text-sm text-[#1C1D1F] dark:text-[#F5F0F3] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-none"
                        >
                          I
                        </button>
                      </div>

                      <textarea
                        id="student-biography"
                        rows={4}
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        placeholder="Chia sẻ ngắn gọn về mục tiêu thi IELTS, sở thích hoặc định hướng học thuật của bạn..."
                        className="w-full p-3 text-sm text-[#1C1D1F] dark:text-[#F5F0F3] bg-transparent outline-none resize-y"
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">
                      Không chèn đường dẫn liên kết ngoài hoặc nội dung quảng cáo trong phần giới thiệu.
                    </p>
                  </div>

                  {/* Language */}
                  <div>
                    <label htmlFor="student-language" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                      Ngôn ngữ hiển thị
                    </label>
                    <select
                      id="student-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full max-w-sm h-11 border border-[#6A6F73] dark:border-[#5C5056] bg-white dark:bg-[#221E24] px-3.5 text-sm text-[#1C1D1F] dark:text-[#F5F0F3] rounded-none outline-none focus:border-[#1C1D1F] focus:ring-1 focus:ring-[#1C1D1F]"
                    >
                      <option value="vi">Tiếng Việt (Vietnamese)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>

                  {/* IELTS Spells Academic Profile Card (Integrated neatly) */}
                  <div className="pt-4 border-t border-[#D1D7DC] dark:border-[#403640]">
                    <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-3">
                      Hồ sơ học viên The IELTS Spells:
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F9FA] dark:bg-[#140F13] p-5 border border-[#D1D7DC] dark:border-[#403640]">
                      <div>
                        <label htmlFor="student-phone" className="block text-xs font-bold text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] uppercase tracking-wider mb-1">
                          Số điện thoại liên hệ
                        </label>
                        <input
                          id="student-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678"
                          className="w-full h-10 border border-[#D1D7DC] dark:border-[#403640] dark:border-[#4B3E45] bg-white dark:bg-[#221E24] px-3 text-sm text-[#1C1D1F] dark:text-[#F5F0F3] outline-none focus:border-[#6D55A8] dark:focus:border-[#BEADEC]"
                        />
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] uppercase tracking-wider mb-1">
                          Mã định danh học viên
                        </span>
                        <div className="h-10 border border-[#D1D7DC] dark:border-[#403640] dark:border-[#4B3E45] bg-gray-100 dark:bg-[#20181D] px-3 flex items-center justify-between font-mono text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] dark:text-[#E17A9B]">
                          <span>{profile?.studentCode || "Chưa cấp mã"}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Định danh</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] uppercase tracking-wider mb-1">
                          Khóa học đang học
                        </span>
                        <div className="h-10 border border-[#D1D7DC] dark:border-[#403640] dark:border-[#4B3E45] bg-gray-100 dark:bg-[#20181D] px-3 flex items-center text-sm font-semibold text-[#1C1D1F] dark:text-[#F5F0F3] truncate">
                          {activeCourse ? `${activeCourse.courseCode} · ${activeCourse.courseName}` : "Chưa đăng ký khóa"}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] uppercase tracking-wider mb-1">
                          Mục tiêu Band IELTS
                        </span>
                        <div className="h-10 border border-[#D1D7DC] dark:border-[#403640] dark:border-[#4B3E45] bg-gray-100 dark:bg-[#20181D] px-3 flex items-center justify-between text-sm font-bold text-[#594389] dark:text-[#C4B5FD]">
                          <span>{profile?.targetBand ? `Band ${profile.targetBand.toFixed(1)}` : "Chưa đặt"}</span>
                          <Link href="/student/learning-profile" className="text-xs font-bold text-[#6D55A8] dark:text-[#C4B5FD] hover:underline">
                            Đổi mục tiêu
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button (Udemy signature purple style) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="min-w-28 h-11 bg-[#6D55A8] hover:bg-[#594389] dark:bg-[#735BA2] dark:hover:bg-[#8369B5] text-white font-bold px-7 text-sm rounded-none shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===================================================================
                TAB 2: PHOTO (ẢNH HỒ SƠ)
            =================================================================== */}
            {activeTab === "photo" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Ảnh hồ sơ
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Thêm một bức ảnh đẹp của bạn để hiển thị trên hồ sơ học tập và bảng chấm điểm.
                  </p>
                </header>

                {avatarSuccessMsg && (
                  <div className="mb-6 flex items-center gap-3 border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    <CheckCircle size={20} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>{avatarSuccessMsg}</span>
                  </div>
                )}

                {avatarErrorMsg && (
                  <div className="mb-6 flex items-center gap-3 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 px-4 py-3 text-sm font-semibold text-rose-900 dark:text-rose-300">
                    <WarningCircle size={20} weight="fill" className="text-rose-600 shrink-0" />
                    <span>{avatarErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Image Preview Box (Udemy style: large centered box) */}
                  <div>
                    <span className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-2">
                      Xem trước ảnh (Image preview)
                    </span>
                    <div className="w-full max-w-2xl bg-[#F7F9FA] dark:bg-[#221E24] border border-[#D1D7DC] dark:border-[#403640] p-10 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-[#D1D7DC] dark:border-[#403640] bg-[#1C1D1F] flex items-center justify-center text-white text-5xl font-bold">
                        {avatarPreview || profile?.avatarPath ? (
                          <img
                            src={avatarPreview || profile?.avatarPath || ""}
                            alt="Ảnh đại diện"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={72} weight="fill" className="text-[#A19D9F]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add / Change Image Input Bar */}
                  <div>
                    <span className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-2">
                      Thêm / Thay đổi ảnh (Add / Change Image)
                    </span>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center max-w-2xl gap-3">
                      <div className="flex-1 h-11 border border-[#6A6F73] dark:border-[#5C5056] dark:bg-[#221E24] px-3.5 flex items-center text-sm text-[#1C1D1F] dark:text-[#F5F0F3] truncate">
                        {avatarFile ? avatarFile.name : "Chưa chọn tệp (No file selected)"}
                      </div>

                      <label
                        htmlFor="photo-file-input"
                        className="h-11 px-6 border border-[#6D55A8] dark:border-[#BEADEC] text-[#6D55A8] dark:text-[#C4B5FD] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#F5F2FA] dark:hover:bg-[#292137] transition-colors shrink-0"
                      >
                        <span>Tải ảnh lên</span>
                      </label>
                      <input
                        id="photo-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          handleAvatarSelection(e.target.files?.[0] || null);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">
                      Ảnh cần có kích thước tối thiểu 200x200px. Định dạng hỗ trợ: PNG, JPG, WebP hoặc GIF. Tối đa 5 MB.
                    </p>
                  </div>

                  {/* Save Photo Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={!avatarFile || isSavingAvatar}
                      className="min-w-28 h-11 bg-[#6D55A8] hover:bg-[#594389] dark:bg-[#735BA2] dark:hover:bg-[#8369B5] text-white font-bold px-7 text-sm rounded-none shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingAvatar ? "Đang lưu ảnh..." : "Lưu ảnh"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 3: ACCOUNT SECURITY (BẢO MẬT TÀI KHOẢN)
            =================================================================== */}
            {activeTab === "security" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Tài khoản &amp; Bảo mật
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Chỉnh sửa cài đặt tài khoản và đổi mật khẩu của bạn tại đây.
                  </p>
                </header>

                <div className="space-y-8">
                  {/* Email Section (Udemy style box with pencil icon) */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-2">
                      Email đăng nhập:
                    </label>

                    <div className="flex items-center justify-between border border-[#D1D7DC] dark:border-[#403640] bg-[#F7F9FA] dark:bg-[#221E24] p-3.5 max-w-2xl">
                      <span className="text-sm text-[#554D50] dark:text-[#BEB2BC] dark:text-[#F5F0F3]">
                        Địa chỉ email của bạn là <strong className="text-[#1C1D1F] dark:text-[#F5F0F3] font-bold">{profile?.email || session?.user?.email}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowEmailEditNotice(!showEmailEditNotice)}
                        className="p-2 border border-[#D1D7DC] dark:border-[#403640] dark:border-[#4B3E45] bg-white dark:bg-[#221E24] hover:bg-gray-100 text-[#6D55A8] dark:text-[#C4B5FD] transition-colors"
                        title="Đổi địa chỉ email"
                      >
                        <Pencil size={16} weight="bold" />
                      </button>
                    </div>

                    {showEmailEditNotice && (
                      <div className="mt-3 max-w-2xl p-3.5 border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                        <Info size={18} weight="fill" className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Thay đổi địa chỉ email tài khoản học tập:</p>
                          <p className="mt-0.5">
                            Để bảo vệ tính toàn vẹn học bạ và chứng chỉ kết quả thi, việc đổi email cần được xác thực thông qua trung tâm. Vui lòng liên hệ <a href="mailto:support@theieltssspells.vn" className="underline font-bold">support@theieltssspells.vn</a> để được hỗ trợ chuyển đổi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Password Change Section (Udemy style) */}
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
                    {passwordSuccessMsg && (
                      <div className="flex items-center gap-3 border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                        <CheckCircle size={20} weight="fill" className="text-emerald-600 shrink-0" />
                        <span>{passwordSuccessMsg}</span>
                      </div>
                    )}

                    {passwordErrorMsg && (
                      <div className="flex items-center gap-3 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 px-4 py-3 text-sm font-semibold text-rose-900 dark:text-rose-300">
                        <WarningCircle size={20} weight="fill" className="text-rose-600 shrink-0" />
                        <span>{passwordErrorMsg}</span>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label htmlFor="udemy-new-password" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                        Mật khẩu mới (New password)
                      </label>
                      <div className="relative">
                        <input
                          id="udemy-new-password"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full h-11 border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] text-[#1C1D1F] dark:text-[#F5F0F3] px-3.5 pr-10 text-sm rounded-none outline-none focus:border-[#1C1D1F] dark:focus:border-[#BEADEC] focus:ring-1 focus:ring-[#1C1D1F] dark:focus:ring-[#BEADEC]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white"
                          aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Password strength checklist */}
                      {newPassword && (
                        <div className="mt-2.5 p-3 bg-[#F7F9FA] dark:bg-[#140F13] border border-[#D1D7DC] dark:border-[#403640] text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="text-gray-600 dark:text-gray-400">Độ mạnh mật khẩu:</span>
                            <span className={passwordStrengthScore <= 1 ? "text-rose-600" : passwordStrengthScore <= 3 ? "text-amber-600" : "text-emerald-600"}>
                              {passwordStrengthScore <= 1 ? "Yếu" : passwordStrengthScore <= 3 ? "Trung bình" : "Rất tốt"}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5">
                            <div className={`rounded-none ${passwordStrengthScore >= 1 ? (passwordStrengthScore <= 1 ? "bg-rose-500" : "bg-amber-500") : "bg-gray-200"}`} />
                            <div className={`rounded-none ${passwordStrengthScore >= 2 ? (passwordStrengthScore <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-gray-200"}`} />
                            <div className={`rounded-none ${passwordStrengthScore >= 3 ? "bg-emerald-500" : "bg-gray-200"}`} />
                            <div className={`rounded-none ${passwordStrengthScore >= 4 ? "bg-emerald-500" : "bg-gray-200"}`} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="udemy-confirm-password" className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-1.5">
                        Xác nhận mật khẩu mới (Confirm new password)
                      </label>
                      <div className="relative">
                        <input
                          id="udemy-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-11 border border-[#D1D7DC] dark:border-[#403640] bg-white dark:bg-[#2C2630] text-[#1C1D1F] dark:text-[#F5F0F3] px-3.5 pr-10 text-sm rounded-none outline-none focus:border-[#1C1D1F] dark:focus:border-[#BEADEC] focus:ring-1 focus:ring-[#1C1D1F] dark:focus:ring-[#BEADEC]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white"
                          aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Change Password Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="h-11 bg-[#6D55A8] hover:bg-[#594389] dark:bg-[#735BA2] dark:hover:bg-[#8369B5] text-white font-bold px-7 text-sm rounded-none shadow-none transition-colors disabled:opacity-50"
                      >
                        {isChangingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </form>

                  {/* Multi-factor Authentication (MFA) Section */}
                  <div className="pt-6 border-t border-[#D1D7DC] dark:border-[#403640]">
                    <div className="border border-[#D1D7DC] dark:border-[#403640] bg-[#F7F9FA] dark:bg-[#221E24] p-5 max-w-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">
                          Xác thực đa yếu tố (Multi-factor Authentication)
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-none">
                          <Check size={12} weight="bold" /> Đang bảo vệ
                        </span>
                      </div>
                      <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] leading-relaxed">
                        Tăng cường an toàn cho tài khoản học viên bằng việc yêu cầu mã xác nhận gửi tới email khi đăng nhập từ thiết bị lạ.
                      </p>
                    </div>
                  </div>

                  {/* Active Sessions & Forgot Password */}
                  <div className="pt-2 max-w-2xl space-y-4">
                    <div className="border border-[#D1D7DC] dark:border-[#403640] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          <Laptop size={20} weight="bold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Phiên đăng nhập trình duyệt này</p>
                          <p className="text-[11px] text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">Đang hoạt động · SSL/JWT Encrypted</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        Đăng xuất phiên này
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-[#D1D7DC] dark:border-[#403640] bg-gray-50 dark:bg-[#161014]">
                      <div className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">
                        <span className="font-bold text-[#1C1D1F] dark:text-[#F5F0F3] block">Quên mật khẩu cũ?</span>
                        Nhận liên kết khôi phục gửi tới hộp thư của bạn.
                      </div>
                      <button
                        type="button"
                        onClick={handleSendForgotPassword}
                        disabled={forgotSending}
                        className="px-4 py-2 bg-white dark:bg-[#221E24] border border-[#6D55A8] dark:border-[#BEADEC] text-[#6D55A8] dark:text-[#C4B5FD] text-xs font-bold hover:bg-[#F5F2FA] dark:hover:bg-[#292137] transition-colors disabled:opacity-50"
                      >
                        {forgotSending ? "Đang gửi..." : "Gửi email khôi phục"}
                      </button>
                    </div>

                    {forgotSuccess && (
                      <div className="p-3 border border-emerald-600 bg-emerald-50 text-xs font-bold text-emerald-800">
                        Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư đến và thư rác.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 4: SUBSCRIPTIONS & COURSES (KHÓA HỌC & GÓI HỌC)
            =================================================================== */}
            {activeTab === "subscriptions" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Khóa học &amp; Gói học
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Quản lý khóa học IELTS đang theo học, lộ trình buổi học và lịch thi.
                  </p>
                </header>

                <div className="space-y-4 max-w-2xl">
                  {data.enrollments && data.enrollments.length > 0 ? (
                    data.enrollments.map((enr) => (
                      <div key={enr.enrollmentId} className="border border-[#D1D7DC] dark:border-[#403640] p-5 bg-white dark:bg-[#140F13] space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-[#F5F2FA] text-[#594389] dark:bg-[#292137] dark:text-[#C4B5FD] text-[10px] font-bold uppercase tracking-wider mb-1">
                              {enr.status === "ACTIVE" ? "Đang theo học" : enr.status}
                            </span>
                            <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">
                              {enr.courseCode} · {enr.courseName}
                            </h3>
                          </div>
                          <span className="text-xs font-bold text-[#594389] dark:text-[#C4B5FD] px-2.5 py-1 bg-[#EAE3F7] dark:bg-[#342749]">
                            Target {enr.courseTargetBand ? `Band ${enr.courseTargetBand}` : "IELTS"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] border-t border-[#D1D7DC] dark:border-[#403640] dark:border-[#2C2428]">
                          <div>
                            <span className="block font-medium">Tiến độ bài học:</span>
                            <strong className="text-[#1C1D1F] dark:text-[#F5F0F3]">{enr.completedSessions} / {enr.totalSessions} buổi</strong>
                          </div>
                          <div>
                            <span className="block font-medium">Giảng viên phụ trách:</span>
                            <strong className="text-[#1C1D1F] dark:text-[#F5F0F3]">{enr.primaryTeacherName || "The IELTS Spells Academic Team"}</strong>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Link
                            href={`/student/courses/${enr.courseId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6D55A8] hover:bg-[#594389] dark:bg-[#735BA2] dark:hover:bg-[#8369B5] text-white text-xs font-bold transition-colors"
                          >
                            <span>Vào lớp học</span>
                            <ArrowRight size={14} weight="bold" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 border border-[#D1D7DC] dark:border-[#403640] text-center text-sm text-[#6A6F73] dark:text-[#BEB2BC]">
                      Bạn chưa có khóa học nào đang hoạt động.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 5: PRIVACY (QUYỀN RIÊNG TƯ)
            =================================================================== */}
            {activeTab === "privacy" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Quyền riêng tư
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Kiểm soát hiển thị hồ sơ cá nhân và chia sẻ dữ liệu kết quả học tập.
                  </p>
                </header>

                {privacySaved && (
                  <div className="mb-6 flex items-center gap-2 border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    <span>Đã lưu cài đặt quyền riêng tư.</span>
                  </div>
                )}

                <div className="space-y-5 max-w-2xl divide-y divide-[#D1D7DC] dark:divide-[#3D3338]">
                  <div className="flex items-center justify-between pt-2">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Hiển thị hồ sơ học tập công khai</p>
                      <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">
                        Cho phép các bạn học viên trong cùng lớp nhìn thấy thẻ hồ sơ và mục tiêu band điểm của bạn.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showProfileToClass}
                      onChange={(e) => {
                        setShowProfileToClass(e.target.checked);
                        savePrivacyPref("student_priv_class", e.target.checked);
                      }}
                      className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Xếp hạng trên Bảng vàng vinh danh (Leaderboard)</p>
                      <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">
                        Hiển thị điểm số bài thi thử Mock test và chuỗi ngày học liên tục (streak) trên bảng xếp hạng chung.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLeaderboardScore}
                      onChange={(e) => {
                        setShowLeaderboardScore(e.target.checked);
                        savePrivacyPref("student_priv_lead", e.target.checked);
                      }}
                      className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-5">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Chia sẻ bài viết mẫu tiêu biểu</p>
                      <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">
                        Cho phép giáo viên trích dẫn bài làm Writing đạt band cao làm tài liệu mẫu cho lớp học (đã ẩn danh).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowTeacherFeedbackShare}
                      onChange={(e) => {
                        setAllowTeacherFeedbackShare(e.target.checked);
                        savePrivacyPref("student_priv_feedback", e.target.checked);
                      }}
                      className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 6: NOTIFICATIONS (TÙY CHỌN THÔNG BÁO)
            =================================================================== */}
            {activeTab === "notifications" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Tùy chọn thông báo
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Lựa chọn các sự kiện và kênh bạn muốn nhận thông báo từ hệ thống.
                  </p>
                </header>

                {notificationSaved && (
                  <div className="mb-6 flex items-center gap-2 border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    <span>Đã tự động lưu tùy chọn thông báo.</span>
                  </div>
                )}

                <div className="space-y-6 max-w-2xl">
                  {/* Event Notifications */}
                  <div>
                    <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-3">
                      Sự kiện học tập:
                    </h3>
                    <div className="border border-[#D1D7DC] dark:border-[#403640] divide-y divide-[#D1D7DC] dark:divide-[#3D3338]">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Bài tập và hạn nộp bài</p>
                          <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">Nhắc hạn nộp trước 24 giờ khi bài tập sắp hết hạn.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.assignmentDeadlineReminder}
                          onChange={() => handleToggleNotif("assignmentDeadlineReminder")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Kết quả và nhận xét chấm điểm</p>
                          <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">Thông báo khi bài Writing / Speaking có điểm số chính thức.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.gradingCompletedAlert}
                          onChange={() => handleToggleNotif("gradingCompletedAlert")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Nhắc ca học Zoom trực tuyến</p>
                          <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">Nhắc nhở trước 30 phút khi buổi học sắp bắt đầu.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.upcomingClassReminder}
                          onChange={() => handleToggleNotif("upcomingClassReminder")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Báo cáo tiến độ tuần</p>
                          <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3] mt-0.5">Gửi tổng kết số lượng từ vựng và bài đọc hoàn thành vào sáng thứ Hai.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.weeklyProgressDigest}
                          onChange={() => handleToggleNotif("weeklyProgressDigest")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-3">
                      Phương thức nhận:
                    </h3>
                    <div className="border border-[#D1D7DC] dark:border-[#403640] divide-y divide-[#D1D7DC] dark:divide-[#3D3338]">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1C1D1F] dark:text-[#F5F0F3]">Thông báo trong hệ thống (In-app Bell)</span>
                        <input
                          type="checkbox"
                          checked={notifications.inAppNotification}
                          onChange={() => handleToggleNotif("inAppNotification")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1C1D1F] dark:text-[#F5F0F3]">Email thông báo học tập</span>
                        <input
                          type="checkbox"
                          checked={notifications.emailNotification}
                          onChange={() => handleToggleNotif("emailNotification")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1C1D1F] dark:text-[#F5F0F3]">Âm thanh chuông báo trên trình duyệt</span>
                        <input
                          type="checkbox"
                          checked={notifications.browserSoundAlert}
                          onChange={() => handleToggleNotif("browserSoundAlert")}
                          className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 7: PRACTICE SETTINGS (TÙY CHỌN LUYỆN THI)
            =================================================================== */}
            {activeTab === "preferences" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Tùy chọn luyện thi
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Tùy chỉnh cỡ chữ đề thi, kỹ năng ưu tiên và chế độ làm bài tập trung.
                  </p>
                </header>

                {prefSaved && (
                  <div className="mb-6 flex items-center gap-2 border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    <span>Đã cập nhật tùy chọn phòng luyện thi.</span>
                  </div>
                )}

                <div className="space-y-6 max-w-2xl">
                  {/* Default Skill Selection */}
                  <div>
                    <label className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-2">
                      Kỹ năng mở mặc định khi vào khu vực Luyện đề:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                            className={`p-3 border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isSel
                                ? "border-[#6D55A8] bg-[#6D55A8] text-white font-bold dark:border-[#BEADEC] dark:bg-[#735BA2] dark:text-white"
                                : "border-[#D1D7DC] dark:border-[#403640] dark:border-[#3D3338] bg-white dark:bg-[#221E24] text-[#554D50] dark:text-[#BEB2BC] dark:text-[#F5F0F3] hover:bg-gray-50"
                            }`}
                          >
                            <IconComp size={16} weight={isSel ? "bold" : "regular"} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reading Font Size */}
                  <div className="pt-4 border-t border-[#D1D7DC] dark:border-[#403640]">
                    <label className="block text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3] mb-2">
                      Cỡ chữ bài đọc (Reading) &amp; đề thi:
                    </label>

                    <div className="grid grid-cols-3 gap-3 max-w-sm">
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
                          className={`p-2.5 border text-xs font-bold text-center transition-all ${
                            examFontSize === item.size
                              ? "border-[#6D55A8] bg-[#6D55A8] text-white font-bold dark:border-[#BEADEC] dark:bg-[#735BA2] dark:text-white"
                              : "border-[#D1D7DC] dark:border-[#403640] dark:border-[#3D3338] bg-white dark:bg-[#221E24] text-[#554D50] dark:text-[#BEB2BC] dark:text-[#F5F0F3] hover:bg-gray-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Live Preview Box */}
                    <div className="mt-3.5 p-4 bg-[#F7F9FA] dark:bg-[#221E24] border border-[#D1D7DC] dark:border-[#403640]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Xem trước văn bản bài đọc:
                      </span>
                      <p
                        className={`text-[#1C1D1F] dark:text-[#F5F0F3] leading-relaxed font-sans ${
                          examFontSize === "sm" ? "text-sm" : examFontSize === "lg" ? "text-lg" : "text-base"
                        }`}
                      >
                        “The IELTS Academic Reading test assesses a wide variety of reading skills, including reading for gist, skimming, understanding logical argument and recognizing writer&apos;s purpose.”
                      </p>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="pt-4 border-t border-[#D1D7DC] dark:border-[#403640] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Tự động lưu câu trả lời (Auto-save)</p>
                        <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">Đồng bộ đáp án liên tục để không bị mất kết quả khi mạng chập chờn.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSaveAnswers}
                        onChange={(e) => {
                          setAutoSaveAnswers(e.target.checked);
                          savePracticePref("student_exam_auto_save", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Cảnh báo đếm ngược 5 phút cuối</p>
                        <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">Đổi màu đồng hồ nhắc nhở rà soát lại phiếu đáp án trước khi nộp bài.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={countdownWarning}
                        onChange={(e) => {
                          setCountdownWarning(e.target.checked);
                          savePracticePref("student_exam_countdown_warn", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-[#1C1D1F] dark:text-[#F5F0F3]">Chế độ tập trung (Focus Mode)</p>
                        <p className="text-xs text-[#6A6F73] dark:text-[#BEB2BC] dark:text-[#A89FA3]">Tạm ẩn các thông báo ngoài lề khi đang trong phòng làm bài thi.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={focusMode}
                        onChange={(e) => {
                          setFocusMode(e.target.checked);
                          savePracticePref("student_exam_focus_mode", String(e.target.checked));
                        }}
                        className="w-4 h-4 rounded-none accent-[#6D55A8] dark:accent-[#C4B5FD] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TAB 8: CLOSE ACCOUNT (ĐĂNG XUẤT / ĐÓNG TÀI KHOẢN)
            =================================================================== */}
            {activeTab === "close" && (
              <div className="max-w-3xl animate-in fade-in duration-150">
                <header className="border-b border-[#D1D7DC] dark:border-[#403640] pb-6 mb-7">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#F5F0F3]">
                    Đăng xuất tài khoản
                  </h1>
                  <p className="text-sm text-[#6A6F73] dark:text-[#BEB2BC] mt-1">
                    Đăng xuất khỏi phiên làm việc hiện tại trên thiết bị này.
                  </p>
                </header>

                <div className="space-y-6 max-w-2xl">
                  <div className="rounded-none border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-bold flex items-center gap-2 mb-1.5 text-amber-800 dark:text-amber-300">
                      <WarningCircle size={18} weight="fill" className="text-amber-600 dark:text-amber-400 shrink-0" />
                      Lưu ý trước khi đăng xuất:
                    </p>
                    <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                      Hãy chắc chắn rằng bạn đã hoàn thành hoặc nộp bài cho các phần thi đang làm dở dang. Mọi tiến độ học tập và kết quả của bạn đều được đồng bộ an toàn trên đám mây.
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="h-11 bg-[#BD4F70] hover:bg-[#A83E5E] dark:bg-[#BE4F74] dark:hover:bg-[#D65D86] text-white font-bold px-7 text-sm rounded-none shadow-none active:translate-y-px transition-all"
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
