"use client";

import { StudentCourseRecommendations } from "@/features/student-hub/StudentCourseRecommendations";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentRoadmapMilestones } from "@/features/student-hub/StudentRoadmapMilestones";
import { StudentTargetBandControl } from "@/features/student-hub/StudentTargetBandControl";
import { buildStudentRoadmap } from "@/features/student-hub/studentPortalViewModel";

export default function StudentRoadmapPage() {
  const { data, loading } = useStudentPortal();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Kế hoạch cá nhân</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Lộ trình học tập</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Lộ trình được tạo từ Band, kết quả bài làm và trạng thái ghi danh thật của bạn.</p>
      </header>
      <StudentTargetBandControl />
      {loading || !data ? (
        <div className="h-44 animate-pulse rounded-[22px] border border-[#E8E2D5] bg-white" />
      ) : (
        <>
          <StudentRoadmapMilestones milestones={buildStudentRoadmap(data)} />
          <StudentCourseRecommendations courses={data.recommendedCourses} hasTarget={data.profile.targetBand != null} />
        </>
      )}
    </div>
  );
}
