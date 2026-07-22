import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { AcademicClass, Enrollment, EnrollmentStatus, Page, StudentSummary } from "../academic-types";
import { enrollmentStatusLabel } from "../academic-types";
import { Drawer, LoadState, PageHeader, PrimaryAction, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

import AdmissionsLeads, { type ConsultingLead } from "../components/enrollment/AdmissionsLeads";
import ClassEnrollments from "../components/enrollment/ClassEnrollments";
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";

type TabType = "leads" | "enrollments" | "profiles";

export function EnrollmentsPage() {
  const [searchParams] = useSearchParams();
  const initializedFromUrl = useRef(false);
  const [items, setItems] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  
  // Placement drawer states
  const [studentId, setStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EnrollmentStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  
  // Dashboard tabs state
  const [activeTab, setActiveTab] = useState<TabType>("leads");
  const [selectedStudentId, setSelectedStudentId] = useState("student-1"); // Nguyễn Minh Anh is student-1

  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const suffix = classId === "all" ? "" : `&classId=${classId}`;
      const [enrollmentPage, classPage] = await Promise.all([
        apiFetch<Page<Enrollment>>(`/admin/enrollments?size=100${suffix}`),
        apiFetch<Page<AcademicClass>>("/admin/classes?size=100"),
      ]);
      setItems(enrollmentPage.content);
      setClasses(classPage.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu tuyển sinh");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void load();
  }, [load]);

  // URL parameters handling
  useEffect(() => {
    if (initializedFromUrl.current || !classes.length) return;
    initializedFromUrl.current = true;
    const requestedClassId = searchParams.get("classId");
    const requestedStudentId = searchParams.get("studentId");
    const requestedTab = searchParams.get("tab") as TabType | null;

    if (requestedClassId && classes.some(item => item.id === requestedClassId)) setClassId(requestedClassId);
    if (requestedTab) setActiveTab(requestedTab);
    
    if (searchParams.get("action") !== "create") return;
    setEditing(null); setNotes(""); setStatus("ACTIVE"); setOpen(true);
    if (requestedStudentId) {
      void apiFetch<StudentSummary>(`/admin/students/${requestedStudentId}`)
        .then(student => { setSelectedStudent(student); setStudentId(student.id); setStudentQuery(student.fullName); })
        .catch(value => setError(value instanceof Error ? value.message : "Không tải được học viên đã chọn"));
    }
  }, [classes, searchParams]);

  // Student search for Placement Drawer
  useEffect(() => {
    if (!open || editing || studentQuery.trim().length < 2 || selectedStudent) {
      setStudentResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setStudentLoading(true);
      void apiFetch<Page<StudentSummary>>(
        `/admin/students?q=${encodeURIComponent(studentQuery.trim())}&size=8`
      )
        .then(page => setStudentResults(page.content))
        .catch(value => setError(value instanceof Error ? value.message : "Không tìm được học viên"))
        .finally(() => setStudentLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [editing, open, selectedStudent, studentQuery]);

  const visibleEnrollments = useMemo(
    () =>
      items.filter(item =>
        `${item.studentId} ${item.notes ?? ""}`.toLowerCase().includes(deferredQuery.toLowerCase())
      ),
    [items, deferredQuery]
  );

  function createPlacement() {
    setEditing(null);
    setStudentId("");
    setStudentQuery("");
    setStudentResults([]);
    setSelectedStudent(null);
    setNotes("");
    setStatus("ACTIVE");
    setOpen(true);
  }

  function editPlacement(item: Enrollment) {
    setEditing(item);
    setStudentId(item.studentId);
    setNotes(item.notes ?? "");
    setStatus(item.status);
    setOpen(true);
  }

  // Handle incoming lead conversion
  const handleConvertLead = (lead: ConsultingLead) => {
    // Open placement drawer, pre-fill student details
    setEditing(null);
    setStudentId(lead.id);
    setStudentQuery(lead.fullName);
    setSelectedStudent({
      id: lead.id,
      studentCode: `HV-2026-${lead.id.split("-").pop()}`,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      avatarPath: null,
      currentBand: 5.0,
      targetBand: parseFloat(lead.targetBand) || 7.0,
    });
    setNotes(`Ghi danh từ Landing Page Lead. Ghi chú tư vấn: ${lead.notes}`);
    setStatus("ACTIVE");
    setOpen(true);
  };

  async function savePlacement(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await apiFetch(`/admin/enrollments/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status, notes: notes || null }),
        });
      } else {
        await apiFetch("/admin/enrollments", {
          method: "POST",
          body: JSON.stringify({
            classId: classId === "all" ? classes[0]?.id : classId,
            studentId,
            notes: notes || null,
          }),
        });
      }
      setOpen(false);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể lưu thông tin xếp lớp");
    } finally {
      setSaving(false);
    }
  }

  const getPageHeaderProps = () => {
    switch (activeTab) {
      case "leads":
        return {
          eyebrow: "Tiếp nhận tư vấn",
          title: "Khách hàng tiềm năng & Tư vấn",
          description: "Quản lý yêu cầu tư vấn tự động gửi từ Landing Page. Lên lịch test trình độ và chuyển đổi thành học viên.",
        };
      case "profiles":
        return {
          eyebrow: "Hồ sơ & học vụ",
          title: "Hồ sơ chi tiết học viên",
          description: "Theo dõi chi tiết liên hệ, phụ huynh, bento học tập, biểu đồ mạng nhện SVG kỹ năng và nhật ký học tập của học viên.",
        };
      case "enrollments":
      default:
        return {
          eyebrow: "Tuyển sinh và học vụ",
          title: "Tuyển sinh & xếp lớp",
          description: "Xếp lớp cho học viên đã đăng ký, theo dõi trạng thái tham gia và cập nhật ghi chú học thuật.",
        };
    }
  };

  const headerProps = getPageHeaderProps();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={headerProps.eyebrow}
        title={headerProps.title}
        description={headerProps.description}
        action={
          activeTab === "enrollments" ? (
            <PrimaryAction onClick={createPlacement}>Xếp học viên vào lớp</PrimaryAction>
          ) : undefined
        }
      />

      {/* Tabs Navigation */}
      <nav className="flex border-b border-outline-variant/50 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === "leads"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Yêu cầu tư vấn (Landing Page Leads)
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === "enrollments"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Xếp lớp học vụ
        </button>
        <button
          onClick={() => setActiveTab("profiles")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === "profiles"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Hồ sơ chi tiết
        </button>
      </nav>

      {/* Tab Contents */}
      {activeTab === "leads" && (
        <AdmissionsLeads onConvert={handleConvertLead} />
      )}

      {activeTab === "enrollments" && (
        <ClassEnrollments
          items={visibleEnrollments}
          classes={classes}
          query={query}
          setQuery={setQuery}
          classId={classId}
          setClassId={setClassId}
          onEdit={editPlacement}
          onSelectStudent={(sId) => {
            setSelectedStudentId(sId);
            setActiveTab("profiles");
          }}
        />
      )}

      {activeTab === "profiles" && (
        <StudentProfileDetail 
          studentId={selectedStudentId} 
          onClose={() => setActiveTab("enrollments")}
        />
      )}

      <LoadState loading={loading && activeTab === "enrollments"} error={error} empty={false} onRetry={() => void load()} />

      {/* Placement Drawer */}
      {open && (
        <Drawer
          title={editing ? "Cập nhật lượt tham gia" : "Xếp học viên vào lớp"}
          description={
            editing
              ? "Điều chỉnh trạng thái hoặc ghi chú của lượt ghi danh."
              : "Chọn lớp và tìm học viên theo tên, email hoặc số điện thoại."
          }
          onClose={() => setOpen(false)}
        >
          <form className="space-y-4 flex flex-col h-full" onSubmit={savePlacement}>
            <div className="space-y-4 flex-1">
              {!editing && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lớp học</label>
                    <select
                      required
                      value={classId === "all" ? classes[0]?.id ?? "" : classId}
                      onChange={event => setClassId(event.target.value)}
                      className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    >
                      {classes.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tìm học viên</label>
                    <input
                      value={studentQuery}
                      onChange={event => {
                        setStudentQuery(event.target.value);
                        setSelectedStudent(null);
                        setStudentId("");
                      }}
                      placeholder="Nhập tên, email hoặc số điện thoại"
                      autoComplete="off"
                      className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                    <small className="text-xs text-on-surface-variant">Nhập ít nhất 2 ký tự, sau đó chọn đúng học viên trong kết quả.</small>
                  </div>

                  {selectedStudent ? (
                    <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <strong className="text-on-surface text-sm font-semibold block">{selectedStudent.fullName}</strong>
                        <span className="text-xs text-on-surface-variant mt-0.5 block font-mono">
                          {selectedStudent.studentCode} · {selectedStudent.email || selectedStudent.phone || "Chưa có liên hệ"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null);
                          setStudentId("");
                          setStudentQuery("");
                        }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Chọn lại
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2" aria-live="polite">
                      {studentLoading && <p className="text-xs text-on-surface-variant">Đang tìm học viên...</p>}
                      {!studentLoading && studentQuery.trim().length >= 2 && !studentResults.length && (
                        <p className="text-xs text-error font-medium">Không có học viên phù hợp.</p>
                      )}
                      {studentResults.map(student => (
                        <button
                          type="button"
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setStudentId(student.id);
                            setStudentQuery(student.fullName);
                            setStudentResults([]);
                          }}
                          className="w-full text-left p-3 hover:bg-surface border border-outline-variant/30 rounded-xl transition-all flex flex-col gap-1"
                        >
                          <strong className="text-on-surface text-sm font-semibold">{student.fullName}</strong>
                          <span className="text-xs text-on-surface-variant font-mono">
                            {student.studentCode} · {student.email || student.phone || "Chưa có liên hệ"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {editing && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</label>
                  <select
                    value={status}
                    onChange={event => setStatus(event.target.value as EnrollmentStatus)}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  >
                    {Object.entries(enrollmentStatusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ghi chú</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Thông tin bàn giao, nhu cầu đặc biệt..."
                  className="px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-error bg-error-container/20 border border-error/20 p-3 rounded-xl" role="alert">
                {error}
              </p>
            )}

            <footer className="sticky bottom-0 flex justify-end gap-3 pt-4 border-t border-outline-variant/20 bg-surface">
              <button
                type="button"
                className="px-5 py-2.5 border border-outline-variant/60 hover:bg-surface-container rounded-full text-sm font-semibold transition-colors"
                onClick={() => setOpen(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || (!editing && (!classes.length || !studentId))}
                className="px-5 py-2.5 bg-primary hover:opacity-95 text-on-primary rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Xác nhận xếp lớp"}
              </button>
            </footer>
          </form>
        </Drawer>
      )}
    </section>
  );
}
