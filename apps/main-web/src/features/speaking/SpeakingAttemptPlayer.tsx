"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Check,
  CheckCircle,
  Eye,
  Microphone,
  Note,
  Pause,
  Play,
  ShareNetwork,
  Sparkle,
  SpeakerHigh,
  SpeakerLow,
  SpeakerSimpleHigh,
  SpinnerGap,
  Stop,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type {
  SaveSpeakingResponseItem,
  SpeakingPart,
  SpeakingQuestion,
  StudentSpeakingAttempt,
} from "@ielts/contracts";
import {
  getSpeakingAttempt,
  saveSpeakingResponses,
  submitSpeakingAttempt,
} from "./speakingApi";
import styles from "./SpeakingAttemptPlayer.module.css";

interface SpeakingAttemptPlayerProps {
  attemptId: string;
}

type Stage =
  | "INTRO_GUIDE"
  | "INTRO_TEST_MIC"
  | "INTRO_RECORDING_MIC"
  | "INTRO_PLAYBACK_MIC"
  | "PART_COVER"
  | "PART2_THINKING"
  | "QUESTION_READING"
  | "QUESTION_RECORDING"
  | "SUMMARY";

export function SpeakingAttemptPlayer({ attemptId }: SpeakingAttemptPlayerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Test Attempt data
  const [attempt, setAttempt] = useState<StudentSpeakingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // General configuration options (Màn 1)
  const [alwaysShowQuestion, setAlwaysShowQuestion] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});

  // Active navigation
  const [stage, setStage] = useState<Stage>("INTRO_GUIDE");
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Persistent student notes (Part 2 & Part 3)
  const [notes, setNotes] = useState("");
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);

  // Recorded answers: questionKey -> { url, durationSeconds, blob }
  const [recordedAudios, setRecordedAudios] = useState<
    Record<string, { url: string; durationSeconds: number; blob?: Blob }>
  >({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  // Mic Test state (Intro Màn 2 & 3)
  const [micTestAudioUrl, setMicTestAudioUrl] = useState<string | null>(null);
  const [micTestSeconds, setMicTestSeconds] = useState(0);
  const [micTestDuration, setMicTestDuration] = useState(0);
  const [micTestCurrentTime, setMicTestCurrentTime] = useState(0);
  const [isPlayingMicTest, setIsPlayingMicTest] = useState(false);
  const [micTestSpeed, setMicTestSpeed] = useState<number>(1);
  const micAudioRef = useRef<HTMLAudioElement | null>(null);

  // Question reading audio & countdown
  const [readingProgress, setReadingProgress] = useState(0);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Question recording state & minimum time requirement
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Part 2 Thinking timer
  const [thinkingSecondsRemaining, setThinkingSecondsRemaining] = useState(60);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Waveform visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(24).fill(6));

  // Audio playback for recorded answers (Summary & Retake)
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const currentPlaybackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Retake / Re-record Modal states (Màn 15, 16, 17)
  const [retakeTargetKey, setRetakeTargetKey] = useState<string | null>(null);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  const [showRetakeWorkspace, setShowRetakeWorkspace] = useState(false);
  const [retakeRecordState, setRetakeRecordState] = useState<"IDLE" | "RECORDING" | "RECORDED">("IDLE");
  const [retakeAudioData, setRetakeAudioData] = useState<{ url: string; durationSeconds: number; blob?: Blob } | null>(null);
  const [retakeTranscript, setRetakeTranscript] = useState("");
  const [retakeTimeRemaining, setRetakeTimeRemaining] = useState(45);
  const [retakeSecondsPassed, setRetakeSecondsPassed] = useState(0);
  const [showRetakeLockTooltip, setShowRetakeLockTooltip] = useState(false);

  // Load Attempt from backend
  useEffect(() => {
    let active = true;
    void getSpeakingAttempt(attemptId)
      .then((data) => {
        if (!active) return;
        setAttempt(data);

        // Prepopulate responses
        const audios: Record<string, { url: string; durationSeconds: number }> = {};
        const texts: Record<string, string> = {};

        data.responses.forEach((res) => {
          if (res.audioUrl) {
            let playUrl = res.audioUrl;
            if (playUrl.startsWith("data:")) {
              try {
                const blob = dataUrlToBlob(playUrl);
                playUrl = URL.createObjectURL(blob);
              } catch (e) {
                console.warn("Failed to create object URL from data URL:", e);
              }
            }
            audios[res.questionKey] = { url: playUrl, durationSeconds: 10 };
          }
          if (res.transcript) {
            texts[res.questionKey] = res.transcript;
          }
        });

        setRecordedAudios(audios);
        setTranscripts(texts);
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

  // Active Part & Question
  const parts: SpeakingPart[] = useMemo(() => attempt?.parts ?? [], [attempt]);
  const activePart: SpeakingPart | undefined = parts[activePartIndex];
  const questions: SpeakingQuestion[] = useMemo(() => activePart?.questions ?? [], [activePart]);
  const activeQuestion: SpeakingQuestion | undefined = questions[activeQuestionIndex];
  const currentKey = activeQuestion?.questionKey ?? `${activePart?.id}-q${activeQuestionIndex + 1}`;

  // Calculate total questions across all parts
  const allQuestionItems = useMemo(() => {
    const list: Array<{ partIndex: number; questionIndex: number; part: SpeakingPart; question: SpeakingQuestion }> = [];
    parts.forEach((p, pIdx) => {
      p.questions.forEach((q, qIdx) => {
        list.push({ partIndex: pIdx, questionIndex: qIdx, part: p, question: q });
      });
    });
    return list;
  }, [parts]);

  const totalQuestionsCount = allQuestionItems.length;
  const completedCount = useMemo(() => {
    return allQuestionItems.filter((item) => !!recordedAudios[item.question.questionKey]?.url).length;
  }, [allQuestionItems, recordedAudios]);

  // Keep active index refs fresh to prevent stale closures during auto-advance
  const activePartIndexRef = useRef(activePartIndex);
  const activeQuestionIndexRef = useRef(activeQuestionIndex);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    activePartIndexRef.current = activePartIndex;
  }, [activePartIndex]);

  useEffect(() => {
    activeQuestionIndexRef.current = activeQuestionIndex;
  }, [activeQuestionIndex]);

  // STOP RECORDING HARDWARE & TIMERS ONLY (does not cancel question reading)
  const stopRecordingHardwareAndTimers = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
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

  // STOP QUESTION READING AUDIO & TIMERS
  const stopReadingQuestionAudio = useCallback(() => {
    if (readingTimerRef.current) {
      clearInterval(readingTimerRef.current);
      readingTimerRef.current = null;
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // FULL CLEANUP
  const cleanupAll = useCallback(() => {
    stopRecordingHardwareAndTimers();
    stopReadingQuestionAudio();
  }, [stopRecordingHardwareAndTimers, stopReadingQuestionAudio]);

  // Convert Data URL to Blob for reliable playback in Chrome/Blink
  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const parts = dataUrl.split(",");
    const mime = parts[0]?.match(/:(.*?);/)?.[1] || "audio/webm";
    const bstr = atob(parts[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }, []);

  // Convert Blob to Base64 Data URL for persistent saving
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Save response to backend
  const persistResponse = useCallback(
    async (qKey: string, audioUrl: string, transcriptText: string) => {
      if (!attempt) return;
      try {
        const item: SaveSpeakingResponseItem = {
          questionKey: qKey,
          audioUrl,
          transcript: transcriptText,
          clientRevision: 1,
        };
        await saveSpeakingResponses(attemptId, [item]);
      } catch (err) {
        console.warn("Autosave response non-fatal warning:", err);
      }
    },
    [attempt, attemptId]
  );

  // Forward refs for circular callback flows
  const advanceAfterRecordingRef = useRef<() => void>(() => {});
  const startReadingQuestionRef = useRef<(pIdx: number, qIdx: number) => void>(() => {});
  const startQuestionRecordingRef = useRef<(isRetake?: boolean, customKey?: string, isPart2?: boolean) => Promise<void>>(() => Promise.resolve());

  // STOP RECORDING
  const stopQuestionRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // START RECORDING QUESTION
  const startQuestionRecording = useCallback(
    async (isRetake = false, customKey?: string, isPart2 = false) => {
      cleanupAll();
      const targetKey = customKey || currentKey;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recordedChunks: Blob[] = [];
        audioChunksRef.current = recordedChunks;

        // Audio Visualizer
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVisualizer = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const bars = Array.from(dataArray.slice(0, 24)).map((val) =>
            Math.max(6, Math.min(48, Math.round((val / 255) * 48)))
          );
          setWaveformBars(bars);
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();

        // Speech Recognition
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        let recognizedText = "";
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let full = "";
            for (let i = 0; i < event.results.length; ++i) {
              full += " " + event.results[i][0].transcript;
            }
            recognizedText = full.trim();
            if (isRetake) {
              setRetakeTranscript(recognizedText);
            } else {
              setTranscripts((prev) => ({ ...prev, [targetKey]: recognizedText }));
            }
          };

          try {
            recognition.start();
            speechRecognitionRef.current = recognition;
          } catch {}
        }

        // MediaRecorder with robust mime type negotiation
        let recorder: MediaRecorder;
        const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        try {
          recorder = new MediaRecorder(stream, { mimeType: preferredMime });
        } catch {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        const totalTime = isPart2 ? 120 : 45;

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          stopRecordingHardwareAndTimers();

          const actualMime = recorder.mimeType || preferredMime || "audio/webm";
          const blob = new Blob(recordedChunks, { type: actualMime });
          const url = URL.createObjectURL(blob);
          const duration = totalTime - (isRetake ? retakeTimeRemaining : timeRemaining);

          if (isRetake) {
            setRetakeAudioData({ url, durationSeconds: Math.max(1, duration), blob });
            setRetakeRecordState("RECORDED");
          } else {
            setRecordedAudios((prev) => ({
              ...prev,
              [targetKey]: { url, durationSeconds: Math.max(1, duration), blob },
            }));

            // Convert to base64 & persist
            void blobToBase64(blob).then((base64) => {
              void persistResponse(targetKey, base64, recognizedText);
            });

            // Advance to next question or next part
            advanceAfterRecordingRef.current();
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;

        if (isRetake) {
          setRetakeRecordState("RECORDING");
          setRetakeTimeRemaining(totalTime);
          setRetakeSecondsPassed(0);
        } else {
          setStage("QUESTION_RECORDING");
          setTimeRemaining(totalTime);
          setRecordingSeconds(0);
        }

        // Timer Tick
        recordTimerRef.current = setInterval(() => {
          if (isRetake) {
            setRetakeSecondsPassed((prev) => prev + 1);
            setRetakeTimeRemaining((prev) => {
              if (prev <= 1) {
                stopQuestionRecording();
                return 0;
              }
              return prev - 1;
            });
          } else {
            setRecordingSeconds((prev) => prev + 1);
            setTimeRemaining((prev) => {
              if (prev <= 1) {
                stopQuestionRecording();
                return 0;
              }
              return prev - 1;
            });
          }
        }, 1000);
      } catch (err) {
        alert("Không thể truy cập microphone. Vui lòng cho phép quyền truy cập mic trên trình duyệt để ghi âm!");
      }
    },
    [
      blobToBase64,
      cleanupAll,
      currentKey,
      persistResponse,
      retakeTimeRemaining,
      stopQuestionRecording,
      timeRemaining,
    ]
  );

  // ADVANCE AFTER RECORDING (Part 1 -> Part 2 -> Part 3 -> Summary)
  const advanceAfterRecording = useCallback(() => {
    const currentPartIdx = activePartIndexRef.current;
    const currentQIdx = activeQuestionIndexRef.current;
    const currentPart = parts[currentPartIdx];
    const qCount = currentPart?.questions?.length || 0;

    if (currentPartIdx === 0) {
      // Part 1
      if (currentQIdx < qCount - 1) {
        const nextQIdx = currentQIdx + 1;
        setActiveQuestionIndex(nextQIdx);
        activeQuestionIndexRef.current = nextQIdx;
        startReadingQuestionRef.current(0, nextQIdx);
      } else {
        // Finished Part 1 -> Move to Part 2 Cover
        setActivePartIndex(1);
        setActiveQuestionIndex(0);
        activePartIndexRef.current = 1;
        activeQuestionIndexRef.current = 0;
        setStage("PART_COVER");
        setIsNoteDrawerOpen(true);
      }
    } else if (currentPartIdx === 1) {
      // Finished Part 2 -> Move to Part 3 Cover
      setActivePartIndex(2);
      setActiveQuestionIndex(0);
      activePartIndexRef.current = 2;
      activeQuestionIndexRef.current = 0;
      setStage("PART_COVER");
    } else if (currentPartIdx === 2) {
      // Part 3
      if (currentQIdx < qCount - 1) {
        const nextQIdx = currentQIdx + 1;
        setActiveQuestionIndex(nextQIdx);
        activeQuestionIndexRef.current = nextQIdx;
        startReadingQuestionRef.current(2, nextQIdx);
      } else {
        // Finished All Parts -> Move to Summary Screen!
        setStage("SUMMARY");
        setIsNoteDrawerOpen(false);
      }
    }
  }, [parts]);

  // START READING QUESTION (Plays prompt audio or TTS, with countdown bar)
  const startReadingQuestion = useCallback(
    (pIdx: number, qIdx: number) => {
      stopReadingQuestionAudio();
      stopRecordingHardwareAndTimers();

      activePartIndexRef.current = pIdx;
      activeQuestionIndexRef.current = qIdx;

      setStage("QUESTION_READING");
      setReadingProgress(0);

      const targetPart = parts[pIdx];
      const targetQ = targetPart?.questions?.[qIdx];
      const questionKey = targetQ?.questionKey ?? `${targetPart?.id}-q${qIdx + 1}`;
      const prompt = targetQ?.promptText || "";
      const audioUrl = targetQ?.audioUrl;

      let durationEstimate = 4000; // default 4s reading time
      if (prompt.length > 50) durationEstimate = 6000;
      if (prompt.length > 90) durationEstimate = 8000;

      let hasAdvanced = false;
      const triggerNextRecording = () => {
        if (hasAdvanced) return;
        hasAdvanced = true;
        if (readingTimerRef.current) {
          clearInterval(readingTimerRef.current);
          readingTimerRef.current = null;
        }
        setReadingProgress(100);
        void startQuestionRecordingRef.current(false, questionKey, pIdx === 1);
      };

      const startTime = Date.now();
      readingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / durationEstimate) * 100));
        setReadingProgress(progress);
        if (progress >= 100) {
          triggerNextRecording();
        }
      }, 100);

      // Play audio if available, else TTS
      if (audioUrl && audioUrl.trim()) {
        try {
          const audio = new Audio(audioUrl);
          questionAudioRef.current = audio;
          audio.onended = () => {
            triggerNextRecording();
          };
          audio.onerror = () => {
            // Audio error fallback handled by durationEstimate timer
          };
          void audio.play().catch(() => {});
        } catch {}
      } else if (prompt && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          const utterance = new SpeechSynthesisUtterance(prompt);
          utterance.lang = "en-US";
          utterance.rate = 0.95;
          utteranceRef.current = utterance;
          utterance.onend = () => {
            triggerNextRecording();
          };
          utterance.onerror = () => {
            // TTS error fallback handled by durationEstimate timer
          };
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
    },
    [parts, stopReadingQuestionAudio, stopRecordingHardwareAndTimers]
  );

  useEffect(() => {
    advanceAfterRecordingRef.current = advanceAfterRecording;
    startReadingQuestionRef.current = startReadingQuestion;
    startQuestionRecordingRef.current = startQuestionRecording;
  }, [advanceAfterRecording, startReadingQuestion, startQuestionRecording]);

  // START PART 2 THINKING TIME (1 MINUTE)
  function startPartTwoThinking() {
    cleanupAll();
    setStage("PART2_THINKING");
    setThinkingSecondsRemaining(60);
    setIsNoteDrawerOpen(true);

    thinkingTimerRef.current = setInterval(() => {
      setThinkingSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
          // Automatically start 2-minute recording
          const p2TargetKey = parts[1]?.questions[0]?.questionKey || `${parts[1]?.id}-q1`;
          void startQuestionRecording(false, p2TargetKey, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // START MIC TEST RECORDING (Intro Màn 2)
  async function startMicTestRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMicTestAudioUrl(url);
        setMicTestDuration(micTestSeconds);
        setStage("INTRO_PLAYBACK_MIC");
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setStage("INTRO_RECORDING_MIC");
      setMicTestSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setMicTestSeconds((prev) => {
          if (prev >= 19) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Không thể truy cập microphone. Vui lòng cho phép quyền truy cập mic trên trình duyệt!");
    }
  }

  // STOP MIC TEST RECORDING
  function stopMicTestRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  // TOGGLE PLAY MIC TEST AUDIO
  function togglePlayMicTest() {
    if (!micTestAudioUrl) return;
    if (isPlayingMicTest && micAudioRef.current) {
      micAudioRef.current.pause();
      setIsPlayingMicTest(false);
      return;
    }

    const audio = micAudioRef.current || new Audio(micTestAudioUrl);
    micAudioRef.current = audio;
    audio.playbackRate = micTestSpeed;
    audio.ontimeupdate = () => setMicTestCurrentTime(audio.currentTime);
    audio.onended = () => {
      setIsPlayingMicTest(false);
      setMicTestCurrentTime(0);
    };
    audio.play().catch(() => setIsPlayingMicTest(false));
    setIsPlayingMicTest(true);
  }

  // TOGGLE PLAY RECORDED ANSWER IN SUMMARY / RETAKE
  function togglePlayAudioKey(key: string, rawUrl: string) {
    if (playingKey === key && currentPlaybackAudioRef.current) {
      currentPlaybackAudioRef.current.pause();
      currentPlaybackAudioRef.current = null;
      setPlayingKey(null);
      return;
    }
    if (currentPlaybackAudioRef.current) {
      currentPlaybackAudioRef.current.pause();
      currentPlaybackAudioRef.current = null;
    }

    let playableUrl = rawUrl;
    if (playableUrl.startsWith("data:")) {
      try {
        const blob = dataUrlToBlob(playableUrl);
        playableUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Could not convert dataUrl to blob for playback", err);
      }
    }

    try {
      const audio = new Audio(playableUrl);
      audio.preload = "auto";
      currentPlaybackAudioRef.current = audio;
      setPlayingKey(key);

      audio.onended = () => {
        if (currentPlaybackAudioRef.current === audio) {
          currentPlaybackAudioRef.current = null;
        }
        setPlayingKey(null);
      };

      audio.onerror = (e) => {
        console.warn("Playback error for key", key, e, audio.error);
        if (currentPlaybackAudioRef.current === audio) {
          currentPlaybackAudioRef.current = null;
        }
        setPlayingKey(null);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play rejected for key", key, err);
          if (currentPlaybackAudioRef.current === audio) {
            currentPlaybackAudioRef.current = null;
          }
          setPlayingKey(null);
        });
      }
    } catch (err) {
      console.warn("Failed to initialize audio playback for key", key, err);
      setPlayingKey(null);
    }
  }

  // SUBMIT FINAL ATTEMPT
  async function handleSubmit() {
    if (submitting || !attempt) return;
    setSubmitting(true);
    try {
      await submitSpeakingAttempt(attemptId);
      const fromPlacement = searchParams?.get("from") === "placement";
      if (fromPlacement) {
        router.push("/student/placement-test/mocktest");
      } else {
        router.push(`/student/speaking/attempts/${attemptId}/result`);
      }
    } catch (err) {
      alert("Lỗi khi nộp bài: " + (err instanceof Error ? err.message : "Vui lòng thử lại"));
      setSubmitting(false);
    }
  }

  // FORMAT TIME MM:SS
  function formatTime(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Minimum required time logic (Part 1/3: 10s, Part 2: 60s)
  const isPart2Active = activePartIndex === 1;
  const minRequiredSeconds = isPart2Active ? 60 : 10;
  const isTimeLocked = recordingSeconds < minRequiredSeconds;
  const lockSecondsRemaining = Math.max(0, minRequiredSeconds - recordingSeconds);

  // Retake lock
  const isRetakePart2 = useMemo(() => {
    if (!retakeTargetKey) return false;
    return parts[1]?.questions.some((q) => q.questionKey === retakeTargetKey) || false;
  }, [parts, retakeTargetKey]);
  const retakeMinSec = isRetakePart2 ? 60 : 10;
  const isRetakeLocked = retakeSecondsPassed < retakeMinSec;
  const retakeLockRemaining = Math.max(0, retakeMinSec - retakeSecondsPassed);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8F5F2]">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-[#6F676C]">
          <SpinnerGap size={32} className="animate-spin text-[#FF6636]" />
          <span>Đang tải đề thi IELTS Speaking...</span>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8F5F2] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-[#DED7DA] bg-white p-8 shadow-sm">
          <WarningCircle size={40} className="mx-auto text-[#B42335]" />
          <h1 className="mt-3 text-xl font-bold">Không thể mở phòng thi</h1>
          <p className="mt-2 text-sm text-[#6F676C]">{error || "Dữ liệu đề thi không khả dụng."}</p>
          <Link
            href="/student/practice"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#FF6636] px-6 text-sm font-bold text-white hover:bg-[#F05524] transition"
          >
            Quay lại kho luyện đề
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* TOP HEADER */}
      <header className={styles.topHeader}>
        <div className={styles.brand}>
          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn rời khỏi phòng luyện thi không? Tiến trình bài nói của bạn đã được lưu lại.")) {
                router.push("/student/practice?skill=SPEAKING");
              }
            }}
            className={styles.backBtn}
            aria-label="Rời khỏi phòng thi"
            title="Quay lại danh mục Speaking"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          <div className={styles.brandInfo}>
            <span className={styles.brandEyebrow}>IELTS Speaking</span>
            <strong className={styles.brandTitle}>{attempt?.title || "Speaking Test 1 - Full test"}</strong>
          </div>
        </div>

        {/* Center Stage Pill */}
        <div className={styles.stageCenterBadge}>
          <Sparkle size={14} weight="fill" />
          <span>
            {stage === "INTRO_GUIDE" && "Hướng dẫn làm bài"}
            {stage === "INTRO_TEST_MIC" && "Kiểm tra Microphone"}
            {stage === "INTRO_RECORDING_MIC" && "Đang thử âm thanh"}
            {stage === "INTRO_PLAYBACK_MIC" && "Nghe lại đoạn thử mic"}
            {stage === "PART_COVER" && `Part ${activePartIndex + 1} · Giới thiệu phần thi`}
            {(stage === "QUESTION_READING" || stage === "QUESTION_RECORDING") && activePartIndex === 0 && `Part 1 · Câu ${activeQuestionIndex + 1}/${parts[0]?.questions.length || 12}`}
            {stage === "PART2_THINKING" && "Part 2 · Thời gian chuẩn bị (Thinking)"}
            {stage === "QUESTION_RECORDING" && activePartIndex === 1 && "Part 2 · Ghi âm câu trả lời"}
            {(stage === "QUESTION_READING" || stage === "QUESTION_RECORDING") && activePartIndex === 2 && `Part 3 · Câu ${activeQuestionIndex + 1}/${parts[2]?.questions.length || 6}`}
            {stage === "SUMMARY" && "Tổng kết bài thi"}
          </span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.completionBadge}>
            <span>Đã ghi âm:</span>
            <strong>{completedCount}/{totalQuestionsCount}</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsNoteDrawerOpen((prev) => !prev)}
            className={`${styles.noteToggleButton} ${isNoteDrawerOpen ? styles.noteToggleActive : ""}`}
            title="Mở sổ tay ghi chú nháp"
          >
            <Note size={16} weight="bold" />
            <span>Sổ tay ghi chú</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn rời khỏi phòng luyện thi không? Tiến trình bài nói của bạn đã được lưu lại.")) {
                router.push("/student/practice?skill=SPEAKING");
              }
            }}
            className={styles.closeButton}
            aria-label="Đóng bài thi"
            title="Thoát bài thi"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className={styles.mainLayout}>
        <main className={`${styles.workspace} ${stage === "SUMMARY" ? styles.workspaceSummary : ""}`}>
          {/* ================= STAGE 1: INTRO GUIDE (Ảnh 1) ================= */}
          {stage === "INTRO_GUIDE" && (
            <div className={styles.centerCard}>
              <span className={styles.cardEyebrow}>Chuẩn bị phòng thi</span>
              <h1 className={styles.cardTitle}>Hướng dẫn làm bài thi Speaking</h1>

              {/* Checkbox option */}
              <label className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={alwaysShowQuestion}
                  onChange={(e) => setAlwaysShowQuestion(e.target.checked)}
                  className={styles.customCheckbox}
                />
                <div>
                  <div className={styles.checkboxTitle}>Luôn hiển thị sẵn câu hỏi trên màn hình</div>
                  <div className={styles.checkboxSubtitle}>
                    Nếu tick vào lựa chọn này, câu hỏi sẽ được hiển thị song song với Audio giám khảo đọc
                  </div>
                </div>
              </label>

              {/* Guidance text */}
              <div className={styles.instructionContent}>
                <p>Để buổi luyện thi IELTS Speaking diễn ra hiệu quả và chuẩn xác nhất, bạn vui lòng lưu ý:</p>
                <p>
                  <span className={styles.instructionHighlight}>Kiểm tra Tai nghe và Microphone:</span>{" "}
                  Hãy thực hiện kiểm tra thiết bị ở bước tiếp theo để đảm bảo microphone bắt giọng rõ nét và không bị đứt đoạn.
                </p>
                <p>
                  <span className={styles.instructionHighlight}>Không gian luyện tập yên tĩnh:</span>{" "}
                  Tránh môi trường có nhiều tạp âm, tiếng ồn để The IELTS Spells ghi nhận và phân tích phát âm (Pronunciation & Fluency) của bạn tốt nhất.
                </p>
                <p>
                  <span className={styles.instructionHighlight}>Giới hạn thời gian trả lời:</span>{" "}
                  Mỗi câu hỏi Part 1 và Part 3 có tối đa 45 giây trả lời (tối thiểu 10 giây mới được chuyển câu). Part 2 có 1 phút chuẩn bị và 2 phút nói (tối thiểu 1 phút mới được hoàn tất).
                </p>
                <p className="italic text-gray-500 mt-2">
                  (*): Sau màn hướng dẫn này, toàn bộ nội dung đề và giám khảo ảo sẽ sử dụng Tiếng Anh chuẩn format thi IELTS thực tế.
                </p>
              </div>

              {/* Next step button */}
              <button
                type="button"
                onClick={() => setStage("INTRO_TEST_MIC")}
                className={styles.primaryOrangeBtn}
              >
                <span>Bắt đầu kiểm tra Micro (Next step)</span>
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}

          {/* ================= STAGE 2: TEST YOUR MICROPHONE (Ảnh 2) ================= */}
          {stage === "INTRO_TEST_MIC" && (
            <div className={styles.centerCard}>
              <h1 className={styles.cardTitleUppercase}>TEST YOUR MICROPHONE</h1>

              <div className="text-left text-sm text-[#374151] space-y-3 max-w-lg mb-8 leading-relaxed">
                <p>• You have 20 seconds to speak.</p>
                <p>• To complete this activity, you must allow access to your system's microphone.</p>
                <p>• Click the button "Test microphone" below to Start.</p>
              </div>

              <div className="flex items-center justify-between w-full max-w-md mt-6">
                <div />
                <button
                  type="button"
                  onClick={() => void startMicTestRecording()}
                  className={styles.primaryOrangeBtn}
                >
                  <Microphone size={18} weight="fill" />
                  <span>Test microphone</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePartIndex(0);
                    setActiveQuestionIndex(0);
                    setStage("PART_COVER");
                  }}
                  className={styles.skipLinkBtn}
                >
                  <span>Skip</span>
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STAGE 2.5: RECORDING MIC TEST ================= */}
          {stage === "INTRO_RECORDING_MIC" && (
            <div className={styles.centerCard}>
              <h1 className={styles.cardTitleUppercase}>TEST YOUR MICROPHONE</h1>
              <p className="text-sm text-[#6B7280] mb-4">Đang ghi âm thử microphone ({20 - micTestSeconds}s còn lại)...</p>

              <div className={styles.waveformContainer}>
                {waveformBars.map((h, i) => (
                  <div key={i} className={styles.waveformBar} style={{ height: `${h}px` }} />
                ))}
              </div>

              <button
                type="button"
                onClick={stopMicTestRecording}
                className={styles.primaryOrangeBtn}
              >
                <Stop size={18} weight="fill" />
                <span>Dừng ghi âm</span>
              </button>
            </div>
          )}

          {/* ================= STAGE 3: PLAYBACK MIC TEST (Ảnh 3) ================= */}
          {stage === "INTRO_PLAYBACK_MIC" && (
            <div className={styles.centerCard}>
              <h1 className={styles.cardTitleUppercase}>TEST YOUR MICROPHONE</h1>

              <div className="text-left text-sm text-[#374151] space-y-2 max-w-lg mb-4">
                <p>• You have 20 seconds to speak.</p>
                <p>• To complete this activity, you must allow access to your system's microphone.</p>
                <p>• Click the button "Test microphone" below to Start.</p>
              </div>

              {/* Scrubber and controls */}
              <div className={styles.playerContainer}>
                <div
                  className={styles.progressBarContainer}
                  onClick={(e) => {
                    if (!micAudioRef.current || !micTestDuration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, clickX / rect.width));
                    micAudioRef.current.currentTime = pct * micTestDuration;
                  }}
                >
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${micTestDuration ? (micTestCurrentTime / micTestDuration) * 100 : 0}%`,
                    }}
                  >
                    <div className={styles.progressScrubber} />
                  </div>
                </div>

                <div className={styles.playerControlsRow}>
                  <span>
                    {formatTime(Math.round(micTestCurrentTime))} / {formatTime(Math.round(micTestDuration))}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (micAudioRef.current) {
                          micAudioRef.current.currentTime = Math.max(0, micAudioRef.current.currentTime - 5);
                        }
                      }}
                      className={styles.seekBtn}
                      title="Lùi 5s"
                    >
                      <ArrowCounterClockwise size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayMicTest}
                      className={styles.playPauseCircleBtn}
                    >
                      {isPlayingMicTest ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (micAudioRef.current) {
                          micAudioRef.current.currentTime = Math.min(micTestDuration, micAudioRef.current.currentTime + 5);
                        }
                      }}
                      className={styles.seekBtn}
                      title="Tiến 5s"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = micTestSpeed === 1 ? 1.25 : micTestSpeed === 1.25 ? 1.5 : 1;
                      setMicTestSpeed(next);
                      if (micAudioRef.current) micAudioRef.current.playbackRate = next;
                    }}
                    className={styles.playbackSpeedBadge}
                  >
                    Playback speed: {micTestSpeed}x
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between w-full max-w-md mt-6">
                <button
                  type="button"
                  onClick={() => setStage("INTRO_TEST_MIC")}
                  className={styles.secondaryWhiteBtn}
                >
                  <ArrowCounterClockwise size={16} />
                  <span>Try again</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePartIndex(0);
                    setActiveQuestionIndex(0);
                    setStage("PART_COVER");
                  }}
                  className={styles.primaryOrangeBtn}
                >
                  <Play size={16} weight="fill" />
                  <span>Start test</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STAGE 4 / 8 / 11: PART COVER SCREENS (Ảnh 4, 8, 11) ================= */}
          {stage === "PART_COVER" && (
            <div className={styles.centerCard}>
              <span className={styles.cardEyebrow}>Part {activePartIndex + 1} of 3</span>
              <h1 className={styles.cardTitle}>
                {activePartIndex === 0
                  ? "Part 1: Personal & Familiar Topics"
                  : activePartIndex === 1
                  ? "Part 2: Long Turn (Cue Card)"
                  : "Part 3: Two-way Discussion"}
              </h1>

              <div className="max-w-xl text-left text-sm text-[#5C5752] space-y-3 leading-relaxed mb-8">
                {activePartIndex === 0 && (
                  <>
                    <p>Part 1 will take about 4 to 5 minutes.</p>
                    <p>
                      The examiner will ask you some general questions about yourself, your family, your work or
                      studies, and familiar topics.
                    </p>
                  </>
                )}

                {activePartIndex === 1 && (
                  <>
                    <p>Part 2 will take about 3 to 4 minutes.</p>
                    <p>In this part, you will be given a topic card and you will have 1-2 minutes to talk about it.</p>
                    <p>
                      Before you talk, you will have exactly 1 minute to prepare, and you can make some notes on the
                      paper provided if you wish.
                    </p>
                  </>
                )}

                {activePartIndex === 2 && (
                  <>
                    <p>Part 3 will take about 4 to 5 minutes.</p>
                    <p>
                      In this part, we will discuss some more general questions related to the topic you just spoke
                      about.
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activePartIndex === 1) {
                    startPartTwoThinking();
                  } else {
                    startReadingQuestion(activePartIndex, 0);
                  }
                }}
                className={styles.primaryOrangeBtn}
              >
                <Play size={16} weight="fill" />
                <span>Bắt đầu phần này (Start now)</span>
              </button>
            </div>
          )}

          {/* ================= STAGE 5 / 6: QUESTION READING OR RECORDING (Part 1 & 3 - Ảnh 5, 6, 7, 12, 13) ================= */}
          {(stage === "QUESTION_READING" || stage === "QUESTION_RECORDING") && activePartIndex !== 1 && (
            <div className={styles.centerCard}>
              <span className={styles.cardEyebrow}>
                Part {activePartIndex + 1} · Câu {activeQuestionIndex + 1}/{questions.length}
              </span>

              <div className={styles.questionCenterArea}>
                {alwaysShowQuestion || revealedQuestions[currentKey] ? (
                  <p className={styles.questionPromptOrange}>{activeQuestion?.promptText}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealedQuestions((prev) => ({ ...prev, [currentKey]: true }))}
                    className={styles.showQuestionBtn}
                  >
                    <Eye size={18} weight="bold" />
                    <span>Show question</span>
                  </button>
                )}
              </div>

              {/* Reading Phase */}
              {stage === "QUESTION_READING" && (
                <div className={styles.questionReadingNotice}>
                  <p className={styles.readingNoticeText}>Recording will start after the question</p>
                  <div className={styles.readingProgressBar}>
                    <div
                      className={styles.readingProgressBarFill}
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recording Phase */}
              {stage === "QUESTION_RECORDING" && (
                <div className="flex flex-col items-center">
                  <div className={styles.waveformContainer}>
                    {waveformBars.map((h, i) => (
                      <div key={i} className={styles.waveformBar} style={{ height: `${h}px` }} />
                    ))}
                  </div>

                  <div className={styles.timeLimitButtonWrapper}>
                    {/* Tooltip Popup (Ảnh 7) */}
                    {showLockTooltip && isTimeLocked && (
                      <div className={styles.lockTooltip}>
                        Vui lòng đợi{" "}
                        <span className={styles.lockTooltipGreenNum}>{lockSecondsRemaining}</span> giây để{" "}
                        hoàn thành
                      </div>
                    )}

                    <button
                      type="button"
                      onMouseEnter={() => {
                        if (isTimeLocked) setShowLockTooltip(true);
                      }}
                      onMouseLeave={() => setShowLockTooltip(false)}
                      onClick={() => {
                        if (isTimeLocked) {
                          setShowLockTooltip(true);
                        } else {
                          stopQuestionRecording();
                        }
                      }}
                      className={`${styles.timeLimitButton} ${
                        isTimeLocked ? styles.timeLimitButtonLocked : styles.timeLimitButtonActive
                      }`}
                    >
                      <div className={styles.stopSquareIcon} />
                      <span>Time limit {formatTime(timeRemaining)}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PART 2: THINKING TIME (Ảnh 9) ================= */}
          {stage === "PART2_THINKING" && (
            <div className={styles.centerCard}>
              <span className={styles.cardEyebrow}>Part 2 · Thời gian chuẩn bị (Thinking)</span>

              <div className={styles.cueCardContainer}>
                <h3 className={styles.cueCardTopicTitle}>
                  {activePart?.topicTitle || activePart?.cueCardPromptHtml || "Describe a topic"}
                </h3>

                {activePart?.cueCardBullets && activePart.cueCardBullets.length > 0 && (
                  <>
                    <p className={styles.cueCardIntro}>You should say:</p>
                    <ul className={styles.cueCardBulletsList}>
                      {activePart.cueCardBullets.map((bullet, idx) => (
                        <li key={idx}>• {bullet}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={styles.thinkingTimerBox}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 750, color: "var(--spk-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Thinking time
                  </span>
                  <div className={styles.thinkingTimeNumber}>
                    {formatTime(thinkingSecondsRemaining)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
                    const p2TargetKey = parts[1]?.questions[0]?.questionKey || `${parts[1]?.id}-q1`;
                    void startQuestionRecording(false, p2TargetKey, true);
                  }}
                  className={styles.primaryOrangeBtn}
                >
                  <Microphone size={18} weight="fill" />
                  <span>Bắt đầu làm bài ngay (Start now)</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= PART 2: RECORDING (Ảnh 10) ================= */}
          {stage === "QUESTION_RECORDING" && activePartIndex === 1 && (
            <div className={styles.centerCard}>
              <span className={styles.cardEyebrow}>Part 2 · Long Turn (Cue Card)</span>

              <div className={styles.cueCardContainer}>
                <h3 className={styles.cueCardTopicTitle}>
                  {activePart?.topicTitle || activePart?.cueCardPromptHtml || "Describe a topic"}
                </h3>

                {activePart?.cueCardBullets && activePart.cueCardBullets.length > 0 && (
                  <>
                    <p className={styles.cueCardIntro}>You should say:</p>
                    <ul className={styles.cueCardBulletsList}>
                      {activePart.cueCardBullets.map((bullet, idx) => (
                        <li key={idx}>• {bullet}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="flex flex-col items-center mt-2">
                <div className={styles.waveformContainer}>
                  {waveformBars.map((h, i) => (
                    <div key={i} className={styles.waveformBar} style={{ height: `${h}px` }} />
                  ))}
                </div>

                <div className={styles.timeLimitButtonWrapper}>
                  {/* Tooltip Popup */}
                  {showLockTooltip && isTimeLocked && (
                    <div className={styles.lockTooltip}>
                      Vui lòng đợi{" "}
                      <span className={styles.lockTooltipGreenNum}>{lockSecondsRemaining}</span> giây để{" "}
                      hoàn thành
                    </div>
                  )}

                  <button
                    type="button"
                    onMouseEnter={() => {
                      if (isTimeLocked) setShowLockTooltip(true);
                    }}
                    onMouseLeave={() => setShowLockTooltip(false)}
                    onClick={() => {
                      if (isTimeLocked) {
                        setShowLockTooltip(true);
                      } else {
                        stopQuestionRecording();
                      }
                    }}
                    className={`${styles.timeLimitButton} ${
                      isTimeLocked ? styles.timeLimitButtonLocked : styles.timeLimitButtonActive
                    }`}
                  >
                    <div className={styles.stopSquareIcon} />
                    <span>Time limit {formatTime(timeRemaining)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STAGE 6: SUMMARY SCREEN (Ảnh 14) ================= */}
          {stage === "SUMMARY" && (
            <div className={styles.summaryContainer}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryEyebrow}>Hoàn thành 3 phần thi</span>
                <h1 className={styles.summaryTitle}>Tổng kết bài thi IELTS Speaking</h1>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--spk-muted)" }}>
                  Bạn có thể nghe lại các câu trả lời đã ghi âm hoặc chọn "Nói lại" để cải thiện bài nói trước khi nộp.
                </p>
              </div>

              <div className={styles.summaryColumnsGrid}>
                {/* PART 1 COLUMN */}
                <div className={styles.summaryColumnCard}>
                  <div className={styles.summaryColumnHeaderSticky}>
                    <h2 className={styles.summaryColumnTitle}>Part 1</h2>
                    <span className={styles.summaryColumnCountBadge}>
                      {parts[0]?.questions.length || 0} câu
                    </span>
                  </div>
                  <div className={styles.summaryQuestionListScroll}>
                    {parts[0]?.questions.map((q) => {
                      const audio = recordedAudios[q.questionKey];
                      return (
                        <div key={q.id} className={styles.summaryQuestionItem}>
                          <p className={styles.summaryPromptText}>{q.promptText}</p>
                          <div className={styles.summaryItemActions}>
                            <button
                              type="button"
                              onClick={() => {
                                setRetakeTargetKey(q.questionKey);
                                setShowRetakeConfirm(true);
                              }}
                              className={styles.retakeLinkBtn}
                            >
                              <ArrowCounterClockwise size={14} />
                              <span>Nói lại</span>
                            </button>

                            {audio?.url ? (
                              <button
                                type="button"
                                onClick={() => togglePlayAudioKey(q.questionKey, audio.url)}
                                className={styles.miniPlayBtn}
                              >
                                {playingKey === q.questionKey ? (
                                  <Pause size={12} weight="fill" />
                                ) : (
                                  <Play size={12} weight="fill" />
                                )}
                                <span>{formatTime(audio.durationSeconds || 10)}</span>
                              </button>
                            ) : (
                              <span className={styles.summaryMissingAudioWarning}>
                                Không nhận được âm thanh từ bạn, vui lòng nói lại câu này
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PART 2 COLUMN */}
                <div className={styles.summaryColumnCard}>
                  <div className={styles.summaryColumnHeaderSticky}>
                    <h2 className={styles.summaryColumnTitle}>Part 2</h2>
                    <span className={styles.summaryColumnCountBadge}>1 câu</span>
                  </div>
                  <div className={styles.summaryQuestionListScroll}>
                    {parts[1] && (
                      <div className={styles.summaryQuestionItem}>
                        <p className={styles.summaryPromptText}>
                          {parts[1].topicTitle || parts[1].cueCardPromptHtml || "Describe a topic"}
                        </p>
                        <div className={styles.summaryItemActions}>
                          <button
                            type="button"
                            onClick={() => {
                              const p2Key = parts[1]?.questions[0]?.questionKey || `${parts[1]?.id}-q1`;
                              setRetakeTargetKey(p2Key);
                              setShowRetakeConfirm(true);
                            }}
                            className={styles.retakeLinkBtn}
                          >
                            <ArrowCounterClockwise size={14} />
                            <span>Nói lại</span>
                          </button>

                          {(() => {
                            const p2Key = parts[1]?.questions[0]?.questionKey || `${parts[1]?.id}-q1`;
                            const audio = recordedAudios[p2Key] || recordedAudios[`${parts[1]?.id}-cue`];
                            return audio?.url ? (
                              <button
                                type="button"
                                onClick={() => togglePlayAudioKey(p2Key, audio.url)}
                                className={styles.miniPlayBtn}
                              >
                                {playingKey === p2Key ? (
                                  <Pause size={12} weight="fill" />
                                ) : (
                                  <Play size={12} weight="fill" />
                                )}
                                <span>{formatTime(audio.durationSeconds || 100)}</span>
                              </button>
                            ) : (
                              <span className={styles.summaryMissingAudioWarning}>
                                Không nhận được âm thanh từ bạn, vui lòng nói lại câu này
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PART 3 COLUMN */}
                <div className={styles.summaryColumnCard}>
                  <div className={styles.summaryColumnHeaderSticky}>
                    <h2 className={styles.summaryColumnTitle}>Part 3</h2>
                    <span className={styles.summaryColumnCountBadge}>
                      {parts[2]?.questions.length || 0} câu
                    </span>
                  </div>
                  <div className={styles.summaryQuestionListScroll}>
                    {parts[2]?.questions.map((q) => {
                      const audio = recordedAudios[q.questionKey];
                      return (
                        <div key={q.id} className={styles.summaryQuestionItem}>
                          <p className={styles.summaryPromptText}>{q.promptText}</p>
                          <div className={styles.summaryItemActions}>
                            <button
                              type="button"
                              onClick={() => {
                                setRetakeTargetKey(q.questionKey);
                                setShowRetakeConfirm(true);
                              }}
                              className={styles.retakeLinkBtn}
                            >
                              <ArrowCounterClockwise size={14} />
                              <span>Nói lại</span>
                            </button>

                            {audio?.url ? (
                              <button
                                type="button"
                                onClick={() => togglePlayAudioKey(q.questionKey, audio.url)}
                                className={styles.miniPlayBtn}
                              >
                                {playingKey === q.questionKey ? (
                                  <Pause size={12} weight="fill" />
                                ) : (
                                  <Play size={12} weight="fill" />
                                )}
                                <span>{formatTime(audio.durationSeconds || 20)}</span>
                              </button>
                            ) : (
                              <span className={styles.summaryMissingAudioWarning}>
                                Không nhận được âm thanh từ bạn, vui lòng nói lại câu này
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className={styles.summaryBottomNotice}>
                <p className={styles.summaryNoticeRed}>
                  Bạn cần hoàn thành đủ tất cả câu hỏi để hoàn tất bài mocktest
                </p>
                <p className={styles.summaryNoticeGray}>
                  Đã hoàn thành {completedCount}/{totalQuestionsCount} câu. Với câu chưa có kết quả, hãy chọn Nói
                  lại để ghi âm lại câu đó.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT NOTE DRAWER (Part 2 & Part 3) */}
        {isNoteDrawerOpen && (
          <aside className={styles.noteDrawer}>
            <div className={styles.noteDrawerHeader}>
              <span>
                <Note size={18} weight="fill" />
                Sổ tay ghi chú
              </span>
              <span className={styles.noteDrawerBadge}>Part 2 & 3</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú nhanh dàn ý, từ vựng và ý tưởng cho bài nói tại đây..."
              className={styles.noteTextarea}
            />
            <div className={styles.noteDrawerFooter}>
              <span>Tự động lưu bài</span>
              <span>Giữ nguyên sang Part 3</span>
            </div>
          </aside>
        )}
      </div>

      {/* ================= RETAKE CONFIRM MODAL (Ảnh 15) ================= */}
      {showRetakeConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmDialog}>
            <h2 className={styles.confirmTitle}>Bạn có chắc muốn nói lại bài này</h2>
            <p className={styles.confirmSubtitle}>Bài làm hiện tại sẽ không được lưu lại</p>

            <ArrowCounterClockwise size={64} className={styles.circularRefreshIcon} />

            <div className={styles.confirmActionsRow}>
              <button
                type="button"
                onClick={() => {
                  setShowRetakeConfirm(false);
                  setRetakeTargetKey(null);
                }}
                className={styles.secondaryWhiteBtn}
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRetakeConfirm(false);
                  setShowRetakeWorkspace(true);
                  setRetakeRecordState("IDLE");
                  setRetakeAudioData(null);
                  setRetakeTranscript("");
                }}
                className={styles.primaryOrangeBtn}
              >
                Nói lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RETAKE WORKSPACE MODAL (Ảnh 16 & 17) ================= */}
      {showRetakeWorkspace && retakeTargetKey && (
        <div className={styles.modalBackdrop}>
          <div className={styles.reRecordModal}>
            <div className={styles.reRecordHeader}>
              <span className={styles.reRecordTitle}>
                {isRetakePart2 ? "Part 2" : "Part 1"}
              </span>
              <button
                type="button"
                onClick={() => {
                  cleanupAll();
                  setShowRetakeWorkspace(false);
                  setRetakeTargetKey(null);
                }}
                className={styles.closeButton}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className={styles.reRecordBody}>
              <div className={styles.reRecordContent}>
                {/* Question Prompt */}
                {(() => {
                  const targetItem = allQuestionItems.find((i) => i.question.questionKey === retakeTargetKey);
                  return (
                    <div className="w-full text-left mb-6">
                      <h3 className="text-base font-bold text-[#1F2937]">
                        {targetItem?.question.promptText || targetItem?.part.topicTitle || "Câu hỏi luyện nói"}
                      </h3>
                    </div>
                  );
                })()}

                {/* State A: Idle - Start Recording Button (Ảnh 16) */}
                {retakeRecordState === "IDLE" && (
                  <div className="flex flex-col items-center my-8">
                    <button
                      type="button"
                      onClick={() => void startQuestionRecording(true, retakeTargetKey, isRetakePart2)}
                      className={styles.primaryOrangeBtn}
                    >
                      <Microphone size={18} weight="fill" />
                      <span>Bắt đầu ghi âm</span>
                    </button>
                  </div>
                )}

                {/* State B: Recording - Waveform & Time Limit Lock */}
                {retakeRecordState === "RECORDING" && (
                  <div className="flex flex-col items-center my-6">
                    <div className={styles.waveformContainer}>
                      {waveformBars.map((h, i) => (
                        <div key={i} className={styles.waveformBar} style={{ height: `${h}px` }} />
                      ))}
                    </div>

                    <div className={styles.timeLimitButtonWrapper}>
                      {showRetakeLockTooltip && isRetakeLocked && (
                        <div className={styles.lockTooltip}>
                          Vui lòng đợi{" "}
                          <span className={styles.lockTooltipGreenNum}>{retakeLockRemaining}</span> giây để{" "}
                          hoàn thành
                        </div>
                      )}

                      <button
                        type="button"
                        onMouseEnter={() => {
                          if (isRetakeLocked) setShowRetakeLockTooltip(true);
                        }}
                        onMouseLeave={() => setShowRetakeLockTooltip(false)}
                        onClick={() => {
                          if (isRetakeLocked) {
                            setShowRetakeLockTooltip(true);
                          } else {
                            stopQuestionRecording();
                          }
                        }}
                        className={`${styles.timeLimitButton} ${
                          isRetakeLocked ? styles.timeLimitButtonLocked : styles.timeLimitButtonActive
                        }`}
                      >
                        <div className={styles.stopSquareIcon} />
                        <span>Time limit {formatTime(retakeTimeRemaining)}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State C: Recorded - Preview Transcript & Confirm (Ảnh 17) */}
                {retakeRecordState === "RECORDED" && retakeAudioData && (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRetakeRecordState("IDLE");
                          setRetakeAudioData(null);
                        }}
                        className={styles.retakeLinkBtn}
                      >
                        <ArrowCounterClockwise size={14} />
                        <span>Nói lại</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePlayAudioKey("retake-preview", retakeAudioData.url)}
                        className={styles.miniPlayBtn}
                      >
                        {playingKey === "retake-preview" ? (
                          <Pause size={12} weight="fill" />
                        ) : (
                          <Play size={12} weight="fill" />
                        )}
                        <span>{formatTime(retakeAudioData.durationSeconds)}</span>
                      </button>
                    </div>

                    {/* Transcribed text */}
                    <div className={styles.transcriptPreviewArea}>
                      {retakeTranscript || "(Chưa phân tích được giọng nói rõ ràng)"}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        // Apply retake result
                        setRecordedAudios((prev) => ({
                          ...prev,
                          [retakeTargetKey]: retakeAudioData,
                        }));
                        setTranscripts((prev) => ({
                          ...prev,
                          [retakeTargetKey]: retakeTranscript,
                        }));

                        if (retakeAudioData.blob) {
                          const base64 = await blobToBase64(retakeAudioData.blob);
                          void persistResponse(retakeTargetKey, base64, retakeTranscript);
                        }

                        setShowRetakeWorkspace(false);
                        setRetakeTargetKey(null);
                      }}
                      className={styles.primaryOrangeBtn}
                    >
                      <span>Chọn bài nói này và tiếp tục</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Note in Retake if Part 2 */}
              {isRetakePart2 && (
                <aside className={styles.noteDrawer} style={{ width: "260px" }}>
                  <div className={styles.noteDrawerHeader}>Note</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={styles.noteTextarea}
                  />
                </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM NAVIGATION BAR (Màn 1 -> 14) ================= */}
      <footer className={styles.bottomNavBar}>
        <div className={styles.bottomNavLeft}>
          {/* Intro button */}
          <button
            type="button"
            className={`${styles.introNavBtn} ${
              stage.startsWith("INTRO")
                ? styles.introNavBtnActive
                : styles.introNavBtnCompleted
            }`}
          >
            {stage.startsWith("INTRO") ? (
              <>
                <span>Intro</span>
                <Microphone size={14} weight="fill" />
              </>
            ) : (
              <>
                <span>Intro</span>
                <Check size={14} weight="bold" />
              </>
            )}
          </button>

          {/* Part 1 Group */}
          {activePartIndex === 0 && !stage.startsWith("INTRO") && stage !== "SUMMARY" ? (
            <div className={`${styles.partNavGroup} ${styles.partNavGroupActive}`}>
              <span className={`${styles.partLabelText} ${styles.partLabelTextActive}`}>Part 1</span>
              {parts[0]?.questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    startReadingQuestion(0, idx);
                  }}
                  className={`${styles.questionCircle} ${
                    idx === activeQuestionIndex
                      ? styles.questionCircleActive
                      : recordedAudios[q.questionKey]
                      ? styles.questionCircleDone
                      : ""
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`${styles.partNavGroup} ${
                activePartIndex > 0 || stage === "SUMMARY"
                  ? styles.partNavGroupCompleted
                  : ""
              }`}
            >
              <span
                className={`${styles.partLabelText} ${
                  activePartIndex > 0 || stage === "SUMMARY"
                    ? styles.partLabelTextCompleted
                    : ""
                }`}
              >
                Part 1
              </span>
              {(activePartIndex > 0 || stage === "SUMMARY") && <Check size={14} weight="bold" />}
            </div>
          )}

          {/* Part 2 Group */}
          {activePartIndex === 1 && stage !== "SUMMARY" ? (
            <div className={`${styles.partNavGroup} ${styles.partNavGroupActive}`}>
              <span className={`${styles.partLabelText} ${styles.partLabelTextActive}`}>Part 2</span>
              <div className={`${styles.questionCircle} ${styles.questionCircleActive}`}>1</div>
            </div>
          ) : (
            <div
              className={`${styles.partNavGroup} ${
                activePartIndex > 1 || stage === "SUMMARY"
                  ? styles.partNavGroupCompleted
                  : ""
              }`}
            >
              <span
                className={`${styles.partLabelText} ${
                  activePartIndex > 1 || stage === "SUMMARY"
                    ? styles.partLabelTextCompleted
                    : ""
                }`}
              >
                Part 2
              </span>
              {(activePartIndex > 1 || stage === "SUMMARY") && <Check size={14} weight="bold" />}
            </div>
          )}

          {/* Part 3 Group */}
          {activePartIndex === 2 && stage !== "SUMMARY" ? (
            <div className={`${styles.partNavGroup} ${styles.partNavGroupActive}`}>
              <span className={`${styles.partLabelText} ${styles.partLabelTextActive}`}>Part 3</span>
              {parts[2]?.questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    startReadingQuestion(2, idx);
                  }}
                  className={`${styles.questionCircle} ${
                    idx === activeQuestionIndex
                      ? styles.questionCircleActive
                      : recordedAudios[q.questionKey]
                      ? styles.questionCircleDone
                      : ""
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`${styles.partNavGroup} ${
                stage === "SUMMARY" ? styles.partNavGroupCompleted : ""
              }`}
            >
              <span
                className={`${styles.partLabelText} ${
                  stage === "SUMMARY" ? styles.partLabelTextCompleted : ""
                }`}
              >
                Part 3
              </span>
              {stage === "SUMMARY" && <Check size={14} weight="bold" />}
            </div>
          )}
        </div>

        {/* Bottom Nav Right: Submit buttons */}
        <div className={styles.bottomNavRight}>
          {stage === "SUMMARY" && (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={styles.submitBtnFree}
              >
                {submitting ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <Check size={14} weight="bold" />
                )}
                <span>
                  Nộp bài ({completedCount}/{totalQuestionsCount})
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={styles.proGradeBtn}
              >
                <Sparkle size={14} weight="fill" />
                <span>Đánh giá IELTS Spells AI</span>
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
