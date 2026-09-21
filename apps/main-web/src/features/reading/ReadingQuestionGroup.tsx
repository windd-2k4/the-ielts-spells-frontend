"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingQuestionGroup as ReadingQuestionGroupModel } from "@ielts/contracts";
import { ArrowDown, CheckSquare, Flag, Lightbulb, ListBullets, TextT, TreeStructure, X } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { answerValues, groupQuestionLabel, optionLabel, questionOptions } from "./readingFormat";
import styles from "./ReadingAttemptPlayer.module.css";

type ReadingQuestionGroupProps = {
  group: ReadingQuestionGroupModel;
  answers: Record<string, ReadingAnswer>;
  onAnswer: (questionKey: string, answer: ReadingAnswer) => void;
  activeQuestionKey: string;
  flaggedKeys: Set<string>;
  onQuestionFocus: (questionKey: string) => void;
  onToggleFlag: (questionKey: string) => void;
};

export function ReadingQuestionGroup({
  group,
  answers,
  onAnswer,
  activeQuestionKey,
  flaggedKeys,
  onQuestionFocus,
  onToggleFlag,
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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
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
              className={`${styles.tfngQuestion} ${active ? styles.tfngQuestionActive : ""}`}
              onClick={() => onQuestionFocus(question.key)}
            >
              <div className={styles.tfngTopline}>
                <div className={styles.tfngPromptWrapper}>
                  <span className={styles.circleQuestionBadge}>{question.number}</span>
                  <p className={styles.tfngPrompt}>{question.prompt || "Nội dung câu hỏi"}</p>
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

              <div className={styles.radioOptionsList}>
                {options.map((opt) => {
                  const isChecked = selectedValue === opt;
                  return (
                    <label
                      key={opt}
                      className={`${styles.radioOptionRow} ${isChecked ? styles.radioOptionRowChecked : ""}`}
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
}: ReadingQuestionGroupProps) {
  const isMultipleAnswers = group.typeFormat === "MULTIPLE_ANSWERS";
  const requiredCount =
    typeof group.answerConfig?.requiredAnswerCount === "number" && group.answerConfig.requiredAnswerCount > 1
      ? group.answerConfig.requiredAnswerCount
      : 2;

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
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
          const currentCount = selectedValues.length;

          const handleOptionToggle = (optionKey: string) => {
            if (isMultipleAnswers) {
              const isChecked = selectedValues.includes(optionKey);
              if (isChecked) {
                onAnswer(question.key, { values: selectedValues.filter((v) => v !== optionKey) });
              } else {
                if (selectedValues.length >= requiredCount) {
                  onAnswer(question.key, { values: [...selectedValues.slice(1), optionKey] });
                } else {
                  onAnswer(question.key, { values: [...selectedValues, optionKey] });
                }
              }
            } else {
              onAnswer(question.key, { value: optionKey });
            }
          };

          return (
            <article
              key={question.key}
              id={`reading-question-${question.key}`}
              className={`${styles.mcQuestion} ${active ? styles.mcQuestionActive : ""}`}
              onClick={() => onQuestionFocus(question.key)}
            >
              <div className={styles.mcTopline}>
                <div className={styles.mcPromptWrapper}>
                  <strong className={styles.mcNumber}>{question.number}</strong>
                  <span className={styles.mcPromptText}>{question.prompt || "Nội dung câu hỏi"}</span>
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

              {isMultipleAnswers ? (
                <div className={styles.mcCounterWrapper}>
                  <span className={`${styles.mcCounterBadge} ${currentCount === requiredCount ? styles.mcCounterBadgeDone : ""}`}>
                    <CheckSquare size={14} weight="bold" />
                    Đã chọn {currentCount} / {requiredCount} đáp án
                  </span>
                </div>
              ) : null}

              <div className={styles.mcOptionsList}>
                {options.map((option) => {
                  const isChecked = selectedValues.includes(option.key) || selectedValues.includes(option.code ?? "");
                  const label = optionLabel(option.code, option.text);

                  return (
                    <label
                      key={option.key}
                      className={`${styles.mcOptionRow} ${isChecked ? styles.mcOptionRowChecked : ""}`}
                    >
                      <input
                        type={isMultipleAnswers ? "checkbox" : "radio"}
                        name={`mc-q-${question.key}`}
                        checked={isChecked}
                        onChange={() => handleOptionToggle(option.key)}
                        className={isMultipleAnswers ? styles.customCheckbox : styles.circularRadio}
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
}: ReadingQuestionGroupProps) {
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [dragOverKey, setDragOverKey] = useState("");

  const isHeadings = group.typeFormat === "MATCHING_HEADINGS";
  const isFeatures = group.typeFormat === "MATCHING_FEATURES";
  const isSentenceEndings = group.typeFormat === "MATCHING_SENTENCE_ENDINGS";
  const isInformation = group.typeFormat === "MATCHING_INFORMATION";

  const bankTitle = isHeadings
    ? "List of Headings"
    : isFeatures
    ? "List of Features / People"
    : isSentenceEndings
    ? "List of Sentence Endings"
    : isInformation
    ? "List of Paragraphs"
    : "List of options";

  const canReuseOptions = isFeatures || isInformation;

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

  const renderOptionBank = () => (
    <div className={styles.matchingBankSection}>
      <h4 className={styles.matchingBankTitle}>{bankTitle}</h4>
      {isFeatures ? (
        <span className={styles.matchingFeaturesNote}>
          NB You may use any letter more than once.
        </span>
      ) : null}
      <p className={styles.matchingBankHint}>
        <Lightbulb size={16} className="text-amber-500" />
        {isFeatures
          ? "Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống. (Một lựa chọn có thể dùng nhiều lần)."
          : "Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống để điền."}
      </p>
      <div className={styles.matchingOptionsPillsGrid}>
        {bankOptions.map((opt) => {
          const isSelected = selectedOptionKey === opt.key;
          const isUsed = !canReuseOptions && (usedOptionKeys.has(opt.key) || usedOptionKeys.has(opt.code ?? ""));

          return (
            <button
              key={opt.key}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", opt.key);
                setSelectedOptionKey(opt.key);
              }}
              onClick={() => setSelectedOptionKey(isSelected ? "" : opt.key)}
              className={`${styles.matchingOptionPill} ${
                isSelected ? styles.matchingOptionPillActive : isUsed ? styles.matchingOptionPillUsed : ""
              }`}
            >
              {optionLabel(opt.code, opt.text)}
            </button>
          );
        })}
      </div>
    </div>
  );

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
            className={`${styles.matchingQuestionItem} ${active ? styles.matchingQuestionItemActive : ""}`}
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
                className={`${styles.matchingTargetSlot} ${
                  val ? styles.matchingTargetSlotFilled : styles.matchingTargetSlotEmpty
                } ${isDragOver || (selectedOptionKey && !val) ? styles.matchingTargetSlotActive : ""}`}
                title={val ? "Bấm để thay thế hoặc xóa" : selectedOptionKey ? "Bấm để điền đáp án đã chọn" : "Kéo hoặc chọn đáp án vào đây"}
              >
                {val ? (
                  <>
                    <span>{displayLabel}</span>
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
                  <span>{question.number}</span>
                )}
              </div>

              {isSentenceEndings ? <strong className="text-slate-400 text-lg">.</strong> : null}

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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {/* Headings show bank at top; Sentence endings / Information show bank at bottom */}
      {isHeadings ? (
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
}: {
  question: ReadingQuestion;
  answer: ReadingAnswer | undefined;
  onAnswer: (questionKey: string, value: ReadingAnswer) => void;
  active: boolean;
  flagged: boolean;
  onFocus: (questionKey: string) => void;
  onToggleFlag: (questionKey: string) => void;
}) {
  const values = answerValues(answer);
  const textValue = values[0] ?? "";
  const isFilled = textValue.trim().length > 0;

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
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

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

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      {group.sharedOptions.length > 0 ? (
        <div className={styles.sharedOptions}>
          <p><ListBullets size={18} aria-hidden="true" />Danh sách lựa chọn</p>
          <ul>
            {group.sharedOptions.map((option) => (
              <li key={option.key}>{optionLabel(option.code, option.text)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.gapFillCard}>
        {group.title && rawTemplate ? (
          <h4 className={styles.gapFillTitle}>{group.title}</h4>
        ) : null}

        <div className={styles.gapFillBody}>
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
                      />
                    );
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
                        />
                      );
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
                          <GapInlineSlot
                            question={question}
                            answer={answers[question.key]}
                            onAnswer={onAnswer}
                            active={activeQuestionKey === question.key}
                            flagged={flaggedKeys.has(question.key)}
                            onFocus={onQuestionFocus}
                            onToggleFlag={onToggleFlag}
                          />
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
                  <GapInlineSlot
                    question={question}
                    answer={answers[question.key]}
                    onAnswer={onAnswer}
                    active={activeQuestionKey === question.key}
                    flagged={flaggedKeys.has(question.key)}
                    onFocus={onQuestionFocus}
                    onToggleFlag={onToggleFlag}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
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
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={styles.tableWrapper}>
        {parsedTable ? (
          <table className={styles.cdIeltsTable}>
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
          <table className={styles.cdIeltsTable}>
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
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

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
}: ReadingQuestionGroupProps) {
  const wordLimit =
    typeof group.answerConfig?.wordLimitRule === "string" && group.answerConfig.wordLimitRule.trim()
      ? group.answerConfig.wordLimitRule
      : undefined;

  const imageUrl =
    typeof group.answerConfig?.imageUrl === "string"
      ? group.answerConfig.imageUrl
      : typeof group.answerConfig?.diagramUrl === "string"
      ? group.answerConfig.diagramUrl
      : undefined;

  return (
    <section className={styles.questionGroup} aria-labelledby={`group-${group.key}`}>
      <div className={styles.groupHeading}>
        <div>
          <p className={styles.eyebrow}>{groupQuestionLabel(group)}</p>
          <h3 id={`group-${group.key}`} className={styles.groupTitle}>{group.title}</h3>
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
          {wordLimit ? (
            <div className={styles.gapFillWordLimit}>
              <CheckSquare size={16} aria-hidden="true" />
              <span>{wordLimit}</span>
            </div>
          ) : null}
        </div>
        <span className={styles.questionCount}>{group.questions.length} câu</span>
      </div>

      <div className={styles.diagramCard}>
        {imageUrl ? (
          <div className={styles.diagramImageWrapper}>
            <img src={imageUrl} alt={group.title} className={styles.diagramImage} />
          </div>
        ) : (
          <div className={styles.diagramImageWrapper}>
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-500">
              <TreeStructure size={36} className="text-slate-400" />
              <span className="text-xs font-semibold">Sơ đồ gắn nhãn các vị trí được đánh số</span>
            </div>
          </div>
        )}

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
                <span className={styles.diagramLabelIndex}>{question.number}</span>
                <span className={styles.diagramLabelPrompt}>{prompt.replace(/_{2,}/g, "")}</span>
                <GapInlineSlot
                  question={question}
                  answer={answers[question.key]}
                  onAnswer={onAnswer}
                  active={activeQuestionKey === question.key}
                  flagged={flaggedKeys.has(question.key)}
                  onFocus={onQuestionFocus}
                  onToggleFlag={onToggleFlag}
                />
              </div>
            );
          })}
        </div>
      </div>
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
          {group.instructions ? <p className={styles.instructions}>{group.instructions}</p> : null}
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
