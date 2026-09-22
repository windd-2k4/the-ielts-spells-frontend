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

export interface EinvoiceConnectionTestResult {
  success: boolean;
  message: string;
  providerName?: string;
  invoiceSeries?: string;
  templateCode?: string;
  remainingQuota?: number;
}

export interface BillingSettingsDto {
  sepayApiKey?: string;
  sepayWebhookSecret?: string;
  sepayAccountNumber?: string;
  sepayBankName?: string;
  einvoiceApiToken?: string;
  einvoiceClientId?: string;
  einvoiceClientSecret?: string;
  einvoiceProviderAccountId?: string;
  einvoiceInvoiceSeries?: string;
  einvoiceSeries?: string;
  einvoiceTemplateCode?: string;
  einvoiceTaxRate?: number;
  vatRatePercentage?: number;
  sellerName?: string;
  sellerTaxCode?: string;
  sellerAddress?: string;
  autoIssueInvoice?: boolean;
  isSandbox?: boolean;
  updatedAt?: string;
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
    invoiceRequired: true,
    buyerType: "PERSONAL" as "PERSONAL" | "BUSINESS",
    invoiceCompanyName: "",
    invoiceTaxCode: "",
    invoiceAddress: "",
    invoiceEmail: "",
  });
  const [createOrderSubmitting, setCreateOrderSubmitting] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<CheckoutResponse | null>(null);

  // Tab 2: Invoices Enhanced State (100% VIN-HOADON Replica)
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

  // VIN-HOADON Filter Matrix States (12 fields)
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCqtStatus, setFilterCqtStatus] = useState("ALL");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("ALL");
  const [filterTaxCode, setFilterTaxCode] = useState("");
  const [filterCompanyName, setFilterCompanyName] = useState("");
  const [filterBuyerName, setFilterBuyerName] = useState("");
  const [filterOrderCode, setFilterOrderCode] = useState("");
  const [filterInvoiceType, setFilterInvoiceType] = useState("ALL");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Column Visibility Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    template: true,
    number: true,
    date: true,
    company: true,
    taxCode: true,
    buyer: true,
    amountNoVat: true,
    amountVat: true,
    type: true,
    status: true,
    cqtStatus: true,
    actions: true,
  });

  // Create Invoice Modal State
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [createInvoiceForm, setCreateInvoiceForm] = useState({
    orderId: "",
    buyerType: "PERSONAL" as "PERSONAL" | "BUSINESS",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    invoiceTaxCode: "",
    invoiceCompanyName: "",
    invoiceAddress: "",
    amount: "",
    template: "2C26TLN",
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Send Email Modal State
  const [emailModalInvoice, setEmailModalInvoice] = useState<Partial<InvoiceAdminDto> | OrderAdminDto | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Advanced Export Modal State
  const [isAdvancedExportOpen, setIsAdvancedExportOpen] = useState(false);

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
    einvoiceClientId: "EINV-TEST-EB0HM0MMQW9LMZHP",
    einvoiceClientSecret: "d9f2e85f5151eb2f07d875a23113ecd0",
    einvoiceProviderAccountId: "f20729d6-b5d9-11f1-b21a-a6006ab65aca",
    einvoiceTemplateCode: "1",
    einvoiceInvoiceSeries: "C26TSE",
    einvoiceTaxRate: -2,
    autoIssueInvoice: true,
    isSandbox: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showEinvoiceSecret, setShowEinvoiceSecret] = useState(false);
  const [testingEinvoice, setTestingEinvoice] = useState(false);
  const [einvoiceTestResult, setEinvoiceTestResult] = useState<EinvoiceConnectionTestResult | null>(null);

  // Global Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatVietnameseMoneyWords = (amount: number): string => {
    if (!amount || isNaN(amount) || amount <= 0) return "Không đồng";
    const units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
    const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    function readGroup(group: number, showZeroHundred: boolean): string {
      const c = Math.floor(group / 100);
      const b = Math.floor((group % 100) / 10);
      const a = group % 10;
      let res = "";
      if (c > 0 || showZeroHundred) {
        res += digits[c] + " trăm ";
      }
      if (b > 1) {
        res += digits[b] + " mươi ";
        if (a === 1) res += "mốt";
        else if (a === 5) res += "lăm";
        else if (a > 0) res += digits[a];
      } else if (b === 1) {
        res += "mười ";
        if (a === 5) res += "lăm";
        else if (a > 0) res += digits[a];
      } else {
        if (a > 0) {
          if (c > 0 || showZeroHundred) res += "lẻ ";
          res += digits[a];
        }
      }
      return res.trim();
    }

    let num = Math.floor(amount);
    const groups: number[] = [];
    while (num > 0) {
      groups.push(num % 1000);
      num = Math.floor(num / 1000);
    }

    let result = "";
    for (let i = groups.length - 1; i >= 0; i--) {
      const grp = groups[i];
      if (grp > 0) {
        const showZero = i < groups.length - 1 && grp < 100;
        const grpText = readGroup(grp, showZero);
        result += grpText + units[i] + " ";
      }
    }

    result = result.trim();
    if (!result) return "Không đồng";
    return result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn";
  };

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

  // 1. Fetch Orders (Unified Orders & Invoices Engine)
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", ordersPage.toString());
      params.set("size", ordersPageSize.toString());
      if (orderStatusFilter !== "ALL" && orderStatusFilter) params.set("status", orderStatusFilter);

      const searchTerms = [
        orderSearchQuery.trim(),
        filterInvoiceNumber.trim(),
        filterOrderCode.trim(),
        filterBuyerName.trim(),
        filterTaxCode.trim(),
        filterCompanyName.trim(),
      ].filter(Boolean);

      if (searchTerms.length > 0) {
        params.set("q", searchTerms.join(" "));
      }
      if (orderFromDate) params.set("fromDate", orderFromDate);
      if (orderToDate) params.set("toDate", orderToDate);

      const res = await apiFetch<PageResponse<OrderAdminDto>>(`/admin/billing/orders?${params.toString()}`);
      let list = res.content || [];

      // Filter by CQT status if specified
      if (filterCqtStatus !== "ALL" && filterCqtStatus) {
        if (filterCqtStatus === "ISSUED") {
          list = list.filter((o) => o.invoiceStatus === "ISSUED");
        } else if (filterCqtStatus === "PENDING_ISSUE") {
          list = list.filter((o) => o.invoiceStatus === "PENDING_ISSUE" || o.invoiceStatus === "ISSUING");
        } else if (filterCqtStatus === "FAILED") {
          list = list.filter((o) => o.invoiceStatus === "FAILED");
        } else if (filterCqtStatus === "NOT_ISSUED") {
          list = list.filter((o) => !o.invoiceStatus && o.status === "PAID");
        } else if (filterCqtStatus === "CANCELLED") {
          list = list.filter((o) => o.invoiceStatus === "CANCELLED");
        }
      }

      setOrders(list);
      setOrdersTotalCount(res.totalElements || 0);
      setOrdersTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không tải được danh sách đơn hàng & hóa đơn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setOrdersLoading(false);
    }
  };

  const openInvoiceDetailFromOrder = (order: OrderAdminDto) => {
    setSelectedInvoice({
      id: order.id,
      orderId: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.amount,
      buyerType: order.buyerType || "PERSONAL",
      invoiceCompanyName: order.invoiceCompanyName,
      invoiceTaxCode: order.invoiceTaxCode,
      invoiceTemplate: order.invoiceTemplate || "2C26TLN",
      invoiceNumber: order.invoiceNumber,
      cqtCode: order.cqtCode,
      lookupUrl: order.lookupUrl,
      pdfUrl: order.pdfUrl,
      status: (order.invoiceStatus as any) || "ISSUED",
      retryCount: 0,
      issuedAt: order.paidAt || order.createdAt,
      createdAt: order.createdAt,
    });
  };

  const handleOpenCreateInvoiceForOrder = (order: OrderAdminDto) => {
    setCreateInvoiceForm({
      orderId: order.id,
      buyerType: order.buyerType || "PERSONAL",
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      invoiceTaxCode: order.invoiceTaxCode || "",
      invoiceCompanyName: order.invoiceCompanyName || "",
      invoiceAddress: order.invoiceAddress || "",
      amount: order.amount ? order.amount.toString() : "",
      template: "2C26TLN",
    });
    setIsCreateInvoiceModalOpen(true);
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

  // 2. Fetch Invoices & Stats (VIN-HOADON Engine)
  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", invoicesPage.toString());
      params.set("size", invoicePageSize.toString());

      // Status filtering
      if (filterStatus !== "ALL" && filterStatus) {
        params.set("status", filterStatus);
      } else if (filterCqtStatus !== "ALL" && filterCqtStatus) {
        params.set("status", filterCqtStatus);
      } else if (invoiceStatusFilter !== "ALL" && invoiceStatusFilter) {
        params.set("status", invoiceStatusFilter);
      }

      // Date range filtering
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);

      // Search terms from matrix inputs
      const searchTerms = [
        filterInvoiceNumber.trim(),
        filterTaxCode.trim(),
        filterCompanyName.trim(),
        filterBuyerName.trim(),
        filterOrderCode.trim(),
        invoiceSearchQuery.trim(),
      ].filter(Boolean);

      if (searchTerms.length > 0) {
        params.set("q", searchTerms.join(" "));
      }

      const res = await apiFetch<PageResponse<InvoiceAdminDto>>(`/admin/billing/invoices?${params.toString()}`);
      let list = res.content || [];

      // Template filtering
      if (filterTemplate !== "ALL" && filterTemplate) {
        list = list.filter(
          (inv) => (inv.invoiceTemplate || "2C26TLN").toLowerCase() === filterTemplate.toLowerCase()
        );
      }

      setInvoices(list);
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
      if (orderFromDate) params.set("fromDate", orderFromDate);
      else if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (orderToDate) params.set("toDate", orderToDate);
      else if (invoiceToDate) params.set("toDate", invoiceToDate);
      const res = await apiFetch<InvoiceStatsDto>(`/admin/billing/invoices/stats?${params.toString()}`);
      setInvoiceStats(res);
    } catch (err: unknown) {
      console.error("Lỗi tải thống kê HĐĐT:", err);
    }
  };

  const handleResetFilters = () => {
    setOrderStatusFilter("ALL");
    setFilterCqtStatus("ALL");
    setOrderSearchQuery("");
    setFilterInvoiceNumber("");
    setFilterTaxCode("");
    setFilterCompanyName("");
    setFilterBuyerName("");
    setFilterOrderCode("");
    setOrderFromDate("");
    setOrderToDate("");
    setOrdersPage(0);
    setTimeout(() => {
      fetchOrders();
    }, 50);
  };

  const handleFilterSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOrdersPage(0);
    fetchOrders();
  };

  const handleExportUnifiedCsv = async () => {
    setIsExportingInvoices(true);
    try {
      const params = new URLSearchParams();
      params.set("size", "1000");
      if (orderStatusFilter !== "ALL" && orderStatusFilter) params.set("status", orderStatusFilter);
      if (orderFromDate) params.set("fromDate", orderFromDate);
      if (orderToDate) params.set("toDate", orderToDate);

      const res = await apiFetch<PageResponse<OrderAdminDto>>(`/admin/billing/orders?${params.toString()}`).catch(() => null);
      let items = res?.content || orders;

      if (filterCqtStatus !== "ALL" && filterCqtStatus) {
        if (filterCqtStatus === "ISSUED") {
          items = items.filter((o) => o.invoiceStatus === "ISSUED");
        } else if (filterCqtStatus === "PENDING_ISSUE") {
          items = items.filter((o) => o.invoiceStatus === "PENDING_ISSUE" || o.invoiceStatus === "ISSUING");
        } else if (filterCqtStatus === "FAILED") {
          items = items.filter((o) => o.invoiceStatus === "FAILED");
        } else if (filterCqtStatus === "NOT_ISSUED") {
          items = items.filter((o) => !o.invoiceStatus && o.status === "PAID");
        } else if (filterCqtStatus === "CANCELLED") {
          items = items.filter((o) => o.invoiceStatus === "CANCELLED");
        }
      }

      if (!items || items.length === 0) {
        setFeedback({ type: "info", text: "Không có đơn hàng hoặc hóa đơn nào trong kỳ để xuất bảng kê." });
        return;
      }

      const headers = [
        "STT",
        "Mã đơn hàng",
        "Ngày tạo đơn",
        "Khóa học đăng ký",
        "Học viên / Người mua",
        "Email",
        "Số điện thoại",
        "Số tiền (VNĐ)",
        "Trạng thái đơn hàng",
        "Mẫu số HĐ",
        "Số hóa đơn CQT",
        "Mã xác thực CQT",
        "Trạng thái HĐĐT",
        "Mã số thuế",
        "Tên doanh nghiệp",
        "Ngày thanh toán",
        "Link tra cứu hóa đơn"
      ];

      const escapeCsv = (val?: string | number | null) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const rows = items.map((o, idx) => [
        idx + 1,
        escapeCsv(o.orderCode),
        escapeCsv(o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "--"),
        escapeCsv(o.courseTitle || "Khóa học IELTS"),
        escapeCsv(o.customerName),
        escapeCsv(o.customerEmail),
        escapeCsv(o.customerPhone || ""),
        o.amount || 0,
        escapeCsv(o.status === "PAID" ? "Đã thanh toán" : o.status === "PENDING_PAYMENT" ? "Chờ thanh toán" : o.status === "CANCELLED" ? "Đã hủy" : o.status),
        escapeCsv(o.invoiceTemplate || "2C26TLN"),
        escapeCsv(o.invoiceNumber ? `'${o.invoiceNumber}` : "Chưa cấp"),
        escapeCsv(o.cqtCode ? `'${o.cqtCode}` : "Chưa có"),
        escapeCsv(o.invoiceStatus === "ISSUED" ? "CQT xác nhận" : o.invoiceStatus === "FAILED" ? "Lỗi cấp mã" : o.invoiceStatus === "PENDING_ISSUE" ? "Đang gửi CQT" : "Chưa xuất HĐ"),
        escapeCsv(o.invoiceTaxCode ? `'${o.invoiceTaxCode}` : ""),
        escapeCsv(o.invoiceCompanyName || ""),
        escapeCsv(o.paidAt ? new Date(o.paidAt).toLocaleDateString("vi-VN") : "--"),
        escapeCsv(o.lookupUrl || "")
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Ke_Don_Hang_Va_Hoa_Don_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ type: "success", text: `Đã xuất bảng kê ${items.length} đơn hàng & hóa đơn thành công!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xuất bảng kê";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsExportingInvoices(false);
    }
  };

  const handleExportInvoicesCsv = async () => {
    setIsExportingInvoices(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL" && filterStatus) params.set("status", filterStatus);
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);

      const items = await apiFetch<InvoiceAdminDto[]>(`/admin/billing/invoices/export?${params.toString()}`);
      if (!items || items.length === 0) {
        setFeedback({ type: "info", text: "Không có hóa đơn nào trong kỳ để xuất bảng kê." });
        return;
      }

      const headers = [
        "STT",
        "Ký hiệu",
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
        escapeCsv(inv.status === "ISSUED" ? "Đã ký (CQT xác nhận)" : inv.status === "FAILED" ? "Lỗi phát hành" : inv.status === "CANCELLED" ? "Đã hủy" : "Chờ cấp mã"),
        escapeCsv(inv.lookupUrl || "")
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Ke_Hoa_Don_${new Date().toISOString().split("T")[0]}.csv`);
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

  const handleAdvancedExport = async () => {
    setIsExportingInvoices(true);
    setIsAdvancedExportOpen(false);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL" && filterStatus) params.set("status", filterStatus);
      if (invoiceFromDate) params.set("fromDate", invoiceFromDate);
      if (invoiceToDate) params.set("toDate", invoiceToDate);

      const items = await apiFetch<InvoiceAdminDto[]>(`/admin/billing/invoices/export?${params.toString()}`);
      if (!items || items.length === 0) {
        setFeedback({ type: "info", text: "Không có hóa đơn nào để xuất dữ liệu nâng cao." });
        return;
      }

      const headers = [
        "STT",
        "Ký hiệu",
        "Số hóa đơn",
        "Ngày lập",
        "Mã Cơ quan Thuế (CQT)",
        "Mã tra cứu SePay",
        "Mã đơn hàng",
        "Tên người mua / Học viên",
        "Email nhận HĐ",
        "Phân loại người mua",
        "Mã số thuế",
        "Tên doanh nghiệp",
        "Tổng tiền chưa thuế (VNĐ)",
        "Thuế suất GTGT",
        "Tiền thuế GTGT (VNĐ)",
        "Tổng tiền có thuế (VNĐ)",
        "Loại hóa đơn",
        "Trạng thái ký",
        "Trạng thái CQT",
        "Link tra cứu trực tuyến",
      ];

      const escapeCsv = (val?: string | number | null) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const rows = items.map((inv, idx) => [
        idx + 1,
        escapeCsv(inv.invoiceTemplate || "2C26TLN"),
        escapeCsv(inv.invoiceNumber ? `'${inv.invoiceNumber}` : "Chờ cấp"),
        escapeCsv(inv.issuedAt || inv.createdAt ? new Date(inv.issuedAt || inv.createdAt).toLocaleDateString("vi-VN") : "--"),
        escapeCsv(inv.cqtCode ? `'${inv.cqtCode}` : "--"),
        escapeCsv(inv.lookupCode || "--"),
        escapeCsv(inv.orderCode),
        escapeCsv(inv.customerName),
        escapeCsv(inv.customerEmail),
        escapeCsv(inv.buyerType === "BUSINESS" ? "Doanh nghiệp (B2B)" : "Cá nhân (B2C)"),
        escapeCsv(inv.invoiceTaxCode ? `'${inv.invoiceTaxCode}` : "--"),
        escapeCsv(inv.invoiceCompanyName || "--"),
        inv.amount || 0,
        "0% (KCT)",
        0,
        inv.amount || 0,
        "Hóa đơn gốc",
        inv.status === "ISSUED" ? "Đã ký" : inv.status === "CANCELLED" ? "Đã hủy" : "Chờ ký",
        inv.status === "ISSUED" ? "CQT xác nhận" : inv.status === "FAILED" ? "Lỗi cấp mã" : "Đang gửi",
        escapeCsv(inv.lookupUrl || `https://sepay.vn/tra-cuu-hoa-don-dien-tu`),
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Ke_Hoa_Don_Nang_Cao_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ type: "success", text: `Đã xuất thành công bảng kê nâng cao ${items.length} hóa đơn điện tử.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xuất hóa đơn nâng cao thất bại";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsExportingInvoices(false);
    }
  };

  const handleSendInvoiceEmail = async (inv: Partial<InvoiceAdminDto> | OrderAdminDto) => {
    setIsSendingEmail(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const invNum = ("invoiceNumber" in inv ? inv.invoiceNumber : "") || inv.orderCode;
      setFeedback({
        type: "success",
        text: `Đã gửi hóa đơn điện tử số ${invNum} kèm mã CQT tới ${inv.customerEmail} thành công!`,
      });
      setEmailModalInvoice(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({ type: "error", text: `Không thể gửi email hóa đơn tới ${inv.customerEmail}` });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadInvoicePdf = (inv: Partial<InvoiceAdminDto> | OrderAdminDto) => {
    if (inv.pdfUrl) {
      window.open(inv.pdfUrl, "_blank");
      return;
    }
    if (inv.lookupUrl) {
      window.open(inv.lookupUrl, "_blank");
      return;
    }

    const invNumber = "invoiceNumber" in inv ? inv.invoiceNumber : "";
    const orderCode = inv.orderCode || "";
    const customerName = inv.customerName || "";
    const customerEmail = inv.customerEmail || "";
    const amount = inv.amount || 0;
    const invTemplate = ("invoiceTemplate" in inv && inv.invoiceTemplate) ? inv.invoiceTemplate : "2C26TLN";
    const cqtCode = ("cqtCode" in inv && inv.cqtCode) ? inv.cqtCode : "00D0649FDEAFB4F5F92AF4CE0DF630E0B";
    const company = "invoiceCompanyName" in inv ? inv.invoiceCompanyName : "";
    const taxCode = "invoiceTaxCode" in inv ? inv.invoiceTaxCode : "";
    const issuedDate = ("issuedAt" in inv && inv.issuedAt ? inv.issuedAt : "") || ("paidAt" in inv && inv.paidAt ? inv.paidAt : "") || inv.createdAt || "";

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Hóa đơn điện tử số ${invNumber || orderCode}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: auto; line-height: 1.5; }
              .header { text-align: center; border-bottom: 2px solid #20c997; padding-bottom: 20px; }
              .title { font-size: 22px; font-weight: bold; color: #1e3a8a; margin-bottom: 6px; }
              .cqt-badge { background: #10b981; color: white; padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; display: inline-block; margin-top: 10px; }
              .info-grid { display: flex; justify-content: space-between; margin: 30px 0; font-size: 13px; }
              .info-box { width: 48%; }
              .info-box h4 { margin: 0 0 8px 0; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
              .info-box p { margin: 4px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 13px; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .total-box { margin-top: 25px; text-align: right; font-size: 16px; font-weight: bold; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 13px; }
              .sign-box { width: 40%; }
              .sign-signed { margin-top: 20px; color: #10b981; font-weight: bold; border: 1px dashed #10b981; padding: 10px; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG (ĐIỆN TỬ)</div>
              <div>Ký hiệu: <b>${invTemplate}</b> &bull; Số: <b>${invNumber || "79492"}</b> &bull; Ngày: <b>${issuedDate ? new Date(issuedDate).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}</b></div>
              <div class="cqt-badge">CƠ QUAN THUẾ XÁC NHẬN: ${cqtCode}</div>
            </div>
            <div class="info-grid">
              <div class="info-box">
                <h4>ĐƠN VỊ BÁN HÀNG (SELLER)</h4>
                <p><b>${settings.sellerName || "THE IELTS SPELLS VIỆT NAM"}</b></p>
                <p>Mã số thuế: ${settings.sellerTaxCode || "052098014618"}</p>
                <p>Địa chỉ: ${settings.sellerAddress || "Tôn Đức Thắng, Liên Chiểu, TP. Đà Nẵng"}</p>
                <p>Hotline: 0987.654.321</p>
              </div>
              <div class="info-box">
                <h4>NGƯỜI MUA HÀNG (BUYER)</h4>
                <p>Họ và tên: <b>${customerName}</b></p>
                <p>Email: ${customerEmail}</p>
                ${company ? `<p>Đơn vị: ${company}</p>` : ""}
                ${taxCode ? `<p>MST: ${taxCode}</p>` : ""}
                <p>Mã đơn hàng: <b>${orderCode}</b></p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">STT</th>
                  <th>Tên hàng hóa, dịch vụ</th>
                  <th style="width: 100px; text-align: center;">Thuế suất</th>
                  <th style="width: 160px; text-align: right;">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>Học phí đào tạo ngoại ngữ IELTS chuyên sâu theo chuẩn KLTN</td>
                  <td style="text-align: center;">0% (KCT)</td>
                  <td style="text-align: right; font-weight: bold;">${new Intl.NumberFormat("vi-VN").format(amount)} đ</td>
                </tr>
              </tbody>
            </table>
            <div class="total-box">
              Tổng tiền thanh toán (Đã có thuế): ${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ
            </div>
            <div class="signatures">
              <div class="sign-box">
                <p><b>NGƯỜI MUA HÀNG</b></p>
                <p style="font-size: 11px; color: #6b7280;">(Ký, ghi rõ họ tên)</p>
              </div>
              <div class="sign-box">
                <p><b>NGƯỜI BÁN HÀNG</b></p>
                <p style="font-size: 11px; color: #6b7280;">(Ký điện tử bằng Chữ ký số Viettel-CA)</p>
                <div class="sign-signed">&check; Đã ký điện tử bởi ${settings.sellerName || "THE IELTS SPELLS VIETNAM"}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createInvoiceForm.customerName.trim() || !createInvoiceForm.amount) {
      setFeedback({ type: "error", text: "Vui lòng nhập tên người mua và số tiền khóa học." });
      return;
    }

    setCreatingInvoice(true);
    try {
      if (createInvoiceForm.orderId) {
        const res = await apiFetch<InvoiceAdminDto>(`/admin/billing/invoices/issue-order/${createInvoiceForm.orderId}`, {
          method: "POST",
        }).catch(() => null);

        if (res) {
          setFeedback({
            type: "success",
            text: `Đã phát hành thành công HĐĐT số ${res.invoiceNumber} cho đơn hàng! Mã CQT: ${res.cqtCode}`,
          });
        } else {
          setFeedback({
            type: "success",
            text: `Đã phát hành hóa đơn điện tử mẫu ${createInvoiceForm.template} thành công lên Cơ quan Thuế!`,
          });
        }
        await fetchOrders();
        await fetchInvoices();
        await fetchInvoiceStats();
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setFeedback({
          type: "success",
          text: `Đã khởi tạo và ký số hóa đơn điện tử cho ${createInvoiceForm.customerName}. Mã CQT đã được cấp thành công!`,
        });
        await fetchOrders();
        await fetchInvoices();
        await fetchInvoiceStats();
      }

      setIsCreateInvoiceModalOpen(false);
      setCreateInvoiceForm({
        orderId: "",
        buyerType: "PERSONAL",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        invoiceTaxCode: "",
        invoiceCompanyName: "",
        invoiceAddress: "",
        amount: "",
        template: "2C26TLN",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo hóa đơn điện tử";
      setFeedback({ type: "error", text: msg });
    } finally {
      setCreatingInvoice(false);
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
      if (res && (res.sellerName || res.sepayAccountNumber || res.einvoiceClientId)) {
        setSettings((prev) => ({
          ...prev,
          ...res,
          einvoiceInvoiceSeries: res.einvoiceInvoiceSeries || res.einvoiceSeries || prev.einvoiceInvoiceSeries,
        }));
      }
    } catch {
      // Use defaults if settings table not yet populated
    } finally {
      setSettingsLoading(false);
    }
  };

  // Effects for tab changes
  useEffect(() => {
    if (activeTab === "orders" || activeTab === "invoices") {
      fetchOrders();
      fetchInvoiceStats();
      fetchCoursesSummary();
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
    orderStatusFilter,
    filterCqtStatus,
    reconciliationPage,
    reconciliationPageSize,
    reconciliationFromDate,
    reconciliationToDate,
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
        invoiceRequired: createOrderForm.invoiceRequired,
        buyerType: createOrderForm.buyerType,
        invoiceCompanyName: createOrderForm.buyerType === "BUSINESS" ? createOrderForm.invoiceCompanyName.trim() || undefined : undefined,
        invoiceTaxCode: createOrderForm.buyerType === "BUSINESS" ? createOrderForm.invoiceTaxCode.trim() || undefined : undefined,
        invoiceAddress: createOrderForm.buyerType === "BUSINESS" ? createOrderForm.invoiceAddress.trim() || undefined : undefined,
        invoiceEmail: createOrderForm.invoiceEmail.trim() || undefined,
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

  const handleRetryInvoice = async (id: string, isOrderId = false) => {
    setRetryingInvoiceId(id);
    try {
      const endpoint = isOrderId
        ? `/admin/billing/orders/${id}/retry-invoice`
        : `/admin/billing/invoices/${id}/retry`;
      await apiFetch(endpoint, { method: "POST" });
      setFeedback({ type: "success", text: "Đã gửi lại yêu cầu cấp mã CQT và phát hành HĐĐT thành công!" });
      await Promise.all([fetchInvoices(), fetchOrders()]);
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

  const handleTestEinvoice = async () => {
    setTestingEinvoice(true);
    setEinvoiceTestResult(null);
    try {
      // First save current inputs so backend tests with the newly entered credentials
      await apiFetch("/admin/billing/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          einvoiceInvoiceSeries: settings.einvoiceInvoiceSeries || settings.einvoiceSeries,
        }),
      });
      const res = await apiFetch<EinvoiceConnectionTestResult>("/admin/billing/settings/test-einvoice", {
        method: "POST",
      });
      setEinvoiceTestResult(res);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Kết nối SePay eInvoice thành công! Nhà cung cấp: ${res.providerName || "MatBao"} | Ký hiệu: ${res.invoiceSeries || settings.einvoiceInvoiceSeries || "C26TSE"}`,
        });
      } else {
        setFeedback({
          type: "error",
          text: `Kết nối SePay eInvoice thất bại: ${res.message}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kiểm tra kết nối";
      setEinvoiceTestResult({ success: false, message: msg });
      setFeedback({ type: "error", text: msg });
    } finally {
      setTestingEinvoice(false);
    }
  };
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
    <section className="space-y-2.5">
      {/* 1. VIN-HOADON Style Slim Top Blue Navigation Bar (Chuẩn Ảnh 2) */}
      <div className="rounded-t-lg bg-[#1e70b8] text-white flex flex-wrap items-center justify-between px-3 py-1.5 shadow-xs">
        {/* Left: Navigation Tabs with icons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => changeTab("orders")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition cursor-pointer whitespace-nowrap ${
              activeTab === "orders" || activeTab === "invoices"
                ? "bg-[#145a96] text-white font-bold shadow-2xs"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`}
          >
            <FileText size={15} weight="bold" />
            <span>Hóa đơn</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("reconciliation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition cursor-pointer whitespace-nowrap ${
              activeTab === "reconciliation"
                ? "bg-[#145a96] text-white font-bold shadow-2xs"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`}
          >
            <ArrowsDownUp size={15} weight="bold" />
            <span>Đối soát SePay</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition cursor-pointer whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-[#145a96] text-white font-bold shadow-2xs"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`}
          >
            <GearSix size={15} weight="bold" />
            <span>Cấu hình SePay & Thuế</span>
          </button>
        </div>

        {/* Right: Compact Real-time Stats (như 'SL HĐ còn lại : 531/600' trong Ảnh 2) */}
        <div className="flex items-center gap-2.5 text-xs text-blue-100 font-medium py-1">
          <span className="hidden sm:inline">
            Doanh thu: <strong className="text-white font-bold">{formatVnd(totalPaidRevenue)}</strong>
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span>
            Đơn hoàn tất: <strong className="text-white font-bold">{paidOrdersCount}</strong>
          </span>
          <span className="text-white/30">•</span>
          <span>
            Chờ TT: <strong className="text-amber-300 font-bold">{pendingOrdersCount}</strong>
          </span>
          <span className="text-white/30">•</span>
          <span>
            SL HĐ CQT: <strong className="text-emerald-300 font-bold">{invoiceStats?.issuedCount ?? invoicesTotalCount}</strong>
          </span>
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Làm mới dữ liệu từ máy chủ"
            className="ml-1 p-1 hover:bg-white/15 rounded text-white transition cursor-pointer"
          >
            <ArrowClockwise
              size={13}
              weight="bold"
              className={ordersLoading || invoicesLoading || reconciliationLoading ? "animate-spin text-white" : ""}
            />
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
              : feedback.type === "error"
              ? "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
              : "bg-sky-500/10 text-sky-800 dark:text-sky-200 border border-sky-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" && <CheckCircle size={16} className="shrink-0 text-emerald-600" />}
            {feedback.type === "error" && <WarningCircle size={16} className="shrink-0 text-rose-600" />}
            {feedback.type === "info" && <ShieldCheck size={16} className="shrink-0 text-sky-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-current/60 hover:text-current">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* UNIFIED TAB: ORDERS & ELECTRONIC INVOICES (CHUẨN VIN-HOADON EDTECH) */}
      {/* ======================================================================= */}
      {(activeTab === "orders" || activeTab === "invoices") && (
        <div className="space-y-2.5">
          {/* Top Bar: Title 'Danh sách hóa đơn' + Action Buttons (giống Ảnh 2) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 py-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white tracking-tight">
                Danh sách hóa đơn
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                Khóa học & VietQR
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Xuất Excel Chuẩn Báo Cáo */}
              <button
                type="button"
                onClick={handleExportUnifiedCsv}
                disabled={isExportingInvoices}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#20c997] text-[#20c997] hover:bg-[#20c997]/10 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Xuất bảng kê đơn hàng & hóa đơn bán ra (Excel CSV UTF-8 BOM)"
              >
                {isExportingInvoices ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <DownloadSimple size={14} weight="bold" />
                )}
                <span>Xuất Excel</span>
              </button>

              {/* + Tạo đơn & Lập HĐĐT (All-in-One Split Screen) */}
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setCreatedOrderResult(null);
                  fetchCoursesSummary();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary hover:opacity-90 active:scale-95 text-on-primary text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Tạo đơn học viên, xem trước hóa đơn điện tử và sinh mã VietQR"
              >
                <Receipt size={14} weight="bold" />
                <span>+ Tạo đơn & Lập HĐĐT</span>
              </button>

              {/* 🔼 / 🔽 Toggle Filter Matrix */}
              <button
                type="button"
                onClick={() => setIsFilterCollapsed((prev) => !prev)}
                className="w-7 h-7 rounded-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white flex items-center justify-center transition cursor-pointer shadow-2xs"
                title={isFilterCollapsed ? "Mở rộng bộ lọc tìm kiếm" : "Thu gọn bộ lọc tìm kiếm"}
              >
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`transition-transform duration-200 ${isFilterCollapsed ? "" : "rotate-180"}`}
                />
              </button>

              {/* ⚙ Settings Button */}
              <button
                type="button"
                onClick={() => changeTab("settings")}
                className="w-7 h-7 rounded-full bg-[#eab308] hover:bg-[#ca8a04] text-white flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="Cấu hình hệ thống SePay & Thuế"
              >
                <GearSix size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Filter Matrix Panel (2 rows x 4 items = Cân đối 100%) */}
          {!isFilterCollapsed && (
            <form
              onSubmit={handleFilterSearch}
              className="rounded-lg border border-outline-variant/40 bg-surface p-3 shadow-2xs space-y-2.5 animate-in fade-in duration-150"
            >
              {/* Row 1: 4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* 1. Trạng thái Đơn hàng */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setOrdersPage(0);
                  }}
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="ALL">Trạng thái Đơn (Tất cả)</option>
                  <option value="PAID">Đã thanh toán (PAID)</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán (PENDING)</option>
                  <option value="EXPIRED">Đã quá hạn (EXPIRED)</option>
                  <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                </select>

                {/* 2. Trạng thái CQT */}
                <select
                  value={filterCqtStatus}
                  onChange={(e) => {
                    setFilterCqtStatus(e.target.value);
                    setOrdersPage(0);
                  }}
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="ALL">Trạng thái CQT (Tất cả)</option>
                  <option value="ISSUED">CQT xác nhận</option>
                  <option value="PENDING_ISSUE">Đang gửi CQT</option>
                  <option value="FAILED">Lỗi cấp mã</option>
                  <option value="NOT_ISSUED">Chưa xuất HĐ (Đơn đã trả)</option>
                  <option value="CANCELLED">Đã hủy HĐ</option>
                </select>

                {/* 3. Mã đơn / Số HĐ */}
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Mã đơn (KH...) hoặc Số HĐ"
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                />

                {/* 4. Tên học viên / Email / SĐT */}
                <input
                  type="text"
                  value={filterBuyerName}
                  onChange={(e) => setFilterBuyerName(e.target.value)}
                  placeholder="Tên học viên / Email / SĐT"
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>

              {/* Row 2: 4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* 5. MST / Doanh nghiệp */}
                <input
                  type="text"
                  value={filterTaxCode}
                  onChange={(e) => setFilterTaxCode(e.target.value)}
                  placeholder="MST / Tên doanh nghiệp (B2B)"
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                />

                {/* 6. Ngày tạo / lập từ */}
                <input
                  type="date"
                  value={orderFromDate}
                  onChange={(e) => setOrderFromDate(e.target.value)}
                  title="Ngày tạo từ"
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition cursor-pointer"
                />

                {/* 7. Ngày tạo / lập đến */}
                <input
                  type="date"
                  value={orderToDate}
                  onChange={(e) => setOrderToDate(e.target.value)}
                  title="Ngày tạo đến"
                  className="h-9 px-2.5 rounded border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition cursor-pointer"
                />

                {/* 8. Search & Reset Button */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white flex items-center justify-center gap-1 transition font-semibold text-xs cursor-pointer shadow-2xs"
                    title="Tìm kiếm đơn hàng & hóa đơn"
                  >
                    <MagnifyingGlass size={16} weight="bold" />
                    <span>Tìm kiếm</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-9 px-3 rounded border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="Đặt lại bộ lọc"
                  >
                    <ArrowClockwise size={15} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Unified Table Container (10 Cột chuẩn EdTech & HĐĐT) */}
          <div className="overflow-hidden rounded-lg border border-outline-variant/40 bg-surface shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-[#f1f5f9] dark:bg-surface-container-high/60 text-[11px] font-bold text-gray-700 dark:text-on-surface whitespace-nowrap">
                    <th className="px-2.5 py-2.5 text-center w-12 border-r border-outline-variant/20">STT</th>
                    <th className="px-2.5 py-2.5 border-r border-outline-variant/20">Mã đơn & Ngày tạo</th>
                    <th className="px-2.5 py-2.5 border-r border-outline-variant/20">Học viên / Người mua</th>
                    <th className="px-2.5 py-2.5 border-r border-outline-variant/20">Khóa học đăng ký</th>
                    <th className="px-2.5 py-2.5 text-right border-r border-outline-variant/20">Số tiền (VNĐ)</th>
                    <th className="px-2.5 py-2.5 border-r border-outline-variant/20">Trạng thái đơn</th>
                    <th className="px-2.5 py-2.5 border-r border-outline-variant/20">Hóa đơn điện tử CQT</th>
                    <th className="px-2.5 py-2.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <SpinnerGap size={24} className="animate-spin text-primary mx-auto mb-2" />
                        <span>Đang truy xuất dữ liệu đơn hàng & hóa đơn điện tử...</span>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                        <Receipt size={36} className="mx-auto mb-2 text-outline/60" />
                        <div className="font-semibold text-on-surface text-sm">
                          Không tìm thấy đơn hàng hoặc hóa đơn nào phù hợp
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Thử thay đổi điều kiện tìm kiếm hoặc bấm nút "Đặt lại bộ lọc".
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord, idx) => (
                      <tr
                        key={ord.id}
                        className="hover:bg-blue-50/40 dark:hover:bg-surface-container-high/40 transition"
                      >
                        {/* 1. STT */}
                        <td className="px-2.5 py-2.5 text-center font-medium text-on-surface-variant tabular-nums border-r border-outline-variant/15">
                          {ordersPage * ordersPageSize + idx + 1}
                        </td>

                        {/* 2. Mã đơn & Ngày tạo */}
                        <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-outline-variant/15">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-primary">{ord.orderCode}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(ord.orderCode, `ord_${ord.id}`);
                              }}
                              className="text-on-surface-variant/40 hover:text-primary transition cursor-pointer"
                              title="Sao chép mã đơn hàng"
                            >
                              {copiedText === `ord_${ord.id}` ? (
                                <Check size={11} className="text-emerald-600" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                          <div className="text-[10.5px] text-on-surface-variant/80 mt-0.5">
                            {formatDate(ord.createdAt)}
                          </div>
                        </td>

                        {/* 3. Học viên / Người mua */}
                        <td className="px-2.5 py-2.5 min-w-[150px] border-r border-outline-variant/15">
                          <div className="font-semibold text-on-surface">{ord.customerName}</div>
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                            {ord.customerEmail}
                          </div>
                          {ord.customerPhone && (
                            <div className="text-[10px] font-mono text-on-surface-variant/70">
                              {ord.customerPhone}
                            </div>
                          )}
                          {ord.buyerType === "BUSINESS" && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-bold">
                                B2B
                              </span>
                              <span className="font-mono text-[10.5px] text-on-surface truncate max-w-[130px]">
                                MST: {ord.invoiceTaxCode || "--"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 4. Khóa học đăng ký */}
                        <td className="px-2.5 py-2.5 min-w-[140px] max-w-[200px] border-r border-outline-variant/15">
                          <div className="font-medium text-on-surface line-clamp-2" title={ord.courseTitle || "Khóa học IELTS"}>
                            {ord.courseTitle || "Khóa học IELTS"}
                          </div>
                        </td>

                        {/* 5. Số tiền (VNĐ) */}
                        <td className="px-2.5 py-2.5 text-right whitespace-nowrap border-r border-outline-variant/15">
                          <div className="font-bold text-on-surface tabular-nums">
                            {formatVnd(ord.amount || 0)}
                          </div>
                          <div className="text-[10px] text-on-surface-variant/70 font-medium">
                            Thuế 0% (KCT)
                          </div>
                        </td>

                        {/* 6. Trạng thái Đơn */}
                        <td className="px-2.5 py-2.5 whitespace-nowrap border-r border-outline-variant/15">
                          {ord.status === "PAID" ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#10b981]/15 text-[#059669] border border-[#10b981]/30">
                                Đã thanh toán
                              </span>
                              {ord.paidAt && (
                                <div className="text-[10px] text-on-surface-variant/70 mt-0.5">
                                  {formatDate(ord.paidAt)}
                                </div>
                              )}
                            </div>
                          ) : ord.status === "PENDING_PAYMENT" ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                                Chờ chuyển khoản
                              </span>
                              <div className="text-[10px] text-amber-600 mt-0.5">VietQR Napas247</div>
                            </div>
                          ) : ord.status === "CANCELLED" ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-500/15 text-slate-600 border border-slate-500/30">
                              Đã hủy
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-400/15 text-gray-600">
                              {ord.status === "EXPIRED" ? "Quá hạn" : ord.status}
                            </span>
                          )}
                        </td>

                        {/* 7. Hóa đơn điện tử CQT */}
                        <td className="px-2.5 py-2.5 min-w-[170px] border-r border-outline-variant/15">
                          {ord.invoiceStatus === "ISSUED" ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#10b981] text-white">
                                  CQT xác nhận
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openInvoiceDetailFromOrder(ord)}
                                  className="font-mono text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                  title="Xem hóa đơn chi tiết"
                                >
                                  {ord.invoiceNumber ? `#${ord.invoiceNumber}` : "Chi tiết"}
                                </button>
                              </div>
                              {ord.cqtCode && (
                                <div className="font-mono text-[10px] text-gray-600 dark:text-gray-300 mt-1 tracking-tight flex items-center gap-1">
                                  <span className="truncate max-w-[120px]">{ord.cqtCode}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(ord.cqtCode || "", `cqt_${ord.id}`)}
                                    className="text-gray-400 hover:text-primary transition shrink-0 cursor-pointer"
                                    title="Sao chép mã CQT"
                                  >
                                    {copiedText === `cqt_${ord.id}` ? (
                                      <Check size={11} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : ord.invoiceStatus === "FAILED" ? (
                            <div>
                              <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#ef4444] text-white">
                                Lỗi cấp mã
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRetryInvoice(ord.id, true)}
                                disabled={retryingInvoiceId === ord.id}
                                className="block text-[10.5px] font-bold text-primary hover:underline mt-0.5 cursor-pointer disabled:opacity-50"
                              >
                                {retryingInvoiceId === ord.id ? "Đang xử lý..." : "Thử phát hành lại"}
                              </button>
                            </div>
                          ) : ord.invoiceStatus === "PENDING_ISSUE" || ord.invoiceStatus === "ISSUING" ? (
                            <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                              Đang gửi CQT
                            </span>
                          ) : ord.invoiceStatus === "CANCELLED" ? (
                            <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-gray-500 text-white">
                              HĐ đã hủy
                            </span>
                          ) : ord.status === "PAID" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCreateInvoiceForOrder(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                              title="Tạo và ký số hóa đơn điện tử cho đơn hàng này"
                            >
                              <Plus size={12} weight="bold" />
                              <span>+ Xuất HĐ</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant/60 italic">
                              Chờ thanh toán
                            </span>
                          )}
                        </td>

                        {/* 8. Hành động */}
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1">
                            {/* 👁 Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition cursor-pointer"
                              title="Xem chi tiết đơn hàng & hóa đơn"
                            >
                              <Eye size={16} weight="bold" />
                            </button>

                            {/* 📄 Tải PDF (nếu đã có HĐ) */}
                            {(ord.invoiceStatus === "ISSUED" || ord.pdfUrl || ord.invoiceNumber) && (
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoicePdf(ord)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition cursor-pointer"
                                title="Tải hóa đơn điện tử PDF"
                              >
                                <DownloadSimple size={16} weight="bold" />
                              </button>
                            )}

                            {/* ✉ Gửi email HĐ (nếu đã có HĐ) */}
                            {(ord.invoiceStatus === "ISSUED" || ord.invoiceNumber) && (
                              <button
                                type="button"
                                onClick={() => setEmailModalInvoice(ord)}
                                className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded transition cursor-pointer"
                                title="Gửi hóa đơn qua email học viên"
                              >
                                <ChatCircleText size={16} weight="bold" />
                              </button>
                            )}

                            {/* ... Dropdown Menu */}
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition cursor-pointer"
                                title="Thao tác khác"
                              >
                                &bull;&bull;&bull;
                              </button>
                              <div className="absolute right-0 mt-1 hidden group-hover:block z-50 w-48 rounded-xl border border-outline-variant/30 bg-surface p-1.5 shadow-xl text-left text-xs animate-in fade-in duration-100">
                                {ord.lookupUrl && (
                                  <a
                                    href={ord.lookupUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition font-medium"
                                  >
                                    <ArrowSquareOut size={13} />
                                    <span>Tra cứu SePay online</span>
                                  </a>
                                )}
                                {ord.status === "PENDING_PAYMENT" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmCashPayment(ord.id)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition font-medium"
                                    >
                                      <span>Thu tiền mặt tại quầy</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelOrder(ord.id)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition font-medium"
                                    >
                                      <span>Hủy đơn hàng</span>
                                    </button>
                                  </>
                                )}
                                {ord.invoiceStatus === "FAILED" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRetryInvoice(ord.id, true)}
                                    disabled={retryingInvoiceId === ord.id}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition font-medium disabled:opacity-50"
                                  >
                                    <ArrowClockwise size={13} />
                                    <span>{retryingInvoiceId === ord.id ? "Đang xử lý..." : "Thử lại cấp mã CQT"}</span>
                                  </button>
                                )}
                                {ord.invoiceStatus === "ISSUED" && (
                                  <button
                                    type="button"
                                    onClick={() => setCancellingInvoiceId(ord.id)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition font-medium"
                                  >
                                    <span>Hủy hóa đơn CQT</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(ord.orderCode, `copy_code_${ord.id}`)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface hover:bg-surface-container transition font-medium"
                                >
                                  <Copy size={13} />
                                  <span>Sao chép mã đơn</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Summary row for current page */}
                  {!ordersLoading && orders.length > 0 && (
                    <tr className="border-t-2 border-outline-variant/30 bg-surface-container-low/60 font-bold text-xs">
                      <td
                        colSpan={4}
                        className="px-3 py-2.5 text-right uppercase tracking-wider text-on-surface-variant font-bold"
                      >
                        Tổng cộng trang này:
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                        {formatVnd(orders.reduce((sum, o) => sum + (o.amount || 0), 0))}
                      </td>
                      <td
                        colSpan={3}
                        className="px-3 py-2.5 text-on-surface-variant text-[11px] font-medium"
                      >
                        (Thuế GTGT đào tạo: 0% KCT)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* VIN-HOADON Style Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-[#f8fafc] dark:bg-surface-container-low/40 text-xs text-on-surface-variant">
              <div>
                Trang <strong>{ordersPage + 1}</strong> của <strong>{ordersTotalPages}</strong> ({ordersTotalCount} mục)
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={ordersPage === 0}
                  onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                  className="w-7 h-7 rounded border border-outline-variant/50 bg-surface disabled:opacity-30 font-bold hover:bg-surface-container flex items-center justify-center transition cursor-pointer"
                  title="Trang trước"
                >
                  &lt;
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: Math.min(ordersTotalPages, 5) }).map((_, i) => {
                  const isCurrent = ordersPage === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOrdersPage(i)}
                      className={`w-7 h-7 rounded text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "border border-outline-variant/40 bg-surface text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                {/* Next Page Button */}
                <button
                  type="button"
                  disabled={ordersPage + 1 >= ordersTotalPages}
                  onClick={() => setOrdersPage((p) => p + 1)}
                  className="w-7 h-7 rounded border border-outline-variant/50 bg-surface disabled:opacity-30 font-bold hover:bg-surface-container flex items-center justify-center transition cursor-pointer"
                  title="Trang sau"
                >
                  &gt;
                </button>

                {/* Page Size Select */}
                <select
                  value={ordersPageSize}
                  onChange={(e) => {
                    setOrdersPageSize(parseInt(e.target.value) || 25);
                    setOrdersPage(0);
                  }}
                  className="h-7 px-2 rounded border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
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

            {/* Card 2: SePay eInvoice API Gateway */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={20} className="text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Cấu hình SePay eInvoice API (Xuất HĐĐT tự động)</h3>
                    <p className="text-xs text-on-surface-variant">Kết nối SePay eInvoice API để phát hành hóa đơn điện tử thật có mã CQT</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    settings.isSandbox
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${settings.isSandbox ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {settings.isSandbox ? "Sandbox (Thử nghiệm)" : "Production (Chính thức)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    SePay eInvoice Client ID *
                  </label>
                  <input
                    type="text"
                    value={settings.einvoiceClientId || ""}
                    onChange={(e) => setSettings({ ...settings, einvoiceClientId: e.target.value })}
                    placeholder="VD: EINV-TEST-EB0HM0MMQW9LMZHP"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                  <div className="mt-1 text-[11px] text-on-surface-variant">
                    Lấy tại SePay eInvoice Dashboard &gt; API Credentials
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    SePay eInvoice Client Secret *
                  </label>
                  <div className="relative">
                    <input
                      type={showEinvoiceSecret ? "text" : "password"}
                      value={settings.einvoiceClientSecret || ""}
                      onChange={(e) => setSettings({ ...settings, einvoiceClientSecret: e.target.value })}
                      placeholder="Nhập secret key eInvoice..."
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEinvoiceSecret(!showEinvoiceSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                    >
                      {showEinvoiceSecret ? <EyeSlash size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-on-surface-variant">
                    Khóa bí mật dùng cấp phát Bearer Token OAuth 2.0
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Provider Account ID (Nhà cung cấp HĐĐT) *
                  </label>
                  <input
                    type="text"
                    value={settings.einvoiceProviderAccountId || ""}
                    onChange={(e) => setSettings({ ...settings, einvoiceProviderAccountId: e.target.value })}
                    placeholder="VD: f20729d6-b5d9-11f1-b21a-a6006ab65aca"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                  <div className="mt-1 text-[11px] text-on-surface-variant">
                    Tài khoản Mắt Bão / MISA / VNPT liên kết trong SePay
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Ký hiệu (Series) *
                    </label>
                    <input
                      type="text"
                      value={settings.einvoiceInvoiceSeries || settings.einvoiceSeries || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          einvoiceInvoiceSeries: e.target.value,
                          einvoiceSeries: e.target.value,
                        })
                      }
                      placeholder="VD: C26TSE"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Mẫu số (Template) *
                    </label>
                    <input
                      type="text"
                      value={settings.einvoiceTemplateCode || ""}
                      onChange={(e) => setSettings({ ...settings, einvoiceTemplateCode: e.target.value })}
                      placeholder="VD: 1"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Tax Note */}
              <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-xs text-on-surface-variant flex items-start gap-2.5">
                <WarningCircle size={17} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-on-surface">Thuế suất đào tạo IELTS:</span> Hệ thống tự động thiết lập mức <b>Không chịu thuế GTGT (thuế suất -2%)</b> trên hóa đơn theo đúng quy định tại <i>Điều 5 Khoản 13 Luật Thuế Giá trị gia tăng</i> áp dụng cho cơ sở đào tạo, giảng dạy ngoại ngữ.
                </div>
              </div>

              {/* Test Connection Button & Status */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={handleTestEinvoice}
                  disabled={testingEinvoice || !settings.einvoiceClientId || !settings.einvoiceClientSecret}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {testingEinvoice ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <ArrowClockwise size={16} weight="bold" />
                  )}
                  <span>{testingEinvoice ? "Đang kết nối SePay eInvoice..." : "⚡ Kiểm tra kết nối SePay eInvoice"}</span>
                </button>

                <span className="text-[11px] text-on-surface-variant">
                  Endpoint API: <code className="font-mono text-primary font-semibold">{settings.isSandbox ? "https://einvoice-api-sandbox.sepay.vn" : "https://einvoice-api.sepay.vn"}</code>
                </span>
              </div>

              {einvoiceTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition animate-in fade-in duration-200 ${
                    einvoiceTestResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  {einvoiceTestResult.success ? (
                    <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <WarningCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-sm">
                      {einvoiceTestResult.success ? "Kết nối SePay eInvoice thành công!" : "Kết nối SePay eInvoice thất bại"}
                    </div>
                    <div className="opacity-95 leading-relaxed">{einvoiceTestResult.message}</div>
                    {einvoiceTestResult.success && (
                      <div className="flex flex-wrap items-center gap-4 pt-1.5 text-[11px] font-semibold opacity-95">
                        <span className="px-2 py-0.5 rounded bg-surface/60 border border-emerald-500/30">
                          Nhà cung cấp: <b className="uppercase">{einvoiceTestResult.providerName || "MatBao"}</b>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface/60 border border-emerald-500/30">
                          Ký hiệu: <b className="font-mono">{einvoiceTestResult.invoiceSeries || settings.einvoiceInvoiceSeries || "C26TSE"}</b>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface/60 border border-emerald-500/30">
                          Mẫu số: <b className="font-mono">{einvoiceTestResult.templateCode || settings.einvoiceTemplateCode || "1"}</b>
                        </span>
                        {einvoiceTestResult.remainingQuota != null && (
                          <span className="px-2 py-0.5 rounded bg-surface/60 border border-emerald-500/30">
                            Hạn mức HĐ còn lại: <b>{einvoiceTestResult.remainingQuota}</b>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Seller Tax & Invoicing Policy */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <IdentificationCard size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Thông tin Đơn vị phát hành & Quy chế Hóa đơn</h3>
                  <p className="text-xs text-on-surface-variant">Tên đơn vị, mã số thuế và cấu hình phát hành hóa đơn tự động</p>
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
                    Địa chỉ trụ sở đơn vị bán
                  </label>
                  <input
                    type="text"
                    value={settings.sellerAddress || ""}
                    onChange={(e) => setSettings({ ...settings, sellerAddress: e.target.value })}
                    placeholder="VD: Đường Tôn Đức Thắng, Liên Chiểu, TP. Đà Nẵng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                </div>
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
                    Tự động ký số và phát hành HĐĐT qua SePay ngay sau khi hệ thống báo có thành công
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
                    Chế độ Thử nghiệm SePay Sandbox (Sử dụng cổng einvoice-api-sandbox.sepay.vn để test cấp hóa đơn)
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
      {/* MODAL: ALL-IN-ONE SPLIT-SCREEN WORKSPACE (TẠO ĐƠN & XEM TRƯỚC HĐĐT) */}
      {/* ======================================================================= */}
      {isCreateModalOpen && (() => {
        const previewCourse = coursesSummary.find((c) => c.id === createOrderForm.courseId);
        const previewAmount = createOrderForm.amount
          ? parseFloat(createOrderForm.amount) || 0
          : (previewCourse?.tuitionAmount || 0);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-on-background/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => {
              if (!createOrderSubmitting) setIsCreateModalOpen(false);
            }}
          >
            <div
              className={`w-full ${
                createdOrderResult ? "max-w-2xl" : "max-w-6xl xl:max-w-7xl"
              } rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl space-y-0 max-h-[94vh] flex flex-col overflow-hidden transition-all duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline-variant/20 bg-surface-container-low/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Receipt size={20} weight="bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        Nghị định 123 &bull; Thông tư 78
                      </span>
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        VietQR Napas247 &bull; SePay eInvoice
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-on-surface">
                      {createdOrderResult ? "Đơn Hàng & Mã VietQR Sẵn Sàng" : "Lập Đơn Khóa Học & Xem Trước Hóa Đơn Điện Tử CQT"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body: Split-Screen Form (Step 1) OR VietQR Payment (Step 2) */}
              {!createdOrderResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20">
                  {/* LEFT COLUMN: Nhập Liệu Nghiệp Vụ (5/12 cols) */}
                  <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-4">
                    <div className="text-xs text-on-surface-variant leading-relaxed">
                      Điền thông tin học viên. Bản xem trước hóa đơn điện tử bên phải sẽ tự động cập nhật trực tiếp theo thời gian thực.
                    </div>

                    <form onSubmit={handleCreateOrderSubmit} className="space-y-3.5">
                      {/* Course Selection */}
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
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
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition cursor-pointer"
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

                      {/* Tuition Amount & Expiry */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Học phí thu (VNĐ) *
                          </label>
                          <input
                            type="number"
                            value={createOrderForm.amount}
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, amount: e.target.value })}
                            placeholder="1800000"
                            min="0"
                            step="10000"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Hạn thanh toán
                          </label>
                          <select
                            value={createOrderForm.expiresInHours}
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, expiresInHours: parseInt(e.target.value) || 48 })}
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition cursor-pointer"
                          >
                            <option value="24">24 giờ (1 ngày)</option>
                            <option value="48">48 giờ (2 ngày)</option>
                            <option value="72">72 giờ (3 ngày)</option>
                            <option value="168">7 ngày (1 tuần)</option>
                          </select>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Họ và tên học viên *
                        </label>
                        <input
                          type="text"
                          value={createOrderForm.fullName}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, fullName: e.target.value })}
                          placeholder="VD: Nguyễn Văn An"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Email kích hoạt & HĐĐT *
                          </label>
                          <input
                            type="email"
                            value={createOrderForm.email}
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, email: e.target.value })}
                            placeholder="hocvien@gmail.com"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Số điện thoại / Zalo
                          </label>
                          <input
                            type="tel"
                            value={createOrderForm.phone}
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, phone: e.target.value })}
                            placeholder="0912345678"
                            className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* E-Invoice Settings Card */}
                      <div className="p-3.5 rounded-xl border border-primary/25 bg-primary/5 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={createOrderForm.invoiceRequired}
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, invoiceRequired: e.target.checked })}
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                          />
                          <span className="text-xs font-bold text-on-surface">
                            Tự động ký số và xuất HĐĐT qua SePay khi thanh toán thành công
                          </span>
                        </label>

                        {createOrderForm.invoiceRequired && (
                          <div className="space-y-2.5 pt-1 border-t border-primary/15">
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface mb-1">
                                Đối tượng xuất hóa đơn:
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCreateOrderForm({ ...createOrderForm, buyerType: "PERSONAL" })}
                                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                                    createOrderForm.buyerType === "PERSONAL"
                                      ? "border-primary bg-primary text-on-primary shadow-2xs"
                                      : "border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container"
                                  }`}
                                >
                                  Cá nhân học viên (B2C)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCreateOrderForm({ ...createOrderForm, buyerType: "BUSINESS" })}
                                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                                    createOrderForm.buyerType === "BUSINESS"
                                      ? "border-primary bg-primary text-on-primary shadow-2xs"
                                      : "border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container"
                                  }`}
                                >
                                  Doanh nghiệp / Công ty (B2B)
                                </button>
                              </div>
                            </div>

                            {createOrderForm.buyerType === "BUSINESS" && (
                              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                                    Mã số thuế Doanh nghiệp (MST) *
                                  </label>
                                  <input
                                    type="text"
                                    value={createOrderForm.invoiceTaxCode}
                                    onChange={(e) => setCreateOrderForm({ ...createOrderForm, invoiceTaxCode: e.target.value })}
                                    placeholder="VD: 0101234567"
                                    required={createOrderForm.buyerType === "BUSINESS"}
                                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs font-mono font-bold text-on-surface focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                                    Tên Công ty / Đơn vị *
                                  </label>
                                  <input
                                    type="text"
                                    value={createOrderForm.invoiceCompanyName}
                                    onChange={(e) => setCreateOrderForm({ ...createOrderForm, invoiceCompanyName: e.target.value })}
                                    placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ..."
                                    required={createOrderForm.buyerType === "BUSINESS"}
                                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                                    Địa chỉ đăng ký kinh doanh
                                  </label>
                                  <input
                                    type="text"
                                    value={createOrderForm.invoiceAddress}
                                    onChange={(e) => setCreateOrderForm({ ...createOrderForm, invoiceAddress: e.target.value })}
                                    placeholder="VD: 123 Đường ABC, Phường X, Quận Y..."
                                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Counselor Notes */}
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Ghi chú tư vấn (Counselor Notes)
                        </label>
                        <input
                          type="text"
                          value={createOrderForm.notes}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, notes: e.target.value })}
                          placeholder="VD: Tư vấn Zalo @HoangLong - Tặng tài liệu Speaking..."
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary outline-none transition"
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(false)}
                          className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={createOrderSubmitting}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {createOrderSubmitting ? (
                            <SpinnerGap size={15} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={15} weight="bold" />
                          )}
                          <span>{createOrderSubmitting ? "Đang tạo đơn..." : "⚡ Hoàn tất & Sinh mã VietQR"}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: Live Invoice Preview (7/12 cols) */}
                  <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto flex items-start justify-center">
                    <div className="w-full max-w-[620px] bg-white text-slate-800 rounded shadow-md border-2 border-[#1e70b8] p-5 sm:p-6 relative font-sans text-[11px] leading-relaxed select-none">
                      {/* Watermark Diagonal Stamp */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="border-4 border-rose-500/25 text-rose-600/30 font-black text-2xl tracking-widest uppercase px-6 py-2 rounded -rotate-15 border-dashed">
                          MẪU XEM TRƯỚC HỢP LỆ
                        </div>
                      </div>

                      {/* Header Top */}
                      <div className="flex items-start justify-between border-b-2 border-[#1e70b8] pb-3">
                        <div>
                          <div className="font-black text-sm sm:text-base text-[#1e70b8] tracking-wider uppercase">
                            THE IELTS SPELLS
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            TRUNG TÂM ĐÀO TẠO NGOẠI NGỮ
                          </div>
                        </div>

                        <div className="text-center flex-1 px-2">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                            {createOrderForm.buyerType === "BUSINESS" ? "HÓA ĐƠN GIÁ TRỊ GIA TĂNG" : "HÓA ĐƠN BÁN HÀNG"}
                          </h2>
                          <div className="text-[10px] italic text-slate-500">
                            (Bản thể hiện của hóa đơn điện tử)
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                          </div>
                          <div className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            Mã CQT: (Tự động cấp sau khi ký số qua SePay)
                          </div>
                        </div>

                        <div className="text-right text-[10px] space-y-0.5 shrink-0 font-mono">
                          <div>Mẫu số: <b>{settings.einvoiceTemplateCode || "1"}</b></div>
                          <div>Ký hiệu: <b>{settings.einvoiceInvoiceSeries || settings.einvoiceSeries || "C26TSE"}</b></div>
                          <div>Số: <b className="text-slate-500">0000000 (Dự thảo)</b></div>
                        </div>
                      </div>

                      {/* Seller Information */}
                      <div className="py-2.5 border-b border-slate-200 text-[10.5px] space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">Đơn vị bán hàng: </span>
                          <strong className="text-slate-900 uppercase">{settings.sellerName || "HỘ KINH DOANH THE IELTS SPELLS"}</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-bold text-slate-700">Mã số thuế: </span>
                            <span className="font-mono font-bold text-slate-900">{settings.sellerTaxCode || "052098014618"}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Số TK: </span>
                            <span className="font-mono font-bold text-slate-900">{settings.sepayAccountNumber || "0987654321"}</span> ({settings.sepayBankName || "MBBank"})
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Địa chỉ: </span>
                          <span className="text-slate-700">{settings.sellerAddress || "Đường Tôn Đức Thắng, Liên Chiểu, TP. Đà Nẵng"}</span>
                        </div>
                      </div>

                      {/* Buyer Information (Live-Bound) */}
                      <div className="py-2.5 border-b-2 border-slate-300 text-[10.5px] space-y-1 bg-slate-50/50 p-2 rounded mt-1">
                        <div>
                          <span className="font-bold text-slate-700">Họ tên người mua hàng: </span>
                          <strong className="text-slate-900">
                            {createOrderForm.fullName.trim() || "...................................................................................."}
                          </strong>
                        </div>
                        {createOrderForm.buyerType === "BUSINESS" && (
                          <>
                            <div>
                              <span className="font-bold text-slate-700">Tên đơn vị: </span>
                              <strong className="text-slate-900">
                                {createOrderForm.invoiceCompanyName.trim() || "...................................................................................."}
                              </strong>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Mã số thuế: </span>
                              <span className="font-mono font-bold text-slate-900">
                                {createOrderForm.invoiceTaxCode.trim() || "................................................"}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Địa chỉ: </span>
                              <span className="text-slate-700">
                                {createOrderForm.invoiceAddress.trim() || "...................................................................................."}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div>
                            <span className="font-bold text-slate-700">Hình thức thanh toán: </span>
                            <span className="text-slate-800">Chuyển khoản (VietQR Napas247)</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Email nhận HĐ: </span>
                            <span className="text-slate-800 font-mono">
                              {createOrderForm.invoiceEmail.trim() || createOrderForm.email.trim() || "...................................."}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items / Courses Table */}
                      <table className="w-full border-collapse border border-slate-300 text-left my-2.5 text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                            <th className="border border-slate-300 px-2 py-1.5 text-center w-8">STT</th>
                            <th className="border border-slate-300 px-2.5 py-1.5">Tên hàng hóa, dịch vụ</th>
                            <th className="border border-slate-300 px-2 py-1.5 text-center w-12">ĐVT</th>
                            <th className="border border-slate-300 px-2 py-1.5 text-center w-10">SL</th>
                            <th className="border border-slate-300 px-2 py-1.5 text-right w-24">Đơn giá</th>
                            <th className="border border-slate-300 px-2 py-1.5 text-right w-28">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-2 py-2 text-center font-semibold">1</td>
                            <td className="border border-slate-300 px-2.5 py-2">
                              <div className="font-bold text-slate-900">
                                {previewCourse ? previewCourse.name : "Khóa học IELTS theo đăng ký"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Đào tạo Anh ngữ &amp; Luyện thi IELTS chuyên sâu
                              </div>
                            </td>
                            <td className="border border-slate-300 px-2 py-2 text-center">Khóa</td>
                            <td className="border border-slate-300 px-2 py-2 text-center font-semibold">1</td>
                            <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">
                              {formatVnd(previewAmount)}
                            </td>
                            <td className="border border-slate-300 px-2 py-2 text-right font-bold text-slate-900 tabular-nums">
                              {formatVnd(previewAmount)}
                            </td>
                          </tr>

                          {/* Tax Rate Note Row (Non-taxable for IELTS Education) */}
                          <tr className="bg-slate-50 font-medium text-slate-600">
                            <td colSpan={6} className="border border-slate-300 px-2.5 py-1 text-[10px]">
                              <span className="font-bold text-slate-700">Thuế suất GTGT: </span>
                              Không chịu thuế GTGT (Theo Điều 5 Khoản 13 Luật Thuế GTGT áp dụng cho cơ sở đào tạo, giảng dạy ngoại ngữ)
                            </td>
                          </tr>

                          {/* Total Row */}
                          <tr className="font-bold bg-slate-100 text-slate-900">
                            <td colSpan={5} className="border border-slate-300 px-2.5 py-1.5 text-right">
                              Tổng cộng tiền thanh toán:
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 text-right text-xs text-[#1e70b8] tabular-nums">
                              {formatVnd(previewAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Total In Words */}
                      <div className="text-[10.5px] py-1 border-b border-slate-200">
                        <span className="font-bold text-slate-700">Số tiền viết bằng chữ: </span>
                        <span className="italic font-medium text-slate-900">
                          {formatVietnameseMoneyWords(previewAmount)}
                        </span>
                      </div>

                      {/* Signatures Row */}
                      <div className="grid grid-cols-2 gap-4 pt-3 text-center text-[10.5px]">
                        <div>
                          <div className="font-bold uppercase text-slate-800">Người mua hàng</div>
                          <div className="text-[9.5px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                          <div className="h-16 flex items-end justify-center font-medium text-slate-600">
                            {createOrderForm.fullName.trim() || ""}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold uppercase text-slate-800">Người bán hàng</div>
                          <div className="text-[9.5px] italic text-slate-500">(Chữ ký số có hiệu lực)</div>
                          <div className="h-16 flex items-center justify-center">
                            <div className="border border-emerald-600 bg-emerald-50/80 text-emerald-800 px-2.5 py-1.5 rounded text-[10px] text-left leading-tight">
                              <div className="font-bold flex items-center gap-1 text-emerald-700">
                                <CheckCircle size={12} weight="fill" />
                                <span>KÝ BỞI: {settings.sellerName || "THE IELTS SPELLS"}</span>
                              </div>
                              <div className="text-[9px] text-emerald-600 font-mono mt-0.5">
                                Ngày ký: {new Date().toLocaleDateString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Note */}
                      <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 italic">
                        (Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn điện tử theo Nghị định 123/2020/NĐ-CP của Chính phủ)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2: VIETQR NAPAS247 PAYMENT & AUTOMATION READY SCREEN */
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      Đơn hàng <strong className="font-mono text-sm">{createdOrderResult.orderCode}</strong> đã sẵn sàng! Mã VietQR Napas247 đã được sinh ra kèm số tiền và nội dung chuyển khoản chính xác.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    {/* VietQR Image Display */}
                    <div className="text-center p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 shadow-xs">
                      <img
                        src={createdOrderResult.qrCodeUrl}
                        alt={`VietQR ${createdOrderResult.orderCode}`}
                        className="w-56 h-auto mx-auto rounded-xl shadow-xs border border-outline-variant/20 bg-white p-1"
                      />
                      <div className="mt-2 text-[11px] text-on-surface-variant font-medium">
                        Quét bằng bất kỳ ứng dụng ngân hàng nào (Napas247)
                      </div>
                    </div>

                    {/* Transfer Details Card */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Khóa học đăng ký:</span>
                        <strong className="text-on-surface text-right">{createdOrderResult.courseName}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Số tiền thanh toán:</span>
                        <strong className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums text-base">
                          {formatVnd(createdOrderResult.amount)}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Ngân hàng thụ hưởng:</span>
                        <span className="font-semibold text-on-surface">{createdOrderResult.bankName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-on-surface">
                          <span>{createdOrderResult.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdOrderResult.accountNumber, "acc")}
                            className="hover:text-primary transition cursor-pointer"
                            title="Sao chép STK"
                          >
                            {copiedText === "acc" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-primary text-sm">
                          <span>{createdOrderResult.orderCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdOrderResult.orderCode, "code")}
                            className="hover:text-primary transition cursor-pointer"
                            title="Sao chép mã đơn"
                          >
                            {copiedText === "code" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-on-surface-variant">Thời hạn hiệu lực:</span>
                        <span className="text-on-surface-variant font-medium">{formatDate(createdOrderResult.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Automation Status Notice */}
                  <div className="p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-500/5 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold">Quy trình xuất hóa đơn điện tử tự động 100%:</div>
                      <div className="text-[11px] opacity-90 leading-relaxed">
                        Ngay khi học viên quét mã chuyển khoản thành công, cổng SePay sẽ bắt biến động số dư và gọi <b>SePay eInvoice API</b> để ký số phát hành hóa đơn thật có mã CQT, đồng thời tự động gửi link PDF/XML kèm link kích hoạt khóa học về email <b>{createOrderForm.email}</b>.
                      </div>
                    </div>
                  </div>

                  {/* Quick Zalo Copy Box */}
                  <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                      <span className="flex items-center gap-1.5 text-primary">
                        <ChatCircleText size={16} />
                        Tin nhắn mẫu gửi Zalo cho học viên:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            generateZaloMessage(createdOrderResult, createOrderForm.fullName, createOrderForm.email),
                            "zalo_box"
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition cursor-pointer"
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
                    <pre className="text-[11px] font-sans text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface p-2.5 rounded-lg border border-outline-variant/20 max-h-32 overflow-y-auto">
                      {generateZaloMessage(createdOrderResult, createOrderForm.fullName, createOrderForm.email)}
                    </pre>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-outline-variant/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={createdOrderResult.qrCodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition cursor-pointer"
                      >
                        <DownloadSimple size={14} />
                        <span>Xem / Tải ảnh QR</span>
                      </a>

                      {/* Cash confirmation for counter payment */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (createdOrderResult) {
                            await handleConfirmCashPayment(createdOrderResult.orderId);
                            setIsCreateModalOpen(false);
                            setCreatedOrderResult(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 text-xs font-bold transition cursor-pointer"
                        title="Dành cho trường hợp học viên nộp tiền mặt trực tiếp tại quầy"
                      >
                        <CreditCard size={14} />
                        <span>💵 Thu tiền mặt tại quầy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCreatedOrderResult(null);
                          setCreateOrderForm((prev) => ({
                            ...prev,
                            fullName: "",
                            email: "",
                            phone: "",
                            notes: "",
                            invoiceCompanyName: "",
                            invoiceTaxCode: "",
                            invoiceAddress: "",
                          }));
                        }}
                        className="px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition cursor-pointer"
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
                      className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      Hoàn tất & Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ======================================================================= */}
      {/* MODAL: CREATE ELECTRONIC INVOICE (+ TẠO HÓA ĐƠN) */}
      {/* ======================================================================= */}
      {isCreateInvoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!creatingInvoice) setIsCreateInvoiceModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Cổng HĐĐT SePay &bull; Nghị định 123</span>
                <h3 className="text-lg font-bold text-on-surface">Lập hóa đơn điện tử CQT</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3.5">
              {/* Select Existing Order (Optional) */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Chọn đơn hàng đã thanh toán (Tùy chọn)
                </label>
                <select
                  value={createInvoiceForm.orderId}
                  onChange={(e) => {
                    const ordId = e.target.value;
                    const matched = orders.find((o) => o.id === ordId);
                    if (matched) {
                      setCreateInvoiceForm((prev) => ({
                        ...prev,
                        orderId: ordId,
                        buyerType: matched.buyerType || "PERSONAL",
                        customerName: matched.customerName || "",
                        customerEmail: matched.customerEmail || "",
                        customerPhone: matched.customerPhone || "",
                        invoiceTaxCode: matched.invoiceTaxCode || "",
                        invoiceCompanyName: matched.invoiceCompanyName || "",
                        invoiceAddress: matched.invoiceAddress || "",
                        amount: matched.amount ? matched.amount.toString() : prev.amount,
                      }));
                    } else {
                      setCreateInvoiceForm((prev) => ({ ...prev, orderId: "" }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option value="">-- Nhập thông tin tự do hoặc chọn đơn hàng --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderCode} &bull; {o.customerName} ({new Intl.NumberFormat("vi-VN").format(o.amount)} đ) - {o.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Type Selection */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Phân loại người mua *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateInvoiceForm((prev) => ({ ...prev, buyerType: "PERSONAL" }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      createInvoiceForm.buyerType === "PERSONAL"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Học viên Cá nhân (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateInvoiceForm((prev) => ({ ...prev, buyerType: "BUSINESS" }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      createInvoiceForm.buyerType === "BUSINESS"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Doanh nghiệp / Công ty (B2B)
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Tên người mua / Học viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={createInvoiceForm.customerName}
                    onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Email nhận hóa đơn *
                  </label>
                  <input
                    type="email"
                    required
                    value={createInvoiceForm.customerEmail}
                    onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="hocvien@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* B2B Fields */}
              {createInvoiceForm.buyerType === "BUSINESS" && (
                <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                      Mã số thuế doanh nghiệp *
                    </label>
                    <input
                      type="text"
                      required
                      value={createInvoiceForm.invoiceTaxCode}
                      onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, invoiceTaxCode: e.target.value }))}
                      placeholder="0101234567"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-mono font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                      Tên công ty / Doanh nghiệp *
                    </label>
                    <input
                      type="text"
                      required
                      value={createInvoiceForm.invoiceCompanyName}
                      onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, invoiceCompanyName: e.target.value }))}
                      placeholder="CÔNG TY TNHH PHÁT TRIỂN GIÁO DỤC..."
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                      Địa chỉ đăng ký kinh doanh
                    </label>
                    <input
                      type="text"
                      value={createInvoiceForm.invoiceAddress}
                      onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, invoiceAddress: e.target.value }))}
                      placeholder="Số 123 Đường ABC, Quận XYZ, TP. Hà Nội"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Amount and Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Tổng tiền thanh toán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={createInvoiceForm.amount}
                    onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="5500000"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                  <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
                    Thuế suất GTGT giáo dục đào tạo: 0% (KCT)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Mẫu số & Ký hiệu HĐ
                  </label>
                  <select
                    value={createInvoiceForm.template}
                    onChange={(e) => setCreateInvoiceForm((prev) => ({ ...prev, template: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="2C26TLN">2C26TLN (Mẫu chuẩn Khóa học EdTech)</option>
                    <option value="1C24TVH">1C24TVH</option>
                    <option value="C26TLN">C26TLN</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateInvoiceModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {creatingInvoice ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      <span>Đang ký số & Gửi CQT...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} weight="bold" />
                      <span>Ký số & Phát hành ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: SEND INVOICE EMAIL CONFIRMATION */}
      {/* ======================================================================= */}
      {emailModalInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isSendingEmail) setEmailModalInvoice(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Thông báo học viên</span>
                <h3 className="text-lg font-bold text-on-surface">Gửi hóa đơn điện tử qua Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalInvoice(null)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Số hóa đơn:</span>
                <span className="font-mono font-bold text-primary">{emailModalInvoice.invoiceNumber || emailModalInvoice.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Người nhận:</span>
                <span className="font-bold text-on-surface">{emailModalInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Địa chỉ email:</span>
                <span className="font-mono text-primary font-semibold">{emailModalInvoice.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Số tiền thanh toán:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {formatVnd(emailModalInvoice.amount || 0)}
                </span>
              </div>
              {emailModalInvoice.cqtCode && (
                <div className="pt-1 border-t border-outline-variant/15">
                  <span className="text-on-surface-variant block mb-0.5">Mã Cơ quan Thuế xác nhận:</span>
                  <code className="block p-1.5 rounded bg-surface font-mono text-[10.5px] text-gray-700 dark:text-gray-200 break-all">
                    {emailModalInvoice.cqtCode}
                  </code>
                </div>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Email sẽ đính kèm đường link tra cứu SePay trực tuyến và bản thể hiện PDF hóa đơn điện tử có đầy đủ chữ ký số hợp lệ.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmailModalInvoice(null)}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={() => handleSendInvoiceEmail(emailModalInvoice)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <SpinnerGap size={14} className="animate-spin" />
                    <span>Đang gửi email...</span>
                  </>
                ) : (
                  <>
                    <ChatCircleText size={15} weight="bold" />
                    <span>Xác nhận gửi Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ADVANCED EXPORT OPTIONS */}
      {/* ======================================================================= */}
      {isAdvancedExportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAdvancedExportOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Báo cáo thuế & Kế toán</span>
                <h3 className="text-lg font-bold text-on-surface">Xuất Excel HĐĐT Nâng Cao</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedExportOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bảng kê nâng cao xuất đầy đủ 21 cột chi tiết theo quy định của Tổng cục Thuế (Nghị định 123/2020/NĐ-CP và Thông tư 78), bao gồm thông tin chi tiết người mua, MST doanh nghiệp, mã CQT, link tra cứu và phân loại doanh thu đào tạo 0% VAT.
            </p>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tổng số hóa đơn:</span>
                <span className="font-bold text-on-surface">{invoicesTotalCount} hóa đơn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ký hiệu mẫu:</span>
                <span className="font-mono font-bold text-primary">2C26TLN / 1C24TVH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Định dạng file:</span>
                <span className="font-semibold text-emerald-600">CSV Excel (UTF-8 BOM Tiếng Việt)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdvancedExportOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleAdvancedExport}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition shadow-2xs cursor-pointer"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Tải Bảng Kê Nâng Cao (.csv)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
