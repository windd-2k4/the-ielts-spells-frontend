"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import {
  getStudentPortalOverview,
  updateStudentTargetBand,
  type StudentPortalOverview,
} from "./studentPortalApi";
import { studentPortalErrorMessage } from "./studentPortalViewModel";

interface StudentPortalContextValue {
  data: StudentPortalOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveTargetBand: (targetBand: number) => Promise<string | null>;
}

const StudentPortalContext = createContext<StudentPortalContextValue | null>(null);

export function StudentPortalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useStudentSession();
  const [data, setData] = useState<StudentPortalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getStudentPortalOverview());
    } catch (loadError) {
      setError(studentPortalErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setLoading(false);
      router.replace("/student/login?next=%2Fstudent");
      return;
    }
    void refresh();
  }, [refresh, router, session, sessionLoading]);

  const value = useMemo<StudentPortalContextValue>(() => ({
    data,
    loading: loading || sessionLoading,
    error,
    refresh,
    saveTargetBand: async (targetBand) => {
      try {
        const result = await updateStudentTargetBand(targetBand);
        setData((current) => current ? {
          ...current,
          profile: { ...current.profile, targetBand: result.targetBand },
          recommendedCourses: [...current.recommendedCourses].sort((left, right) => {
            const leftDistance = Math.abs((left.targetBand ?? result.targetBand) - result.targetBand);
            const rightDistance = Math.abs((right.targetBand ?? result.targetBand) - result.targetBand);
            return leftDistance - rightDistance;
          }),
        } : current);
        void getStudentPortalOverview()
          .then((overview) => {
            setData(overview);
            setError(null);
          })
          .catch(() => {
            setError("Band mục tiêu đã được lưu nhưng chưa thể làm mới danh sách khóa học.");
          });
        return null;
      } catch (saveError) {
        return studentPortalErrorMessage(saveError);
      }
    },
  }), [data, error, loading, refresh, sessionLoading]);

  if (!sessionLoading && !session) return null;

  if (!loading && error && !data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F7F5F4] p-6 text-center">
        <div className="max-w-md rounded-[22px] border border-[#E8E2D5] bg-white p-7">
          <WarningCircle size={38} className="mx-auto text-[#B42335]" weight="duotone" />
          <h1 className="mt-4 text-xl font-bold text-[#292528]">Không tải được góc học tập</h1>
          <p className="mt-2 text-sm leading-6 text-[#6F676C]">{error}</p>
          <button type="button" onClick={() => void refresh()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#894C5B] px-5 text-sm font-bold text-white">
            <ArrowClockwise size={17} weight="bold" /> Thử lại
          </button>
        </div>
      </main>
    );
  }

  return <StudentPortalContext.Provider value={value}>{children}</StudentPortalContext.Provider>;
}

export function useStudentPortal() {
  const context = useContext(StudentPortalContext);
  if (!context) throw new Error("useStudentPortal must be used inside StudentPortalProvider");
  return context;
}
