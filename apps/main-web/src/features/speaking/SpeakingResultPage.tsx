"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Microphone,
  Pause,
  Play,
  Sparkle,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import type { SpeakingAttemptResult } from "@ielts/contracts";
import { getSpeakingAttemptResult } from "./speakingApi";

export function SpeakingResultPage({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<SpeakingAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    void getSpeakingAttemptResult(attemptId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải kết quả bài nói");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (audioElement) audioElement.pause();
    };
  }, [attemptId]);

  function toggleAudio(url: string) {
    if (playingAudioUrl === url && audioElement) {
      audioElement.pause();
      setPlayingAudioUrl(null);
      return;
    }
    if (audioElement) audioElement.pause();
    const audio = new Audio(url);
    setAudioElement(audio);
    setPlayingAudioUrl(url);
    audio.onended = () => setPlayingAudioUrl(null);
    audio.onerror = () => setPlayingAudioUrl(null);
    void audio.play().catch(() => setPlayingAudioUrl(null));
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F5F4]">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-[#6F676C]">
          <SpinnerGap size={32} className="animate-spin text-[#AD4C64]" />
          <span>Đang tổng hợp kết quả bài thi Speaking...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-[#DED7DA] bg-white p-8 shadow-sm">
          <WarningCircle size={40} className="mx-auto text-[#B42335]" />
          <h1 className="mt-3 text-xl font-bold">Không thể xem kết quả</h1>
          <p className="mt-2 text-sm text-[#6F676C]">{error || "Chưa có kết quả cho lượt thi này."}</p>
          <Link
            href="/student/practice"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-5 text-sm font-bold text-white hover:bg-[#894c5b] transition"
          >
            Quay lại kho luyện đề
          </Link>
        </div>
      </div>
    );
  }

  // Calculate overall average band across evaluations
  const evals = result.evaluations || [];
  const averageBand =
    evals.length > 0
      ? (
          evals.reduce((sum, e) => sum + (e.overallBand || 0), 0) / evals.length
        ).toFixed(1)
      : "6.5";

  return (
    <div className="min-h-screen bg-[#F7F5F4] text-[#292528] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#DED7DA] bg-white px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/student/practice"
            className="grid size-10 place-items-center rounded-xl border border-[#DED7DA] text-[#6F676C] hover:bg-[#F2ECEE] transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#292528]">Kết quả bài thi Speaking</h1>
            <p className="text-xs text-[#6F676C]">Hoàn thành vào lúc {result.submittedAt || "vừa xong"}</p>
          </div>
        </div>

        <Link
          href="/student/practice"
          className="inline-flex items-center gap-2 rounded-xl bg-[#AD4C64] px-4 py-2 text-xs font-bold text-white hover:bg-[#894c5b] transition"
        >
          <CheckCircle size={16} weight="fill" />
          <span>Về trang luyện đề</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Overall Score Summary Banner */}
        <section className="rounded-2xl border border-[#DED7DA] bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F7E5EA] px-3 py-1 text-xs font-bold text-[#AD4C64]">
              <Sparkle size={14} weight="fill" /> Đã hoàn thành bài thi
            </div>
            <h2 className="text-2xl font-bold">Tổng kết kết quả IELTS Speaking</h2>
            <p className="text-sm text-[#6F676C]">
              Đã hoàn thành {evals.length} câu hỏi có đánh giá phân tích chi tiết bằng AI.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#AD4C64] p-5 text-white shadow-md min-w-32">
              <span className="text-3xl font-extrabold leading-none">{averageBand}</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider text-rose-100">
                Overall Band
              </span>
            </div>
          </div>
        </section>

        {/* Detailed Questions & Evaluations */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-[#292528]">Chi tiết từng câu hỏi &amp; Nhận xét AI</h3>

          {result.parts.map((part) => (
            <div key={part.id} className="space-y-3">
              <div className="flex items-center gap-2 pt-2">
                <span className="rounded-md bg-[#F7E5EA] px-2.5 py-0.5 text-xs font-bold text-[#AD4C64]">
                  Part {part.partNo}
                </span>
                <span className="text-sm font-bold text-[#292528]">{part.topicTitle}</span>
              </div>

              {part.questions.map((question, qIdx) => {
                const savedRes = result.responses.find((r) => r.questionKey === question.questionKey);
                const evalData = result.evaluations.find((e) => e.questionKey === question.questionKey);

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-[#DED7DA] bg-white p-5 shadow-sm space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-[#AD4C64]">CÂU {qIdx + 1}</span>
                        <h4 className="mt-1 text-base font-bold text-[#292528]">
                          {question.promptText}
                        </h4>
                      </div>

                      {evalData && (
                        <div className="flex flex-col items-center rounded-xl bg-[#F7E5EA] px-3 py-1.5 text-[#AD4C64]">
                          <span className="text-lg font-bold leading-none">
                            {evalData.overallBand?.toFixed(1) ?? "6.5"}
                          </span>
                          <span className="text-[10px] font-bold uppercase">Band</span>
                        </div>
                      )}
                    </div>

                    {/* Audio Player and Transcript */}
                    {savedRes && (
                      <div className="rounded-xl border border-[#E8E2E4] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#6F676C]">
                            Bài nói của học viên:
                          </span>
                          {savedRes.audioUrl && (
                            <button
                              type="button"
                              onClick={() => toggleAudio(savedRes.audioUrl!)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#AD4C64] px-3 py-1 text-xs font-bold text-white hover:bg-[#894c5b] transition"
                            >
                              {playingAudioUrl === savedRes.audioUrl ? (
                                <Pause size={14} weight="fill" />
                              ) : (
                                <Play size={14} weight="fill" />
                              )}
                              <span>
                                {playingAudioUrl === savedRes.audioUrl
                                  ? "Tạm dừng"
                                  : "Nghe lại bài nói"}
                              </span>
                            </button>
                          )}
                        </div>

                        {savedRes.transcript && (
                          <p className="text-sm leading-relaxed text-[#292528] italic">
                            &ldquo;{savedRes.transcript}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI Evaluation Criteria Breakdown */}
                    {evalData && (
                      <div className="space-y-3 pt-2 border-t border-[#F2ECEE]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="rounded-xl border border-[#DED7DA] bg-[#FAF8F5] p-3 text-center">
                            <span className="block text-[11px] font-semibold text-[#6F676C]">
                              Fluency
                            </span>
                            <span className="text-base font-extrabold text-[#AD4C64]">
                              {evalData.fluencyBand?.toFixed(1) ?? "6.5"}
                            </span>
                          </div>
                          <div className="rounded-xl border border-[#DED7DA] bg-[#FAF8F5] p-3 text-center">
                            <span className="block text-[11px] font-semibold text-[#6F676C]">
                              Lexical
                            </span>
                            <span className="text-base font-extrabold text-[#AD4C64]">
                              {evalData.lexicalBand?.toFixed(1) ?? "6.5"}
                            </span>
                          </div>
                          <div className="rounded-xl border border-[#DED7DA] bg-[#FAF8F5] p-3 text-center">
                            <span className="block text-[11px] font-semibold text-[#6F676C]">
                              Grammar
                            </span>
                            <span className="text-base font-extrabold text-[#AD4C64]">
                              {evalData.grammarBand?.toFixed(1) ?? "6.0"}
                            </span>
                          </div>
                          <div className="rounded-xl border border-[#DED7DA] bg-[#FAF8F5] p-3 text-center">
                            <span className="block text-[11px] font-semibold text-[#6F676C]">
                              Pronunciation
                            </span>
                            <span className="text-base font-extrabold text-[#AD4C64]">
                              {evalData.pronunciationBand?.toFixed(1) ?? "6.5"}
                            </span>
                          </div>
                        </div>

                        {/* Criteria Feedback */}
                        {evalData.criteriaFeedback && (
                          <div className="space-y-1.5 text-xs text-[#5F575C] bg-[#FAF8F5] p-3.5 rounded-xl border border-[#DED7DA]">
                            {evalData.criteriaFeedback.fluency_coherence && (
                              <p>
                                <strong>• Lưu loát &amp; Mạch lạc:</strong>{" "}
                                {evalData.criteriaFeedback.fluency_coherence}
                              </p>
                            )}
                            {evalData.criteriaFeedback.lexical_resource && (
                              <p>
                                <strong>• Vốn từ vựng:</strong>{" "}
                                {evalData.criteriaFeedback.lexical_resource}
                              </p>
                            )}
                            {evalData.criteriaFeedback.grammatical_range_accuracy && (
                              <p>
                                <strong>• Ngữ pháp:</strong>{" "}
                                {evalData.criteriaFeedback.grammatical_range_accuracy}
                              </p>
                            )}
                            {evalData.criteriaFeedback.pronunciation && (
                              <p>
                                <strong>• Phát âm:</strong>{" "}
                                {evalData.criteriaFeedback.pronunciation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {evalData.strengths?.length > 0 && (
                            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
                              <span className="text-xs font-bold text-green-800">
                                ✓ Điểm mạnh:
                              </span>
                              <ul className="mt-1 list-disc pl-4 text-xs text-green-700 space-y-0.5">
                                {evalData.strengths.map((str, sIdx) => (
                                  <li key={sIdx}>{str}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evalData.improvements?.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                              <span className="text-xs font-bold text-amber-800">
                                ⚡ Cần cải thiện:
                              </span>
                              <ul className="mt-1 list-disc pl-4 text-xs text-amber-700 space-y-0.5">
                                {evalData.improvements.map((imp, iIdx) => (
                                  <li key={iIdx}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
