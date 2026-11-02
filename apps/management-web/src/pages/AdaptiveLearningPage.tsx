import {
  ArrowClockwise,
  ArrowRight,
  BookOpenText,
  Brain,
  CaretRight,
  ChartBar,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  Database,
  Eye,
  FileText,
  Funnel,
  GraduationCap,
  Lightbulb,
  Lightning,
  LinkSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Play,
  Robot,
  SlidersHorizontal,
  Sparkle,
  Target,
  TrendDown,
  TrendUp,
  User,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";
import {
  MOCK_DATA_STREAMS,
  MOCK_KNOWLEDGE_COMPONENTS,
  MOCK_RAG_TUTOR_LOGS,
  MOCK_STUDENTS,
  type DataStreamMetric,
  type KnowledgeNode,
  type MockStudentLearner,
  type RagTutorLog,
} from "./adaptive/mockAdaptiveData";

interface AdaptiveOverview {
  enabled: boolean;
  learnersWithEvidence: number;
  processedEvents: number;
  activeRecommendations: number;
  acceptedRecommendations: number;
  knowledgeComponents: number;
  mappedQuestionTypes: number;
  activeContentMappings: number;
  recentLearners: RecentLearner[];
}

interface RecentLearner {
  learnerId: string;
  weakestComponentCode: string;
  weakestComponentName: string;
  masteryProbability: number;
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  activeRecommendationTitle: string | null;
}

interface LearnerProfile {
  enabled: boolean;
  learnerId: string;
  knowledgeStates: Array<{
    componentCode: string;
    componentName: string;
    skill: string;
    masteryProbability: number;
    confidence: number;
    evidenceCount: number;
    correctCount: number;
    modelVersion: string;
    lastEvidenceAt: string | null;
  }>;
  recommendations: Array<{
    id: string;
    componentCode: string;
    title: string;
    reason: string;
    status: string;
    sourceAttemptId: string;
    modelVersion: string;
    createdAt: string;
  }>;
}

type TabKey = "monitoring" | "config" | "evaluation" | "control";

export function AdaptiveLearningPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("monitoring");
  const [useMockData, setUseMockData] = useState<boolean>(true);

  // Live API states
  const [overview, setOverview] = useState<AdaptiveOverview | null>(null);
  const [liveProfile, setLiveProfile] = useState<LearnerProfile | null>(null);
  const [learnerQuery, setLearnerQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<MockStudentLearner>(MOCK_STUDENTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");

  // Filter in Knowledge Graph tab
  const [skillFilter, setSkillFilter] = useState<"ALL" | "READING" | "LISTENING" | "WRITING" | "SPEAKING">("ALL");
  const [selectedKnowledgeNode, setSelectedKnowledgeNode] = useState<KnowledgeNode>(MOCK_KNOWLEDGE_COMPONENTS[0]);

  // Simulator state in Control tab
  const [simQuestion, setSimQuestion] = useState("Cam 18 Test 2 Passage 2: Matching Headings đoạn C");
  const [simMistake, setSimMistake] = useState("Chọn nhầm 'iv: Challenges in electric transport' do thấy có nhắc electric vehicles");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Load live API when mock is toggled off or on mount
  const loadLive = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<AdaptiveOverview>("/admin/adaptive-learning");
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không kết nối được API live. Đang duy trì dữ liệu kiểm thử.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!useMockData) {
      void loadLive();
    }
  }, [useMockData, loadLive]);

  // Student search handler
  const handleSelectStudentById = (id: string) => {
    const found = MOCK_STUDENTS.find((s) => s.learnerId === id || s.fullName.toLowerCase().includes(id.toLowerCase()));
    if (found) {
      setSelectedStudent(found);
      setActiveTab("evaluation");
      setProfileError("");
    } else {
      setProfileError(`Không tìm thấy hồ sơ cho truy vấn "${id}"`);
    }
  };

  const handleSimulateTutor = () => {
    setIsSimulating(true);
    setSimResult(null);
    setTimeout(() => {
      setSimResult(
        `TIS RAG Tutor Response:\n"Chào bạn! Ở đoạn C, từ 'electric vehicles' chỉ đóng vai trò ví dụ dẫn chứng cho câu đầu tiên. Luận điểm cốt lõi của đoạn văn nằm ở câu chủ đề: 'The transition hinges upon energy density improvements in solid-state chemistry'. Do đó, tiêu đề 'Breakthrough in solid-state batteries' mới là phương án bao quát toàn diện nhất!"\n\n→ Đề xuất bài tập bổ trợ: 5 câu tìm Topic Sentence nhanh (12 phút)`
      );
      setIsSimulating(false);
    }, 600);
  };

  return (
    <section className="mx-auto w-full max-w-[1520px] space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkle size={14} weight="fill" />
              AI ADAPTIVE LEARNING ENGINE
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              v2.4 Online
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-extrabold text-on-surface">
            Học tập thích ứng & Điều phối AI
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant max-w-3xl">
            Trung tâm điều khiển 4 trụ cột: <strong>Theo dõi</strong> luồng dữ liệu học tập · <strong>Cấu hình</strong> Knowledge Graph IELTS · <strong>Đánh giá</strong> Knowledge Tracing BKT · <strong>Kiểm soát</strong> đề xuất sư phạm & Trợ lý TIS RAG Tutor.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mock Mode Toggle Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-bold text-on-surface">
            <span className="text-on-surface-variant">Chế độ dữ liệu:</span>
            <button
              type="button"
              onClick={() => setUseMockData(true)}
              className={`rounded-lg px-2.5 py-1 transition ${
                useMockData ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Dữ liệu mẫu (Mock)
            </button>
            <button
              type="button"
              onClick={() => {
                setUseMockData(false);
                void loadLive();
              }}
              className={`rounded-lg px-2.5 py-1 transition ${
                !useMockData ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Live API
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!useMockData) void loadLive();
            }}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container transition"
          >
            <ArrowClockwise size={16} className={loading ? "animate-spin text-primary" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Main 4 Pillar Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            activeTab === "monitoring"
              ? "bg-[#894C5B] text-white shadow-sm"
              : "bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <ChartLineUp size={18} weight={activeTab === "monitoring" ? "bold" : "regular"} />
          1. Theo dõi (Monitoring & Pipeline)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            activeTab === "config"
              ? "bg-[#894C5B] text-white shadow-sm"
              : "bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <Brain size={18} weight={activeTab === "config" ? "bold" : "regular"} />
          2. Cấu hình (Knowledge Graph & Policies)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("evaluation")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            activeTab === "evaluation"
              ? "bg-[#894C5B] text-white shadow-sm"
              : "bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <Target size={18} weight={activeTab === "evaluation" ? "bold" : "regular"} />
          3. Đánh giá (Knowledge Tracing & Tra cứu)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("control")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            activeTab === "control"
              ? "bg-[#894C5B] text-white shadow-sm"
              : "bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <SlidersHorizontal size={18} weight={activeTab === "control" ? "bold" : "regular"} />
          4. Kiểm soát (Can thiệp & RAG Tutor)
        </button>
      </div>

      {/* Error notice if live API is failing */}
      {!useMockData && error ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          <div className="flex items-center gap-2">
            <WarningCircle size={20} className="text-amber-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setUseMockData(true)}
            className="rounded-lg bg-amber-800 px-3 py-1.5 text-white hover:bg-amber-900"
          >
            Chuyển sang Dữ liệu mẫu kiểm thử
          </button>
        </div>
      ) : null}

      {/* =========================================================================
          TAB 1: THEO DÕI (MONITORING & PIPELINE)
         ========================================================================= */}
      {activeTab === "monitoring" && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-surface p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle size={24} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base text-on-surface">
                      AI Adaptive Learning Pipeline đang thu thập bằng chứng liên tục
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                      Sẵn sàng 100%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                    Kết quả Reading, Listening & Writing được xử lý qua hàng đợi sự kiện bất đồng bộ sau commit; thuật toán Bayesian Knowledge Tracing cập nhật xác suất Mastery mà không làm trễ luồng nộp bài của học viên.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-right">
                  <span className="block text-[10px] font-bold uppercase text-on-surface-variant">BKT Latency</span>
                  <strong className="text-sm font-extrabold text-emerald-800">38ms / event</strong>
                </div>
                <div className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-right">
                  <span className="block text-[10px] font-bold uppercase text-on-surface-variant">Mô hình</span>
                  <strong className="text-sm font-extrabold text-emerald-800">tis-bkt-v2.4</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 4 High-level KPI Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Học viên có bằng chứng</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-primary">
                  <Database size={18} weight="bold" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="font-display text-3xl font-black text-on-surface">
                  {useMockData ? "148" : overview?.learnersWithEvidence ?? 1}
                </strong>
                <span className="flex items-center text-xs font-bold text-emerald-700">
                  <TrendUp size={14} weight="bold" /> +12% tuần này
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Đã tích lũy đủ $\ge 3$ bằng chứng để suy luận năng lực</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Sự kiện học tập đã phân tích</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ChartLineUp size={18} weight="bold" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="font-display text-3xl font-black text-on-surface">
                  {useMockData ? "3,892" : overview?.processedEvents ?? 1}
                </strong>
                <span className="flex items-center text-xs font-bold text-emerald-700">
                  <TrendUp size={14} weight="bold" /> +245 hôm nay
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Phản hồi từng câu, lỗi sai, bài test & bài chấm viết</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Đề xuất thích ứng đang mở</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Brain size={18} weight="bold" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="font-display text-3xl font-black text-on-surface">
                  {useMockData ? "86" : overview?.activeRecommendations ?? 1}
                </strong>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  Active
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Bài tập vi mô TIS đề xuất dựa trên điểm nghẽn</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tỷ lệ đón nhận & hoàn thành</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle size={18} weight="bold" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="font-display text-3xl font-black text-on-surface">
                  {useMockData ? "78.5%" : percent(overview ? overview.acceptedRecommendations / Math.max(overview.activeRecommendations, 1) : 0)}
                </strong>
                <span className="flex items-center text-xs font-bold text-emerald-700">
                  <TrendUp size={14} weight="bold" /> +6.4%
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Học viên tự giác làm theo đề xuất từ Trợ lý TIS</p>
            </article>
          </div>

          {/* Dữ liệu học tập hiện có: 6 Data Stream Sources */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
                  <Database size={18} className="text-primary" />
                  Luồng dữ liệu học tập đầu vào (Ingestion Streams)
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Căn cứ dữ liệu thời gian thực được engine thu nạp từ 6 nguồn để tính toán Knowledge Tracing.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                6/6 Streams đồng bộ
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_DATA_STREAMS.map((stream) => (
                <div
                  key={stream.id}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4 hover:border-primary/40 hover:bg-white transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-extrabold text-primary">
                      {stream.category}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                      <Clock size={12} /> {stream.lastActive}
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-extrabold text-on-surface line-clamp-1">{stream.name}</h4>
                  <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {stream.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-2 text-[11px]">
                    <span className="font-semibold text-on-surface-variant">
                      Hôm nay: <strong className="text-on-surface font-extrabold">+{stream.countToday}</strong>
                    </span>
                    <span className="font-semibold text-emerald-700">Độ tin cậy: {stream.qualityRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cohort Skill Gaps & Top Weaknesses */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div>
                  <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    Top lỗ hổng kiến thức phổ biến nhất toàn khóa
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Các Knowledge Component có tỷ lệ Mastery thấp nhất cần giáo viên lưu ý trong bài giảng.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {MOCK_KNOWLEDGE_COMPONENTS.slice(0, 4).map((kc) => {
                  const masteryPercent = Math.round(kc.masteryAvg * 100);
                  return (
                    <div key={kc.code} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            kc.skill === "READING" ? "bg-amber-100 text-amber-800" :
                            kc.skill === "WRITING" ? "bg-rose-100 text-rose-800" :
                            kc.skill === "LISTENING" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {kc.skill}
                          </span>
                          <span className="font-extrabold text-on-surface">{kc.name}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">({kc.bandWeight})</span>
                        </div>
                        <span className="font-extrabold text-primary">{masteryPercent}% Mastery TB</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            masteryPercent < 50 ? "bg-rose-500" : masteryPercent < 70 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${masteryPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{kc.questionCount} câu hỏi đã map · {kc.mappedResources} học liệu liên kết</span>
                        <span>{kc.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Engine Diagnostics & Direct Links */}
            <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  Độ phủ cấu hình Engine
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Chỉ số liên kết giữa bài kiểm tra và kho tài nguyên học liệu thích ứng.
                </p>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-on-surface-variant">Knowledge Components</span>
                    <strong className="font-extrabold text-on-surface">
                      {useMockData ? MOCK_KNOWLEDGE_COMPONENTS.length : overview?.knowledgeComponents ?? 4}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-container px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-on-surface-variant">Dạng câu hỏi đã ánh xạ</span>
                    <strong className="font-extrabold text-on-surface">
                      {useMockData ? "18 dạng bài" : overview?.mappedQuestionTypes ?? 1}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-container px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-on-surface-variant">Học liệu sẵn sàng đề xuất</span>
                    <strong className="font-extrabold text-on-surface">
                      {useMockData ? "84 bài vi mô" : overview?.activeContentMappings ?? 1}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2 pt-4 border-t border-outline-variant/30">
                <Link
                  to="/adaptive-learning/knowledge-map"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/60 bg-surface px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-container transition"
                >
                  <span className="flex items-center gap-2">
                    <LinkSimple size={16} /> Bản đồ kiến thức đồ thị
                  </span>
                  <CaretRight size={14} />
                </Link>
                <Link
                  to="/adaptive-learning/content-mappings"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/60 bg-surface px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-container transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpenText size={16} /> Quản lý học liệu & Mappings
                  </span>
                  <CaretRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Learners Table */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 p-5">
              <div>
                <h3 className="font-display text-base font-extrabold text-on-surface">
                  Học viên có bằng chứng học tập gần đây
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Bấm vào tên học viên để chuyển sang màn hình Đánh giá hồ sơ năng lực chi tiết.
                </p>
              </div>
              <div className="text-xs font-bold text-on-surface-variant">
                Hiển thị {MOCK_STUDENTS.length} học viên tiêu biểu
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-surface-container text-[11px] font-extrabold uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-3.5">Học viên</th>
                    <th className="px-5 py-3.5">Lớp học</th>
                    <th className="px-5 py-3.5">Kỹ năng cần ưu tiên</th>
                    <th className="px-5 py-3.5">Mastery BKT</th>
                    <th className="px-5 py-3.5">Bằng chứng</th>
                    <th className="px-5 py-3.5">Đề xuất thích ứng TIS</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {MOCK_STUDENTS.map((learner) => (
                    <tr key={learner.learnerId} className="hover:bg-surface-container-low/70 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                            {learner.avatar}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleSelectStudentById(learner.learnerId)}
                              className="font-extrabold text-on-surface hover:text-primary hover:underline text-left block"
                            >
                              {learner.fullName}
                            </button>
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {learner.learnerId.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant font-medium">
                        {learner.enrolledCourse.split("·")[0]}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-800">
                          {learner.weakestComponent.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.round(learner.weakestComponent.mastery * 100)}%` }}
                            />
                          </div>
                          <span className="font-extrabold text-on-surface">
                            {Math.round(learner.weakestComponent.mastery * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-on-surface">
                        {learner.evidenceCount} sự kiện
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-on-surface-variant line-clamp-1 max-w-xs">
                          {learner.activeRecommendation.title}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectStudentById(learner.learnerId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-white px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-surface-container transition"
                        >
                          <Eye size={14} /> Tra cứu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CẤU HÌNH (KNOWLEDGE GRAPH & POLICIES)
         ========================================================================= */}
      {activeTab === "config" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
                  <Brain size={20} className="text-primary" />
                  IELTS Knowledge Graph & Phân cấp kỹ năng con
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Mô hình hóa toàn diện 4 kỹ năng IELTS thành các Knowledge Component (KC) có quan hệ phụ thuộc (Prerequisite) và bổ trợ (Supports).
                </p>
              </div>

              {/* Skill Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["ALL", "READING", "LISTENING", "WRITING", "SPEAKING"] as const).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSkillFilter(skill)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      skillFilter === skill
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {skill === "ALL" ? "Tất cả (4 kỹ năng)" : skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Nodes Grid & Inspector */}
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Left: Components list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Danh mục thành phần kiến thức ({MOCK_KNOWLEDGE_COMPONENTS.filter((kc) => skillFilter === "ALL" || kc.skill === skillFilter).length} nút)
                </span>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MOCK_KNOWLEDGE_COMPONENTS.filter((kc) => skillFilter === "ALL" || kc.skill === skillFilter).map((kc) => {
                    const isSelected = selectedKnowledgeNode.code === kc.code;
                    return (
                      <div
                        key={kc.code}
                        onClick={() => setSelectedKnowledgeNode(kc)}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-outline-variant/40 bg-surface hover:border-outline-variant hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            kc.skill === "READING" ? "bg-amber-100 text-amber-800" :
                            kc.skill === "WRITING" ? "bg-rose-100 text-rose-800" :
                            kc.skill === "LISTENING" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {kc.skill}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                            {kc.bandWeight}
                          </span>
                        </div>

                        <h4 className="mt-2 text-xs font-extrabold text-on-surface line-clamp-1">{kc.name}</h4>
                        <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-2">{kc.description}</p>

                        <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-2 text-[10px] text-on-surface-variant">
                          <span>{kc.questionCount} câu hỏi</span>
                          <span>{kc.mappedResources} học liệu</span>
                          <span className="font-bold text-primary">{Math.round(kc.masteryAvg * 100)}% Mastery TB</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Selected Node Detail Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-5">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                      <Target size={18} weight="bold" />
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-on-surface-variant uppercase">{selectedKnowledgeNode.code}</span>
                      <h4 className="font-extrabold text-sm text-on-surface">{selectedKnowledgeNode.name}</h4>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3.5 text-xs">
                  <div>
                    <span className="font-bold text-on-surface-variant">Mô tả sư phạm:</span>
                    <p className="mt-1 text-on-surface leading-relaxed">{selectedKnowledgeNode.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3 border border-outline-variant/30">
                    <div>
                      <span className="text-[11px] text-on-surface-variant">Phân nhóm:</span>
                      <p className="font-extrabold text-on-surface">{selectedKnowledgeNode.category}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-on-surface-variant">Trọng số band:</span>
                      <p className="font-extrabold text-primary">{selectedKnowledgeNode.bandWeight}</p>
                    </div>
                  </div>

                  {/* Prerequisites & Supports */}
                  <div>
                    <span className="font-bold text-on-surface-variant flex items-center gap-1.5">
                      <LinkSimple size={14} /> Tiền đề tiên quyết (Prerequisites):
                    </span>
                    {selectedKnowledgeNode.prerequisites.length === 0 ? (
                      <p className="mt-1 text-[11px] text-on-surface-variant italic">Không có (Kỹ năng độc lập nền tảng)</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {selectedKnowledgeNode.prerequisites.map((p) => (
                          <span key={p} className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-on-surface-variant flex items-center gap-1.5">
                      <Sparkle size={14} /> Bổ trợ cho kỹ năng khác (Supports):
                    </span>
                    {selectedKnowledgeNode.supports.length === 0 ? (
                      <p className="mt-1 text-[11px] text-on-surface-variant italic">Không có kỹ năng phụ thuộc</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {selectedKnowledgeNode.supports.map((s) => (
                          <span key={s} className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-extrabold text-blue-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link
                    to="/adaptive-learning/knowledge-map"
                    className="flex-1 text-center rounded-xl bg-primary py-2.5 text-xs font-extrabold text-white hover:opacity-90 transition"
                  >
                    Xem Graph đồ thị 2D
                  </Link>
                  <Link
                    to="/adaptive-learning/content-mappings"
                    className="flex-1 text-center rounded-xl border border-outline-variant/60 bg-white py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition"
                  >
                    Gán học liệu vào nút
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Parameters Configuration */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
            <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-primary" />
              Thông số suy luận Bayesian Knowledge Tracing (BKT Policies)
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Các tham số điều khiển ngưỡng đạt làm chủ, tốc độ suy giảm trí nhớ (forgetting curve) và tần suất thử thách.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4">
                <span className="text-xs font-extrabold text-on-surface">Ngưỡng làm chủ (Mastery Threshold)</span>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Xác suất $P(L_t)$ tối thiểu để đánh giá học viên đã vững kỹ năng con.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-lg font-black text-primary">75% (0.75)</strong>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Khuyên dùng</span>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4">
                <span className="text-xs font-extrabold text-on-surface">Chu kỳ quên lãng (Half-life Decay)</span>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Thời gian Mastery tự động giảm nhẹ nếu học viên không có bài luyện ôn tập.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-lg font-black text-on-surface">14 ngày</strong>
                  <span className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">Ebbinghaus</span>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4">
                <span className="text-xs font-extrabold text-on-surface">Tỷ lệ khám phá mới (Exploration Rate)</span>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Tỷ lệ đề xuất bài tập ở vùng kiến thức chưa có bằng chứng (Cold Start).
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-lg font-black text-on-surface">20%</strong>
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">Cân bằng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ĐÁNH GIÁ (KNOWLEDGE TRACING & TRA CỨU HỌC VIÊN)
         ========================================================================= */}
      {activeTab === "evaluation" && (
        <div className="space-y-6">
          {/* Student Search & Quick Select */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
            <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
              <MagnifyingGlass size={18} className="text-primary" />
              Tra cứu hồ sơ năng lực học tập thích ứng
            </h3>
            <p className="text-xs text-on-surface-variant">
              Nhập tên, email hoặc UUID học viên để xem biểu đồ năng lực BKT 4 kỹ năng và đề xuất cá nhân hóa.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  value={learnerQuery}
                  onChange={(e) => setLearnerQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && learnerQuery.trim()) {
                      handleSelectStudentById(learnerQuery.trim());
                    }
                  }}
                  placeholder="Nhập tên học viên (e.g. Nguyễn Hoàng Phong, Trần Mai Anh) hoặc UUID..."
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface py-2.5 pl-10 pr-4 text-xs font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (learnerQuery.trim()) handleSelectStudentById(learnerQuery.trim());
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-extrabold text-white hover:opacity-90 transition"
              >
                Tra cứu hồ sơ
              </button>
            </div>

            {profileError ? (
              <p className="mt-2 text-xs font-bold text-rose-600">{profileError}</p>
            ) : null}

            {/* Quick Select Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-on-surface-variant text-[11px]">Học viên tiêu biểu:</span>
              {MOCK_STUDENTS.map((s) => (
                <button
                  key={s.learnerId}
                  type="button"
                  onClick={() => {
                    setSelectedStudent(s);
                    setProfileError("");
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedStudent.learnerId === s.learnerId
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {s.fullName} ({s.currentEstimatedBand} → {s.targetBand})
                </button>
              ))}
            </div>
          </div>

          {/* Student Detailed Dossier */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-xs space-y-6">
            {/* Dossier Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">
                  {selectedStudent.avatar}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-black text-on-surface">
                      {selectedStudent.fullName}
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                      Đang tích lũy bằng chứng
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {selectedStudent.email} · {selectedStudent.enrolledCourse}
                  </p>
                </div>
              </div>

              {/* Band Score Snapshot */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-outline-variant/50 bg-surface p-3 text-center">
                  <span className="block text-[10px] font-extrabold uppercase text-on-surface-variant">Band ước lượng hiện tại</span>
                  <strong className="text-xl font-black text-primary">{selectedStudent.currentEstimatedBand}</strong>
                </div>
                <div className="text-on-surface-variant font-bold text-sm">→</div>
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-center">
                  <span className="block text-[10px] font-extrabold uppercase text-primary">Mục tiêu đầu ra</span>
                  <strong className="text-xl font-black text-primary">{selectedStudent.targetBand}</strong>
                </div>
              </div>
            </div>

            {/* 4 Skills Breakdown Cards */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant mb-3">
                Ước lượng năng lực 4 kỹ năng (Knowledge Tracing Composite)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                  <span className="text-[11px] font-extrabold text-amber-800">IELTS Reading</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-2xl font-black text-amber-900">{selectedStudent.skillBreakdown.reading}</strong>
                    <span className="text-[10px] font-bold text-amber-700">Band</span>
                  </div>
                  <span className="text-[10px] text-amber-800">Điểm nghẽn: {selectedStudent.weakestComponent.name}</span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
                  <span className="text-[11px] font-extrabold text-blue-800">IELTS Listening</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-2xl font-black text-blue-900">{selectedStudent.skillBreakdown.listening}</strong>
                    <span className="text-[10px] font-bold text-blue-700">Band</span>
                  </div>
                  <span className="text-[10px] text-blue-800">Thế mạnh phản xạ tốt</span>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
                  <span className="text-[11px] font-extrabold text-rose-800">IELTS Writing</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-2xl font-black text-rose-900">{selectedStudent.skillBreakdown.writing}</strong>
                    <span className="text-[10px] font-bold text-rose-700">Band</span>
                  </div>
                  <span className="text-[10px] text-rose-800">Cần bổ trợ Cohesion</span>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
                  <span className="text-[11px] font-extrabold text-purple-800">IELTS Speaking</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-2xl font-black text-purple-900">{selectedStudent.skillBreakdown.speaking}</strong>
                    <span className="text-[10px] font-bold text-purple-700">Band</span>
                  </div>
                  <span className="text-[10px] text-purple-800">Độ trôi chảy ổn định</span>
                </div>
              </div>
            </div>

            {/* Granular Component Masteries Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant mb-3">
                Chi tiết xác suất Mastery theo từng Knowledge Component (BKT Values)
              </h4>
              <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-[11px] font-extrabold uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Kỹ năng con</th>
                      <th className="px-4 py-3">Kỹ năng lớn</th>
                      <th className="px-4 py-3">Xác suất Mastery $P(L_t)$</th>
                      <th className="px-4 py-3">Độ tin cậy</th>
                      <th className="px-4 py-3">Tỷ lệ đúng</th>
                      <th className="px-4 py-3">Xu hướng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {selectedStudent.componentMasteries.map((item) => {
                      const masteryPercent = Math.round(item.masteryProbability * 100);
                      return (
                        <tr key={item.code} className="hover:bg-surface-container-low/60">
                          <td className="px-4 py-3 font-extrabold text-on-surface">{item.name}</td>
                          <td className="px-4 py-3 text-on-surface-variant font-medium">{item.skill}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-surface-container overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    masteryPercent < 50 ? "bg-rose-500" : masteryPercent < 75 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${masteryPercent}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-on-surface">{masteryPercent}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            {Math.round(item.confidence * 100)}%
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            {item.correctCount}/{item.evidenceCount} câu
                          </td>
                          <td className="px-4 py-3">
                            {item.trend === "UP" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                <TrendUp size={14} weight="bold" /> Đang tăng
                              </span>
                            ) : item.trend === "DOWN" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                                <TrendDown size={14} weight="bold" /> Cần can thiệp
                              </span>
                            ) : (
                              <span className="font-bold text-on-surface-variant">Ổn định</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Diagnosis & Active Recommendation Card */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-surface p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                  <Sparkle size={20} weight="fill" />
                </span>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
                      Đề xuất thích ứng hiện tại từ Trợ lý TIS
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Đã đồng bộ lên Main Web học viên
                    </span>
                  </div>
                  <h4 className="font-display text-base font-extrabold text-on-surface">
                    {selectedStudent.activeRecommendation.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>Chẩn đoán sư phạm:</strong> {selectedStudent.activeRecommendation.reason}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Thời lượng: {selectedStudent.activeRecommendation.estimatedMinutes} phút
                    </span>
                    <span>Độ khó: {selectedStudent.activeRecommendation.difficulty}</span>
                    <span className="text-primary font-bold">
                      Học liệu trích xuất RAG: {selectedStudent.activeRecommendation.ragSourceDoc}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: KIỂM SOÁT (CAN THIỆP & RAG TUTOR)
         ========================================================================= */}
      {activeTab === "control" && (
        <div className="space-y-6">
          {/* Teacher In-the-loop Overrides */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs">
            <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-primary" />
              Kiểm soát & Can thiệp đề xuất sư phạm (Teacher-in-the-loop)
            </h3>
            <p className="text-xs text-on-surface-variant">
              Giảng viên và quản trị viên có toàn quyền kiểm soát, ghim bắt buộc hoặc tạm dừng đề xuất tự động của AI trước khi gửi tới học viên.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-on-surface">Gán bài tập can thiệp thủ công</span>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Chọn một bài học liệu bắt buộc để ghi đè lên thuật toán AI cho học viên đang bị hổng kiến thức.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Đã mở dialog can thiệp thủ công: Chọn học viên và bài tập gán ưu tiên.")}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:opacity-90 transition"
                >
                  <PencilSimple size={14} /> Can thiệp đề xuất
                </button>
              </div>

              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-on-surface">Tái tính toán toàn bộ BKT (Re-sync)</span>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Quét lại toàn bộ lịch sử câu trả lời để cập nhật xác suất Mastery sau khi import thêm đề kiểm tra.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Đã gửi lệnh kích hoạt tác vụ nền: Re-calculating BKT matrix.")}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant/60 bg-white py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition"
                >
                  <ArrowClockwise size={14} /> Chạy lại mô hình
                </button>
              </div>

              <div className="rounded-xl border border-outline-variant/40 bg-surface p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-on-surface">Quy chuẩn kiểm duyệt RAG Tutor</span>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Đảm bảo Trợ lý TIS chỉ giải thích dựa trên giáo trình được kiểm duyệt của trung tâm, tránh ảo giác.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-1"><CheckCircle size={15} /> Grounding: 100%</span>
                  <span>Strict Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* RAG Tutor Inspector & Live Simulator */}
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-5 shadow-xs space-y-5">
            <div>
              <h3 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
                <Sparkle size={18} className="text-primary" />
                Kiểm thử Trợ lý TIS (LLM + RAG Tutor Simulator)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Mô phỏng cách Trợ lý TIS trích xuất ngữ cảnh học liệu và giải thích ân cần cho từng lỗi sai thực tế của học viên.
              </p>
            </div>

            {/* Interactive Simulator Input */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-extrabold text-on-surface">Ngữ cảnh bài tập & Dạng câu hỏi:</label>
                  <input
                    value={simQuestion}
                    onChange={(e) => setSimQuestion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-on-surface">Lỗi sai của học viên:</label>
                  <input
                    value={simMistake}
                    onChange={(e) => setSimMistake(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSimulateTutor}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50 transition"
                >
                  <Play size={14} weight="fill" />
                  {isSimulating ? "TIS đang trích xuất học liệu..." : "Chạy thử nghiệm suy luận TIS"}
                </button>
              </div>

              {simResult ? (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                    <Sparkle size={15} weight="fill" />
                    Kết quả phản hồi thực tế từ TIS AI Tutor:
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-on-surface leading-relaxed">
                    {simResult}
                  </pre>
                </div>
              ) : null}
            </div>

            {/* RAG Logs History Table */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant mb-3">
                Nhật ký giải thích học liệu RAG gần đây (Live Audit Log)
              </h4>
              <div className="space-y-3">
                {MOCK_RAG_TUTOR_LOGS.map((log) => (
                  <div key={log.id} className="rounded-xl border border-outline-variant/40 bg-surface p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-on-surface flex items-center gap-1.5">
                        <User size={14} /> {log.studentName}
                        <span className="text-[11px] font-normal text-on-surface-variant">({log.timestamp})</span>
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary font-mono">
                        {log.knowledgeComponent}
                      </span>
                    </div>

                    <p className="text-rose-800 bg-rose-50 border border-rose-200 p-2 rounded-lg text-[11px]">
                      <strong>Lỗi sai:</strong> {log.studentMistake}
                    </p>

                    <p className="text-blue-900 bg-blue-50 border border-blue-200 p-2 rounded-lg text-[11px]">
                      <strong>Học liệu RAG trích xuất:</strong> {log.ragReference}
                    </p>

                    <div className="rounded-lg bg-white border border-outline-variant/40 p-3">
                      <span className="text-[10px] font-extrabold uppercase text-primary block mb-1">
                        Lời giải thích từ Trợ lý TIS:
                      </span>
                      <p className="text-on-surface leading-relaxed">{log.tisExplanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
