"use client";

import { CheckCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import styles from "./StudentHubLayout.module.css";

type Notice = { id: string; attemptId: string; title: string; body: string };

export function WritingEvaluationNotifier() {
  const { session } = useStudentSession();
  const userId = session?.user.id;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const notice = notices[0];

  useEffect(() => {
    setNotices([]); setError("");
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const values = await apiFetch<Notice[]>("/student/notifications/writing");
        if (!cancelled) setNotices(values);
      } catch { /* Unread notices remain on the server until the next successful poll. */ }
      if (!cancelled) timer = setTimeout(check, 10_000);
    }
    void check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [userId]);

  const dismiss = useCallback(async (id: string) => {
    try {
      await apiFetch(`/student/notifications/writing/${id}/read`, { method: "POST" });
      setNotices((current) => current.filter((item) => item.id !== id)); setError("");
    } catch { setError("Chưa thể đóng thông báo. Vui lòng thử lại."); }
  }, []);

  if (!notice) return null;
  return <aside className={styles.evaluationToast} role="status" aria-live="polite">
    <CheckCircle size={22} weight="fill" />
    <div><strong>{notice.title}</strong><span>{error || notice.body}</span></div>
    <Link href={`/student/writing/attempts/${notice.attemptId}/result`} onClick={() => void dismiss(notice.id)}>Xem kết quả</Link>
    <button type="button" aria-label="Đóng thông báo" onClick={() => void dismiss(notice.id)}><X size={16} /></button>
  </aside>;
}
