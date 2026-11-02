import {
  CalendarBlank,
  CheckCircle,
  EnvelopeSimple,
  IdentificationCard,
  Receipt,
  SpinnerGap,
  User,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";

type BuyerType = "PERSONAL" | "BUSINESS";

interface ManualInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ManualInvoiceResponse {
  id: string;
  orderCode: string;
  referenceCode?: string;
  status: string;
}

interface ManualInvoiceForm {
  buyerName: string;
  amount: string;
  paidDate: string;
  buyerType: BuyerType;
  buyerEmail: string;
  companyName: string;
  taxCode: string;
  address: string;
  note: string;
}

function today() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function initialForm(): ManualInvoiceForm {
  return {
    buyerName: "",
    amount: "",
    paidDate: today(),
    buyerType: "PERSONAL",
    buyerEmail: "",
    companyName: "",
    taxCode: "",
    address: "",
    note: "",
  };
}

export function ManualInvoiceDialog({ open, onClose, onCreated }: ManualInvoiceDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState<ManualInvoiceForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ManualInvoiceResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setSubmitting(false);
    setError(null);
    setCreated(null);
    closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const update = <K extends keyof ManualInvoiceForm>(key: K, value: ManualInvoiceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.buyerName.trim() || !form.amount || !form.paidDate) {
      setError("Hãy nhập tên người mua, số tiền và ngày tiền vào.");
      return;
    }
    if (form.buyerType === "BUSINESS" && (!form.companyName.trim() || !form.taxCode.trim())) {
      setError("Người mua tổ chức cần có tên doanh nghiệp và mã số thuế.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<ManualInvoiceResponse>("/admin/billing/manual-invoices", {
        method: "POST",
        body: JSON.stringify({
          buyerName: form.buyerName.trim(),
          amount: Number(form.amount),
          paidDate: form.paidDate,
          buyerType: form.buyerType,
          buyerEmail: form.buyerEmail.trim() || null,
          companyName: form.companyName.trim() || null,
          taxCode: form.taxCode.trim() || null,
          address: form.address.trim() || null,
          note: form.note.trim() || null,
        }),
      });
      setCreated(response);
      onCreated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tạo được hóa đơn nháp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-on-background/45 p-4 backdrop-blur-xs"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-invoice-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/25 bg-surface-container-low/55 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt size={21} weight="duotone" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">SePay eInvoice</p>
              <h2 id="manual-invoice-title" className="mt-0.5 text-lg font-bold text-on-surface">Tạo hóa đơn thủ công</h2>
              <p className="mt-1 text-xs text-on-surface-variant">Tạo giao dịch lịch sử và hóa đơn nháp từ khoản tiền đã nhận.</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            aria-label="Đóng form tạo hóa đơn thủ công"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {error && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700" role="alert">
                {error}
              </div>
            )}

            {created && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800" role="status">
                <CheckCircle className="mt-0.5 shrink-0" size={18} weight="fill" />
                <div>
                  <p className="font-bold">Đã tạo hóa đơn nháp</p>
                  <p className="mt-0.5 text-xs">Mã tham chiếu: {created.referenceCode || created.orderCode}. Mở danh sách hóa đơn để kiểm tra và phát hành CQT.</p>
                </div>
              </div>
            )}

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <Receipt size={17} className="text-primary" />
                Thông tin khoản thu
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs font-semibold text-on-surface">
                  Ngày tiền vào tài khoản <span className="text-rose-600">*</span>
                  <span className="relative mt-1 block">
                    <CalendarBlank className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input type="date" max={today()} required value={form.paidDate} onChange={(event) => update("paidDate", event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface pl-10 pr-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </span>
                </label>
                <label className="block text-xs font-semibold text-on-surface">
                  Tổng tiền thanh toán (VNĐ) <span className="text-rose-600">*</span>
                  <input type="number" min="1" step="1" required inputMode="numeric" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="2.000.000" className="mt-1 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </label>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-3 text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Nội dung dịch vụ:</span> Đóng học phí đào tạo IELTS
              </div>
            </section>

            <section className="space-y-3 border-t border-outline-variant/25 pt-5">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <User size={17} className="text-primary" />
                Thông tin người mua
              </div>
              <label className="block text-xs font-semibold text-on-surface">
                Tên người mua / học viên <span className="text-rose-600">*</span>
                <span className="relative mt-1 block">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                  <input type="text" required value={form.buyerName} onChange={(event) => update("buyerName", event.target.value)} placeholder="Có thể dùng nguyên trạng tên biệt danh" className="min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface pl-10 pr-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </span>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs font-semibold text-on-surface">
                  Email nhận hóa đơn <span className="font-normal text-on-surface-variant">(không bắt buộc)</span>
                  <span className="relative mt-1 block">
                    <EnvelopeSimple className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input type="email" value={form.buyerEmail} onChange={(event) => update("buyerEmail", event.target.value)} placeholder="hocvien@example.com" className="min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface pl-10 pr-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </span>
                </label>
                <fieldset>
                  <legend className="text-xs font-semibold text-on-surface">Loại người mua</legend>
                  <div className="mt-1 grid min-h-11 grid-cols-2 rounded-xl border border-outline-variant/50 bg-surface p-1">
                    {(["PERSONAL", "BUSINESS"] as BuyerType[]).map((type) => (
                      <button key={type} type="button" onClick={() => update("buyerType", type)} className={`rounded-lg px-2 text-xs font-bold transition ${form.buyerType === type ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container"}`}>
                        {type === "PERSONAL" ? "Cá nhân" : "Tổ chức"}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>

            {form.buyerType === "BUSINESS" && (
              <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <IdentificationCard size={17} className="text-primary" />
                  Thông tin xuất cho tổ chức
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-xs font-semibold text-on-surface">Tên doanh nghiệp <span className="text-rose-600">*</span><input type="text" required value={form.companyName} onChange={(event) => update("companyName", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                  <label className="block text-xs font-semibold text-on-surface">Mã số thuế <span className="text-rose-600">*</span><input type="text" required value={form.taxCode} onChange={(event) => update("taxCode", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 font-mono text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                </div>
                <label className="block text-xs font-semibold text-on-surface">Địa chỉ doanh nghiệp <span className="font-normal text-on-surface-variant">(không bắt buộc)</span><input type="text" value={form.address} onChange={(event) => update("address", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
              </section>
            )}

            <label className="block text-xs font-semibold text-on-surface">
              Ghi chú nội bộ <span className="font-normal text-on-surface-variant">(không đưa lên hóa đơn)</span>
              <textarea rows={2} value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Ví dụ: giao dịch cũ tháng 10/2026" className="mt-1 w-full resize-none rounded-xl border border-outline-variant/50 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/25 bg-surface-container-low/45 px-5 py-4">
            <p className="max-w-sm text-[11px] leading-relaxed text-on-surface-variant">Hệ thống sẽ tạo hóa đơn nháp. Bạn kiểm tra lại thông tin rồi chọn phát hành CQT trong danh sách hóa đơn.</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} disabled={submitting} className="min-h-10 rounded-xl border border-outline-variant/50 bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50">Đóng</button>
              <button type="submit" disabled={submitting || Boolean(created)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
                {submitting ? <SpinnerGap size={16} className="animate-spin" /> : <Receipt size={16} weight="bold" />}
                {submitting ? "Đang tạo..." : "Tạo hóa đơn nháp"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
