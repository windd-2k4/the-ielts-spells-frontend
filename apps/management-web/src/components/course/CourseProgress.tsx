import { useState } from "react";
import { 
  Sparkle, 
  Robot, 
  PaperPlane, 
  Info,
  Ear,
  BookOpen,
  Pencil,
  Microphone,
  WarningCircle
} from "@phosphor-icons/react";
import { stableMetric } from "../../lib/stable-metric";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
}

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  status: string;
}

type Roster = { enrollment: Enrollment; student: StudentSummary }[];

interface CourseProgressProps {
  roster: Roster;
  onSelectStudent?: (studentId: string) => void;
}

type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

interface HomeworkTask {
  label: string;
  completed: boolean;
}

interface StudentExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  score: string;
  timeSpent?: string;
  comprehension?: string;
  errorAnalysis: string;
  tasks: HomeworkTask[];
}

interface StudentHomework {
  studentId: string;
  studentName: string;
  studentCode: string;
  exercises: StudentExerciseProgress[];
}

export default function CourseProgress({ roster, onSelectStudent }: CourseProgressProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillType>("READING");
  const [selectedSession, setSelectedSession] = useState<number>(13);
  const [aiAssistantStudent, setAiAssistantStudent] = useState<{
    student: StudentHomework;
    exercise: StudentExerciseProgress;
  } | null>(null);
  const [aiFeedbackText, setAiFeedbackText] = useState("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Define static mock exercises per skill and session
  const getSessionExercises = (skill: SkillType, session: number): string[] => {
    if (skill === "LISTENING") {
      if (session === 13) {
        return [
          "PRACTICE 1. Part 3. PRODUCT DEVELOPMENT PRESENTATION: MOSQUITO NET",
          "PRACTICE 2. Part 3. Pacific Tapa Cloth",
          "PRACTICE 3. Part 3. SONG-WRITING COURSE"
        ];
      }
      if (session === 14) {
        return [
          "PRACTICE 1. Part 1. Accommodation Form Completion",
          "PRACTICE 2. Part 2. Theater Tour Map Labeling"
        ];
      }
      return ["PRACTICE 1. Part 4. The History of English Language"];
    } else if (skill === "READING") {
      if (session === 13) {
        return [
          "PRACTICE 1. The history of guitar",
          "PRACTICE 2. Frozen food preservation",
          "PRACTICE 3. Climate change impact"
        ];
      }
      if (session === 14) {
        return [
          "PRACTICE 1. The Secrets of Sand",
          "PRACTICE 2. The Development of Cities"
        ];
      }
      return ["PRACTICE 1. Telepathy and ESP"];
    } else if (skill === "SPEAKING") {
      if (session === 13) {
        return [
          "PRACTICE 1. Vocabulary & Idioms Practice",
          "PRACTICE 2. Shadowing Practice (IPA focus)",
          "PRACTICE 3. Forecast Practice: Family & Home"
        ];
      }
      return [
        "PRACTICE 1. Pronunciation Warmup",
        "PRACTICE 2. Part 2 Cue Card: A memorable trip"
      ];
    } else { // WRITING
      if (session === 13) {
        return [
          "PRACTICE 1. Structure & Overview Practice",
          "PRACTICE 2. Line Graph Data Analysis",
          "PRACTICE 3. Full Draft Task 1 Essay"
        ];
      }
      return [
        "PRACTICE 1. Introduction Paragraph Builder",
        "PRACTICE 2. Writing Task 2 Outline: Education topic"
      ];
    }
  };

  // Generate deterministic mock homework data based on current skill and session
  const getHomeworkData = (): StudentHomework[] => {
    const exercisesList = getSessionExercises(selectedSkill, selectedSession);

    return roster.map((item, index) => {
      const studentId = item.student.id;
      
      const exercisesProgress: StudentExerciseProgress[] = exercisesList.map((exerciseName, exIndex) => {
        const seedOffset = exIndex * 17;
        const metric = stableMetric(studentId, selectedSession + seedOffset);
        
        let score = "";
        let timeSpent = "";
        let comprehension = "";
        let errorAnalysis = "";
        let tasks: HomeworkTask[] = [];

        if (selectedSkill === "LISTENING") {
          score = `${stableMetric(studentId, 20 + seedOffset, 6, 5)}/10`;
          timeSpent = `${stableMetric(studentId, 22 + seedOffset, 12, 18)} phút`;
          comprehension = `${stableMetric(studentId, 23 + seedOffset, 70, 25)}%`;
          
          const listeningMistakes = [
            "Sai câu số điện thoại vì nghe thiếu số 0 ở giữa.",
            "Mắc bẫy nhiễu thông tin (distractor) ở câu 2.",
            "Chưa ghi chép kịp tốc độ nói ở phần chỉ đường.",
            "Không phát âm được nối âm dẫn đến chọn sai keyword.",
            "Sai chính tả khi viết từ số nhiều."
          ];
          errorAnalysis = listeningMistakes[metric % listeningMistakes.length];
          
          tasks = [
            { label: "Vừa nghe vừa đọc Script", completed: metric % 2 === 0 },
            { label: "Học từ vựng mới", completed: metric % 3 !== 0 },
            { label: "Shadowing / Gap filling", completed: metric % 4 !== 0 },
            { label: "Chỉ nghe hiểu (không nhìn script)", completed: metric % 5 !== 0 },
          ];
        } else if (selectedSkill === "READING") {
          score = `${stableMetric(studentId, 30 + seedOffset, 8, 6)}/13`;
          timeSpent = `${stableMetric(studentId, 32 + seedOffset, 10, 15)} phút`;
          comprehension = `${stableMetric(studentId, 33 + seedOffset, 75, 20)}%`;
          
          const readingMistakes = [
            "Sai câu True/False vì phân vân giữa False và Not Given.",
            "Nhầm lẫn keyword đồng nghĩa (synonyms) ở đoạn C.",
            "Hết thời gian nên đánh lụi 2 câu cuối.",
            "Chọn sai thông tin do đọc lướt quá nhanh qua chi tiết quan trọng.",
            "Nhầm lẫn từ vựng gốc latin trong văn cảnh khoa học."
          ];
          errorAnalysis = readingMistakes[metric % readingMistakes.length];
          
          tasks = [
            { label: "Dịch bài đọc sang tiếng Việt", completed: metric % 2 === 0 },
            { label: "Học từ vựng mới + Làm test từ vựng", completed: metric % 3 !== 0 },
            { label: "Đọc hiểu không cần từ vựng", completed: metric % 4 !== 0 },
          ];
        } else if (selectedSkill === "SPEAKING") {
          score = `${(stableMetric(studentId, 40 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
          
          const speakingMistakes = [
            "Phát âm sai phụ âm cuối /s/, /z/, nuốt âm khi nói nhanh.",
            "Ngập ngừng lâu khi cố mở rộng ý Speaking Part 1.",
            "Từ vựng còn lặp đi lặp lại nhiều từ cơ bản (nice, happy).",
            "Mắc lỗi ngữ pháp thời quá khứ khi kể về trải nghiệm cũ.",
            "Tông giọng còn đều đều, thiếu trọng âm từ và trọng âm câu."
          ];
          errorAnalysis = speakingMistakes[metric % speakingMistakes.length];
          
          tasks = [
            { label: "Lập danh sách từ vựng theo Mindmap", completed: metric % 2 === 0 },
            { label: "Nộp file ghi âm bài nói nháp", completed: metric % 3 !== 0 },
            { label: "Nộp file luyện phát âm Shadowing", completed: metric % 4 !== 0 },
            { label: "Nộp bằng chứng luyện tập forecast", completed: metric % 5 !== 0 },
          ];
        } else { // WRITING
          score = `${(stableMetric(studentId, 50 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
          
          const writingMistakes = [
            "Thiếu câu overview tổng quan, phân tích số liệu rời rạc.",
            "Mắc nhiều lỗi chia động từ ở quá khứ đơn.",
            "Sử dụng sai liên từ (linking words) khiến câu bị gượng.",
            "Phân bổ thời gian chưa hợp lý, chưa kịp viết kết bài.",
            "Viết sai định dạng so sánh hơn/so sánh nhất của tính từ dài."
          ];
          errorAnalysis = writingMistakes[metric % writingMistakes.length];
          
          tasks = [
            { label: "Lập dàn ý cấu trúc bài viết (Outline)", completed: metric % 2 === 0 },
            { label: "Viết bài nháp (Draft Essay)", completed: metric % 3 !== 0 },
            { label: "Đọc nhận xét & viết bài sửa lỗi sai", completed: metric % 4 !== 0 },
          ];
        }

        return {
          exerciseId: `${studentId}-${selectedSession}-${exIndex}`,
          exerciseName,
          score,
          timeSpent: selectedSkill === "LISTENING" || selectedSkill === "READING" ? timeSpent : undefined,
          comprehension: selectedSkill === "LISTENING" || selectedSkill === "READING" ? comprehension : undefined,
          errorAnalysis,
          tasks,
        };
      });

      return {
        studentId,
        studentName: item.student.fullName,
        studentCode: item.student.studentCode,
        exercises: exercisesProgress,
      };
    });
  };

  const [studentHomeworkList, setStudentHomeworkList] = useState<StudentHomework[]>(getHomeworkData);

  // Re-generate mock data if active filters change (keep state aligned with selectors)
  const currentHomeworkList = getHomeworkData();

  const handleTaskToggle = (studentId: string, exerciseId: string, taskIndex: number) => {
    const updated = studentHomeworkList.map(item => {
      if (item.studentId === studentId) {
        const nextExercises = item.exercises.map(ex => {
          if (ex.exerciseId === exerciseId) {
            const nextTasks = [...ex.tasks];
            nextTasks[taskIndex] = { ...nextTasks[taskIndex], completed: !nextTasks[taskIndex].completed };
            return { ...ex, tasks: nextTasks };
          }
          return ex;
        });
        return { ...item, exercises: nextExercises };
      }
      return item;
    });
    setStudentHomeworkList(updated);
  };

  const handleOpenAiAssistant = (student: StudentHomework, exercise: StudentExerciseProgress) => {
    setAiAssistantStudent({ student, exercise });
    setIsGeneratingFeedback(true);
    setAiFeedbackText("");

    setTimeout(() => {
      let advice = "";
      if (selectedSkill === "READING") {
        advice = `Chào ${student.studentName.split(" ").pop()},\n\nAI nhận thấy phần luyện đọc "${exercise.exerciseName}" của em đạt kết quả ${exercise.score}. Điểm cần lưu ý: ${exercise.errorAnalysis.toLowerCase()}\n\n💡 Đề xuất cải thiện:\n- Đọc kỹ keyword định vị thông tin trong câu hỏi trước.\n- Luyện tập phân biệt rõ giữa FALSE (thông tin trái ngược) và NOT GIVEN (thông tin không có trong bài).\n- Hoàn thành nốt checklist dịch bài để tăng vốn từ vựng học thuật.`;
      } else if (selectedSkill === "LISTENING") {
        advice = `Chào ${student.studentName.split(" ").pop()},\n\nPhần bài nghe "${exercise.exerciseName}" của em đạt kết quả ${exercise.score}. Nhận xét: ${exercise.errorAnalysis.toLowerCase()}\n\n💡 Đề xuất cải thiện:\n- Thực hành nghe chép chính tả (Dictation) 5 phút mỗi ngày với các số và tên riêng.\n- Chú ý nghe các từ nối tương phản (but, however) vì đáp án thường nằm sau đó.`;
      } else if (selectedSkill === "SPEAKING") {
        advice = `Chào ${student.studentName.split(" ").pop()},\n\nPhần Speaking của em đạt band dự kiến ${exercise.score}. Lỗi phát âm: ${exercise.errorAnalysis.toLowerCase()}\n\n💡 Đề xuất cải thiện:\n- Ghi âm lại các câu hỏi forecast và nghe lại để tự sửa các âm đuôi /s/, /z/.\n- Sử dụng kỹ thuật 5W1H để mở rộng ý trả lời mà không bị ngập ngừng.`;
      } else {
        advice = `Chào ${student.studentName.split(" ").pop()},\n\nBài Writing của em đạt band dự kiến ${exercise.score}. Phân tích bài viết: ${exercise.errorAnalysis.toLowerCase()}\n\n💡 Đề xuất cải thiện:\n- Viết lại câu Overview rõ ràng nêu bật xu hướng chung trước khi đi vào số liệu chi tiết.\n- Rà soát các lỗi chia động từ cơ bản thời quá khứ.`;
      }
      setAiFeedbackText(advice);
      setIsGeneratingFeedback(false);
    }, 800);
  };

  const handleSendFeedback = () => {
    alert(`Đã gửi nhận xét của AI tới học viên ${aiAssistantStudent?.student.studentName}!`);
    setAiAssistantStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Skill Navigation */}
      <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 overflow-x-auto">
        {[
          { id: "READING", label: "Đọc (Reading)", icon: BookOpen },
          { id: "LISTENING", label: "Nghe (Listening)", icon: Ear },
          { id: "SPEAKING", label: "Nói (Speaking)", icon: Microphone },
          { id: "WRITING", label: "Viết (Writing)", icon: Pencil },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedSkill(tab.id as SkillType);
                // Synchronize local state with newly selected skill
                const nextList = roster.map((item, index) => {
                  const studentId = item.student.id;
                  const exercisesList = getSessionExercises(tab.id as SkillType, selectedSession);
                  const exercisesProgress = exercisesList.map((exerciseName, exIndex) => {
                    const seedOffset = exIndex * 17;
                    const metric = stableMetric(studentId, selectedSession + seedOffset);
                    let score = "";
                    let timeSpent = "";
                    let comprehension = "";
                    let errorAnalysis = "";
                    let tasks: HomeworkTask[] = [];

                    if (tab.id === "LISTENING") {
                      score = `${stableMetric(studentId, 20 + seedOffset, 6, 5)}/10`;
                      timeSpent = `${stableMetric(studentId, 22 + seedOffset, 12, 18)} phút`;
                      comprehension = `${stableMetric(studentId, 23 + seedOffset, 70, 25)}%`;
                      errorAnalysis = "Sai câu số điện thoại vì nghe thiếu số 0 ở giữa.";
                      tasks = [
                        { label: "Vừa nghe vừa đọc Script", completed: metric % 2 === 0 },
                        { label: "Học từ vựng mới", completed: metric % 3 !== 0 },
                        { label: "Shadowing / Gap filling", completed: metric % 4 !== 0 },
                        { label: "Chỉ nghe hiểu (không nhìn script)", completed: metric % 5 !== 0 },
                      ];
                    } else if (tab.id === "READING") {
                      score = `${stableMetric(studentId, 30 + seedOffset, 8, 6)}/13`;
                      timeSpent = `${stableMetric(studentId, 32 + seedOffset, 10, 15)} phút`;
                      comprehension = `${stableMetric(studentId, 33 + seedOffset, 75, 20)}%`;
                      errorAnalysis = "Sai câu True/False vì phân vân giữa False và Not Given.";
                      tasks = [
                        { label: "Dịch bài đọc sang tiếng Việt", completed: metric % 2 === 0 },
                        { label: "Học từ vựng mới + Làm test từ vựng", completed: metric % 3 !== 0 },
                        { label: "Đọc hiểu không cần từ vựng", completed: metric % 4 !== 0 },
                      ];
                    } else if (tab.id === "SPEAKING") {
                      score = `${(stableMetric(studentId, 40 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
                      errorAnalysis = "Phát âm sai phụ âm cuối /s/, /z/, nuốt âm khi nói nhanh.";
                      tasks = [
                        { label: "Lập danh sách từ vựng theo Mindmap", completed: metric % 2 === 0 },
                        { label: "Nộp file ghi âm bài nói nháp", completed: metric % 3 !== 0 },
                        { label: "Nộp file luyện phát âm Shadowing", completed: metric % 4 !== 0 },
                        { label: "Nộp bằng chứng luyện tập forecast", completed: metric % 5 !== 0 },
                      ];
                    } else {
                      score = `${(stableMetric(studentId, 50 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
                      errorAnalysis = "Thiếu câu overview tổng quan, phân tích số liệu rời rạc.";
                      tasks = [
                        { label: "Lập dàn ý cấu trúc bài viết (Outline)", completed: metric % 2 === 0 },
                        { label: "Viết bài nháp (Draft Essay)", completed: metric % 3 !== 0 },
                        { label: "Đọc nhận xét & viết bài sửa lỗi sai", completed: metric % 4 !== 0 },
                      ];
                    }

                    return {
                      exerciseId: `${studentId}-${selectedSession}-${exIndex}`,
                      exerciseName,
                      score,
                      timeSpent: tab.id === "LISTENING" || tab.id === "READING" ? timeSpent : undefined,
                      comprehension: tab.id === "LISTENING" || tab.id === "READING" ? comprehension : undefined,
                      errorAnalysis,
                      tasks,
                    };
                  });
                  return {
                    studentId,
                    studentName: item.student.fullName,
                    studentCode: item.student.studentCode,
                    exercises: exercisesProgress,
                  };
                });
                setStudentHomeworkList(nextList);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selectedSkill === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Session Selector */}
      <div className="flex items-center gap-3 bg-surface p-4 border border-outline-variant/40 rounded-2xl shadow-sm">
        <span className="text-sm font-bold text-on-surface-variant">Chọn session:</span>
        <div className="flex items-center gap-1.5">
          {[13, 14, 15].map(num => (
            <button
              key={num}
              onClick={() => {
                setSelectedSession(num);
                // Synchronize local state with newly selected session
                const nextList = roster.map((item, index) => {
                  const studentId = item.student.id;
                  const exercisesList = getSessionExercises(selectedSkill, num);
                  const exercisesProgress = exercisesList.map((exerciseName, exIndex) => {
                    const seedOffset = exIndex * 17;
                    const metric = stableMetric(studentId, num + seedOffset);
                    let score = "";
                    let timeSpent = "";
                    let comprehension = "";
                    let errorAnalysis = "";
                    let tasks: HomeworkTask[] = [];

                    if (selectedSkill === "LISTENING") {
                      score = `${stableMetric(studentId, 20 + seedOffset, 6, 5)}/10`;
                      timeSpent = `${stableMetric(studentId, 22 + seedOffset, 12, 18)} phút`;
                      comprehension = `${stableMetric(studentId, 23 + seedOffset, 70, 25)}%`;
                      errorAnalysis = "Sai câu số điện thoại vì nghe thiếu số 0 ở giữa.";
                      tasks = [
                        { label: "Vừa nghe vừa đọc Script", completed: metric % 2 === 0 },
                        { label: "Học từ vựng mới", completed: metric % 3 !== 0 },
                        { label: "Shadowing / Gap filling", completed: metric % 4 !== 0 },
                        { label: "Chỉ nghe hiểu (không nhìn script)", completed: metric % 5 !== 0 },
                      ];
                    } else if (selectedSkill === "READING") {
                      score = `${stableMetric(studentId, 30 + seedOffset, 8, 6)}/13`;
                      timeSpent = `${stableMetric(studentId, 32 + seedOffset, 10, 15)} phút`;
                      comprehension = `${stableMetric(studentId, 33 + seedOffset, 75, 20)}%`;
                      errorAnalysis = "Sai câu True/False vì phân vân giữa False và Not Given.";
                      tasks = [
                        { label: "Dịch bài đọc sang tiếng Việt", completed: metric % 2 === 0 },
                        { label: "Học từ vựng mới + Làm test từ vựng", completed: metric % 3 !== 0 },
                        { label: "Đọc hiểu không cần từ vựng", completed: metric % 4 !== 0 },
                      ];
                    } else if (selectedSkill === "SPEAKING") {
                      score = `${(stableMetric(studentId, 40 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
                      errorAnalysis = "Phát âm sai phụ âm cuối /s/, /z/, nuốt âm khi nói nhanh.";
                      tasks = [
                        { label: "Lập danh sách từ vựng theo Mindmap", completed: metric % 2 === 0 },
                        { label: "Nộp file ghi âm bài nói nháp", completed: metric % 3 !== 0 },
                        { label: "Nộp file luyện phát âm Shadowing", completed: metric % 4 !== 0 },
                        { label: "Nộp bằng chứng luyện tập forecast", completed: metric % 5 !== 0 },
                      ];
                    } else {
                      score = `${(stableMetric(studentId, 50 + seedOffset, 40, 25) / 10).toFixed(1)} / 9.0`;
                      errorAnalysis = "Thiếu câu overview tổng quan, phân tích số liệu rời rạc.";
                      tasks = [
                        { label: "Lập dàn ý cấu trúc bài viết (Outline)", completed: metric % 2 === 0 },
                        { label: "Viết bài nháp (Draft Essay)", completed: metric % 3 !== 0 },
                        { label: "Đọc nhận xét & viết bài sửa lỗi sai", completed: metric % 4 !== 0 },
                      ];
                    }

                    return {
                      exerciseId: `${studentId}-${num}-${exIndex}`,
                      exerciseName,
                      score,
                      timeSpent: selectedSkill === "LISTENING" || selectedSkill === "READING" ? timeSpent : undefined,
                      comprehension: selectedSkill === "LISTENING" || selectedSkill === "READING" ? comprehension : undefined,
                      errorAnalysis,
                      tasks,
                    };
                  });
                  return {
                    studentId,
                    studentName: item.student.fullName,
                    studentCode: item.student.studentCode,
                    exercises: exercisesProgress,
                  };
                });
                setStudentHomeworkList(nextList);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedSession === num
                  ? "bg-primary-container/20 text-primary border border-primary/20"
                  : "bg-surface hover:bg-surface-container border border-outline-variant/50"
              }`}
            >
              Session {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant ml-auto italic">
          Đang hiển thị bài học: <strong>{selectedSkill} - Session {selectedSession}</strong>
        </span>
      </div>

      {/* Detailed tracking spreadsheet with stacked multi-exercises */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-4 w-48 sticky left-0 bg-surface-container-low z-20 border-r border-outline-variant/20">
                  Học viên
                </th>
                <th className="px-4 py-4 w-60">Hoạt động / Bài tập</th>
                <th className="px-4 py-4 w-28 text-center">Kết quả</th>
                <th className="px-4 py-4 w-80">Nhiệm vụ tự học (Self-study tasks)</th>
                <th className="px-4 py-4 w-72">Phân tích lỗi sai (AI)</th>
                <th className="px-5 py-4 w-28 text-center">Trợ lý AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {studentHomeworkList.map(student => {
                const totalExercises = student.exercises.length;
                
                return (
                  <tr key={student.studentId} className="hover:bg-surface-container-low/10 transition-colors border-b border-outline-variant/25 last:border-0">
                    {/* Student profile (Sticky and spanning height of all exercises) */}
                    <td className="px-5 py-4 sticky left-0 bg-surface z-10 border-r border-outline-variant/20 valign-top vertical-top align-top">
                      <div className="min-w-0">
                        <strong 
                          onClick={() => onSelectStudent?.(student.studentId)}
                          className="font-extrabold text-on-surface text-sm block cursor-pointer hover:text-primary hover:underline"
                        >
                          {student.studentName}
                        </strong>
                        <span className="text-[10px] font-bold text-on-surface-variant block mt-0.5">
                          {student.studentCode}
                        </span>
                      </div>
                    </td>

                    {/* Stacked exercises list */}
                    <td colSpan={5} className="p-0">
                      <div className="flex flex-col">
                        {student.exercises.map((exercise, exIndex) => (
                          <div 
                            key={exercise.exerciseId}
                            className="grid grid-cols-[240px_112px_320px_288px_112px] items-stretch border-b border-outline-variant/15 last:border-b-0 py-3"
                          >
                            {/* Exercise info */}
                            <div className="px-4 py-1 flex flex-col justify-center">
                              <span className="text-xs font-bold text-primary leading-tight">
                                {exercise.exerciseName}
                              </span>
                              {exercise.timeSpent && (
                                <span className="text-[10px] text-on-surface-variant block mt-1.5 font-semibold">
                                  ⏱️ Làm bài: <strong>{exercise.timeSpent}</strong>
                                </span>
                              )}
                              {exercise.comprehension && (
                                <span className="text-[10px] text-on-surface-variant block font-semibold">
                                  🎯 Thấu hiểu: <strong>{exercise.comprehension}</strong>
                                </span>
                              )}
                            </div>

                            {/* Score */}
                            <div className="px-4 py-1 flex items-center justify-center">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
                                {exercise.score}
                              </span>
                            </div>

                            {/* Checklists */}
                            <div className="px-4 py-1 flex flex-col justify-center">
                              <div className="space-y-1.5">
                                {exercise.tasks.map((task, tIndex) => (
                                  <label 
                                    key={tIndex} 
                                    className="flex items-start gap-1.5 text-xs text-on-surface-variant font-semibold cursor-pointer select-none"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={task.completed}
                                      onChange={() => handleTaskToggle(student.studentId, exercise.exerciseId, tIndex)}
                                      className="w-3.5 h-3.5 mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                                    />
                                    <span className={task.completed ? "line-through opacity-50 text-on-surface-variant" : "text-on-surface"}>
                                      {task.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Error analysis */}
                            <div className="px-4 py-1 flex items-center">
                              <div className="bg-surface-container-low/45 p-2.5 rounded-xl border border-outline-variant/15 flex gap-2 w-full">
                                <WarningCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
                                  {exercise.errorAnalysis}
                                </p>
                              </div>
                            </div>

                            {/* Action AI Review */}
                            <div className="px-4 py-1 flex items-center justify-center">
                              <button
                                onClick={() => handleOpenAiAssistant(student, exercise)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
                              >
                                <Robot size={14} />
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes info footer */}
        <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
          <Info size={16} className="text-primary" />
          <span>Một session có tối đa 5 bài tập (Practice Sections) được theo dõi đồng thời. Giáo viên có thể bấm "Review" cạnh mỗi bài tập để AI hỗ trợ viết nhận xét lỗi sai cá nhân hóa cho học viên.</span>
        </div>
      </div>

      {/* AI Assistant Modal/Side Drawer */}
      {aiAssistantStudent && (
        <div className="fixed inset-0 z-50 bg-on-background/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-surface h-full shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Robot size={22} className="text-primary" />
                  <h3 className="font-display font-extrabold text-lg">Trợ lý chấm chữa AI</h3>
                </div>
                <button
                  onClick={() => setAiAssistantStudent(null)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                >
                  ✕
                </button>
              </div>

              {/* Student/Exercise card */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 mb-4 text-xs space-y-2">
                <p>Học viên: <strong className="text-on-surface">{aiAssistantStudent.student.studentName}</strong> ({aiAssistantStudent.student.studentCode})</p>
                <p>Bài luyện tập: <strong className="text-primary leading-tight block mt-1">{aiAssistantStudent.exercise.exerciseName}</strong></p>
                <p>Kết quả hiện tại: <strong className="text-emerald-700">{aiAssistantStudent.exercise.score}</strong></p>
                <p>Phân tích lỗi sai: <span className="text-on-surface-variant font-medium">{aiAssistantStudent.exercise.errorAnalysis}</span></p>
              </div>

              {/* Editable AI generated feedback */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  <Sparkle size={14} className="text-primary animate-pulse" />
                  Đề xuất phản hồi cá nhân hóa từ AI
                </label>
                {isGeneratingFeedback ? (
                  <div className="h-40 border border-outline-variant/50 rounded-xl bg-surface-container animate-pulse flex items-center justify-center text-xs text-on-surface-variant font-bold">
                    Đang phân tích và soạn văn bản...
                  </div>
                ) : (
                  <textarea
                    value={aiFeedbackText}
                    onChange={e => setAiFeedbackText(e.target.value)}
                    rows={8}
                    className="w-full border border-outline-variant rounded-xl p-3 text-xs bg-surface focus:outline-none focus:border-primary leading-relaxed"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-outline-variant/30 pt-4">
              <button
                onClick={() => setAiAssistantStudent(null)}
                className="flex-1 py-2.5 border border-outline-variant/60 hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendFeedback}
                className="flex-1 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <PaperPlane size={14} />
                Gửi cho Học viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
