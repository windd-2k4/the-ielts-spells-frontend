"use client";

import { useMemo, useState } from "react";
import { ArrowClockwise, CheckCircle, Info, Sparkle } from "@phosphor-icons/react";
import type { SpeakingHintStep } from "@ielts/contracts";
import styles from "./SpeakingAttemptPlayer.module.css";

interface SpeakingBuilderPanelProps {
  steps: SpeakingHintStep[];
  selectedOptions: Record<string, string>; // stepId -> optionId
  onSelectOption: (stepId: string, optionId: string, sentence: string) => void;
  onReset: () => void;
}

export function SpeakingBuilderPanel({
  steps,
  selectedOptions,
  onSelectOption,
  onReset,
}: SpeakingBuilderPanelProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Calculate completed steps
  const completedCount = useMemo(() => {
    return steps.reduce((sum, step) => sum + (selectedOptions[step.id] ? 1 : 0), 0);
  }, [selectedOptions, steps]);

  // Assembled speech transcript from selected options
  const assembledTranscript = useMemo(() => {
    const sentences: string[] = [];
    steps.forEach((step) => {
      const selectedId = selectedOptions[step.id];
      if (selectedId) {
        const option = step.options.find((opt) => opt.id === selectedId);
        if (option) {
          const sentence = option.fullSentence?.trim() || option.phrase.trim();
          if (sentence) {
            // Capitalize first letter and end with dot if needed
            let clean = sentence.charAt(0).toUpperCase() + sentence.slice(1);
            if (!/[.!?]$/.test(clean)) clean += ".";
            sentences.push(clean);
          }
        }
      }
    });
    return sentences.join(" ");
  }, [selectedOptions, steps]);

  // Current active step
  const currentStep = steps[activeStepIndex] ?? steps[0];
  const isFinished = completedCount === steps.length && steps.length > 0;

  function handleOptionClick(stepId: string, optionId: string, sentence: string) {
    onSelectOption(stepId, optionId, sentence);
    // Auto advance to next step if not last
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  }

  if (!steps.length) {
    return (
      <div className={styles.emptyBuilderState}>
        <Info size={28} className={styles.emptyBuilderIcon} />
        <p className={styles.emptyBuilderText}>Câu hỏi này không có gợi ý từng bước.</p>
      </div>
    );
  }

  return (
    <div className={styles.builderContainer}>
      {/* Builder Top Bar: Progress and Reset */}
      <div className={styles.builderTopBar}>
        <div className={styles.builderProgressInfo}>
          <span className={styles.builderProgressLabel}>Tiến trình gợi ý:</span>
          <span className={styles.builderProgressValue}>
            {completedCount}/{steps.length} bước
          </span>
          <div className={styles.builderProgressBar}>
            <div
              className={styles.builderProgressBarFill}
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => {
              onReset();
              setActiveStepIndex(0);
            }}
            className={styles.resetBuilderButton}
            title="Chọn lại từ đầu"
          >
            <ArrowClockwise size={14} />
            <span>Chọn lại</span>
          </button>
        )}
      </div>

      {/* Assembled preview speech box */}
      <div className={styles.assembledSpeechBox}>
        <div className={styles.assembledSpeechHeader}>
          <Sparkle size={16} weight="fill" className={styles.sparkleIcon} />
          <span className={styles.assembledSpeechTitle}>Đoạn nói đang xây dựng</span>
        </div>
        <p className={styles.assembledSpeechContent}>
          {assembledTranscript ? (
            assembledTranscript
          ) : (
            <span className={styles.assembledSpeechPlaceholder}>
              Chọn các ý gợi ý bên dưới để tự động tạo đoạn nói hoàn chỉnh...
            </span>
          )}
        </p>
      </div>

      {/* Step navigation tabs (1, 2, 3, 4) */}
      <div className={styles.stepTabs}>
        {steps.map((step, idx) => {
          const isCompleted = !!selectedOptions[step.id];
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`${styles.stepTabButton} ${isActive ? styles.stepTabActive : ""} ${
                isCompleted ? styles.stepTabCompleted : ""
              }`}
            >
              <span className={styles.stepTabNumber}>
                {isCompleted ? <CheckCircle size={14} weight="fill" /> : idx + 1}
              </span>
              <span className={styles.stepTabTitle}>{step.title || `Bước ${idx + 1}`}</span>
            </button>
          );
        })}
      </div>

      {/* Current Step Instruction & Options Cards */}
      {currentStep && (
        <div className={styles.currentStepSection}>
          <div className={styles.stepInstructionBox}>
            <h4 className={styles.stepInstructionTitle}>
              {activeStepIndex + 1}. {currentStep.title}
            </h4>
            {currentStep.instruction && (
              <p className={styles.stepInstructionText}>{currentStep.instruction}</p>
            )}
          </div>

          <div className={styles.optionsList}>
            {currentStep.options.map((option, optIdx) => {
              const isSelected = selectedOptions[currentStep.id] === option.id;
              const sentence = option.fullSentence?.trim() || option.phrase.trim();
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(currentStep.id, option.id, sentence)}
                  className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                >
                  <div className={styles.optionCardHeader}>
                    <span className={styles.optionLetterBadge}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                  {option.phrase && (
                    <div className={styles.optionPhrase}>&ldquo;{option.phrase}&rdquo;</div>
                  )}
                  {option.fullSentence && option.fullSentence !== option.phrase && (
                    <div className={styles.optionFullSentence}>
                      Câu hoàn chỉnh: {option.fullSentence}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion message */}
      {isFinished && (
        <div className={styles.finishedCallout}>
          <CheckCircle size={22} weight="fill" className={styles.finishedIcon} />
          <div className={styles.finishedContent}>
            <p className={styles.finishedTitle}>Tuyệt vời! Bạn đã hoàn thành đoạn nói</p>
            <p className={styles.finishedText}>
              Hãy nhẩm đọc thử đoạn nói ở trên một lượt cho trôi chảy, sau đó bấm nút{" "}
              <strong>&ldquo;Bắt đầu ghi âm&rdquo;</strong> nhé!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
