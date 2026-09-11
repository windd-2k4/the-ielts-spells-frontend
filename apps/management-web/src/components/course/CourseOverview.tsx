import {
  Brain,
  CheckCircle,
  Clock,
  Sparkle,
  TrendUp,
  WarningCircle,
  Users,
  Notebook,
  ChalkboardTeacher,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { AcademicClass, AttendanceRecord, ClassActivityProgress, ClassSession, Course, CourseTeacherAssignment, TeacherOption } from "../../academic-types";
import { useAuth } from "../../auth/AuthContext";
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
type StaffOption = { authUserId: string | null; fullName: string; email: string; role: string; status: string };
type ActiveStudentSupport = StaffOption & { authUserId: string };
type StudentSupportAssignment = { studentSupportId: string };
type Page<T> = { content: T[] };

interface CourseOverviewProps {
  course: Course;
  selectedClass: AcademicClass | null;
  roster: Roster;
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
  setTab,
  onSelectStudent,
}: CourseOverviewProps) {
  const { roles } = useAuth();
  const [sessions,setSessions]=useState<ClassSession[]>([]);const [attendance,setAttendance]=useState<AttendanceRecord[]>([]);const [progress,setProgress]=useState<ClassActivityProgress[]>([]);
  const [studentSupportOptions, setStudentSupportOptions] = useState<ActiveStudentSupport[]>([]);
  const [assignedSupportIds, setAssignedSupportIds] = useState<string[]>([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [studentSupportError, setStudentSupportError] = useState("");
  const [studentSupportSuccess, setStudentSupportSuccess] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacherAssignment[]>([]);
  const [primaryTeacherId, setPrimaryTeacherId] = useState("");
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");
  const [teacherSuccess, setTeacherSuccess] = useState("");
  const canAssignTeacher = roles.includes("admin");
  const canAssignStudentSupport = roles.includes("admin");
  useEffect(()=>{if(!selectedClass)return;void Promise.all([apiFetch<ClassSession[]>(`/admin/courses/${selectedClass.id}/sessions`),apiFetch<AttendanceRecord[]>(`/admin/courses/${selectedClass.id}/attendance`),apiFetch<ClassActivityProgress[]>(`/admin/courses/${selectedClass.id}/progress`)]).then(([s,a,p])=>{setSessions(s);setAttendance(a);setProgress(p)}).catch(()=>{setSessions([]);setAttendance([]);setProgress([])})},[selectedClass?.id]);
  useEffect(() => {
    if (!selectedClass || !canAssignStudentSupport) {
      setStudentSupportOptions([]);
      setAssignedSupportIds([]);
      return;
    }
    let active = true;
    setIsLoadingSupport(true);
    setStudentSupportError("");
    void Promise.all([
      apiFetch<Page<StaffOption>>("/admin/staff?size=200"),
      apiFetch<StudentSupportAssignment[]>(`/admin/courses/${selectedClass.id}/student-supports`),
    ]).then(([staff, assignments]) => {
      if (!active) return;
      setStudentSupportOptions(staff.content.filter((item): item is ActiveStudentSupport => item.authUserId !== null && item.status === "ACTIVE" && item.role === "STUDENT_SUPPORT"));
      setAssignedSupportIds(assignments.map((item) => item.studentSupportId));
    }).catch((value: unknown) => {
      if (active) setStudentSupportError(value instanceof Error ? value.message : "Không tải được phân công Student Support.");
    }).finally(() => {
      if (active) setIsLoadingSupport(false);
    });
    return () => { active = false; };
  }, [canAssignStudentSupport, selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass || !canAssignTeacher) {
      setTeacherOptions([]);
      setCourseTeachers([]);
      setPrimaryTeacherId("");
      return;
    }
    let active = true;
    setIsLoadingTeachers(true);
    setTeacherError("");
    void Promise.all([
      apiFetch<TeacherOption[]>("/admin/teacher-options"),
      apiFetch<CourseTeacherAssignment[]>(`/admin/courses/${selectedClass.id}/teachers`),
    ]).then(([options, assignments]) => {
      if (!active) return;
      setTeacherOptions(options);
      setCourseTeachers(assignments);
      setPrimaryTeacherId(assignments.find((item) => item.primary)?.teacherId ?? "");
    }).catch((value: unknown) => {
      if (active) setTeacherError(value instanceof Error ? value.message : "Không tải được phân công giáo viên.");
    }).finally(() => {
      if (active) setIsLoadingTeachers(false);
    });
    return () => { active = false; };
  }, [canAssignTeacher, selectedClass?.id]);

  async function savePrimaryTeacher() {
    if (!selectedClass || !primaryTeacherId) return;
    setIsSavingTeacher(true);
    setTeacherError("");
    setTeacherSuccess("");
    try {
      const assignments = await apiFetch<CourseTeacherAssignment[]>(`/admin/courses/${selectedClass.id}/teachers/primary`, {
        method: "PUT",
        body: JSON.stringify({ teacherId: primaryTeacherId }),
      });
      setCourseTeachers(assignments);
      setPrimaryTeacherId(assignments.find((item) => item.primary)?.teacherId ?? primaryTeacherId);
      setTeacherSuccess("Đã cập nhật giáo viên chính của khóa học.");
    } catch (value) {
      setTeacherError(value instanceof Error ? value.message : "Không thể cập nhật giáo viên chính.");
    } finally {
      setIsSavingTeacher(false);
    }
  }

  async function saveStudentSupports() {
    if (!selectedClass) return;
    setIsSavingSupport(true);
    setStudentSupportError("");
    setStudentSupportSuccess("");
    try {
      await apiFetch<StudentSupportAssignment[]>(`/admin/courses/${selectedClass.id}/student-supports`, {
        method: "PUT",
        body: JSON.stringify({ studentSupportIds: assignedSupportIds }),
      });
      setStudentSupportSuccess("Đã cập nhật phân công Student Support cho khóa học.");
    } catch (value) {
      setStudentSupportError(value instanceof Error ? value.message : "Không thể cập nhật phân công Student Support.");
    } finally {
      setIsSavingSupport(false);
    }
  }
  const totalSessions=sessions.length;const completedSessions=sessions.filter(value=>value.status==="COMPLETED").length;
  const studentRates=useMemo(()=>new Map(roster.map(({student})=>{const relevant=progress.flatMap(activity=>activity.attempts.filter(attempt=>attempt.studentId===student.id));const values=relevant.map(attempt=>attempt.comprehensionPercent??(attempt.score!=null&&attempt.maxScore?Math.round(attempt.score/attempt.maxScore*100):null)).filter((value):value is number=>value!=null);return [student.id,values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null]})),[progress,roster]);
  const knownRates=[...studentRates.values()].filter((value):value is number=>value!=null);
  const average=knownRates.length?Math.round(knownRates.reduce((a,b)=>a+b,0)/knownRates.length):0;
  const risks = roster.filter(item => {const value=studentRates.get(item.student.id);return value!=null&&value<65});
  
  const classStrengths = progress.length ? "Dữ liệu phân tích được tổng hợp từ các bài làm đã nộp trong lớp." : "Chưa có đủ bài làm để tạo phân tích.";
  const classWeaknesses = progress.length ? "Giáo viên cần xem chi tiết từng kỹ năng và xác nhận các kết quả tự nhập." : "Chưa có dữ liệu để xác định điểm nghẽn học thuật.";
  
  const aiRecommendations: {id:string;title:string;target:string;action:string}[] = [];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tiến độ lớp học",
            value: totalSessions ? `${Math.round((completedSessions / totalSessions) * 100)}%` : "—",
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
                const skillKey=skill.toUpperCase();const attempts=progress.filter(value=>value.skill===skillKey).flatMap(value=>value.attempts);const values=attempts.map(value=>value.comprehensionPercent??(value.score!=null&&value.maxScore?Math.round(value.score/value.maxScore*100):null)).filter((value):value is number=>value!=null);const val=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
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
                            Tiến độ hiện tại {studentRates.get(item.student.id)}%
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

      {canAssignTeacher && selectedClass && (
        <section className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ChalkboardTeacher size={22} /></span>
            <div>
              <h2 className="font-display text-lg font-extrabold">Phân công giảng dạy</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Giáo viên chính được dùng làm mặc định cho lịch học. Có thể chọn giáo viên dạy thay ở từng buổi.</p>
            </div>
          </div>
          {teacherError && <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2 text-sm text-error">{teacherError}</p>}
          {teacherSuccess && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{teacherSuccess}</p>}
          {isLoadingTeachers ? <p className="mt-4 text-sm text-on-surface-variant">Đang tải danh sách giáo viên...</p> : teacherOptions.length === 0 ? <p className="mt-4 text-sm text-on-surface-variant">Chưa có giáo viên đang hoạt động. Hãy kích hoạt tài khoản giáo viên trong mục Nhân sự.</p> : (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Giáo viên chính</span><select value={primaryTeacherId} onChange={(event) => { setPrimaryTeacherId(event.target.value); setTeacherSuccess(""); }} className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"><option value="">Chọn giáo viên</option>{teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName} ({teacher.email})</option>)}</select></label>
              <button type="button" onClick={() => void savePrimaryTeacher()} disabled={!primaryTeacherId || isSavingTeacher} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-50">{isSavingTeacher ? "Đang lưu..." : "Lưu giáo viên chính"}</button>
            </div>
          )}
          {courseTeachers.some((item) => !item.primary) && <div className="mt-5 border-t border-outline-variant/30 pt-4"><p className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Giáo viên từng dạy thay</p><div className="mt-2 flex flex-wrap gap-2">{courseTeachers.filter((item) => !item.primary).map((teacher) => <span key={teacher.teacherId} className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-xs font-semibold">{teacher.fullName ?? teacher.email ?? "Giáo viên"}</span>)}</div></div>}
        </section>
      )}

      {canAssignStudentSupport && selectedClass && (
        <section className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold">Phân công Student Support</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Nhân sự được chọn chỉ xem học viên, chuyên cần và tiến độ của khóa này.</p>
            </div>
            <button type="button" onClick={() => void saveStudentSupports()} disabled={isLoadingSupport || isSavingSupport} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50">
              {isSavingSupport ? "Đang lưu..." : "Lưu phân công"}
            </button>
          </div>
          {studentSupportError && <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2 text-sm text-error">{studentSupportError}</p>}
          {studentSupportSuccess && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{studentSupportSuccess}</p>}
          {isLoadingSupport ? <p className="mt-4 text-sm text-on-surface-variant">Đang tải nhân sự hỗ trợ...</p> : studentSupportOptions.length === 0 ? <p className="mt-4 text-sm text-on-surface-variant">Chưa có nhân sự Student Support đang hoạt động.</p> : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {studentSupportOptions.map((staff) => {
                const supportId = staff.authUserId;
                const checked = assignedSupportIds.includes(supportId);
                return <label key={supportId} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${checked ? "border-primary bg-primary-container/10" : "border-outline-variant/50"}`}><input type="checkbox" checked={checked} onChange={() => setAssignedSupportIds((current) => checked ? current.filter((id) => id !== supportId) : [...current, supportId])} className="mt-1 h-4 w-4 accent-primary" /><span><strong className="block text-sm">{staff.fullName}</strong><span className="text-xs text-on-surface-variant">{staff.email}</span></span></label>;
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
