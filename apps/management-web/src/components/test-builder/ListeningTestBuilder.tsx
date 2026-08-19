import {
  ArrowLeft, Check, Copy, Eye, FileAudio, FloppyDisk, Play, Pause, Plus, Question,
  Rewind, FastForward, ShieldCheck, Trash, UploadSimple, WarningCircle, X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ListeningPartSection, QuestionGroupItem, TestBankItem, ValidationIssue } from "../../library-types";
import { apiFetch } from "../../lib/api";
import PublishValidationModal from "./PublishValidationModal";
import TestPreviewModal from "./TestPreviewModal";

export function ListeningTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [testRecord, setTestRecord] = useState<TestBankItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTitle, setTestTitle] = useState("IELTS Listening Progress Test 3 - Campus Life & Science Lecture");
  const [activePart, setActivePart] = useState<1 | 2 | 3 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(84); // seconds (01:24)
  const [duration, setDuration] = useState(360); // 6 mins
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [transcriptText, setTranscriptText] = useState(
    `[00:00] Man: Good morning, I'd like to ask about renting a room at the student hall.\n[00:15] Woman: Sure! We have two options available for next semester: standard and ensuite rooms.\n[01:24] Man: Great, could you tell me the weekly rent for the ensuite room?`
  );

  const [questionGroups, setQuestionGroups] = useState<QuestionGroupItem[]>([
    {
      id: "qg-l1",
      title: "Questions 1–5",
      startQuestionNo: 1,
      endQuestionNo: 5,
      typeFormat: "FILL_IN_BLANK",
      instructions: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      wordLimitRule: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
      linkedAudioTimestamp: "00:15",
      questions: [
        {
          id: "ql-1",
          number: 1,
          typeFormat: "FILL_IN_BLANK",
          prompt: "Name of student hall: ______ Hall",
          options: [],
          correctAnswers: ["Westwood"],
          isComplete: true,
          hasError: false,
        },
        {
          id: "ql-2",
          number: 2,
          typeFormat: "FILL_IN_BLANK",
          prompt: "Weekly cost for ensuite room: £ ______",
          options: [],
          correctAnswers: ["145"],
          isComplete: true,
          hasError: false,
        },
      ],
    },
  ]);

  const [selectedQuestionNo, setSelectedQuestionNo] = useState<number>(1);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (!testId) return;
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`).then(test => {
      setTestRecord(test); setTestTitle(test.title);
      const content = test.builderContent ?? {};
      setTranscriptText((content.transcriptText as string | undefined) ?? "");
      setQuestionGroups((content.questionGroups as QuestionGroupItem[] | undefined) ?? []);
      setDuration((content.audioDurationSeconds as number | undefined) ?? 0);
    });
  }, [testId]);

  const saveDraft = async () => {
    if (!testId || !testRecord) return;
    setSaving(true);
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, {
        method: "PUT",
        body: JSON.stringify({ title: testTitle, description: null, skill: "LISTENING",
          purpose: testRecord.purpose, testType: testRecord.testType, difficulty: testRecord.difficulty,
          durationMinutes: testRecord.durationMinutes || 40, version: testRecord.version, tags: testRecord.tags,
          builderContent: { transcriptText, questionGroups, audioDurationSeconds: duration } }),
      });
      setTestRecord(saved);
    } finally { setSaving(false); }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const insertTimestampAtCursor = () => {
    const timestampTag = `\n[${formatTime(currentTime)}] `;
    setTranscriptText((prev) => prev + timestampTag);
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
            onClick={() => setShowValidationModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <ShieldCheck size={16} />
            Xuất bản đề thi
          </button>
        </div>
      </header>

      {/* PART TABS (Part 1 / Part 2 / Part 3 / Part 4) */}
      <nav className="flex h-11 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-[#f1eef4] px-5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((pNo) => (
            <button
              key={pNo}
              onClick={() => setActivePart(pNo as 1 | 2 | 3 | 4)}
              className={`min-h-[36px] rounded-t-xl px-5 text-xs font-bold transition ${
                activePart === pNo
                  ? "bg-white text-[#8f4458] shadow-sm"
                  : "text-[#746A6E] hover:bg-[#e3dce2]"
              }`}
            >
              Part {pNo}
            </button>
          ))}
        </div>

        <span className="text-xs font-semibold text-[#746A6E]">
          Test Builder Listening • Sticky Player & Audio Segment Linkage
        </span>
      </nav>

      {/* WORKSPACE SPLIT-SCREEN */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: AUDIO PLAYER & TRANSCRIPT EDITOR */}
        <div className="custom-scrollbar flex w-1/2 flex-col overflow-y-auto border-r border-[#e3dce2] bg-white p-6 space-y-6">
          {/* STICKY AUDIO PLAYER */}
          <div className="rounded-[18px] border border-[#8f4458]/20 bg-[#f7e7ec]/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8f4458] text-white">
                  <FileAudio size={18} />
                </span>
                <div>
                  <h4 className="font-display text-xs font-bold text-[#211A1D]">
                    Listening Part {activePart} Audio Track
                  </h4>
                  <span className="text-[11px] text-[#746A6E]">IELTS_Listening_Part1.mp3 (4.2 MB)</span>
                </div>
              </div>

              <button className="rounded-lg border border-[#e3dce2] bg-white px-2.5 py-1 text-[11px] font-bold text-[#8f4458]">
                Đổi file Audio
              </button>
            </div>

            {/* Timeline Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="w-full accent-[#8f4458]"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#746A6E]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#e3dce2] bg-white text-[#746A6E]"
                  title="Tua lùi 5s"
                >
                  <Rewind size={16} />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#8f4458] text-white shadow-sm"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  onClick={() => setCurrentTime((t) => Math.min(duration, t + 5))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#e3dce2] bg-white text-[#746A6E]"
                  title="Tua tiến 5s"
                >
                  <FastForward size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#746A6E]">Tốc độ:</span>
                {[0.8, 1, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                      playbackSpeed === spd
                        ? "bg-[#8f4458] text-white"
                        : "border border-[#e3dce2] bg-white text-[#746A6E]"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TRANSCRIPT EDITOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-[#211A1D]">Transcript Editor</h4>
              <button
                onClick={insertTimestampAtCursor}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xl border border-[#8f4458] px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
              >
                <Plus size={14} />
                Chèn Timestamp [{formatTime(currentTime)}]
              </button>
            </div>

            <textarea
              rows={12}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              className="w-full rounded-xl border border-[#e3dce2] p-4 text-xs font-mono leading-6 focus:border-[#8f4458] focus:outline-none"
            />
          </div>
        </div>

        {/* RIGHT PANEL: QUESTION BUILDER */}
        <div className="custom-scrollbar flex w-1/2 flex-col overflow-y-auto bg-[#F8F6FA] p-6 space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-[#e3dce2] bg-white p-3.5 shadow-sm">
            <span className="font-display text-sm font-bold text-[#211A1D]">
              Listening Question Groups (Part {activePart})
            </span>
            <button className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-3.5 text-xs font-bold text-white hover:bg-[#743447]">
              <Plus size={16} />
              + Thêm Question Group
            </button>
          </div>

          {questionGroups.map((group) => (
            <div key={group.id} className="rounded-[18px] border border-[#e3dce2] bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3">
                <span className="font-display text-sm font-bold text-[#8f4458]">{group.title}</span>
                {group.linkedAudioTimestamp && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">
                    Audio Timestamp: [{group.linkedAudioTimestamp}]
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {group.questions.map((q) => (
                  <div key={q.id} className="rounded-xl border border-[#e3dce2] p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#211A1D]">Câu {q.number}</span>
                      <span className="text-[11px] font-bold text-[#237653]">Đáp án: {q.correctAnswers.join(", ")}</span>
                    </div>
                    <input
                      value={q.prompt}
                      onChange={() => {}}
                      className="min-h-[36px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showValidationModal && (
        <PublishValidationModal
          test={{
            id: testId || "t-listening-03",
            code: "TST-L005",
            purpose: "PROGRESS",
            skill: "LISTENING",
            testType: "SINGLE_SKILL",
            difficulty: "Band 5.5-6.5",
            sectionsCount: 4,
            totalQuestions: 40,
            durationMinutes: 40,
            version: "v1.2",
            status: "IN_REVIEW",
            tags: ["Listening"],
            referencedCoursesCount: 2,
            createdBy: "Cô Minh Trang",
            createdAt: "2026-08-16T00:00:00Z",
            updatedAt: "2026-08-16T00:00:00Z",
            ...(testRecord ?? {}),
            title: testTitle,
            builderContent: { transcriptText, questionGroups, audioDurationSeconds: duration },
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
            id: testId || "t-listening-03",
            code: "TST-L005",
            purpose: "PROGRESS",
            skill: "LISTENING",
            testType: "SINGLE_SKILL",
            difficulty: "Band 5.5-6.5",
            sectionsCount: 4,
            totalQuestions: 40,
            durationMinutes: 40,
            version: "v1.2",
            status: "IN_REVIEW",
            tags: ["Listening"],
            referencedCoursesCount: 2,
            createdBy: "Cô Minh Trang",
            createdAt: "2026-08-16T00:00:00Z",
            updatedAt: "2026-08-16T00:00:00Z",
            ...(testRecord ?? {}),
            title: testTitle,
            builderContent: { transcriptText, questionGroups, audioDurationSeconds: duration },
          }}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
