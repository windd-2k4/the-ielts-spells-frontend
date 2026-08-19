import { Check, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { Course, SkillPair } from "../../academic-types";
import type { LibraryItem, TestBankItem } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";

type SessionItem = {
  itemType: "MATERIAL" | "ASSIGNMENT" | "TEST";
  title: string;
  description?: string | null;
  sourceAssignmentId?: string | null;
  sourceTestId?: string | null;
  sourceResourceId?: string | null;
  sourceExerciseTemplateId?: string | null;
  deadlineAt?: string | null;
  required?: boolean;
  visibility?: "STUDENT" | "TEACHER";
};
type CourseSession = {
  id: string; sessionNo: number; title: string | null; startsAt: string; endsAt: string;
  zoomMeetingId: string | null; zoomUrl: string | null; status: string; notes: string | null;
  phaseName: string | null; content: string | null; teacherId: string | null; items: SessionItem[];
};

type Props = {
  open?: boolean;
  item?: LibraryItem | TestBankItem;
  courses?: Course[];
  courseId?: string;
  skillPair?: SkillPair;
  onClose: () => void;
  onSuccess?: () => void;
  onAttach?: (items: LibraryItem[]) => void;
};

export default function AttachLibraryModal({
  open = true,
  item,
  courses = [],
  courseId = "",
  skillPair,
  onClose,
  onSuccess,
  onAttach,
}: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [visibility, setVisibility] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [submitting, setSubmitting] = useState(false);

  if (open === false) return null;

  useEffect(() => {
    if (!selectedCourseId) { setSessions([]); setSelectedSessionId(""); return; }
    setLoadingSessions(true); setError("");
    void apiFetch<CourseSession[]>(`/admin/courses/${selectedCourseId}/sessions`)
      .then(result => {
        setSessions(result);
        setSelectedSessionId(current => result.some(session => session.id === current) ? current : result[0]?.id ?? "");
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Không tải được danh sách buổi học."))
      .finally(() => setLoadingSessions(false));
  }, [selectedCourseId]);

  async function handleAttach() {
    if (!item || !selectedCourseId || !selectedSessionId) {
      setError("Vui lòng chọn khóa học và buổi học cần gắn.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const session = sessions.find(value => value.id === selectedSessionId);
      if (!session) throw new Error("Buổi học đã chọn không còn tồn tại.");
      const isTest = "purpose" in item;
      const isExercise = "exerciseType" in item;
      const newItem: SessionItem = {
        itemType: isTest ? "TEST" : isExercise ? "ASSIGNMENT" : "MATERIAL",
        title: item.title,
        description: "description" in item ? item.description : "instructions" in item ? item.instructions : null,
        sourceTestId: isTest ? item.id : null,
        sourceResourceId: !isTest && isResource(item as LibraryItem) ? item.id : null,
        sourceExerciseTemplateId: isExercise ? item.id : null,
        required: isRequired,
        visibility,
      };
      await apiFetch(`/admin/courses/${selectedCourseId}/sessions/${selectedSessionId}`, {
        method: "PUT",
        body: JSON.stringify({
          sessionNo: session.sessionNo, title: session.title, startsAt: session.startsAt, endsAt: session.endsAt,
          zoomMeetingId: session.zoomMeetingId, zoomUrl: session.zoomUrl, status: session.status,
          notes: session.notes, phaseName: session.phaseName, content: session.content,
          teacherId: session.teacherId,
          items: [...(session.items ?? []), newItem],
        }),
      });
      if (onAttach) onAttach([item as LibraryItem]);
      else onSuccess?.();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gắn học liệu vào buổi học.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#211A1D]">Gắn vào buổi học (Session)</h3>
            <p className="text-xs text-[#746A6E]">Tham chiếu nội dung mà không nhân bản dữ liệu</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#746A6E] hover:bg-[#f1eef4]">
            <X size={20} />
          </button>
        </div>

        {item && (
          <div className="rounded-xl border border-[#8f4458]/20 bg-[#f7e7ec]/50 p-3.5">
            <span className="text-[11px] font-bold text-[#8f4458]">{item.code}</span>
            <h4 className="font-display text-sm font-bold text-[#211A1D]">{item.title}</h4>
          </div>
        )}

        <div className="space-y-4">
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#b4232d]">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1">Chọn Khóa học</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
            >
              <option value="">-- Chọn khóa học áp dụng --</option>
              {courses.length > 0
                ? courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                : null}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1">Chọn Buổi học (Session)</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={!selectedCourseId || loadingSessions}
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
            >
              <option value="">{loadingSessions ? "Đang tải buổi học..." : "-- Chọn buổi học --"}</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Session {session.sessionNo}{session.title ? ` · ${session.title}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1">Tính bắt buộc</label>
              <select
                value={isRequired ? "YES" : "NO"}
                onChange={(e) => setIsRequired(e.target.value === "YES")}
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
              >
                <option value="YES">Bắt buộc hoàn thành</option>
                <option value="NO">Tùy chọn (Tham khảo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1">Quyền truy cập</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "STUDENT" | "TEACHER")}
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
              >
                <option value="STUDENT">Hiển thị cho Học viên</option>
                <option value="TEACHER">Chỉ cho Giáo viên</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e3dce2] pt-4">
          <button onClick={onClose} className="min-h-[42px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold">
            Hủy
          </button>
          <button
            onClick={() => void handleAttach()}
            disabled={submitting}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white hover:bg-[#743447] disabled:opacity-50"
          >
            <Check size={16} />
            {submitting ? "Đang gắn..." : "Xác nhận gắn học liệu"}
          </button>
        </div>
      </div>
    </div>
  );
}
