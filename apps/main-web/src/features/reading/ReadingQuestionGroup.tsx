"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingQuestionGroup as ReadingQuestionGroupModel } from "@ielts/contracts";
import { CheckSquare, ListBullets, TextT } from "@phosphor-icons/react";
import { answerValues, groupQuestionLabel, questionOptions } from "./readingFormat";

type ReadingQuestionGroupProps = {
  group: ReadingQuestionGroupModel;
  answers: Record<string, ReadingAnswer>;
  onAnswer: (questionKey: string, answer: ReadingAnswer) => void;
};

export function ReadingQuestionGroup({ group, answers, onAnswer }: ReadingQuestionGroupProps) {
  return <section className="border-b border-[var(--border)] pb-8 last:border-b-0" aria-labelledby={`group-${group.key}`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-[var(--brand-pink)]">{groupQuestionLabel(group)}</p>
        <h3 id={`group-${group.key}`} className="mt-1 text-xl font-bold text-[var(--text)]">{group.title}</h3>
        {group.instructions ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-muted)]">{group.instructions}</p> : null}
      </div>
      <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">{group.questions.length} câu</span>
    </div>

    {group.sharedOptions.length > 0 ? <div className="mt-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ListBullets size={19} className="text-[var(--brand-pink)]" aria-hidden="true" />Danh sách lựa chọn</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {group.sharedOptions.map((option) => <li key={option.key} className="text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">{option.code}.</strong> {option.text}</li>)}
      </ul>
    </div> : null}

    <div className="mt-6 space-y-5">
      {group.questions.map((question) => <QuestionCard key={question.key} question={question} group={group} answer={answers[question.key]} onAnswer={onAnswer} />)}
    </div>
  </section>;
}

function QuestionCard({ question, group, answer, onAnswer }: {
  question: ReadingQuestion;
  group: ReadingQuestionGroupModel;
  answer: ReadingAnswer | undefined;
  onAnswer: (questionKey: string, value: ReadingAnswer) => void;
}) {
  return <article id={`reading-question-${question.key}`} className="scroll-mt-28 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-pink-soft)] text-sm font-bold text-[var(--brand-pink)]" aria-label={`Câu ${question.number}`}>{question.number}</span>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-base font-semibold leading-7 text-[var(--text)]">{question.prompt || "Nội dung câu hỏi không khả dụng."}</p>
        <AnswerInput question={question} group={group} answer={answer} onAnswer={(value) => onAnswer(question.key, value)} />
      </div>
    </div>
  </article>;
}

function AnswerInput({ question, group, answer, onAnswer }: {
  question: ReadingQuestion;
  group: ReadingQuestionGroupModel;
  answer: ReadingAnswer | undefined;
  onAnswer: (value: ReadingAnswer) => void;
}) {
  const options = questionOptions(question, group);
  const values = answerValues(answer);
  const usesSharedSelect = question.options.length === 0 && group.sharedOptions.length > 0 && question.typeFormat !== "MULTIPLE_ANSWERS";
  if (usesSharedSelect) {
    return <label className="mt-4 block">
      <span className="sr-only">Trả lời câu {question.number}</span>
      <select value={values[0] ?? ""} onChange={(event) => onAnswer({ value: event.target.value })} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none transition focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)]">
        <option value="">Chọn đáp án</option>
        {options.map((option) => <option key={option.key} value={option.key}>{option.code}. {option.text}</option>)}
      </select>
    </label>;
  }

  if (options.length > 0) {
    const multiple = question.typeFormat === "MULTIPLE_ANSWERS";
    return <fieldset className="mt-4 grid gap-2">
      <legend className="sr-only">Trả lời câu {question.number}</legend>
      {options.map((option) => {
        const checked = values.includes(option.key);
        const label = option.code === option.text ? option.text : `${option.code}. ${option.text}`;
        return <label key={option.key} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm leading-6 transition ${checked ? "border-[var(--brand-pink)] bg-[var(--brand-pink-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand-pink)]"}`}>
          <input type={multiple ? "checkbox" : "radio"} name={`reading-answer-${question.key}`} checked={checked} onChange={(event) => {
            if (multiple) {
              const next = event.target.checked ? [...values, option.key] : values.filter((value) => value !== option.key);
              onAnswer({ values: next });
              return;
            }
            onAnswer({ value: option.key });
          }} className="mt-1 size-4 shrink-0 accent-[var(--brand-pink)]" />
          <span>{label}</span>
        </label>;
      })}
    </fieldset>;
  }

  const wordLimit = typeof group.answerConfig.wordLimitRule === "string" ? group.answerConfig.wordLimitRule : undefined;
  return <label className="mt-4 block">
    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><TextT size={18} className="text-[var(--brand-pink)]" aria-hidden="true" />Câu trả lời</span>
    <input value={values[0] ?? ""} onChange={(event) => onAnswer({ value: event.target.value })} autoComplete="off" spellCheck={false} placeholder="Nhập câu trả lời" className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)]" />
    {wordLimit ? <span className="mt-2 flex items-center gap-2 text-xs leading-5 text-[var(--text-muted)]"><CheckSquare size={16} className="shrink-0 text-[var(--brand-pink)]" aria-hidden="true" />{wordLimit}</span> : null}
  </label>;
}
