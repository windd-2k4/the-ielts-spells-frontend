"use client";

import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  FacebookLogo,
  GoogleLogo,
  LockKey,
  LockSimple,
  Sparkle,
  Student,
  User,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./ModernAuth.module.css";
import { MainWebBackdrop } from "./MainWebBackdrop";
import { StudentFormNotice } from "./StudentFormNotice";
import { useStudentSession } from "./StudentSessionProvider";

type StudentModernAuthProps = {
  initialMode?: "login" | "register";
};

type LoginFieldErrors = Partial<Record<"email" | "password", string>>;
type RegFieldErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword", string>>;

function destination(value: string | null) {
  return value?.startsWith("/student/") &&
    !value.startsWith("/student/login") &&
    !value.startsWith("/student/register") &&
    !value.startsWith("/student/auth")
    ? value
    : "/student";
}

export function StudentModernAuth({ initialMode = "login" }: StudentModernAuthProps) {
  const {
    completeOnboarding,
    isConfigured,
    isLoading,
    resendSignupConfirmation,
    session,
    signIn,
    signInWithOAuth,
    signUp,
  } = useStudentSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destination(searchParams.get("next"));
  const registered = searchParams.get("registered") === "true";

  // Active mode state (false = Sign In, true = Sign Up)
  const [isSignUp, setIsSignUp] = useState(initialMode === "register");

  // Sign In states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginFieldErrors, setLoginFieldErrors] = useState<LoginFieldErrors>({});
  const [loginError, setLoginError] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sign Up states
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regFieldErrors, setRegFieldErrors] = useState<RegFieldErrors>({});
  const [regError, setRegError] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  const authActionStarted = useRef(false);

  // Pre-fill email when user arrives from registration confirmation
  useEffect(() => {
    if (!registered) return;
    const pendingEmail = window.sessionStorage.getItem("student.pendingConfirmationEmail");
    if (pendingEmail) setLoginEmail(pendingEmail);
  }, [registered]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  // Handle existing active session onboarding redirect
  useEffect(() => {
    if (isLoading || !session || authActionStarted.current) return;
    authActionStarted.current = true;
    setLoginSubmitting(true);
    const fullName =
      typeof session.user.user_metadata?.full_name === "string"
        ? session.user.user_metadata.full_name
        : undefined;

    void completeOnboarding(fullName).then((failure) => {
      if (failure) {
        setLoginError(failure);
        setLoginSubmitting(false);
        authActionStarted.current = false;
        return;
      }
      router.replace(next);
    });
  }, [completeOnboarding, isLoading, next, router, session]);

  // Switch to Sign Up mode with URL update
  function switchToSignUp() {
    setIsSignUp(true);
    const targetUrl = "/student/register" + (next !== "/student" ? `?next=${encodeURIComponent(next)}` : "");
    window.history.replaceState(null, "", targetUrl);
  }

  // Switch to Sign In mode with URL update
  function switchToSignIn() {
    setIsSignUp(false);
    const targetUrl = "/student/login" + (next !== "/student" ? `?next=${encodeURIComponent(next)}` : "");
    window.history.replaceState(null, "", targetUrl);
  }

  // Submit Login
  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const nextErrors: LoginFieldErrors = {};
    if (!loginEmail.trim() || !/^\S+@\S+\.\S+$/.test(loginEmail.trim())) {
      nextErrors.email = "Vui lòng nhập email hợp lệ.";
    }
    if (!loginPassword) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }
    setLoginFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    authActionStarted.current = true;
    setLoginSubmitting(true);
    const failure = await signIn(loginEmail.trim(), loginPassword);
    if (failure) {
      setLoginError(failure);
      setLoginSubmitting(false);
      authActionStarted.current = false;
      return;
    }
    router.replace(next);
  }

  // Submit Register
  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegError("");
    const nextErrors: RegFieldErrors = {};
    if (regFullName.trim().length < 2) {
      nextErrors.fullName = "Vui lòng nhập họ và tên đầy đủ.";
    }
    if (!regEmail.trim() || !/^\S+@\S+\.\S+$/.test(regEmail.trim())) {
      nextErrors.email = "Vui lòng nhập email hợp lệ.";
    }
    if (regPassword.length < 8) {
      nextErrors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
    }
    if (regConfirmPassword !== regPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    }
    setRegFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setRegSubmitting(true);
    const result = await signUp(regFullName, regEmail.trim(), regPassword);
    if (result.error) {
      setRegError(result.error);
      setRegSubmitting(false);
      return;
    }
    if (result.status === "confirmation") {
      window.sessionStorage.setItem("student.pendingConfirmationEmail", regEmail.trim());
      setLoginEmail(regEmail.trim());
      setIsSignUp(false);
      window.history.replaceState(null, "", "/student/login?registered=true");
      setResendNotice("Đăng ký thành công! Vui lòng xác nhận email trước khi đăng nhập.");
      setRegSubmitting(false);
      return;
    }
    router.replace("/student/reading?welcome=true");
  }

  // OAuth authentication
  async function authenticateWith(provider: "google" | "facebook") {
    setLoginError("");
    setRegError("");
    authActionStarted.current = true;
    if (isSignUp) {
      setRegSubmitting(true);
      const failure = await signInWithOAuth(provider, "/student/reading?welcome=true");
      if (failure) {
        setRegError(failure);
        setRegSubmitting(false);
        authActionStarted.current = false;
      }
    } else {
      setLoginSubmitting(true);
      const failure = await signInWithOAuth(provider, next);
      if (failure) {
        setLoginError(failure);
        setLoginSubmitting(false);
        authActionStarted.current = false;
      }
    }
  }

  // Resend email confirmation
  async function resendConfirmation() {
    setLoginError("");
    setResendNotice("");
    if (!loginEmail.trim() || !/^\S+@\S+\.\S+$/.test(loginEmail.trim())) {
      setLoginFieldErrors((current) => ({
        ...current,
        email: "Nhập email đã đăng ký để gửi lại thư xác nhận.",
      }));
      return;
    }
    setResending(true);
    const failure = await resendSignupConfirmation(loginEmail.trim());
    setResending(false);
    if (failure) {
      setLoginError(failure);
      return;
    }
    window.sessionStorage.setItem("student.pendingConfirmationEmail", loginEmail.trim());
    setResendNotice("Đã yêu cầu gửi lại. Hãy kiểm tra cả Hộp thư đến và Thư rác.");
    setResendCooldown(60);
  }

  return (
    <main className={styles.pageWrapper}>
      {/* 1. Main Web blurred in the background */}
      <MainWebBackdrop />

      {/* 2. Frosted glass dark overlay */}
      <div className={styles.backdropOverlay} aria-hidden="true" />

      {/* 3. Top navigation header */}
      <header className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>
        <Link href="/" className={styles.brandLink}>
          <img src="/logo-spells.png" alt="" className={styles.brandLogo} />
          <span>The IELTS Spells</span>
        </Link>
      </header>

      {/* 4. Mobile-only segmented tab switcher */}
      <div className={styles.mobileSegmentedControl}>
        <button
          type="button"
          onClick={switchToSignIn}
          className={`${styles.segmentBtn} ${!isSignUp ? styles.segmentBtnActive : ""}`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={switchToSignUp}
          className={`${styles.segmentBtn} ${isSignUp ? styles.segmentBtnActive : ""}`}
        >
          Đăng ký
        </button>
      </div>

      {/* 5. Modern Login container with AsmrProg sliding overlay animation */}
      <div
        className={`${styles.container} ${isSignUp ? styles.containerActive : ""}`}
        id="auth-container"
      >
        {/* SIGN IN FORM (left side by default) */}
        <div className={`${styles.formContainer} ${styles.signIn}`}>
          <div className={styles.formInner}>
            <div className={styles.formBadge}>
              <LockKey size={14} weight="fill" aria-hidden="true" />
              <span>Cổng học viên</span>
            </div>
            <h1 className={styles.formTitle}>Chào mừng trở lại</h1>
            <p className={styles.formSubtitle}>
              Đăng nhập để mở bài được giao và tiếp tục đúng tiến độ.
            </p>

            {registered ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="success">
                  Đăng ký đã được ghi nhận. Hãy xác nhận email trước khi đăng nhập.
                </StudentFormNotice>
              </div>
            ) : null}
            {resendNotice ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="success">{resendNotice}</StudentFormNotice>
              </div>
            ) : null}
            {!isConfigured ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="error">
                  Ứng dụng chưa có cấu hình Supabase để đăng nhập.
                </StudentFormNotice>
              </div>
            ) : null}
            {loginError ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="error">{loginError}</StudentFormNotice>
              </div>
            ) : null}

            {/* Social login buttons */}
            <div className={styles.socialRow}>
              <button
                type="button"
                onClick={() => void authenticateWith("google")}
                disabled={!isConfigured || loginSubmitting}
                className={styles.socialBtn}
                title="Đăng nhập với Google"
              >
                <GoogleLogo size={19} weight="bold" aria-hidden="true" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => void authenticateWith("facebook")}
                disabled={!isConfigured || loginSubmitting}
                className={styles.socialBtn}
                title="Đăng nhập với Facebook"
              >
                <FacebookLogo size={19} weight="fill" className="text-[#1877f2]" aria-hidden="true" />
                <span>Facebook</span>
              </button>
            </div>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span>hoặc dùng email</span>
              <span className={styles.dividerLine} />
            </div>

            <form onSubmit={handleLoginSubmit} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="login-email" className={styles.inputLabel}>
                  Email
                </label>
                <div className={styles.inputWrapper}>
                  <EnvelopeSimple size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setResendNotice("");
                    }}
                    placeholder="ban@example.com"
                    required
                    disabled={!isConfigured || loginSubmitting}
                    aria-invalid={Boolean(loginFieldErrors.email)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon}`}
                  />
                </div>
                {loginFieldErrors.email ? (
                  <p className={styles.errorText}>{loginFieldErrors.email}</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void resendConfirmation()}
                  disabled={!isConfigured || loginSubmitting || resending || resendCooldown > 0}
                  className={styles.resendBtn}
                >
                  {resending ? (
                    <CircleNotch size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowClockwise size={14} weight="bold" aria-hidden="true" />
                  )}
                  <span>
                    {resending
                      ? "Đang gửi..."
                      : resendCooldown > 0
                      ? `Gửi lại sau ${resendCooldown}s`
                      : "Gửi lại email xác nhận"}
                  </span>
                </button>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="login-password" className={styles.inputLabel}>
                  Mật khẩu
                </label>
                <div className={styles.inputWrapper}>
                  <LockSimple size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    disabled={!isConfigured || loginSubmitting}
                    aria-invalid={Boolean(loginFieldErrors.password)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon} ${styles.inputFieldWithEye}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    disabled={!isConfigured || loginSubmitting}
                    className={styles.eyeButton}
                    aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showLoginPassword ? (
                      <EyeSlash size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {loginFieldErrors.password ? (
                  <p className={styles.errorText}>{loginFieldErrors.password}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!isConfigured || loginSubmitting}
                className={styles.submitBtn}
              >
                {loginSubmitting ? (
                  <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} weight="bold" aria-hidden="true" />
                )}
                <span>{loginSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
              </button>
            </form>

            {/* Mobile switch text */}
            <p className={styles.mobileSwitchText}>
              Chưa có tài khoản?
              <button type="button" onClick={switchToSignUp} className={styles.switchAction}>
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>

        {/* SIGN UP FORM (slides to right side when active) */}
        <div className={`${styles.formContainer} ${styles.signUp}`}>
          <div className={styles.formInner}>
            <div className={styles.formBadge}>
              <Student size={14} weight="fill" aria-hidden="true" />
              <span>Tài khoản mới</span>
            </div>
            <h1 className={styles.formTitle}>Tạo tài khoản</h1>
            <p className={styles.formSubtitle}>
              Bắt đầu học và lưu lại lộ trình IELTS của bạn.
            </p>

            {!isConfigured ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="error">
                  Ứng dụng chưa có cấu hình Supabase để đăng ký.
                </StudentFormNotice>
              </div>
            ) : null}
            {regError ? (
              <div className="mt-2.5">
                <StudentFormNotice compact kind="error">{regError}</StudentFormNotice>
              </div>
            ) : null}

            {/* Social register buttons */}
            <div className={styles.socialRow}>
              <button
                type="button"
                onClick={() => void authenticateWith("google")}
                disabled={!isConfigured || regSubmitting}
                className={styles.socialBtn}
                title="Đăng ký với Google"
              >
                <GoogleLogo size={19} weight="bold" aria-hidden="true" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => void authenticateWith("facebook")}
                disabled={!isConfigured || regSubmitting}
                className={styles.socialBtn}
                title="Đăng ký với Facebook"
              >
                <FacebookLogo size={19} weight="fill" className="text-[#1877f2]" aria-hidden="true" />
                <span>Facebook</span>
              </button>
            </div>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span>hoặc dùng email</span>
              <span className={styles.dividerLine} />
            </div>

            <form onSubmit={handleRegisterSubmit} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="reg-name" className={styles.inputLabel}>
                  Họ và tên
                </label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    maxLength={150}
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    disabled={!isConfigured || regSubmitting}
                    aria-invalid={Boolean(regFieldErrors.fullName)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon}`}
                  />
                </div>
                {regFieldErrors.fullName ? (
                  <p className={styles.errorText}>{regFieldErrors.fullName}</p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-email" className={styles.inputLabel}>
                  Email
                </label>
                <div className={styles.inputWrapper}>
                  <EnvelopeSimple size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ban@example.com"
                    required
                    disabled={!isConfigured || regSubmitting}
                    aria-invalid={Boolean(regFieldErrors.email)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon}`}
                  />
                </div>
                {regFieldErrors.email ? (
                  <p className={styles.errorText}>{regFieldErrors.email}</p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-password" className={styles.inputLabel}>
                  Mật khẩu
                </label>
                <div className={styles.inputWrapper}>
                  <LockSimple size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    disabled={!isConfigured || regSubmitting}
                    aria-invalid={Boolean(regFieldErrors.password)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon} ${styles.inputFieldWithEye}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    disabled={!isConfigured || regSubmitting}
                    className={styles.eyeButton}
                    aria-label={showRegPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showRegPassword ? (
                      <EyeSlash size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {regFieldErrors.password ? (
                  <p className={styles.errorText}>{regFieldErrors.password}</p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-confirm-password" className={styles.inputLabel}>
                  Xác nhận mật khẩu
                </label>
                <div className={styles.inputWrapper}>
                  <LockSimple size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reg-confirm-password"
                    type={showRegConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    disabled={!isConfigured || regSubmitting}
                    aria-invalid={Boolean(regFieldErrors.confirmPassword)}
                    className={`${styles.inputField} ${styles.inputFieldWithIcon} ${styles.inputFieldWithEye}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword((v) => !v)}
                    disabled={!isConfigured || regSubmitting}
                    className={styles.eyeButton}
                    aria-label={showRegConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showRegConfirmPassword ? (
                      <EyeSlash size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {regFieldErrors.confirmPassword ? (
                  <p className={styles.errorText}>{regFieldErrors.confirmPassword}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!isConfigured || regSubmitting}
                className={styles.submitBtn}
              >
                {regSubmitting ? (
                  <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} weight="bold" aria-hidden="true" />
                )}
                <span>{regSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</span>
              </button>
            </form>

            {/* Mobile switch text */}
            <p className={styles.mobileSwitchText}>
              Đã có tài khoản?
              <button type="button" onClick={switchToSignIn} className={styles.switchAction}>
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>

        {/* SLIDING TOGGLE OVERLAY (AsmrProg Modern-Login signature design & animation) */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            {/* Ambient decorative elements inside toggle */}
            <div className={styles.toggleOrb1} aria-hidden="true" />
            <div className={styles.toggleOrb2} aria-hidden="true" />

            {/* Panel on Left: Visible when container is ACTIVE (in Sign Up view) */}
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <div className={styles.sideLogoWrapper}>
                <div className={styles.logoAura} aria-hidden="true" />
                <img
                  src="/logo-spells.png"
                  alt="The IELTS Spells Logo"
                  className={styles.sideLogo}
                />
              </div>

              <span className={styles.quoteTag}>
                <Sparkle size={13} weight="fill" className="text-[#ffe0e7]" aria-hidden="true" />
                The IELTS Spells
              </span>

              <h2 className={styles.quoteHeading}>Welcome Back!</h2>

              <p className={styles.quoteBody}>
                &ldquo;Every practice session brings you closer to your dream band. Pick up right where you left off.&rdquo;
              </p>

              <button
                type="button"
                className={styles.toggleBtn}
                onClick={switchToSignIn}
                id="login"
              >
                Sign In
              </button>

              <div className={styles.sideFeaturePill}>
                <CheckCircle size={14} weight="fill" className="text-[#83d9b3]" aria-hidden="true" />
                <span>Synced Across Devices • Never Lose Progress</span>
              </div>
            </div>

            {/* Panel on Right: Visible when container is INACTIVE (in Sign In view) */}
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <div className={styles.sideLogoWrapper}>
                <div className={styles.logoAura} aria-hidden="true" />
                <img
                  src="/logo-spells.png"
                  alt="The IELTS Spells Logo"
                  className={styles.sideLogo}
                />
              </div>

              <span className={styles.quoteTag}>
                <Sparkle size={13} weight="fill" className="text-[#ffe0e7]" aria-hidden="true" />
                Cast The Spells • Claim The Band
              </span>

              <h2 className={styles.quoteHeading}>Begin Your Quest</h2>

              <p className={styles.quoteBody}>
                &ldquo;The secret of getting ahead is getting started. Master the art of IELTS with proven academic spells.&rdquo;
              </p>

              <button
                type="button"
                className={styles.toggleBtn}
                onClick={switchToSignUp}
                id="register"
              >
                Sign Up Now
              </button>

              <div className={styles.sideFeaturePill}>
                <CheckCircle size={14} weight="fill" className="text-[#f5c94c]" aria-hidden="true" />
                <span>Evidence-based Progress • Precision Band Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footerText}>
        <span>Cần hỗ trợ? </span>
        <a href="mailto:support@theieltssspells.vn" className={styles.supportLink}>
          Liên hệ trung tâm
        </a>
      </footer>
    </main>
  );
}
