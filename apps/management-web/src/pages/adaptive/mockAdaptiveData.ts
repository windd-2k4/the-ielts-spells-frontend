export interface DataStreamMetric {
  id: string;
  name: string;
  category: "Câu trả lời" | "Lỗi sai" | "Bài nộp" | "Chuyên cần" | "Học liệu" | "Kết quả Writing";
  countToday: number;
  totalVolume: number;
  qualityRate: number; // e.g. 68.4%
  status: "ONLINE" | "PROCESSING" | "SYNCED";
  lastActive: string;
  description: string;
}

export interface KnowledgeNode {
  code: string;
  name: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  category: string;
  bandWeight: string; // e.g. "Band 6.0 - 7.5"
  masteryAvg: number; // 0 - 1
  questionCount: number;
  mappedResources: number;
  prerequisites: string[]; // codes
  supports: string[]; // codes
  description: string;
}

export interface MockStudentLearner {
  learnerId: string;
  fullName: string;
  avatar: string;
  email: string;
  enrolledCourse: string;
  targetBand: number;
  currentEstimatedBand: number;
  overallMastery: number;
  evidenceCount: number;
  lastEvidenceAt: string;
  weakestComponent: {
    code: string;
    name: string;
    skill: string;
    mastery: number;
    reason: string;
  };
  strongestComponent: {
    code: string;
    name: string;
    skill: string;
    mastery: number;
  };
  activeRecommendation: {
    id: string;
    title: string;
    targetType: "PRACTICE_FILTER" | "TEST_VERSION" | "EXERCISE_TEMPLATE" | "LEARNING_RESOURCE";
    estimatedMinutes: number;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    reason: string;
    ragSourceDoc: string;
    status: "ACTIVE" | "COMPLETED" | "PAUSED";
  };
  skillBreakdown: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
  componentMasteries: Array<{
    code: string;
    name: string;
    skill: string;
    masteryProbability: number;
    confidence: number;
    evidenceCount: number;
    correctCount: number;
    trend: "UP" | "DOWN" | "STABLE";
  }>;
  recentEvidence: Array<{
    id: string;
    timestamp: string;
    type: "READING_TEST" | "WRITING_TASK" | "LISTENING_DRILL" | "SPEAKING_AI";
    title: string;
    score: string;
    detectedMistake?: string;
  }>;
}

export interface RagTutorLog {
  id: string;
  studentName: string;
  timestamp: string;
  studentMistake: string;
  knowledgeComponent: string;
  ragReference: string;
  promptSnippet: string;
  tisExplanation: string;
  recommendedAction: string;
}

export const MOCK_DATA_STREAMS: DataStreamMetric[] = [
  {
    id: "ds-1",
    name: "Câu trả lời trắc nghiệm & điền từ",
    category: "Câu trả lời",
    countToday: 1420,
    totalVolume: 48920,
    qualityRate: 68.4,
    status: "ONLINE",
    lastActive: "2 phút trước",
    description: "Nhận diện phản hồi tức thì từng câu hỏi Reading & Listening qua WebSocket event commit.",
  },
  {
    id: "ds-2",
    name: "Nhật ký phân loại bẫy đề & lỗi sai",
    category: "Lỗi sai",
    countToday: 382,
    totalVolume: 12450,
    qualityRate: 94.2,
    status: "PROCESSING",
    lastActive: "Vừa xong",
    description: "AI tự động phân loại lỗi: Nhầm từ khóa đồng nghĩa, bẫy phủ định lật kèo, sai ngữ pháp Task 2.",
  },
  {
    id: "ds-3",
    name: "Bài nộp chính khóa & luyện tự do",
    category: "Bài nộp",
    countToday: 94,
    totalVolume: 3210,
    qualityRate: 99.8,
    status: "SYNCED",
    lastActive: "5 phút trước",
    description: "Bao gồm bài Full Test 40 câu, Mini-test theo Session và bài tập tự luyện của học viên.",
  },
  {
    id: "ds-4",
    name: "Chuyên cần & Chuỗi luyện tập (Streak)",
    category: "Chuyên cần",
    countToday: 186,
    totalVolume: 6540,
    qualityRate: 88.5,
    status: "ONLINE",
    lastActive: "10 phút trước",
    description: "Theo dõi nhịp độ học tập hàng ngày, tần suất quay lại và thời gian trung bình mỗi phiên.",
  },
  {
    id: "ds-5",
    name: "Chỉ mục học liệu RAG Tutor",
    category: "Học liệu",
    countToday: 45,
    totalVolume: 840,
    qualityRate: 96.0,
    status: "SYNCED",
    lastActive: "1 giờ trước",
    description: "445 bài đọc, bài nghe và bài mẫu IELTS phân rã thành vector chunk cho Trợ lý TIS truy vấn.",
  },
  {
    id: "ds-6",
    name: "Kết quả chấm Writing & Speaking AI",
    category: "Kết quả Writing",
    countToday: 56,
    totalVolume: 1840,
    qualityRate: 91.5,
    status: "ONLINE",
    lastActive: "3 phút trước",
    description: "Trích xuất band điểm 4 tiêu chí (TR/CC/LR/GRA) làm bằng chứng cập nhật Knowledge Tracing.",
  },
];

export const MOCK_KNOWLEDGE_COMPONENTS: KnowledgeNode[] = [
  {
    code: "READING_MATCHING_HEADINGS",
    name: "Matching Headings (Nối tiêu đề đoạn)",
    skill: "READING",
    category: "Main Idea Comprehension",
    bandWeight: "Band 6.0 - 8.0",
    masteryAvg: 0.46,
    questionCount: 160,
    mappedResources: 18,
    prerequisites: ["READING_SKIMMING"],
    supports: ["READING_SUMMARY_COMPLETION"],
    description: "Kỹ năng tìm ý chính (topic sentence) và nhận diện luận điểm trung tâm, tránh bẫy tiểu tiết.",
  },
  {
    code: "READING_SKIMMING",
    name: "Skimming & Scanning (Đọc lướt & dò tìm)",
    skill: "READING",
    category: "Core Speed Reading",
    bandWeight: "Band 5.0 - 7.0",
    masteryAvg: 0.74,
    questionCount: 320,
    mappedResources: 24,
    prerequisites: [],
    supports: ["READING_MATCHING_HEADINGS", "READING_TFNG"],
    description: "Kỹ năng nền tảng quét nhanh từ khóa định vị, từ đồng nghĩa và cấu trúc đoạn văn IELTS.",
  },
  {
    code: "READING_TFNG",
    name: "True / False / Not Given & Yes / No",
    skill: "READING",
    category: "Fact & Opinion Analysis",
    bandWeight: "Band 6.0 - 8.0",
    masteryAvg: 0.58,
    questionCount: 240,
    mappedResources: 20,
    prerequisites: ["READING_SKIMMING"],
    supports: [],
    description: "Phân biệt giữa thông tin mâu thuẫn (False) và thông tin không được đề cập (Not Given).",
  },
  {
    code: "WRITING_COHERENCE",
    name: "Coherence & Cohesion (Tính mạch lạc Task 2)",
    skill: "WRITING",
    category: "Discourse & Flow",
    bandWeight: "Band 6.5 - 8.5",
    masteryAvg: 0.51,
    questionCount: 95,
    mappedResources: 14,
    prerequisites: [],
    supports: ["WRITING_TASK2_ARGUMENT"],
    description: "Sử dụng từ nối tự nhiên, quy chiếu đại từ, cấu trúc đoạn văn PEEL mạch lạc không gượng ép.",
  },
  {
    code: "WRITING_TASK2_ARGUMENT",
    name: "Task 2 Argumentation & Position",
    skill: "WRITING",
    category: "Task Achievement",
    bandWeight: "Band 6.0 - 8.0",
    masteryAvg: 0.62,
    questionCount: 80,
    mappedResources: 16,
    prerequisites: ["WRITING_COHERENCE"],
    supports: [],
    description: "Xây dựng lập luận có chiều sâu, luận cứ chứng minh thuyết phục và lập trường xuyên suốt bài viết.",
  },
  {
    code: "LISTENING_DISTRACTORS",
    name: "Nhận diện bẫy Distractor Section 3",
    skill: "LISTENING",
    category: "Academic Conversation",
    bandWeight: "Band 6.5 - 8.0",
    masteryAvg: 0.54,
    questionCount: 140,
    mappedResources: 12,
    prerequisites: [],
    supports: ["LISTENING_MULTIPLE_CHOICE"],
    description: "Bắt kịp sự thay đổi ý kiến của người nói khi dùng từ chuyển ngoặt: 'Actually, let's go with...'",
  },
  {
    code: "SPEAKING_FLUENCY",
    name: "Fluency & Discourse Markers",
    skill: "SPEAKING",
    category: "Speaking Fluency",
    bandWeight: "Band 6.0 - 7.5",
    masteryAvg: 0.59,
    questionCount: 110,
    mappedResources: 15,
    prerequisites: [],
    supports: [],
    description: "Kỹ năng duy trì luồng nói tự nhiên, sử dụng filler có học thuật và hạn chế ngập ngừng quá lâu.",
  },
];

export const MOCK_STUDENTS: MockStudentLearner[] = [
  {
    learnerId: "c67c8fa7-5121-4188-a941-870706cb8c7b",
    fullName: "Nguyễn Hoàng Phong",
    avatar: "HP",
    email: "phong20040610a4@gmail.com",
    enrolledCourse: "LR-2609-004 · IELTS Intensive Speaking & Writing K26",
    targetBand: 7.5,
    currentEstimatedBand: 6.5,
    overallMastery: 0.65,
    evidenceCount: 18,
    lastEvidenceAt: "Hôm nay 11:42",
    weakestComponent: {
      code: "READING_MATCHING_HEADINGS",
      name: "Matching Headings",
      skill: "Reading",
      mastery: 0.42,
      reason: "Bị phân tâm bởi từ khóa giống nguyên văn trong đoạn con; thường mất hơn 3.2 phút/câu.",
    },
    strongestComponent: {
      code: "READING_SKIMMING",
      name: "Skimming & Scanning",
      skill: "Reading",
      mastery: 0.88,
    },
    activeRecommendation: {
      id: "rec-hp-01",
      title: "Chiến thuật Skimming & Matching Headings: Công nghệ xanh 2026",
      targetType: "PRACTICE_FILTER",
      estimatedMinutes: 15,
      difficulty: "MEDIUM",
      reason: "Dựa trên bài Đề Full Reading #1: bạn làm đúng 2/6 câu Matching Headings. TIS gợi ý bài tập vi mô để luyện kỹ năng đọc câu chủ đề.",
      ragSourceDoc: "IELTS Reading Strategies - Section 3.2 Topic Sentence Identification",
      status: "ACTIVE",
    },
    skillBreakdown: {
      reading: 6.5,
      listening: 7.0,
      writing: 6.0,
      speaking: 6.5,
    },
    componentMasteries: [
      {
        code: "READING_MATCHING_HEADINGS",
        name: "Matching Headings",
        skill: "Reading",
        masteryProbability: 0.42,
        confidence: 0.86,
        evidenceCount: 6,
        correctCount: 2,
        trend: "DOWN",
      },
      {
        code: "READING_SKIMMING",
        name: "Skimming & Scanning",
        skill: "Reading",
        masteryProbability: 0.88,
        confidence: 0.92,
        evidenceCount: 14,
        correctCount: 12,
        trend: "UP",
      },
      {
        code: "READING_TFNG",
        name: "True / False / Not Given",
        skill: "Reading",
        masteryProbability: 0.64,
        confidence: 0.81,
        evidenceCount: 8,
        correctCount: 5,
        trend: "STABLE",
      },
      {
        code: "WRITING_COHERENCE",
        name: "Coherence & Cohesion (Task 2)",
        skill: "Writing",
        masteryProbability: 0.52,
        confidence: 0.79,
        evidenceCount: 4,
        correctCount: 2,
        trend: "DOWN",
      },
      {
        code: "LISTENING_DISTRACTORS",
        name: "Nhận diện bẫy Distractor Section 3",
        skill: "Listening",
        masteryProbability: 0.75,
        confidence: 0.84,
        evidenceCount: 7,
        correctCount: 5,
        trend: "UP",
      },
    ],
    recentEvidence: [
      {
        id: "ev-1",
        timestamp: "Hôm nay 11:35",
        type: "READING_TEST",
        title: "Đề Full Reading #1",
        score: "7.0 (30/40)",
        detectedMistake: "Sai 4 câu Matching Headings liên tiếp ở Passage 2",
      },
      {
        id: "ev-2",
        timestamp: "Hôm qua 20:15",
        type: "WRITING_TASK",
        title: "IELTS Intensive Writing Session 3 - Task 2",
        score: "Band 6.0",
        detectedMistake: "Lặp từ nối 'Furthermore' 4 lần; thiếu đại từ quy chiếu",
      },
      {
        id: "ev-3",
        timestamp: "28/10/2026",
        type: "LISTENING_DRILL",
        title: "Listening - Session 1",
        score: "Band 7.5 (33/40)",
        detectedMistake: "Lỡ nhịp ở câu 28 do không chú ý từ 'However'",
      },
    ],
  },
  {
    learnerId: "b89e1a22-3401-4433-b123-908756aa31c9",
    fullName: "Trần Mai Anh",
    avatar: "MA",
    email: "maianh.tran99@gmail.com",
    enrolledCourse: "LR-2610-007 · IELTS Master Band 7.5+",
    targetBand: 8.0,
    currentEstimatedBand: 7.0,
    overallMastery: 0.78,
    evidenceCount: 26,
    lastEvidenceAt: "Hôm nay 10:15",
    weakestComponent: {
      code: "WRITING_COHERENCE",
      name: "Coherence & Cohesion (Task 2)",
      skill: "Writing",
      mastery: 0.55,
      reason: "Ý tưởng phong phú nhưng các câu ghép quá phức tạp dẫn đến câu bị gãy cú pháp.",
    },
    strongestComponent: {
      code: "LISTENING_DISTRACTORS",
      name: "Bẫy Distractor",
      skill: "Listening",
      mastery: 0.92,
    },
    activeRecommendation: {
      id: "rec-ma-01",
      title: "Chữa lỗi cú pháp câu ghép trong IELTS Writing Task 2",
      targetType: "EXERCISE_TEMPLATE",
      estimatedMinutes: 12,
      difficulty: "HARD",
      reason: "Bài viết Task 2 gần nhất của Mai Anh đạt TR 7.5 nhưng GRA 6.0 do lỗi Run-on sentences.",
      ragSourceDoc: "Official Cambridge Band Descriptors - Grammar Range & Accuracy Band 7 vs 6",
      status: "ACTIVE",
    },
    skillBreakdown: {
      reading: 7.5,
      listening: 8.0,
      writing: 6.5,
      speaking: 6.5,
    },
    componentMasteries: [
      {
        code: "WRITING_COHERENCE",
        name: "Coherence & Cohesion",
        skill: "Writing",
        masteryProbability: 0.55,
        confidence: 0.88,
        evidenceCount: 9,
        correctCount: 5,
        trend: "STABLE",
      },
      {
        code: "READING_TFNG",
        name: "True / False / Not Given",
        skill: "Reading",
        masteryProbability: 0.82,
        confidence: 0.91,
        evidenceCount: 16,
        correctCount: 14,
        trend: "UP",
      },
    ],
    recentEvidence: [
      {
        id: "ev-ma-1",
        timestamp: "Hôm nay 10:05",
        type: "WRITING_TASK",
        title: "Task 2 Academic: Artificial Intelligence in Education",
        score: "Band 6.5",
        detectedMistake: "Run-on sentences ở Paragraph 3",
      },
    ],
  },
  {
    learnerId: "f44d9098-7712-4211-c901-778844cc9921",
    fullName: "Lê Quốc Bảo",
    avatar: "QB",
    email: "quocbao.le@student.edu.vn",
    enrolledCourse: "LR-2609-004 · IELTS Intensive Speaking & Writing K26",
    targetBand: 6.5,
    currentEstimatedBand: 5.5,
    overallMastery: 0.52,
    evidenceCount: 12,
    lastEvidenceAt: "Hôm qua 18:30",
    weakestComponent: {
      code: "SPEAKING_FLUENCY",
      name: "Fluency & Discourse Markers",
      skill: "Speaking",
      mastery: 0.44,
      reason: "Ngập ngừng dịch từ tiếng Việt sang tiếng Anh; khoảng dừng im lặng > 3 giây.",
    },
    strongestComponent: {
      code: "READING_SKIMMING",
      name: "Skimming & Scanning",
      skill: "Reading",
      mastery: 0.65,
    },
    activeRecommendation: {
      id: "rec-qb-01",
      title: "Luyện phản xạ Part 1 Fluency Drill: Everyday Habits",
      targetType: "PRACTICE_FILTER",
      estimatedMinutes: 10,
      difficulty: "EASY",
      reason: "Cải thiện nhịp độ trả lời 3 câu hỏi quen thuộc Part 1 mà không ngập ngừng.",
      ragSourceDoc: "The IELTS Spells Speaking Fluency Audio Drills",
      status: "ACTIVE",
    },
    skillBreakdown: {
      reading: 6.0,
      listening: 5.5,
      writing: 5.0,
      speaking: 5.0,
    },
    componentMasteries: [
      {
        code: "SPEAKING_FLUENCY",
        name: "Fluency & Discourse Markers",
        skill: "Speaking",
        masteryProbability: 0.44,
        confidence: 0.82,
        evidenceCount: 6,
        correctCount: 2,
        trend: "DOWN",
      },
    ],
    recentEvidence: [
      {
        id: "ev-qb-1",
        timestamp: "Hôm qua 18:20",
        type: "SPEAKING_AI",
        title: "Part 1 Fluency Drill - Session 3",
        score: "Band 5.0",
        detectedMistake: "Tần suất dừng 'uhm... err...' 14 lần",
      },
    ],
  },
  {
    learnerId: "a12d4533-8902-4ee1-b998-112233445566",
    fullName: "Đỗ Thị Thu Trang",
    avatar: "TT",
    email: "thutrang.ielts@gmail.com",
    enrolledCourse: "LR-2610-007 · IELTS Master Band 7.5+",
    targetBand: 7.5,
    currentEstimatedBand: 7.5,
    overallMastery: 0.85,
    evidenceCount: 34,
    lastEvidenceAt: "30/10/2026",
    weakestComponent: {
      code: "READING_TFNG",
      name: "True / False / Not Given",
      skill: "Reading",
      mastery: 0.72,
      reason: "Đôi lúc suy diễn quá mức (overthinking) dẫn đến chọn False thay vì Not Given.",
    },
    strongestComponent: {
      code: "READING_MATCHING_HEADINGS",
      name: "Matching Headings",
      skill: "Reading",
      mastery: 0.94,
    },
    activeRecommendation: {
      id: "rec-tt-01",
      title: "Chinh phục bẫy Not Given trong đề thi học thuật khó",
      targetType: "TEST_VERSION",
      estimatedMinutes: 20,
      difficulty: "HARD",
      reason: "Trang đã hoàn thiện 94% kỹ năng khác, chỉ cần tinh chỉnh bẫy Not Given để đạt 8.0 Reading.",
      ragSourceDoc: "Cambridge Academic Reading Masterclass - Distinguishing False vs Not Given",
      status: "COMPLETED",
    },
    skillBreakdown: {
      reading: 8.0,
      listening: 8.0,
      writing: 7.0,
      speaking: 7.0,
    },
    componentMasteries: [
      {
        code: "READING_TFNG",
        name: "True / False / Not Given",
        skill: "Reading",
        masteryProbability: 0.72,
        confidence: 0.94,
        evidenceCount: 20,
        correctCount: 16,
        trend: "UP",
      },
    ],
    recentEvidence: [
      {
        id: "ev-tt-1",
        timestamp: "30/10/2026",
        type: "READING_TEST",
        title: "Cambridge IELTS 18 - Reading Test 4",
        score: "Band 8.0 (36/40)",
        detectedMistake: "Nhầm lẫn câu 19 False -> Not Given",
      },
    ],
  },
];

export const MOCK_RAG_TUTOR_LOGS: RagTutorLog[] = [
  {
    id: "log-1",
    studentName: "Nguyễn Hoàng Phong",
    timestamp: "11:42 Hôm nay",
    studentMistake: "Chọn Tiêu đề 'iv: Green transport challenges' cho Paragraph C, trong khi đáp án đúng là 'vii: Breakthrough in solid-state batteries'",
    knowledgeComponent: "READING_MATCHING_HEADINGS",
    ragReference: "Official Cambridge 18 Reading Guide · Ch.4 Page 112: 'Avoid matching words that merely appear as examples in the supporting sentences. The first and last sentences define the topic.'",
    promptSnippet: "SYSTEM: You are TIS, empathetic IELTS tutor. Explain why mentioning 'electric buses' was merely an illustration, not the core theme of battery chemistry.",
    tisExplanation: "Chào Phong! Ở đoạn C, từ 'electric vehicles' chỉ xuất hiện ở câu thứ 3 như một ví dụ ứng dụng. Trọng tâm của toàn đoạn nằm ngay câu chủ đề đầu tiên: 'The transition hinges upon energy density improvements in solid-state chemistry'. Vì vậy, tiêu đề 'Breakthrough in solid-state batteries' mới là chiếc chìa khóa bao quát!",
    recommendedAction: "Gợi ý bài tập vi mô: 5 câu tìm Topic Sentence nhanh (12 phút)",
  },
  {
    id: "log-2",
    studentName: "Trần Mai Anh",
    timestamp: "10:18 Hôm nay",
    studentMistake: "Câu Task 2: 'Although artificial intelligence improves grading efficiency, however teachers are still indispensable.' (Lỗi lặp liên từ Although... however)",
    knowledgeComponent: "WRITING_COHERENCE",
    ragReference: "IELTS Spells Writing Grammar Guide · Section 2: Concession & Contrast Clauses.",
    promptSnippet: "SYSTEM: Prompt TIS to provide a polite correction on concession double markers.",
    tisExplanation: "Mai Anh ơi, trong tiếng Anh học thuật, khi em đã dùng liên từ chỉ sự nhượng bộ 'Although' ở mệnh đề phụ thì mệnh đề chính KHÔNG dùng 'however' nữa nhé! Em có thể viết: 'Although AI improves grading efficiency, teachers remain indispensable.'",
    recommendedAction: "Gợi ý flashcard bài tập sửa lỗi liên từ (8 phút)",
  },
];
