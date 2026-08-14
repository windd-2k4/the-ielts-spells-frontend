import { useEffect, useState } from "react";
import type { ClassActivityProgress } from "../../academic-types";
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

interface CourseMatrixProps {
  courseId: string;
  roster: Roster;
}

export default function CourseMatrix({ courseId, roster }: CourseMatrixProps) {
  const [activities,setActivities]=useState<ClassActivityProgress[]>([]);
  useEffect(()=>{void apiFetch<ClassActivityProgress[]>(`/admin/courses/${courseId}/progress`).then(setActivities).catch(()=>setActivities([]))},[courseId]);

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant/30 p-5">
        <h2 className="font-display text-xl font-bold">Ma trận hoạt động</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Theo dõi tổng quan mức độ hoàn thành bài tập và luyện tập trên lớp của tất cả học viên.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="sticky left-0 z-10 bg-surface-container-low px-5 py-4 w-[280px] border-r border-outline-variant/20">
                Hoạt động học tập
              </th>
              {roster.slice(0, 8).map(item => (
                <th key={item.enrollment.id} className="px-4 py-4 min-w-[140px] text-center border-r border-outline-variant/20 last:border-r-0">
                  {item.student.fullName}
                  <span className="block mt-0.5 text-[9px] font-bold text-on-surface-variant normal-case">
                    {item.student.studentCode}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/25">
            {activities.map((activity) => (
              <tr key={activity.classActivityId} className="hover:bg-surface-container-low/20 transition-colors">
                <td className="sticky left-0 bg-surface px-5 py-4 border-r border-outline-variant/20">
                  <span className="mb-1 inline-block text-[9px] font-extrabold bg-primary-container/20 text-primary px-2 py-0.5 rounded uppercase">
                    {activity.skill}
                  </span>
                  <strong className="block text-xs text-on-surface mt-1">{activity.title}</strong>
                  <span className="text-[9px] font-bold text-on-surface-variant block mt-0.5">
                    Học trên web hoặc tự nhập kết quả
                  </span>
                </td>
                {roster.slice(0, 8).map(item => {
                  const attempt = activity.attempts.find(value => value.studentId === item.student.id);
                  const scoreMetric = attempt?.comprehensionPercent ?? (attempt?.score != null && attempt.maxScore ? Math.round(attempt.score / attempt.maxScore * 100) : null);
                  const isDone = Boolean(attempt);
                  
                  return (
                    <td 
                      key={item.enrollment.id} 
                      className="px-4 py-4 text-center border-r border-outline-variant/20 last:border-r-0 align-middle font-semibold text-xs tabular-nums"
                    >
                      <span className={`inline-flex rounded-lg px-2.5 py-1.5 font-bold ${
                        isDone 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250" 
                          : "bg-amber-50 text-amber-800 border border-amber-250"
                      }`}>
                        {isDone ? `${scoreMetric == null ? "Đã nộp" : `${scoreMetric}%`} · Đã xong` : "Chưa có dữ liệu"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
