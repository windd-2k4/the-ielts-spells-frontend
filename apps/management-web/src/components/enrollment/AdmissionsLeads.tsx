import { CheckCircle, Envelope, Funnel, MagnifyingGlass, Phone, UserPlus } from "@phosphor-icons/react";
import { useDeferredValue, useEffect, useState } from "react";
import type { Page } from "../../academic-types";
import { apiFetch } from "../../lib/api";

export type ConsultingLead = {
  id: string; fullName: string; phone: string | null; email: string | null; targetBand: number | null;
  preferredContactAt: string | null; status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
  source: string | null; notes?: string; createdAt: string; convertedStudentId: string | null;
};

export default function AdmissionsLeads({ onConvert }: { onConvert: (lead: ConsultingLead) => void }) {
  const [leads, setLeads] = useState<ConsultingLead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState<Page<ConsultingLead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  async function load() {
    setLoading(true); setError("");
    const params = new URLSearchParams({ q: deferredQuery.trim(), size: "30", sort: "createdAt,desc" });
    if (status !== "ALL") params.set("status", status);
    try {
      const result = await apiFetch<Page<ConsultingLead>>(`/admin/leads?${params.toString()}`);
      setLeads(result.content); setPage(result);
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được khách tư vấn"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [deferredQuery, status]);

  async function updateStatus(id: string, next: ConsultingLead["status"]) {
    try { await apiFetch(`/admin/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }); await load(); }
    catch (value) { setError(value instanceof Error ? value.message : "Không thể cập nhật trạng thái khách tư vấn"); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm">
      <label className="relative w-full max-w-xl"><span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-primary">Tìm khách tư vấn</span><MagnifyingGlass size={18} className="absolute bottom-3 left-3 text-on-surface-variant" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tên, email hoặc số điện thoại" className="w-full rounded-xl border border-outline-variant/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
      <label className="min-w-52"><span className="mb-2 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary"><Funnel size={13} /> Trạng thái</span><select value={status} onChange={event => setStatus(event.target.value)} className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-3 text-sm font-semibold outline-none focus:border-primary"><option value="ALL">Tất cả trạng thái</option><option value="NEW">Mới</option><option value="CONTACTED">Đã liên hệ</option><option value="QUALIFIED">Đủ điều kiện</option><option value="CONVERTED">Đã nhập học</option><option value="LOST">Không theo đuổi</option></select></label>
    </div>
    {error && <div className="rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm text-error">{error}</div>}
    {loading && <div className="rounded-2xl border border-outline-variant/30 p-10 text-center text-sm text-on-surface-variant">Đang tải khách tư vấn...</div>}
    {!loading && !leads.length && <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center"><strong className="block text-on-surface">Chưa có khách tư vấn phù hợp</strong><p className="mt-2 text-sm text-on-surface-variant">Dữ liệu tại đây đến từ form tư vấn trên landing page; không tạo dữ liệu minh họa.</p></div>}
    {!loading && <div className="grid gap-4 lg:grid-cols-2">{leads.map(lead => <LeadCard key={lead.id} lead={lead} onStatus={updateStatus} onConvert={onConvert} />)}</div>}
    {page && page.totalPages > 1 && <p className="text-center text-xs text-on-surface-variant">Hiển thị {leads.length} / {page.totalElements} khách tư vấn</p>}
  </div>;
}

function LeadCard({ lead, onStatus, onConvert }: { lead: ConsultingLead; onStatus: (id: string, status: ConsultingLead["status"]) => void; onConvert: (lead: ConsultingLead) => void }) {
  const label: Record<ConsultingLead["status"], string> = { NEW: "Mới", CONTACTED: "Đã liên hệ", QUALIFIED: "Đủ điều kiện", CONVERTED: "Đã nhập học", LOST: "Không theo đuổi" };
  const color: Record<ConsultingLead["status"], string> = { NEW: "bg-sky-50 text-sky-700", CONTACTED: "bg-amber-50 text-amber-700", QUALIFIED: "bg-violet-50 text-violet-700", CONVERTED: "bg-emerald-50 text-emerald-700", LOST: "bg-surface-container text-on-surface-variant" };
  return <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg font-black text-on-surface">{lead.fullName}</h3><p className="mt-1 text-xs font-semibold text-primary">{lead.source || "Chưa xác định nguồn"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-black ${color[lead.status]}`}>{label[lead.status]}</span></div><div className="mt-5 space-y-2 text-sm text-on-surface-variant"><p className="flex items-center gap-2"><Phone size={15} />{lead.phone || "Chưa có số điện thoại"}</p><p className="flex items-center gap-2"><Envelope size={15} />{lead.email || "Chưa có email"}</p><p>Band mục tiêu: <strong className="text-on-surface">{lead.targetBand ?? "Chưa xác định"}</strong></p></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4"><span className="text-xs text-on-surface-variant">Tạo {new Date(lead.createdAt).toLocaleDateString("vi-VN")}</span><div className="flex gap-2">{lead.status === "NEW" && <button onClick={() => void onStatus(lead.id, "CONTACTED")} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-xs font-bold">Đã liên hệ</button>}{lead.status === "CONTACTED" && <button onClick={() => void onStatus(lead.id, "QUALIFIED")} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-xs font-bold">Xác nhận đủ điều kiện</button>}{lead.status === "QUALIFIED" && <button onClick={() => onConvert(lead)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary"><UserPlus size={15} /> Liên kết & ghi danh</button>}{lead.status === "CONVERTED" && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle size={16} weight="fill" /> Đã liên kết hồ sơ</span>}</div></div></article>;
}
