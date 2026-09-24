import React, { useState, useMemo } from "react";
import {
  Receipt,
  User,
  ShieldCheck,
  X,
  SpinnerGap,
  Buildings,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";

export interface CourseSummaryItem {
  id: string;
  code: string;
  name: string;
  tuitionAmount?: number;
  deliveryType?: string;
  enrollmentCount?: number;
}

export interface EinvoiceSplitPreviewProps {
  coursesSummary: CourseSummaryItem[];
  coursesLoading: boolean;
  settings: {
    sellerName?: string;
    sellerTaxCode?: string;
    sellerAddress?: string;
    sellerPhone?: string;
    sellerEmail?: string;
    sepayAccountNumber?: string;
    sepayBankName?: string;
    einvoiceClientId?: string;
    einvoiceTemplateCode?: string;
    einvoiceInvoiceSeries?: string;
    einvoiceSeries?: string;
    invoiceType?: "VAT" | "SALES";
    activationState?: "SANDBOX" | "PRODUCTION_CONFIGURED" | "PRODUCTION_READY" | "PRODUCTION_PILOT" | "PRODUCTION_ACTIVE";
  };
  onSubmitOrder: (data: {
    courseId: string;
    fullName: string;
    email: string;
    phone?: string;
    amount: number;
    expiresInHours: number;
    notes?: string;
    invoiceRequired: boolean;
    buyerType: "PERSONAL" | "BUSINESS";
    invoiceCompanyName?: string;
    invoiceTaxCode?: string;
    invoiceAddress?: string;
    invoiceEmail?: string;
  }) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose?: () => void;
  formatVnd: (val: number) => string;
  formatVietnameseMoneyWords: (val: number) => string;
}

export function EinvoiceSplitPreview({
  coursesSummary,
  coursesLoading,
  settings,
  onSubmitOrder,
  isSubmitting = false,
  errorMessage = null,
  onClose,
  formatVnd,
  formatVietnameseMoneyWords,
}: EinvoiceSplitPreviewProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Khóa học đăng ký
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() =>
    coursesSummary.length > 0 ? coursesSummary[0].id : ""
  );

  const matchedCourse = useMemo(() => {
    return coursesSummary.find((c) => c.id === selectedCourseId) || coursesSummary[0];
  }, [coursesSummary, selectedCourseId]);

  // 2. Học phí & thời hạn
  const [amountStr, setAmountStr] = useState<string>(() =>
    coursesSummary[0]?.tuitionAmount ? coursesSummary[0].tuitionAmount.toString() : "1800000"
  );
  const [expiresInHours, setExpiresInHours] = useState<number>(48);

  // 3. Thông tin học viên (Student / Enrollment)
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // 4. Thiết lập hóa đơn điện tử
  const [invoiceRequired, setInvoiceRequired] = useState<boolean>(true);
  const [buyerType, setBuyerType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");

  // Dữ liệu người mua / Doanh nghiệp (tách biệt rõ với tài khoản học viên khi B2B)
  const [invoiceCompanyName, setInvoiceCompanyName] = useState<string>("");
  const [invoiceTaxCode, setInvoiceTaxCode] = useState<string>("");
  const [invoiceAddress, setInvoiceAddress] = useState<string>("");
  const [invoiceEmail, setInvoiceEmail] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  // Cấu hình dự kiến từ hệ thống (Sandbox hoặc Production)
  const templateCode = settings.einvoiceTemplateCode || "2";
  const invoiceSeries = settings.einvoiceInvoiceSeries || settings.einvoiceSeries || "2C26TLN";
  const isSandbox = !settings.activationState || settings.activationState === "SANDBOX";

  // Khi chọn khóa học khác, tự cập nhật học phí nếu chưa ghi đè thủ công
  const handleCourseChange = (cid: string) => {
    setSelectedCourseId(cid);
    const found = coursesSummary.find((c) => c.id === cid);
    if (found?.tuitionAmount) {
      setAmountStr(found.tuitionAmount.toString());
    }
  };

  const finalAmount = useMemo(() => {
    const parsed = parseFloat(amountStr);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
    return matchedCourse?.tuitionAmount || 1800000;
  }, [amountStr, matchedCourse]);

  const today = new Date();
  const dateDisplay = {
    day: String(today.getDate()).padStart(2, "0"),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    year: String(today.getFullYear()),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!selectedCourseId && coursesSummary.length > 0) {
      setSelectedCourseId(coursesSummary[0].id);
    }
    if (!fullName.trim()) {
      setValidationError("Vui lòng nhập họ và tên học viên.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError("Vui lòng nhập email học viên.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError("Email học viên không đúng định dạng (ví dụ: name@gmail.com).");
      return;
    }

    onSubmitOrder({
      courseId: selectedCourseId || coursesSummary[0]?.id || "",
      fullName: fullName.trim(),
      email: trimmedEmail,
      phone: phone.trim() || undefined,
      amount: finalAmount,
      expiresInHours,
      notes: notes.trim() || undefined,
      invoiceRequired,
      buyerType,
      invoiceCompanyName:
        buyerType === "BUSINESS" ? invoiceCompanyName.trim() || undefined : undefined,
      invoiceTaxCode:
        buyerType === "BUSINESS" ? invoiceTaxCode.trim() || undefined : undefined,
      invoiceAddress: invoiceAddress.trim() || undefined,
      invoiceEmail:
        buyerType === "BUSINESS"
          ? (invoiceEmail.trim() || trimmedEmail || undefined)
          : (trimmedEmail || undefined),
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface text-on-surface select-text overflow-hidden">
      {/* 1. COMPACT PROFESSIONAL HEADER */}
      <div className="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low/60 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Receipt size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Nghị định 123 &bull; Mẫu số 2
              </span>
              {isSandbox ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                  SANDBOX
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                  PRODUCTION
                </span>
              )}
              <span className="text-[10px] font-semibold text-on-surface-variant">
                Lập đơn đăng ký &amp; Xem trước Hóa đơn bán hàng
              </span>
            </div>
            <h2 className="text-base font-bold text-on-surface tracking-tight">
              Lập Đơn Khóa Học &amp; Xuất Hóa Đơn Điện Tử
            </h2>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
            title="Đóng giao diện"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. MAIN SPLIT BODY (Two Clean Independent Scrollable Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 h-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20">
        {/* LEFT COLUMN: REAL BUSINESS FORM (5/12) - INDEPENDENT SCROLL */}
        <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto p-5 flex flex-col space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col min-h-full justify-between space-y-4">
            <div className="space-y-4">
              {/* Section 1: Course & Tuition */}
              <div className="space-y-3 p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/30">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Receipt size={14} className="text-primary" weight="bold" />
                  <span>Khóa học đăng ký</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Chọn khóa học *
                  </label>
                  {coursesLoading ? (
                    <div className="text-xs text-on-surface-variant py-2 flex items-center gap-1.5">
                      <SpinnerGap size={14} className="animate-spin text-primary" />
                      <span>Đang tải danh sách khóa học...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs font-semibold text-on-surface focus:border-primary outline-none transition cursor-pointer"
                    >
                      {coursesSummary.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} {c.tuitionAmount ? `(${formatVnd(c.tuitionAmount)})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Học phí thu (VNĐ) *
                    </label>
                    <input
                      type="number"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      min="0"
                      step="1000"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs font-bold text-primary focus:border-primary outline-none transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Hạn thanh toán
                    </label>
                    <select
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none transition cursor-pointer"
                    >
                      <option value={24}>24 giờ (1 ngày)</option>
                      <option value={48}>48 giờ (2 ngày)</option>
                      <option value={72}>72 giờ (3 ngày)</option>
                      <option value={168}>7 ngày</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Student Information (For Enrollment & Account Activation) */}
              <div className="space-y-3 p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/30">
                <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-primary" weight="bold" />
                    <span>Thông tin học viên (Ghi danh khóa học)</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-normal">
                    Dùng tạo tài khoản &amp; kích hoạt bài giảng
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Họ và tên học viên *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs font-semibold text-on-surface focus:border-primary outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Email học viên (Kích hoạt khóa học) *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hocvien@gmail.com"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Số điện thoại học viên
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none transition"
                    />
                  </div>
                </div>

                {buyerType === "PERSONAL" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Địa chỉ người mua / học viên
                    </label>
                    <input
                      type="text"
                      value={invoiceAddress}
                      onChange={(e) => setInvoiceAddress(e.target.value)}
                      placeholder="VD: 123 Đường Tôn Đức Thắng, Liên Chiểu, TP. Đà Nẵng"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none transition"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: E-Invoice Options */}
              <div className="space-y-3 p-3.5 rounded-xl border border-primary/25 bg-primary/5">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invoiceRequired}
                      onChange={(e) => setInvoiceRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">
                      Tự động phát hành HĐĐT qua SePay sau khi thanh toán thành công
                    </span>
                  </label>
                  <div className="text-[11px] text-on-surface-variant/85 pl-6 flex items-center gap-1">
                    <Info size={13} className="text-primary shrink-0" />
                    <span>Hóa đơn chỉ được phát hành sau khi hệ thống xác nhận thanh toán thành công.</span>
                  </div>
                </div>

                {invoiceRequired && (
                  <div className="space-y-3 pt-2 border-t border-primary/15">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1.5">
                        Đối tượng nhận hóa đơn:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBuyerType("PERSONAL")}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                            buyerType === "PERSONAL"
                              ? "border-primary bg-primary text-on-primary shadow-2xs"
                              : "border-outline-variant/40 bg-surface text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          Cá nhân học viên (B2C)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyerType("BUSINESS")}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                            buyerType === "BUSINESS"
                              ? "border-primary bg-primary text-on-primary shadow-2xs"
                              : "border-outline-variant/40 bg-surface text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          Doanh nghiệp / Đơn vị (B2B)
                        </button>
                      </div>
                    </div>

                    {buyerType === "BUSINESS" && (
                      <div className="space-y-2.5 p-3 rounded-xl bg-surface border border-outline-variant/30">
                        <div className="text-[11px] font-bold text-on-surface flex items-center gap-1.5 pb-1 border-b border-outline-variant/15">
                          <Buildings size={14} className="text-primary" weight="bold" />
                          <span>Thông tin doanh nghiệp / đơn vị (Tách biệt với học viên)</span>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-on-surface mb-1">
                            Tên đơn vị / Doanh nghiệp *
                          </label>
                          <input
                            type="text"
                            value={invoiceCompanyName}
                            onChange={(e) => setInvoiceCompanyName(e.target.value)}
                            placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVA..."
                            required={buyerType === "BUSINESS"}
                            className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-bold text-on-surface mb-1">
                              Mã số thuế Doanh nghiệp (MST) *
                            </label>
                            <input
                              type="text"
                              value={invoiceTaxCode}
                              onChange={(e) => setInvoiceTaxCode(e.target.value)}
                              placeholder="0101234567"
                              required={buyerType === "BUSINESS"}
                              className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs font-mono font-bold text-on-surface focus:border-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-bold text-on-surface mb-1">
                              Email nhận hóa đơn *
                            </label>
                            <input
                              type="email"
                              value={invoiceEmail}
                              onChange={(e) => setInvoiceEmail(e.target.value)}
                              placeholder="ketoan@doanhnghiep.vn"
                              required={buyerType === "BUSINESS"}
                              className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-on-surface mb-1">
                            Địa chỉ doanh nghiệp *
                          </label>
                          <input
                            type="text"
                            value={invoiceAddress}
                            onChange={(e) => setInvoiceAddress(e.target.value)}
                            placeholder="VD: Số 45 Tòa nhà Center, Q. Cầu Giấy, Hà Nội"
                            required={buyerType === "BUSINESS"}
                            className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] font-semibold text-on-surface-variant mb-1">
                              Người liên hệ đại diện (Tùy chọn)
                            </label>
                            <input
                              type="text"
                              value={contactPerson}
                              onChange={(e) => setContactPerson(e.target.value)}
                              placeholder="VD: Nguyễn Văn Phụ Trách"
                              className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-semibold text-on-surface-variant mb-1">
                              SĐT liên hệ đại diện
                            </label>
                            <input
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder="0987654321"
                              className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Counselor Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Ghi chú tư vấn (Counselor Notes)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Tư vấn viên @HoangLong - Tặng tài liệu Speaking..."
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:border-primary outline-none transition"
                />
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom of left column */}
            <div className="pt-3 sticky bottom-0 bg-surface/95 backdrop-blur-xs pb-1 border-t border-outline-variant/20 shrink-0 z-10 flex flex-col gap-2 mt-auto">
              {(validationError || errorMessage) && (
                <div className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
                  <WarningCircle size={16} weight="bold" className="shrink-0" />
                  <span>{validationError || errorMessage}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2.5">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <SpinnerGap size={15} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={15} weight="bold" />
                  )}
                  <span>{isSubmitting ? "Đang tạo đơn..." : "⚡ Hoàn tất & Sinh QR động"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: INVOICE PREVIEW (BẢN XEM TRƯỚC HÓA ĐƠN BÁN HÀNG) (7/12) */}
        <div className="lg:col-span-7 h-full min-h-0 p-3 sm:p-5 bg-slate-200/70 dark:bg-slate-950 overflow-y-auto flex flex-col items-center justify-start">
          {/* Status Banner */}
          <div className="w-full max-w-[760px] flex items-center justify-between mb-2 text-xs px-1 shrink-0">
            <div className="flex items-center gap-2 font-bold text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                BẢN XEM TRƯỚC HÓA ĐƠN BÁN HÀNG
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                CHƯA PHÁT HÀNH
              </span>
            </div>
            <div className="font-mono text-[10.5px] text-on-surface-variant">
              Ký hiệu dự kiến: <b>{invoiceSeries || "Chưa cấu hình"}</b> &bull; Mẫu số: <b>{templateCode || "Chưa cấu hình"}</b>
            </div>
          </div>

          {/* REAL PAPER CANVAS: Strict PREVIEW Representation */}
          <div className="w-full max-w-[760px] overflow-x-auto [scrollbar-width:none]">
            <div className="relative bg-white text-slate-900 border-2 border-[#0284c7] rounded shadow-lg p-5 font-invoice text-[10px] leading-tight mx-auto min-w-[700px] select-text">
              {/* Draft Watermark (Non-obstructive) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-20 overflow-hidden">
                <div className="transform -rotate-25 text-center border-4 border-dashed border-rose-500/20 bg-rose-500/[0.03] px-8 py-5 rounded-2xl">
                  <div className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-rose-600/20 font-sans">
                    {isSandbox ? "SANDBOX — CHƯA PHÁT HÀNH" : "CHƯA PHÁT HÀNH"}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-500/25 mt-1 font-sans">
                    BẢN NHÁP &bull; KHÔNG CÓ GIÁ TRỊ PHÁT HÀNH
                  </div>
                </div>
              </div>

              {/* Decorative Blue Inner Frame */}
              <div className="relative z-10 border border-[#38bdf8]/60 p-3.5 space-y-2.5 bg-white/95">
                {/* 1. Header Grid: Title Centered + Top-Right Metadata & Placeholder QR */}
                <div className="flex items-start justify-between border-b border-slate-300 pb-2">
                  <div className="w-24"></div>

                  {/* Main Centered Title */}
                  <div className="flex-1 text-center">
                    <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#c52828]">
                      HÓA ĐƠN BÁN HÀNG
                    </h3>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      (Bản xem trước — Hóa đơn chưa phát hành)
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-1">
                      Ngày dự kiến: Ngày {dateDisplay.day} tháng {dateDisplay.month} năm {dateDisplay.year}
                    </div>
                  </div>

                  {/* Top-Right Metadata & Placeholder QR (No fake official QR!) */}
                  <div className="flex items-start gap-2.5 shrink-0 text-right">
                    <div className="text-[9.5px] space-y-0.5">
                      <div>
                        <span className="text-slate-500">Ký hiệu dự kiến: </span>
                        <b className="font-mono font-bold text-slate-900">{invoiceSeries || "Chưa cấu hình"}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Mẫu số dự kiến: </span>
                        <b className="font-mono font-bold text-slate-900">{templateCode || "Chưa cấu hình"}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Số: </span>
                        <span className="text-slate-400 italic font-medium">(Sẽ cấp khi phát hành)</span>
                      </div>
                    </div>

                    {/* Dashed QR Placeholder */}
                    <div className="w-14 h-14 border border-dashed border-slate-300 rounded p-1 bg-slate-50 flex flex-col items-center justify-center text-center text-[7px] text-slate-400 leading-tight shrink-0 select-none">
                      <span className="font-semibold text-slate-500">Mã QR CQT</span>
                      <span className="text-[6.5px] italic text-slate-400 mt-0.5">(Sẽ tạo khi phát hành)</span>
                    </div>
                  </div>
                </div>

                {/* 2. CQT Code Line (No fake CQT code!) */}
                <div className="text-[9.5px] border-b border-slate-300 pb-1.5 flex items-center justify-between">
                  <div>
                    <span>Mã CQT : </span>
                    <span className="text-slate-400 italic font-sans">
                      (Chưa cấp — Cơ quan Thuế sẽ cấp mã sau khi xác nhận thanh toán)
                    </span>
                  </div>
                  <span className="text-[8.5px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-sans font-semibold border border-amber-300/50">
                    Chưa phát hành
                  </span>
                </div>

                {/* 3. Seller Info (Real Business Entity) */}
                <div className="text-[9.5px] space-y-0.5 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-slate-600">Đơn vị bán hàng: </span>
                    <strong className="text-slate-900 uppercase">
                      {settings.sellerName || "HỘ KINH DOANH LUYỆN NÓI"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Mã số thuế: </span>
                    <b className="font-mono text-slate-900">{settings.sellerTaxCode || "052098014618"}</b>
                  </div>
                  <div>
                    <span className="text-slate-600">Địa chỉ: </span>
                    <span>{settings.sellerAddress || "Đường Tôn Đức Thắng, P. Hoà Khánh, TP. Đà Nẵng, Việt Nam"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6">
                    <div>
                      <span className="text-slate-600">Điện thoại: </span>
                      <span>{settings.sellerPhone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Số tài khoản: </span>
                      <span className="font-mono">{settings.sepayAccountNumber ? `${settings.sepayAccountNumber} (${settings.sepayBankName || ""})` : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Buyer Info (Realtime from form) */}
                <div className="text-[9.5px] space-y-0.5 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-slate-600">Họ tên người mua hàng: </span>
                    <span className="font-semibold text-slate-900">
                      {buyerType === "BUSINESS"
                        ? (contactPerson.trim() || fullName.trim() || "—")
                        : (fullName.trim() || "(Họ tên học viên)")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Tên đơn vị: </span>
                    <span className="font-semibold text-slate-900">
                      {buyerType === "BUSINESS"
                        ? (invoiceCompanyName.trim() || "(Chưa nhập tên đơn vị)")
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Địa chỉ: </span>
                    <span>{invoiceAddress.trim() || (buyerType === "BUSINESS" ? "(Địa chỉ đơn vị)" : "(Địa chỉ học viên)")}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Mã số thuế: </span>
                    {buyerType === "BUSINESS" && invoiceTaxCode.trim() ? (
                      <b className="font-mono font-bold">{invoiceTaxCode.trim()}</b>
                    ) : (
                      <span className="text-slate-500 italic font-sans">
                        {buyerType === "BUSINESS" ? "(Mã số thuế)" : "—"}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">Email nhận HĐĐT: </span>
                    {(buyerType === "BUSINESS" ? invoiceEmail.trim() : email.trim()) ? (
                      <span className="font-mono">
                        {buyerType === "BUSINESS" ? (invoiceEmail.trim() || email.trim()) : email.trim()}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic font-sans">
                        {buyerType === "BUSINESS" ? "(Email nhận HĐ)" : "(Email học viên)"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-600">Hình thức thanh toán: </span>
                      <b>CK (VietQR Napas247)</b>
                    </div>
                    <div>
                      <span className="text-slate-600">Đơn vị tiền tệ: </span>
                      <b>VND</b>
                    </div>
                    <div>
                      <span className="text-slate-600">Tỷ giá: </span>
                      <b>1 VNĐ</b>
                    </div>
                  </div>
                </div>

                {/* 5. Clean 6-Column Table */}
                <table className="w-full border-collapse border border-slate-400 text-[9px] my-1.5 leading-normal">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 text-center font-bold">
                      <th className="border border-slate-400 px-1 py-1 w-8">STT</th>
                      <th className="border border-slate-400 px-2 py-1 text-left">Tên hàng hóa, dịch vụ</th>
                      <th className="border border-slate-400 px-1.5 py-1 w-16">Đơn vị tính</th>
                      <th className="border border-slate-400 px-1.5 py-1 w-14">Số lượng</th>
                      <th className="border border-slate-400 px-2 py-1 text-right w-24">Đơn giá</th>
                      <th className="border border-slate-400 px-2 py-1 text-right w-28">Thành tiền</th>
                    </tr>
                    {/* Formula Row */}
                    <tr className="text-center text-[8px] text-slate-500 font-normal">
                      <th className="border border-slate-400 py-0.5">1</th>
                      <th className="border border-slate-400 py-0.5">2</th>
                      <th className="border border-slate-400 py-0.5">3</th>
                      <th className="border border-slate-400 py-0.5">4</th>
                      <th className="border border-slate-400 py-0.5">5</th>
                      <th className="border border-slate-400 py-0.5">6 = 4 x 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 px-1 py-1.5 text-center font-bold">1</td>
                      <td className="border border-slate-400 px-2 py-1.5 text-slate-900 font-medium">
                        Đóng học phí đào tạo IELTS
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-center">Khóa</td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-center font-bold">1</td>
                      <td className="border border-slate-400 px-2 py-1.5 text-right tabular-nums">
                        {finalAmount.toLocaleString("vi-VN")}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 text-right font-bold text-slate-900 tabular-nums">
                        {finalAmount.toLocaleString("vi-VN")}
                      </td>
                    </tr>

                    {/* Empty decorative rows like real paper */}
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="h-5">
                        <td className="border border-slate-400"></td>
                        <td className="border border-slate-400"></td>
                        <td className="border border-slate-400"></td>
                        <td className="border border-slate-400"></td>
                        <td className="border border-slate-400"></td>
                        <td className="border border-slate-400"></td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={5} className="border border-slate-400 px-2 py-1.5 text-left">
                        Tổng cộng
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 text-right tabular-nums text-slate-900">
                        {finalAmount.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 6. Money in Words */}
                <div className="text-[9.5px] pt-1">
                  <span className="font-bold text-slate-800">Số tiền viết bằng chữ: </span>
                  <span className="italic font-medium text-slate-900">
                    {formatVietnameseMoneyWords(finalAmount)}.
                  </span>
                </div>

                {/* 7. Signatures (Strictly NO fake signature or green tick!) */}
                <div className="grid grid-cols-2 gap-4 pt-4 text-[9.5px]">
                  <div className="text-center">
                    <div className="font-bold text-slate-900">Người mua hàng</div>
                    <div className="text-[8px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="font-bold text-slate-900">Người bán hàng</div>

                    {/* Pending Signature Box */}
                    <div className="mt-1.5 border border-dashed border-slate-300 rounded p-2 text-center bg-slate-50 text-slate-600 text-[8.5px] w-56 relative font-sans">
                      <div className="font-bold text-slate-800">Chữ ký số Người bán</div>
                      <div className="text-[8px] text-amber-700 font-medium mt-0.5">
                        (Sẽ tự động ký số bằng chứng thư số khi SePay phát hành hóa đơn)
                      </div>
                      <div className="text-[8px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Trạng thái: Chưa ký số</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. Footer Legal Notice */}
                <div className="border-t border-slate-200 pt-2 mt-4 text-center text-[8px] text-slate-500 space-y-0.5">
                  <div className="italic">
                    (Cần kiểm tra, đối chiếu thông tin trước khi hoàn tất tạo đơn và chuyển khoản)
                  </div>
                  <div>
                    Cổng tra cứu hóa đơn dự kiến: <span className="text-blue-600">https://sepay.vn/tra-cuu-hoa-don-dien-tu</span>
                  </div>
                  <div>
                    Mã tra cứu: <span className="text-slate-400 italic font-sans">(Sẽ được cấp sau khi phát hành chính thức)</span>
                  </div>
                  <div className="text-[7.5px] text-slate-400 pt-1">
                    Bản xem trước &bull; Trang 1/1
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Helper Notice */}
          <div className="w-full max-w-[760px] mt-2.5 p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-[11px] text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Hóa đơn chính thức chỉ được phát hành sau khi hệ thống xác nhận thanh toán thành công.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
