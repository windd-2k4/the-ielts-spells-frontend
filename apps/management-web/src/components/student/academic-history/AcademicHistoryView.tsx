import { useState } from "react";
import type { Course, Enrollment, Reservation, StudentDetail, Transfer } from "../../../academic-types";
import { EditStudentModal } from "../../enrollment/StudentProfileDetail";
import StudentOverviewSection from "./StudentOverviewSection";
import StudentStatisticsRow from "./StudentStatisticsRow";
import CompactCourseListSection from "./CompactCourseListSection";
import StudentProfileSidebar from "./StudentProfileSidebar";
import AcademicLifecycleTimelineSection from "./AcademicLifecycleTimelineSection";
import AcademicLifecycleDrawer, { type LifecycleDialogState } from "./AcademicLifecycleDrawer";

type Props = {
  student: StudentDetail;
  enrollments: Enrollment[];
  courses: Course[];
  reservations: Reservation[];
  transfers: Transfer[];
  canApprove: boolean;
  onApprove: (res: Reservation | undefined, trf: Transfer | undefined) => Promise<void>;
  onReject: (res: Reservation | undefined, trf: Transfer | undefined) => Promise<void>;
  onReload: () => Promise<void>;
};

type FilterOption = "ALL" | "ACTIVE" | "COMPLETED" | "PAUSED" | "WITHDRAWN";

export default function AcademicHistoryView({
  student,
  enrollments,
  courses,
  reservations,
  transfers,
  canApprove,
  onApprove,
  onReject,
  onReload,
}: Props) {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("ALL");
  const [dialog, setDialog] = useState<LifecycleDialogState>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  // Statistics
  const activeCount = enrollments.filter(e => e.status === "ACTIVE").length;
  const completedCount = enrollments.filter(e => e.status === "COMPLETED").length;
  const pausedCount = enrollments.filter(e => e.status === "PAUSED").length;
  const pendingCount =
    reservations.filter(x => x.status === "PENDING").length +
    transfers.filter(x => x.status === "PENDING").length;

  return (
    <div className="space-y-3.5">
      {/* SECTION 1: STUDENT OVERVIEW */}
      <StudentOverviewSection
        student={student}
        onEditProfile={() => setEditingProfile(true)}
      />

      {/* SECTION 2: STUDENT STATISTICS */}
      <StudentStatisticsRow
        totalCourses={enrollments.length}
        activeCourses={activeCount}
        completedCourses={completedCount}
        pausedCourses={pausedCount}
        currentBand={student.currentBand}
        targetBand={student.targetBand}
        pendingRequests={pendingCount}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* TWO-COLUMN LAYOUT: MAIN COURSES & SIDEBAR */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column (Main): Section 3 (Course List) & Section 7 (Timeline) */}
        <div className="space-y-4 min-w-0">
          {/* SECTION 3: LỊCH SỬ & DANH SÁCH KHÓA HỌC */}
          <CompactCourseListSection
            enrollments={enrollments}
            courses={courses}
            reservations={reservations}
            transfers={transfers}
            filter={selectedFilter}
            onFilterChange={setSelectedFilter}
            onRequestReservation={(enrollment) => setDialog({ kind: "reservation", enrollment })}
            onRequestTransfer={(enrollment) => setDialog({ kind: "transfer", enrollment })}
            canApprove={canApprove}
            onApprove={onApprove}
            onReject={onReject}
          />

          {/* SECTION 7: NHẬT KÝ BIẾN ĐỘNG HỌC VỤ */}
          <AcademicLifecycleTimelineSection
            enrollments={enrollments}
            courses={courses}
            reservations={reservations}
            transfers={transfers}
          />
        </div>

        {/* Right Column (Sidebar): Section 4, 5, 6 */}
        <div className="xl:sticky xl:top-4 self-start">
          <StudentProfileSidebar
            student={student}
            enrollments={enrollments}
            onEditProfile={() => setEditingProfile(true)}
          />
        </div>
      </div>

      {/* Lifecycle Action Drawer (Reservation / Transfer) */}
      {dialog && (
        <AcademicLifecycleDrawer
          dialog={dialog}
          courses={courses}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await onReload();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editingProfile && (
        <EditStudentModal
          student={student}
          onClose={() => setEditingProfile(false)}
          onSaved={async () => {
            setEditingProfile(false);
            await onReload();
          }}
        />
      )}
    </div>
  );
}
