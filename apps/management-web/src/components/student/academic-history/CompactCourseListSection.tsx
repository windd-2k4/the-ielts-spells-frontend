import {
  ArrowSquareOut,
  ArrowsLeftRight,
  BookOpenText,
  CalendarBlank,
  CheckCircle,
  Clock,
  GraduationCap,
  Headphones,
  MagnifyingGlass,
  Microphone,
  PauseCircle,
  PenNib,
  Target,
  Users,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Course, Enrollment, Reservation, Transfer } from "../../../academic-types";
import { ENROLLMENT_STATUS_MAP, formatAcademicDate, formatAcademicDateTime } from "./academicHistoryUtils";

type FilterOption = "ALL" | "ACTIVE" | "COMPLETED" | "PAUSED" | "WITHDRAWN";

type Props = {
  enrollments: Enrollment[];
  courses: Course[];
  reservations: Reservation[];
  transfers: Transfer[];
  filter: FilterOption;
  onFilterChange: (f: FilterOption) => void;
  onRequestReservation: (enrollment: Enrollment) => void;
  onRequestTransfer: (enrollment: Enrollment) => void;
  canApprove: boolean;
  onApprove: (res: Reservation | undefined, trf: Transfer | undefined) => Promise<void>;
  onReject: (res: Reservation | undefined, trf: Transfer | undefined) => Promise<void>;
};

export default function CompactCourseListSection({
  enrollments,
  courses,
  reservations,
  transfers,
  filter,
  onFilterChange,
  onRequestReservation,
  onRequestTransfer,
  canApprove,
  onApprove,
  onReject,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);

  // Counts for tabs
  const allCount = enrollments.length;
  const activeCount = enrollments.filter(e => e.status === "ACTIVE").length;
  const completedCount = enrollments.filter(e => e.status === "COMPLETED").length;
  const pausedCount = enrollments.filter(e => e.status === "PAUSED").length;
  const withdrawnCount = enrollments.filter(e => e.status === "WITHDRAWN" || e.status === "PENDING").length;

  // Filtered & searched enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enr => {
      // Status filter
      if (filter === "ACTIVE" && enr.status !== "ACTIVE") return false;
      if (filter === "COMPLETED" && enr.status !== "COMPLETED") return false;
      if (filter === "PAUSED" && enr.status !== "PAUSED") return false;
      if (filter === "WITHDRAWN" && enr.status !== "WITHDRAWN" && enr.status !== "PENDING") return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const course = courseMap.get(enr.courseId);
        const nameMatch = course?.name?.toLowerCase().includes(q) ?? false;
        const codeMatch = course?.code?.toLowerCase().includes(q) ?? false;
        const noteMatch = enr.notes?.toLowerCase().includes(q) ?? false;
        return nameMatch || codeMatch || noteMatch;
      }

      return true;
    });
  }, [enrollments, filter, searchQuery, courseMap]);

  // Pending actions
  const handlePendingAction = async (
    type: "approve" | "reject",
    res: Reservation | undefined,
    trf: Transfer | undefined,
    id: string
  ) => {
    setProcessingId(id);
    try {
      if (type === "approve") {
        await onApprove(res, trf);
      } else {
        await onReject(res, trf);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section
      aria-label="Lịch sử và danh sách khóa học"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4"
    >
      {/* Header with Title and Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-[#8B3F56]" weight="duotone" />
          <h2 className="font-display text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Lịch sử &amp; Danh sách khóa học
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
            {allCount}
          </span>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã lớp..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#8B3F56] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B3F56]"
          />
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-xs font-bold border-b border-slate-100">
        <button
          type="button"
          onClick={() => onFilterChange("ALL")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition whitespace-nowrap ${
            filter === "ALL"
              ? "border-[#8B3F56] text-[#8B3F56] bg-[#8B3F56]/5 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>Tất cả</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
            {allCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("ACTIVE")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition whitespace-nowrap ${
            filter === "ACTIVE"
              ? "border-[#8B3F56] text-[#8B3F56] bg-[#8B3F56]/5 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/30"
          }`}
        >
          <span>Đang học</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800">
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("COMPLETED")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition whitespace-nowrap ${
            filter === "COMPLETED"
              ? "border-[#8B3F56] text-[#8B3F56] bg-[#8B3F56]/5 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-blue-800 hover:bg-blue-50/30"
          }`}
        >
          <span>Đã hoàn thành</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-800">
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("PAUSED")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition whitespace-nowrap ${
            filter === "PAUSED"
              ? "border-[#8B3F56] text-[#8B3F56] bg-[#8B3F56]/5 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-amber-800 hover:bg-amber-50/30"
          }`}
        >
          <span>Đang bảo lưu</span>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] text-amber-800">
            {pausedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("WITHDRAWN")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition whitespace-nowrap ${
            filter === "WITHDRAWN"
              ? "border-[#8B3F56] text-[#8B3F56] bg-[#8B3F56]/5 rounded-t-lg"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>Đã rút / Chờ xử lý</span>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
            {withdrawnCount}
          </span>
        </button>
      </div>

      {/* BẢNG SỐ LIỆU ĐÓNG KHUNG (STRUCTURED DATA TABLE) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-2.5 px-4 w-[34%]">
                  Khóa học &amp; Mã lớp
                </th>
                <th scope="col" className="py-2.5 px-3 w-[20%]">
                  Kỹ năng &amp; Trình độ
                </th>
                <th scope="col" className="py-2.5 px-3 w-[22%]">
                  Lịch học &amp; Quy mô
                </th>
                <th scope="col" className="py-2.5 px-3 w-[12%] text-center">
                  Trạng thái
                </th>
                <th scope="col" className="py-2.5 px-4 w-[12%] text-right">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEnrollments.length > 0 ? (
                filteredEnrollments.map(enr => {
                  const course = courseMap.get(enr.courseId);
                  const statusMeta = ENROLLMENT_STATUS_MAP[enr.status] || {
                    label: enr.status,
                    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                    dotColor: "bg-slate-400",
                    description: "",
                  };

                  const pendingRes = reservations.find(
                    r => r.enrollmentId === enr.id && r.status === "PENDING"
                  );
                  const pendingTrf = transfers.find(
                    t => t.sourceEnrollmentId === enr.id && t.status === "PENDING"
                  );

                  const isSkillLR = course?.skillPair === "LISTENING_READING";

                  return (
                    <tr
                      key={enr.id}
                      className="group transition hover:bg-[#FAF7F8]/40"
                    >
                      {/* Cột 1: Khóa học & Mã lớp */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-slate-900 group-hover:text-[#8B3F56] transition leading-snug">
                              {course?.name || "Khóa học chưa đặt tên"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {course?.code || "—"}
                            </span>

                            {/* Pending warning if any */}
                            {pendingRes && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[10px] font-bold">
                                <PauseCircle size={12} weight="fill" className="text-amber-600" />
                                Chờ duyệt bảo lưu
                              </span>
                            )}
                            {pendingTrf && (
                              <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
                                <ArrowsLeftRight size={12} weight="bold" className="text-blue-600" />
                                Chờ duyệt chuyển lớp
                              </span>
                            )}
                          </div>

                          {/* Notes if present */}
                          {(enr.notes || enr.attendanceNote) && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-1 pt-0.5">
                              {enr.attendanceNote || enr.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Kỹ năng & Trình độ */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          {course?.skillPair ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 text-[11px] font-bold">
                              {isSkillLR ? (
                                <>
                                  <Headphones size={12} weight="fill" />
                                  <span>Listening &amp; Reading</span>
                                </>
                              ) : (
                                <>
                                  <Microphone size={12} weight="fill" />
                                  <span>Speaking &amp; Writing</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            {course?.targetBand != null && (
                              <span className="rounded bg-[#8B3F56]/10 px-1.5 py-0.2 font-bold text-[#8B3F56]">
                                Band {course.targetBand}+
                              </span>
                            )}
                            {course?.level && (
                              <span className="text-slate-600 font-semibold">{course.level}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Lịch học & Quy mô */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1 text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CalendarBlank size={13} className="text-slate-400 shrink-0" />
                            <span className="tabular-nums">
                              {formatAcademicDate(enr.startedOn || course?.startsOn)}
                              {course?.endsOn && ` → ${formatAcademicDate(course.endsOn)}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {course?.totalSessions ? (
                              <span>{course.totalSessions} buổi</span>
                            ) : null}
                            {course?.capacity ? (
                              <>
                                <span>•</span>
                                <span>Tối đa {course.capacity} HV</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="py-3 px-3 align-top text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dotColor}`} />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {["ACTIVE", "PAUSED"].includes(enr.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() => onRequestReservation(enr)}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 transition"
                                title="Bảo lưu khóa học"
                              >
                                <PauseCircle size={13} weight="bold" />
                                <span>Bảo lưu</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onRequestTransfer(enr)}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 transition"
                                title="Chuyển sang lớp khác"
                              >
                                <ArrowsLeftRight size={13} weight="bold" />
                                <span>Chuyển lớp</span>
                              </button>
                            </>
                          )}

                          {course?.id && (
                            <Link
                              to={`/courses/${course.id}`}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#8B3F56] transition"
                              title="Xem chi tiết lớp học"
                            >
                              <ArrowSquareOut size={13} weight="bold" />
                              <span className="hidden md:inline">Chi tiết</span>
                            </Link>
                          )}
                        </div>

                        {/* Inline Admin Approval if Pending */}
                        {(pendingRes || pendingTrf) && canApprove && (
                          <div className="mt-2 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={processingId === (pendingRes?.id || pendingTrf?.id)}
                              onClick={() =>
                                handlePendingAction(
                                  "reject",
                                  pendingRes,
                                  pendingTrf,
                                  pendingRes?.id || pendingTrf?.id || ""
                                )
                              }
                              className="inline-flex h-6 items-center gap-1 rounded border border-rose-300 bg-rose-50 px-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              <XCircle size={12} weight="bold" />
                              <span>Từ chối</span>
                            </button>

                            <button
                              type="button"
                              disabled={processingId === (pendingRes?.id || pendingTrf?.id)}
                              onClick={() =>
                                handlePendingAction(
                                  "approve",
                                  pendingRes,
                                  pendingTrf,
                                  pendingRes?.id || pendingTrf?.id || ""
                                )
                              }
                              className="inline-flex h-6 items-center gap-1 rounded bg-[#8B3F56] px-2 text-[10px] font-bold text-white hover:bg-[#783549] transition shadow-2xs"
                            >
                              <CheckCircle size={12} weight="bold" />
                              <span>Duyệt</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    {searchQuery
                      ? `Không tìm thấy khóa học nào khớp với từ khóa "${searchQuery}".`
                      : "Học viên chưa có lượt ghi danh trong danh mục này."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
