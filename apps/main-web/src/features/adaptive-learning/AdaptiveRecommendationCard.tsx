"use client";

import {
  ArrowRight,
  ChartLineUp,
  Clock,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  acceptAdaptiveRecommendation,
  getAdaptiveRecommendation,
  type AdaptiveRecommendation,
} from "./adaptiveLearningApi";
import styles from "./AdaptiveRecommendationCard.module.css";

const difficultyLabels = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
} as const;

export function AdaptiveRecommendationCard() {
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation>();
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setError(false);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void getAdaptiveRecommendation(controller.signal)
      .then((value) => {
        setRecommendation(value);
        setError(false);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, [reloadKey]);

  if (error) {
    return (
      <div className={styles.error} role="status">
        <span className={styles.errorMessage}>
          <WarningCircle size={18} weight="duotone" />
          Cá nhân hóa học tập tạm thời chưa khả dụng.
        </span>
        <button type="button" className={styles.retry} onClick={retry}>Thử lại</button>
      </div>
    );
  }
  if (!recommendation) return null;

  const mastery = Math.round(recommendation.masteryProbability * 100);
  return (
    <section className={styles.card} aria-labelledby="adaptive-recommendation-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>
          <Sparkle size={16} weight="duotone" /> Học tập thích ứng
        </span>
        <h2 id="adaptive-recommendation-title" className={styles.title}>
          {recommendation.title}
        </h2>
        <p className={styles.reason}>{recommendation.reason}</p>
        <div className={styles.metaRow} aria-label="Thông tin bài được đề xuất">
          {recommendation.durationMinutes ? (
            <span className={styles.meta}><Clock size={15} />{recommendation.durationMinutes} phút</span>
          ) : null}
          {recommendation.difficulty ? (
            <span className={styles.meta}>{difficultyLabels[recommendation.difficulty]}</span>
          ) : null}
          <span className={styles.meta}>
            <ChartLineUp size={15} />{recommendation.componentName}: {mastery}%
          </span>
          <span className={styles.meta}>{recommendation.evidenceCount} bằng chứng</span>
        </div>
      </div>
      <Link
        className={styles.action}
        href={recommendation.href}
        onClick={() => void acceptAdaptiveRecommendation(recommendation.id)}
      >
        Bắt đầu luyện tập <ArrowRight size={17} weight="bold" />
      </Link>
    </section>
  );
}

