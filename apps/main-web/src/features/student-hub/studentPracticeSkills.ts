// Availability follows the published student practice flows, not the course skill pair.
export const studentPracticeSkills = [
  { id: "reading", name: "Reading", description: "Tìm và luyện các đề Reading đã xuất bản.", available: true, href: "/student/practice?skill=READING" },
  { id: "listening", name: "Listening", description: "Khám phá danh mục đề Listening đã xuất bản.", available: true, href: "/student/practice?skill=LISTENING" },
  { id: "writing", name: "Writing", description: "Khám phá Task 1, Task 2 và các đề Writing đã xuất bản.", available: true, href: "/student/practice?skill=WRITING" },
  { id: "speaking", name: "Speaking", description: "Khám phá đề Speaking theo Part và chủ đề.", available: true, href: "/student/practice?skill=SPEAKING" },
] as const;
