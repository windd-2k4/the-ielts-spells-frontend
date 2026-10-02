"use client";

import type { WritingAttemptResult } from "@ielts/contracts";
import { ArrowLeft, CheckCircle, CircleNotch, Clock, Star, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { getWritingAttemptResult } from "./writingApi";
import styles from "./WritingResultPage.module.css";

const criterionLabels: Record<string, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar Range & Accuracy",
};

export function WritingResultPage({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><WritingResultContent attemptId={attemptId} /></StudentSessionGate>;
}

function WritingResultContent({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<WritingAttemptResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getWritingAttemptResult(attemptId).then(setResult).catch((reason) => setError(reason instanceof Error ? reason.message : "Không thể tải kết quả Writing."));
  }, [attemptId]);
  if (error) return <main className={styles.state}><WarningCircle size={30} /><strong>Không thể tải bài đã nộp</strong><p>{error}</p><Link href="/student/practice?skill=WRITING">Quay lại danh mục</Link></main>;
  if (!result) return <main className={styles.state}><CircleNotch size={28} className={styles.spin} /> Đang tải bài Writing...</main>;
  return <main className={styles.page}>
    <header><Link href="/student/practice?skill=WRITING"><ArrowLeft /> Danh mục Writing</Link><div><span>Writing submission</span><h1>Bài viết đã được nộp</h1><p><CheckCircle weight="fill" /> Hệ thống đã lưu an toàn toàn bộ nội dung bài làm.</p></div></header>
    {!result.resultVisible ? <section className={styles.notice}><Clock /><div><strong>Kết quả được giáo viên kiểm soát</strong><p>Điểm và nhận xét sẽ xuất hiện khi giáo viên cho phép công bố.</p></div></section> : null}
    <div className={styles.grid}>
      {result.tasks.map((task) => {
        const response = result.responses.find((item) => item.taskKey === task.taskKey);
        const evaluation = result.evaluations.find((item) => item.taskKey === task.taskKey);
        return <article key={task.taskKey} className={styles.card}>
          <div className={styles.cardHeader}><div><span>Writing Task {task.taskNo}</span><h2>{task.title}</h2></div>{evaluation?.overallBand != null ? <div className={styles.band}><small>Band</small><strong>{evaluation.overallBand.toFixed(1)}</strong></div> : <div className={styles.pending}><Clock /> Awaiting review</div>}</div>
          <div className={styles.essay}>{response?.text || "No answer submitted."}</div>
          <footer><span>{response?.wordCount ?? 0} words</span><span>Minimum {task.minWords}</span></footer>
          {evaluation ? <section className={styles.feedback}>
            <h3><Star weight="fill" /> Published feedback</h3>
            <div className={styles.criteria}>{Object.entries(evaluation.criterionBands).map(([key, value]) => <div key={key}><span>{criterionLabels[key] ?? key}</span><strong>{value.toFixed(1)}</strong></div>)}</div>
            {evaluation.strengths.length ? <div><strong>Strengths</strong><ul>{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            {evaluation.improvements.length ? <div><strong>Next improvements</strong><ul>{evaluation.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
          </section> : null}
        </article>;
      })}
    </div>
  </main>;
}
