import { supabase } from "@/lib/supabase";
import { getReadingAttempt } from "@/features/reading/readingApi";
import { getWritingAttempt } from "@/features/writing/writingApi";
import { getSpeakingAttempt } from "@/features/speaking/speakingApi";
import type {
  DetailedPlacementReport,
  PlacementSurveyData,
  SkillReportSection,
  StudentPlacementTestRecord,
} from "./placementTestTypes";

export function roundIeltsBand(raw: number): number {
  const floor = Math.floor(raw);
  const remainder = raw - floor;
  if (remainder < 0.25) return floor;
  if (remainder < 0.75) return floor + 0.5;
  return floor + 1.0;
}

export function calculateRawToBand(rawCorrect: number, skill: "READING" | "LISTENING"): number {
  if (skill === "READING") {
    if (rawCorrect >= 39) return 9.0;
    if (rawCorrect >= 37) return 8.5;
    if (rawCorrect >= 35) return 8.0;
    if (rawCorrect >= 33) return 7.5;
    if (rawCorrect >= 30) return 7.0;
    if (rawCorrect >= 27) return 6.5;
    if (rawCorrect >= 23) return 6.0;
    if (rawCorrect >= 19) return 5.5;
    if (rawCorrect >= 15) return 5.0;
    if (rawCorrect >= 13) return 4.5;
    if (rawCorrect >= 10) return 4.0;
    if (rawCorrect >= 8) return 3.5;
    if (rawCorrect >= 6) return 3.0;
    if (rawCorrect >= 4) return 2.5;
    return 2.0;
  } else {
    // Listening
    if (rawCorrect >= 39) return 9.0;
    if (rawCorrect >= 37) return 8.5;
    if (rawCorrect >= 35) return 8.0;
    if (rawCorrect >= 32) return 7.5;
    if (rawCorrect >= 30) return 7.0;
    if (rawCorrect >= 26) return 6.5;
    if (rawCorrect >= 23) return 6.0;
    if (rawCorrect >= 18) return 5.5;
    if (rawCorrect >= 16) return 5.0;
    if (rawCorrect >= 13) return 4.5;
    if (rawCorrect >= 10) return 4.0;
    if (rawCorrect >= 8) return 3.5;
    if (rawCorrect >= 6) return 3.0;
    if (rawCorrect >= 4) return 2.5;
    return 2.0;
  }
}

export async function fetchCurrentPlacementTest(studentId: string): Promise<StudentPlacementTestRecord | null> {
  const { data, error } = await supabase
    .from("student_placement_tests")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Merge cached attempt IDs if any
  let readingAttemptId = data.reading_attempt_id;
  let listeningAttemptId = data.listening_attempt_id;
  let writingT1AttemptId = data.writing_t1_attempt_id;
  let writingT2AttemptId = data.writing_t2_attempt_id;
  let speakingAttemptId = data.speaking_attempt_id;

  if (typeof window !== "undefined") {
    try {
      const cacheKey = `placement-attempts-${data.id}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      if (cached.reading_attempt_id) readingAttemptId = cached.reading_attempt_id;
      if (cached.listening_attempt_id) listeningAttemptId = cached.listening_attempt_id;
      if (cached.writing_t1_attempt_id) writingT1AttemptId = cached.writing_t1_attempt_id;
      if (cached.writing_t2_attempt_id) writingT2AttemptId = cached.writing_t2_attempt_id;
      if (cached.speaking_attempt_id) speakingAttemptId = cached.speaking_attempt_id;
    } catch {}
  }

  return {
    id: data.id,
    studentId: data.student_id,
    status: data.status,
    targetBand: Number(data.target_band || 6.5),
    examDate: data.exam_date,
    studyHoursPerWeek: data.study_hours_per_week || 10,
    readingAttemptId,
    listeningAttemptId,
    writingT1AttemptId,
    writingT2AttemptId,
    speakingAttemptId,
    estimatedOverallBand: data.estimated_overall_band ? Number(data.estimated_overall_band) : null,
    estimatedReadingBand: data.estimated_reading_band ? Number(data.estimated_reading_band) : null,
    estimatedListeningBand: data.estimated_listening_band ? Number(data.estimated_listening_band) : null,
    estimatedWritingBand: data.estimated_writing_band ? Number(data.estimated_writing_band) : null,
    estimatedSpeakingBand: data.estimated_speaking_band ? Number(data.estimated_speaking_band) : null,
    detailedReport: data.detailed_report as DetailedPlacementReport | null,
    startedAt: data.started_at,
    completedAt: data.completed_at,
  };
}

export async function startOrRestartPlacementTest(
  studentId: string,
  survey: PlacementSurveyData
): Promise<StudentPlacementTestRecord> {
  // Update student profile with target band and exam date
  await supabase
    .from("student_profiles")
    .update({
      target_band: survey.targetBand,
      planned_exam_date: survey.examDate || null,
      exam_plan_status: survey.examDate ? "PLANNED" : "NONE",
    })
    .eq("user_id", studentId);

  // Insert a new placement test record
  const { data, error } = await supabase
    .from("student_placement_tests")
    .insert({
      student_id: studentId,
      status: "IN_PROGRESS",
      target_band: survey.targetBand,
      exam_date: survey.examDate || null,
      study_hours_per_week: survey.studyHoursPerWeek,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error("Không thể khởi tạo bài kiểm tra đầu vào: " + error.message);
  }

  return {
    id: data.id,
    studentId: data.student_id,
    status: data.status,
    targetBand: Number(data.target_band),
    examDate: data.exam_date,
    studyHoursPerWeek: data.study_hours_per_week,
    readingAttemptId: data.reading_attempt_id,
    listeningAttemptId: data.listening_attempt_id,
    writingT1AttemptId: data.writing_t1_attempt_id,
    writingT2AttemptId: data.writing_t2_attempt_id,
    speakingAttemptId: data.speaking_attempt_id,
    estimatedOverallBand: null,
    estimatedReadingBand: null,
    estimatedListeningBand: null,
    estimatedWritingBand: null,
    estimatedSpeakingBand: null,
    detailedReport: null,
    startedAt: data.started_at,
    completedAt: null,
  };
}

export async function linkPlacementAttempt(
  placementTestId: string,
  skillKey: "reading" | "listening" | "writingT1" | "writingT2" | "speaking",
  attemptId: string
): Promise<void> {
  const columnMap = {
    reading: "reading_attempt_id",
    listening: "listening_attempt_id",
    writingT1: "writing_t1_attempt_id",
    writingT2: "writing_t2_attempt_id",
    speaking: "speaking_attempt_id",
  };

  const column = columnMap[skillKey];
  if (typeof window !== "undefined") {
    try {
      const cacheKey = `placement-attempts-${placementTestId}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      cached[column] = attemptId;
      localStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch {}
  }
  await supabase
    .from("student_placement_tests")
    .update({ [column]: attemptId, updated_at: new Date().toISOString() })
    .eq("id", placementTestId);
}

export async function getAttemptDetails(
  attemptId: string,
  skill?: "reading" | "listening" | "writing" | "speaking"
): Promise<{
  id: string;
  status: string;
  started_at?: string | null;
  submitted_at?: string | null;
  final_score?: number | null;
  auto_score?: number | null;
} | null> {
  try {
    const { data } = await supabase
      .from("test_attempts")
      .select("id, status, started_at, submitted_at, final_score, auto_score")
      .eq("id", attemptId)
      .maybeSingle();
    if (data) return data;
  } catch {}

  // Fallback to backend API
  if (skill === "reading" || skill === "listening") {
    try {
      const att = await getReadingAttempt(attemptId, skill);
      const isDone = att.status !== "IN_PROGRESS";
      return {
        id: att.attemptId,
        status: att.status,
        started_at: att.startedAt,
        submitted_at: isDone ? att.expiresAt : null,
        final_score: att.finalScore ?? att.autoScore,
        auto_score: att.autoScore,
      };
    } catch {}
  } else if (skill === "writing") {
    try {
      const att = await getWritingAttempt(attemptId);
      const isDone = att.status !== "IN_PROGRESS";
      return {
        id: att.attemptId,
        status: att.status,
        started_at: att.startedAt,
        submitted_at: isDone ? att.expiresAt : null,
        final_score: null,
        auto_score: null,
      };
    } catch {}
  } else if (skill === "speaking") {
    try {
      const att = await getSpeakingAttempt(attemptId);
      const isDone = att.status.toUpperCase() !== "IN_PROGRESS";
      return {
        id: att.attemptId,
        status: att.status,
        started_at: att.startedAt,
        submitted_at: isDone ? att.expiresAt : null,
        final_score: null,
        auto_score: null,
      };
    } catch {}
  }
  return null;
}

export async function evaluatePlacementTest(
  placement: StudentPlacementTestRecord
): Promise<StudentPlacementTestRecord> {
  // 1. Reading
  let rCorrect = 0;
  if (placement.readingAttemptId) {
    const att = await getAttemptDetails(placement.readingAttemptId, "reading");
    if (att?.final_score != null || att?.auto_score != null) {
      rCorrect = Number(att.final_score ?? att.auto_score ?? 0);
    }
  }
  const rBand = calculateRawToBand(rCorrect, "READING");

  const readingReport: SkillReportSection = {
    skill: "READING",
    band: rBand,
    overallComment: `Bạn đã hoàn thành bài thi Reading với ${rCorrect}/40 câu đúng (Band ${rBand.toFixed(1)}). Kết quả cho thấy bạn đang ở giai đoạn xây dựng nền tảng từ vựng và kỹ năng đọc hiểu IELTS. Bạn mất điểm nhiều ở các câu hỏi dạng điền từ và suy luận ý chính. Bạn cần củng cố vốn từ vựng học thuật cơ bản và rèn luyện kỹ năng đọc quét (Scanning) để định vị từ khóa chính xác hơn.`,
    criteriaAnalysis: [
      {
        criterion: "Vốn từ vựng (Vocabulary)",
        detailedFeedback: `Với mức Band ${rBand.toFixed(1)}, vốn từ của bạn đang ở mức khoảng ${rBand <= 3 ? "1,500" : rBand <= 5 ? "3,000" : "5,000"} từ. Để đạt được các mức điểm cao hơn (${(rBand + 1.0).toFixed(1)}+), bạn cần tích lũy thêm khoảng 1,500 từ vựng học thuật cốt lõi thường gặp trong các chủ đề bài đọc IELTS như Khoa học tự nhiên, Lịch sử, và Xã hội học.`,
      },
      {
        criterion: "Kỹ năng làm dạng Gap Filling",
        badge: "Sai nhiều nhất",
        detailedFeedback: `Bạn gặp khó khăn chủ yếu ở dạng bài điền từ vào chỗ trống / tóm tắt đoạn văn. Lỗi thường gặp là chưa xác định trước dạng từ cần điền (danh từ, động từ, tính từ) và chưa nhận diện được từ đồng nghĩa (paraphrase) mà bài đọc dùng để diễn đạt lại câu hỏi.`,
      },
      {
        criterion: "Đọc quét & Nhận diện bẫy (Scanning & Distractors)",
        badge: "Cần cải thiện",
        detailedFeedback: `Bạn có xu hướng chọn đoạn văn chứa từ khóa y hệt trong câu hỏi, tuy nhiên trong IELTS các từ khóa giống hệt thường là thông tin gây nhiễu (distractor). Bạn cần tập trung tìm các cụm từ đồng nghĩa mang cùng ý nghĩa.`,
      },
    ],
    knowledgeToLearn: [
      { title: "Scanning for Synonyms", description: "Kỹ năng tìm kiếm cụm từ đồng nghĩa thay vì tìm từ khóa khớp 100%." },
      { title: "Word Form Identification", description: "Xác định chính xác loại từ cần điền (danh từ số ít/nhiều, tính từ, động từ) trước khi đọc." },
      { title: "Paraphrase Recognition", description: "Nhận diện các cấu trúc diễn đạt lại ý nghĩa trong văn bản học thuật." },
      { title: "Main Idea Summarizing", description: "Tóm tắt ý chính của từng đoạn văn ngắn để nắm bắt cấu trúc toàn bài." },
      { title: "Distractor Identification", description: "Phát hiện thông tin gây nhiễu chứa từ khóa trùng khớp nhưng sai ngữ cảnh." },
      { title: "Contextual Guessing", description: "Đoán nghĩa từ vựng mới dựa trên tiền tố, hậu tố và ngữ cảnh liền kề." },
    ],
  };

  // 2. Listening
  let lCorrect = 0;
  if (placement.listeningAttemptId) {
    const att = await getAttemptDetails(placement.listeningAttemptId, "listening");
    if (att?.final_score != null || att?.auto_score != null) {
      lCorrect = Number(att.final_score ?? att.auto_score ?? 0);
    }
  }
  const lBand = calculateRawToBand(lCorrect, "LISTENING");

  const listeningReport: SkillReportSection = {
    skill: "LISTENING",
    band: lBand,
    overallComment: `Bạn đạt ${lCorrect}/40 câu đúng ở bài thi Listening (Band ${lBand.toFixed(1)}). Kết quả phản ánh bạn chưa bắt kịp tốc độ nói tự nhiên của người bản ngữ và hiện tượng nối âm / nuốt âm. Bạn nên bắt đầu luyện tập với các đoạn hội thoại ngắn Part 1, chú trọng kỹ năng nhận diện số, ngày tháng, tên riêng và phương pháp chép chính tả (Dictation).`,
    criteriaAnalysis: [
      {
        criterion: "Khả năng nghe hiểu & Bắt âm",
        detailedFeedback: `Với Band ${lBand.toFixed(1)}, bạn mới chỉ nghe được các từ đơn lẻ quen thuộc khi người nói phát âm chậm và rõ ràng. Khi bài nghe chuyển sang tốc độ nói tự nhiên có nối âm (connected speech) hoặc lướt âm, bạn dễ bị mất dấu và không kịp xử lý thông tin.`,
      },
      {
        criterion: "Điền thông tin (Form / Note Completion)",
        badge: "Sai nhiều nhất",
        detailedFeedback: `Bạn chưa kịp chuẩn bị kỹ trước khi audio bắt đầu: chưa gạch chân từ khóa định vị (signal words) và chưa dự đoán trước loại từ hoặc thông tin cần điền. Khi nghe, bạn thường đợi từ khóa giống hệt trong đề nên dễ bị lỡ mất đáp án.`,
      },
      {
        criterion: "Nhận diện bẫy sửa đổi thông tin (Correction Distractors)",
        badge: "Cần lưu ý",
        detailedFeedback: `Bài nghe IELTS thường có bẫy nhân vật đưa ra một thông tin rồi tự đính chính lại ngay sau đó (ví dụ: 'No, wait, let me check again...'). Bạn cần tập trung lắng nghe trọn vẹn câu nói thay vì vội vàng ghi lại thông tin đầu tiên nghe thấy.`,
      },
    ],
    knowledgeToLearn: [
      { title: "Prediction Skills", description: "Dự đoán loại từ (danh từ, số, ngày tháng) trong khoảng thời gian chuẩn bị 30 giây." },
      { title: "Signposting Language", description: "Nhận diện các từ dẫn dắt giúp xác định người nói đang ở câu hỏi nào." },
      { title: "Number & Spelling Mastery", description: "Luyện phản xạ nghe và ghi chép nhanh bảng chữ cái tiếng Anh, số điện thoại, giá tiền." },
      { title: "Distractor Awareness", description: "Nhận diện bẫy thay đổi quyết định hoặc thông tin bị phủ định ở vế sau." },
      { title: "Connected Speech Decoding", description: "Làm quen với các hiện tượng nối âm phụ âm - nguyên âm và nuốt âm phổ biến." },
      { title: "Spelling & Plurals Accuracy", description: "Tránh mất điểm đáng tiếc do quên thêm 's/es' ở danh từ số nhiều hoặc lỗi chính tả cơ bản." },
    ],
  };

  // 3. Writing Task 1
  let w1Text = "";
  if (placement.writingT1AttemptId) {
    const { data: wResps } = await supabase
      .from("test_attempt_responses")
      .select("answer")
      .eq("attempt_id", placement.writingT1AttemptId);
    w1Text = wResps?.[0]?.answer?.text || (typeof wResps?.[0]?.answer === "string" ? wResps[0].answer : "");
  }
  const w1Words = w1Text.trim().split(/\s+/).filter(Boolean).length;
  const w1HasOverview = /overall|in general|to summarize|to sum up/i.test(w1Text);

  let w1Band = 5.0;
  if (placement.writingT1AttemptId) {
    const { data: wEval } = await supabase
      .from("writing_evaluations")
      .select("overall_band_ai")
      .eq("attempt_id", placement.writingT1AttemptId)
      .maybeSingle();
    if (wEval?.overall_band_ai) {
      w1Band = Number(wEval.overall_band_ai);
    } else {
      if (w1Words >= 100) w1Band = 5.0;
      if (w1Words >= 150) w1Band = 5.5;
      if (w1Words >= 150 && w1HasOverview) w1Band = 6.0;
      if (w1Words >= 180 && w1HasOverview) w1Band = 6.5;
      if (w1Words < 100 && w1Words > 0) w1Band = 4.5;
      if (w1Words === 0) w1Band = 2.0;
    }
  }

  const writingT1Report: SkillReportSection = {
    skill: "WRITING_T1",
    band: w1Band,
    overallComment: `Bài viết Task 1 của bạn đạt ${w1Words} từ ${w1Words >= 150 ? "(đạt yêu cầu tối thiểu 150 từ)" : "(chưa đạt ngưỡng tối thiểu 150 từ)"}. ${w1HasOverview ? "Bạn đã có đoạn tổng quan (Overview) nêu bật được xu hướng chính của biểu đồ." : "Bài viết còn thiếu một đoạn tổng quan (Overview) rõ ràng để tóm tắt xu hướng chung."} Điểm cần hoàn thiện để nâng lên band cao hơn là cách phân nhóm số liệu và tăng cường các cấu trúc câu so sánh đối chiếu giữa các đối tượng.`,
    criteriaAnalysis: [
      {
        criterion: "Task Achievement",
        score: w1Band,
        badge: w1Words < 150 ? "Chưa đủ 150 từ" : undefined,
        detailedFeedback: `Bài viết đạt ${w1Words} từ và ${w1HasOverview ? "đã có câu Overview khái quát được xu hướng cốt lõi." : "cần bổ sung câu Overview rõ nét hơn để không bị khống chế điểm Task Achievement ở mức band 5.0."} Bạn cần đảm bảo chọn lọc các số liệu đặc trưng nhất thay vì cố gắng đưa tất cả các số liệu vào bài.`,
      },
      {
        criterion: "Coherence & Cohesion",
        score: w1Band,
        detailedFeedback: `Bố cục bài viết gồm các đoạn mạch lạc. Hãy chú ý đặt các liên từ chuyển ý ('However', 'In contrast', 'Similarly') linh hoạt ở giữa câu thay vì chỉ đặt ở đầu câu để tạo nhịp điệu tự nhiên hơn.`,
      },
      {
        criterion: "Lexical Resource",
        score: w1Band,
        detailedFeedback: `Từ vựng miêu tả xu hướng tương đối thích hợp. Bạn nên bổ sung thêm các collocations mô tả tốc độ và biên độ thay đổi như 'witnessed a sharp upward trend', 'remained relatively stable', 'soared considerably'.`,
      },
      {
        criterion: "Grammatical Range & Accuracy",
        score: w1Band,
        detailedFeedback: `Các thì trong quá khứ được sử dụng tương đối nhất quán. Cần chú ý sự hòa hợp giữa chủ ngữ và động từ, cấu trúc câu phức với 'while', 'whereas' và các dạng so sánh gấp nhiều lần (e.g., 'twice as high as', 'threefold increase').`,
      },
    ],
    knowledgeToLearn: [
      { title: "Overview Writing Formula", description: "Công thức viết đoạn Overview 2 câu nêu bật xu hướng chung và điểm nổi bật nhất." },
      { title: "Comparative Structures", description: "Các mẫu câu so sánh hơn, so sánh nhất, so sánh gấp nhiều lần trong mô tả số liệu." },
      { title: "Trend Verbs & Nouns", description: "Hệ thống từ vựng mô tả tăng, giảm, dao động và giữ nguyên ở cấp độ học thuật C1." },
      { title: "Logical Data Grouping", description: "Kỹ thuật nhóm thông tin theo xu hướng hoặc theo đối tượng để viết thân bài cân đối." },
    ],
  };

  // 4. Writing Task 2
  let w2Text = "";
  if (placement.writingT2AttemptId) {
    const { data: wResps } = await supabase
      .from("test_attempt_responses")
      .select("answer")
      .eq("attempt_id", placement.writingT2AttemptId);
    w2Text = wResps?.[0]?.answer?.text || (typeof wResps?.[0]?.answer === "string" ? wResps[0].answer : "");
  }
  const w2Words = w2Text.trim().split(/\s+/).filter(Boolean).length;

  let w2Band = 5.0;
  if (placement.writingT2AttemptId) {
    const { data: wEval } = await supabase
      .from("writing_evaluations")
      .select("overall_band_ai")
      .eq("attempt_id", placement.writingT2AttemptId)
      .maybeSingle();
    if (wEval?.overall_band_ai) {
      w2Band = Number(wEval.overall_band_ai);
    } else {
      if (w2Words >= 150) w2Band = 5.0;
      if (w2Words >= 200) w2Band = 5.5;
      if (w2Words >= 250) w2Band = 6.0;
      if (w2Words >= 280) w2Band = 6.5;
      if (w2Words < 150 && w2Words > 0) w2Band = 4.5;
      if (w2Words === 0) w2Band = 2.0;
    }
  }

  const writingT2Report: SkillReportSection = {
    skill: "WRITING_T2",
    band: w2Band,
    overallComment: `Bài viết Task 2 của bạn đạt ${w2Words} từ với cấu trúc bài rõ ràng. ${w2Words < 250 ? `Tuy nhiên, độ dài ${w2Words} từ chưa đạt mức yêu cầu tối thiểu 250 từ của bài thi IELTS, khiến điểm Task Response bị phạt điểm.` : `Bạn đã đảm bảo độ dài trên 250 từ theo quy định.`} Bạn cần phát triển thêm luận cứ và ví dụ minh họa cụ thể cho từng quan điểm để bài viết thuyết phục hơn.`,
    criteriaAnalysis: [
      {
        criterion: "Task Response",
        score: w2Band,
        badge: w2Words < 250 ? "Thiếu số từ tối thiểu" : undefined,
        detailedFeedback: `Độ dài ${w2Words} từ ${w2Words < 250 ? `bị hụt so với yêu cầu 250 từ của đề bài. Bạn cần phát triển sâu hơn từng đoạn thân bài bằng cách bổ sung thêm 1 ví dụ thực tế hoặc giải thích nguyên nhân sâu xa.` : `đã đáp ứng yêu cầu độ dài. Hãy chú ý trả lời trực diện tất cả các vế của câu hỏi đề bài.`}`,
      },
      {
        criterion: "Coherence & Cohesion",
        score: Math.min(9.0, w2Band + 0.5),
        detailedFeedback: `Cách tổ chức bài viết mạch lạc, người đọc dễ dàng theo dõi mạch lập luận. Bạn nên hạn chế lặp lại từ nối cơ học ở đầu câu bằng cách sử dụng referencing (đại từ quy chiếu) và danh từ hóa để liên kết ý tứ mượt mà hơn.`,
      },
      {
        criterion: "Lexical Resource",
        score: w2Band,
        detailedFeedback: `Từ vựng được sử dụng đúng ngữ cảnh. Để đạt band cao hơn, bạn nên tích cực áp dụng các cụm từ học thuật theo chủ đề (academic collocations) và tránh lặp từ bằng cách paraphrase linh hoạt.`,
      },
      {
        criterion: "Grammatical Range & Accuracy",
        score: w2Band,
        detailedFeedback: `Câu văn rõ nghĩa, nắm vững các cấu trúc ngữ pháp cơ bản. Bạn nên đa dạng hóa cấu trúc câu bằng cách kết hợp câu điều kiện, thể bị động, và mệnh đề quan hệ rút gọn.`,
      },
    ],
    knowledgeToLearn: [
      { title: "PEEL Paragraph Strategy", description: "Phương pháp phát triển đoạn văn chuẩn mực: Point, Explanation, Example, Link." },
      { title: "250-Word Time Management", description: "Kỹ năng lập dàn ý 5 phút và phân bổ thời gian viết để đảm bảo vượt ngưỡng 260-280 từ." },
      { title: "Academic Collocations", description: "Bộ từ vựng chủ đề Xã hội, Giáo dục, Môi trường ở cấp độ học thuật B2-C1." },
      { title: "Complex Sentence Structures", description: "Cách kết hợp câu ghép, câu phức và mệnh đề điều kiện tự nhiên." },
    ],
  };

  // 5. Speaking
  let spkCount = 0;
  let spkTotalWords = 0;
  if (placement.speakingAttemptId) {
    const { data: spkResps } = await supabase
      .from("test_attempt_responses")
      .select("answer")
      .eq("attempt_id", placement.speakingAttemptId);
    if (spkResps) {
      spkCount = spkResps.length;
      spkResps.forEach((r: any) => {
        const t = r.answer?.transcript || "";
        spkTotalWords += t.split(/\s+/).filter(Boolean).length;
      });
    }
  }
  const avgWords = spkCount > 0 ? spkTotalWords / spkCount : 0;

  let sBand = 4.0;
  if (placement.speakingAttemptId) {
    const { data: sEval } = await supabase
      .from("speaking_evaluations")
      .select("overall_band")
      .eq("attempt_id", placement.speakingAttemptId)
      .maybeSingle();
    if (sEval?.overall_band) {
      sBand = Number(sEval.overall_band);
    } else {
      if (spkCount >= 10) sBand = 3.5;
      if (spkCount >= 15) sBand = 4.0;
      if (avgWords >= 10) sBand = 4.5;
      if (avgWords >= 20) sBand = 5.0;
      if (avgWords >= 35) sBand = 5.5;
      if (spkCount === 0) sBand = 2.0;
    }
  }

  const speakingReport: SkillReportSection = {
    skill: "SPEAKING",
    band: sBand,
    overallComment: `Bạn đã hoàn thành ${spkCount}/19 câu hỏi trong bài thi Speaking. Điểm cộng lớn là sự tự tin và nỗ lực phản hồi bài test. ${avgWords < 15 ? `Tuy nhiên, các câu trả lời hiện tại còn tương đối ngắn (trung bình ${avgWords.toFixed(1)} từ/câu, chủ yếu là các câu ngắn hoặc từ đơn). Ở kỳ thi IELTS, bạn cần nói thành câu hoàn chỉnh và mở rộng câu trả lời bằng cách nêu lý do và cảm nhận cá nhân.` : `Bạn đã duy trì được độ dài câu trả lời khá tốt (trung bình ${avgWords.toFixed(1)} từ/câu). Cần chú trọng phát triển thêm ngữ điệu và phát âm chuẩn xác.`}`,
    criteriaAnalysis: [
      {
        criterion: "Độ lưu loát & Mạch lạc (Fluency & Coherence)",
        score: sBand,
        badge: avgWords < 15 ? "Cần mở rộng câu trả lời" : undefined,
        detailedFeedback: `Câu trả lời cần duy trì luồng nói liên tục hơn. Hãy áp dụng công thức A-R-E (Answer - Reason - Example) cho mỗi câu hỏi Part 1: Trả lời trực tiếp ➔ Nêu lý do ('because...') ➔ Đưa ra ví dụ ('for example...'). Ở Part 2, hãy tập nói liên tục từ 1.5 - 2 phút theo các gợi ý trên cue card.`,
      },
      {
        criterion: "Vốn từ vựng (Lexical Resource)",
        score: Math.min(9.0, sBand + 0.5),
        detailedFeedback: `Vốn từ giao tiếp cơ bản ổn định. Bạn cần bổ sung các cụm từ theo chủ đề quen thuộc (quần áo, nơi sinh sống, thành phố) và các từ nối tự nhiên trong văn nói như: 'Well, to be honest', 'As far as I know', 'From my personal experience'.`,
      },
      {
        criterion: "Độ chính xác & Đa dạng ngữ pháp",
        score: sBand,
        detailedFeedback: `Hãy tập thói quen nói thành câu có đầy đủ Chủ ngữ - Vị ngữ và kết nối bằng các liên từ cơ bản (because, so, but, when) trước khi tiến tới câu phức.`,
      },
      {
        criterion: "Phát âm & Ngữ điệu (Pronunciation)",
        score: Math.max(3.0, sBand - 0.5),
        detailedFeedback: `Phát âm các từ cơ bản rõ nghĩa. Cần đặc biệt chú ý phát âm âm đuôi (ending sounds: /s/, /t/, /d/) và luyện tập nói có ngữ điệu trầm bổng tự nhiên thay vì phát âm đều đều.`,
      },
    ],
    knowledgeToLearn: [
      { title: "A-R-E Answer Expansion", description: "Kỹ thuật mở rộng câu trả lời trong Speaking Part 1: Answer - Reason - Example." },
      { title: "Part 2 Cue Card Framework", description: "Cấu trúc triển khai bài nói 2 phút dựa trên 4 câu hỏi gợi ý của Cue Card." },
      { title: "Conversational Discourse Markers", description: "Các từ nối tự nhiên giúp kéo dài thời gian suy nghĩ: 'Actually', 'To be frank', 'I guess'." },
      { title: "Ending Sounds Mastery", description: "Luyện phát âm chuẩn các âm đuôi /s/, /z/, /ed/ để không bị trừ điểm phát âm." },
    ],
  };

  // Overall calculations
  const writingOverallBand = roundIeltsBand((w1Band + 2 * w2Band) / 3);
  const overallBand = roundIeltsBand((rBand + lBand + writingOverallBand + sBand) / 4);

  const detailedReport: DetailedPlacementReport = {
    reading: readingReport,
    listening: listeningReport,
    writingTask1: writingT1Report,
    writingTask2: writingT2Report,
    speaking: speakingReport,
  };

  // Update placement record with final evaluation
  const nowIso = new Date().toISOString();
  await supabase
    .from("student_placement_tests")
    .update({
      status: "COMPLETED",
      estimated_overall_band: overallBand,
      estimated_reading_band: rBand,
      estimated_listening_band: lBand,
      estimated_writing_band: writingOverallBand,
      estimated_speaking_band: sBand,
      detailed_report: detailedReport,
      completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", placement.id);

  // Sync back to student profile
  await supabase
    .from("student_profiles")
    .update({
      current_band: overallBand,
      target_reading_band: placement.targetBand,
      target_listening_band: placement.targetBand,
      target_writing_band: placement.targetBand,
      target_speaking_band: placement.targetBand,
    })
    .eq("user_id", placement.studentId);

  return {
    ...placement,
    status: "COMPLETED",
    estimatedOverallBand: overallBand,
    estimatedReadingBand: rBand,
    estimatedListeningBand: lBand,
    estimatedWritingBand: writingOverallBand,
    estimatedSpeakingBand: sBand,
    detailedReport,
    completedAt: nowIso,
  };
}
