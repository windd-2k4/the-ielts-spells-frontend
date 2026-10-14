"use client";

import type { WritingAttemptResult } from "@ielts/contracts";
import { ArrowLeft, ArrowRight, CheckCircle, CircleNotch, Clock, House, PencilSimple, Star, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { AuthenticatedDiagramImage } from "@/features/reading/AuthenticatedDiagramImage";
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

  const totalWords = result.responses.reduce((total, response) => total + response.wordCount, 0);
  const submittedAt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.submittedAt));

  return <main className={styles.page}>
    <nav className={styles.topbar} aria-label="Điều hướng kết quả Writing">
      <Link href="/student/practice?skill=WRITING" className={styles.backLink}><ArrowLeft /> <span>Danh mục Writing</span></Link>
      <div className={styles.topbarTitle}><span>Kết quả bài làm</span><strong>Writing submission</strong></div>
      <div className={styles.topbarActions}>
        <Link href="/student" className={styles.homeLink}><House /> <span>Trang học viên</span></Link>
        <Link href="/student/practice?skill=WRITING" className={styles.primaryLink}><PencilSimple /> <span>Luyện bài khác</span></Link>
      </div>
    </nav>

    <div className={styles.content}>
      <header className={styles.hero}>
        <div className={styles.successIcon}><CheckCircle weight="fill" /></div>
        <div><span className={styles.eyebrow}>Đã nộp thành công</span><h1>Bài Writing đã được ghi nhận</h1><p>Bài làm đã được lưu an toàn. Bạn có thể xem lại nội dung trong khi chờ giáo viên chấm.</p></div>
        <dl className={styles.summary}>
          <div><dt>Số task</dt><dd>{result.tasks.length}</dd></div>
          <div><dt>Tổng số từ</dt><dd>{totalWords}</dd></div>
          <div><dt>Thời gian nộp</dt><dd>{submittedAt}</dd></div>
        </dl>
      </header>

      {result.tasks.length > 1 ? <nav className={styles.taskNav} aria-label="Chọn task để xem lại">
        {result.tasks.map((task) => <a key={task.taskKey} href={`#task-${task.taskNo}`}>Task {task.taskNo}</a>)}
      </nav> : null}

      {!result.resultVisible ? <section className={styles.notice}><Clock /><div><strong>Đang chờ giáo viên chấm</strong><p>Điểm và nhận xét sẽ hiển thị tại đây khi được công bố.</p></div></section> : null}

      <div className={styles.tasks}>
        {result.tasks.map((task) => {
          const response = result.responses.find((item) => item.taskKey === task.taskKey);
          const evaluation = result.evaluations.find((item) => item.taskKey === task.taskKey);
          return <article key={task.taskKey} id={`task-${task.taskNo}`} className={styles.card}>
            <header className={styles.cardHeader}>
              <div><span>Writing Task {task.taskNo}</span><h2>{task.title}</h2><p>{task.suggestedTimeMinutes} phút · Tối thiểu {task.minWords} từ</p></div>
              {evaluation?.overallBand != null ? <div className={styles.band}><small>Band</small><strong>{evaluation.overallBand.toFixed(1)}</strong></div> : <div className={styles.pending}><Clock /> Chờ chấm</div>}
            </header>

            <div className={styles.taskLayout}>
              <aside className={styles.promptPanel}>
                <h3>Đề bài</h3>
                <div dangerouslySetInnerHTML={{ __html: task.promptHtml }} />
                {task.imageUrl ? <AuthenticatedDiagramImage src={task.imageUrl} alt={task.imageAltText ?? `Writing Task ${task.taskNo}`} className={styles.resultImage} fallbackText="Không thể tải ảnh minh họa đề Writing." /> : null}
              </aside>
              <section className={styles.responsePanel}>
                <div className={styles.responseHeading}><h3>Bài làm của bạn</h3><span>{response?.wordCount ?? 0} từ</span></div>
                <div className={styles.essay}>{response?.text || "Bạn chưa gửi nội dung cho task này."}</div>
                <footer><span>{response?.wordCount ?? 0} từ</span><span>Mục tiêu tối thiểu {task.minWords} từ</span></footer>
              </section>
            </div>

            {evaluation ? <section className={styles.feedback}>
              <h3><Star weight="fill" /> Nhận xét đã công bố</h3>
              <div className={styles.criteria}>{Object.entries(evaluation.criterionBands).map(([key, value]) => <div key={key}><span>{criterionLabels[key] ?? key}</span><strong>{value.toFixed(1)}</strong></div>)}</div>
              <div className={styles.feedbackColumns}>
                {evaluation.strengths.length ? <div><strong>Điểm mạnh</strong><ul>{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {evaluation.improvements.length ? <div><strong>Cần cải thiện</strong><ul>{evaluation.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              </div>
            </section> : null}
          </article>;
        })}
      </div>

      <footer className={styles.nextActions}>
        <div><strong>Tiếp tục luyện tập</strong><span>Chọn một đề Writing khác hoặc trở về giao diện học viên.</span></div>
        <div><Link href="/student">Về trang học viên</Link><Link href="/student/practice?skill=WRITING">Luyện bài khác <ArrowRight /></Link></div>
      </footer>
    </div>
  </main>;
}
