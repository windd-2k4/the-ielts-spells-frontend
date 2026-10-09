import { useEffect, useState } from "react";
import { 
  Info,
  Ear,
  BookOpen,
  Pencil,
  Microphone,
  WarningCircle
} from "@phosphor-icons/react";
import type { ClassActivityProgress, ClassSession, SkillPair } from "../../academic-types";
import { apiFetch } from "../../lib/api";

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
  courseId: string;
  studentId: string;
  status: string;
}

type Roster = { enrollment: Enrollment; student: StudentSummary }[];

interface CourseProgressProps {
  courseId: string;
  skillPair: SkillPair;
  roster: Roster;
  onSelectStudent?: (studentId: string) => void;
}

type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

interface StudentExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  score: string;
  timeSpent?: string;
  averageTimeSpent: string;
  comprehension?: string;
  errorAnalysis: string;
}

interface StudentHomework {
  studentId: string;
  studentName: string;
  studentCode: string;
  exercises: StudentExerciseProgress[];
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

export default function CourseProgress({ courseId, skillPair, roster, onSelectStudent }: CourseProgressProps) {
  const skillTabs = skillPair === "LISTENING_READING"
    ? ([{ id: "LISTENING", label: "Nghe (Listening)", icon: Ear }, { id: "READING", label: "Đọc (Reading)", icon: BookOpen }] as const)
    : ([{ id: "SPEAKING", label: "Nói (Speaking)", icon: Microphone }, { id: "WRITING", label: "Viết (Writing)", icon: Pencil }] as const);
  const [selectedSkill, setSelectedSkill] = useState<SkillType>(skillTabs[0].id);
  const [selectedSession, setSelectedSession] = useState<number>(0);
  const [progress,setProgress]=useState<ClassActivityProgress[]>([]);const [sessions,setSessions]=useState<ClassSession[]>([]);
  useEffect(()=>{void Promise.all([apiFetch<ClassActivityProgress[]>(`/admin/courses/${courseId}/progress`),apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`)]).then(([p,s])=>{setProgress(p);setSessions(s);if(s.length)setSelectedSession(s[0].sessionNo)}).catch(()=>{setProgress([]);setSessions([])})},[courseId]);
  useEffect(() => { setSelectedSkill(skillTabs[0].id); }, [skillPair]);

  // Build the table from published course activities and persisted student attempts.
  const getHomeworkData = (): StudentHomework[] => {
    const sessionId = sessions.find(value => value.sessionNo === selectedSession)?.id;
    const visibleActivities = progress.filter(value => value.skill === selectedSkill && (!sessionId || value.sessionId === sessionId));

    return roster.map(({ student }) => ({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      exercises: visibleActivities.map(activity => {
        const attempt = activity.attempts
          .filter(value => value.studentId === student.id)
          .sort((left, right) => right.attemptNo - left.attemptNo)[0];
        const completedDurations = activity.attempts
          .filter(value => value.durationSeconds != null && (value.submittedAt != null || value.completedAt != null))
          .map(value => value.durationSeconds)
          .filter((value): value is number => value != null);
        const averageSeconds = completedDurations.length
          ? completedDurations.reduce((total, value) => total + value, 0) / completedDurations.length
          : null;

        return {
          exerciseId: activity.classActivityId,
          exerciseName: activity.title,
          score: attempt?.score == null ? "—" : attempt.maxScore ? `${attempt.score}/${attempt.maxScore}` : String(attempt.score),
          timeSpent: attempt?.durationSeconds == null ? undefined : formatDuration(attempt.durationSeconds),
          averageTimeSpent: averageSeconds == null ? "—" : formatDuration(averageSeconds),
          comprehension: attempt?.comprehensionPercent == null ? undefined : `${attempt.comprehensionPercent}%`,
          errorAnalysis: attempt?.errorAnalysis ?? "Chưa có phân tích lỗi",
        };
      }),
    }));
  };

  const studentHomeworkList = getHomeworkData();

  return (
    <div className="space-y-6">
      {/* Skill Navigation */}
      <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 overflow-x-auto">
        {skillTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedSkill(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selectedSkill === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Session Selector */}
      <div className="flex items-center gap-3 bg-surface p-4 border border-outline-variant/40 rounded-2xl shadow-sm">
        <span className="text-sm font-bold text-on-surface-variant">Chọn session:</span>
        <div className="flex items-center gap-1.5">
          {sessions.map(value => value.sessionNo).map(num => (
            <button
              key={num}
              onClick={() => setSelectedSession(num)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedSession === num
                  ? "bg-primary-container/20 text-primary border border-primary/20"
                  : "bg-surface hover:bg-surface-container border border-outline-variant/50"
              }`}
            >
              Session {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant ml-auto italic">
          Đang hiển thị bài học: <strong>{selectedSkill} - Session {selectedSession}</strong>
        </span>
      </div>

      {/* Detailed tracking spreadsheet with stacked multi-exercises */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-4 w-48 sticky left-0 bg-surface-container-low z-20 border-r border-outline-variant/20">
                  Học viên
                </th>
                <th className="px-4 py-4 w-60">Hoạt động / Bài tập</th>
                <th className="px-4 py-4 w-28 text-center">Kết quả</th>
                <th className="px-4 py-4 w-80">Nhiệm vụ tự học (Self-study tasks)</th>
                <th className="px-4 py-4 w-72">Phân tích lỗi sai</th>
                <th className="px-5 py-4 w-28 text-center">Thời gian TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {studentHomeworkList.map(student => {
                const totalExercises = student.exercises.length;
                
                return (
                  <tr key={student.studentId} className="hover:bg-surface-container-low/10 transition-colors border-b border-outline-variant/25 last:border-0">
                    {/* Student profile (Sticky and spanning height of all exercises) */}
                    <td className="px-5 py-4 sticky left-0 bg-surface z-10 border-r border-outline-variant/20 valign-top vertical-top align-top">
                      <div className="min-w-0">
                        <strong 
                          onClick={() => onSelectStudent?.(student.studentId)}
                          className="font-extrabold text-on-surface text-sm block cursor-pointer hover:text-primary hover:underline"
                        >
                          {student.studentName}
                        </strong>
                        <span className="text-[10px] font-bold text-on-surface-variant block mt-0.5">
                          {student.studentCode}
                        </span>
                      </div>
                    </td>

                    {/* Stacked exercises list */}
                    <td colSpan={5} className="p-0">
                      <div className="flex flex-col">
                        {student.exercises.map((exercise, exIndex) => (
                          <div 
                            key={exercise.exerciseId}
                            className="grid grid-cols-[240px_112px_320px_288px_112px] items-stretch border-b border-outline-variant/15 last:border-b-0 py-3"
                          >
                            {/* Exercise info */}
                            <div className="px-4 py-1 flex flex-col justify-center">
                              {totalExercises > 1 && (
                                <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                                  Bài {exIndex + 1}/{totalExercises}
                                </span>
                              )}
                              <span className="text-xs font-bold text-primary leading-tight">
                                {exercise.exerciseName}
                              </span>
                              {exercise.timeSpent && (
                                <span className="text-[10px] text-on-surface-variant block mt-1.5 font-semibold">
                                  ⏱️ Làm bài: <strong>{exercise.timeSpent}</strong>
                                </span>
                              )}
                              {exercise.comprehension && (
                                <span className="text-[10px] text-on-surface-variant block font-semibold">
                                  🎯 Thấu hiểu: <strong>{exercise.comprehension}</strong>
                                </span>
                              )}
                            </div>

                            {/* Score */}
                            <div className="px-4 py-1 flex items-center justify-center">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
                                {exercise.score}
                              </span>
                            </div>

                            {/* Checklists */}
                            <div className="px-4 py-1 flex flex-col justify-center">
                              <span className="text-xs font-semibold text-on-surface-variant">—</span>
                            </div>

                            {/* Error analysis */}
                            <div className="px-4 py-1 flex items-center">
                              <div className="bg-surface-container-low/45 p-2.5 rounded-xl border border-outline-variant/15 flex gap-2 w-full">
                                <WarningCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
                                  {exercise.errorAnalysis}
                                </p>
                              </div>
                            </div>

                            {/* Average completion time across submitted attempts */}
                            <div className="px-4 py-1 flex items-center justify-center">
                              <span className="text-xs font-extrabold tabular-nums text-on-surface">
                                {exercise.averageTimeSpent}
                              </span>
                            </div>
                          </div>
                        ))}
                        {totalExercises === 0 && (
                          <div className="px-5 py-8 text-center text-xs font-semibold text-on-surface-variant">
                            Session này chưa có bài tập {skillTabs.find(tab => tab.id === selectedSkill)?.label}.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes info footer */}
        <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
          <Info size={16} className="text-primary" />
          <span>Nếu một session có nhiều bài, tất cả bài sẽ được hiển thị riêng theo thứ tự. Thời gian trung bình chỉ tính các lượt làm đã nộp hoặc hoàn thành.</span>
        </div>
      </div>
    </div>
  );
}
