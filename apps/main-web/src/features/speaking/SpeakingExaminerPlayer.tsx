"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CircleNotch,
  Headphones,
  Microphone,
  Pause,
  Play,
  SpeakerHigh,
  Stop,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { ApiClientError } from "@ielts/api-client";
import type { SpeakingExamState, SpeakingExaminerSession } from "@ielts/contracts";
import type { MicVAD as MicVadInstance } from "@ricky0123/vad-web";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";
import {
  abortSpeakingExamSession,
  createOrResumeSpeakingExaminerSession,
  getSpeakingExaminerSession,
  markSpeakingExamPartTwoReady,
  submitSpeakingExaminerTurn,
  uploadSpeakingAudio,
} from "./speakingApi";
import styles from "./SpeakingExaminerPlayer.module.css";

interface SpeakingExaminerPlayerProps {
  attemptId: string;
}

type CaptureStatus = "READY" | "RECORDING" | "RECORDED" | "UPLOADING" | "PROCESSING";
type Recording = {
  blob: Blob;
  url: string;
  durationMs: number;
  clientTurnId: string;
  storageKey?: string;
};

const VAD_ASSET_PATH = (process.env.NEXT_PUBLIC_VAD_ASSET_BASE_PATH
  || "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/").replace(/\/?$/, "/");
const VAD_WASM_PATH = (process.env.NEXT_PUBLIC_VAD_ONNX_WASM_BASE_PATH
  || "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/").replace(/\/?$/, "/");
const VAD_SILENCE_MS = Math.max(1_500,
  Number(process.env.NEXT_PUBLIC_SPEAKING_VAD_SILENCE_MS || 1_800) || 1_800);

const steps = ["Kiểm tra", "Part 1", "Part 2", "Part 3", "Hoàn tất"] as const;

function stepIndex(state: SpeakingExamState) {
  if (["CREATED", "MIC_CHECK", "IDENTITY_CHECK"].includes(state)) return 0;
  if (state === "PART_1") return 1;
  if (["PART_2_PREPARATION", "PART_2_LONG_TURN", "PART_2_FOLLOW_UP"].includes(state)) return 2;
  if (state === "PART_3") return 3;
  return 4;
}

function stateLabel(state: SpeakingExamState) {
  const labels: Record<SpeakingExamState, string> = {
    CREATED: "Chuẩn bị",
    MIC_CHECK: "Kiểm tra microphone",
    IDENTITY_CHECK: "Giới thiệu bản thân",
    PART_1: "Part 1 · Chủ đề quen thuộc",
    PART_2_PREPARATION: "Part 2 · Chuẩn bị",
    PART_2_LONG_TURN: "Part 2 · Bài nói dài",
    PART_2_FOLLOW_UP: "Part 2 · Câu hỏi tiếp nối",
    PART_3: "Part 3 · Thảo luận",
    CLOSING: "Xác nhận kết thúc",
    EVALUATION_QUEUED: "Đã hoàn tất",
    ABORTED: "Phiên đã kết thúc",
  };
  return labels[state];
}

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function SpeakingExaminerPlayer({ attemptId }: SpeakingExaminerPlayerProps) {
  const router = useRouter();
  const [session, setSession] = useState<SpeakingExaminerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState("");
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("READY");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(new Array(20).fill(12));
  const [promptUrl, setPromptUrl] = useState("");
  const [promptPlaying, setPromptPlaying] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [showAbort, setShowAbort] = useState(false);
  const [prepRemaining, setPrepRemaining] = useState<number | null>(null);
  const [prepRecovery, setPrepRecovery] = useState(false);
  const [vadActivity, setVadActivity] = useState<"SILENT" | "SPEAKING">("SILENT");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadRef = useRef<MicVadInstance | null>(null);
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);
  const answerAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopRecordingRef = useRef<() => void>(() => undefined);

  const currentTurn = session?.currentTurn ?? null;
  const isPartTwoLongTurn = session?.state === "PART_2_LONG_TURN";
  const currentStep = session ? stepIndex(session.state) : 0;
  const maxAnswerSeconds = currentTurn?.answerTimeSeconds ?? 45;
  const preparationSeconds = currentTurn?.preparationTimeSeconds ?? 60;

  const cleanupCapture = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    void vadRef.current?.pause().catch(() => undefined);
    void vadRef.current?.destroy().catch((reason) => {
      console.warn("[speaking-examiner-vad] cleanup failed", reason);
    });
    vadRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setVadActivity("SILENT");
  }, []);

  const resetRecording = useCallback(() => {
    setRecording((previous) => {
      if (previous) revokeMediaUrl(previous.url);
      return null;
    });
    setCaptureStatus("READY");
    setRecordingSeconds(0);
    setWaveform(new Array(20).fill(12));
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loaded = await createOrResumeSpeakingExaminerSession(attemptId);
      setSession(loaded);
      if (loaded.state === "PART_2_PREPARATION") {
        const saved = localStorage.getItem(`speaking-exam-prep-${loaded.sessionId}-${loaded.stateVersion}`);
        if (saved) {
          const elapsed = Math.floor((Date.now() - Number(saved)) / 1_000);
          setPrepRemaining(Math.max(0, (loaded.currentTurn?.preparationTimeSeconds ?? 60) - elapsed));
        } else {
          setPrepRecovery(true);
          setPrepRemaining(null);
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể mở phiên AI Speaking Examiner.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadSession();
    return () => cleanupCapture();
  }, [cleanupCapture, loadSession]);

  useEffect(() => {
    resetRecording();
    setError("");
  }, [currentTurn?.turnId, resetRecording]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setPromptUrl("");
    setPlaybackBlocked(false);
    if (!currentTurn?.audioUrl) return undefined;
    void apiMediaUrl(currentTurn.audioUrl)
      .then((url) => {
        if (!active) {
          revokeMediaUrl(url);
          return;
        }
        objectUrl = url;
        setPromptUrl(url);
      })
      .catch(() => setPlaybackBlocked(true));
    return () => {
      active = false;
      if (objectUrl) revokeMediaUrl(objectUrl);
    };
  }, [currentTurn?.audioUrl]);

  useEffect(() => {
    if (session?.state !== "PART_2_PREPARATION" || prepRemaining == null || prepRemaining <= 0) return undefined;
    const timer = window.setInterval(() => setPrepRemaining((value) => value == null ? value : Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [prepRemaining, session?.state]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);
  stopRecordingRef.current = stopRecording;

  const startWaveform = useCallback((stream: MediaStream) => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 64;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setWaveform(Array.from(data.slice(0, 20), (value) => Math.max(8, Math.round(value / 4))));
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const startVad = useCallback(async (stream: MediaStream) => {
    if (session?.state !== "PART_1" && session?.state !== "PART_3") return;
    try {
      const { MicVAD } = await import("@ricky0123/vad-web");
      const vad = await MicVAD.new({
        model: "legacy",
        baseAssetPath: VAD_ASSET_PATH,
        onnxWASMBasePath: VAD_WASM_PATH,
        getStream: async () => stream,
        pauseStream: async () => {
          // MediaRecorder owns the stream and stops it after the audio is saved.
        },
        resumeStream: async () => stream,
        startOnLoad: false,
        processorType: "auto",
        positiveSpeechThreshold: 0.72,
        negativeSpeechThreshold: 0.48,
        redemptionMs: VAD_SILENCE_MS,
        minSpeechMs: 300,
        submitUserSpeechOnPause: false,
        onSpeechStart: () => setVadActivity("SPEAKING"),
        onSpeechEnd: () => {
          setVadActivity("SILENT");
          const durationMs = Date.now() - recordingStartedRef.current;
          if (durationMs < 4_000) {
            console.warn("[speaking-examiner-vad] auto-stop-too-early", { durationMs, redemptionMs: VAD_SILENCE_MS });
            return;
          }
          stopRecordingRef.current();
        },
        onVADMisfire: () => setVadActivity("SILENT"),
      });
      vadRef.current = vad;
      await vad.start();
    } catch (reason) {
      console.warn("Browser VAD is unavailable; manual stop remains enabled", reason);
    }
  }, [session?.state]);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const durationMs = Math.max(1, Date.now() - recordingStartedRef.current);
        cleanupCapture();
        setRecording({ blob, durationMs, clientTurnId: crypto.randomUUID(), url: URL.createObjectURL(blob) });
        setRecordingSeconds(Math.ceil(durationMs / 1_000));
        setCaptureStatus("RECORDED");
      };
      recordingStartedRef.current = Date.now();
      recorder.start(250);
      setCaptureStatus("RECORDING");
      setRecordingSeconds(0);
      startWaveform(stream);
      void startVad(stream);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartedRef.current) / 1_000);
        setRecordingSeconds(elapsed);
        if (elapsed >= maxAnswerSeconds) stopRecordingRef.current();
      }, 250);
    } catch (reason) {
      cleanupCapture();
      setError(reason instanceof DOMException && reason.name === "NotAllowedError"
        ? "Microphone đang bị chặn. Hãy cho phép truy cập rồi thử lại."
        : "Không thể mở microphone. Hãy kiểm tra thiết bị và thử lại.");
    }
  }, [cleanupCapture, maxAnswerSeconds, startVad, startWaveform]);

  const playPrompt = useCallback(async () => {
    if (!promptUrl || !promptAudioRef.current) {
      setPlaybackBlocked(true);
      return;
    }
    try {
      if (promptPlaying) {
        promptAudioRef.current.pause();
        setPromptPlaying(false);
        return;
      }
      promptAudioRef.current.currentTime = 0;
      await promptAudioRef.current.play();
      setPromptPlaying(true);
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }, [promptPlaying, promptUrl]);

  useEffect(() => {
    if (!entered || !promptUrl || !promptAudioRef.current) return;
    promptAudioRef.current.currentTime = 0;
    void promptAudioRef.current.play()
      .then(() => {
        setPromptPlaying(true);
        setPlaybackBlocked(false);
      })
      .catch(() => setPlaybackBlocked(true));
  }, [currentTurn?.turnId, entered, promptUrl]);

  async function refreshAfterConflict(message = "Phiên đã được cập nhật. Nội dung mới nhất đã được tải lại.") {
    if (!session) return;
    const refreshed = await getSpeakingExaminerSession(session.sessionId);
    setSession(refreshed);
    resetRecording();
    setError(message);
  }

  async function submitAnswer() {
    if (!session || !currentTurn || !recording || captureStatus === "UPLOADING" || captureStatus === "PROCESSING") return;
    setError("");
    try {
      let storageKey = recording.storageKey;
      if (!storageKey) {
        setCaptureStatus("UPLOADING");
        const uploaded = await uploadSpeakingAudio(attemptId, currentTurn.turnId, recording.blob);
        storageKey = uploaded.storageKey;
        setRecording((value) => value ? { ...value, storageKey } : value);
      }
      setCaptureStatus("PROCESSING");
      const result = await submitSpeakingExaminerTurn(session.sessionId, {
        clientTurnId: recording.clientTurnId,
        examinerTurnId: currentTurn.turnId,
        stateVersion: session.stateVersion,
        storageKey,
        durationMs: recording.durationMs,
      });
      const nextSession: SpeakingExaminerSession = {
        ...session,
        state: result.state,
        stateVersion: result.stateVersion,
        adaptiveFollowUpsUsed: result.adaptiveFollowUpsUsed,
        currentTurn: result.nextTurn,
        completedAt: result.examCompleted ? new Date().toISOString() : session.completedAt,
      };
      if (result.state === "PART_2_PREPARATION") {
        const started = Date.now();
        localStorage.setItem(`speaking-exam-prep-${session.sessionId}-${result.stateVersion}`, String(started));
        setPrepRecovery(false);
        setPrepRemaining(result.nextTurn?.preparationTimeSeconds ?? 60);
      }
      setSession(nextSession);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        await refreshAfterConflict();
        return;
      }
      setCaptureStatus("RECORDED");
      setError(reason instanceof Error ? reason.message : "Không thể gửi câu trả lời. Bản ghi vẫn được giữ để thử lại.");
    }
  }

  async function markReady() {
    if (!session) return;
    setError("");
    try {
      const updated = await markSpeakingExamPartTwoReady(session.sessionId, { stateVersion: session.stateVersion });
      localStorage.removeItem(`speaking-exam-prep-${session.sessionId}-${session.stateVersion}`);
      setSession(updated);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        await refreshAfterConflict();
        return;
      }
      setError(reason instanceof Error ? reason.message : "Không thể chuyển sang bài nói Part 2.");
    }
  }

  async function abortSession() {
    if (!session) return;
    setError("");
    try {
      const aborted = await abortSpeakingExamSession(session.sessionId, { stateVersion: session.stateVersion });
      cleanupCapture();
      setShowAbort(false);
      setSession(aborted);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        setShowAbort(false);
        await refreshAfterConflict();
        return;
      }
      setError(reason instanceof Error ? reason.message : "Không thể kết thúc phiên lúc này.");
    }
  }

  const cueCard = useMemo(() => {
    if (!currentTurn || (currentTurn.kind !== "CUE_CARD" && session?.state !== "PART_2_PREPARATION")) return null;
    const [title, details = ""] = currentTurn.promptText.split(/\s+You should say:\s+/i);
    return { title, bullets: details.replace(/\.$/, "").split(";").map((item) => item.trim()).filter(Boolean) };
  }, [currentTurn, session?.state]);

  if (loading) {
    return <main className={styles.statePage}><CircleNotch size={30} className={styles.spin} /><p>Đang mở phòng luyện nói…</p></main>;
  }

  if (!session) {
    return <main className={styles.statePage}>
      <WarningCircle size={38} weight="duotone" />
      <h1>Không thể mở AI Examiner</h1>
      <p>{error || "Phiên luyện nói chưa sẵn sàng."}</p>
      <button type="button" onClick={() => void loadSession()}>Thử lại</button>
      <Link href="/student/practice?skill=SPEAKING">Về trang Speaking</Link>
    </main>;
  }

  if (session.state === "EVALUATION_QUEUED" || session.state === "ABORTED") {
    const completed = session.state === "EVALUATION_QUEUED";
    return <main className={styles.completionPage}>
      <span className={styles.completionIcon}>{completed ? <CheckCircle size={34} weight="fill" /> : <X size={30} />}</span>
      <p className={styles.eyebrow}>{completed ? "Phiên luyện nói đã lưu" : "Phiên đã kết thúc"}</p>
      <h1>{completed ? "Bài Speaking đã được ghi nhận" : "Bạn đã dừng phiên luyện nói"}</h1>
      <p>{completed
        ? "Các câu trả lời đã gửi được lưu trong phiên luyện nói."
        : "Bạn có thể quay lại thư viện để chọn một bài luyện khác."}</p>
      {completed ? <div className={styles.resultNotice}>
        <strong>Chờ đánh giá</strong>
        <span>Kết quả chưa có sẵn cho phiên này. Band AI, khi có, chỉ là mức ước lượng.</span>
      </div> : null}
      <button type="button" onClick={() => router.push("/student/practice?skill=SPEAKING")}>Về trang Speaking <ArrowRight size={17} /></button>
    </main>;
  }

  if (!entered) {
    return <main className={styles.welcomePage}>
      <Link href="/student/practice?skill=SPEAKING" className={styles.backLink}><ArrowLeft size={16} /> Speaking</Link>
      <section className={styles.welcomePanel}>
        <p className={styles.eyebrow}>AI Speaking Examiner</p>
        <h1>{session.state === "MIC_CHECK" ? "Luyện Speaking như một cuộc phỏng vấn thật" : "Tiếp tục phiên luyện nói"}</h1>
        <p className={styles.welcomeLead}>{session.state === "MIC_CHECK"
          ? "Nghe câu hỏi, trả lời bằng giọng nói và hoàn thành lần lượt ba phần."
          : `Bạn đang ở ${stateLabel(session.state)}. Phiên sẽ tiếp tục đúng câu hỏi đã lưu.`}</p>
        <div className={styles.partPreview}>
          <div><span>01</span><strong>Part 1</strong><small>Câu hỏi quen thuộc</small></div>
          <div><span>02</span><strong>Part 2</strong><small>Cue card và bài nói dài</small></div>
          <div><span>03</span><strong>Part 3</strong><small>Thảo luận mở rộng</small></div>
        </div>
        <div className={styles.welcomeActions}>
          <button type="button" onClick={() => setEntered(true)}>{session.state === "MIC_CHECK" ? "Kiểm tra microphone" : "Tiếp tục phiên"}<ArrowRight size={17} /></button>
          <span><Headphones size={16} /> Nên dùng tai nghe và chọn nơi yên tĩnh</span>
        </div>
      </section>
      <p className={styles.quietNote}>Không có góp ý giữa bài. Kết quả AI không thay thế điểm IELTS chính thức.</p>
    </main>;
  }

  return <div className={styles.examShell}>
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <span className={styles.brandMark}>IS</span>
        <div><strong>The IELTS Spells</strong><small>AI Speaking Examiner</small></div>
      </div>
      <ol className={styles.stepper} aria-label="Tiến trình bài Speaking">
        {steps.map((step, index) => <li key={step} className={index === currentStep ? styles.activeStep : index < currentStep ? styles.doneStep : ""}>
          <span>{index < currentStep ? <Check size={13} weight="bold" /> : index + 1}</span><em>{step}</em>
        </li>)}
      </ol>
      <button type="button" className={styles.abortButton} onClick={() => setShowAbort(true)}>Kết thúc phiên</button>
    </header>

    <main className={styles.workspace}>
      <div className={styles.stageBar}>
        <div><span className={styles.liveDot} /> Đã kết nối</div>
        <strong>{stateLabel(session.state)}</strong>
      </div>

      {error ? <div className={styles.errorBanner} role="alert"><WarningCircle size={18} weight="fill" /><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Đóng"><X size={15} /></button></div> : null}

      {session.state === "PART_2_PREPARATION" && cueCard ? (
        <section className={styles.preparationLayout}>
          <CueCard title={cueCard.title} bullets={cueCard.bullets} />
          <div className={styles.preparationPanel}>
            <p className={styles.eyebrow}>Part 2 · Chuẩn bị</p>
            <h1>Chuẩn bị câu trả lời</h1>
            {prepRecovery ? <div className={styles.recoveryNote}>
              <WarningCircle size={20} />
              <p><strong>Không thể khôi phục đồng hồ chuẩn bị.</strong><span>Cue card vẫn được giữ nguyên. Bắt đầu khi bạn đã sẵn sàng.</span></p>
            </div> : <div className={styles.prepTimer}><strong>{formatSeconds(prepRemaining ?? preparationSeconds)}</strong><span>thời gian chuẩn bị còn lại</span></div>}
            <p className={styles.helper}>Microphone chưa ghi âm trong bước này.</p>
            <button type="button" className={styles.primaryButton} onClick={() => void markReady()}>
              {prepRemaining === 0 ? "Bắt đầu trả lời" : "Tôi đã sẵn sàng"}<ArrowRight size={17} />
            </button>
          </div>
        </section>
      ) : currentTurn ? (
        <section className={`${styles.turnLayout} ${cueCard ? styles.longTurnLayout : ""}`}>
          {cueCard ? <CueCard title={cueCard.title} bullets={cueCard.bullets} /> : null}
          <div className={styles.turnColumn}>
            <div className={styles.questionBlock}>
              <p className={styles.eyebrow}>{stateLabel(session.state)}</p>
              <h1>{cueCard ? "Bạn có thể bắt đầu khi đã sẵn sàng." : currentTurn.promptText}</h1>
              <div className={styles.promptControls}>
                <button type="button" onClick={() => void playPrompt()} disabled={!promptUrl}>
                  {promptPlaying ? <Pause size={17} weight="fill" /> : <SpeakerHigh size={18} weight="fill" />}
                  {promptPlaying ? "Examiner đang nói" : "Phát câu hỏi"}
                </button>
                {playbackBlocked ? <span>Nhấn để phát lại câu hỏi.</span> : <span>Nghe câu hỏi trước khi trả lời.</span>}
              </div>
              <audio ref={promptAudioRef} src={promptUrl || undefined} onEnded={() => setPromptPlaying(false)} onPause={() => setPromptPlaying(false)} />
            </div>

            <div className={`${styles.recorderPanel} ${captureStatus === "RECORDING" ? styles.recordingPanel : ""}`}>
              <div className={styles.recorderHeading}>
                <div><span>{captureStatus === "RECORDING" ? "Đang ghi âm" : captureStatus === "RECORDED" ? "Đã ghi âm" : "Đến lượt bạn"}</span>
                  <strong>{formatSeconds(recordingSeconds)} <small>/ {formatSeconds(maxAnswerSeconds)}</small></strong></div>
                <span className={styles.micBadge}><Microphone size={21} weight="fill" /></span>
              </div>

              <div className={styles.waveform} aria-label={captureStatus === "RECORDING" ? "Mức âm thanh microphone" : "Chưa ghi âm"}>
                {waveform.map((height, index) => <i key={index} style={{ height: `${height}px` }} />)}
              </div>

              {captureStatus === "RECORDING" ? <p className={styles.captureHint}>
                {session.state === "PART_1" || session.state === "PART_3"
                  ? vadActivity === "SPEAKING" ? "Đang nghe bạn nói" : "Tự dừng sau một khoảng im lặng"
                  : isPartTwoLongTurn ? "Bạn có thể ngừng một chút để suy nghĩ" : "Hãy trả lời bằng tiếng Anh"}
              </p> : null}

              <div className={styles.recordActions}>
                {captureStatus === "READY" ? <button type="button" className={styles.primaryButton} onClick={() => void startRecording()} disabled={promptPlaying}>
                  <Microphone size={18} weight="fill" /> Bắt đầu trả lời
                </button> : null}
                {captureStatus === "RECORDING" ? <button type="button" className={styles.stopButton} onClick={() => stopRecording()}>
                  <Stop size={17} weight="fill" /> Dừng trả lời
                </button> : null}
                {captureStatus === "RECORDED" && recording ? <>
                  <audio ref={answerAudioRef} src={recording.url} onEnded={() => undefined} />
                  <button type="button" className={styles.secondaryButton} onClick={() => void answerAudioRef.current?.play()}><Play size={17} weight="fill" /> Nghe lại</button>
                  <button type="button" className={styles.textButton} onClick={resetRecording}>Ghi lại</button>
                  <button type="button" className={styles.primaryButton} onClick={() => void submitAnswer()}>Gửi câu trả lời <ArrowRight size={17} /></button>
                </> : null}
                {captureStatus === "UPLOADING" || captureStatus === "PROCESSING" ? <div className={styles.processing}><CircleNotch size={21} className={styles.spin} />
                  <span>{captureStatus === "UPLOADING" ? "Đang tải bản ghi âm" : "Đang xử lý câu trả lời"}</span></div> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>

    {showAbort ? <div className={styles.dialogBackdrop} role="presentation" onMouseDown={() => setShowAbort(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="abort-title" className={styles.dialog} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className={styles.dialogClose} onClick={() => setShowAbort(false)} aria-label="Đóng"><X size={18} /></button>
        <span className={styles.dialogIcon}><WarningCircle size={27} /></span>
        <h2 id="abort-title">Kết thúc phiên luyện nói?</h2>
        <p>Phiên này sẽ kết thúc và bạn không thể tiếp tục trả lời.</p>
        <div><button type="button" className={styles.secondaryButton} onClick={() => setShowAbort(false)} autoFocus>Tiếp tục làm bài</button>
          <button type="button" className={styles.dangerButton} onClick={() => void abortSession()}>Kết thúc phiên</button></div>
      </section>
    </div> : null}
  </div>;
}

function CueCard({ title, bullets }: { title: string; bullets: string[] }) {
  return <article className={styles.cueCard}>
    <p>Cue card</p>
    <h2>{title}</h2>
    {bullets.length ? <><span>You should say:</span><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></> : null}
  </article>;
}
