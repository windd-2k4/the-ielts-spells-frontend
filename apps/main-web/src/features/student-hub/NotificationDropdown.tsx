"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpenText,
  Check,
  Checks,
  Gear,
  Microphone,
  PencilSimpleLine,
  Sparkle,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { useStudentNotifications, type StudentNotice } from "./StudentNotificationProvider";
import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Gần đây";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function getNoticeIcon(notice: StudentNotice) {
  const type = notice.type || "";
  const skill = notice.skill || "";

  if (type.startsWith("SPEAKING") || skill === "SPEAKING") {
    return {
      icon: Microphone,
      className: `${styles.iconBox} ${styles.iconSpeaking}`,
    };
  }
  if (type.startsWith("WRITING") || skill === "WRITING") {
    return {
      icon: PencilSimpleLine,
      className: `${styles.iconBox} ${styles.iconWriting}`,
    };
  }
  if (type.includes("SESSION") || type.includes("ZOOM")) {
    return {
      icon: VideoCamera,
      className: `${styles.iconBox} ${styles.iconSession}`,
    };
  }
  if (type.includes("ASSIGNMENT") || type.includes("TEST")) {
    return {
      icon: BookOpenText,
      className: `${styles.iconBox} ${styles.iconAssignment}`,
    };
  }

  return {
    icon: Bell,
    className: `${styles.iconBox} ${styles.iconGeneral}`,
  };
}

export function NotificationDropdown({ isOpen, onClose, anchorRef }: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useStudentNotifications();
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  const displayedNotices = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((n) => !n.readAt);
    }
    return notifications;
  }, [notifications, filter]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      role="dialog"
      aria-modal="false"
      aria-label="Trung tâm thông báo học viên"
    >
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span>Thông báo</span>
          {unreadCount > 0 && <span className={styles.headerBadge}>{unreadCount} mới</span>}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0}
            title="Đánh dấu tất cả đã đọc"
          >
            <Checks size={15} weight="bold" />
            <span>Đã đọc tất cả</span>
          </button>
          <Link
            href="/student/settings?tab=notifications"
            className={styles.settingsLink}
            onClick={onClose}
            title="Cài đặt thông báo"
            aria-label="Cài đặt thông báo"
          >
            <Gear size={16} weight="bold" />
          </Link>
        </div>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "ALL"}
          className={`${styles.tabBtn} ${filter === "ALL" ? styles.tabBtnActive : ""}`}
          onClick={() => setFilter("ALL")}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "UNREAD"}
          className={`${styles.tabBtn} ${filter === "UNREAD" ? styles.tabBtnActive : ""}`}
          onClick={() => setFilter("UNREAD")}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className={styles.list} role="feed" aria-busy="false">
        {displayedNotices.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={24} weight="duotone" />
            </div>
            <h4 className={styles.emptyTitle}>
              {filter === "UNREAD" ? "Không còn thông báo chưa đọc" : "Chưa có thông báo"}
            </h4>
            <p className={styles.emptyText}>
              {filter === "UNREAD"
                ? "Bạn đã xem hết tất cả thông báo học tập quan trọng."
                : "Kết quả chấm bài, lịch học và deadline bài tập sẽ xuất hiện tại đây."}
            </p>
          </div>
        ) : (
          displayedNotices.map((notice) => {
            const isUnread = !notice.readAt;
            const { icon: Icon, className: iconClassName } = getNoticeIcon(notice);
            const targetLink =
              notice.link ||
              (notice.attemptId
                ? `/student/${notice.skill === "SPEAKING" ? "speaking" : "writing"}/attempts/${notice.attemptId}/result`
                : "/student");

            return (
              <div
                key={notice.id}
                className={`${styles.item} ${isUnread ? styles.itemUnread : ""}`}
                onClick={() => {
                  if (isUnread) void markAsRead(notice.id);
                  onClose();
                  router.push(targetLink);
                }}
                role="article"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isUnread) void markAsRead(notice.id);
                    onClose();
                    router.push(targetLink);
                  }
                }}
              >
                <div className={iconClassName}>
                  <Icon size={18} weight="duotone" />
                </div>

                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <h5 className={styles.itemTitle}>{notice.title}</h5>
                    <span className={styles.itemTime}>{formatTimeAgo(notice.createdAt)}</span>
                  </div>
                  <p className={styles.itemBody}>{notice.body}</p>
                </div>

                {isUnread && <span className={styles.unreadDot} title="Chưa đọc" />}
              </div>
            );
          })
        )}
      </div>

      <footer className={styles.footer}>
        <Link href="/student/schedule" className={styles.footerLink} onClick={onClose}>
          Xem lịch học & phòng Zoom
        </Link>
        <Link href="/student/assignments" className={styles.footerLink} onClick={onClose}>
          Bài tập cần làm
        </Link>
      </footer>
    </div>
  );
}
