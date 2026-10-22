"use client";

import type { WritingAttemptResult } from "@ielts/contracts";
import { ArrowLeft, ArrowRight, CheckCircle, CircleNotch, Clock, House, PencilSimple, Sparkle, Star, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { AuthenticatedDiagramImage } from "@/features/reading/AuthenticatedDiagramImage";
import { getWritingAttemptResult, requestWritingAiEvaluation } from "./writingApi";
import styles from "./WritingResultPage.module.css";

const criterionLabels: Record<string, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar Range & Accuracy",
};

export function WritingResultPage({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><WritingResultContent key={attemptId} attemptId={attemptId} /></StudentSessionGate>;
}

function WritingResultContent({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<WritingAttemptResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("essay");
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState("");
  const pending = result?.evaluations.some((item) => ["QUEUED", "PROCESSING"].includes(item.aiStatus)) ?? false;
  const resultTabs = [["essay", "Bài viết của bạn"], ["tis", "TIS sửa bài"], ["teacher", "Giáo viên chấm bài"], ["sample", "Bài sample từ TIS"]];

  useEffect(() => {
    let cancelled = false;
    void getWritingAttemptResult(attemptId).then((value) => { if (!cancelled) setResult(value); }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải kết quả Writing."); });
    return () => { cancelled = true; };
  }, [attemptId]);

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const value = await getWritingAttemptResult(attemptId);
        if (!cancelled) { setResult(value); setActionError(""); }
      } catch { if (!cancelled) setActionError("Chưa thể cập nhật trạng thái. Hệ thống sẽ tự thử lại."); }
      if (!cancelled) timer = setTimeout(refresh, 5000);
    }
    timer = setTimeout(refresh, 5000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [attemptId, pending]);

  async function requestAi() {
    if (requesting) return;
    setRequesting(true); setActionError("");
    try {
      await requestWritingAiEvaluation(attemptId);
      setResult(await getWritingAttemptResult(attemptId));
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Không thể gửi yêu cầu chấm."); }
    finally { setRequesting(false); }
  }

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
        <div><span className={styles.eyebrow}>Đã nộp thành công</span><h1>Bài Writing đã được lưu</h1><p>Xem lại bài viết, nhờ TIS sửa bài và theo dõi nhận xét của giáo viên.</p></div>
        <dl className={styles.summary}>
          <div><dt>Số task</dt><dd>{result.tasks.length}</dd></div>
          <div><dt>Tổng số từ</dt><dd>{totalWords}</dd></div>
          <div><dt>Thời gian nộp</dt><dd>{submittedAt}</dd></div>
        </dl>
      </header>

      {(result.overallBandAi != null || result.overallBandTeacher != null) ? <section className={styles.fullScore} aria-label="Band tổng toàn bài Writing">
        <div><span>Band tổng toàn bài</span><h2>Task 2 được tính trọng số gấp đôi Task 1</h2></div>
        <div className={styles.fullScoreValues}>
          {result.overallBandAi != null ? <div data-source="ai"><small>TIS</small><strong>{result.overallBandAi.toFixed(1)}</strong></div> : null}
          {result.overallBandTeacher != null ? <div data-source="teacher"><small>Giáo viên</small><strong>{result.overallBandTeacher.toFixed(1)}</strong></div> : null}
        </div>
      </section> : null}

      {result.tasks.length > 1 ? <nav className={styles.taskNav} aria-label="Chọn task để xem lại">
        {result.tasks.map((task) => <a key={task.taskKey} href={`#task-${task.taskNo}`}>Task {task.taskNo}</a>)}
      </nav> : null}

      <div className={styles.resultTabs} role="tablist" aria-label="Kết quả Writing">
        {resultTabs.map(([id, label], index) => <button key={id} id={`writing-tab-${id}`} role="tab" type="button" aria-selected={tab === id} aria-controls="writing-tab-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? (index + 1) % 4 : event.key === "ArrowLeft" ? (index + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : null;
          if (next != null) { event.preventDefault(); setTab(resultTabs[next][0]); document.getElementById(`writing-tab-${resultTabs[next][0]}`)?.focus(); }
        }}>{label}{id === "tis" && pending ? <CircleNotch className={styles.spin}/> : null}</button>)}
      </div>
      <div id="writing-tab-panel" role="tabpanel" aria-labelledby={`writing-tab-${tab}`} tabIndex={0}>
      {actionError ? <section className={styles.notice} role="alert"><WarningCircle/>{actionError}</section> : null}
      {tab === "tis" && pending ? <section className={styles.waiting} role="status">
        <CircleNotch size={36} className={styles.spin}/><h2>Bài viết của bạn đang được chấm</h2>
        <p>TIS đang đọc và đánh giá bài viết. Bạn có thể chuyển sang mục khác của góc học tập, chúng tôi sẽ thông báo khi có kết quả.</p>
        <div><Link href="/student/practice?skill=READING">Cùng luyện Reading <ArrowRight/></Link><Link href="/student/practice?skill=LISTENING">Luyện Listening <ArrowRight/></Link><Link href="/student">Về góc học tập <ArrowRight/></Link></div>
      </section> : null}
      {tab === "tis" && !result.resultVisible ? <p className={styles.emptyMessage}>Kết quả TIS sẽ hiển thị khi khóa học mở kết quả.</p> : null}
      {tab === "tis" && result.resultVisible && !pending && result.evaluations.some((item) => item.aiStatus === "NOT_ELIGIBLE") ? <section className={styles.waiting}>
        <Sparkle size={32}/><h2>{result.aiEligible ? "Sẵn sàng để TIS sửa bài?" : "Bạn chưa có lượt sửa bài khả dụng"}</h2>
        <p>{result.aiEligible ? "TIS sử dụng AI để đánh giá theo bốn tiêu chí IELTS. Mỗi task sử dụng một lượt trong ngân sách được cấp." : "Liên hệ giáo viên để được cấp thêm ngân sách AI. Bài viết của bạn vẫn được lưu bình thường."}</p>
        {result.aiEligible ? <button type="button" disabled={requesting} onClick={() => void requestAi()}>{requesting ? <CircleNotch className={styles.spin}/> : <Sparkle/>}{requesting ? "Đang gửi bài..." : "Nhờ TIS sửa bài"}</button> : null}
      </section> : null}

      <div className={styles.tasks}>
        {result.tasks.map((task) => {
          const response = result.responses.find((item) => item.taskKey === task.taskKey);
          const evaluation = result.evaluations.find((item) => item.taskKey === task.taskKey);
          if (tab === "tis" && evaluation && (evaluation.overallBandAi == null && evaluation.aiStatus !== "FAILED")) return null;
          return <article key={task.taskKey} id={`task-${task.taskNo}`} className={styles.card}>
            <header className={styles.cardHeader}>
              <div><span>Writing Task {task.taskNo}</span><h2>{task.title}</h2><p>{task.suggestedTimeMinutes} phút · Tối thiểu {task.minWords} từ</p></div>
              <span className={styles.pending}>{response?.wordCount ?? 0} từ</span>
            </header>

            {tab === "essay" ? <div className={styles.taskLayout}>
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
            </div> : null}

            {tab === "tis" && evaluation?.overallBandAi != null ? <FeedbackSection title="TIS sửa bài" icon="ai" overall={evaluation.overallBandAi} criteria={evaluation.aiCriterionBands} strengths={evaluation.aiStrengths} improvements={evaluation.aiImprovements} /> : null}
            {tab === "tis" && evaluation?.aiStatus === "FAILED" ? <section className={styles.notice}><WarningCircle/><div><strong>TIS chưa thể hoàn tất bài chấm</strong><p>Bài vẫn được lưu. Vui lòng liên hệ giáo viên để được hỗ trợ chấm lại.</p></div></section> : null}
            {tab === "tis" && !evaluation ? <p className={styles.emptyMessage}>Task này chưa có nội dung để chấm.</p> : null}
            {tab === "teacher" ? evaluation?.teacherStatus === "PUBLISHED" && evaluation.overallBandTeacher != null
              ? <><FeedbackSection title="Chấm của giáo viên" icon="teacher" overall={evaluation.overallBandTeacher} criteria={evaluation.teacherCriterionBands} strengths={evaluation.teacherStrengths} improvements={evaluation.teacherImprovements}/><TeacherCorrection original={response?.text ?? ""} edited={evaluation.teacherEditedText} annotations={evaluation.teacherAnnotations}/></>
              : <section className={styles.notice}><Clock/><div><strong>{result.attemptOrigin === "ASSIGNMENT" ? "Bài viết của bạn sẽ được giáo viên chấm" : "Nhận đánh giá trực tiếp từ giáo viên"}</strong><p>{result.attemptOrigin === "ASSIGNMENT" ? "Điểm và nhận xét sẽ xuất hiện sau khi giáo viên công bố." : "Tham gia khóa Writing & Speaking để được chấm bài hoặc liên hệ giáo viên của bạn."}</p>{result.attemptOrigin === "SELF_PRACTICE" ? <Link href="/student/courses">Khám phá khóa học <ArrowRight/></Link> : null}</div></section> : null}
            {tab === "sample" ? task.sampleBand8Answer ? <section className={styles.sampleAnswer} dangerouslySetInnerHTML={{ __html: task.sampleBand8Answer }}/> : <p className={styles.emptyMessage}>{result.resultVisible ? "TIS chưa có bài sample cho đề này." : "Bài sample sẽ hiển thị khi khóa học mở kết quả."}</p> : null}
          </article>;
        })}
      </div>
      </div>

      <footer className={styles.nextActions}>
        <div><strong>Tiếp tục luyện tập</strong><span>Chọn một đề Writing khác hoặc trở về giao diện học viên.</span></div>
        <div><Link href="/student">Về trang học viên</Link><Link href="/student/practice?skill=WRITING">Luyện bài khác <ArrowRight /></Link></div>
      </footer>
    </div>
  </main>;
}

function TeacherCorrection({ original, edited, annotations }: { original: string; edited: string | null; annotations: WritingAttemptResult["evaluations"][number]["teacherAnnotations"] }) {
  const [view, setView] = useState<"compare" | "edited">("compare");
  if (!edited && !annotations.length) return null;
  const corrected = edited ?? original;
  return <section className={styles.teacherCorrection}>
    <div className={styles.correctionHeader}><div><h3>Bản sửa của giáo viên</h3><p>Giáo viên đã chỉnh trực tiếp trên bài viết của bạn.</p></div><div className={styles.correctionTabs}><button type="button" aria-pressed={view === "compare"} onClick={() => setView("compare")}>Đối chiếu</button><button type="button" aria-pressed={view === "edited"} onClick={() => setView("edited")}>Bản đã sửa</button></div></div>
    {view === "compare" ? <div className={styles.correctionGrid}><div><span>Bản gốc</span><p>{original}</p></div><div><span>Bản giáo viên sửa</span><p>{corrected}</p></div></div> : <div className={styles.correctedText}>{corrected}</div>}
    {annotations.length ? <div className={styles.annotationList}><strong>Nhận xét trong bài</strong>{annotations.map((item) => <article key={item.id ?? `${item.start}-${item.end}`}><span>{item.criterion ? criterionLabels[item.criterion] ?? item.criterion : "Nhận xét chung"}</span><p>“{item.selectedText}”</p>{item.comment ? <div>{item.comment}</div> : null}{item.replacement ? <em>Đề xuất: {item.replacement}</em> : null}</article>)}</div> : null}
  </section>;
}

function FeedbackSection({ title, icon, overall, criteria, strengths, improvements }: {
  title: string;
  icon: "ai" | "teacher";
  overall: number;
  criteria: Record<string, number>;
  strengths: string[];
  improvements: string[];
}) {
  return <section className={styles.feedback} data-source={icon}>
    <h3>{icon === "ai" ? <Sparkle weight="fill" /> : <Star weight="fill" />} {title}<span className={styles.feedbackBand}>Band {overall.toFixed(1)}</span></h3>
    <div className={styles.criteria}>{Object.entries(criteria).map(([key, value]) => <div key={key}><span>{criterionLabels[key] ?? key}</span><strong>{value.toFixed(1)}</strong></div>)}</div>
    <div className={styles.feedbackColumns}>
      {strengths.length ? <div><strong>Điểm mạnh</strong><ul>{strengths.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      {improvements.length ? <div><strong>Cần cải thiện</strong><ul>{improvements.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    </div>
  </section>;
}
