"use client";

import { CheckCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useStudentNotifications } from "./StudentNotificationProvider";
import styles from "./StudentHubLayout.module.css";

export function WritingEvaluationNotifier() {
  const { activeToast, markAsRead, dismissToast } = useStudentNotifications();

  if (!activeToast) return null;

  const targetLink =
    activeToast.link ||
    (activeToast.attemptId
      ? `/student/${activeToast.skill === "SPEAKING" ? "speaking" : "writing"}/attempts/${activeToast.attemptId}/result`
      : "/student");

  return (
    <aside className={styles.evaluationToast} role="status" aria-live="polite">
      <CheckCircle size={22} weight="fill" />
      <div>
        <strong>{activeToast.title}</strong>
        <span>{activeToast.body}</span>
      </div>
      <Link
        href={targetLink}
        onClick={() => void markAsRead(activeToast.id)}
      >
        Xem kết quả
      </Link>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => dismissToast(activeToast.id)}
      >
        <X size={16} />
      </button>
    </aside>
  );
}
