"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowClockwise, ArrowLeft, GraduationCap, WarningCircle } from "@phosphor-icons/react";
import { StudentCourseWorkspace } from "@/features/student-hub/courses/StudentCourseWorkspace";
import {
  fetchStudentCourseWorkspace,
  type CourseWorkspaceData,
} from "@/features/student-hub/studentPortalApi";
import { studentPortalErrorMessage } from "@/features/student-hub/studentPortalViewModel";
import styles from "./StudentCourseDetailPage.module.css";

export default function StudentCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseKey = params?.courseId ?? "";

  const [workspaceData, setWorkspaceData] = useState<CourseWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!courseKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudentCourseWorkspace(courseKey);
      setWorkspaceData(data);
    } catch (err) {
      setError(
        studentPortalErrorMessage(
          err,
          "Không thể tải không gian học tập của khóa học này. Vui lòng thử lại sau."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [courseKey]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return (
      <div className={styles.loading} aria-label="Đang tải không gian học tập">
        <div className={styles.loadingHeader} />
        <div className={styles.loadingGrid}>
          <div className={styles.loadingMain} />
          <div className={styles.loadingSide} />
        </div>
      </div>
    );
  }

  if (error || !workspaceData) {
    return (
      <section className={styles.stateCard}>
        {error ? <WarningCircle size={38} weight="duotone" /> : <GraduationCap size={38} weight="duotone" />}
        <h1>{error ? "Không tải được không gian khóa học" : "Bạn chưa có quyền vào không gian này"}</h1>
        <p>{error ?? "Không gian học tập chỉ mở cho học viên đã ghi danh vào khóa học."}</p>
        <div className={styles.stateActions}>
          {error ? (
            <button type="button" onClick={() => void loadWorkspace()}>
              <ArrowClockwise size={17} weight="bold" /> Thử lại
            </button>
          ) : null}
          <Link href="/student/courses">
            <ArrowLeft size={16} weight="bold" /> Quay lại khóa học của tôi
          </Link>
        </div>
      </section>
    );
  }

  return <StudentCourseWorkspace data={workspaceData} />;
}
