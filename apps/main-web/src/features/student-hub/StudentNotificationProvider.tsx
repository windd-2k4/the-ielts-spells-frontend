"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";

export interface StudentNotice {
  id: string;
  type: string;
  title: string;
  body: string;
  attemptId?: string | null;
  skill?: "WRITING" | "SPEAKING" | "READING" | "LISTENING" | null;
  createdAt?: string | null;
  readAt?: string | null;
  link?: string | null;
}

interface StudentNotificationPreferences {
  upcomingClassReminder: boolean;
  assignmentDeadlineReminder: boolean;
  gradingCompletedAlert: boolean;
  weeklyProgressDigest: boolean;
  browserSoundAlert: boolean;
}

interface StudentNotificationContextValue {
  notifications: StudentNotice[];
  unreadCount: number;
  loading: boolean;
  activeToast: StudentNotice | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (id: string) => void;
}

const StudentNotificationContext = createContext<StudentNotificationContextValue | undefined>(
  undefined
);

function playNotificationChime(enabled: boolean) {
  try {
    if (!enabled) return;

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay restrictions or unsupported context
  }
}

export function StudentNotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useStudentSession();
  const userId = session?.user.id;

  const [notifications, setNotifications] = useState<StudentNotice[]>([]);
  const preferencesRef = useRef<StudentNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<StudentNotice | null>(null);

  // Track notices that have already shown a toast alert in this session
  const seenToastIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const fetchNotices = useCallback(async () => {
    if (!userId) return;
    try {
      // Try full notifications endpoint first, fallback to writing
      let data: StudentNotice[] = [];
      try {
        data = await apiFetch<StudentNotice[]>("/student/notifications?unreadOnly=false");
      } catch {
        data = await apiFetch<StudentNotice[]>("/student/notifications/writing");
      }

      setNotifications(data);

      // Check for new unread notifications that haven't been shown in toast
      const unreadList = data.filter((n) => !n.readAt);
      if (initialLoadDoneRef.current) {
        const brandNewNotice = unreadList.find((n) => !seenToastIdsRef.current.has(n.id));
        if (brandNewNotice) {
          seenToastIdsRef.current.add(brandNewNotice.id);
          setActiveToast(brandNewNotice);
          playNotificationChime(Boolean(preferencesRef.current?.browserSoundAlert));
        }
      } else {
        // On first load, record existing unread so they don't all spam as toasts
        unreadList.forEach((n) => seenToastIdsRef.current.add(n.id));
        // If there's an unread notice, show only the latest one
        if (unreadList.length > 0) {
          setActiveToast(unreadList[0]);
        }
        initialLoadDoneRef.current = true;
      }
    } catch {
      // Keep existing notices on error
    }
  }, [userId]);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    try {
      preferencesRef.current = await apiFetch<StudentNotificationPreferences>("/student/notifications/preferences");
    } catch {
      preferencesRef.current = null;
    }
  }, [userId]);

  useEffect(() => {
    setNotifications([]);
    setActiveToast(null);
    initialLoadDoneRef.current = false;
    seenToastIdsRef.current.clear();
    preferencesRef.current = null;

    if (!userId) return;

    setLoading(true);
    void fetchPreferences().then(fetchNotices).finally(() => setLoading(false));

    // Polling interval every 15 seconds
    const interval = setInterval(() => {
      void fetchPreferences().then(fetchNotices);
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchNotices, fetchPreferences, userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n))
      );
      if (activeToast?.id === id) {
        setActiveToast(null);
      }

      try {
        await apiFetch(`/student/notifications/writing/${id}/read`, { method: "POST" });
      } catch {
        // If failed, re-fetch to restore accurate state
        void fetchNotices();
      }
    },
    [activeToast?.id, fetchNotices]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);
    if (!unreadIds.length) return;

    const now = new Date().toISOString();
    setNotifications((current) => current.map((n) => ({ ...n, readAt: n.readAt || now })));
    setActiveToast(null);

    try {
      try {
        await apiFetch("/student/notifications/read-all", { method: "POST" });
      } catch {
        await Promise.allSettled(
          unreadIds.map((id) =>
            apiFetch(`/student/notifications/writing/${id}/read`, { method: "POST" })
          )
        );
      }
    } catch {
      void fetchNotices();
    }
  }, [fetchNotices, notifications]);

  const dismissToast = useCallback((id: string) => {
    setActiveToast((current) => (current?.id === id ? null : current));
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt).length;
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      activeToast,
      refresh: fetchNotices,
      markAsRead,
      markAllAsRead,
      dismissToast,
    }),
    [notifications, unreadCount, loading, activeToast, fetchNotices, markAsRead, markAllAsRead, dismissToast]
  );

  return (
    <StudentNotificationContext.Provider value={value}>
      {children}
    </StudentNotificationContext.Provider>
  );
}

export function useStudentNotifications() {
  const context = useContext(StudentNotificationContext);
  if (!context) {
    throw new Error("useStudentNotifications must be used within a StudentNotificationProvider");
  }
  return context;
}
