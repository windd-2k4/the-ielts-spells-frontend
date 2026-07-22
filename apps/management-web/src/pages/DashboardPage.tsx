import { BookOpenText, Buildings, CalendarBlank, CheckCircle, Student, TrendUp } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AcademicClass, Course, Enrollment, Page } from "../academic-types";
import { classStatusLabel } from "../academic-types";
import { LoadState, PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

export function DashboardPage() {
  const [courses, setCourses] = useState<Page<Course> | null>(null);
  const [classes, setClasses] = useState<Page<AcademicClass> | null>(null);
  const [enrollments, setEnrollments] = useState<Page<Enrollment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, b, c] = await Promise.all([
        apiFetch<Page<Course>>("/admin/courses?size=100"),
        apiFetch<Page<AcademicClass>>("/admin/classes?size=100"),
        apiFetch<Page<Enrollment>>("/admin/enrollments?size=100")
      ]);
      setCourses(a);
      setClasses(b);
      setEnrollments(c);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được tổng quan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCourses = courses?.content.filter(item => item.isActive).length ?? 0;
  const openClasses = classes?.content.filter(item => ["ENROLLING", "IN_PROGRESS"].includes(item.status)).length ?? 0;
  const activeEnrollments = enrollments?.content.filter(item => item.status === "ACTIVE").length ?? 0;
  const upcoming = classes?.content.filter(item => new Date(item.startsOn) >= new Date()).slice(0, 3) ?? [];

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          eyebrow="Quản trị"
          title="Tổng quan hệ thống"
          description="Theo dõi hoạt động học thuật, lớp khai giảng và tiến trình đào tạo."
        />
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              calendar_today
            </span>
            <select className="pl-10 pr-8 py-2 rounded-xl border border-outline-variant/60 bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Tháng này</option>
            </select>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              filter_alt
            </span>
            <select className="pl-10 pr-8 py-2 rounded-xl border border-outline-variant/60 bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all">
              <option>Tất cả khóa học</option>
              <option>IELTS Foundation</option>
              <option>IELTS 6.5+</option>
            </select>
          </div>
        </div>
      </div>

      <LoadState loading={loading} error={error} empty={false} onRetry={() => void load()} />

      {!loading && !error && (
        <>
          {/* Summary Cards (Bento Grid Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute -right-4 -top-4 text-primary/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  group
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-on-surface-variant mb-1">Học viên đang học</p>
                <p className="font-display text-4xl font-bold text-primary mb-2">{activeEnrollments}</p>
                <div className="flex items-center text-xs font-semibold text-primary gap-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>+12% so với tháng trước</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute -right-4 -top-4 text-secondary/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  door_open
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-on-surface-variant mb-1">Lớp học đang mở</p>
                <p className="font-display text-4xl font-bold text-secondary mb-2">{openClasses}</p>
                <div className="flex items-center text-xs font-semibold text-on-surface-variant gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{classes?.totalElements ?? 0} lớp trong hệ thống</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute -right-4 -top-4 text-tertiary-container/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  book
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-on-surface-variant mb-1">Khóa học hoạt động</p>
                <p className="font-display text-4xl font-bold text-tertiary mb-2">{activeCourses}</p>
                <div className="flex items-center text-xs font-semibold text-on-surface-variant gap-1">
                  <span className="material-symbols-outlined text-[16px]">done</span>
                  <span>{courses?.totalElements ?? 0} khóa học tổng cộng</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute -right-4 -top-4 text-primary/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  monitoring
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-on-surface-variant mb-1">Tỷ lệ lớp vận hành</p>
                <p className="font-display text-4xl font-bold text-primary mb-2">
                  {classes?.totalElements
                    ? Math.round((openClasses / classes.totalElements) * 100)
                    : 0}%
                </p>
                <div className="flex items-center text-xs font-semibold text-on-surface-variant gap-1">
                  <span className="material-symbols-outlined text-[16px]">insights</span>
                  <span>Lớp đang chiêu sinh/học</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Wider) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Lớp sắp khai giảng */}
              <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-display">
                    <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                    Lớp sắp khai giảng
                  </h3>
                  <Link to="/classes" className="text-primary font-semibold text-sm hover:underline">
                    Xem tất cả
                  </Link>
                </div>
                
                {upcoming.length ? (
                  <div className="space-y-4">
                    {upcoming.map(item => {
                      const startDate = new Date(`${item.startsOn}T00:00:00`);
                      const dayStr = startDate.getDate().toString().padStart(2, "0");
                      const monthStr = (startDate.getMonth() + 1).toString().padStart(2, "0");
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-primary-container/20 text-primary p-3 rounded-xl text-center min-w-[76px]">
                              <div className="font-bold text-lg leading-none">{dayStr}</div>
                              <div className="text-[10px] uppercase font-bold mt-1">T{monthStr}</div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-on-surface">{item.name}</h4>
                              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-caption">
                                <span className="material-symbols-outlined text-[14px]">label</span>
                                Mã lớp: {item.code}
                                <span className="material-symbols-outlined text-[14px] ml-2">group</span>
                                Tối đa: {item.capacity} học viên
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary-fixed/40">
                              {classStatusLabel[item.status]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-on-surface-variant">
                    Chưa có lớp sắp khai giảng.
                  </div>
                )}
              </div>

              {/* Progress Overview */}
              <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-display">
                    <span className="material-symbols-outlined text-primary text-2xl">monitoring</span>
                    Tiến độ học tập trung bình
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-surface-container">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Listening
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-surface-container">
                      <span className="w-2 h-2 rounded-full bg-secondary" /> Reading
                    </span>
                  </div>
                </div>
                
                <div className="h-64 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex items-end justify-between p-6 gap-2 relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-9xl">bar_chart</span>
                  </div>
                  {/* Simulated Columns */}
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-[80%]">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[40%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[35%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 2</span>
                  </div>
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-[80%]">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[60%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[50%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 3</span>
                  </div>
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-full">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[45%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[60%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 4</span>
                  </div>
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-[80%]">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[70%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[65%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 5</span>
                  </div>
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-[80%]">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[65%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[75%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 6</span>
                  </div>
                  <div className="w-1/6 flex flex-col justify-end items-center gap-1 h-full">
                    <div className="flex w-full items-end justify-center gap-1 h-[80%]">
                      <div className="w-1/2 bg-primary rounded-t-lg h-[85%]" />
                      <div className="w-1/2 bg-secondary rounded-t-lg h-[80%]" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-2">Tháng 7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar-ish) */}
            <div className="space-y-8">
              {/* Students Needing Attention */}
              <div className="bg-error-container/10 rounded-2xl shadow-sm border border-error/20 p-6">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4 font-display">
                  <span className="material-symbols-outlined text-error text-2xl">warning</span>
                  Học viên cần lưu ý
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-start p-3 bg-surface rounded-xl border border-outline-variant/30">
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Nguyễn Văn A</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Lớp: Foundation F01</p>
                    </div>
                    <span className="bg-error-container/85 text-on-error-container text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      Vắng 3 buổi
                    </span>
                  </div>
                  <div className="flex justify-between items-start p-3 bg-surface rounded-xl border border-outline-variant/30">
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Trần Thị B</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Lớp: Intensive IN02</p>
                    </div>
                    <span className="bg-error-container/85 text-on-error-container text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      Thiếu 2 bài
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 text-sm font-semibold text-primary text-center hover:underline">
                  Xem báo cáo chi tiết
                </button>
              </div>

              {/* Pending Actions */}
              <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-6">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4 font-display">
                  <span className="material-symbols-outlined text-tertiary-container text-2xl">task_alt</span>
                  Hành động cần xử lý
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline-variant mt-0.5">videocam</span>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">3 học viên Zoom chưa khớp ID</p>
                      <a className="text-xs text-primary font-semibold hover:underline" href="#">
                        Xử lý ngay
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline-variant mt-0.5">draw</span>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">12 bài AI Writing cần GV duyệt</p>
                      <a className="text-xs text-primary font-semibold hover:underline" href="#">
                        Chuyển cho GV
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-outline-variant mt-0.5">history</span>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">5 bài tập quá hạn nộp</p>
                      <a className="text-xs text-primary font-semibold hover:underline" href="#">
                        Gửi thông báo nhắc nhở
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
