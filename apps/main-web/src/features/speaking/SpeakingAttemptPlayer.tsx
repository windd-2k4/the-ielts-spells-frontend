"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  FloppyDisk,
  Lightbulb,
  Microphone,
  Pause,
  Play,
  ArrowCounterClockwise,
  Sparkle,
  SpeakerHigh,
  SpinnerGap,
  Stop,
  Translate,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type {
  SpeakingEvaluationResult,
  SpeakingPart,
  SpeakingQuestion,
  StudentSpeakingAttempt,
} from "@ielts/contracts";
import {
  evaluateSpeakingQuestion,
  getSpeakingAttempt,
  saveSpeakingResponses,
  submitSpeakingAttempt,
} from "./speakingApi";
import { SpeakingBuilderPanel } from "./SpeakingBuilderPanel";
import { SpeakingVocabPanel } from "./SpeakingVocabPanel";
import styles from "./SpeakingAttemptPlayer.module.css";

interface SpeakingAttemptPlayerProps {
  attemptId: string;
}

type RecordState = "IDLE" | "RECORDING" | "RECORDED";

export function SpeakingAttemptPlayer({ attemptId }: SpeakingAttemptPlayerProps) {
  const router = useRouter();

  // Test Attempt data
  const [attempt, setAttempt] = useState<StudentSpeakingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [savingSpeech, setSavingSpeech] = useState(false);

  // Active question navigation
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Sidebar Tab
  const [sidebarTab, setSidebarTab] = useState<"BUILDER" | "VOCAB">("BUILDER");

  // Speaking Builder Choices per question: questionKey -> { stepId -> optionId }
  const [hintChoicesMap, setHintChoicesMap] = useState<Record<string, Record<string, string>>>({});

  // Question Responses: questionKey -> { audioUrl, transcript, blob }
  const [recordedAudios, setRecordedAudios] = useState<Record<string, { url: string; blob?: Blob }>>({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, SpeakingEvaluationResult>>({});

  // Recording hardware state
  const [recordState, setRecordState] = useState<RecordState>("IDLE");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Web Audio Waveform visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(24).fill(8));

  // Audio Playback state for student recording
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Question Audio voice state
  const [isPlayingQuestionAudio, setIsPlayingQuestionAudio] = useState(false);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Overall Attempt Countdown timer
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Load Attempt
  useEffect(() => {
    let active = true;
    void getSpeakingAttempt(attemptId)
      .then((data) => {
        if (!active) return;
        setAttempt(data);
        setRemainingTime(data.remainingSeconds);

        // Prepopulate saved responses
        const audios: Record<string, { url: string }> = {};
        const texts: Record<string, string> = {};
        const choices: Record<string, Record<string, string>> = {};

        data.responses.forEach((res) => {
          if (res.audioUrl) audios[res.questionKey] = { url: res.audioUrl };
          if (res.transcript) texts[res.questionKey] = res.transcript;
          if (res.hintChoices) choices[res.questionKey] = res.hintChoices;
        });

        setRecordedAudios(audios);
        setTranscripts(texts);
        setHintChoicesMap(choices);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải đề Speaking");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  // Overall timer tick
  useEffect(() => {
    if (loading || !attempt || attempt.status !== "IN_PROGRESS" || remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt, loading, remainingTime]);

  // Active Part & Question
  const activePart: SpeakingPart | undefined = attempt?.parts[activePartIndex];
  const questions: SpeakingQuestion[] = useMemo(() => activePart?.questions ?? [], [activePart]);
  const activeQuestion: SpeakingQuestion | undefined = questions[activeQuestionIndex];
  const currentKey = activeQuestion?.questionKey ?? "";

  // Update record state based on current question having recorded audio
  useEffect(() => {
    if (recordedAudios[currentKey]?.url) {
      setRecordState("RECORDED");
    } else {
      setRecordState("IDLE");
    }
    // Stop any ongoing playback
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingRecording(false);
    }
  }, [currentKey, recordedAudios]);

  // Handle Play Question Audio
  const playQuestionAudio = useCallback(() => {
    if (isPlayingQuestionAudio) {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingQuestionAudio(false);
      return;
    }

    const audioUrl = activeQuestion?.audioUrl || activePart?.audioUrl;
    if (audioUrl && audioUrl.trim()) {
      const audio = new Audio(audioUrl);
      questionAudioRef.current = audio;
      setIsPlayingQuestionAudio(true);
      audio.onended = () => setIsPlayingQuestionAudio(false);
      audio.onerror = () => setIsPlayingQuestionAudio(false);
      audio.play().catch(() => setIsPlayingQuestionAudio(false));
    } else if (activeQuestion?.promptText && typeof window !== "undefined" && "speechSynthesis" in window) {
      // Natural TTS fallback for English prompt
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeQuestion.promptText);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingQuestionAudio(false);
      utterance.onerror = () => setIsPlayingQuestionAudio(false);
      setIsPlayingQuestionAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [activePart?.audioUrl, activeQuestion?.audioUrl, activeQuestion?.promptText, isPlayingQuestionAudio]);

  // Stop recording hardware & timers
  const cleanupRecordingHardware = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // START RECORDING
  async function handleStartRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Web Audio API Visualizer Setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Animation loop for audio visualizer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from(dataArray.slice(0, 24)).map((val) =>
          Math.max(8, Math.min(60, Math.round((val / 255) * 60)))
        );
        setWaveformBars(bars);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      // Realtime Speech-to-Text Recognition setup
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let currentTranscript = transcripts[currentKey] || "";
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentTranscript += " " + event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscripts((prev) => ({
            ...prev,
            [currentKey]: (currentTranscript + " " + interim).trim(),
          }));
        };
        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {}
      }

      // MediaRecorder setup
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordedAudios((prev) => ({
          ...prev,
          [currentKey]: { url: audioUrl, blob: audioBlob },
        }));
        setRecordState("RECORDED");
        cleanupRecordingHardware();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecordState("RECORDING");
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Không thể truy cập microphone. Vui lòng cho phép trình duyệt truy cập mic để ghi âm!");
    }
  }

  // STOP RECORDING
  function handleStopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  // CANCEL RECORDING
  function handleCancelRecording() {
    cleanupRecordingHardware();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Delete recorded audio for current question
    setRecordedAudios((prev) => {
      const next = { ...prev };
      delete next[currentKey];
      return next;
    });
    setRecordState("IDLE");
    setRecordingSeconds(0);
  }

  // PLAY / PAUSE STUDENT AUDIO
  function toggleStudentAudioPlayback() {
    const audioData = recordedAudios[currentKey];
    if (!audioData?.url) return;

    if (isPlayingRecording && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingRecording(false);
      return;
    }

    const audio = playbackAudioRef.current ?? new Audio(audioData.url);
    if (!playbackAudioRef.current) {
      playbackAudioRef.current = audio;
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlaybackProgress(audio.currentTime);
          setPlaybackDuration(audio.duration);
        }
      };
      audio.onended = () => {
        setIsPlayingRecording(false);
        setPlaybackProgress(0);
      };
    } else {
      audio.src = audioData.url;
    }

    setIsPlayingRecording(true);
    void audio.play().catch(() => setIsPlayingRecording(false));
  }

  // RE-RECORD
  function handleReRecord() {
    if (isPlayingRecording && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingRecording(false);
    }
    setRecordState("IDLE");
    setRecordingSeconds(0);
  }

  // SAVE CURRENT SPEECH
  async function handleSaveCurrentSpeech() {
    if (!attempt || !currentKey || savingSpeech) return;
    setSavingSpeech(true);
    try {
      const audio = recordedAudios[currentKey]?.url;
      const text = transcripts[currentKey] || "";
      const choices = hintChoicesMap[currentKey] || {};

      await saveSpeakingResponses(attemptId, [
        {
          questionKey: currentKey,
          audioUrl: audio,
          transcript: text,
          hintChoices: choices,
          clientRevision: 1,
        },
      ]);
      alert("Đã lưu bài nói thành công! Bạn có thể xem lại hoặc tiếp tục làm câu khác.");
    } catch (err) {
      alert("Lỗi khi lưu bài nói: " + (err instanceof Error ? err.message : "Vui lòng thử lại"));
    } finally {
      setSavingSpeech(false);
    }
  }

  // AI EVALUATE CURRENT QUESTION
  async function handleAiEvaluate() {
    if (!attempt || !currentKey || evaluating) return;
    const text = transcripts[currentKey]?.trim();
    if (!text) {
      alert("Vui lòng ghi âm hoặc nhập bài nói trước khi chấm bài!");
      return;
    }

    setEvaluating(true);
    try {
      const result = await evaluateSpeakingQuestion(attemptId, {
        questionKey: currentKey,
        questionPrompt: activeQuestion?.promptText,
        audioUrl: recordedAudios[currentKey]?.url,
        transcript: text,
      });

      setEvaluations((prev) => ({
        ...prev,
        [currentKey]: result,
      }));
    } catch (err) {
      alert("Lỗi khi chấm bài bằng AI: " + (err instanceof Error ? err.message : "Vui lòng thử lại"));
    } finally {
      setEvaluating(false);
    }
  }

  // SUBMIT WHOLE ATTEMPT
  async function handleSubmitAttempt() {
    if (submitting || !attempt) return;
    if (!confirm("Bạn có chắc chắn muốn nộp bài thi Speaking này không?")) return;

    setSubmitting(true);
    try {
      await submitSpeakingAttempt(attemptId);
      router.push(`/student/speaking/attempts/${attemptId}/result`);
    } catch (err) {
      alert("Lỗi khi nộp bài: " + (err instanceof Error ? err.message : "Vui lòng thử lại"));
      setSubmitting(false);
    }
  }

  // FORMAT SECONDS TO MM:SS
  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F5F4]">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-[#6F676C]">
          <SpinnerGap size={32} className="animate-spin text-[#AD4C64]" />
          <span>Đang tải phòng luyện nói Speaking...</span>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-[#DED7DA] bg-white p-8 shadow-sm">
          <WarningCircle size={40} className="mx-auto text-[#B42335]" />
          <h1 className="mt-3 text-xl font-bold">Không thể mở bài luyện nói</h1>
          <p className="mt-2 text-sm text-[#6F676C]">{error || "Dữ liệu đề thi không khả dụng."}</p>
          <Link
            href="/student/practice"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-5 text-sm font-bold text-white hover:bg-[#894c5b] transition"
          >
            Quay lại kho luyện đề
          </Link>
        </div>
      </div>
    );
  }

  const evaluationResult = evaluations[currentKey];

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/student/practice" aria-label="Quay lại" className={styles.backButton}>
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.testMeta}>
            <h1 className={styles.testTitle}>{attempt.title}</h1>
            <p className={styles.testSubtitle}>
              Luyện đề IELTS Speaking • {activePart ? `Part ${activePart.partNo}` : ""} • Câu{" "}
              {activeQuestionIndex + 1}/{questions.length}
            </p>
          </div>
        </div>

        {/* Center Part Switcher */}
        <div className={styles.headerCenter}>
          {attempt.parts.map((part, pIdx) => (
            <button
              key={part.id}
              type="button"
              onClick={() => {
                setActivePartIndex(pIdx);
                setActiveQuestionIndex(0);
              }}
              className={`${styles.partNavPill} ${
                pIdx === activePartIndex ? styles.partNavPillActive : ""
              }`}
            >
              Part {part.partNo}
            </button>
          ))}
        </div>

        {/* Right Timer & Actions */}
        <div className={styles.headerRight}>
          <div className={styles.timerBadge}>
            <Clock size={16} />
            <span>{formatTime(remainingTime)}</span>
          </div>

          <button
            type="button"
            onClick={handleSubmitAttempt}
            disabled={submitting}
            className={styles.submitAttemptButton}
          >
            {submitting ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} weight="fill" />
            )}
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE: LEFT SPEAKING ARENA + RIGHT SMART SIDEBAR */}
      <main className={styles.workspace}>
        {/* LEFT SPEAKING ARENA */}
        <section className={styles.leftArena}>
          {/* Question Banner Card */}
          <div className={styles.questionCard}>
            <div className={styles.questionCardHeader}>
              <span className={styles.questionBadge}>
                Part {activePart?.partNo ?? 1} • Câu {activeQuestionIndex + 1}/{questions.length}
              </span>

              {/* Loa phát câu hỏi */}
              <button
                type="button"
                onClick={playQuestionAudio}
                className={styles.speakerButton}
                title="Nghe phát âm câu hỏi"
              >
                <SpeakerHigh
                  size={18}
                  className={isPlayingQuestionAudio ? "animate-pulse text-[#AD4C64]" : ""}
                />
                <span>{isPlayingQuestionAudio ? "Đang phát..." : "Nghe câu hỏi"}</span>
              </button>
            </div>

            <h2 className={styles.questionPrompt}>
              {activeQuestion?.promptText || activePart?.topicTitle || "Speaking Question"}
            </h2>

            {/* Cue Card Bullets (For Part 2) */}
            {activePart?.partNo === 2 && activePart.cueCardBullets && activePart.cueCardBullets.length > 0 && (
              <div className={styles.cueCardBox}>
                <div className={styles.cueCardPrompt}>You should say:</div>
                <ul className={styles.cueCardBullets}>
                  {activePart.cueCardBullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Central Speaking Interaction Card (3 States) */}
          <div className={styles.interactionCard}>
            {/* STATE 1: IDLE - Sẵn sàng ghi âm */}
            {recordState === "IDLE" && (
              <div className={styles.startRecordSection}>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className={styles.recordMicButton}
                >
                  <Microphone size={24} weight="fill" />
                  <span>Bắt đầu ghi âm</span>
                </button>
                <p className={styles.recordMicHint}>
                  Bấm nút trên để bắt đầu trả lời. Hệ thống sẽ ghi âm và tự động nhận diện bài nói của
                  bạn.
                </p>
              </div>
            )}

            {/* STATE 2: RECORDING - Đang ghi âm */}
            {recordState === "RECORDING" && (
              <div className={styles.recordingActiveSection}>
                <div className={styles.recordingTimerBox}>
                  <div className={styles.blinkingDot} />
                  <span>{formatTime(recordingSeconds)}</span>
                </div>

                {/* Waveform Animation */}
                <div className={styles.waveformContainer}>
                  {waveformBars.map((height, i) => (
                    <div
                      key={i}
                      className={styles.waveBar}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>

                {/* Cancel / Stop controls */}
                <div className={styles.recordingControls}>
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className={styles.cancelRecordButton}
                    title="Hủy để ghi âm lại từ đầu"
                  >
                    <X size={18} />
                    <span>Hủy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className={styles.stopRecordButton}
                  >
                    <Stop size={18} weight="fill" />
                    <span>Đã nói xong</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: RECORDED - Đã xong, nghe lại, lưu & chấm */}
            {recordState === "RECORDED" && (
              <div className={styles.recordedReviewSection}>
                {/* Transcript Box */}
                <div className={styles.transcriptContainer}>
                  <div className={styles.transcriptHeader}>
                    <span className={styles.transcriptTitle}>Bài nói của bạn (Transcript)</span>
                    <span className={styles.transcriptEditBadge}>Có thể chỉnh sửa nếu cần</span>
                  </div>
                  <textarea
                    value={transcripts[currentKey] || ""}
                    onChange={(e) =>
                      setTranscripts((prev) => ({ ...prev, [currentKey]: e.target.value }))
                    }
                    placeholder="Chưa có văn bản ghi âm. Bạn có thể tự gõ văn bản bài nói của mình tại đây..."
                    className={styles.transcriptTextarea}
                    rows={3}
                  />
                </div>

                {/* Audio Player Bar */}
                {recordedAudios[currentKey]?.url && (
                  <div className={styles.audioPlayerBar}>
                    <button
                      type="button"
                      onClick={toggleStudentAudioPlayback}
                      className={styles.audioPlayButton}
                      title={isPlayingRecording ? "Tạm dừng" : "Nghe lại"}
                    >
                      {isPlayingRecording ? (
                        <Pause size={18} weight="fill" />
                      ) : (
                        <Play size={18} weight="fill" className="ml-0.5" />
                      )}
                    </button>

                    <div className={styles.audioTimelineContainer}>
                      <input
                        type="range"
                        min={0}
                        max={playbackDuration || 1}
                        step={0.1}
                        value={playbackProgress}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPlaybackProgress(val);
                          if (playbackAudioRef.current) playbackAudioRef.current.currentTime = val;
                        }}
                        className={styles.audioTimelineSlider}
                      />
                      <div className={styles.audioTimeDisplay}>
                        <span>{formatTime(Math.floor(playbackProgress))}</span>
                        <span>{formatTime(Math.floor(playbackDuration))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Main Action Buttons: Nói lại, Lưu bài nói, Chấm bài */}
                <div className={styles.actionButtonsRow}>
                  <button
                    type="button"
                    onClick={handleReRecord}
                    className={styles.reRecordButton}
                  >
                    <ArrowCounterClockwise size={18} />
                    <span>Nói lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentSpeech}
                    disabled={savingSpeech}
                    className={styles.saveSpeechButton}
                  >
                    {savingSpeech ? (
                      <SpinnerGap size={18} className="animate-spin" />
                    ) : (
                      <FloppyDisk size={18} />
                    )}
                    <span>Lưu bài nói</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAiEvaluate}
                    disabled={evaluating}
                    className={styles.aiEvaluateButton}
                  >
                    {evaluating ? (
                      <SpinnerGap size={18} className="animate-spin" />
                    ) : (
                      <Sparkle size={18} weight="fill" />
                    )}
                    <span>{evaluating ? "AI đang chấm..." : "Chấm bài"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI EVALUATION RESULT CARD */}
          {evaluationResult && (
            <div className={styles.aiScoreCard}>
              <div className={styles.aiScoreCardHeader}>
                <div className={styles.aiScoreTitleGroup}>
                  <Sparkle size={20} weight="fill" className="text-[#AD4C64]" />
                  <div>
                    <h3 className="text-base font-bold text-[#292528] m-0">Kết quả đánh giá AI</h3>
                    <p className="text-xs text-[#6F676C] m-0">
                      Chấm điểm theo 4 tiêu chí chuẩn IELTS Speaking
                    </p>
                  </div>
                </div>

                <div className={styles.aiScoreOverallBandBadge}>
                  <span className={styles.overallBandNumber}>
                    {evaluationResult.overallBand?.toFixed(1) ?? "6.5"}
                  </span>
                  <span className={styles.overallBandLabel}>Overall Band</span>
                </div>
              </div>

              {/* 4 Criteria Grid */}
              <div className={styles.criteriaGrid}>
                <div className={styles.criterionBox}>
                  <div className={styles.criterionHeader}>
                    <span className={styles.criterionName}>Fluency &amp; Coherence</span>
                    <span className={styles.criterionBand}>
                      {evaluationResult.fluencyBand?.toFixed(1) ?? "6.5"}
                    </span>
                  </div>
                  <p className={styles.criterionFeedback}>
                    {evaluationResult.criteriaFeedback?.fluency_coherence ||
                      "Độ trôi chảy và mạch lạc tương đối tốt, duy trì được nhịp độ nói."}
                  </p>
                </div>

                <div className={styles.criterionBox}>
                  <div className={styles.criterionHeader}>
                    <span className={styles.criterionName}>Lexical Resource</span>
                    <span className={styles.criterionBand}>
                      {evaluationResult.lexicalBand?.toFixed(1) ?? "6.5"}
                    </span>
                  </div>
                  <p className={styles.criterionFeedback}>
                    {evaluationResult.criteriaFeedback?.lexical_resource ||
                      "Vốn từ phong phú, có sử dụng collocations tự nhiên."}
                  </p>
                </div>

                <div className={styles.criterionBox}>
                  <div className={styles.criterionHeader}>
                    <span className={styles.criterionName}>Grammar Accuracy</span>
                    <span className={styles.criterionBand}>
                      {evaluationResult.grammarBand?.toFixed(1) ?? "6.0"}
                    </span>
                  </div>
                  <p className={styles.criterionFeedback}>
                    {evaluationResult.criteriaFeedback?.grammatical_range_accuracy ||
                      "Cấu trúc câu đa dạng, nên chú ý thêm các thì phức hợp."}
                  </p>
                </div>

                <div className={styles.criterionBox}>
                  <div className={styles.criterionHeader}>
                    <span className={styles.criterionName}>Pronunciation</span>
                    <span className={styles.criterionBand}>
                      {evaluationResult.pronunciationBand?.toFixed(1) ?? "6.5"}
                    </span>
                  </div>
                  <p className={styles.criterionFeedback}>
                    {evaluationResult.criteriaFeedback?.pronunciation ||
                      "Phát âm dễ hiểu, ngữ điệu và trọng âm câu tương đối tự nhiên."}
                  </p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className={styles.strengthsImprovementsRow}>
                {evaluationResult.strengths?.length > 0 && (
                  <div className={styles.strengthsBox}>
                    <div className={styles.strengthsTitle}>✓ Điểm mạnh</div>
                    <ul className={styles.strengthsList}>
                      {evaluationResult.strengths.map((str, sIdx) => (
                        <li key={sIdx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluationResult.improvements?.length > 0 && (
                  <div className={styles.improvementsBox}>
                    <div className={styles.improvementsTitle}>⚡ Cần cải thiện</div>
                    <ul className={styles.improvementsList}>
                      {evaluationResult.improvements.map((imp, iIdx) => (
                        <li key={iIdx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Question Navigation Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#DED7DA] bg-white text-xs font-bold text-[#6F676C] disabled:opacity-40 hover:bg-[#F2ECEE] transition"
            >
              <CaretLeft size={16} /> Câu trước
            </button>

            <div className="flex items-center gap-1.5">
              {questions.map((_, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(qIdx)}
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition ${
                    qIdx === activeQuestionIndex
                      ? "bg-[#AD4C64] text-white"
                      : recordedAudios[questions[qIdx]?.questionKey]?.url
                      ? "bg-[#F7E5EA] text-[#AD4C64] border border-[#C85F78]"
                      : "bg-white border border-[#DED7DA] text-[#6F676C] hover:border-[#AD4C64]"
                  }`}
                >
                  {qIdx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={activeQuestionIndex === questions.length - 1}
              onClick={() => setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#DED7DA] bg-white text-xs font-bold text-[#6F676C] disabled:opacity-40 hover:bg-[#F2ECEE] transition"
            >
              Câu tiếp <CaretRight size={16} />
            </button>
          </div>
        </section>

        {/* RIGHT SMART SIDEBAR (2 Tabs: Gợi ý từng bước & Tra từ vựng AI) */}
        <aside className={styles.sidebar}>
          {/* Sidebar Tabs Switcher */}
          <div className={styles.sidebarTabsHeader}>
            <button
              type="button"
              onClick={() => setSidebarTab("BUILDER")}
              className={`${styles.sidebarTabButton} ${
                sidebarTab === "BUILDER" ? styles.sidebarTabActive : ""
              }`}
            >
              <Lightbulb size={18} />
              <span>Gợi ý từng bước</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab("VOCAB")}
              className={`${styles.sidebarTabButton} ${
                sidebarTab === "VOCAB" ? styles.sidebarTabActive : ""
              }`}
            >
              <Translate size={18} />
              <span>Tra từ vựng AI</span>
            </button>
          </div>

          {/* TAB 1: Gợi ý từng bước (Speaking Builder) */}
          {sidebarTab === "BUILDER" && (
            <SpeakingBuilderPanel
              steps={activeQuestion?.hintSteps || activePart?.hintSteps || []}
              selectedOptions={hintChoicesMap[currentKey] || {}}
              onSelectOption={(stepId, optionId, sentence) => {
                setHintChoicesMap((prev) => ({
                  ...prev,
                  [currentKey]: {
                    ...(prev[currentKey] || {}),
                    [stepId]: optionId,
                  },
                }));
              }}
              onReset={() => {
                setHintChoicesMap((prev) => {
                  const next = { ...prev };
                  delete next[currentKey];
                  return next;
                });
              }}
            />
          )}

          {/* TAB 2: Tra từ vựng 2 chiều bằng AI (AI Vocab Lookup) */}
          {sidebarTab === "VOCAB" && <SpeakingVocabPanel />}
        </aside>
      </main>
    </div>
  );
}
