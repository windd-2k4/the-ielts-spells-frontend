import {
  ArrowClockwise,
  ArrowSquareOut,
  ArrowsDownUp,
  Bank,
  CalendarBlank,
  CaretDown,
  ChatCircleText,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  DownloadSimple,
  Eye,
  EyeSlash,
  FileText,
  Funnel,
  GearSix,
  IdentificationCard,
  MagnifyingGlass,
  Plus,
  Receipt,
  ShareNetwork,
  ShieldCheck,
  SpinnerGap,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../AdminUi";
import { apiFetch } from "../../lib/api";

export interface InvoiceStatsDto {
  totalCount: number;
  issuedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  totalInvoicedAmount: number;
}

export interface CourseSummaryDto {
  id: string;
  code: string;
  name: string;
  tuitionAmount?: number;
  level?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderCode: string;
  courseId: string;
  courseName: string;
  amount: number;
  status: string;
  qrCodeUrl: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  transferContent: string;
  expiresAt: string;
}

export interface OrderAdminDto {
  id: string;
  orderCode: string;
  courseId: string;
  courseTitle?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  expiresAt: string;
  paidAt?: string;
  invoiceRequired: boolean;
  buyerType: "PERSONAL" | "BUSINESS";
  invoiceCompanyName?: string;
  invoiceTaxCode?: string;
  invoiceAddress?: string;
  invoiceEmail?: string;
  invoiceStatus?: "PENDING_ISSUE" | "ISSUING" | "ISSUED" | "FAILED" | "CANCELLED";
  invoiceNumber?: string;
  invoiceTemplate?: string;
  cqtCode?: string;
  lookupUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface InvoiceAdminDto {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  buyerType: "PERSONAL" | "BUSINESS";
  invoiceCompanyName?: string;
  invoiceTaxCode?: string;
  invoiceTemplate?: string;
  invoiceNumber?: string;
  cqtCode?: string;
  lookupCode?: string;
  lookupUrl?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  status: "PENDING_ISSUE" | "ISSUING" | "ISSUED" | "FAILED" | "CANCELLED";
  retryCount: number;
  errorLog?: string;
  issuedAt?: string;
  createdAt: string;
}

export interface ReconciliationDto {
  id: string;
  gateway: string;
  sepayTransactionId: string;
  orderId?: string;
  orderCode?: string;
  amountIn: number;
  accumulatedAmount?: number;
  transferContent?: string;
  bankBrandName?: string;
  accountNumber?: string;
  status: "SUCCESS" | "UNDERPAID" | "OVERPAID" | "UNMATCHED" | "REFUNDED";
  reconciliationNote?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}

export interface BillingSettingsDto {
  sepayApiKey?: string;
  sepayWebhookSecret?: string;
  sepayAccountNumber?: string;
  sepayBankName?: string;
  sellerName?: string;
  sellerTaxCode?: string;
  sellerAddress?: string;
  einvoiceTemplateCode?: string;
  einvoiceSeries?: string;
  vatRatePercentage?: number;
  autoIssueInvoice?: boolean;
  isSandbox?: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface FilterDropdownProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  align?: "left" | "right";
}

function FilterDropdown({
  icon,
  label,
  value,
  onChange,
  options,
  align = "left",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition shadow-2xs select-none cursor-pointer ${
          isOpen
            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs"
            : "border-outline-variant/40 bg-surface text-on-surface hover:border-outline hover:bg-surface-container-low"
        }`}
      >
        <span className="text-primary shrink-0 flex items-center">{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={`shrink-0 ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : "text-on-surface-variant/70"
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1.5 min-w-[210px] w-max max-w-[320px] rounded-2xl border border-outline-variant/30 bg-surface/95 backdrop-blur-md p-1.5 shadow-xl shadow-black/15 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "origin-top-right" : "origin-top-left"
          }`}
        >
          <div className="space-y-0.5 max-h-72 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-primary/12 text-primary font-bold"
                      : "text-on-surface hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check size={14} weight="bold" className="text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { value: "THIS_MONTH", label: "Tháng này" },
  { value: "LAST_MONTH", label: "Tháng trước" },
  { value: "THIS_QUARTER", label: "Quý này" },
  { value: "ALL", label: "Tất cả thời gian" },
  { value: "CUSTOM", label: "Tùy chọn ngày..." },
];

export function BillingWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "orders";

  // Tab 1: Orders State
  const [orders, setOrders] = useState<OrderAdminDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersPageSize, setOrdersPageSize] = useState(25);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderPeriod, setOrderPeriod] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM">("THIS_MONTH");
  const [orderFromDate, setOrderFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [orderToDate, setOrderToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [selectedOrder, setSelectedOrder] = useState<OrderAdminDto | null>(null);

  // Modal: Tạo đơn tư vấn Zalo / VietQR
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [coursesSummary, setCoursesSummary] = useState<CourseSummaryDto[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [createOrderForm, setCreateOrderForm] = useState({
    courseId: "",
    fullName: "",
    email: "",
    phone: "",
    amount: "",
    expiresInHours: 48,
    notes: "",
  });
  const [createOrderSubmitting, setCreateOrderSubmitting] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<CheckoutResponse | null>(null);

  // Tab 2: Invoices Enhanced State (Dành cho quy mô 200-300+ HĐ/tháng)
  const [invoices, setInvoices] = useState<InvoiceAdminDto[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesTotalCount, setInvoicesTotalCount] = useState(0);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(0);
  const [invoicePageSize, setInvoicePageSize] = useState(25);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL");
  const [invoicePeriod, setInvoicePeriod] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM">("THIS_MONTH");
  const [invoiceFromDate, setInvoiceFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [invoiceToDate, setInvoiceToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStatsDto | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceAdminDto | null>(null);
  const [isExportingInvoices, setIsExportingInvoices] = useState(false);
  const [cancellingInvoiceId, setCancellingInvoiceId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [retryingInvoiceId, setRetryingInvoiceId] = useState<string | null>(null);

  // Tab 3: Reconciliation State
  const [transactions, setTransactions] = useState<ReconciliationDto[]>([]);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [reconciliationTotalCount, setReconciliationTotalCount] = useState(0);
  const [reconciliationTotalPages, setReconciliationTotalPages] = useState(1);
  const [reconciliationPage, setReconciliationPage] = useState(0);
  const [reconciliationPageSize, setReconciliationPageSize] = useState(25);
  const [reconciliationSearchQuery, setReconciliationSearchQuery] = useState("");
  const [reconciliationStatusFilter, setReconciliationStatusFilter] = useState("ALL");
  const [reconciliationPeriod, setReconciliationPeriod] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM">("THIS_MONTH");
  const [reconciliationFromDate, setReconciliationFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [reconciliationToDate, setReconciliationToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [matchingTx, setMatchingTx] = useState<ReconciliationDto | null>(null);
  const [manualOrderCode, setManualOrderCode] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  // Tab 4: Settings State
  const [settings, setSettings] = useState<BillingSettingsDto>({
    sepayAccountNumber: "0987654321",
    sepayBankName: "MBBank",
    sellerName: "THE IELTS SPELLS VIETNAM",
    sellerTaxCode: "052098014618",
    sellerAddress: "Tôn Đức Thắng, Liên Chiểu, TP. Đà Nẵng",
    einvoiceTemplateCode: "2C26TLN",
    einvoiceSeries: "C26TLN",
    vatRatePercentage: 0,
    autoIssueInvoice: true,
    isSandbox: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Global Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const changeTab = (tabKey: string) => {
    setSearchParams({ tab: tabKey });
    setFeedback(null);
  };

  const getPeriodLabel = (period: string) => {
    return PERIOD_OPTIONS.find((o) => o.value === period)?.label || "Kỳ thời gian";
  };

  const orderStatusOptions = useMemo(() => [
    { value: "ALL", label: `Tất cả trạng thái ${ordersTotalCount ? `(${ordersTotalCount})` : ""}` },
    { value: "PAID", label: "Đã thanh toán (PAID)" },
    { value: "PENDING_PAYMENT", label: "Chờ thanh toán (PENDING)" },
    { value: "EXPIRED", label: "Đã quá hạn (EXPIRED)" },
    { value: "CANCELLED", label: "Đã hủy (CANCELLED)" },
  ], [ordersTotalCount]);

  const currentOrderStatusLabel = useMemo(() => {
    return orderStatusOptions.find((o) => o.value === orderStatusFilter)?.label || "Trạng thái";
  }, [orderStatusOptions, orderStatusFilter]);

  const invoiceStatusOptions = useMemo(() => [
    { value: "ALL", label: `Tất cả trạng thái ${invoiceStats ? `(${invoiceStats.totalCount})` : ""}` },
    { value: "ISSUED", label: `Đã cấp mã CQT ${invoiceStats ? `(${invoiceStats.issuedCount})` : ""}` },
    { value: "PENDING_ISSUE", label: `Chờ phát hành ${invoiceStats ? `(${invoiceStats.pendingCount})` : ""}` },
    { value: "FAILED", label: `Lỗi phát hành ${invoiceStats ? `(${invoiceStats.failedCount})` : ""}` },
    { value: "CANCELLED", label: `Đã hủy ${invoiceStats ? `(${invoiceStats.cancelledCount})` : ""}` },
  ], [invoiceStats]);

  const currentInvoiceStatusLabel = useMemo(() => {
    return invoiceStatusOptions.find((o) => o.value === invoiceStatusFilter)?.label || "Trạng thái";
  }, [invoiceStatusOptions, invoiceStatusFilter]);

  const reconciliationStatusOptions = useMemo(() => [
    { value: "ALL", label: `Tất cả giao dịch ${reconciliationTotalCount ? `(${reconciliationTotalCount})` : ""}` },
    { value: "SUCCESS", label: "Khớp tự động (SUCCESS)" },
    { value: "UNMATCHED", label: "Cần đối soát (UNMATCHED)" },
    { value: "UNDERPAID", label: "Chuyển thiếu (UNDERPAID)" },
  ], [reconciliationTotalCount]);

  const currentReconciliationStatusLabel = useMemo(() => {
    return reconciliationStatusOptions.find((o) => o.value === reconciliationStatusFilter)?.label || "Trạng thái";
  }, [reconciliationStatusOptions, reconciliationStatusFilter]);

  // 1. Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", ordersPage.toString());
      params.set("size", ordersPageSize.toString());
      if (orderStatusFilter !== "ALL") params.set("status", orderStatusFilter);
      if (orderSearchQuery.trim()) params.set("q", orderSearchQuery.trim());
      if (orderFromDate) params.set("fromDate", orderFromDate);
      if (orderToDate) params.set("toDate", orderToDate);

      const res = await apiFetch<PageResponse<OrderAdminDto>>(`/admin/billing/orders?${params.toString()}`);
      setOrders(res.content || []);
      setOrdersTotalCount(res.totalElements || 0);
      setOrdersTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không tải được danh sách đơn hàng";
      setFeedback({ type: "error", text: msg });
    } finally {
      setOrdersLoading(false);
    }
  };

  const calculatePeriodRange = (period: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM") => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (period === "THIS_MONTH") {
      const firstDay = `${year}-${pad(month + 1)}-01`;
      const lastDayObj = new Date(year, month + 1, 0);
      const lastDay = `${year}-${pad(month + 1)}-${pad(lastDayObj.getDate())}`;
      return { from: firstDay, to: lastDay };
    } else if (period === "LAST_MONTH") {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const firstDay = `${prevYear}-${pad(prevMonth + 1)}-01`;
      const lastDayObj = new Date(prevYear, prevMonth + 1, 0);
      const lastDay = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDayObj.getDate())}`;
      return { from: firstDay, to: lastDay };
    } else if (period === "THIS_QUARTER") {
      const qStartMonth = Math.floor(month / 3) * 3;
      const firstDay = `${year}-${pad(qStartMonth + 1)}-01`;
      const lastDayObj = new Date(year, qStartMonth + 3, 0);
      const lastDay = `${lastDayObj.getFullYear()}-${pad(lastDayObj.getMonth() + 1)}-${pad(lastDayObj.getDate())}`;
      return { from: firstDay, to: lastDay };
    } else if (period === "ALL") {
      return { from: "", to: "" };
    }
    return null;
  };

  const applyOrderPeriod = (period: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM") => {
    setOrderPeriod(period);
    setOrdersPage(0);
    const range = calculatePeriodRange(period);
    if (range) {
      setOrderFromDate(range.from);
      setOrderToDate(range.to);
    }
  };

  const applyInvoicePeriod = (period: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM") => {
    setInvoicePeriod(period);
    setInvoicesPage(0);
    const range = calculatePeriodRange(period);
    if (range) {
      setInvoiceFromDate(range.from);
      setInvoiceToDate(range.to);
    }
  };

  const applyReconciliationPeriod = (period: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM") => {
    setReconciliationPeriod(period);
    setReconciliationPage(0);
    const range = calculatePeriodRange(period);
    if (range) {
      setReconciliationFromDate(range.from);
      setReconciliationToDate(range.to);
    }
  };

  // 2. Fetch Invoices & Stats
  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", invoicesPage.toString());
      params.set("size", invoicePageSize.toString());
      if (invoiceStatusFilter !== "ALL") params.set("status", invoiceStatusFilter);
      if (invoiceSearchQuery.trim()) params.set("q", invoiceSearchQuery.trim());
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);

      const res = await apiFetch<PageResponse<InvoiceAdminDto>>(`/admin/billing/invoices?${params.toString()}`);
      setInvoices(res.content || []);
      setInvoicesTotalCount(res.totalElements || 0);
      setInvoicesTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không tải được danh sách hóa đơn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchInvoiceStats = async () => {
    try {
      const params = new URLSearchParams();
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);
      const res = await apiFetch<InvoiceStatsDto>(`/admin/billing/invoices/stats?${params.toString()}`);
      setInvoiceStats(res);
    } catch (err: unknown) {
      console.error("Lỗi tải thống kê HĐĐT:", err);
    }
  };

  const handleExportInvoicesCsv = async () => {
    setIsExportingInvoices(true);
    try {
      const params = new URLSearchParams();
      if (invoiceStatusFilter !== "ALL") params.set("status", invoiceStatusFilter);
      if (invoiceSearchQuery.trim()) params.set("q", invoiceSearchQuery.trim());
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);

      const items = await apiFetch<InvoiceAdminDto[]>(`/admin/billing/invoices/export?${params.toString()}`);
      if (!items || items.length === 0) {
        setFeedback({ type: "info", text: "Không có hóa đơn nào trong kỳ để xuất bảng kê." });
        return;
      }

      const headers = [
        "STT",
        "Mẫu số HĐ",
        "Số hóa đơn",
        "Ngày lập",
        "Mã Cơ quan Thuế",
        "Mã đơn hàng",
        "Người mua / Học viên",
        "Email nhận HĐ",
        "Mã số thuế",
        "Tên doanh nghiệp",
        "Doanh thu (VNĐ)",
        "Trạng thái",
        "Link tra cứu SePay eInvoice"
      ];

      const escapeCsv = (val?: string | number | null) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const rows = items.map((inv, idx) => [
        idx + 1,
        escapeCsv(inv.invoiceTemplate || "2C26TLN"),
        escapeCsv(inv.invoiceNumber ? `'${inv.invoiceNumber}` : "Chờ cấp"),
        escapeCsv(inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("vi-VN") : "--"),
        escapeCsv(inv.cqtCode ? `'${inv.cqtCode}` : "Chưa có"),
        escapeCsv(inv.orderCode),
        escapeCsv(inv.customerName),
        escapeCsv(inv.customerEmail),
        escapeCsv(inv.invoiceTaxCode ? `'${inv.invoiceTaxCode}` : ""),
        escapeCsv(inv.invoiceCompanyName || ""),
        inv.amount || 0,
        escapeCsv(inv.status === "ISSUED" ? "Đã cấp mã CQT" : inv.status === "FAILED" ? "Lỗi phát hành" : inv.status === "CANCELLED" ? "Đã hủy" : "Chờ cấp mã"),
        escapeCsv(inv.lookupUrl || "")
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Bang_Ke_Hoa_Don_Dien_Tu_${invoicePeriod}_${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ type: "success", text: `Đã xuất bảng kê ${items.length} hóa đơn điện tử thành công!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xuất bảng kê";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsExportingInvoices(false);
    }
  };

  // 3. Fetch Reconciliation
  const fetchReconciliation = async () => {
    setReconciliationLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", reconciliationPage.toString());
      params.set("size", reconciliationPageSize.toString());
      if (reconciliationStatusFilter !== "ALL") params.set("status", reconciliationStatusFilter);
      if (reconciliationSearchQuery.trim()) params.set("q", reconciliationSearchQuery.trim());
      if (reconciliationFromDate) params.set("fromDate", reconciliationFromDate);
      if (reconciliationToDate) params.set("toDate", reconciliationToDate);

      const res = await apiFetch<PageResponse<ReconciliationDto>>(`/admin/billing/reconciliation?${params.toString()}`);
      setTransactions(res.content || []);
      setReconciliationTotalCount(res.totalElements || 0);
      setReconciliationTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không tải được dữ liệu đối soát";
      setFeedback({ type: "error", text: msg });
    } finally {
      setReconciliationLoading(false);
    }
  };

  // 4. Fetch Settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await apiFetch<BillingSettingsDto>("/admin/billing/settings");
      if (res && (res.sellerName || res.sepayAccountNumber)) {
        setSettings(res);
      }
    } catch {
      // Use defaults if settings table not yet populated
    } finally {
      setSettingsLoading(false);
    }
  };

  // Effects for tab changes
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "invoices") {
      fetchInvoices();
      fetchInvoiceStats();
    } else if (activeTab === "reconciliation") {
      fetchReconciliation();
    } else if (activeTab === "settings") {
      fetchSettings();
    }
  }, [
    activeTab,
    ordersPage,
    ordersPageSize,
    orderFromDate,
    orderToDate,
    invoicesPage,
    invoicePageSize,
    invoiceFromDate,
    invoiceToDate,
    reconciliationPage,
    reconciliationPageSize,
    reconciliationFromDate,
    reconciliationToDate,
    orderStatusFilter,
    invoiceStatusFilter,
    reconciliationStatusFilter
  ]);

  // Overall KPIs
  const totalPaidRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [orders]);

  const paidOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "PAID").length;
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "PENDING_PAYMENT").length;
  }, [orders]);

  // Action Handlers
  const handleRefreshAll = () => {
    if (activeTab === "orders") fetchOrders();
    else if (activeTab === "invoices") fetchInvoices();
    else if (activeTab === "reconciliation") fetchReconciliation();
    else if (activeTab === "settings") fetchSettings();
    setFeedback({ type: "info", text: "Đã làm mới dữ liệu mới nhất từ hệ thống." });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchCoursesSummary = async () => {
    setCoursesLoading(true);
    try {
      const res = await apiFetch<CourseSummaryDto[]>("/admin/billing/courses-summary");
      setCoursesSummary(res || []);
      if (res && res.length > 0) {
        setCreateOrderForm((prev) => ({
          ...prev,
          courseId: prev.courseId || res[0].id,
          amount: prev.amount || (res[0].tuitionAmount ? res[0].tuitionAmount.toString() : ""),
        }));
      }
    } catch (err: unknown) {
      console.error("Không tải được danh sách khóa học:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrderForm.courseId || !createOrderForm.fullName.trim() || !createOrderForm.email.trim()) {
      setFeedback({ type: "error", text: "Vui lòng chọn khóa học và nhập đầy đủ họ tên, email học viên." });
      return;
    }

    setCreateOrderSubmitting(true);
    try {
      const payload = {
        courseId: createOrderForm.courseId,
        fullName: createOrderForm.fullName.trim(),
        email: createOrderForm.email.trim(),
        phone: createOrderForm.phone.trim() || undefined,
        amount: createOrderForm.amount ? parseFloat(createOrderForm.amount) : undefined,
        expiresInHours: createOrderForm.expiresInHours || 48,
        notes: createOrderForm.notes.trim() || undefined,
      };

      const res = await apiFetch<CheckoutResponse>("/admin/billing/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedOrderResult(res);
      setFeedback({ type: "success", text: `Đã tạo đơn ${res.orderCode}! Mã VietQR Napas247 đã sẵn sàng gửi học viên.` });
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng tư vấn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setCreateOrderSubmitting(false);
    }
  };

  const generateZaloMessage = (res: CheckoutResponse, studentName: string, studentEmail: string) => {
    return `Dạ chào bạn ${studentName || "bạn"}, The IELTS Spells gửi bạn thông tin đăng ký và chuyển khoản học phí khóa học "${res.courseName}":
- Số tiền thanh toán: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(res.amount)}
- Ngân hàng: ${res.bankName} (Ngân hàng Quân Đội)
- Số tài khoản: ${res.accountNumber}
- Chủ tài khoản: ${res.accountName}
- Nội dung chuyển khoản: ${res.orderCode}

(Bạn có thể mở app ngân hàng quét ảnh mã VietQR đính kèm để tự động điền đúng thông tin).
Sau khi chuyển khoản thành công, hệ thống sẽ tự động phát hành Hóa đơn điện tử có mã Cơ quan Thuế và gửi Đường link kích hoạt tài khoản vào email "${studentEmail}" để bạn vào học ngay ạ!`;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      await apiFetch(`/admin/billing/orders/${orderId}/cancel`, { method: "POST" });
      setFeedback({ type: "success", text: "Đã hủy đơn hàng thành công." });
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi hủy đơn";
      setFeedback({ type: "error", text: msg });
    }
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    if (!window.confirm("Xác nhận đã nhận đủ tiền mặt tại quầy và kích hoạt quyền học viên cho đơn này?")) return;
    try {
      await apiFetch(`/admin/billing/orders/${orderId}/confirm-cash`, { method: "POST" });
      setFeedback({ type: "success", text: "Đã xác nhận thu tiền mặt, kích hoạt khóa học và tiến hành xuất hóa đơn điện tử!" });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi xác nhận tiền mặt";
      setFeedback({ type: "error", text: msg });
    }
  };

  const handleRetryInvoice = async (invoiceId: string) => {
    setRetryingInvoiceId(invoiceId);
    try {
      await apiFetch(`/admin/billing/invoices/${invoiceId}/retry`, { method: "POST" });
      setFeedback({ type: "success", text: "Đã gửi lại yêu cầu cấp mã CQT thành công!" });
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi phát hành lại hóa đơn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setRetryingInvoiceId(null);
    }
  };

  const handleCancelInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingInvoiceId || !cancelReason.trim()) return;
    try {
      await apiFetch(`/admin/billing/invoices/${cancellingInvoiceId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setFeedback({ type: "success", text: "Đã hủy hóa đơn điện tử thành công." });
      setCancellingInvoiceId(null);
      setCancelReason("");
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi hủy hóa đơn";
      setFeedback({ type: "error", text: msg });
    }
  };

  const handleManualMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchingTx || !manualOrderCode.trim()) return;
    setIsMatching(true);
    try {
      await apiFetch(
        `/admin/billing/reconciliation/${matchingTx.id}/match?orderCode=${encodeURIComponent(
          manualOrderCode.trim()
        )}&note=${encodeURIComponent(manualNote.trim())}`,
        { method: "POST" }
      );
      setFeedback({ type: "success", text: `Đã khớp thành công giao dịch vào đơn hàng ${manualOrderCode.trim()}!` });
      setMatchingTx(null);
      setManualOrderCode("");
      setManualNote("");
      fetchReconciliation();
      if (activeTab === "orders") fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khớp đơn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsMatching(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await apiFetch("/admin/billing/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setFeedback({ type: "success", text: "Đã lưu cấu hình SePay và e-Invoice thành công!" });
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu cấu hình";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "ISSUED":
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Thành công
          </span>
        );
      case "PENDING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ chuyển khoản
          </span>
        );
      case "PENDING_ISSUE":
      case "ISSUING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Đang cấp mã CQT
          </span>
        );
      case "UNDERPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Thiếu tiền
          </span>
        );
      case "UNMATCHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Chưa khớp đơn
          </span>
        );
      case "CANCELLED":
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status === "EXPIRED" ? "Hết hạn" : "Đã hủy"}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Lỗi phát hành
          </span>
        );
      default:
        return <span className="text-xs font-medium text-on-surface-variant">{status}</span>;
    }
  };

  return (
    <section className="space-y-5">
      {/* 1. Standard Header */}
      <PageHeader
        eyebrow="Tài chính & Doanh thu"
        title="Quản lý Đơn hàng & Hóa đơn điện tử"
        description="Hệ thống thanh toán tự động VietQR qua SePay, đối soát dòng tiền và tự động phát hành HĐĐT có mã Cơ quan Thuế theo Nghị định 123/2020/NĐ-CP."
        action={
          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container-high text-xs md:text-sm font-bold text-on-surface transition shadow-2xs"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <ArrowClockwise size={16} className={ordersLoading || invoicesLoading || reconciliationLoading ? "animate-spin text-primary" : ""} />
            Làm mới
          </button>
        }
      />

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
              : feedback.type === "error"
              ? "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
              : "bg-sky-500/10 text-sky-800 dark:text-sky-200 border border-sky-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" && <CheckCircle size={18} className="shrink-0 text-emerald-600" />}
            {feedback.type === "error" && <WarningCircle size={18} className="shrink-0 text-rose-600" />}
            {feedback.type === "info" && <ShieldCheck size={18} className="shrink-0 text-sky-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-current/60 hover:text-current">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-[18px] border border-outline-variant/35 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>Doanh thu thực nhận</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Bank size={18} weight="bold" />
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-on-surface tabular-nums">
            {formatVnd(totalPaidRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-on-surface-variant">Từ {paidOrdersCount} đơn thanh toán thành công</div>
        </div>

        <div className="rounded-[18px] border border-outline-variant/35 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>Đơn hoàn tất (PAID)</span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <CheckCircle size={18} weight="bold" />
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-on-surface tabular-nums">
            {paidOrdersCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Đã cấp quyền khóa học</div>
        </div>

        <div className="rounded-[18px] border border-outline-variant/35 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>Chờ thanh toán</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock size={18} weight="bold" />
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-on-surface tabular-nums">
            {pendingOrdersCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-semibold">VietQR đang hoạt động</div>
        </div>

        <div className="rounded-[18px] border border-outline-variant/35 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>HĐĐT Cơ quan Thuế</span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
              <Receipt size={18} weight="bold" />
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-on-surface tabular-nums">
            {invoicesTotalCount}
          </div>
          <div className="mt-1 text-[11px] text-sky-600 font-semibold">Mẫu chuẩn 2C26TLN</div>
        </div>
      </div>

      {/* 3. Sleek Tab Navigation */}
      <nav className="flex border-b border-outline-variant/40 overflow-x-auto gap-1">
        <button
          onClick={() => changeTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/40 rounded-t-lg"
          }`}
        >
          <FileText size={17} />
          <span>Đơn hàng khóa học</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {ordersTotalCount}
          </span>
        </button>

        <button
          onClick={() => changeTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "invoices"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/40 rounded-t-lg"
          }`}
        >
          <Receipt size={17} />
          <span>Hóa đơn điện tử CQT</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {invoicesTotalCount}
          </span>
        </button>

        <button
          onClick={() => changeTab("reconciliation")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "reconciliation"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/40 rounded-t-lg"
          }`}
        >
          <ArrowsDownUp size={17} />
          <span>Đối soát Ngân hàng SePay</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {reconciliationTotalCount}
          </span>
        </button>

        <button
          onClick={() => changeTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/40 rounded-t-lg"
          }`}
        >
          <GearSix size={17} />
          <span>Cấu hình SePay & Thuế</span>
        </button>
      </nav>

      {/* ======================================================================= */}
      {/* TAB 1: ORDERS MANAGEMENT */}
      {/* ======================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-3.5">
          {/* ======================================================================= */}
          {/* 1. UNIFIED ACTION BAR FOR ORDERS */}
          {/* ======================================================================= */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOrdersPage(0);
                fetchOrders();
              }}
              className="relative flex-1 min-w-[240px]"
            >
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => {
                  setOrderSearchQuery(e.target.value);
                  setOrdersPage(0);
                }}
                placeholder="Tìm mã đơn (KH...), tên học viên, email, SĐT..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs md:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
              {orderSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderSearchQuery("");
                    setOrdersPage(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Dropdown */}
              <FilterDropdown
                icon={<CalendarBlank size={15} />}
                label={getPeriodLabel(orderPeriod)}
                value={orderPeriod}
                onChange={(p) => applyOrderPeriod(p as "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM")}
                options={PERIOD_OPTIONS}
                ariaLabel="Chọn khoảng thời gian đơn hàng"
              />

              {/* Status Dropdown */}
              <FilterDropdown
                icon={<Funnel size={15} />}
                label={currentOrderStatusLabel}
                value={orderStatusFilter}
                onChange={(s) => {
                  setOrderStatusFilter(s);
                  setOrdersPage(0);
                }}
                options={orderStatusOptions}
                ariaLabel="Lọc trạng thái đơn hàng"
              />

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="p-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition"
                title="Làm mới danh sách đơn hàng"
              >
                <ArrowClockwise size={15} />
              </button>

              {/* Create Order Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setCreatedOrderResult(null);
                  fetchCoursesSummary();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs whitespace-nowrap"
              >
                <Plus size={15} weight="bold" />
                <span>+ Tạo đơn tư vấn Zalo / VietQR</span>
              </button>
            </div>
          </div>

          {/* Conditional: Custom Date Range Picker (ONLY shown when orderPeriod === 'CUSTOM') */}
          {orderPeriod === "CUSTOM" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary/25 bg-primary/5 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <CalendarBlank size={14} />
                Tùy chọn khoảng ngày đặt hàng:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Từ:</span>
                  <input
                    type="date"
                    value={orderFromDate}
                    onChange={(e) => setOrderFromDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Đến:</span>
                  <input
                    type="date"
                    value={orderToDate}
                    onChange={(e) => setOrderToDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOrdersPage(0);
                    fetchOrders();
                  }}
                  className="px-3 py-1 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition shadow-2xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Học viên / Khách hàng</th>
                    <th className="px-4 py-3">Khóa học</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Hóa đơn điện tử</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <SpinnerGap size={24} className="animate-spin text-primary mx-auto mb-2" />
                        <span>Đang tải danh sách đơn hàng...</span>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <CreditCard size={36} className="mx-auto mb-2 text-outline/60" />
                        <div className="font-semibold text-on-surface text-sm">Chưa có đơn hàng nào phù hợp</div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Các đơn đặt mua khóa học qua SePay VietQR sẽ hiển thị tại đây.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-surface-container-lowest/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-primary whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{ord.orderCode}</span>
                            <button
                              onClick={() => copyToClipboard(ord.orderCode, ord.orderCode)}
                              className="text-on-surface-variant/60 hover:text-primary transition"
                              title="Sao chép mã đơn"
                            >
                              {copiedText === ord.orderCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-on-surface">{ord.customerName}</div>
                          <div className="text-[11px] text-on-surface-variant">{ord.customerEmail}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <span className="font-medium text-on-surface line-clamp-1" title={ord.courseTitle || "Khóa học IELTS"}>
                            {ord.courseTitle || "Khóa học IELTS"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                          {formatVnd(ord.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(ord.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ord.invoiceStatus === "ISSUED" ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-semibold">
                              <span>Số: {ord.invoiceNumber || "CQT"}</span>
                              {ord.lookupUrl && (
                                <a
                                  href={ord.lookupUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                  title="Tra cứu trực tiếp trên SePay"
                                >
                                  <ArrowSquareOut size={13} />
                                </a>
                              )}
                            </div>
                          ) : ord.status === "PENDING_PAYMENT" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
                              <Clock size={12} className="text-amber-500" />
                              Tự động xuất khi TT
                            </span>
                          ) : ord.invoiceStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <WarningCircle size={12} />
                              Lỗi xuất HĐ
                            </span>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant">Đang xử lý</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDate(ord.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                              title="Xem chi tiết đơn hàng"
                            >
                              <Eye size={14} />
                              <span>Chi tiết</span>
                            </button>
                            {ord.status === "PENDING_PAYMENT" && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                                title="Hủy đơn hàng chưa thanh toán"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-surface-container-low/30 text-xs text-on-surface-variant">
              <div className="flex items-center gap-3">
                <span>
                  Trang <strong>{ordersPage + 1}</strong> / <strong>{ordersTotalPages}</strong> ({ordersTotalCount} đơn hàng)
                </span>
                <div className="flex items-center gap-1.5 pl-3 border-l border-outline-variant/30">
                  <span className="text-[11px] font-semibold text-on-surface-variant">Hiển thị:</span>
                  <select
                    value={ordersPageSize}
                    onChange={(e) => {
                      setOrdersPageSize(parseInt(e.target.value) || 25);
                      setOrdersPage(0);
                    }}
                    aria-label="Số đơn hàng mỗi trang"
                    className="px-1.5 py-0.5 rounded-md border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="15">15 dòng</option>
                    <option value="25">25 dòng</option>
                    <option value="50">50 dòng</option>
                    <option value="100">100 dòng</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={ordersPage === 0}
                  onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang trước
                </button>
                <div className="px-2 font-mono font-bold text-on-surface">
                  {ordersPage + 1}
                </div>
                <button
                  type="button"
                  disabled={ordersPage + 1 >= ordersTotalPages}
                  onClick={() => setOrdersPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: ELECTRONIC INVOICES MANAGEMENT (200 - 300 HĐ/THÁNG) */}
      {/* ======================================================================= */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* ======================================================================= */}
          {/* 1. UNIFIED ACTION BAR (Search + Period + Status + Export + Refresh) */}
          {/* ======================================================================= */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            {/* Search Input (Takes main focus) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setInvoicesPage(0);
                fetchInvoices();
              }}
              className="relative flex-1 min-w-[240px]"
            >
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
              />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => {
                  setInvoiceSearchQuery(e.target.value);
                  setInvoicesPage(0);
                }}
                placeholder="Tìm số HĐ, mã CQT, mã đơn, tên học viên, MST..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs md:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
              {invoiceSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceSearchQuery("");
                    setInvoicesPage(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Compact Filters & Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Period Dropdown */}
              <FilterDropdown
                icon={<CalendarBlank size={15} />}
                label={getPeriodLabel(invoicePeriod)}
                value={invoicePeriod}
                onChange={(p) => applyInvoicePeriod(p as "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM")}
                options={PERIOD_OPTIONS}
                ariaLabel="Chọn kỳ kế toán"
              />

              {/* Status Dropdown */}
              <FilterDropdown
                icon={<Funnel size={15} />}
                label={currentInvoiceStatusLabel}
                value={invoiceStatusFilter}
                onChange={(s) => {
                  setInvoiceStatusFilter(s);
                  setInvoicesPage(0);
                }}
                options={invoiceStatusOptions}
                ariaLabel="Lọc trạng thái hóa đơn"
              />

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={handleExportInvoicesCsv}
                disabled={isExportingInvoices}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition disabled:opacity-50 shadow-2xs"
                title="Xuất bảng kê hóa đơn bán ra Excel chuẩn UTF-8 BOM"
              >
                {isExportingInvoices ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <DownloadSimple size={14} />
                )}
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => {
                  fetchInvoices();
                  fetchInvoiceStats();
                }}
                className="p-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition"
                title="Làm mới dữ liệu hóa đơn"
              >
                <ArrowClockwise size={15} />
              </button>
            </div>
          </div>

          {/* Conditional: Custom Date Range Picker (ONLY shown when invoicePeriod === 'CUSTOM') */}
          {invoicePeriod === "CUSTOM" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary/25 bg-primary/5 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <CalendarBlank size={14} />
                Tùy chọn khoảng ngày lập hóa đơn:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Từ:</span>
                  <input
                    type="date"
                    value={invoiceFromDate}
                    onChange={(e) => setInvoiceFromDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Đến:</span>
                  <input
                    type="date"
                    value={invoiceToDate}
                    onChange={(e) => setInvoiceToDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInvoicesPage(0);
                    fetchInvoices();
                    fetchInvoiceStats();
                  }}
                  className="px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 2. COMPACT & SLEEK KPI METRIC STRIP */}
          {/* ======================================================================= */}
          {invoiceStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Stat 1: Total */}
              <div className="px-3.5 py-2.5 rounded-xl border border-outline-variant/25 bg-surface flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[11px] font-medium text-on-surface-variant">HĐ trong kỳ</div>
                  <div className="text-base font-bold text-on-surface mt-0.5">
                    {invoiceStats.totalCount} <span className="text-[11px] font-normal text-on-surface-variant">hóa đơn</span>
                  </div>
                </div>
                <Receipt size={20} className="text-primary/70 shrink-0" />
              </div>

              {/* Stat 2: Invoiced Revenue */}
              <div className="px-3.5 py-2.5 rounded-xl border border-outline-variant/25 bg-surface flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[11px] font-medium text-on-surface-variant">Doanh thu đã xuất</div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {formatVnd(invoiceStats.totalInvoicedAmount)}
                  </div>
                </div>
                <CheckCircle size={20} className="text-emerald-600/70 shrink-0" />
              </div>

              {/* Stat 3: Issued Rate */}
              <div className="px-3.5 py-2.5 rounded-xl border border-outline-variant/25 bg-surface flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[11px] font-medium text-on-surface-variant">Đã cấp mã CQT</div>
                  <div className="text-base font-bold text-on-surface mt-0.5">
                    {invoiceStats.issuedCount}
                    <span className="text-[11px] font-semibold text-primary ml-1">
                      ({invoiceStats.totalCount > 0 ? Math.round((invoiceStats.issuedCount / invoiceStats.totalCount) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <ShieldCheck size={20} className="text-primary/70 shrink-0" />
              </div>

              {/* Stat 4: Needs attention */}
              <div
                onClick={() => {
                  if (invoiceStats.failedCount > 0) {
                    setInvoiceStatusFilter("FAILED");
                    setInvoicesPage(0);
                  }
                }}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition shadow-2xs ${
                  invoiceStats.failedCount > 0
                    ? "border-rose-500/30 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10"
                    : "border-outline-variant/25 bg-surface"
                }`}
                title={invoiceStats.failedCount > 0 ? "Bấm để lọc các hóa đơn phát hành lỗi" : undefined}
              >
                <div>
                  <div className="text-[11px] font-medium text-on-surface-variant">Cần lưu ý</div>
                  <div className="text-base font-bold text-on-surface mt-0.5">
                    <span className={invoiceStats.failedCount > 0 ? "text-rose-600 font-bold" : "text-on-surface"}>
                      {invoiceStats.failedCount} lỗi
                    </span>
                    <span className="text-[11px] font-normal text-on-surface-variant ml-1">
                      / {invoiceStats.pendingCount} chờ
                    </span>
                  </div>
                </div>
                <WarningCircle
                  size={20}
                  className={invoiceStats.failedCount > 0 ? "text-rose-600 shrink-0" : "text-amber-500/70 shrink-0"}
                />
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-4 py-3">Mẫu & Số HĐ</th>
                    <th className="px-4 py-3">Mã Cơ quan Thuế (CQT)</th>
                    <th className="px-4 py-3">Mã đơn & Người mua</th>
                    <th className="px-4 py-3">MST / Đơn vị mua</th>
                    <th className="px-4 py-3">Doanh thu</th>
                    <th className="px-4 py-3">Trạng thái CQT</th>
                    <th className="px-4 py-3">Ngày ký</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {invoicesLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <SpinnerGap size={24} className="animate-spin text-primary mx-auto mb-2" />
                        <span>Đang truy xuất danh sách hóa đơn điện tử...</span>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <Receipt size={36} className="mx-auto mb-2 text-outline/60" />
                        <div className="font-semibold text-on-surface text-sm">
                          Không tìm thấy hóa đơn điện tử nào
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Thử thay đổi kỳ kế toán, từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-surface-container-lowest/70 transition cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        {/* 1. Mẫu & Số HĐ */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-on-surface">
                            <span>{inv.invoiceNumber ? `Số ${inv.invoiceNumber}` : "Chờ cấp số"}</span>
                            {inv.invoiceNumber && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(inv.invoiceNumber || "", `inv_${inv.id}`);
                                }}
                                className="text-on-surface-variant/60 hover:text-primary transition"
                                title="Sao chép số hóa đơn"
                              >
                                {copiedText === `inv_${inv.id}` ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-on-surface-variant">
                            Mẫu {inv.invoiceTemplate || "2C26TLN"}
                          </div>
                        </td>

                        {/* 2. Mã CQT */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {inv.cqtCode ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                              <code className="px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] font-mono text-on-surface">
                                {inv.cqtCode.length > 18 ? `${inv.cqtCode.substring(0, 16)}...` : inv.cqtCode}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(inv.cqtCode || "", `cqt_${inv.id}`);
                                }}
                                className="text-on-surface-variant/60 hover:text-primary transition"
                                title="Sao chép toàn bộ mã CQT"
                              >
                                {copiedText === `cqt_${inv.id}` ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant/60 italic">Chưa cấp mã</span>
                          )}
                        </td>

                        {/* 3. Mã đơn & Người mua */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-primary text-xs">{inv.orderCode}</div>
                          <div className="text-xs font-semibold text-on-surface">{inv.customerName}</div>
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                            {inv.customerEmail}
                          </div>
                        </td>

                        {/* 4. MST / Đơn vị mua */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {inv.buyerType === "BUSINESS" ? (
                            <div>
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold mr-1">
                                B2B
                              </span>
                              <span className="text-xs font-mono font-bold text-on-surface">
                                {inv.invoiceTaxCode || "--"}
                              </span>
                              <div className="text-[11px] text-on-surface-variant truncate max-w-[160px]">
                                {inv.invoiceCompanyName}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[10px] font-medium mr-1">
                                B2C
                              </span>
                              <span className="text-xs text-on-surface-variant">Cá nhân</span>
                            </div>
                          )}
                        </td>

                        {/* 5. Doanh thu */}
                        <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                          {formatVnd(inv.amount)}
                        </td>

                        {/* 6. Trạng thái */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(inv.status)}
                        </td>

                        {/* 7. Ngày ký */}
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDate(inv.issuedAt || inv.createdAt)}
                        </td>

                        {/* 8. Thao tác */}
                        <td
                          className="px-4 py-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                              title="Xem chi tiết hóa đơn điện tử"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </button>

                            {inv.lookupUrl && (
                              <a
                                href={inv.lookupUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition"
                                title="Tra cứu trực tuyến trên SePay eInvoice"
                              >
                                <ArrowSquareOut size={14} />
                                <span className="hidden sm:inline">Tra cứu</span>
                              </a>
                            )}

                            {inv.pdfUrl && (
                              <a
                                href={inv.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                                title="Tải file PDF hóa đơn gốc"
                              >
                                <DownloadSimple size={14} />
                                <span className="hidden sm:inline">PDF</span>
                              </a>
                            )}

                            {inv.status === "FAILED" && (
                              <button
                                type="button"
                                onClick={() => handleRetryInvoice(inv.id)}
                                disabled={retryingInvoiceId === inv.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                                title="Thử phát hành lại lên CQT"
                              >
                                {retryingInvoiceId === inv.id ? (
                                  <SpinnerGap size={13} className="animate-spin" />
                                ) : (
                                  "Thử lại"
                                )}
                              </button>
                            )}

                            {inv.status === "ISSUED" && (
                              <button
                                type="button"
                                onClick={() => setCancellingInvoiceId(inv.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                                title="Lập yêu cầu hủy hóa đơn theo NĐ 123"
                              >
                                <span>Hủy HĐ</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-surface-container-low/30 text-xs text-on-surface-variant">
              <div className="flex items-center gap-3">
                <span>
                  Trang <strong>{invoicesPage + 1}</strong> / <strong>{invoicesTotalPages}</strong> ({invoicesTotalCount} hóa đơn)
                </span>
                <div className="flex items-center gap-1.5 pl-3 border-l border-outline-variant/30">
                  <span className="text-[11px] font-semibold text-on-surface-variant">Hiển thị:</span>
                  <select
                    value={invoicePageSize}
                    onChange={(e) => {
                      setInvoicePageSize(parseInt(e.target.value) || 25);
                      setInvoicesPage(0);
                    }}
                    aria-label="Số dòng mỗi trang"
                    className="px-1.5 py-0.5 rounded-md border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="15">15 dòng</option>
                    <option value="25">25 dòng</option>
                    <option value="50">50 dòng</option>
                    <option value="100">100 dòng</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={invoicesPage === 0}
                  onClick={() => setInvoicesPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang trước
                </button>
                <div className="px-2 font-mono font-bold text-on-surface">
                  {invoicesPage + 1}
                </div>
                <button
                  type="button"
                  disabled={invoicesPage + 1 >= invoicesTotalPages}
                  onClick={() => setInvoicesPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: SEPAY BANK RECONCILIATION */}
      {/* ======================================================================= */}
      {activeTab === "reconciliation" && (
        <div className="space-y-3.5">
          {/* ======================================================================= */}
          {/* 1. UNIFIED ACTION BAR FOR RECONCILIATION */}
          {/* ======================================================================= */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setReconciliationPage(0);
                fetchReconciliation();
              }}
              className="relative flex-1 min-w-[240px]"
            >
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                type="text"
                value={reconciliationSearchQuery}
                onChange={(e) => {
                  setReconciliationSearchQuery(e.target.value);
                  setReconciliationPage(0);
                }}
                placeholder="Tìm nội dung chuyển khoản, SePay ID, STK..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant/40 bg-surface text-xs md:text-sm font-medium text-on-surface placeholder:text-outline outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
              {reconciliationSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setReconciliationSearchQuery("");
                    setReconciliationPage(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Dropdown */}
              <FilterDropdown
                icon={<CalendarBlank size={15} />}
                label={getPeriodLabel(reconciliationPeriod)}
                value={reconciliationPeriod}
                onChange={(p) => applyReconciliationPeriod(p as "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "CUSTOM")}
                options={PERIOD_OPTIONS}
                ariaLabel="Chọn khoảng thời gian đối soát"
              />

              {/* Status Dropdown */}
              <FilterDropdown
                icon={<Funnel size={15} />}
                label={currentReconciliationStatusLabel}
                value={reconciliationStatusFilter}
                onChange={(s) => {
                  setReconciliationStatusFilter(s);
                  setReconciliationPage(0);
                }}
                options={reconciliationStatusOptions}
                ariaLabel="Lọc trạng thái đối soát"
              />

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchReconciliation()}
                className="p-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition"
                title="Làm mới nhật ký đối soát"
              >
                <ArrowClockwise size={15} />
              </button>
            </div>
          </div>

          {/* Conditional: Custom Date Range Picker (ONLY shown when reconciliationPeriod === 'CUSTOM') */}
          {reconciliationPeriod === "CUSTOM" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary/25 bg-primary/5 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <CalendarBlank size={14} />
                Tùy chọn khoảng ngày giao dịch SePay:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Từ:</span>
                  <input
                    type="date"
                    value={reconciliationFromDate}
                    onChange={(e) => setReconciliationFromDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface">
                  <span className="text-[11px] text-on-surface-variant font-medium">Đến:</span>
                  <input
                    type="date"
                    value={reconciliationToDate}
                    onChange={(e) => setReconciliationToDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReconciliationPage(0);
                    fetchReconciliation();
                  }}
                  className="px-3 py-1 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition shadow-2xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-4 py-3">Mã GD SePay</th>
                    <th className="px-4 py-3">Số tiền nhận</th>
                    <th className="px-4 py-3">Nội dung chuyển khoản</th>
                    <th className="px-4 py-3">Ngân hàng / STK</th>
                    <th className="px-4 py-3">Mã đơn nhận diện</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {reconciliationLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <SpinnerGap size={24} className="animate-spin text-primary mx-auto mb-2" />
                        <span>Đang tải nhật ký đối soát ngân hàng...</span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <ArrowsDownUp size={36} className="mx-auto mb-2 text-outline/60" />
                        <div className="font-semibold text-on-surface text-sm">Chưa có giao dịch biến động số dư nào</div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Các giao dịch VietQR từ SePay webhook sẽ tự động hiển thị tại đây.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container-lowest/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-on-surface whitespace-nowrap">
                          {tx.sepayTransactionId}
                        </td>
                        <td className="px-4 py-3 font-black text-emerald-700 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                          +{formatVnd(tx.amountIn)}
                        </td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <span className="font-mono text-xs px-2 py-1 rounded bg-surface-container-high text-on-surface block break-all">
                            {tx.transferContent}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <div className="font-semibold text-on-surface">{tx.bankBrandName || "MBBank"}</div>
                          <div className="font-mono text-on-surface-variant">{tx.accountNumber}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                          {tx.orderCode ? (
                            <span className="text-primary">{tx.orderCode}</span>
                          ) : (
                            <span className="text-on-surface-variant/60 font-normal italic">Chưa xác định</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(tx.status)}
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {tx.status !== "SUCCESS" && (
                            <button
                              onClick={() => {
                                setMatchingTx(tx);
                                setManualOrderCode(tx.orderCode || "");
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs"
                              title="Khớp giao dịch vào đơn hàng"
                            >
                              Khớp đơn
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-surface-container-low/30 text-xs text-on-surface-variant">
              <div className="flex items-center gap-3">
                <span>
                  Trang <strong>{reconciliationPage + 1}</strong> / <strong>{reconciliationTotalPages}</strong> ({reconciliationTotalCount} giao dịch)
                </span>
                <div className="flex items-center gap-1.5 pl-3 border-l border-outline-variant/30">
                  <span className="text-[11px] font-semibold text-on-surface-variant">Hiển thị:</span>
                  <select
                    value={reconciliationPageSize}
                    onChange={(e) => {
                      setReconciliationPageSize(parseInt(e.target.value) || 25);
                      setReconciliationPage(0);
                    }}
                    aria-label="Số giao dịch mỗi trang"
                    className="px-1.5 py-0.5 rounded-md border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="15">15 dòng</option>
                    <option value="25">25 dòng</option>
                    <option value="50">50 dòng</option>
                    <option value="100">100 dòng</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={reconciliationPage === 0}
                  onClick={() => setReconciliationPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang trước
                </button>
                <div className="px-2 font-mono font-bold text-on-surface">
                  {reconciliationPage + 1}
                </div>
                <button
                  type="button"
                  disabled={reconciliationPage + 1 >= reconciliationTotalPages}
                  onClick={() => setReconciliationPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-outline-variant/50 bg-surface disabled:opacity-40 font-bold hover:bg-surface-container transition"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 4: BILLING & SEPAY SETTINGS */}
      {/* ======================================================================= */}
      {activeTab === "settings" && (
        <div className="max-w-4xl">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Card 1: SePay Payment Gateway */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <CreditCard size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Cấu hình Cổng thanh toán SePay VietQR</h3>
                  <p className="text-xs text-on-surface-variant">Thông tin tài khoản nhận tiền và mã QR Napas247</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Số tài khoản ngân hàng thụ hưởng *
                  </label>
                  <input
                    type="text"
                    value={settings.sepayAccountNumber || ""}
                    onChange={(e) => setSettings({ ...settings, sepayAccountNumber: e.target.value })}
                    placeholder="VD: 0987654321"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Tên Ngân hàng thụ hưởng *
                  </label>
                  <input
                    type="text"
                    value={settings.sepayBankName || ""}
                    onChange={(e) => setSettings({ ...settings, sepayBankName: e.target.value })}
                    placeholder="VD: MBBank / Vietcombank / Techcombank"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  SePay Webhook Secret Token (Kiểm tra Bearer Token xác thực)
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? "text" : "password"}
                    value={settings.sepayWebhookSecret || ""}
                    onChange={(e) => setSettings({ ...settings, sepayWebhookSecret: e.target.value })}
                    placeholder="Nhập chuỗi secret token cấu hình tại SePay Dashboard..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface"
                  >
                    {showWebhookSecret ? <EyeSlash size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-on-surface-variant">
                  Địa chỉ Webhook trên hệ thống: <code className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-primary">https://your-domain.com/api/v1/webhooks/sepay</code>
                </div>
              </div>
            </div>

            {/* Card 2: e-Invoice & Tax Config */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Receipt size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Cấu hình Hóa đơn điện tử & Thuế Cơ quan Thuế</h3>
                  <p className="text-xs text-on-surface-variant">Thông tin xuất hóa đơn điện tử Nghị định 123 / Thông tư 78</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Tên đơn vị bán hàng (Hiển thị trên HĐĐT & VietQR) *
                </label>
                <input
                  type="text"
                  value={settings.sellerName || ""}
                  onChange={(e) => setSettings({ ...settings, sellerName: e.target.value })}
                  placeholder="VD: CÔNG TY TNHH THE IELTS SPELLS VIỆT NAM"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Mã số thuế Đơn vị bán (MST)
                  </label>
                  <input
                    type="text"
                    value={settings.sellerTaxCode || ""}
                    onChange={(e) => setSettings({ ...settings, sellerTaxCode: e.target.value })}
                    placeholder="VD: 052098014618"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Mẫu số hóa đơn điện tử (Template Code)
                  </label>
                  <input
                    type="text"
                    value={settings.einvoiceTemplateCode || ""}
                    onChange={(e) => setSettings({ ...settings, einvoiceTemplateCode: e.target.value })}
                    placeholder="VD: 2C26TLN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Địa chỉ trụ sở đơn vị bán
                </label>
                <input
                  type="text"
                  value={settings.sellerAddress || ""}
                  onChange={(e) => setSettings({ ...settings, sellerAddress: e.target.value })}
                  placeholder="VD: Đường Tôn Đức Thắng, Phường Hòa Khánh Bắc, Quận Liên Chiểu, TP. Đà Nẵng"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.autoIssueInvoice ?? true}
                    onChange={(e) => setSettings({ ...settings, autoIssueInvoice: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-on-surface">
                    Tự động ký số và phát hành HĐĐT ngay sau khi SePay báo có thành công
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.isSandbox ?? true}
                    onChange={(e) => setSettings({ ...settings, isSandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium text-on-surface-variant">
                    Chế độ Thử nghiệm (Sandbox Mode - Tự sinh mã CQT giả lập và tạo link tra cứu demo)
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 active:scale-95 text-on-primary text-sm font-bold shadow-xs transition"
              >
                {settingsSaving ? <SpinnerGap size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span>Lưu cấu hình hệ thống</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ORDER DETAILS */}
      {/* ======================================================================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Chi tiết đơn hàng</span>
                <h3 className="text-lg font-bold text-on-surface">{selectedOrder.orderCode}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs md:text-sm">
              <div className="flex justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Trạng thái:</span>
                <div>{renderStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="flex justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Khóa học đăng ký:</span>
                <span className="font-bold text-on-surface">{selectedOrder.courseTitle || "Khóa học IELTS"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Số tiền thanh toán:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums text-base">
                  {formatVnd(selectedOrder.amount)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Khách hàng:</span>
                <div className="text-right">
                  <div className="font-bold text-on-surface">{selectedOrder.customerName}</div>
                  <div className="text-[11px] text-on-surface-variant">{selectedOrder.customerEmail}</div>
                  {selectedOrder.customerPhone && (
                    <div className="text-[11px] text-on-surface-variant">{selectedOrder.customerPhone}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Thời gian thanh toán:</span>
                <span className="font-medium text-on-surface">{formatDate(selectedOrder.paidAt)}</span>
              </div>

              {/* Invoicing Section */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                    <Receipt size={15} className="text-primary" />
                    Thông tin Hóa đơn điện tử CQT:
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    {selectedOrder.buyerType === "BUSINESS" ? "Doanh nghiệp (B2B)" : "Cá nhân (B2C)"}
                  </span>
                </div>

                {selectedOrder.invoiceRequired ? (
                  <div className="text-xs space-y-1 text-on-surface-variant">
                    {selectedOrder.invoiceCompanyName && (
                      <div>• Tên đơn vị: <strong className="text-on-surface">{selectedOrder.invoiceCompanyName}</strong></div>
                    )}
                    {selectedOrder.invoiceTaxCode && (
                      <div>• MST: <strong className="font-mono text-on-surface">{selectedOrder.invoiceTaxCode}</strong></div>
                    )}
                    {selectedOrder.invoiceAddress && (
                      <div>• Địa chỉ: <span>{selectedOrder.invoiceAddress}</span></div>
                    )}
                    {selectedOrder.cqtCode && (
                      <div className="pt-1">
                        • Mã CQT: <code className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-emerald-700">{selectedOrder.cqtCode}</code>
                      </div>
                    )}
                    {selectedOrder.lookupUrl && (
                      <div className="pt-2">
                        <a
                          href={selectedOrder.lookupUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <ArrowSquareOut size={13} /> Tra cứu trực tuyến trên SePay eInvoice
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-on-surface-variant leading-relaxed">
                    Hóa đơn điện tử B2C tự động phát hành gửi về email học viên kèm link tra cứu sau khi thanh toán.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
              {selectedOrder.status === "PENDING_PAYMENT" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Dạ chào bạn ${selectedOrder.customerName}, The IELTS Spells gửi bạn thông tin đăng ký và chuyển khoản học phí khóa học "${selectedOrder.courseTitle || "IELTS"}":\n- Số tiền thanh toán: ${formatVnd(selectedOrder.amount)}\n- Ngân hàng: ${settings.sepayBankName || "MBBank"} (Ngân hàng Quân Đội)\n- Số tài khoản: ${settings.sepayAccountNumber || "0987654321"}\n- Chủ tài khoản: ${settings.sellerName || "THE IELTS SPELLS"}\n- Nội dung chuyển khoản: ${selectedOrder.orderCode}\n\n(Bạn có thể mở app ngân hàng quét ảnh mã VietQR để tự động điền đúng thông tin).\nSau khi chuyển khoản thành công, hệ thống sẽ tự động phát hành Hóa đơn điện tử có mã Cơ quan Thuế và gửi Link kích hoạt tài khoản vào email "${selectedOrder.customerEmail}" để bạn vào học ngay ạ!`;
                      copyToClipboard(msg, "zalo_detail");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition"
                  >
                    <ChatCircleText size={15} />
                    <span>{copiedText === "zalo_detail" ? "Đã copy tin Zalo!" : "Copy tin nhắn Zalo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmCashPayment(selectedOrder.id)}
                    className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold transition"
                    title="Chỉ dùng cho trường hợp học viên nộp tiền mặt trực tiếp tại quầy hoặc ngân hàng không kết nối webhook"
                  >
                    Thu tiền mặt tại quầy (Ngoại lệ)
                  </button>
                </div>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: INVOICE DETAILS DRAWER / MODAL */}
      {/* ======================================================================= */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Hóa đơn điện tử eInvoice
                  </span>
                  {renderStatusBadge(selectedInvoice.status)}
                </div>
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span>
                    {selectedInvoice.invoiceNumber
                      ? `Hóa đơn số: ${selectedInvoice.invoiceNumber}`
                      : "Hóa đơn đang chờ cấp số"}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* CQT Verification & Security Card */}
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Mã xác thực của Cơ quan Thuế (CQT)
                </span>
                <span className="text-[11px] font-mono font-bold text-on-surface-variant">
                  Ký hiệu: {selectedInvoice.invoiceTemplate || "2C26TLN"}
                </span>
              </div>
              {selectedInvoice.cqtCode ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/30">
                  <code className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 break-all select-all">
                    {selectedInvoice.cqtCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInvoice.cqtCode || "", "modal_cqt")}
                    className="shrink-0 ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition"
                    title="Sao chép toàn bộ mã CQT"
                  >
                    {copiedText === "modal_cqt" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedText === "modal_cqt" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-on-surface-variant/70 italic p-2 rounded-lg bg-surface border border-outline-variant/20">
                  Hóa đơn chưa có mã xác thực CQT (Đang trong hàng đợi phát hành hoặc gặp sự cố kết nối).
                </div>
              )}

              {selectedInvoice.lookupCode && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-on-surface-variant">Mã tra cứu SePay eInvoice:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono font-bold text-on-surface px-2 py-0.5 rounded bg-surface-container-high">
                      {selectedInvoice.lookupCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedInvoice.lookupCode || "", "modal_lookup")}
                      className="text-on-surface-variant/70 hover:text-primary transition"
                      title="Sao chép mã tra cứu"
                    >
                      {copiedText === "modal_lookup" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Log Alert if FAILED */}
            {selectedInvoice.status === "FAILED" && selectedInvoice.errorLog && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <WarningCircle size={16} />
                  <span>Chi tiết lỗi phát hành từ Tổng cục Thuế / Cổng SePay:</span>
                </div>
                <pre className="text-xs font-mono text-rose-800 dark:text-rose-200 bg-rose-500/5 p-2 rounded border border-rose-500/20 whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {selectedInvoice.errorLog}
                </pre>
              </div>
            )}

            {/* Two Column Grid: Buyer Info vs Financial Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buyer Info */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface p-3.5 space-y-2 text-xs">
                <div className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5 flex items-center justify-between">
                  <span>Thông tin Người mua</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedInvoice.buyerType === "BUSINESS" ? "Doanh nghiệp (B2B)" : "Học viên cá nhân (B2C)"}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Tên khách hàng / Học viên:</span>
                  <div className="font-bold text-on-surface">{selectedInvoice.customerName}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">Email nhận hóa đơn:</span>
                  <div className="font-medium text-on-surface">{selectedInvoice.customerEmail}</div>
                </div>
                {selectedInvoice.buyerType === "BUSINESS" && (
                  <>
                    <div>
                      <span className="text-on-surface-variant">Tên doanh nghiệp:</span>
                      <div className="font-bold text-on-surface">{selectedInvoice.invoiceCompanyName || "--"}</div>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Mã số thuế (MST):</span>
                      <div className="font-mono font-bold text-primary">{selectedInvoice.invoiceTaxCode || "--"}</div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-on-surface-variant">Mã đơn hàng liên kết:</span>
                  <div className="font-mono font-bold text-primary">{selectedInvoice.orderCode}</div>
                </div>
              </div>

              {/* Financial & Tax Breakdown */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface p-3.5 space-y-2 text-xs">
                <div className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5">
                  Bảng kê tài chính & Thuế suất
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-on-surface-variant">Doanh thu chưa thuế:</span>
                  <span className="font-semibold text-on-surface">{formatVnd(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-on-surface-variant">Thuế suất GTGT:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    0% (Không chịu thuế đào tạo)
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-on-surface-variant">Tiền thuế GTGT:</span>
                  <span className="font-semibold text-on-surface">{formatVnd(0)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-outline-variant/20 text-sm">
                  <span className="font-bold text-on-surface">Tổng cộng thanh toán:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {formatVnd(selectedInvoice.amount)}
                  </span>
                </div>
                <div className="pt-2 text-[11px] text-on-surface-variant/70 border-t border-outline-variant/10">
                  <div>Ngày lập: {formatDate(selectedInvoice.createdAt)}</div>
                  {selectedInvoice.issuedAt && (
                    <div>Ngày ký số CQT: {formatDate(selectedInvoice.issuedAt)}</div>
                  )}
                  <div>Số lần thử: {selectedInvoice.retryCount}</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-outline-variant/20">
              <div className="flex flex-wrap items-center gap-2">
                {selectedInvoice.lookupUrl && (
                  <a
                    href={selectedInvoice.lookupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition"
                  >
                    <ArrowSquareOut size={14} />
                    <span>Mở trang tra cứu SePay</span>
                  </a>
                )}

                {selectedInvoice.pdfUrl && (
                  <a
                    href={selectedInvoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                  >
                    <DownloadSimple size={14} />
                    <span>Tải bản PDF gốc</span>
                  </a>
                )}

                {selectedInvoice.status === "FAILED" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRetryInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    disabled={retryingInvoiceId === selectedInvoice.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {retryingInvoiceId === selectedInvoice.id ? (
                      <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                      <ArrowClockwise size={14} />
                    )}
                    <span>Thử phát hành lại ngay</span>
                  </button>
                )}

                {selectedInvoice.status === "ISSUED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingInvoiceId(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                  >
                    <span>Lập đề nghị hủy HĐ</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: MANUAL MATCH TRANSACTION */}
      {/* ======================================================================= */}
      {matchingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setMatchingTx(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Đối soát giao dịch</span>
                <h3 className="text-lg font-bold text-on-surface">Khớp đơn hàng thủ công</h3>
              </div>
              <button
                onClick={() => setMatchingTx(null)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Mã SePay:</span>
                <span className="font-mono font-bold text-on-surface">{matchingTx.sepayTransactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Số tiền nhận:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                  +{formatVnd(matchingTx.amountIn)}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-0.5">Nội dung chuyển khoản:</span>
                <code className="block p-1.5 rounded bg-surface-container-high font-mono text-[11px] text-on-surface break-all">
                  {matchingTx.transferContent}
                </code>
              </div>
            </div>

            <form onSubmit={handleManualMatchSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Mã đơn hàng cần khớp (VD: KH260921001) *
                </label>
                <input
                  type="text"
                  value={manualOrderCode}
                  onChange={(e) => setManualOrderCode(e.target.value)}
                  placeholder="KH260921001"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Ghi chú kế toán
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Học viên chuyển nhầm nội dung, đã đối soát qua Zalo..."
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMatchingTx(null)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isMatching}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs"
                >
                  {isMatching && <SpinnerGap size={14} className="animate-spin" />}
                  <span>Xác nhận khớp & Kích hoạt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CANCEL INVOICE */}
      {/* ======================================================================= */}
      {cancellingInvoiceId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setCancellingInvoiceId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Thao tác quan trọng</span>
                <h3 className="text-lg font-bold text-on-surface">Xác nhận Hủy hóa đơn điện tử</h3>
              </div>
              <button
                onClick={() => setCancellingInvoiceId(null)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hóa đơn sẽ được gửi yêu cầu hủy và lập biên bản giải trình lên Cơ quan Thuế. Thao tác này tuân thủ Nghị định 123/2020/NĐ-CP và không thể hoàn tác.
            </p>

            <form onSubmit={handleCancelInvoiceSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Lý do hủy hóa đơn *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Học viên hủy khóa học hoàn phí, hoặc phát hành lại do sai thông tin đơn vị mua..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingInvoiceId(null)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 active:scale-95 transition shadow-2xs"
                >
                  Xác nhận Hủy Hóa Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CREATE CONSULTATION ORDER (ZALO & VIETQR) */}
      {/* ======================================================================= */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!createOrderSubmitting) setIsCreateModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Tư vấn tuyển sinh</span>
                <h3 className="text-lg font-bold text-on-surface">
                  {createdOrderResult ? "Mã VietQR & Tin nhắn gửi Zalo" : "Tạo đơn tư vấn Zalo & Sinh mã VietQR"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Switch: Step 1 (Form) vs Step 2 (Share Card) */}
            {!createdOrderResult ? (
              <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Nhập thông tin học viên vừa chốt tư vấn qua Zalo / Hotline. Sau khi tạo, hệ thống tự sinh mã VietQR Napas247 và soạn sẵn tin nhắn gửi Zalo. Khi học viên chuyển khoản, hệ thống sẽ tự động kích hoạt tài khoản và xuất HĐĐT B2C.
                </p>

                {/* Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Khóa học đăng ký *
                  </label>
                  {coursesLoading ? (
                    <div className="text-xs text-on-surface-variant py-2 flex items-center gap-1.5">
                      <SpinnerGap size={14} className="animate-spin text-primary" />
                      <span>Đang tải danh sách khóa học...</span>
                    </div>
                  ) : (
                    <select
                      value={createOrderForm.courseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const matched = coursesSummary.find((c) => c.id === cid);
                        setCreateOrderForm((prev) => ({
                          ...prev,
                          courseId: cid,
                          amount: matched?.tuitionAmount ? matched.tuitionAmount.toString() : prev.amount,
                        }));
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition cursor-pointer"
                    >
                      <option value="">-- Chọn khóa học đăng ký --</option>
                      {coursesSummary.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} {c.tuitionAmount ? `(${formatVnd(c.tuitionAmount)})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Họ và tên học viên *
                    </label>
                    <input
                      type="text"
                      value={createOrderForm.fullName}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn An"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Email nhận Link kích hoạt & HĐĐT *
                    </label>
                    <input
                      type="email"
                      value={createOrderForm.email}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, email: e.target.value })}
                      placeholder="VD: hocvien@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Số điện thoại Zalo
                    </label>
                    <input
                      type="tel"
                      value={createOrderForm.phone}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, phone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Học phí thu (VND) *
                    </label>
                    <input
                      type="number"
                      value={createOrderForm.amount}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, amount: e.target.value })}
                      placeholder="6000000"
                      min="0"
                      step="10000"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Thời hạn thanh toán
                    </label>
                    <select
                      value={createOrderForm.expiresInHours}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, expiresInHours: parseInt(e.target.value) || 48 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs md:text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition cursor-pointer"
                    >
                      <option value="24">24 giờ (1 ngày)</option>
                      <option value="48">48 giờ (2 ngày)</option>
                      <option value="72">72 giờ (3 ngày)</option>
                      <option value="168">7 ngày (1 tuần)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Ghi chú tư vấn (Counselor Notes)
                  </label>
                  <input
                    type="text"
                    value={createOrderForm.notes}
                    onChange={(e) => setCreateOrderForm({ ...createOrderForm, notes: e.target.value })}
                    placeholder="VD: Tư vấn Zalo @HoangLong - Áp dụng voucher khai giảng giảm 500k..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createOrderSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs"
                  >
                    {createOrderSubmitting && <SpinnerGap size={14} className="animate-spin" />}
                    <span>Tạo đơn & Sinh mã VietQR</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: VietQR & Zalo Share Card */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <span>
                    Đơn hàng <strong>{createdOrderResult.orderCode}</strong> đã được tạo thành công! Sẵn sàng gửi tin nhắn Zalo cho học viên.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* QR Image Preview */}
                  <div className="text-center p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low/40">
                    <img
                      src={createdOrderResult.qrCodeUrl}
                      alt={`VietQR ${createdOrderResult.orderCode}`}
                      className="w-48 h-auto mx-auto rounded-xl shadow-xs border border-outline-variant/20"
                    />
                    <div className="mt-2 text-[11px] text-on-surface-variant font-medium">
                      Mã Napas247 tự động điền STK & số tiền
                    </div>
                  </div>

                  {/* Transfer Details Card */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Khóa học:</span>
                      <strong className="text-on-surface text-right">{createdOrderResult.courseName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Số tiền thu:</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums text-sm">
                        {formatVnd(createdOrderResult.amount)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Ngân hàng:</span>
                      <span className="font-semibold text-on-surface">{createdOrderResult.bankName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Số tài khoản:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-on-surface">
                        <span>{createdOrderResult.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(createdOrderResult.accountNumber, "acc")}
                          className="hover:text-primary transition"
                          title="Sao chép STK"
                        >
                          {copiedText === "acc" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Nội dung CK:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-primary">
                        <span>{createdOrderResult.orderCode}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(createdOrderResult.orderCode, "code")}
                          className="hover:text-primary transition"
                          title="Sao chép mã đơn"
                        >
                          {copiedText === "code" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Hạn chuyển:</span>
                      <span className="text-on-surface-variant">{formatDate(createdOrderResult.expiresAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Zalo Copy Box */}
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                    <span className="flex items-center gap-1 text-primary">
                      <ChatCircleText size={15} />
                      Nội dung tin nhắn mẫu gửi Zalo cho học viên:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          generateZaloMessage(createdOrderResult, createOrderForm.fullName, createOrderForm.email),
                          "zalo_box"
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold hover:opacity-90 active:scale-95 transition"
                    >
                      {copiedText === "zalo_box" ? (
                        <>
                          <Check size={13} />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Sao chép tin nhắn Zalo</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-sans text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface p-2.5 rounded-lg border border-outline-variant/20 max-h-36 overflow-y-auto">
                    {generateZaloMessage(createdOrderResult, createOrderForm.fullName, createOrderForm.email)}
                  </pre>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <a
                      href={createdOrderResult.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                    >
                      <DownloadSimple size={14} />
                      <span>Xem / Tải ảnh QR</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedOrderResult(null);
                        setCreateOrderForm((prev) => ({ ...prev, fullName: "", email: "", phone: "", notes: "" }));
                      }}
                      className="px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                    >
                      + Tạo đơn tiếp
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreatedOrderResult(null);
                      fetchOrders();
                    }}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
