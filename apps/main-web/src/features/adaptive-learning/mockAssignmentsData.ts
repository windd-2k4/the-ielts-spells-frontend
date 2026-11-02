export interface TisAdaptiveRecommendation {
  id: string;
  title: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  componentCode: string;
  componentName: string;
  currentMastery: number; // 0 - 100
  targetMastery: number; // 0 - 100
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  aiRationale: string;
  whyRecommended: string;
  ragContextExcerpt: string;
  tisAdvice: string;
  actionHref: string;
  actionLabel: string;
  tags: string[];
  isHot?: boolean;
}

export interface TeacherAssignmentItem {
  assignmentId: string;
  kind: "COURSE" | "TEST";
  title: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  courseCode: string;
  courseName: string;
  sessionNo?: number;
  sessionTitle?: string;
  dueAt: string; // ISO string
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "NEEDS_REVISION" | "COMPLETED";
  attemptsUsed: number;
  maxAttempts: number;
  score?: string;
  canSubmit: boolean;
  canEdit: boolean;
  classActivityId?: string;
  effectiveDueAt?: string;
  latePolicy?: "BLOCK" | "ALLOW" | "WARN";
}

export const MOCK_TIS_RECOMMENDATIONS: TisAdaptiveRecommendation[] = [
  {
    id: "tis-rec-01",
    title: "Skimming & Matching Headings",
    skill: "READING",
    componentCode: "READING_MATCHING_HEADINGS",
    componentName: "Matching Headings",
    currentMastery: 42,
    targetMastery: 75,
    estimatedMinutes: 15,
    difficulty: "MEDIUM",
    aiRationale: "Tránh bẫy từ khóa lặp lại và định vị nhanh câu chủ đề trong đoạn.",
    whyRecommended: "Dạng bài Matching Headings đang là điểm nghẽn khiến điểm Reading dừng ở mức 6.5. Bài luyện gồm 5 đoạn văn ngắn giúp bạn làm chủ kỹ thuật Skimming.",
    ragContextExcerpt: "Cambridge IELTS Reading Framework: 'Headings relate to the main idea of paragraphs, not individual keywords.'",
    tisAdvice: "Đọc câu đầu và câu cuối đoạn trước để nắm luận điểm, tránh chọn tiêu đề chỉ vì có từ xuất hiện ở phần ví dụ.",
    actionHref: "/student/practice?skill=reading&category=matching_headings&adaptive=true",
    actionLabel: "Luyện tập ngay",
    tags: ["Reading", "Matching Headings"],
    isHot: true,
  },
  {
    id: "tis-rec-02",
    title: "Cohesive Devices trong Task 2",
    skill: "WRITING",
    componentCode: "WRITING_COHERENCE",
    componentName: "Coherence & Cohesion",
    currentMastery: 52,
    targetMastery: 78,
    estimatedMinutes: 12,
    difficulty: "EASY",
    aiRationale: "Sửa lỗi lặp từ nối và áp dụng cấu trúc liên kết mạch lạc tự nhiên.",
    whyRecommended: "Bài viết Task 2 gần đây bị giảm điểm tiêu chí Coherence do lặp từ nối 'Furthermore'. Bài luyện hướng dẫn 4 cấu trúc chuyển ý tự nhiên.",
    ragContextExcerpt: "Official IELTS Writing Band Descriptors: 'Band 7 uses a range of cohesive devices appropriately.'",
    tisAdvice: "Sử dụng đại từ quy chiếu và trạng ngữ chỉ quan hệ thay vì luôn mở đầu câu bằng trạng từ liên kết.",
    actionHref: "/student/practice?skill=writing&category=coherence&adaptive=true",
    actionLabel: "Luyện tập ngay",
    tags: ["Writing", "Task 2"],
    isHot: false,
  },
  {
    id: "tis-rec-03",
    title: "Nhận diện bẫy Distractor Section 3",
    skill: "LISTENING",
    componentCode: "LISTENING_DISTRACTORS",
    componentName: "Academic Distractors",
    currentMastery: 60,
    targetMastery: 85,
    estimatedMinutes: 10,
    difficulty: "HARD",
    aiRationale: "Bắt kịp sự thay đổi ý kiến khi người nói dùng từ lật ý 'Actually...'.",
    whyRecommended: "Ở bài Listening Session 1, bạn bị phân tâm bởi câu khẳng định đầu tiên trước khi người nói đưa ra phương án chốt cuối cùng.",
    ragContextExcerpt: "IELTS Listening Strategies: 'Speakers frequently challenge initial propositions with counter-evidence.'",
    tisAdvice: "Kiên nhẫn nghe hết lượt thảo luận của hai nhân vật trước khi xác nhận đáp án.",
    actionHref: "/student/practice?skill=listening&category=distractors&adaptive=true",
    actionLabel: "Luyện tập ngay",
    tags: ["Listening", "Section 3"],
    isHot: false,
  },
];

export const MOCK_TEACHER_ASSIGNMENTS: TeacherAssignmentItem[] = [
  {
    assignmentId: "asn-spk-01",
    kind: "COURSE",
    title: "Part 1 Fluency Drill",
    skill: "SPEAKING",
    courseCode: "LR-2609-004",
    courseName: "IELTS Intensive Speaking & Writing - K26",
    sessionNo: 3,
    sessionTitle: "Session 3",
    dueAt: "2026-10-03T20:30:00Z",
    status: "NOT_STARTED",
    attemptsUsed: 0,
    maxAttempts: 3,
    canSubmit: true,
    canEdit: true,
    classActivityId: "act-spk-001",
    effectiveDueAt: "20:30:00 3/10/2026",
    latePolicy: "WARN",
  },
  {
    assignmentId: "asn-lis-02",
    kind: "COURSE",
    title: "Listening - Session 1",
    skill: "LISTENING",
    courseCode: "LR-2610-007",
    courseName: "LR_KiemThuFlow",
    sessionNo: 1,
    sessionTitle: "Session 1",
    dueAt: "2026-10-27T10:00:00Z",
    status: "NOT_STARTED",
    attemptsUsed: 0,
    maxAttempts: 2,
    canSubmit: true,
    canEdit: true,
    classActivityId: "act-lis-002",
    effectiveDueAt: "10:00:00 27/10/2026",
    latePolicy: "WARN",
  },
  {
    assignmentId: "asn-rdg-03",
    kind: "TEST",
    title: "Đề Full Reading #1",
    skill: "READING",
    courseCode: "LR-KiemThuFlow",
    courseName: "LR_KiemThuFlow - Session 1",
    dueAt: "2026-10-30T23:59:00Z",
    status: "SUBMITTED",
    attemptsUsed: 1,
    maxAttempts: 1,
    score: "7.0 (30/40)",
    canSubmit: false,
    canEdit: false,
    effectiveDueAt: "30/10/2026",
  },
  {
    assignmentId: "asn-rdg-04",
    kind: "TEST",
    title: "Reading mini test: Remote work",
    skill: "READING",
    courseCode: "Test Bank",
    courseName: "IELTS Spells",
    dueAt: "2099-12-31T23:59:59Z",
    status: "SUBMITTED",
    attemptsUsed: 1,
    maxAttempts: 1,
    score: "8.0 (13/15)",
    canSubmit: false,
    canEdit: false,
    effectiveDueAt: "Không giới hạn",
  },
];
