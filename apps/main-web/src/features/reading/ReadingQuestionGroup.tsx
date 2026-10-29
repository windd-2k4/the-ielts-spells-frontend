"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingQuestionGroup as ReadingQuestionGroupModel } from "@ielts/contracts";
import { ArrowDown, BookmarkSimple, CheckSquare, Flag, Lightbulb, ListBullets, TextT, TreeStructure, X } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { answerValues, cleanDisplayText, groupQuestionLabel, optionLabel, questionOptions } from "./readingFormat";
import { AuthenticatedDiagramImage } from "./AuthenticatedDiagramImage";
import styles from "./ReadingAttemptPlayer.module.css";

export type ReadingQuestionGroupProps = {
  group: ReadingQuestionGroupModel;
  answers: Record<string, ReadingAnswer>;
  onAnswer: (questionKey: string, answer: ReadingAnswer) => void;
  activeQuestionKey: string;
  flaggedKeys: Set<string>;
  onQuestionFocus: (questionKey: string) => void;
  onToggleFlag: (questionKey: string) => void;
  skill?: "READING" | "LISTENING";
  onSeekAudio?: (timestampSeconds: number) => void;
  isExamMode?: boolean;
};

function gapFillContentTitle(group: ReadingQuestionGroupModel) {
  return typeof group.answerConfig?.gapFillTitle === "string"
    ? group.answerConfig.gapFillTitle.trim()
    : "";
}

export function ReadingQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  skill,
  onSeekAudio,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const isMatching =
    group.typeFormat === "MATCHING_HEADINGS" ||
    group.typeFormat === "MATCHING_INFORMATION" ||
    group.typeFormat === "MATCHING_FEATURES" ||
    group.typeFormat === "MATCHING_SENTENCE_ENDINGS";

  const isTFNG =
    group.typeFormat === "TRUE_FALSE_NOT_GIVEN" ||
    group.typeFormat === "YES_NO_NOT_GIVEN";

  const isMC =
    group.typeFormat === "MULTIPLE_CHOICE" ||
    group.typeFormat === "MULTIPLE_ANSWERS";

  const isTable = group.typeFormat === "TABLE_COMPLETION";
  const isFlowChart = group.typeFormat === "FLOW_CHART_COMPLETION";
  const isDiagram = group.typeFormat === "DIAGRAM_LABELING";
  const isShortAnswer = group.typeFormat === "SHORT_ANSWER";

  const isGapFill =
    Boolean(group.answerConfig?.gapFillTemplate) ||
    group.typeFormat === "SUMMARY_COMPLETION" ||
    group.typeFormat === "NOTE_COMPLETION" ||
    group.typeFormat === "SENTENCE_COMPLETION" ||
    group.typeFormat === "FILL_IN_BLANK";

  if (isMatching) {
    return (
      <MatchingQuestionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        skill={skill}
        onSeekAudio={onSeekAudio}
        isExamMode={isExamMode}
      />
    );
  }

  if (isTFNG) {
    return (
      <TFNGQuestionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isMC) {
    return (
      <MCQuestionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isTable) {
    return (
      <TableCompletionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isFlowChart) {
    return (
      <FlowChartCompletionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isDiagram) {
    return (
      <DiagramLabelingGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isShortAnswer) {
    return (
      <ShortAnswerQuestionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  if (isGapFill) {
    return (
      <GapFillQuestionGroup
        group={group}
        answers={answers}
        onAnswer={onAnswer}
        activeQuestionKey={activeQuestionKey}
        flaggedKeys={flaggedKeys}
        onQuestionFocus={onQuestionFocus}
        onToggleFlag={onToggleFlag}
        isExamMode={isExamMode}
      />
    );
  }

  // Default question format (Fallback)
  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {group.sharedOptions.length > 0 ? (
        <div className={styles.sharedOptions}>
          <p><ListBullets size={19} aria-hidden="true" />Danh sách lựa chọn</p>
          <ul>
            {group.sharedOptions.map((option) => (
              <li key={option.key}>{optionLabel(option.code, option.text)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.questionList}>
        {group.questions.map((question) => (
          <DefaultQuestionCard
            key={question.key}
            question={question}
            group={group}
            answer={answers[question.key]}
            onAnswer={onAnswer}
            active={activeQuestionKey === question.key}
            flagged={flaggedKeys.has(question.key)}
            onFocus={onQuestionFocus}
            onToggleFlag={onToggleFlag}
          />
        ))}
      </div>
    </section>
  );
}

// ========================================================
// 1 & 2: True/False/Not Given & Yes/No/Not Given Component
// ========================================================
function TFNGQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const options =
    group.typeFormat === "TRUE_FALSE_NOT_GIVEN"
      ? ["TRUE", "FALSE", "NOT GIVEN"]
      : ["YES", "NO", "NOT GIVEN"];

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={styles.questionList}>
        {group.questions.map((question) => {
          const answer = answers[question.key];
          const selectedValue = answerValues(answer)[0] ?? "";
          const active = activeQuestionKey === question.key;
          const flagged = flaggedKeys.has(question.key);

          return (
            <article
              key={question.key}
              id={`reading-question-${question.key}`}
              className={`${isExamMode ? styles.examMcQuestion : styles.tfngQuestion} ${
                active ? (isExamMode ? styles.examMcQuestionActive : styles.tfngQuestionActive) : ""
              }`}
              onClick={() => onQuestionFocus(question.key)}
            >
              <div className={isExamMode ? styles.examMcTopline : styles.tfngTopline}>
                <div className={isExamMode ? styles.examMcPromptWrapper : styles.tfngPromptWrapper}>
                  {isExamMode ? (
                    <strong className={styles.examMcNumber}>{question.number}</strong>
                  ) : (
                    <span className={styles.circleQuestionBadge}>{question.number}</span>
                  )}
                  <p className={isExamMode ? styles.mcPromptText : styles.tfngPrompt}>{question.prompt || "Nội dung câu hỏi"}</p>
                </div>

                {isExamMode ? (
                  <button
                    type="button"
                    className={`${styles.examBookmarkBtn} ${flagged ? styles.examBookmarkBtnActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(question.key);
                    }}
                    aria-pressed={flagged}
                    title="Đánh dấu xem lại"
                  >
                    <BookmarkSimple size={14} weight={flagged ? "fill" : "regular"} />
                    <span>Review</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(question.key);
                    }}
                    aria-pressed={flagged}
                    title="Đánh dấu câu này"
                  >
                    <Flag size={15} weight={flagged ? "fill" : "regular"} />
                  </button>
                )}
              </div>

              <div className={isExamMode ? styles.mcOptionsList : styles.radioOptionsList}>
                {options.map((opt) => {
                  const isChecked = selectedValue === opt;
                  return (
                    <label
                      key={opt}
                      className={`${isExamMode ? styles.examOptionRow : styles.radioOptionRow} ${
                        isChecked ? (isExamMode ? styles.examOptionRowChecked : styles.radioOptionRowChecked) : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`tfng-q-${question.key}`}
                        checked={isChecked}
                        onChange={() => onAnswer(question.key, { value: opt })}
                        className={styles.circularRadio}
                      />
                      <span className={styles.radioLabelText}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ========================================================
// 3: Multiple Choice Component
// ========================================================
function MCQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const isMultipleAnswers = group.typeFormat === "MULTIPLE_ANSWERS";
  const requiredCount =
    typeof group.answerConfig?.requiredAnswerCount === "number" && group.answerConfig.requiredAnswerCount > 1
      ? group.answerConfig.requiredAnswerCount
      : 2;

  if (isMultipleAnswers) {
    const clusterSize = requiredCount;
    const clusters: ReadingQuestion[][] = [];
    for (let i = 0; i < group.questions.length; i += clusterSize) {
      clusters.push(group.questions.slice(i, i + clusterSize));
    }

    return (
      <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
        <div className={styles.groupHeading}>
          <div>
            <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
            <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
            {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
          </div>
          <span className={styles.questionCount}>{group.questions.length} câu</span>
        </div>

        <div className={styles.questionList}>
          {clusters.map((cluster) => {
            const primaryQuestion = cluster[0];
            const startNum = primaryQuestion.number;
            const endNum = cluster.at(-1)?.number ?? startNum;
            const hasMultipleNumbers = startNum !== endNum;

            let selectedValues: string[] = [];
            for (const q of cluster) {
              const vals = answerValues(answers[q.key]);
              if (vals.length > selectedValues.length) {
                selectedValues = vals;
              }
            }
            if (selectedValues.length === 0) {
              const collected = cluster.map((q) => answers[q.key]?.value).filter((v): v is string => Boolean(v));
              if (collected.length > 0) {
                selectedValues = Array.from(new Set(collected));
              }
            }

            const options = questionOptions(primaryQuestion, group);
            const active = cluster.some((q) => activeQuestionKey === q.key);
            const flagged = cluster.some((q) => flaggedKeys.has(q.key));
            const currentCount = selectedValues.length;

            const handleClusterOptionToggle = (optionKey: string) => {
              const isChecked = selectedValues.includes(optionKey);
              let nextValues: string[];
              if (isChecked) {
                nextValues = selectedValues.filter((v) => v !== optionKey);
              } else {
                if (selectedValues.length >= requiredCount) {
                  nextValues = [...selectedValues.slice(1), optionKey];
                } else {
                  nextValues = [...selectedValues, optionKey];
                }
              }

              cluster.forEach((q, idx) => {
                const singleVal = nextValues[idx] ?? "";
                onAnswer(q.key, {
                  value: singleVal,
                  values: nextValues,
                });
              });
            };

            return (
              <article
                key={primaryQuestion.key}
                id={`reading-question-${primaryQuestion.key}`}
                className={`${isExamMode ? styles.examMcQuestion : `${styles.mcQuestion} ${styles.mcMultipleCluster}`} ${
                  active ? (isExamMode ? styles.examMcQuestionActive : styles.mcQuestionActive) : ""
                }`}
                onClick={() => onQuestionFocus(primaryQuestion.key)}
              >
                {cluster.slice(1).map((q) => (
                  <span key={q.key} id={`reading-question-${q.key}`} className="sr-only" />
                ))}

                <div className={isExamMode ? styles.examMcTopline : styles.mcTopline}>
                  <div className={isExamMode ? styles.examMcPromptWrapper : styles.mcPromptWrapper}>
                    {isExamMode ? (
                      <span className={`${styles.examMcNumber} ${styles.examMcNumberRange}`}>
                        {startNum}{hasMultipleNumbers ? `–${endNum}` : ""}
                      </span>
                    ) : (
                      <div className={styles.multipleBadgeRow}>
                        <span className={styles.multipleBadgeCircle}>{startNum}</span>
                        {hasMultipleNumbers && (
                          <>
                            <span className={styles.multipleBadgeDash}>–</span>
                            <span className={styles.multipleBadgeCircle}>{endNum}</span>
                          </>
                        )}
                      </div>
                    )}
                    <span className={styles.mcPromptText}>{primaryQuestion.prompt || "Nội dung câu hỏi"}</span>
                  </div>

                  {isExamMode ? (
                    <button
                      type="button"
                      className={`${styles.examBookmarkBtn} ${flagged ? styles.examBookmarkBtnActive : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        cluster.forEach((q) => onToggleFlag(q.key));
                      }}
                      aria-pressed={flagged}
                      title="Đánh dấu xem lại"
                    >
                      <BookmarkSimple size={14} weight={flagged ? "fill" : "regular"} />
                      <span>Review</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        cluster.forEach((q) => onToggleFlag(q.key));
                      }}
                      aria-pressed={flagged}
                      title="Đánh dấu câu này"
                    >
                      <Flag size={15} weight={flagged ? "fill" : "regular"} />
                    </button>
                  )}
                </div>

                {!isExamMode ? (
                  <div className={styles.mcCounterWrapper}>
                    <span className={`${styles.mcCounterBadge} ${currentCount === requiredCount ? styles.mcCounterBadgeDone : ""}`}>
                      <CheckSquare size={14} weight="bold" />
                      Đã chọn {currentCount} / {requiredCount} đáp án
                    </span>
                  </div>
                ) : null}

                <div className={styles.mcOptionsList} style={{ marginLeft: 0 }}>
                  {options.map((option) => {
                    const isChecked = selectedValues.includes(option.key) || selectedValues.includes(option.code ?? "");
                    const label = isExamMode ? (option.text || option.code) : optionLabel(option.code, option.text);

                    return (
                      <label
                        key={option.key}
                        className={`${isExamMode ? styles.examOptionRow : `${styles.mcOptionRow} ${styles.mcOptionRowMultiple}`} ${
                          isChecked ? (isExamMode ? styles.examOptionRowChecked : styles.mcOptionRowChecked) : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`mc-cluster-${primaryQuestion.key}`}
                          checked={isChecked}
                          onChange={() => handleClusterOptionToggle(option.key)}
                          className={styles.customCheckbox}
                        />
                        <span className={styles.radioLabelText}>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={styles.questionList}>
        {group.questions.map((question) => {
          const answer = answers[question.key];
          const selectedValues = answerValues(answer);
          const options = questionOptions(question, group);
          const active = activeQuestionKey === question.key;
          const flagged = flaggedKeys.has(question.key);

          const handleOptionToggle = (optionKey: string) => {
            onAnswer(question.key, { value: optionKey });
          };

          return (
            <article
              key={question.key}
              id={`reading-question-${question.key}`}
              className={`${isExamMode ? styles.examMcQuestion : styles.mcQuestion} ${
                active ? (isExamMode ? styles.examMcQuestionActive : styles.mcQuestionActive) : ""
              }`}
              onClick={() => onQuestionFocus(question.key)}
            >
              <div className={isExamMode ? styles.examMcTopline : styles.mcTopline}>
                <div className={isExamMode ? styles.examMcPromptWrapper : styles.mcPromptWrapper}>
                  {isExamMode ? (
                    <strong className={styles.examMcNumber}>{question.number}</strong>
                  ) : (
                    <strong className={styles.mcNumber}>{question.number}</strong>
                  )}
                  <span className={styles.mcPromptText}>{question.prompt || "Nội dung câu hỏi"}</span>
                </div>

                {isExamMode ? (
                  <button
                    type="button"
                    className={`${styles.examBookmarkBtn} ${flagged ? styles.examBookmarkBtnActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(question.key);
                    }}
                    aria-pressed={flagged}
                    title="Đánh dấu xem lại"
                  >
                    <BookmarkSimple size={14} weight={flagged ? "fill" : "regular"} />
                    <span>Review</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(question.key);
                    }}
                    aria-pressed={flagged}
                    title="Đánh dấu câu này"
                  >
                    <Flag size={15} weight={flagged ? "fill" : "regular"} />
                  </button>
                )}
              </div>

              <div className={styles.mcOptionsList}>
                {options.map((option) => {
                  const isChecked = selectedValues.includes(option.key) || selectedValues.includes(option.code ?? "");
                  const label = isExamMode ? (option.text || option.code) : optionLabel(option.code, option.text);

                  return (
                    <label
                      key={option.key}
                      className={`${isExamMode ? styles.examOptionRow : styles.mcOptionRow} ${
                        isChecked ? (isExamMode ? styles.examOptionRowChecked : styles.mcOptionRowChecked) : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mc-q-${question.key}`}
                        checked={isChecked}
                        onChange={() => handleOptionToggle(option.key)}
                        className={styles.circularRadio}
                      />
                      <span className={styles.radioLabelText}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ========================================================
// 4 & 5: Matching Headings & Matching Information Component
// ========================================================
function MatchingQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  skill,
  onSeekAudio,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [dragOverKey, setDragOverKey] = useState("");

  const isListening = skill === "LISTENING" || Boolean(group.answerConfig?.linkedAudioTimestamp);
  const isHeadings = group.typeFormat === "MATCHING_HEADINGS";
  const isFeatures = group.typeFormat === "MATCHING_FEATURES";
  const isSentenceEndings = group.typeFormat === "MATCHING_SENTENCE_ENDINGS";
  const isInformation = group.typeFormat === "MATCHING_INFORMATION";

  const bankTitle = isListening
    ? "List of options"
    : isHeadings
    ? "List of Headings"
    : isFeatures
    ? "List of Features / People"
    : isSentenceEndings
    ? "List of Sentence Endings"
    : isInformation
    ? "List of Paragraphs"
    : "List of options";

  const canReuseOptions = group.answerConfig && typeof group.answerConfig.allowOptionReused === "boolean"
    ? group.answerConfig.allowOptionReused
    : isFeatures || (isInformation && !isListening);

  const bankOptions =
    group.sharedOptions.length > 0
      ? group.sharedOptions
      : group.questions.flatMap((q) => q.options);

  // Check which options are currently used in answers
  const usedOptionKeys = new Set(
    group.questions.map((q) => {
      const val = answerValues(answers[q.key])[0];
      return val;
    }).filter(Boolean)
  );

  const handleSlotClick = (questionKey: string) => {
    onQuestionFocus(questionKey);
    if (selectedOptionKey) {
      onAnswer(questionKey, { value: selectedOptionKey });
      setSelectedOptionKey("");
    }
  };

  const handleClearSlot = (questionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAnswer(questionKey, { value: "" });
  };

  // Render option bank for Reading
  const renderOptionBank = () => (
    <div className={isExamMode ? styles.examMatchingBankCol : styles.matchingBankSection}>
      <h4 className={isExamMode ? styles.examMatchingBankTitle : styles.matchingBankTitle}>{bankTitle}</h4>
      {isFeatures ? (
        <span className={styles.matchingFeaturesNote}>
          NB You may use any letter more than once.
        </span>
      ) : null}
      <p className={styles.matchingBankHint}>
        <Lightbulb size={16} className="text-amber-500 shrink-0" />
        {isFeatures
          ? "Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống. (Một lựa chọn có thể dùng nhiều lần)."
          : "Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống để điền."}
      </p>
      <div className={isExamMode ? styles.matchingListeningBankList : styles.matchingOptionsPillsGrid}>
        {bankOptions.map((opt) => {
          const isSelected = selectedOptionKey === opt.key;
          const isUsed = !canReuseOptions && (usedOptionKeys.has(opt.key) || usedOptionKeys.has(opt.code ?? ""));

          return (
            <button
              key={opt.key}
              type="button"
              draggable={!isUsed}
              disabled={isUsed}
              onDragStart={(e) => {
                if (isUsed) return;
                e.dataTransfer.setData("text/plain", opt.key);
                setSelectedOptionKey(opt.key);
              }}
              onClick={() => {
                if (isUsed) return;
                setSelectedOptionKey(isSelected ? "" : opt.key);
              }}
              className={`${
                isExamMode
                  ? `${styles.examMatchingBankCard} ${
                      isSelected ? styles.examMatchingBankCardActive : isUsed ? styles.examMatchingBankCardUsed : ""
                    }`
                  : `${styles.matchingOptionPill} ${
                      isSelected ? styles.matchingOptionPillActive : isUsed ? styles.matchingOptionPillUsed : ""
                    }`
              }`}
              title={isUsed ? "Lựa chọn này đã được sử dụng" : "Bấm hoặc kéo để điền vào câu hỏi"}
            >
              <span>{optionLabel(opt.code, opt.text)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render questions for Reading
  const renderQuestions = () => (
    <div className={styles.matchingQuestionsList}>
      {group.questions.map((question) => {
        const val = answerValues(answers[question.key])[0] ?? "";
        const matchedOption = bankOptions.find((o) => o.key === val || o.code === val);
        const displayLabel = matchedOption ? optionLabel(matchedOption.code, matchedOption.text) : val;
        const active = activeQuestionKey === question.key;
        const flagged = flaggedKeys.has(question.key);
        const isDragOver = dragOverKey === question.key;

        return (
          <div
            key={question.key}
            id={`reading-question-${question.key}`}
            className={`${isExamMode ? styles.matchingListeningRow : styles.matchingQuestionItem} ${
              active ? (isExamMode ? styles.matchingListeningRowActive : styles.matchingQuestionItemActive) : ""
            }`}
            onClick={() => onQuestionFocus(question.key)}
          >
            <div className={styles.matchingQuestionLeft}>
              <strong className={styles.matchingQuestionNum}>{question.number}.</strong>
              <span className={styles.matchingQuestionPrompt}>
                {question.prompt || `Câu ${question.number}`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Interactive Target Slot */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverKey(question.key);
                }}
                onDragLeave={() => setDragOverKey("")}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverKey("");
                  const droppedKey = e.dataTransfer.getData("text/plain");
                  if (droppedKey) {
                    onAnswer(question.key, { value: droppedKey });
                    setSelectedOptionKey("");
                  }
                }}
                onClick={() => handleSlotClick(question.key)}
                className={`${
                  isExamMode
                    ? `${styles.examMatchingDashedSlot} ${val ? styles.examMatchingDashedSlotFilled : ""} ${
                        isDragOver || (selectedOptionKey && !val) ? styles.examMatchingDashedSlotActive : ""
                      }`
                    : `${styles.matchingTargetSlot} ${
                        val ? styles.matchingTargetSlotFilled : styles.matchingTargetSlotEmpty
                      } ${isDragOver || (selectedOptionKey && !val) ? styles.matchingTargetSlotActive : ""}`
                }`}
                title={val ? "Bấm để thay thế hoặc xóa" : selectedOptionKey ? "Bấm để điền đáp án đã chọn" : "Kéo hoặc chọn đáp án vào đây"}
              >
                {val ? (
                  <>
                    <span className="truncate max-w-[200px] text-xs font-semibold">{displayLabel}</span>
                    <button
                      type="button"
                      className={styles.matchingSlotClearBtn}
                      onClick={(e) => handleClearSlot(question.key, e)}
                      title="Xóa đáp án"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </>
                ) : (
                  <span className="font-bold">{isExamMode ? `[ ${question.number} ]` : question.number}</span>
                )}
              </div>

              {isSentenceEndings ? <strong className="text-slate-400 text-lg">.</strong> : null}

              {isExamMode ? (
                <button
                  type="button"
                  className={`${styles.examBookmarkBtn} ${flagged ? styles.examBookmarkBtnActive : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFlag(question.key);
                  }}
                  aria-pressed={flagged}
                  title="Đánh dấu xem lại"
                >
                  <BookmarkSimple size={14} weight={flagged ? "fill" : "regular"} />
                  <span>Review</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFlag(question.key);
                  }}
                  aria-pressed={flagged}
                  title="Đánh dấu câu này"
                >
                  <Flag size={15} weight={flagged ? "fill" : "regular"} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className={`${styles.questionGroup} ${styles.matchingGroup}`} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {/* Listening Matching Information: 2-Column Split Layout (Ảnh 1) */}
      {isListening ? (
        <div className={styles.matchingListeningSplitLayout}>
          {/* Cột trái: Danh sách câu hỏi */}
          <div className={styles.matchingListeningQuestionsCol}>
            {group.questions.map((question) => {
              const val = answerValues(answers[question.key])[0] ?? "";
              const matchedOption = bankOptions.find((o) => o.key === val || o.code === val);
              const displayLabel = matchedOption ? (matchedOption.text || matchedOption.code) : val;
              const active = activeQuestionKey === question.key;
              const flagged = flaggedKeys.has(question.key);
              const isDragOver = dragOverKey === question.key;

              return (
                <div
                  key={question.key}
                  id={`listening-question-${question.key}`}
                  className={`${styles.matchingListeningRow} ${active ? styles.matchingListeningRowActive : ""}`}
                  onClick={() => onQuestionFocus(question.key)}
                >
                  <span className={styles.matchingListeningPrompt}>
                    {question.prompt || `Câu hỏi ${question.number}`}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverKey(question.key);
                      }}
                      onDragLeave={() => setDragOverKey("")}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverKey("");
                        const droppedKey = e.dataTransfer.getData("text/plain");
                        if (droppedKey) {
                          onAnswer(question.key, { value: droppedKey });
                          setSelectedOptionKey("");
                        }
                      }}
                      onClick={() => handleSlotClick(question.key)}
                      className={`${
                        isExamMode
                          ? `${styles.examMatchingDashedSlot} ${val ? styles.examMatchingDashedSlotFilled : ""} ${
                              isDragOver || (selectedOptionKey && !val) ? styles.examMatchingDashedSlotActive : ""
                            }`
                          : `${styles.matchingListeningSlot} ${
                              val ? styles.matchingListeningSlotFilled : styles.matchingListeningSlotEmpty
                            } ${isDragOver || (selectedOptionKey && !val) ? styles.matchingListeningSlotActive : ""}`
                      }`}
                      title={val ? "Bấm để thay thế hoặc xóa" : selectedOptionKey ? "Bấm để điền đáp án đã chọn" : "Kéo hoặc chọn đáp án vào đây"}
                    >
                      {val ? (
                        <>
                          <span className="truncate max-w-[200px] text-xs font-semibold">{displayLabel}</span>
                          <button
                            type="button"
                            className={styles.matchingSlotClearBtn}
                            onClick={(e) => handleClearSlot(question.key, e)}
                            title="Xóa đáp án"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </>
                      ) : (
                        <span className="font-bold">{isExamMode ? `[ ${question.number} ]` : question.number}</span>
                      )}
                    </div>

                    {isExamMode ? (
                      <button
                        type="button"
                        className={`${styles.examBookmarkBtn} ${flagged ? styles.examBookmarkBtnActive : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFlag(question.key);
                        }}
                        aria-pressed={flagged}
                        title="Đánh dấu xem lại"
                      >
                        <BookmarkSimple size={14} weight={flagged ? "fill" : "regular"} />
                        <span>Review</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFlag(question.key);
                        }}
                        aria-pressed={flagged}
                        title="Đánh dấu câu này"
                      >
                        <Flag size={15} weight={flagged ? "fill" : "regular"} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột phải: List of options */}
          <div className={isExamMode ? styles.examMatchingBankCol : styles.matchingListeningBankCol}>
            <h4 className={isExamMode ? styles.examMatchingBankTitle : styles.matchingBankTitle}>List of options</h4>
            {canReuseOptions ? (
              <span className={styles.matchingFeaturesNote}>
                NB You may use any letter more than once.
              </span>
            ) : null}
            {!isExamMode ? (
              <p className={styles.matchingBankHint}>
                <Lightbulb size={16} className="text-amber-500 shrink-0" />
                <span>Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống để điền.</span>
              </p>
            ) : null}

            <div className={styles.matchingListeningBankList}>
              {bankOptions.map((opt) => {
                const isSelected = selectedOptionKey === opt.key;
                const isUsed = !canReuseOptions && (usedOptionKeys.has(opt.key) || usedOptionKeys.has(opt.code ?? ""));
                const labelText = opt.text ? `${opt.code ? `${opt.code}. ` : ""}${opt.text}` : opt.code;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    draggable={!isUsed}
                    disabled={isUsed}
                    onDragStart={(e) => {
                      if (isUsed) return;
                      e.dataTransfer.setData("text/plain", opt.key);
                      setSelectedOptionKey(opt.key);
                    }}
                    onClick={() => {
                      if (isUsed) return;
                      setSelectedOptionKey(isSelected ? "" : opt.key);
                    }}
                    className={`${
                      isExamMode
                        ? `${styles.examMatchingBankCard} ${
                            isSelected ? styles.examMatchingBankCardActive : isUsed ? styles.examMatchingBankCardUsed : ""
                          }`
                        : `${styles.matchingListeningOptionCard} ${
                            isSelected
                              ? styles.matchingListeningOptionCardActive
                              : isUsed
                              ? styles.matchingListeningOptionCardUsed
                              : ""
                          }`
                    }`}
                    title={isUsed ? "Lựa chọn này đã được sử dụng" : "Bấm hoặc kéo để điền vào câu hỏi"}
                  >
                    <span>{labelText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : isHeadings ? (
        <>
          {renderOptionBank()}
          {renderQuestions()}
        </>
      ) : (
        <>
          {renderQuestions()}
          {renderOptionBank()}
        </>
      )}
    </section>
  );
}

// ========================================================
// Default Question Card (Fill in blanks / Short answer)
// ========================================================
function DefaultQuestionCard({
  question,
  group,
  answer,
  onAnswer,
  active,
  flagged,
  onFocus,
  onToggleFlag,
}: {
  question: ReadingQuestion;
  group: ReadingQuestionGroupModel;
  answer: ReadingAnswer | undefined;
  onAnswer: (questionKey: string, value: ReadingAnswer) => void;
  active: boolean;
  flagged: boolean;
  onFocus: (questionKey: string) => void;
  onToggleFlag: (questionKey: string) => void;
}) {
  const values = answerValues(answer);
  const wordLimit = typeof group.answerConfig.wordLimitRule === "string" ? group.answerConfig.wordLimitRule : undefined;

  return (
    <article
      id={`reading-question-${question.key}`}
      className={`${styles.questionCard} ${active ? styles.questionCardActive : ""}`}
      onClick={() => onFocus(question.key)}
      onFocusCapture={() => onFocus(question.key)}
    >
      <div className={styles.questionTopline}>
        <span className={styles.questionNumber} aria-label={`Câu ${question.number}`}>{question.number}</span>
        <button
          type="button"
          className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFlag(question.key);
          }}
          aria-pressed={flagged}
          aria-label={`${flagged ? "Bỏ đánh dấu" : "Đánh dấu"} câu ${question.number}`}
        >
          <Flag size={17} weight={flagged ? "fill" : "regular"} aria-hidden="true" />
          {flagged ? "Đã đánh dấu" : "Đánh dấu"}
        </button>
      </div>
      <div className={styles.questionBody}>
        <p className={styles.questionPrompt}>{question.prompt || "Nội dung câu hỏi không khả dụng."}</p>
        <label className={styles.textAnswer}>
          <span><TextT size={18} aria-hidden="true" />Câu trả lời</span>
          <input
            value={values[0] ?? ""}
            onChange={(event) => onAnswer(question.key, { value: event.target.value })}
            autoComplete="off"
            spellCheck={false}
            placeholder="Nhập câu trả lời"
          />
          {wordLimit ? <small><CheckSquare size={16} aria-hidden="true" />{wordLimit}</small> : null}
        </label>
      </div>
    </article>
  );
}

// ========================================================
// Gap-Filling / Summary / Note Completion (CD-IELTS Standard)
// ========================================================
function GapInlineSlot({
  question,
  answer,
  onAnswer,
  active,
  flagged,
  onFocus,
  onToggleFlag,
  isExamMode,
  optionBank,
  selectedOptionKey,
  dragOver,
  onOptionDrop,
  onOptionSlotClick,
  onDragStateChange,
}: {
  question: ReadingQuestion;
  answer: ReadingAnswer | undefined;
  onAnswer: (questionKey: string, value: ReadingAnswer) => void;
  active: boolean;
  flagged: boolean;
  onFocus: (questionKey: string) => void;
  onToggleFlag: (questionKey: string) => void;
  isExamMode?: boolean;
  optionBank?: ReadingQuestionGroupModel["sharedOptions"];
  selectedOptionKey?: string;
  dragOver?: boolean;
  onOptionDrop?: (questionKey: string, optionKey: string) => void;
  onOptionSlotClick?: (questionKey: string) => void;
  onDragStateChange?: (questionKey: string) => void;
}) {
  const values = answerValues(answer);
  const textValue = values[0] ?? "";
  const isFilled = textValue.trim().length > 0;

  if (optionBank?.length) {
    const selectedOption = optionBank.find((option) => option.key === textValue || option.code === textValue);

    return (
      <span
        id={`reading-question-${question.key}`}
        className={styles.gapOptionSlotWrap}
      >
        <button
          type="button"
          className={`${styles.gapOptionSlot} ${active ? styles.gapOptionSlotActive : ""} ${
            isFilled ? styles.gapOptionSlotFilled : ""
          } ${dragOver || (selectedOptionKey && !isFilled) ? styles.gapOptionSlotReady : ""}`}
          onClick={() => {
            onFocus(question.key);
            onOptionSlotClick?.(question.key);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            onDragStateChange?.(question.key);
          }}
          onDragLeave={() => onDragStateChange?.("")}
          onDrop={(event) => {
            event.preventDefault();
            onDragStateChange?.("");
            const optionKey = event.dataTransfer.getData("text/plain");
            if (optionKey) onOptionDrop?.(question.key, optionKey);
          }}
          aria-label={selectedOption ? `Câu ${question.number}: ${selectedOption.text}` : `Điền đáp án câu ${question.number}`}
          title={selectedOption ? "Bấm dấu x để bỏ đáp án" : "Kéo đáp án vào đây hoặc chọn đáp án rồi bấm vào ô"}
        >
          {selectedOption?.text || question.number}
        </button>
        {selectedOption ? (
          <button
            type="button"
            className={styles.gapOptionSlotClear}
            onClick={() => onAnswer(question.key, { value: "" })}
            aria-label={`Xóa đáp án câu ${question.number}`}
            title="Xóa đáp án"
          >
            <X size={12} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </span>
    );
  }

  if (isExamMode) {
    return (
      <span
        id={`reading-question-${question.key}`}
        style={{ display: "inline-block", verticalAlign: "middle" }}
        onClick={() => onFocus(question.key)}
      >
        <input
          type="text"
          className={`${styles.examInputBox} ${active ? styles.examInputBoxActive : ""} ${isFilled ? styles.examInputBoxFilled : ""}`}
          value={textValue}
          onChange={(e) => onAnswer(question.key, { value: e.target.value })}
          onFocus={() => onFocus(question.key)}
          placeholder={String(question.number)}
          aria-label={`Câu ${question.number}`}
          autoComplete="off"
          spellCheck={false}
        />
      </span>
    );
  }

  return (
    <span
      id={`reading-question-${question.key}`}
      className={styles.gapInlineSlot}
      onClick={() => onFocus(question.key)}
    >
      <input
        type="text"
        className={`${styles.gapInlineInput} ${active ? styles.gapInlineInputActive : ""} ${isFilled ? styles.gapInlineInputFilled : ""}`}
        value={textValue}
        onChange={(e) => onAnswer(question.key, { value: e.target.value })}
        onFocus={() => onFocus(question.key)}
        placeholder={String(question.number)}
        aria-label={`Câu ${question.number}`}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className={`${styles.gapInlineFlagBtn} ${flagged ? styles.gapInlineFlagBtnActive : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFlag(question.key);
        }}
        title={flagged ? `Bỏ đánh dấu câu ${question.number}` : `Đánh dấu câu ${question.number}`}
        aria-pressed={flagged}
        aria-label={`Đánh dấu câu ${question.number}`}
      >
        <Flag size={13} weight={flagged ? "fill" : "regular"} />
      </button>
    </span>
  );
}

function parseLineTokens(line: string): Array<{ type: "text"; text: string } | { type: "slot"; questionNo: number }> {
  const tokens: Array<{ type: "text"; text: string } | { type: "slot"; questionNo: number }> = [];
  const regex = /\[\[(\d+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: line.substring(lastIndex, match.index) });
    }
    tokens.push({ type: "slot", questionNo: parseInt(match[1], 10) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "text", text: line.substring(lastIndex) });
  }

  return tokens;
}

function GapFillQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [dragOverKey, setDragOverKey] = useState("");
  const isOptionBank = group.typeFormat === "SUMMARY_COMPLETION" && group.sharedOptions.length > 0;
  const canReuseOptions = group.answerConfig?.allowOptionReused === true;
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? cleanDisplayText(group.answerConfig.gapFillTemplate)
      : "";
  const contentTitle = gapFillContentTitle(group);

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => {
      map.set(q.number, q);
    });
    return map;
  }, [group.questions]);

  const templateLines = useMemo(() => {
    if (!rawTemplate) return [];
    return rawTemplate.split(/\r?\n/);
  }, [rawTemplate]);

  const usedOptionKeys = new Set(
    group.questions
      .map((question) => answerValues(answers[question.key])[0])
      .filter(Boolean),
  );

  const placeOption = (questionKey: string, optionKey: string) => {
    const option = group.sharedOptions.find((item) => item.key === optionKey || item.code === optionKey);
    if (!option) return;
    onAnswer(questionKey, { value: option.key });
    setSelectedOptionKey("");
  };

  const renderGapSlot = (question: ReadingQuestion) => (
    <GapInlineSlot
      key={question.key}
      question={question}
      answer={answers[question.key]}
      onAnswer={onAnswer}
      active={activeQuestionKey === question.key}
      flagged={flaggedKeys.has(question.key)}
      onFocus={onQuestionFocus}
      onToggleFlag={onToggleFlag}
      isExamMode={isExamMode}
      optionBank={isOptionBank ? group.sharedOptions : undefined}
      selectedOptionKey={selectedOptionKey}
      dragOver={dragOverKey === question.key}
      onOptionDrop={placeOption}
      onOptionSlotClick={(questionKey) => {
        if (selectedOptionKey) placeOption(questionKey, selectedOptionKey);
      }}
      onDragStateChange={setDragOverKey}
    />
  );

  return (
    <section className={`${styles.questionGroup} ${isOptionBank ? styles.gapOptionGroup : ""}`} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          {!isOptionBank ? <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p> : null}
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {isOptionBank ? (
            <p className={styles.instructions}>Complete the summary using the list of phrases below.</p>
          ) : group.instructions ? (
            <p className={styles.instructions}>{group.instructions}</p>
          ) : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        {!isOptionBank ? <span className={styles.questionCount}>{group.questions.length} câu</span> : null}
      </div>

      {group.sharedOptions.length > 0 && !isOptionBank ? (
        <div className={styles.sharedOptions}>
          <p><ListBullets size={18} aria-hidden="true" />Danh sách lựa chọn</p>
          <ul>
            {group.sharedOptions.map((option) => (
              <li key={option.key}>{optionLabel(option.code, option.text)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${styles.gapFillCard} ${isOptionBank ? styles.gapOptionSummaryCard : ""}`}>
        {contentTitle && !isOptionBank ? (
          <h4 className={styles.gapFillTitle}>{contentTitle}</h4>
        ) : null}

        <div className={`${styles.gapFillBody} ${isOptionBank ? styles.gapOptionSummaryBody : ""}`}>
          {rawTemplate ? (
            templateLines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} style={{ height: "8px" }} />;
              }

              const isHeading =
                (trimmed.startsWith("#") ||
                  (trimmed.endsWith(":") && !trimmed.includes("[[") && trimmed.length < 60)) &&
                !trimmed.startsWith("•") &&
                !trimmed.startsWith("-");

              if (isHeading) {
                const headingText = trimmed.replace(/^#+\s*/, "");
                return (
                  <div key={lineIdx} className={styles.gapFillHeadingLine}>
                    {headingText}
                  </div>
                );
              }

              const tokens = parseLineTokens(line);
              return (
                <div key={lineIdx} className={styles.gapFillLine}>
                  {tokens.map((token, tokenIdx) => {
                    if (token.type === "text") {
                      return <span key={tokenIdx}>{token.text}</span>;
                    }
                    const q =
                      questionByNumber.get(token.questionNo) ??
                      group.questions[token.questionNo - 1];
                    if (!q) {
                      return <span key={tokenIdx}>[[{token.questionNo}]]</span>;
                    }
                    return renderGapSlot(q);
                  })}
                </div>
              );
            })
          ) : (
            // Fallback when no template: parse each question prompt for [[n]], _____, or sentence stem
            group.questions.map((question) => {
              const prompt = question.prompt || "";
              const hasUnderscores = /_{2,}/.test(prompt);
              const hasTokens = /\[\[\d+\]\]/.test(prompt);

              if (hasTokens) {
                const tokens = parseLineTokens(prompt);
                return (
                  <div key={question.key} className={styles.gapFillLine}>
                    {tokens.map((token, tokenIdx) => {
                      if (token.type === "text") {
                        return <span key={tokenIdx}>{token.text}</span>;
                      }
                      const q = questionByNumber.get(token.questionNo) ?? question;
                      return renderGapSlot(q);
                    })}
                  </div>
                );
              }

              if (hasUnderscores) {
                const parts = prompt.split(/_{2,}/);
                return (
                  <div key={question.key} className={styles.gapFillLine}>
                    {parts.map((part, pIdx) => (
                      <Fragment key={pIdx}>
                        <span>{part}</span>
                        {pIdx < parts.length - 1 ? (
                          renderGapSlot(question)
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                );
              }

              return (
                <div key={question.key} className={styles.gapFillLine}>
                  <strong style={{ marginRight: 6 }}>{question.number}.</strong>
                  <span>{prompt} </span>
                  {renderGapSlot(question)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isOptionBank ? (
        <div className={styles.gapOptionBank}>
          <p className={styles.gapOptionHint}>
            <Lightbulb size={16} weight="fill" aria-hidden="true" />
            Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống để điền.
          </p>
          <div className={styles.gapOptionList}>
            {group.sharedOptions.map((option) => {
              const isSelected = selectedOptionKey === option.key;
              const isUsed = !canReuseOptions && (usedOptionKeys.has(option.key) || usedOptionKeys.has(option.code ?? ""));

              return (
                <button
                  key={option.key}
                  type="button"
                  draggable={!isUsed}
                  disabled={isUsed}
                  className={`${styles.gapOptionPill} ${isSelected ? styles.gapOptionPillSelected : ""} ${
                    isUsed ? styles.gapOptionPillUsed : ""
                  }`}
                  onDragStart={(event) => {
                    if (isUsed) return;
                    event.dataTransfer.setData("text/plain", option.key);
                    setSelectedOptionKey(option.key);
                  }}
                  onDragEnd={() => setDragOverKey("")}
                  onClick={() => {
                    if (!isUsed) setSelectedOptionKey(isSelected ? "" : option.key);
                  }}
                  aria-pressed={isSelected}
                  title={isUsed ? "Lựa chọn này đã được sử dụng" : "Bấm hoặc kéo để điền vào ô trống"}
                >
                  {option.text || option.code}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ========================================================
// 7: Table Completion Component (CD-IELTS Standard)
// ========================================================
function TableCompletionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? cleanDisplayText(group.answerConfig.gapFillTemplate)
      : "";
  const contentTitle = gapFillContentTitle(group);

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => map.set(q.number, q));
    return map;
  }, [group.questions]);

  const parsedTable = useMemo(() => {
    if (!rawTemplate || !rawTemplate.includes("|")) return null;
    const lines = rawTemplate.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const tableLines = lines.filter((l) => l.startsWith("|") || l.includes(" | "));
    if (tableLines.length < 2) return null;

    const nonSeparator = tableLines.filter((l) => !/^[|\s-:]+$/.test(l));
    if (nonSeparator.length < 1) return null;

    const headers = nonSeparator[0]
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);

    const rows = nonSeparator.slice(1).map((line) => {
      return line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);
    });

    return { headers, rows };
  }, [rawTemplate]);

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={isExamMode ? styles.examTableWrapper : styles.tableWrapper}>
        {contentTitle ? <h4 className={styles.gapFillTitle}>{contentTitle}</h4> : null}
        {parsedTable ? (
          <table className={isExamMode ? styles.examTable : styles.cdIeltsTable}>
            {parsedTable.headers.length > 0 ? (
              <thead>
                <tr>
                  {parsedTable.headers.map((h, hIdx) => (
                    <th key={hIdx}>{h}</th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {parsedTable.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => {
                    const tokens = parseLineTokens(cell);
                    return (
                      <td key={cIdx}>
                        {tokens.map((token, tIdx) => {
                          if (token.type === "text") {
                            return <span key={tIdx}>{token.text}</span>;
                          }
                          const q = questionByNumber.get(token.questionNo) ?? group.questions[token.questionNo - 1];
                          if (!q) return <span key={tIdx}>[[{token.questionNo}]]</span>;
                          return (
                            <GapInlineSlot
                              key={q.key}
                              question={q}
                              answer={answers[q.key]}
                              onAnswer={onAnswer}
                              active={activeQuestionKey === q.key}
                              flagged={flaggedKeys.has(q.key)}
                              onFocus={onQuestionFocus}
                              onToggleFlag={onToggleFlag}
                              isExamMode={isExamMode}
                            />
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={isExamMode ? styles.examTable : styles.cdIeltsTable}>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Số câu</th>
                <th>Nội dung thông tin</th>
                <th style={{ width: "220px" }}>Ô điền khuyết</th>
              </tr>
            </thead>
            <tbody>
              {group.questions.map((question) => {
                const prompt = question.prompt || "";
                return (
                  <tr key={question.key}>
                    <td>
                      <strong>{question.number}</strong>
                    </td>
                    <td>{prompt.replace(/_{2,}/g, "...")}</td>
                    <td>
                      <GapInlineSlot
                        question={question}
                        answer={answers[question.key]}
                        onAnswer={onAnswer}
                        active={activeQuestionKey === question.key}
                        flagged={flaggedKeys.has(question.key)}
                        onFocus={onQuestionFocus}
                        onToggleFlag={onToggleFlag}
                        isExamMode={isExamMode}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ========================================================
// 8: Flow-chart Completion Component (CD-IELTS Standard)
// ========================================================
function FlowChartCompletionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? cleanDisplayText(group.answerConfig.gapFillTemplate)
      : "";
  const contentTitle = gapFillContentTitle(group);

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => map.set(q.number, q));
    return map;
  }, [group.questions]);

  const steps = useMemo<Array<{ stepNo: number; title?: string; body: string; question?: ReadingQuestion }>>(() => {
    if (rawTemplate) {
      const rawChunks = rawTemplate.split(/\r?\n\r?\n/).map((c) => c.trim()).filter(Boolean);
      if (rawChunks.length > 1) {
        return rawChunks.map((chunk, idx) => {
          const lines = chunk.split(/\r?\n/);
          const firstLine = lines[0].trim();
          const isTitle = (firstLine.startsWith("#") || firstLine.endsWith(":")) && lines.length > 1;
          const title = isTitle ? firstLine.replace(/^#+\s*/, "").replace(/:$/, "") : undefined;
          const body = isTitle ? lines.slice(1).join(" ") : chunk;
          return { stepNo: idx + 1, title, body };
        });
      }
      const lines = rawTemplate.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      return lines.map((line, idx) => ({
        stepNo: idx + 1,
        title: undefined,
        body: line,
      }));
    }

    return group.questions.map((q, idx) => ({
      stepNo: idx + 1,
      title: `Giai đoạn ${idx + 1}`,
      body: q.prompt || "",
      question: q,
    }));
  }, [rawTemplate, group.questions]);

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {contentTitle ? <h4 className={styles.gapFillTitle}>{contentTitle}</h4> : null}
      <div className={styles.flowChartContainer}>
        {steps.map((step, idx) => (
          <Fragment key={idx}>
            <div className={styles.flowStepCard}>
              <div className={styles.flowStepHeader}>
                <span className={styles.flowStepBadge}>Bước {step.stepNo}</span>
                {step.title ? <h5 className={styles.flowStepTitle}>{step.title}</h5> : null}
              </div>
              <div className={styles.flowStepContent}>
                {step.body.includes("[[") ? (
                  parseLineTokens(step.body).map((token, tIdx) => {
                    if (token.type === "text") return <span key={tIdx}>{token.text}</span>;
                    const q = questionByNumber.get(token.questionNo) ?? group.questions[token.questionNo - 1];
                    if (!q) return <span key={tIdx}>[[{token.questionNo}]]</span>;
                    return (
                      <GapInlineSlot
                        key={q.key}
                        question={q}
                        answer={answers[q.key]}
                        onAnswer={onAnswer}
                        active={activeQuestionKey === q.key}
                        flagged={flaggedKeys.has(q.key)}
                        onFocus={onQuestionFocus}
                        onToggleFlag={onToggleFlag}
                        isExamMode={isExamMode}
                      />
                    );
                  })
                ) : step.question ? (
                  <>
                    <span>{step.body.replace(/_{2,}/g, "")} </span>
                    <GapInlineSlot
                      question={step.question}
                      answer={answers[step.question.key]}
                      onAnswer={onAnswer}
                      active={activeQuestionKey === step.question.key}
                      flagged={flaggedKeys.has(step.question.key)}
                      onFocus={onQuestionFocus}
                      onToggleFlag={onToggleFlag}
                      isExamMode={isExamMode}
                    />
                  </>
                ) : (
                  <span>{step.body}</span>
                )}
              </div>
            </div>

            {idx < steps.length - 1 ? (
              <div className={styles.flowStepArrow}>
                <ArrowDown size={22} weight="bold" />
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

// ========================================================
// 9: Diagram Labeling Component (CD-IELTS Standard)
// ========================================================
function DiagramLabelingGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
  isExamMode,
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawIllustration = (group.answerConfig?.illustration ?? (group as unknown as { illustration?: unknown }).illustration) as
    | { fileUrl?: string; altText?: string; filename?: string }
    | undefined;
  const imageUrl =
    rawIllustration?.fileUrl
      || (typeof group.answerConfig?.imageUrl === "string" ? group.answerConfig.imageUrl : undefined)
      || (typeof group.answerConfig?.diagramUrl === "string" ? group.answerConfig.diagramUrl : undefined)
      || (typeof (group as unknown as { imageUrl?: string }).imageUrl === "string"
        ? (group as unknown as { imageUrl?: string }).imageUrl
        : undefined);
  const imageAlt = rawIllustration?.altText?.trim() || group.title || "Sơ đồ bài thi";

  const hasSharedOptions = group.sharedOptions && group.sharedOptions.length > 0;
  const optionsWithText = hasSharedOptions
    ? group.sharedOptions.filter((opt) => opt.text?.trim() && opt.text !== opt.code && !opt.text.startsWith("Vị trí "))
    : [];

  const renderImageContent = () => (
    imageUrl ? (
      <div className={styles.diagramImageWrapper}>
        <AuthenticatedDiagramImage src={imageUrl} alt={imageAlt} className={styles.diagramImage} />
        {rawIllustration?.altText?.trim() ? (
          <p className={styles.diagramImageCaption}>{rawIllustration.altText}</p>
        ) : null}
      </div>
    ) : (
      <div className={styles.diagramImageWrapper}>
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-500">
          <TreeStructure size={36} className="text-slate-400" />
          <span className="text-xs font-semibold">Sơ đồ gắn nhãn các vị trí được đánh số</span>
        </div>
      </div>
    )
  );

  const renderGridTable = () => (
    <>
      <div className={styles.diagramGridWrapper}>
        <table className={styles.diagramGridTable}>
          <thead>
            <tr>
              <th scope="col" className={styles.diagramGridPromptCell}>
                {group.title || "Questions"}
              </th>
              {group.sharedOptions.map((opt) => (
                <th key={opt.key || opt.code} scope="col" className={styles.diagramGridOptionHeader}>
                  {opt.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.questions.map((question) => {
              const currentValues = answerValues(answers[question.key]);
              const selectedVal = currentValues[0];
              const isActive = activeQuestionKey === question.key;
              const isFlagged = flaggedKeys.has(question.key);
              const prompt = question.prompt || `Vị trí ${question.number}`;

              return (
                <tr
                  key={question.key}
                  id={`reading-question-${question.key}`}
                  className={`${styles.diagramGridRow} ${isActive ? styles.diagramGridRowActive : ""}`}
                  onClick={() => onQuestionFocus(question.key)}
                >
                  <td className={styles.diagramGridPromptCell}>
                    <div className={styles.diagramGridPromptContent}>
                      <span className={isExamMode ? styles.examMcNumber : styles.diagramLabelIndex}>{question.number}</span>
                      <span className={styles.diagramLabelPrompt}>{prompt.replace(/_{2,}/g, "")}</span>
                      {isExamMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFlag(question.key);
                          }}
                          className={`${styles.examBookmarkBtn} ${isFlagged ? styles.examBookmarkBtnActive : ""}`}
                          title={isFlagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
                          aria-label={`Đánh dấu câu ${question.number}`}
                        >
                          <BookmarkSimple size={13} weight={isFlagged ? "fill" : "regular"} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFlag(question.key);
                          }}
                          className={`p-1 rounded transition ${isFlagged ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}`}
                          title={isFlagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
                          aria-label={`Đánh dấu câu ${question.number}`}
                        >
                          <Flag size={14} weight={isFlagged ? "fill" : "regular"} />
                        </button>
                      )}
                    </div>
                  </td>
                  {group.sharedOptions.map((opt) => {
                    const isChecked = selectedVal === opt.key || selectedVal === opt.code;
                    return (
                      <td
                        key={opt.key || opt.code}
                        className={styles.diagramGridCell}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuestionFocus(question.key);
                          onAnswer(question.key, { value: opt.key });
                        }}
                      >
                        <input
                          type="radio"
                          name={`diagram-grid-${question.key}`}
                          checked={isChecked}
                          onChange={() => {
                            onQuestionFocus(question.key);
                            onAnswer(question.key, { value: opt.key });
                          }}
                          className={styles.diagramGridRadio}
                          aria-label={`Câu ${question.number} chọn ${opt.code}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {optionsWithText.length > 0 && (
        <div className={styles.diagramGridLegend}>
          <p className={styles.diagramGridLegendTitle}>Danh sách lựa chọn</p>
          <div className={styles.diagramGridLegendList}>
            {optionsWithText.map((opt) => (
              <div key={opt.key || opt.code} className="flex items-center gap-1.5">
                <strong className="text-[#8f4458] font-bold">{opt.code}:</strong>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {isExamMode && hasSharedOptions ? (
        imageUrl ? (
          <div className={styles.examDiagramSplit}>
            <div className={styles.examDiagramImageCol}>
              {renderImageContent()}
            </div>
            <div className={styles.examDiagramQuestionsCol}>
              {renderGridTable()}
            </div>
          </div>
        ) : (
          <div className="w-full">
            {renderGridTable()}
          </div>
        )
      ) : (
        <div className={styles.diagramCard}>
          {renderImageContent()}

          {hasSharedOptions ? (
            renderGridTable()
          ) : (
            <div className={styles.diagramLabelsList}>
              {group.questions.map((question) => {
                const prompt = question.prompt || `Vị trí ${question.number}`;
                return (
                  <div
                    key={question.key}
                    id={`reading-question-${question.key}`}
                    className={styles.diagramLabelRow}
                    onClick={() => onQuestionFocus(question.key)}
                  >
                    <span className={isExamMode ? styles.examMcNumber : styles.diagramLabelIndex}>{question.number}</span>
                    <span className={styles.diagramLabelPrompt}>{prompt.replace(/_{2,}/g, "")}</span>
                    <GapInlineSlot
                      question={question}
                      answer={answers[question.key]}
                      onAnswer={onAnswer}
                      active={activeQuestionKey === question.key}
                      flagged={flaggedKeys.has(question.key)}
                      onFocus={onQuestionFocus}
                      onToggleFlag={onToggleFlag}
                      isExamMode={isExamMode}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ========================================================
// 10: Short Answer Component (CD-IELTS Standard)
// ========================================================
function ShortAnswerQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{cleanDisplayText(group.instructions)}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={styles.shortAnswerList}>
        {group.questions.map((question) => {
          const values = answerValues(answers[question.key]);
          const active = activeQuestionKey === question.key;
          const flagged = flaggedKeys.has(question.key);

          return (
            <article
              key={question.key}
              id={`reading-question-${question.key}`}
              className={`${styles.shortAnswerCard} ${active ? styles.shortAnswerCardActive : ""}`}
              onClick={() => onQuestionFocus(question.key)}
            >
              <div className={styles.shortAnswerTopline}>
                <div className={styles.shortAnswerPromptRow}>
                  <strong className={styles.shortAnswerNum}>{question.number}.</strong>
                  <p className={styles.shortAnswerPrompt}>{question.prompt || "Nội dung câu hỏi"}</p>
                </div>
                <button
                  type="button"
                  className={`${styles.flagButton} ${flagged ? styles.flagButtonActive : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFlag(question.key);
                  }}
                  aria-pressed={flagged}
                  title="Đánh dấu câu này"
                >
                  <Flag size={15} weight={flagged ? "fill" : "regular"} />
                </button>
              </div>

              <div className={styles.shortAnswerInputWrapper}>
                <input
                  type="text"
                  className={styles.shortAnswerInput}
                  value={values[0] ?? ""}
                  onChange={(e) => onAnswer(question.key, { value: e.target.value })}
                  placeholder="Nhập câu trả lời..."
                  onFocus={() => onQuestionFocus(question.key)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
