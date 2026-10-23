"use client";

import { useState } from "react";
import { ArrowRight, X } from "@phosphor-icons/react";
import type { PlacementSurveyData } from "./placementTestTypes";
import styles from "./SurveyModal.module.css";

interface SurveyModalProps {
  initialData?: PlacementSurveyData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlacementSurveyData) => Promise<void>;
}

const BAND_OPTIONS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export function SurveyModal({
  initialData,
  isOpen,
  onClose,
  onSubmit,
}: SurveyModalProps) {
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 6);
  const defaultDateStr = defaultDate.toISOString().split("T")[0];

  const [targetBand, setTargetBand] = useState<number>(initialData?.targetBand || 6.5);
  const [examDate, setExamDate] = useState<string>(initialData?.examDate || defaultDateStr);
  const [studyHours, setStudyHours] = useState<number>(initialData?.studyHoursPerWeek || 10);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        targetBand,
        examDate,
        studyHoursPerWeek: studyHours,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>1. Trả lời khảo sát mục tiêu (2 phút)</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Target Band */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Band điểm IELTS mục tiêu của bạn:</label>
              <div className={styles.bandGrid}>
                {BAND_OPTIONS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setTargetBand(band)}
                    className={`${styles.bandBtn} ${
                      targetBand === band ? styles.bandBtnActive : ""
                    }`}
                  >
                    {band.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Date */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày dự thi dự kiến:</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {/* Study Hours */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Thời gian bạn có thể dành cho việc học:</label>
              <select
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className={styles.select}
              >
                <option value={5}>5 giờ / tuần (Ít thời gian)</option>
                <option value={10}>10 giờ / tuần (Tiêu chuẩn)</option>
                <option value={15}>15 giờ / tuần (Tập trung)</option>
                <option value={20}>20 giờ / tuần (Cấp tốc - Intensive)</option>
              </select>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Để sau
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              <span>{submitting ? "Đang lưu..." : "Bắt đầu làm Mocktest"}</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
