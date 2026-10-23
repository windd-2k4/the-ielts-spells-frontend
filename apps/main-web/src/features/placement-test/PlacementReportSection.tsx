"use client";

import { useState } from "react";
import {
  BookOpenText,
  CaretDown,
  CaretUp,
  Headphones,
  Microphone,
  PenNib,
} from "@phosphor-icons/react";
import type { SkillReportSection } from "./placementTestTypes";
import styles from "./PlacementReportSection.module.css";

interface PlacementReportSectionProps {
  data: SkillReportSection;
  defaultOpen?: boolean;
}

export function PlacementReportSection({
  data,
  defaultOpen = false,
}: PlacementReportSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getSkillMeta = () => {
    switch (data.skill) {
      case "READING":
        return { label: "Reading", icon: <BookOpenText size={20} weight="fill" /> };
      case "LISTENING":
        return { label: "Listening", icon: <Headphones size={20} weight="fill" /> };
      case "WRITING_T1":
        return { label: "Writing task 1", icon: <PenNib size={20} weight="fill" /> };
      case "WRITING_T2":
        return { label: "Writing task 2", icon: <PenNib size={20} weight="fill" /> };
      case "SPEAKING":
        return { label: "Speaking", icon: <Microphone size={20} weight="fill" /> };
    }
  };

  const meta = getSkillMeta();

  return (
    <article className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ""}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.titleGroup}>
          <span className={styles.iconWrapper}>{meta.icon}</span>
          <span className={styles.skillTitle}>{meta.label}</span>
          <span className={styles.bandBadge}>{data.band.toFixed(1)}</span>
        </div>
        {isOpen ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
      </button>

      {isOpen && (
        <div className={styles.contentBody}>
          {/* General comment */}
          <div className={styles.generalCommentBox}>
            <h4 className={styles.generalCommentTitle}>Nhận xét chung</h4>
            <p className={styles.generalCommentText}>{data.overallComment}</p>
          </div>

          {/* 3-column analysis table */}
          <div className={styles.analysisTableWrapper}>
            <table className={styles.analysisTable}>
              <thead>
                <tr>
                  <th className={styles.colCriterion}>Mức độ hiện tại</th>
                  <th className={styles.colFeedback}>Nhận xét chi tiết</th>
                  <th className={styles.colKnowledge}>Kiến thức cần học</th>
                </tr>
              </thead>
              <tbody>
                {data.criteriaAnalysis.map((item, idx) => (
                  <tr key={item.criterion}>
                    <td className={styles.colCriterion}>
                      <div className={styles.criterionName}>
                        <span>{item.criterion}</span>
                        {item.score != null && (
                          <span className={styles.criterionScore}>{item.score.toFixed(1)}</span>
                        )}
                        {item.badge === "Sai nhiều nhất" && (
                          <span className={styles.badgeRed}>{item.badge}</span>
                        )}
                        {item.badge === "Sai khá nhiều" && (
                          <span className={styles.badgeYellow}>{item.badge}</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.colFeedback}>
                      <div style={{ whiteSpace: "pre-line" }}>{item.detailedFeedback}</div>
                    </td>
                    {idx === 0 && (
                      <td
                        className={styles.colKnowledge}
                        rowSpan={data.criteriaAnalysis.length}
                      >
                        <ul className={styles.knowledgeList}>
                          {data.knowledgeToLearn.map((k) => (
                            <li key={k.title}>
                              <strong>{k.title}:</strong> {k.description}
                            </li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}
