"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingSection, SaveReadingResponseItem, StudentReadingAttempt } from "@ielts/contracts";
import {
  ArrowLeft, CaretDown, CaretUp, CheckCircle, CircleNotch, Clock, Eye, EyeSlash,
  FastForward, FileAudio, Flag, Headphones, Pause, Play, Rewind, Sparkle,
  SpeakerHigh, SpeakerLow, SpeakerSlash,
  Sun, Moon, Timer, WarningCircle, PaperPlaneTilt,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingQuestionGroup } from "@/features/reading/ReadingQuestionGroup";
import { ReadingStatePanel } from "@/features/reading/ReadingStatePanel";
import { allReadingQuestions, formatDuration, isAnswered, requestMessage } from "@/features/reading/readingFormat";
import {
  isReadingFontScale,
  migrateLegacyReadingFontScale,
  READING_FONT_SCALE_OPTIONS,
  READING_FONT_SCALE_STORAGE_KEY,
  type ReadingFontScale,
} from "@/features/reading/readingFontScale";
import { pauseReadingAttempt, resumeReadingAttempt, saveReadingResponses, submitReadingAttempt } from "@/features/reading/readingApi";
import styles from "./ListeningAttemptPlayer.module.css";

type SaveState = "idle" | "saving" | "saved" | "failed";
type ColorTheme = "standard" | "eye-care" | "dark";

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function parseTimestamp(ts?: string): number {
  if (!ts) return 0;
  const match = ts.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (match) {
    return Number(match[1]) * 60 + Number(match[2]);
  }
  const numeric = Number(ts);
  return Number.isFinite(numeric) ? numeric : 0;
}

function RotateLeft5Icon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 1 2.34 5.66" />
      <polyline points="4 6 4 12 10 12" />
      <text x="12" y="15.2" fontSize="8" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="system-ui, -apple-system, sans-serif">5</text>
    </svg>
  );
}

function RotateRight5Icon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 0-2.34 5.66" />
      <polyline points="20 6 20 12 14 12" />
      <text x="12" y="15.2" fontSize="8" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="system-ui, -apple-system, sans-serif">5</text>
    </svg>
  );
}

export function ListeningAttemptPlayer({ attemptId }: { attemptId: string }) {
  return (
    <StudentSessionGate>
      <ListeningAttemptContent attemptId={attemptId} />
    </StudentSessionGate>
  );
}

function ListeningAttemptContent({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>({});
  const [activeSectionKey, setActiveSectionKey] = useState("");
  const [activeQuestionKey, setActiveQuestionKey] = useState("");
  const [flaggedKeys, setFlaggedKeys] = useState<Set<string>>(new Set());
  const [fontScale, setFontScale] = useState<ReadingFontScale>("standard");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("standard");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedText, setLastSavedText] = useState("");

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [hideTimer, setHideTimer] = useState(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(0.8);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Appearance settings
  useEffect(() => {
    try {
      const savedScale = localStorage.getItem(READING_FONT_SCALE_STORAGE_KEY);
      if (isReadingFontScale(savedScale)) {
        setFontScale(savedScale);
      } else {
        const legacyScale = localStorage.getItem("ielts_exam_font_scale");
        const migrated = migrateLegacyReadingFontScale(legacyScale);
        setFontScale(migrated);
        localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, migrated);
      }
      const savedTheme = localStorage.getItem("ielts_exam_color_theme") as ColorTheme | null;
      if (savedTheme === "standard" || savedTheme === "eye-care" || savedTheme === "dark") {
        setColorTheme(savedTheme);
      }
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const changeTheme = (next: ColorTheme) => {
    setColorTheme(next);
    try {
      localStorage.setItem("ielts_exam_color_theme", next);
    } catch {}
  };

  const changeFontScale = (next: ReadingFontScale) => {
    setFontScale(next);
    try {
      localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, next);
    } catch {}
  };

  // Load Attempt
  const loadAttempt = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await resumeReadingAttempt(attemptId, "listening");
      setAttempt(res);

      if (res.sections.length > 0) {
        setActiveSectionKey((prev) => prev || res.sections[0].key);
      }

      // Initialize answers from saved responses
      const initialAnswers: Record<string, ReadingAnswer> = {};
      if (Array.isArray(res.responses)) {
        for (const item of res.responses) {
          if (item && item.questionKey) {
            initialAnswers[item.questionKey] = item.answer;
          }
        }
      }
      setAnswers(initialAnswers);

      setSecondsRemaining(res.remainingSeconds);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  useEffect(() => {
    const syncVisibility = () => {
      if (document.visibilityState === "hidden") {
        setTimerRunning(false);
        void pauseReadingAttempt(attemptId, "listening");
        return;
      }
      void resumeReadingAttempt(attemptId, "listening").then((value) => {
        setAttempt(value);
        setSecondsRemaining(value.remainingSeconds);
        setTimerRunning(true);
      }).catch(() => setTimerRunning(false));
    };
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      void pauseReadingAttempt(attemptId, "listening");
    };
  }, [attemptId]);

  // Active section
  const activeSection = useMemo(() => {
    if (!attempt?.sections.length) return null;
    return attempt.sections.find((sec) => sec.key === activeSectionKey) ?? attempt.sections[0];
  }, [attempt, activeSectionKey]);

  // Audio object URL management
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioError("");
    setAudioDuration(0);

    const url = activeSection?.audioUrl;
    if (!url) {
      setAudioObjectUrl("");
      return undefined;
    }

    let disposed = false;
    let objectUrl = "";
    setAudioLoading(true);

    void apiMediaUrl(url)
      .then((resolvedUrl) => {
        if (!disposed) {
          objectUrl = resolvedUrl;
          setAudioObjectUrl(objectUrl);
        }
      })
      .catch((reason) => {
        if (!disposed) {
          setAudioError(reason instanceof Error ? reason.message : "Không thể tải file audio.");
        }
      })
      .finally(() => {
        if (!disposed) setAudioLoading(false);
      });

    return () => {
      disposed = true;
      if (objectUrl) revokeMediaUrl(objectUrl);
    };
  }, [activeSection?.audioUrl, activeSection?.key]);

  // Playback speed sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Audio seek helper
  const seekTo = useCallback((seconds: number) => {
    const player = audioRef.current;
    if (!player) return;
    const target = Math.max(0, Math.min(seconds, player.duration || seconds));
    player.currentTime = target;
    setCurrentTime(target);
  }, []);

  const togglePlay = useCallback(() => {
    const player = audioRef.current;
    if (!player) return;
    if (player.paused) {
      void player.play();
    } else {
      player.pause();
    }
  }, []);

  const changeVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    if (clamped > 0) {
      setIsMuted(false);
      prevVolumeRef.current = clamped;
    } else {
      setIsMuted(true);
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      const restore = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.8;
      setIsMuted(false);
      setVolume(restore);
      if (audioRef.current) {
        audioRef.current.volume = restore;
        audioRef.current.muted = false;
      }
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.muted = true;
      }
    }
  }, [isMuted, volume]);

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 0.8];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const next = speeds[nextIdx];
    setPlaybackSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }, [playbackSpeed]);

  const jumpToTimestamp = useCallback((timestamp: string) => {
    const secs = parseTimestamp(timestamp);
    seekTo(secs);
    const player = audioRef.current;
    if (player && player.paused) {
      void player.play();
    }
  }, [seekTo]);

  // All questions flattened
  const allQuestions = useMemo(() => {
    if (!attempt?.sections) return [];
    return allReadingQuestions(attempt.sections).map((item) => item.question);
  }, [attempt]);

  // Question navigation helper
  const selectQuestion = useCallback((q: ReadingQuestion) => {
    setActiveQuestionKey(q.key);
    // Find which section this question belongs to
    if (attempt?.sections) {
      for (const section of attempt.sections) {
        for (const group of section.questionGroups) {
          if (group.questions.some((item) => item.key === q.key)) {
            setActiveSectionKey(section.key);
            break;
          }
        }
      }
    }
    window.setTimeout(() => {
      const el = document.getElementById(`reading-question-${q.key}`) || document.getElementById(`question-card-${q.key}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  }, [attempt]);

  // Autosave answers
  const dirtyAnswersRef = useRef<Record<string, ReadingAnswer>>({});
  const clientRevisionRef = useRef(1);

  const handleAnswer = useCallback((questionKey: string, answer: ReadingAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: answer }));
    dirtyAnswersRef.current[questionKey] = answer;
    setSaveState("saving");
  }, []);

  const handleToggleFlag = useCallback((questionKey: string) => {
    setFlaggedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(questionKey)) next.delete(questionKey);
      else next.add(questionKey);
      return next;
    });
  }, []);

  // Flush save
  const flushSave = useCallback(async () => {
    const dirty = dirtyAnswersRef.current;
    const keys = Object.keys(dirty);
    if (!keys.length) return;

    dirtyAnswersRef.current = {};
    const items: SaveReadingResponseItem[] = keys.map((key) => ({
      questionKey: key,
      answer: dirty[key],
      clientRevision: clientRevisionRef.current++,
    }));

    try {
      await saveReadingResponses(attemptId, { responses: items }, "listening");
      setSaveState("saved");
      setLastSavedText(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setSaveState("failed");
      // Re-queue failed items
      for (const key of keys) {
        dirtyAnswersRef.current[key] = dirty[key];
      }
    }
  }, [attemptId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void flushSave();
    }, 2500);
    return () => clearInterval(interval);
  }, [flushSave]);

  // Countdown timer
  useEffect(() => {
    if (!timerRunning || secondsRemaining == null || secondsRemaining <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, timerRunning]);

  // Submit attempt
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await flushSave();
      await submitReadingAttempt(attemptId, "listening");
      router.push(`/student/listening/attempts/${attemptId}/result`);
    } catch (err) {
      setSubmitError(requestMessage(err));
      setSubmitting(false);
    }
  }, [attemptId, flushSave, router]);

  // Statistics for submission
  const stats = useMemo(() => {
    let answered = 0;
    for (const q of allQuestions) {
      if (isAnswered(answers[q.key])) answered++;
    }
    return {
      total: allQuestions.length,
      answered,
      unanswered: allQuestions.length - answered,
    };
  }, [allQuestions, answers]);

  if (loading) {
    return (
      <main className={styles.examShell}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.skillBadge}><Headphones size={14} weight="fill" /> IELTS Listening</span>
          </div>
        </header>
        <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
          <ReadingStatePanel title="Đang tải bài thi Listening..." message="Vui lòng chờ trong giây lát." tone="neutral" />
        </div>
      </main>
    );
  }

  if (error || !attempt) {
    return (
      <main className={styles.examShell}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/student/practice?skill=LISTENING" className={styles.backBtn}><ArrowLeft size={16} /></Link>
            <span className={styles.skillBadge}><Headphones size={14} weight="fill" /> IELTS Listening</span>
          </div>
        </header>
        <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
          <ReadingStatePanel
            title="Không thể tải bài thi"
            message={error || "Không tìm thấy dữ liệu bài thi."}
            actionLabel="Thử lại"
            onAction={() => void loadAttempt()}
            tone="error"
          />
        </div>
      </main>
    );
  }

  const themeClass = colorTheme === "dark" ? styles.themeDark : colorTheme === "eye-care" ? styles.themeEyeCare : styles.themeStandard;
  const fontClass = fontScale === "extra-large" ? styles.fontExtraLarge : fontScale === "large" ? styles.fontLarge : styles.fontStandard;
  const activeFontScale = READING_FONT_SCALE_OPTIONS.find((option) => option.value === fontScale) ?? READING_FONT_SCALE_OPTIONS[0];
  const examStyle = {
    "--exam-content-size": `${activeFontScale.pixels}px`,
    "--exam-content-line-height": activeFontScale.lineHeight,
  } as CSSProperties;

  const currentDuration = audioDuration || (activeSection?.audioDurationSeconds ?? 0);
  const seekPercent = currentDuration > 0 ? Math.min(100, Math.max(0, (currentTime / currentDuration) * 100)) : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  return (
    <div className={`${styles.examShell} ${themeClass} ${fontClass}`} style={examStyle}>
      {/* Hidden HTML5 Audio Element */}
      {audioObjectUrl ? (
        <audio
          ref={audioRef}
          src={audioObjectUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setAudioDuration(d);
            e.currentTarget.volume = isMuted ? 0 : volume;
            e.currentTarget.muted = isMuted || volume === 0;
            e.currentTarget.playbackRate = playbackSpeed;
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : null}

      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/student/practice?skill=LISTENING" className={styles.backBtn} title="Quay về danh mục">
            <ArrowLeft size={16} />
          </Link>
          <span className={styles.skillBadge}><Headphones size={14} weight="fill" /> IELTS Listening</span>
          <h1 className={styles.testTitle}>{attempt.title}</h1>
        </div>

        <div className={styles.headerCenter}>
          {secondsRemaining != null ? (
            <div className={`${styles.timer} ${secondsRemaining < 300 ? styles.timerWarning : ""}`}>
              <Clock size={16} />
              <span>{hideTimer ? "--:--" : formatDuration(secondsRemaining)}</span>
              <button
                type="button"
                onClick={() => setHideTimer((prev) => !prev)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                title={hideTimer ? "Hiện đồng hồ" : "Ẩn đồng hồ"}
              >
                {hideTimer ? <EyeSlash size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.appearanceGroup}>
            <div className={styles.fontControls} role="group" aria-label="Cỡ chữ nội dung bài thi">
              {READING_FONT_SCALE_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => changeFontScale(option.value)} aria-pressed={fontScale === option.value} aria-label={`Cỡ chữ ${option.label}, ${option.pixels} pixel`} title={`${option.label}: ${option.pixels} px`}>
                  {option.glyph}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => changeTheme(colorTheme === "dark" ? "standard" : colorTheme === "eye-care" ? "dark" : "eye-care")}
              className={styles.iconBtn}
              title="Đổi giao diện màu"
            >
              {colorTheme === "dark" ? <Moon size={16} weight="fill" /> : colorTheme === "eye-care" ? <Sun size={16} weight="duotone" /> : <Sun size={16} />}
            </button>
          </div>

          <span className={styles.saveIndicator}>
            {saveState === "saving" ? <CircleNotch size={14} className="animate-spin" /> : saveState === "saved" ? <CheckCircle size={14} color="#10b981" /> : null}
            {saveState === "saving" ? "Đang lưu..." : saveState === "saved" ? `Đã lưu ${lastSavedText}` : ""}
          </span>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className={styles.submitBtn}
          >
            <PaperPlaneTilt size={16} weight="fill" /> Nộp bài
          </button>
        </div>
      </header>

      {/* Part Navigation Tabs */}
      <nav className={styles.partTabsBar} aria-label="Danh sách phần nghe">
        {attempt.sections.map((section, idx) => {
          const active = section.key === activeSection?.key;
          const sectionQuestions = section.questionGroups.flatMap((g) => g.questions);
          const answeredCount = sectionQuestions.filter((q) => isAnswered(answers[q.key])).length;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSectionKey(section.key)}
              className={`${styles.partTab} ${active ? styles.partTabActive : ""}`}
            >
              <span>{section.title || `Part ${idx + 1}`}</span>
              <span className={styles.partTabBadge}>{answeredCount}/{sectionQuestions.length}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Workspace: Split Left (Audio & Transcript) and Right (Questions) */}
      <main className={styles.workspace}>
        {/* Left Panel: Audio Player & Transcript */}
        <section className={styles.leftPanel}>
          {/* Audio Card */}
          <div className={styles.audioCard}>
            <div className={styles.audioHeader}>
              <div className={styles.audioIcon}><Headphones size={22} weight="fill" /></div>
              <div className={styles.audioInfo}>
                <h2 className={styles.audioPartTitle}>{activeSection?.title ?? "Audio bài nghe"}</h2>
                <p className={styles.audioFilename}>
                  {audioLoading ? "Đang tải audio..." : activeSection?.audioFilename || "File ghi âm IELTS Listening"}
                </p>
              </div>
            </div>

            {audioError ? (
              <p role="alert" style={{ color: "#dc2626", fontSize: 12, margin: "8px 0" }}>
                <WarningCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                {audioError}
              </p>
            ) : null}

            {/* Seek Bar */}
            <div className={styles.audioBar}>
              <input
                type="range"
                min={0}
                max={Math.max(1, currentDuration)}
                step={0.1}
                value={Math.min(currentTime, currentDuration || currentTime)}
                onChange={(e) => seekTo(Number(e.target.value))}
                disabled={!audioObjectUrl}
                aria-label="Vị trí phát audio"
                className={styles.rangeInput}
                style={{ "--seek-percent": `${seekPercent}%` } as React.CSSProperties}
              />
              <div className={styles.timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(currentDuration)}</span>
              </div>
            </div>

            {/* Controls: Left (Volume) - Center (Rewind 5s / Play / Forward 5s) - Right (Speed Pill) */}
            <div className={styles.audioControls}>
              {/* Left: Volume control */}
              <div className={styles.volumeGroup}>
                <button
                  type="button"
                  className={styles.volumeBtn}
                  onClick={toggleMute}
                  title={isMuted || volume === 0 ? "Bật âm thanh" : "Tắt âm thanh"}
                  aria-label="Điều chỉnh âm lượng"
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerSlash size={18} weight="bold" />
                  ) : volume < 0.4 ? (
                    <SpeakerLow size={18} weight="bold" />
                  ) : (
                    <SpeakerHigh size={18} weight="bold" />
                  )}
                </button>

                <div className={styles.volumeTrackWrapper} title={`Âm lượng: ${Math.round(volumePercent)}%`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    className={styles.volumeInput}
                    style={{ "--volume-percent": `${volumePercent}%` } as React.CSSProperties}
                    aria-label="Thanh âm lượng"
                  />
                </div>
              </div>

              {/* Center: Playback group */}
              <div className={styles.playbackGroup}>
                <button
                  type="button"
                  disabled={!audioObjectUrl}
                  onClick={() => seekTo(currentTime - 5)}
                  aria-label="Lùi 5 giây"
                  className={styles.seekBtn}
                  title="Lùi 5 giây"
                >
                  <RotateLeft5Icon size={20} />
                </button>
                <button
                  type="button"
                  disabled={!audioObjectUrl}
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Tạm dừng" : "Phát audio"}
                  className={styles.playBtn}
                  title={isPlaying ? "Tạm dừng" : "Phát"}
                >
                  {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                </button>
                <button
                  type="button"
                  disabled={!audioObjectUrl}
                  onClick={() => seekTo(currentTime + 5)}
                  aria-label="Tiến 5 giây"
                  className={styles.seekBtn}
                  title="Tiến 5 giây"
                >
                  <RotateRight5Icon size={20} />
                </button>
              </div>

              {/* Right: Speed Pill */}
              <div className={styles.speedGroup}>
                <button
                  type="button"
                  className={styles.speedPillBtn}
                  onClick={cycleSpeed}
                  title="Nhấn để đổi tốc độ phát"
                  aria-label={`Tốc độ phát ${playbackSpeed}x`}
                >
                  <Timer size={14} weight="bold" />
                  <span>{playbackSpeed}x</span>
                </button>
              </div>
            </div>

            <div className={styles.audioNotice}>
              💡 <strong>Lưu ý:</strong> Trong kỳ thi IELTS thật, bạn chỉ được nghe 1 lần. Khi tự luyện, bạn có thể nghe lại và tùy chỉnh tốc độ phù hợp.
            </div>
          </div>

          {/* Collapsible Transcript */}
          {activeSection?.contentHtml ? (
            <div className={styles.transcriptCard}>
              <button
                type="button"
                onClick={() => setTranscriptOpen((prev) => !prev)}
                className={styles.transcriptToggle}
              >
                <span>{transcriptOpen ? "Ẩn Transcript (Lời thoại)" : "Xem Transcript (Lời thoại)"}</span>
                {transcriptOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </button>
              {transcriptOpen ? (
                <div
                  className={styles.transcriptContent}
                  dangerouslySetInnerHTML={{ __html: activeSection.contentHtml }}
                />
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Right Panel: Questions */}
        <section className={styles.rightPanel}>
          <div className={styles.questionsContainer}>
            {activeSection?.questionGroups.map((group) => (
              <div key={group.key} className={styles.groupWrapper}>
                {group.answerConfig && typeof group.answerConfig.linkedAudioTimestamp === "string" && group.answerConfig.linkedAudioTimestamp ? (
                  <div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => jumpToTimestamp(String(group.answerConfig.linkedAudioTimestamp))}
                      className={styles.jumpTimestampBtn}
                    >
                      <Play size={12} weight="fill" />
                      <span>[{String(group.answerConfig.linkedAudioTimestamp)}] Nghe đoạn này</span>
                    </button>
                  </div>
                ) : null}
                <ReadingQuestionGroup
                  group={group}
                  answers={answers}
                  onAnswer={handleAnswer}
                  activeQuestionKey={activeQuestionKey}
                  flaggedKeys={flaggedKeys}
                  onQuestionFocus={setActiveQuestionKey}
                  onToggleFlag={handleToggleFlag}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar: Sticky Exam Card (Study4 style) */}
        <aside className={styles.examSidebar} aria-label="Bảng điều khiển bài thi">
          <div className={styles.sidebarCard}>
            {/* 1. Timer */}
            <div className={styles.sidebarTimerBlock}>
              <span className={styles.sidebarTimerLabel}>Thời gian làm bài:</span>
              <span className={`${styles.sidebarTimerValue} ${secondsRemaining !== null && secondsRemaining <= 300 ? styles.timerWarning : ""}`}>
                <Clock size={18} weight="bold" />
                {secondsRemaining !== null ? formatTime(secondsRemaining) : "00:00"}
              </span>
            </div>

            {/* 2. Prominent Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className={styles.sidebarSubmitBtn}
            >
              <PaperPlaneTilt size={16} weight="fill" />
              NỘP BÀI
            </button>

            {/* 3. Autosave info & Hint */}
            <div className={styles.sidebarMeta}>
              <div className={styles.sidebarSaveRow}>
                {saveState === "saving" ? (
                  <CircleNotch size={14} className="animate-spin text-blue-500" />
                ) : (
                  <CheckCircle size={14} weight="fill" color="#10b981" />
                )}
                <span>
                  {saveState === "saving"
                    ? "Đang lưu bài làm..."
                    : saveState === "saved"
                    ? `Đã lưu ${lastSavedText || "tự động"}`
                    : "Tự động lưu bài làm"}
                </span>
              </div>
              <p className={styles.sidebarHint}>
                <em>Chú ý: bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu review</em>
              </p>
            </div>

            {/* 4. Section & 5-Column Question Grid */}
            <div className={styles.sidebarSectionsList}>
              {attempt.sections.map((section, idx) => {
                const sectionQuestions = section.questionGroups.flatMap((g) => g.questions);
                const isCurrentSec = section.key === activeSection?.key;
                const answeredCount = sectionQuestions.filter((q) => isAnswered(answers[q.key])).length;

                return (
                  <div key={section.key} className={styles.sidebarPartSection}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionKey(section.key);
                        const firstQ = sectionQuestions[0];
                        if (firstQ) {
                          selectQuestion(firstQ);
                        }
                      }}
                      className={`${styles.sidebarPartHeading} ${isCurrentSec ? styles.sidebarPartHeadingActive : ""}`}
                    >
                      <span className={styles.sidebarPartName}>{section.title || `Part ${idx + 1}`}</span>
                      <span className={styles.sidebarPartBadge}>
                        {answeredCount}/{sectionQuestions.length}
                      </span>
                    </button>

                    <div className={styles.paletteGrid} role="navigation" aria-label={`Bảng câu hỏi ${section.title || `Part ${idx + 1}`}`}>
                      {sectionQuestions.map((q) => {
                        const answered = isAnswered(answers[q.key]);
                        const active = q.key === activeQuestionKey;
                        const flagged = flaggedKeys.has(q.key);

                        return (
                          <button
                            key={q.key}
                            type="button"
                            onClick={() => selectQuestion(q)}
                            className={`${styles.paletteSquare} ${
                              answered ? styles.paletteSquareAnswered : ""
                            } ${active ? styles.paletteSquareActive : ""} ${
                              flagged ? styles.paletteSquareFlagged : ""
                            }`}
                            title={`Câu ${q.number}${flagged ? " (Đã đánh dấu review)" : answered ? " (Đã làm)" : " (Chưa làm)"}`}
                          >
                            <span className={styles.paletteSquareNumber}>{q.number}</span>
                            {flagged ? (
                              <Flag size={8} weight="fill" className={styles.paletteSquareFlag} />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Footer Navigation */}
      <footer className={styles.footer}>
        <div className={styles.questionNav} aria-label="Danh sách câu hỏi">
          {allQuestions.map((q) => {
            const answered = isAnswered(answers[q.key]);
            const active = q.key === activeQuestionKey;
            const flagged = flaggedKeys.has(q.key);
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => selectQuestion(q)}
                className={`${styles.qBtn} ${answered ? styles.qBtnAnswered : ""} ${active ? styles.qBtnActive : ""} ${flagged ? styles.qBtnFlagged : ""}`}
                title={`Câu ${q.number}${flagged ? " (Đã đánh dấu)" : ""}`}
              >
                {q.number}
              </button>
            );
          })}
        </div>
      </footer>

      {/* Confirmation Submit Modal */}
      {showSubmitModal ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title" className={styles.modalTitle}>Xác nhận nộp bài</h2>
            <p className={styles.modalMessage}>
              Bạn có chắc chắn muốn nộp bài Listening này không? Sau khi nộp bài, hệ thống sẽ chấm điểm và phân tích chi tiết.
            </p>

            <div className={styles.modalStats}>
              <div className={styles.statBox}>
                <span className={styles.statNumber} style={{ color: "#10b981" }}>{stats.answered}</span>
                <span className={styles.statLabel}>Đã trả lời</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber} style={{ color: "#f59e0b" }}>{stats.unanswered}</span>
                <span className={styles.statLabel}>Chưa trả lời</span>
              </div>
            </div>

            {submitError ? (
              <p role="alert" style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                {submitError}
              </p>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className={styles.modalCancelBtn}
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={styles.modalConfirmBtn}
              >
                {submitting ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} weight="fill" />}
                {submitting ? "Đang nộp..." : "Nộp bài ngay"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
