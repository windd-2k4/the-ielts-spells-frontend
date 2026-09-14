// Availability follows the published student practice flows, not the course skill pair.
export const studentPracticeSkills = [
  { id: "reading", name: "Reading", description: "Mở các bài Reading đã được giao trong khóa học của bạn.", available: true, href: "/student/reading" },
  { id: "listening", name: "Listening", description: "Bài luyện nghe đang được hoàn thiện.", available: false, href: null },
  { id: "writing", name: "Writing", description: "Bài luyện viết và luồng nhận xét đang được hoàn thiện.", available: false, href: null },
  { id: "speaking", name: "Speaking", description: "Bài luyện nói và luồng ghi âm đang được hoàn thiện.", available: false, href: null },
] as const;
