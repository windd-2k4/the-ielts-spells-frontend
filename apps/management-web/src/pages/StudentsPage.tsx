import { ArrowRight, MagnifyingGlass, Student, UsersThree } from "@phosphor-icons/react";
import type * as React from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Enrollment, Page, StudentSummary } from "../academic-types";
import { PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";

export function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Page<StudentSummary>>("/admin/students?size=100"),
      apiFetch<Page<Enrollment>>("/admin/enrollments?size=100"),
    ]).then(([studentPage, enrollmentPage]) => {
      setStudents(studentPage.content); setEnrollments(enrollmentPage.content);
    }).catch(value => setError(value instanceof Error ? value.message : "Không tải được học viên"))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => students.filter(student =>
    `${student.fullName} ${student.studentCode} ${student.email ?? ""} ${student.phone ?? ""}`.toLowerCase().includes(deferred.trim().toLowerCase())
  ), [deferred, students]);
  const activeCount = (id: string) => enrollments.filter(item => item.studentId === id && ["ACTIVE", "PAUSED"].includes(item.status)).length;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Hồ sơ học viên" title="Quản lý học viên" description="Một hồ sơ xuyên suốt nhiều khóa học, bảo lưu và chuyển lớp mà không tạo trùng tài khoản." />
      
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Tổng học viên" value={students.length} icon={<UsersThree size={22} />} />
        <Metric label="Đang theo học" value={new Set(enrollments.filter(x => x.status === "ACTIVE").map(x => x.studentId)).size} icon={<Student size={22} />} />
        <Metric label="Đang bảo lưu" value={new Set(enrollments.filter(x => x.status === "PAUSED").map(x => x.studentId)).size} icon={<Student size={22} />} />
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-sm">
        <label className="relative block max-w-2xl"><MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên, mã học viên, email hoặc số điện thoại" className="w-full rounded-xl border border-outline-variant/60 bg-surface py-3 pl-12 pr-4 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" />
        </label>
      </div>

      {loading && <State text="Đang tải danh sách học viên..." />}
      {error && <State text={error} error />}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Học viên</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Band hiện tại → mục tiêu</th>
                  <th className="px-6 py-4">Hồ sơ học tập</th>
                  <th className="px-6 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {visible.map(student => (
                  <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.fullName} src={student.avatarPath} />
                        <div>
                          <strong className="block text-on-surface">{student.fullName}</strong>
                          <span className="font-mono text-xs text-on-surface-variant">{student.studentCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-on-surface">{student.email ?? "Chưa có email"}</span>
                      <span className="text-xs text-on-surface-variant">{student.phone ?? "Chưa có số điện thoại"}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {student.currentBand ?? "—"} <span className="mx-1 text-on-surface-variant">→</span> {student.targetBand ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary">
                        {activeCount(student.id)} khóa đang mở
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedStudentId(student.id)}
                        className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                      >
                        Mở hồ sơ <ArrowRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && <State text="Không có học viên phù hợp." />}
        </div>
      )}

      {/* Student detailed profile drawer */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-5xl bg-surface h-full shadow-2xl overflow-y-auto p-6 relative">
            <StudentProfileDetail
              studentId={selectedStudentId}
              onClose={() => setSelectedStudentId(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({label, value, icon}: {label: string; value: number; icon: React.ReactNode}) { return <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5"><div className="mb-5 flex items-center justify-between text-primary"><span className="text-sm font-semibold text-on-surface-variant">{label}</span>{icon}</div><strong className="text-3xl">{value}</strong></div>; }
function Avatar({name, src}: {name: string; src: string | null}) { return src ? <img src={src} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/30 font-bold text-primary">{name.slice(0, 1).toUpperCase()}</span>; }
function State({text, error}: {text: string; error?: boolean}) { return <div className={`rounded-2xl border p-10 text-center ${error ? "border-error/30 bg-error-container/10 text-error" : "border-outline-variant/30 text-on-surface-variant"}`}>{text}</div>; }
