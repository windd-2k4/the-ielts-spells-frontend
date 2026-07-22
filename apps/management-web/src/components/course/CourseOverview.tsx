import {
  Brain,
  CheckCircle,
  Clock,
  Sparkle,
  TrendUp,
  WarningCircle,
  Users,
  Notebook,
} from "@phosphor-icons/react";
import type { AcademicClass, Course } from "../../academic-types";
import { stableMetric } from "../../lib/stable-metric";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
}

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  status: string;
}

type Roster = { enrollment: Enrollment; student: StudentSummary }[];

interface CourseOverviewProps {
  course: Course;
  selectedClass: AcademicClass | null;
  roster: Roster;
  completedSessions: number;
  totalSessions: number;
  setTab: (tab: any) => void;
  onSelectStudent?: (studentId: string) => void;
}

const skills = ["Listening", "Reading", "Writing", "Speaking"] as const;

function percentClass(value: number) {
  if (value >= 80) return "bg-emerald-500 text-emerald-700";
  if (value >= 65) return "bg-amber-500 text-amber-700";
  return "bg-rose-500 text-rose-700";
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const isEmerald = value >= 80;
  const isAmber = value >= 65 && value < 80;
  
  return (
    <div className="bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-on-surface">{label}</span>
        <span className={`text-sm font-extrabold tabular-nums px-2 py-0.5 rounded-md ${
          isEmerald ? "bg-emerald-50 text-emerald-700" : isAmber ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
        }`}>
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container" aria-label={`${label} ${value}%`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isEmerald ? "bg-emerald-500" : isAmber ? "bg-amber-500" : "bg-rose-500"
          }`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

export default function CourseOverview({
  course,
  selectedClass,
  roster,
  completedSessions,
  totalSessions,
  setTab,
  onSelectStudent,
}: CourseOverviewProps) {
  const average = roster.length
    ? Math.round(roster.reduce((sum, item) => sum + stableMetric(item.student.id), 0) / roster.length)
    : 0;

  const risks = roster.filter(item => stableMetric(item.student.id) < 65);
  
  // AI Mock Insights
  const classStrengths = "Kỹ năng Reading đạt trung bình tốt (76%). Học viên có khả năng nắm bắt ý chính và làm dạng bài Short Answer tương đối tốt.";
  const classWeaknesses = "Kỹ năng Listening còn yếu ở Part 1 (điền thông tin số, tên riêng) do thiếu phản xạ chính tả. Kỹ năng Speaking còn ngập ngừng khi kéo dài câu trả lời (Extension).";
  
  const aiRecommendations = [
    {
      id: "rec-1",
      title: "Giao thêm bài tập phát âm /s/ và /es/",
      target: "Lớp học phần lớn phát âm thiếu phụ âm cuối, ảnh hưởng trực tiếp đến Speaking Part 1.",
      action: "Sử dụng tài liệu bổ trợ IPA session 13",
    },
    {
      id: "rec-2",
      title: "Luyện nghe chép chính tả (Dictation) ngắn",
      target: "Cải thiện phản xạ điền số và đánh vần tên riêng cho Listening Part 1.",
      action: "Giao bài tập nghe số điện thoại trên Web",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tiến độ lớp học",
            value: `${Math.round((completedSessions / totalSessions) * 100)}%`,
            note: `${completedSessions}/${totalSessions} session học`,
            icon: Clock,
            color: "text-primary bg-primary/10 border-primary/20",
          },
          {
            label: "Hoàn thành hoạt động",
            value: `${average}%`,
            note: "Trung bình toàn bộ 4 kỹ năng",
            icon: TrendUp,
            color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          },
          {
            label: "Học viên cần hỗ trợ",
            value: risks.length,
            note: "Học viên có tiến độ dưới 65%",
            icon: WarningCircle,
            color: "text-rose-700 bg-rose-50 border-rose-200",
          },
          {
            label: "Sĩ số hiện tại",
            value: `${roster.length}/${selectedClass?.capacity ?? 0}`,
            note: "Học viên đang học tích cực",
            icon: Users,
            color: "text-blue-700 bg-blue-50 border-blue-200",
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className={`p-3 rounded-xl border ${item.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {item.label}
                </p>
                <p className="mt-1 font-display text-2xl font-black text-on-surface">
                  {item.value}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {item.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Skill Breakdown & Operational Rules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Skill Performance Card */}
          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h2 className="font-display text-lg font-extrabold flex items-center gap-2">
                  <Notebook size={20} className="text-primary" />
                  Trung bình các kỹ năng
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Tỉ lệ hoàn thành trung bình của cả lớp
                </p>
              </div>
              <button
                onClick={() => setTab("progress")}
                className="rounded-xl px-4 py-2 text-xs font-bold text-primary hover:bg-primary-container/20 border border-primary/20 transition-colors"
              >
                Chi tiết 4 kỹ năng
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {skills.map((skill, index) => {
                const val = Math.max(50, Math.min(100, average - index * 4 + 6));
                return <ProgressBar key={skill} label={skill} value={val} />;
              })}
            </div>
          </div>

          {/* Operational Rules Card */}
          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold mb-4">Quy tắc vận hành lớp học</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                  <CheckCircle size={18} />
                  Kết quả học vụ
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Kết quả do học viên tự nhập cần được giáo viên phê duyệt mới được tính vào tiến độ chính thức.
                </p>
              </div>
              <div className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                  <WarningCircle size={18} />
                  Cảnh báo chuyên cần
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Hệ thống tự động gắn cờ đỏ khi học viên có tỷ lệ chuyên cần (attendance) dưới 80%.
                </p>
              </div>
              <div className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                  <Clock size={18} />
                  Thông báo tự động
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Hệ thống gửi email/Zalo nhắc nhở nộp bài tự động trước thời hạn kết thúc bài tập 24 giờ.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Insights Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-surface to-primary-container/5 p-6 shadow-sm relative overflow-hidden">
            {/* Decorative background logo */}
            <Brain size={120} className="absolute -right-8 -bottom-8 text-primary/5 pointer-events-none" />

            <div className="flex items-center gap-2 text-primary font-extrabold text-lg border-b border-primary/10 pb-3">
              <Brain size={22} className="text-primary animate-pulse" />
              <span>AI Insights học tập</span>
              <span className="ml-auto inline-flex items-center gap-0.5 bg-primary-container/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                <Sparkle size={10} weight="fill" /> Active
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">Điểm mạnh nổi bật</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {classStrengths}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-700">Điểm nghẽn học thuật</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {classWeaknesses}
                </p>
              </div>

              {risks.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Học viên cần quan tâm đặc biệt</h4>
                  <div className="mt-1.5 space-y-2">
                    {risks.slice(0, 2).map(item => (
                      <div 
                        key={item.student.id} 
                        onClick={() => onSelectStudent?.(item.student.id)}
                        className="flex items-start gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                          {item.student.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate hover:underline">{item.student.fullName}</p>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {stableMetric(item.student.id) < 60 
                              ? "Tiến độ rất chậm, thiếu bài tập nói và nghe" 
                              : "Mắc lỗi chính tả ở phần Listening"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-outline-variant/30 pt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">Đề xuất từ AI cho giáo viên</h4>
                <div className="mt-2 space-y-2">
                  {aiRecommendations.map(rec => (
                    <div key={rec.id} className="bg-surface border border-outline-variant/40 p-2.5 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-on-surface flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {rec.title}
                      </p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed pl-2.5">{rec.target}</p>
                      <span className="inline-block mt-1 text-[10px] text-primary font-bold bg-primary-container/20 px-2 py-0.5 rounded-md">
                        {rec.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
