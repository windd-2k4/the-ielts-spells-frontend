import {
  ArrowLeft, Check, CheckCircle, Copy, Eye, Funnel, Highlighter, Key,
  Lightning, ListBullets, MagnifyingGlass, NotePencil, Plus, Question, ShieldCheck,
  TextB, TextItalic, TextUnderline, Trash, WarningCircle, X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { QuestionCardItem, QuestionGroupItem, QuestionTypeFormat, TestBankItem, ValidationIssue } from "../../library-types";
import { apiFetch } from "../../lib/api";
import PublishValidationModal from "./PublishValidationModal";
import TestPreviewModal from "./TestPreviewModal";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

export function ReadingTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [testRecord, setTestRecord] = useState<TestBankItem | null>(null);
  const [testTitle, setTestTitle] = useState("IELTS Academic Reading Mock Test 12 - Climate Change & AI");
  const [activePassage, setActivePassage] = useState<1 | 2 | 3>(1);
  const [leftWidth, setLeftWidth] = useState(50); // Split percentage
  const [isResizing, setIsResizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVING" | "SAVED" | "DISCONNECTED">("SAVED");
  const [lastSavedTime, setLastSavedTime] = useState("10:32");

  // Passage rich text content
  const [passageContent, setPassageContent] = useState<Record<number, string>>({
    1: `<h2>READING PASSAGE 1</h2><p>You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.</p><h3>The Impact of Artificial Intelligence on Modern Meteorology</h3><p>Weather forecasting has undergone a revolutionary transformation in recent years, driven primarily by advancements in artificial intelligence (AI) and machine learning algorithms. Traditionally, meteorologists relied on supercomputers executing complex numerical weather prediction (NWP) models to process massive thermodynamic equations...</p>`,
    2: `<h2>READING PASSAGE 2</h2><p>Passage 2 text content goes here...</p>`,
    3: `<h2>READING PASSAGE 3</h2><p>Passage 3 text content goes here...</p>`,
  });

  // Mock Question Groups for Passage 1
  const [questionGroups, setQuestionGroups] = useState<QuestionGroupItem[]>([
    {
      id: "qg-1",
      title: "Questions 1–5",
      startQuestionNo: 1,
      endQuestionNo: 5,
      typeFormat: "TRUE_FALSE_NOT_GIVEN",
      instructions: "Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE, or NOT GIVEN.",
      questions: [
        {
          id: "q-1",
          number: 1,
          typeFormat: "TRUE_FALSE_NOT_GIVEN",
          prompt: "Numerical weather prediction models process massive thermodynamic equations.",
          options: [],
          correctAnswers: ["TRUE"],
          explanation: "In paragraph 1, the text explicitly mentions NWP models processing thermodynamic equations.",
          isComplete: true,
          hasError: false,
        },
        {
          id: "q-2",
          number: 2,
          typeFormat: "TRUE_FALSE_NOT_GIVEN",
          prompt: "Supercomputers are no longer used by meteorologists today.",
          options: [],
          correctAnswers: ["FALSE"],
          explanation: "Paragraph 1 states meteorologists traditionally and currently rely on supercomputers.",
          isComplete: true,
          hasError: false,
        },
        {
          id: "q-3",
          number: 3,
          typeFormat: "TRUE_FALSE_NOT_GIVEN",
          prompt: "AI algorithms can accurately predict solar flare frequency 50 years in advance.",
          options: [],
          correctAnswers: [], // Missing answer triggers validation error!
          explanation: "",
          isComplete: false,
          hasError: true,
          errorMessage: "Chưa chọn đáp án đúng cho câu này.",
        },
        {
          id: "q-4",
          number: 4,
          typeFormat: "TRUE_FALSE_NOT_GIVEN",
          prompt: "Traditional forecasting methods required more manual data entry.",
          options: [],
          correctAnswers: ["TRUE"],
          isComplete: true,
          hasError: false,
        },
        {
          id: "q-5",
          number: 5,
          typeFormat: "TRUE_FALSE_NOT_GIVEN",
          prompt: "Machine learning model training requires specialized GPU hardware.",
          options: [],
          correctAnswers: ["NOT_GIVEN"],
          isComplete: true,
          hasError: false,
        },
      ],
    },
    {
      id: "qg-2",
      title: "Questions 6–10",
      startQuestionNo: 6,
      endQuestionNo: 10,
      typeFormat: "MULTIPLE_CHOICE",
      instructions: "Choose the correct letter, A, B, C or D.",
      questions: [
        {
          id: "q-6",
          number: 6,
          typeFormat: "MULTIPLE_CHOICE",
          prompt: "What is the primary advantage of AI weather prediction over traditional NWP models?",
          options: [
            { id: "opt-a", label: "A", text: "Faster calculation speeds and lower power consumption" },
            { id: "opt-b", label: "B", text: "Elimination of satellite observational data" },
            { id: "opt-c", label: "C", text: "Complete independence from historical weather records" },
            { id: "opt-d", label: "D", text: "Simplified mathematical equations" },
          ],
          correctAnswers: ["opt-a"],
          isComplete: true,
          hasError: false,
        },
      ],
    },
  ]);

  const [selectedQuestionNo, setSelectedQuestionNo] = useState<number>(3);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    if (!testId) return;
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`)
      .then(test => {
        setTestRecord(test); setTestTitle(test.title);
        const content = test.builderContent ?? {};
        setPassageContent((content.passageContent as Record<number, string> | undefined) ?? { 1: "", 2: "", 3: "" });
        setQuestionGroups((content.questionGroups as QuestionGroupItem[] | undefined) ?? []);
      })
      .catch(() => setSaveStatus("DISCONNECTED"));
  }, [testId]);

  // Compute validation issues
  const validationIssues: ValidationIssue[] = [];
  questionGroups.forEach((g) => {
    g.questions.forEach((q) => {
      if (q.hasError || !q.isComplete) {
        validationIssues.push({
          id: q.id,
          severity: "ERROR",
          sectionTitle: `Passage ${activePassage}`,
          questionNo: q.number,
          message: q.errorMessage || `Câu ${q.number} chưa có đáp án đúng.`,
          targetId: q.id,
        });
      }
    });
  });

  // Persist the current draft using the test-bank aggregate.
  const triggerAutosave = useCallback(() => {
    if (!testRecord || !testId) return;
    setSaveStatus("SAVING");
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: testTitle, description: null, skill: "READING",
        purpose: testRecord.purpose, testType: testRecord.testType, difficulty: testRecord.difficulty,
        durationMinutes: testRecord.durationMinutes || 60, version: testRecord.version, tags: testRecord.tags,
        builderContent: { passageContent, questionGroups },
      }),
    }).then(saved => {
      setTestRecord(saved); setSaveStatus("SAVED");
      const now = new Date();
      setLastSavedTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    }).catch(() => setSaveStatus("DISCONNECTED"));
  }, [passageContent, questionGroups, testId, testRecord, testTitle]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        triggerAutosave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPreviewModal(true);
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerAutosave]);

  // Resizer handlers
  const handleMouseDown = () => setIsResizing(true);
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const containerWidth = window.innerWidth;
    const newPercent = Math.min(Math.max((e.clientX / containerWidth) * 100, 25), 75);
    setLeftWidth(newPercent);
  };
  const handleMouseUp = () => setIsResizing(false);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F6FA] text-[#211A1D]">
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-white px-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/test-bank"
            className="flex items-center gap-1.5 text-xs font-bold text-[#746A6E] hover:text-[#8f4458]"
          >
            <ArrowLeft size={16} />
            <span>Ngân hàng đề</span>
          </Link>
          <span className="h-4 w-px bg-[#e3dce2]" />
          <input
            value={testTitle}
            onChange={(e) => {
              setTestTitle(e.target.value);
              triggerAutosave();
            }}
            className="font-display text-sm font-bold text-[#211A1D] border-b border-transparent focus:border-[#8f4458] focus:outline-none min-w-[320px]"
          />
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-[#746A6E]">
            Draft
          </span>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-xs text-[#746A6E]">
            {saveStatus === "SAVING" ? (
              <span className="flex items-center gap-1 text-[#8a6000]">
                <span className="h-2 w-2 rounded-full bg-[#8a6000] animate-pulse" />
                Đang lưu...
              </span>
            ) : saveStatus === "SAVED" ? (
              <span className="flex items-center gap-1 text-[#237653]">
                <Check size={14} />
                Đã lưu lúc {lastSavedTime}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#b4232d]">
                <WarningCircle size={14} />
                Mất kết nối
              </span>
            )}
          </div>

          {/* Validation Issue Counter Badge */}
          <button
            onClick={() => setShowValidationModal(true)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
              validationIssues.length > 0
                ? "bg-rose-50 text-[#b4232d] hover:bg-rose-100"
                : "bg-emerald-50 text-[#237653]"
            }`}
          >
            <WarningCircle size={14} />
            <span>{validationIssues.length} lỗi cần xử lý</span>
          </button>

          <span className="h-4 w-px bg-[#e3dce2]" />

          {/* Action Buttons */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#e3dce2] bg-white text-[#746A6E] hover:bg-[#f1eef4]"
            title="Danh sách Phím tắt (?)"
          >
            <Question size={18} />
          </button>

          <button
            onClick={() => triggerAutosave()}
            className="min-h-[38px] rounded-xl border border-[#e3dce2] px-3.5 text-xs font-bold text-[#211A1D] hover:bg-[#f1eef4]"
          >
            Lưu nháp (Ctrl+S)
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#8f4458] px-3.5 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
          >
            <Eye size={16} />
            Xem trước (Ctrl+P)
          </button>

          <button
            onClick={() => setShowValidationModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <ShieldCheck size={16} />
            Xuất bản đề thi
          </button>
        </div>
      </header>

      {/* SECTION TABS (Passage 1 / Passage 2 / Passage 3) */}
      <nav className="flex h-11 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-[#f1eef4] px-5">
        <div className="flex gap-1">
          {[1, 2, 3].map((pNo) => (
            <button
              key={pNo}
              onClick={() => setActivePassage(pNo as 1 | 2 | 3)}
              className={`min-h-[36px] rounded-t-xl px-5 text-xs font-bold transition ${
                activePassage === pNo
                  ? "bg-white text-[#8f4458] shadow-sm"
                  : "text-[#746A6E] hover:bg-[#e3dce2]"
              }`}
            >
              Reading Passage {pNo}
            </button>
          ))}
          <button className="min-h-[36px] px-3 text-xs font-bold text-[#746A6E] hover:text-[#8f4458]">
            + Thêm Passage
          </button>
        </div>

        <span className="text-xs font-semibold text-[#746A6E]">
          Test Builder Reading • Chế độ Soạn thảo Split-Screen
        </span>
      </nav>

      {/* WORKSPACE SPLIT-SCREEN */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANEL: SOURCE MATERIAL (Passage Rich Text Editor) */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="custom-scrollbar flex flex-col overflow-y-auto border-r border-[#e3dce2] bg-white p-6"
        >
          {/* Sticky Editor Toolbar */}
          <div className="sticky top-0 z-20 mb-4 flex items-center gap-2 rounded-xl border border-[#e3dce2] bg-[#F8F6FA] p-2 shadow-sm">
            <button className="p-1.5 rounded text-[#211A1D] hover:bg-[#e3dce2]" title="Heading">
              <span className="font-black text-xs">H2</span>
            </button>
            <button className="p-1.5 rounded text-[#211A1D] hover:bg-[#e3dce2]" title="Bold">
              <TextB size={16} />
            </button>
            <button className="p-1.5 rounded text-[#211A1D] hover:bg-[#e3dce2]" title="Italic">
              <TextItalic size={16} />
            </button>
            <button className="p-1.5 rounded text-[#211A1D] hover:bg-[#e3dce2]" title="Underline">
              <TextUnderline size={16} />
            </button>
            <button className="p-1.5 rounded text-[#211A1D] hover:bg-[#e3dce2]" title="Bullet List">
              <ListBullets size={16} />
            </button>
            <span className="h-4 w-px bg-[#e3dce2]" />
            <button className="flex items-center gap-1 p-1.5 rounded text-[#8f4458] hover:bg-[#f7e7ec] font-bold text-xs">
              <Highlighter size={16} />
              <span>Tạo Annotation Giáo viên</span>
            </button>
          </div>

          {/* Editable Passage Rich Text Area */}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              setPassageContent({ ...passageContent, [activePassage]: e.currentTarget.innerHTML });
              triggerAutosave();
            }}
            dangerouslySetInnerHTML={{ __html: passageContent[activePassage] }}
            className="prose max-w-none text-sm leading-7 text-[#211A1D] outline-none min-h-[500px]"
          />
        </div>

        {/* DRAGGABLE RESIZER */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setLeftWidth(50)}
          className={`split-resizer ${isResizing ? "is-dragging" : ""}`}
          title="Kéo để chỉnh độ rộng 2 bên (Nhấp đôi để reset 50/50)"
        >
          <div className="split-resizer-handle" />
        </div>

        {/* RIGHT PANEL: QUESTION BUILDER */}
        <div
          style={{ width: `${100 - leftWidth}%` }}
          className="custom-scrollbar flex flex-col overflow-y-auto bg-[#F8F6FA] p-6 space-y-6"
        >
          {/* Question Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3dce2] bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-[#211A1D]">
                Danh sách Question Groups ({questionGroups.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newGroup: QuestionGroupItem = {
                    id: `qg-${Date.now()}`,
                    title: `Questions 11–13`,
                    startQuestionNo: 11,
                    endQuestionNo: 13,
                    typeFormat: "FILL_IN_BLANK",
                    instructions: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
                    wordLimitRule: "NO MORE THAN TWO WORDS",
                    questions: [
                      {
                        id: `q-11`,
                        number: 11,
                        typeFormat: "FILL_IN_BLANK",
                        prompt: "Modern forecasting relies heavily on ______ models.",
                        options: [],
                        correctAnswers: ["numerical weather prediction", "NWP"],
                        isComplete: true,
                        hasError: false,
                      },
                    ],
                  };
                  setQuestionGroups([...questionGroups, newGroup]);
                  triggerAutosave();
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-3.5 text-xs font-bold text-white hover:bg-[#743447]"
              >
                <Plus size={16} />
                + Thêm Question Group
              </button>
            </div>
          </div>

          {/* QUESTION GROUPS & QUESTION CARDS */}
          {questionGroups.map((group) => (
            <div key={group.id} className="rounded-[18px] border border-[#e3dce2] bg-white p-5 space-y-4 shadow-sm">
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f7e7ec] px-3 py-1 text-xs font-extrabold text-[#743447]">
                    {group.title}
                  </span>
                  <span className="rounded-full bg-[#f1eef4] px-2.5 py-0.5 text-[11px] font-bold text-[#746A6E]">
                    {group.typeFormat}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button className="p-1 text-[#746A6E] hover:text-[#8f4458]">
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setQuestionGroups(questionGroups.filter((g) => g.id !== group.id));
                      triggerAutosave();
                    }}
                    className="p-1 text-[#b4232d] hover:bg-rose-50 rounded"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {/* Group Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-[#746A6E] mb-1">Hướng dẫn chung (Instructions)</label>
                <input
                  value={group.instructions}
                  onChange={(e) => {
                    const newGs = questionGroups.map((g) => (g.id === group.id ? { ...g, instructions: e.target.value } : g));
                    setQuestionGroups(newGs);
                    triggerAutosave();
                  }}
                  className="min-h-[38px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                />
              </div>

              {/* QUESTION CARDS LIST */}
              <div className="space-y-4 pt-2">
                {group.questions.map((q) => (
                  <div
                    key={q.id}
                    id={q.id}
                    onClick={() => setSelectedQuestionNo(q.number)}
                    className={`rounded-xl border p-4 transition ${
                      q.hasError
                        ? "border-[#b4232d] bg-rose-50/30"
                        : selectedQuestionNo === q.number
                        ? "border-[#8f4458] ring-2 ring-[#8f4458]/20 bg-white"
                        : "border-[#e3dce2] bg-white"
                    }`}
                  >
                    {/* Question Card Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#e3dce2]/60">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8f4458] text-xs font-bold text-white">
                          {q.number}
                        </span>
                        <span className="text-xs font-bold text-[#211A1D]">Câu hỏi {q.number}</span>
                        {q.hasError && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#b4232d]">
                            Thiếu đáp án
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button className="text-[11px] font-bold text-[#8f4458] hover:underline">
                          Đánh số lại...
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold text-[#746A6E] mb-1">Nội dung câu hỏi</label>
                      <input
                        value={q.prompt}
                        onChange={(e) => {
                          const newGs = questionGroups.map((g) => ({
                            ...g,
                            questions: g.questions.map((item) => (item.id === q.id ? { ...item, prompt: e.target.value } : item)),
                          }));
                          setQuestionGroups(newGs);
                          triggerAutosave();
                        }}
                        className="min-h-[38px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                      />
                    </div>

                    {/* Question Body according to Format */}
                    {q.typeFormat === "TRUE_FALSE_NOT_GIVEN" && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-bold text-[#746A6E] mb-1">Đáp án đúng</label>
                        <div className="flex gap-2">
                          {["TRUE", "FALSE", "NOT_GIVEN"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                const newGs = questionGroups.map((g) => ({
                                  ...g,
                                  questions: g.questions.map((item) =>
                                    item.id === q.id
                                      ? { ...item, correctAnswers: [val], isComplete: true, hasError: false }
                                      : item
                                  ),
                                }));
                                setQuestionGroups(newGs);
                                triggerAutosave();
                              }}
                              className={`min-h-[34px] rounded-xl border px-3 text-xs font-bold transition ${
                                q.correctAnswers.includes(val)
                                  ? "border-[#237653] bg-emerald-50 text-[#237653]"
                                  : "border-[#e3dce2] bg-white text-[#746A6E]"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.typeFormat === "MULTIPLE_CHOICE" && (
                      <div className="mt-3 space-y-2">
                        <label className="block text-[11px] font-bold text-[#746A6E]">Các lựa chọn A/B/C/D</label>
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswers.includes(opt.id)}
                              onChange={() => {
                                const newGs = questionGroups.map((g) => ({
                                  ...g,
                                  questions: g.questions.map((item) =>
                                    item.id === q.id ? { ...item, correctAnswers: [opt.id], isComplete: true, hasError: false } : item
                                  ),
                                }));
                                setQuestionGroups(newGs);
                                triggerAutosave();
                              }}
                              className="accent-[#8f4458]"
                            />
                            <span className="font-bold text-xs text-[#8f4458]">{opt.label}.</span>
                            <input
                              value={opt.text}
                              onChange={(e) => {
                                const newGs = questionGroups.map((g) => ({
                                  ...g,
                                  questions: g.questions.map((item) =>
                                    item.id === q.id
                                      ? {
                                          ...item,
                                          options: item.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                                        }
                                      : item
                                  ),
                                }));
                                setQuestionGroups(newGs);
                                triggerAutosave();
                              }}
                              className="min-h-[34px] flex-1 rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Question Card Collapsible Footer: Explanation */}
                    <div className="mt-3 border-t border-[#e3dce2]/60 pt-3">
                      <label className="block text-[11px] font-bold text-[#746A6E] mb-1">Giải thích chi tiết (Explanation & Key Analysis)</label>
                      <textarea
                        rows={2}
                        value={q.explanation || ""}
                        onChange={(e) => {
                          const newGs = questionGroups.map((g) => ({
                            ...g,
                            questions: g.questions.map((item) => (item.id === q.id ? { ...item, explanation: e.target.value } : item)),
                          }));
                          setQuestionGroups(newGs);
                          triggerAutosave();
                        }}
                        placeholder="Nhập lời giải chi tiết, phân tích từ đồng nghĩa (paraphrase)..."
                        className="w-full rounded-xl border border-[#e3dce2] p-2.5 text-xs focus:border-[#8f4458] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FLOATING QUESTION NAVIGATOR (1-40) */}
        <div className="w-56 shrink-0 border-l border-[#e3dce2] bg-white p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e3dce2] pb-2">
            <span className="font-display text-xs font-bold text-[#211A1D]">Question Navigator</span>
            <span className="text-[10px] font-extrabold text-[#746A6E]">1–40</span>
          </div>

          <div className="q-nav-grid">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((no) => {
              const qObj = questionGroups.flatMap((g) => g.questions).find((q) => q.number === no);
              const isCompleted = qObj?.isComplete && !qObj?.hasError;
              const hasErr = qObj?.hasError;
              const isActive = selectedQuestionNo === no;

              return (
                <button
                  key={no}
                  onClick={() => {
                    setSelectedQuestionNo(no);
                    if (qObj) {
                      document.getElementById(qObj.id)?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`q-nav-btn ${isCompleted ? "is-completed" : ""} ${hasErr ? "has-error" : ""} ${isActive ? "is-active" : ""}`}
                >
                  {no}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#e3dce2] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#e4f3ed] border border-[#a3d5c1]" />
              <span className="text-[#237653] font-semibold">Đã hoàn thiện</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#fbe8e9] border border-[#f2aeb1]" />
              <span className="text-[#b4232d] font-semibold">Chưa có đáp án</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[#f7e7ec] border border-[#8f4458]" />
              <span className="text-[#8f4458] font-semibold">Đang chọn</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showValidationModal && (
        <PublishValidationModal
          test={{
            id: testId || "t-reading-01",
            code: "TST-R012",
            purpose: "MOCK_TEST",
            skill: "READING",
            testType: "SINGLE_SKILL",
            difficulty: "Band 6.5-7.5",
            sectionsCount: 3,
            totalQuestions: 40,
            durationMinutes: 60,
            version: "v1.0",
            status: "DRAFT",
            tags: ["Reading"],
            referencedCoursesCount: 0,
            createdBy: "Thầy Quốc Bảo",
            createdAt: "2026-08-17T00:00:00Z",
            updatedAt: "2026-08-17T00:00:00Z",
            ...(testRecord ?? {}),
            title: testTitle,
            builderContent: { passageContent, questionGroups },
          }}
          onClose={() => setShowValidationModal(false)}
          onPublished={() => {
            if (!testId) return;
            return apiFetch(`/admin/test-bank/${testId}/status`, { method: "PATCH", body: JSON.stringify({ status: "PUBLISHED" }) })
              .then(() => { setShowValidationModal(false); navigate("/test-bank"); });
          }}
        />
      )}

      {showPreviewModal && (
        <TestPreviewModal
          test={{
            id: testId || "t-reading-01",
            code: "TST-R012",
            purpose: "MOCK_TEST",
            skill: "READING",
            testType: "SINGLE_SKILL",
            difficulty: "Band 6.5-7.5",
            sectionsCount: 3,
            totalQuestions: 40,
            durationMinutes: 60,
            version: "v1.0",
            status: "DRAFT",
            tags: ["Reading"],
            referencedCoursesCount: 0,
            createdBy: "Thầy Quốc Bảo",
            createdAt: "2026-08-17T00:00:00Z",
            updatedAt: "2026-08-17T00:00:00Z",
            ...(testRecord ?? {}),
            title: testTitle,
            builderContent: { passageContent, questionGroups },
          }}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
