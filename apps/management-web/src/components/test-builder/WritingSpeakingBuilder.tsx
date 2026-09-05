import {
  ArrowLeft, Check, Eye, FileAudio, FloppyDisk, Image, Microphone, Plus, ShieldCheck, Sparkle, Trash,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { TestBankItem } from "../../library-types";
import { apiFetch } from "../../lib/api";
import TestPreviewModal from "./TestPreviewModal";

type Props = {
  skill: "writing" | "speaking";
};

export function WritingSpeakingBuilder({ skill }: Props) {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [testRecord, setTestRecord] = useState<TestBankItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTitle, setTestTitle] = useState(
    skill === "writing"
      ? "IELTS Writing Task 1 & Task 2 Practice - Technology & Society"
      : "IELTS Speaking Part 1–3 - Daily Habits & Hobbies"
  );
  const [activeTab, setActiveTab] = useState<number>(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Writing state
  const [promptText, setPromptText] = useState(
    skill === "writing"
      ? "The graph below shows the consumption of fish and different kinds of meat in a European country between 1979 and 2004. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
      : "Describe a book you read recently that you found inspiring."
  );
  const [minWords, setMinWords] = useState(skill === "writing" ? 150 : 0);
  const [timeMinutes, setTimeMinutes] = useState(skill === "writing" ? 20 : 14);
  const [sampleAnswer, setSampleAnswer] = useState(
    "The line graph illustrates the weekly consumption of four types of meat and fish per person..."
  );

  useEffect(() => {
    if (!testId) return;
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`).then(test => {
      setTestRecord(test); setTestTitle(test.title);
      const content = test.builderContent ?? {};
      setPromptText((content.promptText as string | undefined) ?? "");
      setMinWords((content.minWords as number | undefined) ?? (skill === "writing" ? 150 : 0));
      setTimeMinutes((content.timeMinutes as number | undefined) ?? test.durationMinutes ?? 20);
      setSampleAnswer((content.sampleAnswer as string | undefined) ?? "");
    });
  }, [skill, testId]);

  const saveDraft = async () => {
    if (!testId || !testRecord) return null;
    setSaving(true);
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, {
        method: "PUT",
        body: JSON.stringify({ title: testTitle, description: null, skill: skill.toUpperCase(),
          testType: testRecord.testType,
          durationMinutes: timeMinutes || 1, version: testRecord.version, tags: testRecord.tags,
          builderContent: { promptText, minWords, timeMinutes, sampleAnswer } }),
      });
      setTestRecord(saved); return saved;
    } finally { setSaving(false); }
  };

  const publish = async () => {
    if (!testId) return;
    await saveDraft();
    await apiFetch(`/admin/test-bank/${testId}/status`, { method: "PATCH", body: JSON.stringify({ status: "PUBLISHED" }) });
    navigate("/test-bank");
  };

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
            onChange={(e) => setTestTitle(e.target.value)}
            className="font-display text-sm font-bold text-[#211A1D] border-b border-transparent focus:border-[#8f4458] focus:outline-none min-w-[320px]"
          />
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-[#746A6E]">
            Draft
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => void saveDraft()} disabled={saving || !testRecord}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#e3dce2] px-3.5 text-xs font-bold text-[#211A1D] disabled:opacity-50">
            <FloppyDisk size={16} />{saving ? "Đang lưu..." : "Lưu nháp"}
          </button>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#8f4458] px-3.5 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
          >
            <Eye size={16} />
            Xem trước
          </button>
          <button
            onClick={() => void publish()}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <ShieldCheck size={16} />
            Xuất bản đề thi
          </button>
        </div>
      </header>

      {/* SECTION TABS */}
      <nav className="flex h-11 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-[#f1eef4] px-5">
        <div className="flex gap-1">
          {skill === "writing" ? (
            <>
              <button
                onClick={() => setActiveTab(1)}
                className={`min-h-[36px] rounded-t-xl px-5 text-xs font-bold transition ${
                  activeTab === 1 ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
                }`}
              >
                Task 1 (Report)
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`min-h-[36px] rounded-t-xl px-5 text-xs font-bold transition ${
                  activeTab === 2 ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
                }`}
              >
                Task 2 (Essay)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab(1)}
                className={`min-h-[36px] rounded-t-xl px-4 text-xs font-bold transition ${
                  activeTab === 1 ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
                }`}
              >
                Part 1 (Introduction)
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`min-h-[36px] rounded-t-xl px-4 text-xs font-bold transition ${
                  activeTab === 2 ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
                }`}
              >
                Part 2 (Cue Card)
              </button>
              <button
                onClick={() => setActiveTab(3)}
                className={`min-h-[36px] rounded-t-xl px-4 text-xs font-bold transition ${
                  activeTab === 3 ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
                }`}
              >
                Part 3 (Discussion)
              </button>
            </>
          )}
        </div>

        <span className="text-xs font-semibold text-[#746A6E]">
          Test Builder {skill === "writing" ? "Writing" : "Speaking"} • IELTS Rubric & Sample Criteria
        </span>
      </nav>

      {/* FORM WORKSPACE */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-8 space-y-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Prompt Section */}
          <div className="rounded-[18px] border border-[#e3dce2] bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-display text-base font-bold text-[#211A1D]">
              Đề bài & Hướng dẫn ({skill === "writing" ? `Task ${activeTab}` : `Part ${activeTab}`})
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#746A6E] mb-1.5">Nội dung câu hỏi (Prompt Editor)</label>
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm focus:border-[#8f4458] focus:outline-none"
              />
            </div>

            {skill === "writing" && activeTab === 1 && (
              <div>
                <label className="block text-xs font-bold text-[#746A6E] mb-1.5">Tải hình biểu đồ (Chart/Map/Process Image)</label>
                <div className="rounded-xl border border-dashed border-[#e3dce2] bg-[#F8F6FA] p-6 text-center">
                  <Image size={32} className="mx-auto text-[#746A6E]" />
                  <p className="mt-2 text-xs font-bold text-[#211A1D]">Kéo thả file hình ảnh hoặc chọn từ Kho Media</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#746A6E] mb-1">Thời gian làm bài (Phút)</label>
                <input
                  type="number"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                />
              </div>

              {skill === "writing" && (
                <div>
                  <label className="block text-xs font-bold text-[#746A6E] mb-1">Số từ tối thiểu (Min Words)</label>
                  <input
                    type="number"
                    value={minWords}
                    onChange={(e) => setMinWords(Number(e.target.value))}
                    className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* IELTS Rubric Breakdown */}
          <div className="rounded-[18px] border border-[#e3dce2] bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3">
              <h3 className="font-display text-base font-bold text-[#211A1D]">
                IELTS Scoring Rubric Breakdown
              </h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">
                Chuẩn Chấm 4 Tiêu Chí IELTS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#F8F6FA] p-3.5 border border-[#e3dce2]">
                <h4 className="text-xs font-bold text-[#8f4458]">
                  {skill === "writing" ? "Task Achievement / Response (25%)" : "Fluency & Coherence (25%)"}
                </h4>
                <p className="mt-1 text-[11px] text-[#746A6E]">Trả lời đầy đủ các yêu cầu đề bài và phát triển ý tưởng mạch lạc.</p>
              </div>

              <div className="rounded-xl bg-[#F8F6FA] p-3.5 border border-[#e3dce2]">
                <h4 className="text-xs font-bold text-[#8f4458]">
                  {skill === "writing" ? "Coherence & Cohesion (25%)" : "Lexical Resource (25%)"}
                </h4>
                <p className="mt-1 text-[11px] text-[#746A6E]">Sử dụng từ nối, liên kết đoạn văn và khả năng paraphrase từ vựng.</p>
              </div>

              <div className="rounded-xl bg-[#F8F6FA] p-3.5 border border-[#e3dce2]">
                <h4 className="text-xs font-bold text-[#8f4458]">Lexical Resource (25%)</h4>
                <p className="mt-1 text-[11px] text-[#746A6E]">Từ vựng học thuật, collocation và ngữ cảnh phù hợp.</p>
              </div>

              <div className="rounded-xl bg-[#F8F6FA] p-3.5 border border-[#e3dce2]">
                <h4 className="text-xs font-bold text-[#8f4458]">
                  {skill === "writing" ? "Grammatical Range & Accuracy (25%)" : "Pronunciation (25%)"}
                </h4>
                <p className="mt-1 text-[11px] text-[#746A6E]">Đa dạng cấu trúc câu và kiểm soát lỗi ngữ pháp/phát âm.</p>
              </div>
            </div>
          </div>

          {/* Sample Answer & AI Scoring Config */}
          <div className="rounded-[18px] border border-[#e3dce2] bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-display text-base font-bold text-[#211A1D]">
              Bài mẫu tham khảo & Cấu hình AI Assessment
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#746A6E] mb-1.5">Bài mẫu tham khảo (Sample Answer)</label>
              <textarea
                rows={5}
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm focus:border-[#8f4458] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#f7e7ec]/50 p-4 border border-[#8f4458]/20">
              <div className="flex items-center gap-3">
                <Sparkle size={20} className="text-[#8f4458]" />
                <div>
                  <h4 className="text-xs font-bold text-[#743447]">Kích hoạt Tự động Chấm bằng AI Assessment</h4>
                  <p className="text-[11px] text-[#746A6E]">Hệ thống AI sẽ đưa ra điểm gợi ý và phân tích lỗi sai tức thì khi học viên nộp bài.</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#8f4458]" />
            </div>
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <TestPreviewModal
          test={{
            id: testId || "t-w-01",
            code: "TST-W004",
            skill: skill === "writing" ? "WRITING" : "SPEAKING",
            testType: "SINGLE_SKILL",
            sectionsCount: 2,
            totalQuestions: 2,
            durationMinutes: 60,
            version: "v1.0",
            status: "DRAFT",
            tags: [skill],
            referencedCoursesCount: 0,
            createdBy: "Cô Hồng Hạnh",
            createdAt: "2026-08-17T00:00:00Z",
            updatedAt: "2026-08-17T00:00:00Z",
            ...(testRecord ?? {}),
            title: testTitle,
            builderContent: { promptText, minWords, timeMinutes, sampleAnswer },
          }}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
