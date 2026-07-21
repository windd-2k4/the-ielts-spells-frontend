import { BookOpenText, Buildings, CalendarBlank, CheckCircle, Student, TrendUp } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AcademicClass, Course, Enrollment, Page } from "../academic-types";
import { classStatusLabel, date } from "../academic-types";
import { LoadState, PageHeader, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

export function DashboardPage() {
  const [courses, setCourses] = useState<Page<Course> | null>(null);
  const [classes, setClasses] = useState<Page<AcademicClass> | null>(null);
  const [enrollments, setEnrollments] = useState<Page<Enrollment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [a, b, c] = await Promise.all([apiFetch<Page<Course>>("/admin/courses?size=100"), apiFetch<Page<AcademicClass>>("/admin/classes?size=100"), apiFetch<Page<Enrollment>>("/admin/enrollments?size=100")]); setCourses(a); setClasses(b); setEnrollments(c); } catch (value) { setError(value instanceof Error ? value.message : "Không tải được tổng quan"); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const activeCourses = courses?.content.filter(item => item.isActive).length ?? 0;
  const openClasses = classes?.content.filter(item => ["ENROLLING", "IN_PROGRESS"].includes(item.status)).length ?? 0;
  const activeEnrollments = enrollments?.content.filter(item => item.status === "ACTIVE").length ?? 0;
  const upcoming = classes?.content.filter(item => new Date(item.startsOn) >= new Date()).slice(0, 5) ?? [];
  return <section>
    <PageHeader eyebrow="Vận hành học vụ" title="Tổng quan hệ thống" description="Theo dõi nhanh quy mô đào tạo và các lớp sắp bắt đầu." />
    <LoadState loading={loading} error={error} empty={false} onRetry={() => void load()} />
    {!loading && !error && <>
      <div className="metric-grid"><Metric icon={<BookOpenText />} label="Khóa học hoạt động" value={activeCourses} hint={`${courses?.totalElements ?? 0} khóa học trong hệ thống`} /><Metric icon={<Buildings />} label="Lớp đang mở" value={openClasses} hint={`${classes?.totalElements ?? 0} lớp đã được tạo`} /><Metric icon={<Student />} label="Ghi danh đang học" value={activeEnrollments} hint={`${enrollments?.totalElements ?? 0} lượt ghi danh`} /><Metric icon={<TrendUp />} label="Tỷ lệ lớp vận hành" value={`${classes?.totalElements ? Math.round(openClasses / classes.totalElements * 100) : 0}%`} hint="Lớp tuyển sinh hoặc đang học" /></div>
      <div className="dashboard-grid"><section className="admin-panel"><header><div><h2>Lớp sắp khai giảng</h2><p>Lịch bắt đầu gần nhất từ dữ liệu lớp học.</p></div><Link to="/classes">Xem tất cả</Link></header>{upcoming.length ? <div className="upcoming-list">{upcoming.map(item => <article key={item.id}><span className="date-block"><strong>{new Date(`${item.startsOn}T00:00:00`).getDate()}</strong><small>Tháng {new Date(`${item.startsOn}T00:00:00`).getMonth() + 1}</small></span><div><strong>{item.name}</strong><span>{item.code} · {item.capacity} học viên tối đa</span></div><StatusBadge value={item.status}>{classStatusLabel[item.status]}</StatusBadge></article>)}</div> : <p className="panel-empty">Chưa có lớp sắp khai giảng.</p>}</section>
      <aside className="admin-panel action-panel"><header><div><h2>Trạng thái dữ liệu</h2><p>Các đầu mục cần duy trì thường xuyên.</p></div></header><ul><li><CheckCircle /><span><strong>{activeCourses} khóa học sẵn sàng</strong><small>Đang bật để vận hành hoặc tuyển sinh</small></span></li><li><CalendarBlank /><span><strong>{openClasses} lớp cần theo dõi</strong><small>Cập nhật sĩ số và lịch học đúng hạn</small></span></li><li><Student /><span><strong>{activeEnrollments} ghi danh hiệu lực</strong><small>Đang tham gia các lớp học</small></span></li></ul></aside></div>
    </>}
  </section>;
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint: string }) { return <article className="metric"><span>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div></article>; }
