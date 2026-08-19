import { ArrowRight, Books, Clock, Exam, FileAudio, FileText, Plus, ShieldCheck, SpinnerGap, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Page } from "../../academic-types";
import type { LearningResource, TestBankItem } from "../../library-types";
import { apiFetch } from "../../lib/api";

type Props = {
  onOpenAddMaterial: () => void;
  onOpenBulkImport: () => void;
  onOpenNewTest: () => void;
  onNavigateTab: (tab: "MATERIALS" | "TEST_BANK" | "MEDIA") => void;
};
type Summary = { resources: number; tests: number; media: number; awaitingReview: number; inUse: number };

export function ContentHub({ onOpenAddMaterial, onOpenBulkImport, onOpenNewTest, onNavigateTab }: Props) {
  const [activeTab, setActiveTab] = useState<"RECENT" | "DRAFTS">("RECENT");
  const [summary, setSummary] = useState<Summary>({ resources: 0, tests: 0, media: 0, awaitingReview: 0, inUse: 0 });
  const [materials, setMaterials] = useState<LearningResource[]>([]);
  const [drafts, setDrafts] = useState<TestBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Summary>("/admin/library/summary"),
      apiFetch<Page<LearningResource>>("/admin/library/resources?size=5&sort=updatedAt,desc"),
      apiFetch<Page<TestBankItem>>("/admin/test-bank?status=DRAFT&size=5"),
    ]).then(([nextSummary, resources, tests]) => {
      if (!active) return;
      setSummary(nextSummary);
      setMaterials(resources.content);
      setDrafts(tests.content);
    }).catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const metrics = [
    { label: "Kho học liệu", value: summary.resources, icon: Books, tab: "MATERIALS" as const },
    { label: "Ngân hàng đề thi", value: summary.tests, icon: Exam, tab: "TEST_BANK" as const },
    { label: "Media Library", value: summary.media, icon: FileAudio, tab: "MEDIA" as const },
  ];

  return <div className="space-y-8">
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div><span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#8f4458]">NỘI DUNG ĐÀO TẠO</span><h1 className="font-display text-3xl font-extrabold tracking-tight text-[#211A1D] md:text-4xl">Kho học liệu & Ngân hàng đề</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">Workspace thống nhất để quản lý bài giảng, đề thi IELTS, media và liên kết nội dung vào buổi học.</p></div>
      <div className="flex flex-wrap gap-3"><button onClick={onOpenBulkImport} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#e3dce2] bg-white px-4 text-sm font-bold"><UploadSimple size={18}/>Nhập dữ liệu hàng loạt</button><button onClick={onOpenAddMaterial} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white"><Plus size={18}/>Thêm nội dung</button></div>
    </header>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-[#b4232d]"><WarningCircle className="mr-2 inline"/>{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map(({ label, value, icon: Icon, tab }) => <button key={label} onClick={() => onNavigateTab(tab)} className="group rounded-[16px] border border-[#e3dce2] bg-white p-5 text-left transition hover:border-[#8f4458]/50 hover:shadow-sm"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]"><Icon size={22} weight="duotone"/></span><span className="text-xs font-bold text-[#746A6E]">Khám phá →</span></div><p className="mt-4 text-2xl font-black text-[#211A1D]">{loading ? "—" : value}</p><p className="mt-1 text-xs font-semibold text-[#746A6E]">{label}</p></button>)}
      <Metric label="Nội dung chờ xử lý" value={summary.awaitingReview} loading={loading} icon={<Clock size={22}/>} tone="amber"/>
      <Metric label="Đang được sử dụng" value={summary.inUse} loading={loading} icon={<ShieldCheck size={22}/>} tone="green"/>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-[#e3dce2] pb-3"><div className="flex gap-2"><Tab active={activeTab === "RECENT"} onClick={() => setActiveTab("RECENT")}>Tài liệu cập nhật gần đây</Tab><Tab active={activeTab === "DRAFTS"} onClick={() => setActiveTab("DRAFTS")}>Đề thi đang soạn</Tab></div><button onClick={() => onNavigateTab(activeTab === "DRAFTS" ? "TEST_BANK" : "MATERIALS")} className="inline-flex items-center gap-1 text-xs font-bold text-[#8f4458]">Xem tất cả <ArrowRight/></button></div>
        {loading ? <Empty><SpinnerGap className="mr-2 inline animate-spin"/>Đang tải dữ liệu...</Empty> : activeTab === "RECENT" ? <div className="space-y-3">{materials.length === 0 ? <Empty>Chưa có học liệu.</Empty> : materials.map((item) => <div key={item.id} className="flex items-center justify-between rounded-[16px] border border-[#e3dce2] bg-white p-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]"><FileText size={20}/></span><div className="min-w-0"><span className="text-xs font-bold text-[#8f4458]">{item.code} · {item.skill}</span><h3 className="truncate text-sm font-bold">{item.title}</h3><p className="truncate text-xs text-[#746A6E]">{item.description || "Chưa có mô tả"}</p></div></div><button onClick={() => onNavigateTab("MATERIALS")} className="ml-3 rounded-lg border px-3 py-2 text-xs font-bold text-[#8f4458]">Chi tiết</button></div>)}</div> : <div className="space-y-3">{drafts.length === 0 ? <Empty>Không có đề thi nháp.</Empty> : drafts.map((test) => <div key={test.id} className="flex items-center justify-between rounded-[16px] border border-[#e3dce2] bg-white p-4"><div><span className="text-xs font-bold text-[#8f4458]">{test.code}</span><h3 className="text-sm font-bold">{test.title}</h3><p className="text-xs text-[#746A6E]">{test.totalQuestions} câu · cập nhật {new Date(test.updatedAt).toLocaleDateString("vi-VN")}</p></div><Link to={`/test-builder/${test.skill.toLowerCase()}/${test.id}`} className="rounded-xl bg-[#8f4458] px-4 py-2 text-xs font-bold text-white">Tiếp tục soạn</Link></div>)}</div>}
      </section>
      <aside className="space-y-5"><div className="rounded-[18px] border border-[#8f4458]/20 bg-[#f7e7ec]/40 p-5"><h2 className="font-display font-bold text-[#743447]">Tạo đề thi IELTS mới</h2><p className="mt-1 text-xs leading-5 text-[#746A6E]">Khởi tạo đề và lưu nháp trực tiếp vào ngân hàng đề.</p><button onClick={onOpenNewTest} className="mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#8f4458] text-xs font-bold text-white"><Plus/>Mở Test Builder</button></div><div className="rounded-[18px] border border-[#e3dce2] bg-white p-5"><h2 className="text-sm font-bold">Tình trạng kiểm duyệt</h2><p className="mt-3 text-xs leading-5 text-[#746A6E]">{summary.awaitingReview === 0 ? "Không có nội dung chờ xử lý." : `${summary.awaitingReview} nội dung cần hoàn thiện hoặc duyệt.`}</p></div></aside>
    </div>
  </div>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-xs font-bold ${active ? "bg-[#8f4458] text-white" : "text-[#746A6E]"}`}>{children}</button>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-[16px] border border-dashed border-[#e3dce2] bg-white p-10 text-center text-sm text-[#746A6E]">{children}</div>; }
function Metric({ label, value, loading, icon, tone }: { label: string; value: number; loading: boolean; icon: React.ReactNode; tone: "amber" | "green" }) { return <div className="rounded-[16px] border border-[#e3dce2] bg-white p-5"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone === "amber" ? "bg-amber-50 text-[#8a6000]" : "bg-emerald-50 text-[#237653]"}`}>{icon}</span><p className="mt-4 text-2xl font-black">{loading ? "—" : value}</p><p className="mt-1 text-xs font-semibold text-[#746A6E]">{label}</p></div>; }
