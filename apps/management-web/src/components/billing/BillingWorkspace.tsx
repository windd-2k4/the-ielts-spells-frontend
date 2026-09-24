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
  Printer,
  QrCode,
  Receipt,
  ShareNetwork,
  ShieldCheck,
  SpinnerGap,
  Trash,
  WarningCircle,
  X,
  LockKey,
  RocketLaunch,
  Power,
  ShieldWarning,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../AdminUi";
import { apiFetch } from "../../lib/api";
import { EinvoiceSplitPreview } from "./EinvoiceSplitPreview";

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
  courseTitle?: string;
  courseName?: string;
  amount: number;
  status: string;
  qrCodeUrl: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  transferContent: string;
  expiresAt: string;
}

export interface StaticQrResponse {
  qrCodeUrl: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  suggestedTransferContent: string;
  productName: string;
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
  invoiceId?: string;
  invoiceStatus?: "PENDING_ISSUE" | "CREATING" | "PROCESSING" | "DRAFT" | "ISSUING" | "ISSUED" | "FAILED" | "UNKNOWN" | "CANCELLED" | "ADJUSTED" | "REPLACED";
  invoiceErrorCategory?: "RETRYABLE" | "NON_RETRYABLE" | "REQUIRES_ACTION" | "UNDETERMINED" | "RECONCILABLE";
  reconciliationStatus?: "NOT_REQUIRED" | "PENDING" | "RECONCILED" | "FAILED" | "REQUIRES_REVIEW";
  invoiceNumber?: string;
  invoiceTemplate?: string;
  invoiceSeries?: string;
  cqtCode?: string;
  lookupUrl?: string;
  pdfUrl?: string;
  pilotApproved?: boolean;
  createdAt: string;
}

export interface InvoiceAdminDto {
  id: string;
  orderId?: string;
  paymentTransactionId?: string;
  orderCode: string;
  referenceCode?: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  buyerType: "PERSONAL" | "BUSINESS";
  invoiceCompanyName?: string;
  invoiceTaxCode?: string;
  invoiceTemplate?: string;
  invoiceSeries?: string;
  invoiceNumber?: string;
  cqtCode?: string;
  lookupCode?: string;
  lookupUrl?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  status: "PENDING_ISSUE" | "CREATING" | "PROCESSING" | "DRAFT" | "ISSUING" | "ISSUED" | "FAILED" | "UNKNOWN" | "CANCELLED" | "ADJUSTED" | "REPLACED";
  isDraft?: boolean;
  createTrackingCode?: string;
  issueTrackingCode?: string;
  provider?: string;
  retryCount: number;
  errorLog?: string;
  issuedAt?: string;
  createdAt: string;
  nextRetryAt?: string;
  reconciliationStatus?: "NOT_REQUIRED" | "PENDING" | "RECONCILED" | "FAILED" | "REQUIRES_REVIEW";
  taxTreatment?: number;
  errorCategory?: "RETRYABLE" | "NON_RETRYABLE" | "REQUIRES_ACTION" | "UNDETERMINED" | "RECONCILABLE";
  firstSubmittedAt?: string;
  lastStatusCheckedAt?: string;
  courseTitle?: string;
  invoiceAddress?: string;
}

export interface ReconciliationDto {
  id: string;
  gateway: string;
  sepayTransactionId: string;
  orderId?: string;
  orderCode?: string;
  amountIn: number;
  accumulatedAmount?: number;
  payerName?: string;
  transferContent?: string;
  bankBrandName?: string;
  accountNumber?: string;
  status: "SUCCESS" | "STANDALONE_PAYMENT" | "PARTIAL_PAYMENT" | "UNDERPAID" | "OVERPAID" | "UNMATCHED" | "REFUNDED";
  reconciliationNote?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}

export interface EinvoiceConnectionTestResult {
  success: boolean;
  message: string;
  providerName?: string;
  providerAccountId?: string;
  invoiceSeries?: string;
  templateCode?: string;
  taxAuthorityApprovedDate?: string;
  remainingQuota?: number;
}

export interface TemplateDto {
  templateCode: string;
  invoiceSeries: string;
  templateName?: string;
  taxRate?: number;
}

export interface ProviderAccountDto {
  id: string;
  provider: string;
  taxCode?: string;
  legalName?: string;
  active: boolean;
  taxAuthorityApprovedDate?: string;
  templates: TemplateDto[];
}

export interface ReadinessCheckItem {
  id: string;
  title: string;
  status: "PASS" | "WARN" | "FAIL";
  details: string;
  recommendation?: string;
}

export interface GoLiveReadinessReport {
  canGoProduction: boolean;
  overallStatus?: "READY" | "READY_FOR_PILOT" | "READY_WITH_WARNINGS" | "NOT_READY";
  passCount: number;
  warnCount: number;
  failCount: number;
  checks: ReadinessCheckItem[];
}

export interface BillingSettingsDto {
  sepayApiKey?: string;
  sepayApiKeyConfigured?: boolean;
  maskedSepayApiKey?: string;
  sepayWebhookSecret?: string;
  sepayWebhookSecretConfigured?: boolean;
  sepayAccountNumber?: string;
  maskedSepayAccountNumber?: string;
  sepayBankName?: string;
  einvoiceApiToken?: string;
  einvoiceClientId?: string;
  maskedEinvoiceClientId?: string;
  einvoiceClientSecret?: string;
  einvoiceClientSecretConfigured?: boolean;
  einvoiceProviderAccountId?: string;
  einvoiceInvoiceSeries?: string;
  einvoiceSeries?: string;
  einvoiceTemplateCode?: string;
  einvoiceTaxRate?: number;
  vatRatePercentage?: number;
  taxAuthorityApprovedDate?: string;

  // Production eInvoice Configuration
  prodClientId?: string;
  maskedProdClientId?: string;
  prodClientSecret?: string;
  prodClientSecretConfigured?: boolean;
  prodProviderAccountId?: string;
  prodInvoiceSeries?: string;
  prodTemplateCode?: string;
  prodTaxAuthorityApprovedDate?: string;

  // Pilot & Safety Controls
  activationState?: "SANDBOX" | "PRODUCTION_CONFIGURED" | "PRODUCTION_READY" | "PRODUCTION_PILOT" | "PRODUCTION_ACTIVE";
  autoInvoiceEnabled?: boolean;
  pilotOrderAllowlist?: string;

  // Seller Legal Info & Tax
  sellerName?: string;
  sellerTaxCode?: string;
  sellerAddress?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  autoIssueInvoice?: boolean;
  isSandbox?: boolean;
  availableTemplates?: string;
  taxTreatment?: string;
  taxConfigurationConfirmed?: boolean;
  taxConfigurationConfirmedAt?: string;
  taxConfigurationConfirmedBy?: string;
  pilotStatus?: "NOT_STARTED" | "IN_PROGRESS" | "PASSED" | "FAILED" | "REQUIRES_REVIEW";
  lastPilotExecutionId?: string;
  invoiceType?: "VAT" | "SALES";
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
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [createdOrderResult, setCreatedOrderResult] = useState<CheckoutResponse | null>(null);
  const [staticQr, setStaticQr] = useState<StaticQrResponse | null>(null);
  const [staticQrLoading, setStaticQrLoading] = useState(false);
  const [isStaticQrModalOpen, setIsStaticQrModalOpen] = useState(false);

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
    sepayAccountNumber: "",
    sepayBankName: "",
    sellerName: "",
    sellerTaxCode: "",
    sellerAddress: "",
    sellerPhone: "",
    sellerEmail: "",
    einvoiceClientId: "",
    einvoiceClientSecret: "",
    einvoiceProviderAccountId: "",
    einvoiceTemplateCode: "",
    einvoiceInvoiceSeries: "",
    invoiceType: "SALES",
    einvoiceTaxRate: -2,
    autoIssueInvoice: false,
    isSandbox: true,
    activationState: "SANDBOX",
    autoInvoiceEnabled: false,
    pilotOrderAllowlist: "",
    prodClientId: "",
    prodInvoiceSeries: "",
    prodTemplateCode: "",
    prodTaxAuthorityApprovedDate: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsEInvoiceSubTab, setSettingsEInvoiceSubTab] = useState<"sandbox" | "production">("sandbox");
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showEinvoiceSecret, setShowEinvoiceSecret] = useState(false);
  const [showProdClientSecret, setShowProdClientSecret] = useState(false);
  const [editingSepayWebhookSecret, setEditingSepayWebhookSecret] = useState(false);
  const [newSepayWebhookSecret, setNewSepayWebhookSecret] = useState("");
  const [editingSepayApiKey, setEditingSepayApiKey] = useState(false);
  const [newSepayApiKey, setNewSepayApiKey] = useState("");
  const [editingSandboxClientSecret, setEditingSandboxClientSecret] = useState(false);
  const [newSandboxClientSecret, setNewSandboxClientSecret] = useState("");
  const [editingProdClientSecret, setEditingProdClientSecret] = useState(false);
  const [newProdClientSecret, setNewProdClientSecret] = useState("");
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);
  const [approvingPilotOrderId, setApprovingPilotOrderId] = useState<string | null>(null);
  const [transitioningState, setTransitioningState] = useState(false);
  const [testingEinvoice, setTestingEinvoice] = useState(false);
  const [einvoiceTestResult, setEinvoiceTestResult] = useState<EinvoiceConnectionTestResult | null>(null);

  // Live Providers & Go-Live Readiness State
  const [liveProviders, setLiveProviders] = useState<ProviderAccountDto[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [readinessReport, setReadinessReport] = useState<GoLiveReadinessReport | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [issuingDraftId, setIssuingDraftId] = useState<string | null>(null);
  const [isManualProviderOverride, setIsManualProviderOverride] = useState(false);

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
    { value: "STANDALONE_PAYMENT", label: "Thu qua QR tĩnh" },
    { value: "UNMATCHED", label: "Cần đối soát (UNMATCHED)" },
    { value: "PARTIAL_PAYMENT", label: "Đóng một phần / đặt cọc" },
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
      id: order.invoiceId ? order.invoiceId.toString() : order.id,
      orderId: order.id,
      orderCode: order.orderCode,
      referenceCode: `INV-${order.orderCode}`,
      productName: "Đóng học phí đào tạo IELTS",
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.amount,
      buyerType: order.buyerType || "PERSONAL",
      invoiceCompanyName: order.invoiceCompanyName,
      invoiceTaxCode: order.invoiceTaxCode,
      invoiceTemplate: order.invoiceTemplate || settings.einvoiceTemplateCode || "2",
      invoiceSeries: order.invoiceSeries || settings.einvoiceInvoiceSeries || settings.einvoiceSeries || "2C26TLN",
      invoiceNumber: order.invoiceNumber,
      cqtCode: order.cqtCode,
      lookupUrl: order.lookupUrl,
      pdfUrl: order.pdfUrl,
      status: (order.invoiceStatus as any) || (order.invoiceNumber ? "ISSUED" : "PENDING_ISSUE"),
      retryCount: 0,
      issuedAt: order.paidAt || order.createdAt,
      createdAt: order.createdAt,
      courseTitle: order.courseTitle,
      invoiceAddress: order.invoiceAddress,
    } as any);
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

    const isIssued = ("status" in inv && inv.status === "ISSUED") || ("invoiceStatus" in inv && inv.invoiceStatus === "ISSUED") || Boolean("invoiceNumber" in inv && inv.invoiceNumber);
    const invNumber = ("invoiceNumber" in inv && inv.invoiceNumber) ? inv.invoiceNumber : "";
    const orderCode = inv.orderCode || "";
    const customerName = inv.customerName || "Bán cho người tiêu dùng";
    const amount = inv.amount || 0;
    const invSeries = ("invoiceSeries" in inv && inv.invoiceSeries) ? inv.invoiceSeries : (settings.einvoiceInvoiceSeries || settings.einvoiceSeries || "2C26TLN");
    const cqtCode = ("cqtCode" in inv && inv.cqtCode) ? inv.cqtCode : "";
    const company = "invoiceCompanyName" in inv && inv.invoiceCompanyName ? inv.invoiceCompanyName : "";
    const taxCode = "invoiceTaxCode" in inv && inv.invoiceTaxCode ? inv.invoiceTaxCode : "";
    const address = "invoiceAddress" in inv && inv.invoiceAddress ? inv.invoiceAddress : "";
    const invoiceProductName = "productName" in inv && inv.productName
      ? inv.productName
      : "Đóng học phí đào tạo IELTS";
    const issuedDateRaw = ("issuedAt" in inv && inv.issuedAt ? inv.issuedAt : "") || ("paidAt" in inv && inv.paidAt ? inv.paidAt : "") || inv.createdAt || "";
    const dObj = issuedDateRaw ? new Date(issuedDateRaw) : new Date();
    const dayStr = String(dObj.getDate()).padStart(2, "0");
    const monthStr = String(dObj.getMonth() + 1).padStart(2, "0");
    const yearStr = dObj.getFullYear();
    const lookupCode = ("lookupCode" in inv && inv.lookupCode) ? inv.lookupCode : (("referenceCode" in inv && inv.referenceCode) ? inv.referenceCode : "");
    const amountStr = amount.toLocaleString("vi-VN");
    const amountWords = formatVietnameseMoneyWords(amount);
    const isSandbox = !settings.activationState || settings.activationState === "SANDBOX";

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${isIssued ? `Hóa đơn bán hàng số ${invNumber}` : `Bản xem trước Hóa đơn - Đơn ${orderCode}`}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm 12mm; }
              * { box-sizing: border-box; }
              body { font-family: "Times New Roman", Times, serif; color: #0f172a; margin: 0; padding: 12px; font-size: 11px; line-height: 1.35; background: #fff; position: relative; }
              .invoice-wrapper { border: 2.5px solid #0284c7; padding: 14px; border-radius: 4px; position: relative; max-width: 800px; margin: auto; }
              .inner-box { border: 1px solid #7dd3fc; padding: 12px; position: relative; }
              .watermark { position: absolute; top: 35%; left: 8%; right: 8%; text-align: center; transform: rotate(-25deg); border: 3px dashed rgba(225, 29, 72, 0.25); background: rgba(225, 29, 72, 0.03); padding: 16px; border-radius: 12px; color: rgba(225, 29, 72, 0.25); font-family: sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 3px; pointer-events: none; z-index: 100; text-transform: uppercase; }
              .header-grid { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
              .header-left { width: 100px; }
              .header-center { flex: 1; text-align: center; }
              .title-text { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #c52828; letter-spacing: 0.5px; }
              .title-sub { font-size: 10px; color: #b45309; font-weight: 600; margin-top: 2px; }
              .title-date { font-size: 11px; color: #475569; margin-top: 2px; }
              .header-right { display: flex; align-items: flex-start; gap: 8px; font-family: monospace; font-size: 10.5px; text-align: right; }
              .qr-box { width: 56px; height: 56px; border: 1px solid #cbd5e1; padding: 2px; }
              .qr-placeholder { width: 56px; height: 56px; border: 1px dashed #cbd5e1; padding: 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7.5px; color: #94a3b8; text-align: center; }
              .cqt-line { font-family: monospace; font-size: 10.5px; border-bottom: 1px solid #cbd5e1; padding: 4px 0; margin-bottom: 6px; }
              .info-sec { font-size: 10.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px; line-height: 1.45; }
              table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10px; }
              th, td { border: 1px solid #94a3b8; padding: 4px 5px; }
              th { background-color: #f8fafc; font-weight: bold; text-align: center; }
              .sub-th th { font-size: 8.5px; color: #64748b; font-weight: normal; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .words-sec { font-size: 11px; margin-top: 6px; }
              .sig-grid { display: flex; justify-content: space-between; margin-top: 14px; font-size: 10.5px; text-align: center; }
              .sig-box { width: 48%; }
              .stamp-box { border: 1px solid #d32f2f; background: #fff; color: #c62828; padding: 6px 10px; font-size: 9.5px; width: 210px; margin: 6px auto 0; text-align: left; position: relative; }
              .stamp-placeholder { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 6px 10px; font-size: 9px; width: 210px; margin: 6px auto 0; text-align: center; }
              .stamp-check { position: absolute; right: 10px; top: 12px; color: #059669; font-weight: 900; font-size: 24px; line-height: 1; }
              .footer-note { border-top: 1px solid #cbd5e1; margin-top: 14px; padding-top: 6px; text-align: center; font-size: 8.5px; color: #64748b; line-height: 1.35; }
              @media print {
                body { padding: 0; }
                .invoice-wrapper { border: 2px solid #0284c7; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-wrapper">
              <div class="inner-box">
                ${!isIssued ? `
                  <div class="watermark">
                    ${isSandbox ? "SANDBOX — CHƯA PHÁT HÀNH" : "CHƯA PHÁT HÀNH"}<br>
                    <span style="font-size: 12px; letter-spacing: 1px;">BẢN NHÁP &bull; KHÔNG CÓ GIÁ TRỊ PHÁT HÀNH</span>
                  </div>
                ` : (isSandbox ? `
                  <div class="watermark" style="border-color: rgba(217, 119, 6, 0.25); color: rgba(217, 119, 6, 0.25); background: rgba(217, 119, 6, 0.03);">
                    SANDBOX — HÓA ĐƠN THỬ NGHIỆM
                  </div>
                ` : "")}

                <div class="header-grid">
                  <div class="header-left"></div>
                  <div class="header-center">
                    <div class="title-text">HÓA ĐƠN BÁN HÀNG</div>
                    ${!isIssued ? `<div class="title-sub">(Bản xem trước — Hóa đơn chưa phát hành)</div>` : ""}
                    <div class="title-date">${isIssued ? "Ngày" : "Ngày dự kiến:"} ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
                  </div>
                  <div class="header-right">
                    <div>
                      <div>${isIssued ? "Ký hiệu:" : "Ký hiệu dự kiến:"} <b>${invSeries}</b></div>
                      <div>Số: ${isIssued ? `<b style="color: #c52828;">${invNumber}</b>` : `<i style="color: #94a3b8;">(Chưa cấp)</i>`}</div>
                    </div>
                    ${isIssued ? `
                      <svg viewBox="0 0 100 100" class="qr-box">
                        <rect width="100" height="100" fill="white" />
                        <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
                        <rect x="9" y="9" width="20" height="20" fill="white" />
                        <rect x="13" y="13" width="12" height="12" fill="#0f172a" />
                        <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
                        <rect x="71" y="9" width="20" height="20" fill="white" />
                        <rect x="75" y="13" width="12" height="12" fill="#0f172a" />
                        <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
                        <rect x="9" y="71" width="20" height="20" fill="white" />
                        <rect x="13" y="75" width="12" height="12" fill="#0f172a" />
                        <rect x="38" y="8" width="6" height="6" fill="#0f172a" />
                        <rect x="48" y="14" width="6" height="6" fill="#0f172a" />
                        <rect x="40" y="24" width="6" height="6" fill="#0f172a" />
                        <rect x="52" y="26" width="6" height="6" fill="#0f172a" />
                        <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
                        <rect x="22" y="44" width="6" height="6" fill="#0f172a" />
                        <rect x="36" y="38" width="6" height="6" fill="#0f172a" />
                        <rect x="48" y="44" width="6" height="6" fill="#0f172a" />
                        <rect x="60" y="38" width="6" height="6" fill="#0f172a" />
                        <rect x="72" y="44" width="6" height="6" fill="#0f172a" />
                        <rect x="84" y="38" width="6" height="6" fill="#0f172a" />
                        <rect x="40" y="54" width="6" height="6" fill="#0f172a" />
                        <rect x="54" y="58" width="6" height="6" fill="#0f172a" />
                        <rect x="66" y="54" width="6" height="6" fill="#0f172a" />
                        <rect x="78" y="60" width="6" height="6" fill="#0f172a" />
                        <rect x="38" y="70" width="6" height="6" fill="#0f172a" />
                        <rect x="52" y="74" width="6" height="6" fill="#0f172a" />
                        <rect x="64" y="70" width="6" height="6" fill="#0f172a" />
                        <rect x="78" y="76" width="6" height="6" fill="#0f172a" />
                        <rect x="44" y="86" width="6" height="6" fill="#0f172a" />
                        <rect x="58" y="90" width="6" height="6" fill="#0f172a" />
                        <rect x="72" y="86" width="6" height="6" fill="#0f172a" />
                        <rect x="84" y="90" width="6" height="6" fill="#0f172a" />
                      </svg>
                    ` : `
                      <div class="qr-placeholder">
                        <b>Mã QR CQT</b>
                        <span>(Sẽ tạo khi phát hành)</span>
                      </div>
                    `}
                  </div>
                </div>

                <div class="cqt-line">
                  <span style="font-family: 'Times New Roman', serif;">Mã CQT : </span>
                  ${isIssued && cqtCode ? `<b>${cqtCode}</b>` : `<i style="color: #94a3b8; font-family: sans-serif;">(Chưa cấp — Cơ quan Thuế sẽ cấp mã sau khi xác nhận thanh toán)</i>`}
                </div>

                <div class="info-sec">
                  <div>Đơn vị bán hàng: <b>${settings.sellerName || "HỘ KINH DOANH LUYỆN NÓI"}</b></div>
                  <div>Mã số thuế: <b>${settings.sellerTaxCode || "052098014618"}</b></div>
                  <div>Địa chỉ: ${settings.sellerAddress || "Đường Tôn Đức Thắng, P. Hoà Khánh, TP. Đà Nẵng, Việt Nam"}</div>
                  <div style="display: flex; gap: 20px;">
                    <div>Điện thoại: ${settings.sellerPhone || "—"}</div>
                    <div>Số tài khoản: ${settings.sepayAccountNumber || "—"}</div>
                  </div>
                </div>

                <div class="info-sec">
                  <div>Họ tên người mua hàng: <b>${customerName}</b></div>
                  ${company ? `<div>Tên đơn vị: <b>${company}</b></div>` : ""}
                  <div>Địa chỉ: ${address || "—"}</div>
                  <div style="display: flex; justify-content: space-between;">
                    <div>Mã số thuế: <b>${taxCode || "—"}</b></div>
                    <div>Hình thức thanh toán: <b>CK (VietQR)</b></div>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <div>Đơn vị tiền tệ: <b>VND</b></div>
                    <div>Tỷ giá: <b>1 VNĐ</b></div>
                  </div>
                </div>

                <!-- 6-Column Clean Table -->
                <table>
                  <thead>
                    <tr>
                      <th style="width: 35px;">STT</th>
                      <th style="text-align: left;">Tên hàng hóa, dịch vụ</th>
                      <th style="width: 70px;">Đơn vị tính</th>
                      <th style="width: 60px;">Số lượng</th>
                      <th style="width: 100px; text-align: right;">Đơn giá</th>
                      <th style="width: 110px; text-align: right;">Thành tiền</th>
                    </tr>
                    <tr class="sub-th">
                      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6 = 4 x 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center font-bold">1</td>
                      <td class="text-left">${invoiceProductName}</td>
                      <td class="text-center">Khóa</td>
                      <td class="text-center font-bold">1</td>
                      <td class="text-right">${amountStr}</td>
                      <td class="text-right font-bold">${amountStr}</td>
                    </tr>
                    <tr style="height: 18px;"><td/><td/><td/><td/><td/><td/></tr>
                    <tr style="height: 18px;"><td/><td/><td/><td/><td/><td/></tr>
                    <tr style="height: 18px;"><td/><td/><td/><td/><td/><td/></tr>
                    <tr class="font-bold" style="background-color: #f8fafc;">
                      <td colspan="5" class="text-left">Tổng cộng</td>
                      <td class="text-right">${amountStr}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="words-sec">
                  <b>Số tiền viết bằng chữ: </b>
                  <i style="font-weight: 500;">${amountWords}.</i>
                </div>

                <div class="sig-grid">
                  <div class="sig-box">
                    <div class="font-bold">Người mua hàng</div>
                    <div style="font-size: 9px; color: #64748b; font-style: italic; margin-top: 2px;">(Ký, ghi rõ họ tên)</div>
                  </div>
                  <div class="sig-box">
                    <div class="font-bold">Người bán hàng</div>

                    ${isIssued ? `
                      <div class="stamp-box">
                        <div style="font-weight: bold;">Chữ ký có hiệu lực</div>
                        <div style="margin-top: 2px;">Ký bởi: ${settings.sellerName || "HỘ KINH DOANH LUYỆN NÓI"}</div>
                        <div style="font-family: monospace; font-size: 8.5px; margin-top: 2px;">Ký ngày: ${dayStr}/${monthStr}/${yearStr}</div>
                        <div class="stamp-check">&#x2713;</div>
                      </div>
                    ` : `
                      <div class="stamp-placeholder">
                        <b>Chữ ký số Người bán</b>
                        <div style="font-size: 8px; color: #b45309; margin-top: 2px;">(Sẽ ký điện tử sau khi thanh toán thành công)</div>
                        <div style="font-family: monospace; font-size: 8px; color: #94a3b8; margin-top: 4px;">Trạng thái: Chưa ký số</div>
                      </div>
                    `}
                  </div>
                </div>

                <div class="footer-note">
                  <i>${isIssued ? "(Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn)" : "(Bản xem trước — Cần kiểm tra, đối chiếu thông tin trước khi thu tiền)"}</i><br>
                  Cổng tra cứu: <span style="color: #0284c7;">https://sepay.vn/tra-cuu-hoa-don-dien-tu</span><br>
                  Mã tra cứu: ${isIssued && lookupCode ? `<b>${lookupCode}</b>` : `<i style="color: #94a3b8;">(Sẽ được cấp sau khi phát hành chính thức)</i>`}<br>
                  <span style="font-size: 8px; color: #94a3b8;">${isIssued ? "Trang 1/1" : "Bản xem trước &bull; Trang 1/1"}</span>
                </div>
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
    if (!createInvoiceForm.orderId) {
      setFeedback({
        type: "error",
        text: "Hóa đơn production chỉ được tạo từ giao dịch tiền vào đã xác thực. Không thể lập hóa đơn tự do trên giao diện.",
      });
      return;
    }

    const order = orders.find((item) => item.id === createInvoiceForm.orderId);
    if (!order?.invoiceId) {
      setFeedback({
        type: "error",
        text: "Đơn này chưa có giao dịch thanh toán để lập hóa đơn. Hãy chờ webhook SePay hoặc đối soát giao dịch trước.",
      });
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await apiFetch<InvoiceAdminDto>(`/admin/billing/invoices/${order.invoiceId}/retry`, {
        method: "POST",
      });

      setFeedback({
        type: res.status === "ISSUED" ? "success" : "info",
        text: res.status === "ISSUED"
          ? `Hóa đơn ${res.invoiceNumber || res.referenceCode} đã phát hành${res.cqtCode ? `, mã CQT ${res.cqtCode}` : ""}.`
          : `Đã gửi yêu cầu xử lý hóa đơn ${res.referenceCode || res.id}. Trạng thái hiện tại: ${res.status}.`,
      });
      await fetchOrders();
      await fetchInvoices();
      await fetchInvoiceStats();

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

  // 4. Fetch Settings & Live Providers
  const fetchLiveProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await apiFetch<ProviderAccountDto[]>("/admin/billing/settings/providers");
      if (Array.isArray(res)) {
        setLiveProviders(res);
      }
    } catch (err) {
      console.warn("Chưa thể tải danh sách providers từ SePay:", err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleCheckReadiness = async () => {
    setCheckingReadiness(true);
    try {
      const res = await apiFetch<GoLiveReadinessReport>("/admin/billing/production-readiness", {
        method: "POST",
      });
      setReadinessReport(res);
      setShowReadinessModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi kiểm tra mức độ sẵn sàng Go-Live";
      setFeedback({ type: "error", text: msg });
    } finally {
      setCheckingReadiness(false);
    }
  };

  const handleIssueDraftInvoice = async (orderOrInvoiceId: string) => {
    setIssuingDraftId(orderOrInvoiceId);
    try {
      await apiFetch<InvoiceAdminDto>(`/admin/billing/invoices/${orderOrInvoiceId}/issue`, {
        method: "POST",
      });
      setFeedback({
        type: "success",
        text: "Đã gửi lệnh phát hành hóa đơn chính thức lên SePay thành công!",
      });
      if (activeTab === "orders") fetchOrders();
      if (activeTab === "invoices") fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi phát hành hóa đơn nháp";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIssuingDraftId(null);
    }
  };

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
    fetchSettings();
    if (activeTab === "orders" || activeTab === "invoices") {
      fetchOrders();
      fetchInvoiceStats();
      fetchCoursesSummary();
    } else if (activeTab === "reconciliation") {
      fetchReconciliation();
    } else if (activeTab === "settings") {
      fetchLiveProviders();
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

  const openStaticQr = async () => {
    setStaticQrLoading(true);
    try {
      const response = await apiFetch<StaticQrResponse>("/admin/billing/static-qr");
      setStaticQr(response);
      setIsStaticQrModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không tải được QR tĩnh thu học phí";
      setFeedback({ type: "error", text: message });
    } finally {
      setStaticQrLoading(false);
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
      setFeedback({ type: "success", text: `Đã tạo đơn ${res.orderCode}! QR động đã khóa sẵn học phí và mã đơn.` });
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng tư vấn";
      setFeedback({ type: "error", text: msg });
    } finally {
      setCreateOrderSubmitting(false);
    }
  };

  const handleCreateOrderFromSplitPreview = async (data: {
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
  }) => {
    setCreateOrderForm((prev) => ({
      ...prev,
      courseId: data.courseId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      amount: data.amount ? data.amount.toString() : "",
      expiresInHours: data.expiresInHours,
      notes: data.notes || "",
      invoiceRequired: data.invoiceRequired,
      buyerType: data.buyerType,
      invoiceCompanyName: data.invoiceCompanyName || "",
      invoiceTaxCode: data.invoiceTaxCode || "",
      invoiceAddress: data.invoiceAddress || "",
      invoiceEmail: data.invoiceEmail || "",
    }));
    setCreateOrderSubmitting(true);
    setCreateOrderError(null);
    try {
      const res = await apiFetch<CheckoutResponse>("/admin/billing/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setCreatedOrderResult(res);
      setFeedback({
        type: "success",
        text: `Đã tạo đơn ${res.orderCode}! QR động đã khóa sẵn học phí và mã đơn.`,
      });
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng tư vấn";
      setFeedback({ type: "error", text: msg });
      setCreateOrderError(msg);
    } finally {
      setCreateOrderSubmitting(false);
    }
  };

  const generateZaloMessage = (res: CheckoutResponse, studentName: string, studentEmail: string) => {
    const course = res.courseTitle || res.courseName || "Khóa học IELTS";
    return `Dạ chào bạn ${studentName || "bạn"}, The IELTS Spells gửi bạn thông tin đăng ký và chuyển khoản học phí khóa học "${course}":
- Số tiền thanh toán: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(res.amount)}
- Ngân hàng: ${res.bankName}
- Số tài khoản: ${res.accountNumber}
- Chủ tài khoản: ${res.accountName}
- Nội dung chuyển khoản: ${res.transferContent}

(Đây là QR động: số tiền và mã đơn đã được điền sẵn. Bạn chỉ cần quét QR, kiểm tra thông tin và xác nhận chuyển khoản).
Khi hệ thống nhận đủ học phí, tài khoản và quyền vào khóa học sẽ được tự động kích hoạt qua email "${studentEmail}"; hóa đơn điện tử được lập tự động theo giao dịch ạ!`;
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

  const handleRecheckInvoice = async (id: string, isOrderId = false) => {
    setRetryingInvoiceId(id);
    try {
      const endpoint = isOrderId
        ? `/admin/billing/orders/${id}/recheck-invoice`
        : `/admin/billing/invoices/${id}/recheck`;
      await apiFetch(endpoint, { method: "POST" });
      setFeedback({ type: "success", text: "Đã kiểm tra và đồng bộ trạng thái từ SePay thành công!" });
      await Promise.all([fetchInvoices(), fetchOrders()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kiểm tra lại trạng thái";
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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSettingsSaving(true);
    try {
      const payload: BillingSettingsDto = {
        ...settings,
        sepayWebhookSecret: editingSepayWebhookSecret && newSepayWebhookSecret.trim() ? newSepayWebhookSecret.trim() : undefined,
        sepayApiKey: editingSepayApiKey && newSepayApiKey.trim() ? newSepayApiKey.trim() : undefined,
        einvoiceClientSecret: editingSandboxClientSecret && newSandboxClientSecret.trim() ? newSandboxClientSecret.trim() : undefined,
        prodClientSecret: editingProdClientSecret && newProdClientSecret.trim() ? newProdClientSecret.trim() : undefined,
        einvoiceInvoiceSeries: settings.einvoiceInvoiceSeries || settings.einvoiceSeries,
      };

      await apiFetch("/admin/billing/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback({ type: "success", text: "Đã lưu cấu hình SePay và e-Invoice thành công!" });
      setEditingSepayWebhookSecret(false);
      setNewSepayWebhookSecret("");
      setEditingSepayApiKey(false);
      setNewSepayApiKey("");
      setEditingSandboxClientSecret(false);
      setNewSandboxClientSecret("");
      setEditingProdClientSecret(false);
      setNewProdClientSecret("");
      fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu cấu hình";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleToggleKillSwitch = async (enabled: boolean) => {
    setTogglingKillSwitch(true);
    try {
      const res = await apiFetch<BillingSettingsDto>(`/admin/billing/settings/toggle-auto-invoice?enabled=${enabled}`, {
        method: "POST",
      });
      setSettings((prev) => ({ ...prev, ...res }));
      setFeedback({
        type: enabled ? "success" : "info",
        text: enabled
          ? "Đã BẬT phát hành HĐĐT tự động."
          : "Đã TẮT phát hành HĐĐT tự động (Kill-Switch kích hoạt). Hệ thống sẽ không phát hành HĐĐT tự động cho các đơn mới.",
      });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Lỗi chuyển đổi Kill-switch" });
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  const handleApprovePilot = async (orderId: string) => {
    setApprovingPilotOrderId(orderId);
    try {
      await apiFetch<OrderAdminDto>(`/admin/billing/orders/${orderId}/approve-pilot`, {
        method: "POST",
      });
      setFeedback({ type: "success", text: "Đã phê duyệt đơn hàng tham gia đợt Pilot xuất hóa đơn thật!" });
      fetchOrders();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Lỗi phê duyệt pilot cho đơn hàng" });
    } finally {
      setApprovingPilotOrderId(null);
    }
  };

  const handleTransitionActivationState = async (targetState: string) => {
    let explicitAdminConfirmation = false;
    if (targetState === "PRODUCTION_ACTIVE") {
      const confirmed = window.confirm(
        "XÁC NHẬN KÍCH HOẠT GO-LIVE PRODUCTION:\n\n" +
        "1. Đợt kiểm thử Pilot phát hành hóa đơn thật bắt buộc phải đạt PASSED (7/7 tiêu chí).\n" +
        "2. Toàn bộ tiêu chí Go-Live Readiness không còn lỗi FAIL nào.\n" +
        "3. Khi kích hoạt, mọi giao dịch thành công sẽ phát hành hóa đơn thật lên Cơ quan Thuế.\n\n" +
        "Bạn có xác nhận thực hiện thao tác kích hoạt PRODUCTION_ACTIVE không?"
      );
      if (!confirmed) return;
      explicitAdminConfirmation = true;
    }
    setTransitioningState(true);
    try {
      const res = await apiFetch<BillingSettingsDto>(
        `/admin/billing/settings/transition-state?targetState=${targetState}&explicitAdminConfirmation=${explicitAdminConfirmation}`,
        {
          method: "POST",
        }
      );
      setSettings((prev) => ({ ...prev, ...res }));
      setFeedback({
        type: "success",
        text: `Đã chuyển đổi trạng thái môi trường sang: ${targetState}`,
      });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Lỗi chuyển trạng thái kích hoạt" });
    } finally {
      setTransitioningState(false);
    }
  };

  const handleTestEinvoice = async () => {
    setTestingEinvoice(true);
    setEinvoiceTestResult(null);
    try {
      // First save current inputs so backend tests with the newly entered credentials
      const payload: BillingSettingsDto = {
        ...settings,
        sepayWebhookSecret: editingSepayWebhookSecret && newSepayWebhookSecret.trim() ? newSepayWebhookSecret.trim() : undefined,
        sepayApiKey: editingSepayApiKey && newSepayApiKey.trim() ? newSepayApiKey.trim() : undefined,
        einvoiceClientSecret: editingSandboxClientSecret && newSandboxClientSecret.trim() ? newSandboxClientSecret.trim() : undefined,
        prodClientSecret: editingProdClientSecret && newProdClientSecret.trim() ? newProdClientSecret.trim() : undefined,
        einvoiceInvoiceSeries: settings.einvoiceInvoiceSeries || settings.einvoiceSeries,
      };

      await apiFetch("/admin/billing/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
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
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã phát hành
          </span>
        );
      case "PAID":
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
      case "CREATING":
      case "PROCESSING":
      case "ISSUING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Đang xử lý (Chờ SePay)
          </span>
        );
      case "UNKNOWN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Cần kiểm tra với SePay
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Bản nháp
          </span>
        );
      case "PARTIAL_PAYMENT":
      case "UNDERPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Đã nhận một phần
          </span>
        );
      case "STANDALONE_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Thu QR tĩnh · Đã xếp HĐ
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
                onClick={openStaticQr}
                disabled={staticQrLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-cyan-600 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                title="QR tài khoản doanh nghiệp dùng lâu dài, không cần tạo đơn"
              >
                {staticQrLoading ? <SpinnerGap size={14} className="animate-spin" /> : <QrCode size={14} weight="bold" />}
                <span>QR tĩnh · Thu học phí</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setCreatedOrderResult(null);
                  fetchCoursesSummary();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary hover:opacity-90 active:scale-95 text-on-primary text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Tạo đơn học viên và QR động để tự động kích hoạt khóa học"
              >
                <Receipt size={14} weight="bold" />
                <span>+ QR động · Đăng ký vào học</span>
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
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="font-mono font-bold text-primary hover:underline cursor-pointer text-left"
                              title="Xem chi tiết đơn hàng"
                            >
                              {ord.orderCode}
                            </button>
                            {ord.pilotApproved && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                <RocketLaunch size={9} weight="bold" />
                                Pilot
                              </span>
                            )}
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
                                  Đã phát hành
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
                              {ord.cqtCode ? (
                                <div className="font-mono text-[10px] text-gray-600 dark:text-gray-300 mt-1 tracking-tight flex items-center gap-1">
                                  <span className="truncate max-w-[120px] bg-emerald-500/10 text-emerald-700 px-1 py-0.2 rounded font-semibold">
                                    CQT: {ord.cqtCode}
                                  </span>
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
                              ) : (
                                <div className="text-[10px] text-on-surface-variant/70 mt-0.5 italic">
                                  HĐ không mã CQT
                                </div>
                              )}
                            </div>
                          ) : (ord.reconciliationStatus === "PENDING" || ord.invoiceErrorCategory === "RECONCILABLE") ? (
                            <div>
                              <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                Đang đối soát
                              </span>
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                Đang xác thực với SePay
                              </div>
                            </div>
                          ) : ord.invoiceStatus === "FAILED" ? (
                            <div>
                              <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#ef4444] text-white">
                                {ord.invoiceErrorCategory === "REQUIRES_ACTION" ? "Cần xử lý" : "Lỗi cấp mã"}
                              </span>
                              {ord.invoiceErrorCategory === "REQUIRES_ACTION" ? (
                                <div className="text-[10px] text-rose-600 mt-0.5 font-medium" title="Vui lòng nạp thêm quota hoặc kiểm tra phê duyệt trên SePay">
                                  Cần xử lý nguyên nhân
                                </div>
                              ) : ord.invoiceErrorCategory === "NON_RETRYABLE" ? (
                                <div className="text-[10px] text-slate-500 mt-0.5 italic">
                                  Lỗi không thể thử lại
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRetryInvoice(ord.id, true)}
                                  disabled={retryingInvoiceId === ord.id}
                                  className="block text-[10.5px] font-bold text-primary hover:underline mt-0.5 cursor-pointer disabled:opacity-50"
                                >
                                  {retryingInvoiceId === ord.id ? "Đang xử lý..." : "Thử phát hành lại"}
                                </button>
                              )}
                            </div>
                          ) : ord.invoiceStatus === "DRAFT" ? (
                            <div>
                              <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                Hóa đơn nháp
                              </span>
                              <button
                                type="button"
                                onClick={() => handleIssueDraftInvoice(ord.id)}
                                disabled={issuingDraftId === ord.id}
                                className="block text-[10.5px] font-bold text-emerald-600 hover:underline mt-0.5 cursor-pointer disabled:opacity-50"
                              >
                                {issuingDraftId === ord.id ? "Đang gửi CQT..." : "⚡ Phát hành CQT"}
                              </button>
                            </div>
                          ) : ord.invoiceStatus === "UNKNOWN" ? (
                            <div>
                              <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                Cần kiểm tra với SePay
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRecheckInvoice(ord.id, true)}
                                disabled={retryingInvoiceId === ord.id}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline mt-0.5 cursor-pointer disabled:opacity-50"
                              >
                                <MagnifyingGlass size={11} />
                                <span>{retryingInvoiceId === ord.id ? "Đang tra cứu..." : "Kiểm tra lại trạng thái"}</span>
                              </button>
                            </div>
                          ) : ord.invoiceStatus === "PENDING_ISSUE" || ord.invoiceStatus === "CREATING" || ord.invoiceStatus === "PROCESSING" || ord.invoiceStatus === "ISSUING" ? (
                            <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                              Đang xử lý ({ord.invoiceStatus === "ISSUING" ? "Phát hành" : "Chờ SePay"})
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
                              onClick={() => {
                                if (ord.invoiceStatus === "ISSUED" || ord.invoiceNumber) {
                                  openInvoiceDetailFromOrder(ord);
                                } else {
                                  setSelectedOrder(ord);
                                }
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition cursor-pointer"
                              title={ord.invoiceStatus === "ISSUED" || ord.invoiceNumber ? "Xem tờ Hóa đơn điện tử CQT" : "Xem chi tiết đơn hàng"}
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
                              <div className="absolute right-0 mt-1 hidden group-hover:block z-50 w-52 rounded-xl border border-outline-variant/30 bg-surface p-1.5 shadow-xl text-left text-xs animate-in fade-in duration-100">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(ord)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface hover:bg-surface-container transition font-medium cursor-pointer"
                                >
                                  <FileText size={13} className="text-primary" />
                                  <span>Xem chi tiết đơn hàng</span>
                                </button>
                                {(ord.invoiceStatus === "ISSUED" || ord.invoiceNumber) && (
                                  <button
                                    type="button"
                                    onClick={() => openInvoiceDetailFromOrder(ord)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition font-medium cursor-pointer"
                                  >
                                    <Receipt size={13} className="text-blue-600" />
                                    <span>Xem tờ Hóa đơn điện tử</span>
                                  </button>
                                )}
                                {!ord.pilotApproved && (
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePilot(ord.id)}
                                    disabled={approvingPilotOrderId === ord.id}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition font-medium disabled:opacity-50 cursor-pointer"
                                  >
                                    <RocketLaunch size={13} weight="bold" />
                                    <span>{approvingPilotOrderId === ord.id ? "Đang duyệt..." : "Duyệt Pilot xuất HĐ thật"}</span>
                                  </button>
                                )}
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
                                {ord.invoiceStatus === "DRAFT" && (
                                  <button
                                    type="button"
                                    onClick={() => handleIssueDraftInvoice(ord.id)}
                                    disabled={issuingDraftId === ord.id}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition font-medium disabled:opacity-50"
                                  >
                                    <CheckCircle size={13} />
                                    <span>{issuingDraftId === ord.id ? "Đang phát hành..." : "Phát hành hóa đơn CQT"}</span>
                                  </button>
                                )}
                                {ord.invoiceStatus === "UNKNOWN" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRecheckInvoice(ord.id, true)}
                                    disabled={retryingInvoiceId === ord.id}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition font-medium disabled:opacity-50"
                                  >
                                    <MagnifyingGlass size={13} />
                                    <span>{retryingInvoiceId === ord.id ? "Đang tra cứu..." : "Kiểm tra lại trạng thái với SePay"}</span>
                                  </button>
                                )}
                                {(ord.reconciliationStatus === "PENDING" || ord.invoiceErrorCategory === "RECONCILABLE") ? (
                                  <div className="px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg font-medium">
                                    Đang đối soát với SePay (không retry)
                                  </div>
                                ) : ord.invoiceStatus === "FAILED" && (
                                  ord.invoiceErrorCategory === "REQUIRES_ACTION" ? (
                                    <div className="px-2.5 py-1.5 text-[11px] text-rose-600 bg-rose-50 rounded-lg">
                                      Cần xử lý nguyên nhân trước khi thử lại
                                    </div>
                                  ) : ord.invoiceErrorCategory === "NON_RETRYABLE" ? (
                                    <div className="px-2.5 py-1.5 text-[11px] text-slate-500 italic">
                                      Lỗi cấu trúc không thể thử lại
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRetryInvoice(ord.id, true)}
                                      disabled={retryingInvoiceId === ord.id}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition font-medium disabled:opacity-50"
                                    >
                                      <ArrowClockwise size={13} />
                                      <span>{retryingInvoiceId === ord.id ? "Đang xử lý..." : "Thử lại cấp mã CQT"}</span>
                                    </button>
                                  )
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
                          {tx.payerName && (
                            <div className="font-semibold text-on-surface text-xs mb-1">Người mua: {tx.payerName}</div>
                          )}
                          <span className="font-mono text-xs px-2 py-1 rounded bg-surface-container-high text-on-surface block break-all">
                            {tx.transferContent}
                          </span>
                          {tx.accumulatedAmount != null && tx.orderId && (
                            <div className="text-[11px] text-on-surface-variant mt-1">
                              Đã cộng dồn: {formatVnd(tx.accumulatedAmount)}
                            </div>
                          )}
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
                          {tx.status === "UNMATCHED" && (
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
        <div className="max-w-4xl space-y-5">
          {/* Emergency Kill-Switch Banner */}
          {settings.autoInvoiceEnabled === false && (
            <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-3">
                <Power size={26} weight="bold" className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span>EMERGENCY KILL-SWITCH ĐANG KÍCH HOẠT — TỰ ĐỘNG PHÁT HÀNH HÓA ĐƠN ĐÃ TẮT</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      Safe Mode
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                    Hệ thống đang tạm ngừng gọi API SePay eInvoice tự động. Mọi giao dịch VietQR thanh toán thành công vẫn được ghi nhận và cấp quyền truy cập khóa học bình thường, nhưng hóa đơn điện tử sẽ được giữ ở trạng thái <strong>Chờ phát hành (PENDING_ISSUE)</strong> để quản trị viên kiểm tra an toàn trước khi xuất.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleKillSwitch(true)}
                disabled={togglingKillSwitch}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {togglingKillSwitch ? "Đang xử lý..." : "Khôi phục phát hành tự động"}
              </button>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* ----------------------------------------------------------------- */}
            {/* Card A: SePay Payment Gateway */}
            {/* ----------------------------------------------------------------- */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <CreditCard size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Card A: Cổng thanh toán SePay VietQR (Tài khoản nhận tiền & Webhook)</h3>
                  <p className="text-xs text-on-surface-variant">Cấu hình tài khoản ngân hàng nhận học phí và xác thực Webhook Napas247</p>
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
                    placeholder={settings.maskedSepayAccountNumber || "VD: 0987654321"}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                  {settings.maskedSepayAccountNumber && (
                    <div className="mt-1 text-[11px] text-on-surface-variant">
                      Số TK hiện tại: <span className="font-mono font-semibold">{settings.maskedSepayAccountNumber}</span>
                    </div>
                  )}
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

              {/* Webhook Secret */}
              <div className="pt-2 border-t border-outline-variant/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-on-surface">
                    SePay Webhook API Key (Authorization: Apikey)
                  </label>
                  {settings.sepayWebhookSecretConfigured && (
                    <button
                      type="button"
                      onClick={() => setEditingSepayWebhookSecret(!editingSepayWebhookSecret)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <LockKey size={13} weight="bold" />
                      {editingSepayWebhookSecret ? "Giữ nguyên secret hiện tại" : "Thay đổi Secret"}
                    </button>
                  )}
                </div>

                {settings.sepayWebhookSecretConfigured && !editingSepayWebhookSecret ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-2">
                      <LockKey size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold tracking-wider">
                        ••••••••••••••••••••••••••••••••
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      Đã mã hóa AES-256-GCM
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showWebhookSecret ? "text" : "password"}
                      value={newSepayWebhookSecret}
                      onChange={(e) => setNewSepayWebhookSecret(e.target.value)}
                      placeholder={settings.sepayWebhookSecretConfigured ? "Nhập secret token mới để thay thế..." : "Nhập secret token cấu hình tại SePay Dashboard..."}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                    >
                      {showWebhookSecret ? <EyeSlash size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                )}
                <div className="mt-1 text-[11px] text-on-surface-variant">
                  Địa chỉ Webhook trên hệ thống: <code className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-primary">https://your-domain.com/api/v1/webhooks/sepay</code>
                </div>
              </div>

              {/* SePay API Key (Optional) */}
              <div className="pt-2 border-t border-outline-variant/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-on-surface">
                    SePay API Key (Tra cứu & Đối soát giao dịch)
                  </label>
                  {settings.sepayApiKeyConfigured && (
                    <button
                      type="button"
                      onClick={() => setEditingSepayApiKey(!editingSepayApiKey)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <LockKey size={13} weight="bold" />
                      {editingSepayApiKey ? "Giữ nguyên API Key hiện tại" : "Thay đổi API Key"}
                    </button>
                  )}
                </div>

                {settings.sepayApiKeyConfigured && !editingSepayApiKey ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-2">
                      <LockKey size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
                        {settings.maskedSepayApiKey || "••••••••••••••••"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      Đã cấu hình
                    </span>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={newSepayApiKey}
                    onChange={(e) => setNewSepayApiKey(e.target.value)}
                    placeholder={settings.sepayApiKeyConfigured ? "Nhập API Key mới để thay thế..." : "Nhập SePay API Key..."}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                  />
                )}
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* Card B: SePay eInvoice API Gateway (Dual-Context) */}
            {/* ----------------------------------------------------------------- */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={20} className="text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Card B: SePay eInvoice API (Dual-Context độc lập Sandbox & Production)</h3>
                    <p className="text-xs text-on-surface-variant">Tách biệt hoàn toàn định danh & chứng thư giữa môi trường Thử nghiệm và Sản xuất</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant font-medium">Kích hoạt:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    settings.activationState === "PRODUCTION_ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : settings.activationState === "PRODUCTION_PILOT"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                      : settings.activationState?.startsWith("PRODUCTION")
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      settings.activationState === "PRODUCTION_ACTIVE"
                        ? "bg-emerald-500"
                        : settings.activationState === "PRODUCTION_PILOT"
                        ? "bg-purple-500"
                        : settings.activationState?.startsWith("PRODUCTION")
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`} />
                    {settings.activationState || "SANDBOX"}
                  </span>
                </div>
              </div>

              {/* Subtabs for Sandbox vs Production Configuration */}
              <div className="flex border-b border-outline-variant/20 gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsEInvoiceSubTab("sandbox")}
                  className={`pb-2 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    settingsEInvoiceSubTab === "sandbox"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span>🧪 Cấu hình Sandbox (Thử nghiệm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsEInvoiceSubTab("production")}
                  className={`pb-2 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    settingsEInvoiceSubTab === "production"
                      ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <RocketLaunch size={14} weight="bold" />
                  <span>🚀 Cấu hình Production (Chính thức)</span>
                </button>
              </div>

              {/* Subtab Content: Sandbox */}
              {settingsEInvoiceSubTab === "sandbox" && (
                <div className="space-y-4 pt-1">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                    <span>
                      <strong>Môi trường Sandbox:</strong> Sử dụng để kiểm thử tích hợp phát hành HĐĐT. Không gửi dữ liệu lên Cơ quan Thuế thật.
                    </span>
                    <span className="font-mono text-[11px] bg-surface/60 px-2 py-0.5 rounded border border-amber-500/30">
                      https://einvoice-api-sandbox.sepay.vn
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Sandbox Client ID *
                      </label>
                      <input
                        type="text"
                        value={settings.einvoiceClientId || ""}
                        onChange={(e) => setSettings({ ...settings, einvoiceClientId: e.target.value })}
                        placeholder={settings.maskedEinvoiceClientId || "VD: EINV-TEST-EB0HM0MMQW9LMZHP"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                      />
                      {settings.maskedEinvoiceClientId && (
                        <div className="mt-1 text-[11px] text-on-surface-variant">
                          Client ID hiện tại: <span className="font-mono font-semibold">{settings.maskedEinvoiceClientId}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-on-surface">
                          Sandbox Client Secret *
                        </label>
                        {settings.einvoiceClientSecretConfigured && (
                          <button
                            type="button"
                            onClick={() => setEditingSandboxClientSecret(!editingSandboxClientSecret)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <LockKey size={13} weight="bold" />
                            {editingSandboxClientSecret ? "Giữ nguyên secret" : "Thay đổi Secret"}
                          </button>
                        )}
                      </div>

                      {settings.einvoiceClientSecretConfigured && !editingSandboxClientSecret ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                          <div className="flex items-center gap-2">
                            <LockKey size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
                              ••••••••••••••••••••••••••••••••
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Đã mã hóa AES-256
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showEinvoiceSecret ? "text" : "password"}
                            value={newSandboxClientSecret}
                            onChange={(e) => setNewSandboxClientSecret(e.target.value)}
                            placeholder={settings.einvoiceClientSecretConfigured ? "Nhập client secret mới để thay thế..." : "Nhập secret key eInvoice..."}
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
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-on-surface">
                          Sandbox Provider Account ID *
                        </label>
                        <div className="flex items-center gap-2">
                          {liveProviders.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsManualProviderOverride(!isManualProviderOverride)}
                              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              {isManualProviderOverride ? "Dùng danh sách SePay" : "Nhập tay"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={fetchLiveProviders}
                            disabled={loadingProviders}
                            className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition cursor-pointer"
                          >
                            {loadingProviders ? "Đang tải..." : "🔄 Làm mới"}
                          </button>
                        </div>
                      </div>

                      {!isManualProviderOverride && liveProviders.length > 0 ? (
                        <select
                          value={settings.einvoiceProviderAccountId || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const prov = liveProviders.find((p) => p.id === selectedId);
                            setSettings((prev) => ({
                              ...prev,
                              einvoiceProviderAccountId: selectedId,
                              taxAuthorityApprovedDate: prov?.taxAuthorityApprovedDate,
                              einvoiceTemplateCode: prov?.templates?.[0]?.templateCode || prev.einvoiceTemplateCode,
                              einvoiceInvoiceSeries: prov?.templates?.[0]?.invoiceSeries || prev.einvoiceInvoiceSeries,
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition cursor-pointer"
                        >
                          <option value="">-- Chọn Provider Account từ SePay --</option>
                          {liveProviders.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.provider.toUpperCase()} (MST: {p.taxCode || "Chưa có"}) {p.active ? "• [Hoạt động]" : "• [Chưa kích hoạt]"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={settings.einvoiceProviderAccountId || ""}
                          onChange={(e) => setSettings({ ...settings, einvoiceProviderAccountId: e.target.value })}
                          placeholder="VD: f20729d6-b5d9-11f1-b21a-a6006ab65aca"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                        />
                      )}
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sandbox Test Connection Button & Result */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={handleTestEinvoice}
                      disabled={testingEinvoice || (!settings.einvoiceClientId && !settings.maskedEinvoiceClientId)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 active:scale-95 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {testingEinvoice ? (
                        <SpinnerGap size={16} className="animate-spin" />
                      ) : (
                        <ArrowClockwise size={16} weight="bold" />
                      )}
                      <span>{testingEinvoice ? "Đang kết nối SePay Sandbox..." : "⚡ Kiểm tra kết nối SePay Sandbox"}</span>
                    </button>
                  </div>

                  {einvoiceTestResult && (
                    <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition animate-in fade-in duration-200 ${
                      einvoiceTestResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                    }`}>
                      {einvoiceTestResult.success ? (
                        <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <WarningCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1.5 flex-1">
                        <div className="font-bold text-sm">
                          {einvoiceTestResult.success ? "Kết nối SePay eInvoice Sandbox thành công!" : "Kết nối Sandbox thất bại"}
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
              )}

              {/* Subtab Content: Production */}
              {settingsEInvoiceSubTab === "production" && (
                <div className="space-y-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
                    <ShieldWarning size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">Môi trường Sản xuất chính thức (Production):</div>
                      <p className="mt-1 leading-relaxed">
                        Mọi hóa đơn phát hành trong môi trường này đều được ký số bằng chứng thư số doanh nghiệp và gửi lên Tổng cục Thuế (CQT). Thông tin credentials được lưu trữ và mã hóa riêng biệt bằng AES-256-GCM, hoàn toàn không lẫn với Sandbox.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Production Client ID
                      </label>
                      <input
                        type="text"
                        value={settings.prodClientId || ""}
                        onChange={(e) => setSettings({ ...settings, prodClientId: e.target.value })}
                        placeholder={settings.maskedProdClientId || "VD: EINV-PROD-XXXXXXXXXXXX"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                      />
                      {settings.maskedProdClientId && (
                        <div className="mt-1 text-[11px] text-on-surface-variant">
                          Client ID hiện tại: <span className="font-mono font-semibold">{settings.maskedProdClientId}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-on-surface">
                          Production Client Secret
                        </label>
                        {settings.prodClientSecretConfigured && (
                          <button
                            type="button"
                            onClick={() => setEditingProdClientSecret(!editingProdClientSecret)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <LockKey size={13} weight="bold" />
                            {editingProdClientSecret ? "Giữ nguyên secret" : "Thay đổi Secret"}
                          </button>
                        )}
                      </div>

                      {settings.prodClientSecretConfigured && !editingProdClientSecret ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                          <div className="flex items-center gap-2">
                            <LockKey size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
                              ••••••••••••••••••••••••••••••••
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Đã mã hóa AES-256
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showProdClientSecret ? "text" : "password"}
                            value={newProdClientSecret}
                            onChange={(e) => setNewProdClientSecret(e.target.value)}
                            placeholder={settings.prodClientSecretConfigured ? "Nhập Production Client Secret mới..." : "Nhập Production Client Secret..."}
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProdClientSecret(!showProdClientSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                          >
                            {showProdClientSecret ? <EyeSlash size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Production Provider Account ID
                      </label>
                      <input
                        type="text"
                        value={settings.prodProviderAccountId || ""}
                        onChange={(e) => setSettings({ ...settings, prodProviderAccountId: e.target.value })}
                        placeholder="VD: UUID tài khoản Mắt Bão / MISA liên kết trên SePay Prod"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1.5">
                          Production Ký hiệu (Series)
                        </label>
                        <input
                          type="text"
                          value={settings.prodInvoiceSeries || ""}
                          onChange={(e) => setSettings({ ...settings, prodInvoiceSeries: e.target.value })}
                          placeholder="VD: 1C26TSE"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1.5">
                          Production Mẫu số (Template)
                        </label>
                        <input
                          type="text"
                          value={settings.prodTemplateCode || ""}
                          onChange={(e) => setSettings({ ...settings, prodTemplateCode: e.target.value })}
                          placeholder="VD: 1"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Ngày Cơ quan Thuế duyệt ký hiệu Production
                    </label>
                    <input
                      type="text"
                      value={settings.prodTaxAuthorityApprovedDate || ""}
                      onChange={(e) => setSettings({ ...settings, prodTaxAuthorityApprovedDate: e.target.value })}
                      placeholder="VD: 2026-01-15 (hoặc SePay tự động phát hiện)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between gap-3">
                    <span>
                      Sau khi nhập thông tin Production, hãy bấm nút <strong>"Kiểm tra 15 tiêu chí Go-Live"</strong> tại Card D để hệ thống thực hiện handshake không ghi dữ liệu với SePay Production.
                    </span>
                    <button
                      type="button"
                      onClick={handleCheckReadiness}
                      disabled={checkingReadiness}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition cursor-pointer text-xs"
                    >
                      Kiểm tra ngay
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* Card C: Thông tin Đơn vị phát hành & Cấu hình thuế hóa đơn */}
            {/* ----------------------------------------------------------------- */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <IdentificationCard size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Card C: Thông tin Đơn vị phát hành & Cấu hình thuế hóa đơn</h3>
                  <p className="text-xs text-on-surface-variant">Pháp nhân bán hàng, mã số thuế và cấu hình thuế hóa đơn theo tình trạng thuế thực tế của đơn vị</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/15">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Loại hóa đơn phát hành (Invoice Type) *
                  </label>
                  <select
                    value={settings.invoiceType || "VAT"}
                    onChange={(e) => setSettings({ ...settings, invoiceType: e.target.value as "VAT" | "SALES" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition cursor-pointer"
                  >
                    <option value="VAT">Hóa đơn Giá trị gia tăng (HĐ GTGT)</option>
                    <option value="SALES">Hóa đơn Bán hàng (Doanh nghiệp nộp thuế trực tiếp / Không tính VAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Quy tắc Thuế suất GTGT (Tax Treatment) *
                  </label>
                  <select
                    value={settings.taxTreatment || "NOT_SUBJECT_TO_VAT"}
                    onChange={(e) => setSettings({ ...settings, taxTreatment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition cursor-pointer"
                  >
                    <option value="NOT_SUBJECT_TO_VAT">Không chịu thuế GTGT (Mã -2)</option>
                    <option value="NOT_DECLARED">Không kê khai nộp thuế (Mã -1)</option>
                    <option value="VAT_0">Thuế suất 0% (Mã 0)</option>
                    <option value="VAT_5">Thuế suất 5% (Mã 5)</option>
                    <option value="VAT_8">Thuế suất 8% (Mã 8 - Giảm thuế)</option>
                    <option value="VAT_10">Thuế suất 10% (Mã 10 - Tiêu chuẩn)</option>
                    <option value="OTHER">Thuế suất khác</option>
                  </select>
                </div>
              </div>

              {/* Tax Confirmation Box */}
              <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-on-surface font-semibold">
                  <ShieldCheck size={16} className="text-primary shrink-0" />
                  <span>Cấu hình thuế hóa đơn</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Cấu hình này phải được xác nhận theo tình trạng thuế thực tế của đơn vị.
                </p>
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-outline-variant/30 cursor-pointer hover:bg-surface-container transition">
                  <input
                    type="checkbox"
                    checked={!!settings.taxConfigurationConfirmed}
                    onChange={(e) => setSettings({ ...settings, taxConfigurationConfirmed: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-on-surface">Xác nhận cấu hình thuế theo tình trạng thực tế của đơn vị</span>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {settings.taxConfigurationConfirmed && settings.taxConfigurationConfirmedAt
                        ? `Đã được Quản trị viên/Kế toán (${settings.taxConfigurationConfirmedBy || "admin"}) xác nhận lúc ${new Date(settings.taxConfigurationConfirmedAt).toLocaleString("vi-VN")}`
                        : "Tích chọn để xác nhận loại hóa đơn và quy tắc thuế suất trên đã được rà soát đúng với tình trạng thuế thực tế của đơn vị."}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* Card D: Production Readiness & Controlled Pilot */}
            {/* ----------------------------------------------------------------- */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <ShieldCheck size={20} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Card D: Production Readiness & Controlled Pilot (Kiểm soát An toàn & Go-Live)</h3>
                  <p className="text-xs text-on-surface-variant">Quy trình kích hoạt 5 giai đoạn, cơ chế Kill-Switch khẩn cấp và Pilot cho phép xuất hóa đơn thật có kiểm soát</p>
                </div>
              </div>

              {/* 5-State Activation Pipeline Stepper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Quy trình Kích hoạt 5 Giai đoạn (5-State Activation Pipeline)
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    Hiện tại: <strong>{settings.activationState || "SANDBOX"}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[
                    { state: "SANDBOX", label: "1. SANDBOX", desc: "Thử nghiệm an toàn" },
                    { state: "PRODUCTION_CONFIGURED", label: "2. PROD CONFIG", desc: "Đã nạp prod, chặn xuất HĐ" },
                    { state: "PRODUCTION_READY", label: "3. PROD READY", desc: "Đạt 15/15 test, chặn xuất HĐ" },
                    { state: "PRODUCTION_PILOT", label: "4. PROD PILOT", desc: "Chỉ xuất đơn duyệt riêng" },
                    { state: "PRODUCTION_ACTIVE", label: "5. PROD ACTIVE", desc: "Go-Live tự động toàn diện" },
                  ].map((step) => {
                    const isCurrent = (settings.activationState || "SANDBOX") === step.state;
                    return (
                      <div
                        key={step.state}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          isCurrent
                            ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20"
                            : "border-outline-variant/30 bg-surface text-on-surface-variant/70"
                        }`}
                      >
                        <div className="text-[11px] font-black">{step.label}</div>
                        <div className="text-[9.5px] mt-0.5 leading-tight">{step.desc}</div>
                        {isCurrent && (
                          <div className="mt-1 inline-block px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[9px] font-extrabold uppercase">
                            Đang chạy
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* State Transition Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/15 text-xs">
                  <span className="text-on-surface-variant font-medium">Chuyển trạng thái:</span>
                  {(settings.activationState || "SANDBOX") !== "SANDBOX" && (
                    <button
                      type="button"
                      onClick={() => handleTransitionActivationState("SANDBOX")}
                      disabled={transitioningState}
                      className="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      ← Về SANDBOX
                    </button>
                  )}
                  {settings.activationState === "SANDBOX" && (
                    <button
                      type="button"
                      onClick={() => handleTransitionActivationState("PRODUCTION_CONFIGURED")}
                      disabled={transitioningState}
                      className="px-2.5 py-1 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      → PRODUCTION_CONFIGURED
                    </button>
                  )}
                  {settings.activationState === "PRODUCTION_CONFIGURED" && (
                    <button
                      type="button"
                      onClick={() => handleTransitionActivationState("PRODUCTION_READY")}
                      disabled={transitioningState}
                      className="px-2.5 py-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      → PRODUCTION_READY
                    </button>
                  )}
                  {settings.activationState === "PRODUCTION_READY" && (
                    <button
                      type="button"
                      onClick={() => handleTransitionActivationState("PRODUCTION_PILOT")}
                      disabled={transitioningState}
                      className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      🚀 Bắt đầu PRODUCTION_PILOT (Cần 15/15 Đạt)
                    </button>
                  )}
                  {settings.activationState === "PRODUCTION_PILOT" && (
                    <button
                      type="button"
                      onClick={() => handleTransitionActivationState("PRODUCTION_ACTIVE")}
                      disabled={transitioningState}
                      className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      ⚡ Kích hoạt PRODUCTION_ACTIVE (Go-Live Hoàn Toàn)
                    </button>
                  )}
                </div>
              </div>

              {/* Emergency Kill-Switch (auto_invoice_enabled) */}
              <div className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-on-surface flex items-center gap-2">
                    <Power size={17} className={settings.autoInvoiceEnabled !== false ? "text-emerald-600" : "text-rose-600"} weight="bold" />
                    <span>Cơ chế Kill-Switch Khẩn Cấp (auto_invoice_enabled)</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                      settings.autoInvoiceEnabled !== false
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    }`}>
                      {settings.autoInvoiceEnabled !== false ? "ĐANG BẬT" : "KILL-SWITCH BẬT (ĐÃ TẮT XUẤT HĐ)"}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    Khi kích hoạt Kill-Switch (TẮT), hệ thống hoàn toàn ngừng phát hành HĐĐT tự động. Chuyển khoản VietQR và ghi danh học viên vẫn diễn ra bình thường, giúp cách ly sự cố nhà cung cấp hóa đơn mà không gián đoạn bán hàng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleKillSwitch(settings.autoInvoiceEnabled === false)}
                  disabled={togglingKillSwitch}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50 ${
                    settings.autoInvoiceEnabled !== false
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {togglingKillSwitch
                    ? "Đang xử lý..."
                    : settings.autoInvoiceEnabled !== false
                    ? "Tắt khẩn cấp (Bật Kill-Switch)"
                    : "Bật lại phát hành tự động"}
                </button>
              </div>

              {/* Controlled Pilot Order Allowlist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface">
                  Danh sách Mã Đơn Cho Phép Thử Nghiệm Xuất HĐ Thật (Pilot Order Allowlist)
                </label>
                <input
                  type="text"
                  value={settings.pilotOrderAllowlist || ""}
                  onChange={(e) => setSettings({ ...settings, pilotOrderAllowlist: e.target.value })}
                  placeholder="VD: ORD-PILOT-01, ORD-PILOT-02 (Cách nhau bằng dấu phẩy)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
                />
                <div className="text-[11px] text-on-surface-variant leading-relaxed">
                  Trong giai đoạn <strong>PRODUCTION_PILOT</strong>, chỉ các đơn hàng có mã trong danh sách này HOẶC được quản trị viên bấm nút <strong>"🚀 Duyệt Pilot"</strong> tại tab Đơn Hàng mới được phép gọi API phát hành hóa đơn thật lên CQT.
                </div>
              </div>

              {/* Pilot Status Indicator */}
              <div className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-on-surface flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>Trạng thái kiểm thử Pilot (Pilot Result Gate):</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase ${
                      settings.pilotStatus === "PASSED"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : settings.pilotStatus === "FAILED"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : settings.pilotStatus === "IN_PROGRESS"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {settings.pilotStatus || "CHƯA THỰC HIỆN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {settings.pilotStatus === "PASSED"
                      ? "Đợt thử nghiệm Pilot đã vượt qua toàn bộ 7 mốc nghiệp vụ. Đủ điều kiện tiên quyết kích hoạt PRODUCTION_ACTIVE."
                      : "Điều kiện tiên quyết để kích hoạt PRODUCTION_ACTIVE: Cần tối thiểu 1 đơn hàng Pilot đạt trạng thái PASSED (đủ 7 mốc nghiệp vụ)."}
                  </p>
                </div>
                {settings.lastPilotExecutionId && (
                  <div className="text-[10px] font-mono text-on-surface-variant/80 shrink-0">
                    ID: {settings.lastPilotExecutionId.substring(0, 8)}...
                  </div>
                )}
              </div>

              {/* 15-Point Health Check Button */}
              <div className="pt-2 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-on-surface">Đánh giá 15 Tiêu Chí Sẵn Sàng Go-Live & Pilot</div>
                  <div className="text-[11px] text-on-surface-variant">Kiểm tra toàn diện tính toàn vẹn cấu hình, credentials, quota và chứng thư số</div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckReadiness}
                  disabled={checkingReadiness}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 active:scale-95 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {checkingReadiness ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} weight="bold" />
                  )}
                  <span>{checkingReadiness ? "Đang đánh giá 15 tiêu chí..." : "🔍 Kiểm tra 15 tiêu chí Go-Live"}</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 active:scale-95 text-on-primary text-sm font-bold shadow-xs transition cursor-pointer"
              >
                {settingsSaving ? <SpinnerGap size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span>Lưu toàn bộ cấu hình hệ thống</span>
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

                {(selectedOrder.invoiceStatus === "ISSUED" || selectedOrder.invoiceNumber) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        openInvoiceDetailFromOrder(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      <Eye size={16} weight="bold" />
                      <span>Xem tờ Hóa đơn điện tử CQT #{selectedOrder.invoiceNumber || ""}</span>
                    </button>
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
                      const transferContent = `${selectedOrder.customerName} ${selectedOrder.orderCode}`;
                      const msg = `Dạ chào bạn ${selectedOrder.customerName}, The IELTS Spells gửi bạn thông tin thanh toán cho khóa học "${selectedOrder.courseTitle || "IELTS"}":\n- Học phí: ${formatVnd(selectedOrder.amount)}\n- Ngân hàng: ${settings.sepayBankName || "Chưa cấu hình"}\n- Số tài khoản: ${settings.sepayAccountNumber || "Chưa cấu hình"}\n- Chủ tài khoản: ${settings.sellerName || "Chưa cấu hình"}\n- Nội dung chuyển khoản bắt buộc: ${transferContent}\n\nBạn vui lòng chuyển đúng số tiền và giữ nguyên nội dung để hệ thống tự nhận diện đơn. Khi nhận đủ học phí, tài khoản và quyền vào khóa học sẽ được kích hoạt tự động qua email "${selectedOrder.customerEmail}" ạ!`;
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
      {/* ======================================================================= */}
      {/* MODAL: VISUAL MATBAO-INVOICE VIEWER */}
      {/* ======================================================================= */}
      {selectedInvoice && (() => {
        const isModalInvoiceIssued = selectedInvoice.status === "ISSUED" && Boolean(selectedInvoice.invoiceNumber);
        const isSandboxMode = !settings.activationState || settings.activationState === "SANDBOX";
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-on-background/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[96vh] rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Modal Top Bar */}
            <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/80 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Receipt size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                      Hóa đơn bán hàng &bull; NĐ 123
                    </span>
                    {isSandboxMode && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/25">
                        SANDBOX / HÓA ĐƠN THỬ NGHIỆM
                      </span>
                    )}
                    {renderStatusBadge(selectedInvoice.status)}
                  </div>
                  <h3 className="text-sm font-bold text-on-surface truncate">
                    {isModalInvoiceIssued
                      ? `Hóa đơn số: #${selectedInvoice.invoiceNumber}`
                      : "Bản xem trước Hóa đơn (Chưa phát hành)"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePdf(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs cursor-pointer"
                  title={isModalInvoiceIssued ? "In hoặc Lưu hóa đơn dưới dạng PDF" : "In bản xem trước PDF"}
                >
                  <Printer size={15} weight="bold" />
                  <span>{isModalInvoiceIssued ? "In / Lưu PDF" : "In bản xem trước"}</span>
                </button>

                {selectedInvoice.pdfUrl && (
                  <a
                    href={selectedInvoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition"
                  >
                    <DownloadSimple size={14} />
                    <span className="hidden sm:inline">Tải PDF gốc</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 2. CQT & Verification Sub-Header Banner */}
            <div className="px-4 py-2 border-b border-outline-variant/20 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck size={16} weight="fill" />
                  Mã xác thực CQT:
                </span>
                {isModalInvoiceIssued && selectedInvoice.cqtCode ? (
                  <div className="flex items-center gap-1">
                    <code className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px] select-all">
                      {selectedInvoice.cqtCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedInvoice.cqtCode || "", "sub_cqt")}
                      className="p-1 text-on-surface-variant hover:text-primary transition cursor-pointer"
                      title="Sao chép mã CQT"
                    >
                      {copiedText === "sub_cqt" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                ) : (
                  <span className="italic text-on-surface-variant">
                    (Chưa cấp &bull; Cơ quan Thuế sẽ cấp mã sau khi phát hành)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
                <span>
                  Mẫu: <b>{isModalInvoiceIssued ? (selectedInvoice.invoiceTemplate || "2") : "2 (Dự kiến)"}</b>
                </span>
                <span>&bull;</span>
                <span>
                  Ký hiệu: <b>{isModalInvoiceIssued ? (selectedInvoice.invoiceSeries || "2C26TLN") : "2C26TLN (Dự kiến)"}</b>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  Mã tra cứu:{" "}
                  {isModalInvoiceIssued && selectedInvoice.lookupCode ? (
                    <>
                      <b className="text-on-surface">{selectedInvoice.lookupCode}</b>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedInvoice.lookupCode || "", "sub_lookup")}
                        className="text-on-surface-variant hover:text-primary transition cursor-pointer"
                        title="Sao chép mã tra cứu"
                      >
                        {copiedText === "sub_lookup" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </>
                  ) : (
                    <span className="text-slate-500 italic font-serif">(Sẽ cấp khi phát hành)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Error Alert if FAILED */}
            {selectedInvoice.status === "FAILED" && (
              <div className="mx-4 mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                    <WarningCircle size={16} />
                    <span>Lỗi phát hành từ SePay / CQT:</span>
                  </div>
                  {selectedInvoice.errorCategory && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      {selectedInvoice.errorCategory}
                    </span>
                  )}
                </div>
                {selectedInvoice.errorLog && (
                  <pre className="font-mono text-[11px] text-rose-800 dark:text-rose-200 bg-rose-500/5 p-2 rounded border border-rose-500/20 whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {selectedInvoice.errorLog}
                  </pre>
                )}
              </div>
            )}

            {/* 3. Main Paper Canvas (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 dark:bg-slate-950 flex flex-col items-center">
              <div className="w-full max-w-[760px] overflow-x-auto [scrollbar-width:none]">
                <div className="relative bg-white text-slate-900 border-2 border-[#0284c7] rounded shadow-lg p-5 font-invoice text-[10px] leading-tight mx-auto min-w-[700px] select-text">
                  {/* Subtle draft watermark if unissued */}
                  {!isModalInvoiceIssued && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                      <div className="transform -rotate-25 border-4 border-dashed border-amber-500/30 text-amber-600/30 dark:text-amber-400/20 font-black text-2xl sm:text-3xl tracking-widest px-8 py-4 rounded-2xl text-center uppercase">
                        {isSandboxMode ? "SANDBOX — CHƯA PHÁT HÀNH" : "CHƯA PHÁT HÀNH"}
                        <div className="text-xs tracking-normal font-medium mt-1">BẢN XEM TRƯỚC • KHÔNG CÓ GIÁ TRỊ PHÁT HÀNH</div>
                      </div>
                    </div>
                  )}

                  {/* Decorative Blue Inner Frame matching official template */}
                  <div className="border border-[#38bdf8]/60 p-3.5 space-y-2.5 relative z-0">
                    {/* Header: Title Centered + Top-Right Metadata & QR Code */}
                    <div className="flex items-start justify-between border-b border-slate-300 pb-2">
                      <div className="w-24"></div>

                      {/* Main Centered Title */}
                      <div className="flex-1 text-center">
                        <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#c52828]">
                          HÓA ĐƠN BÁN HÀNG
                        </h3>
                        {!isModalInvoiceIssued && (
                          <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mt-0.5">
                            (Bản xem trước &bull; Hóa đơn chưa phát hành)
                          </div>
                        )}
                        <div className="text-[10px] text-slate-600 mt-1">
                          {(() => {
                            const dateObj = new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt || Date.now());
                            const d = String(dateObj.getDate()).padStart(2, "0");
                            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
                            const y = dateObj.getFullYear();
                            return isModalInvoiceIssued ? `Ngày ${d} tháng ${m} năm ${y}` : `Ngày dự kiến: Ngày ${d} tháng ${m} năm ${y}`;
                          })()}
                        </div>
                      </div>

                      {/* Top-Right Metadata & QR Code */}
                      <div className="flex items-start gap-2.5 shrink-0 text-right">
                        <div className="text-[9.5px] space-y-0.5">
                          <div>
                            <span className="text-slate-500">Ký hiệu: </span>
                            <b className="font-mono">{selectedInvoice.invoiceSeries || settings.einvoiceInvoiceSeries || settings.einvoiceSeries || "2C26TLN"}</b>
                          </div>
                          <div>
                            <span className="text-slate-500">Số: </span>
                            <b className={isModalInvoiceIssued ? "font-mono text-[#c52828] font-bold" : "text-slate-500 italic font-sans font-medium"}>
                              {isModalInvoiceIssued ? selectedInvoice.invoiceNumber : "(Chưa cấp)"}
                            </b>
                          </div>
                        </div>

                        {/* QR Code CQT */}
                        {isModalInvoiceIssued && selectedInvoice.cqtCode ? (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 border border-slate-300 p-0.5 bg-white shrink-0">
                            <rect width="100" height="100" fill="white" />
                            <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
                            <rect x="9" y="9" width="20" height="20" fill="white" />
                            <rect x="13" y="13" width="12" height="12" fill="#0f172a" />
                            <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
                            <rect x="71" y="9" width="20" height="20" fill="white" />
                            <rect x="75" y="13" width="12" height="12" fill="#0f172a" />
                            <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
                            <rect x="9" y="71" width="20" height="20" fill="white" />
                            <rect x="13" y="75" width="12" height="12" fill="#0f172a" />
                            <rect x="38" y="8" width="6" height="6" fill="#0f172a" />
                            <rect x="48" y="14" width="6" height="6" fill="#0f172a" />
                            <rect x="40" y="24" width="6" height="6" fill="#0f172a" />
                            <rect x="52" y="26" width="6" height="6" fill="#0f172a" />
                            <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
                            <rect x="22" y="44" width="6" height="6" fill="#0f172a" />
                            <rect x="36" y="38" width="6" height="6" fill="#0f172a" />
                            <rect x="48" y="44" width="6" height="6" fill="#0f172a" />
                            <rect x="60" y="38" width="6" height="6" fill="#0f172a" />
                            <rect x="72" y="44" width="6" height="6" fill="#0f172a" />
                            <rect x="84" y="38" width="6" height="6" fill="#0f172a" />
                            <rect x="40" y="54" width="6" height="6" fill="#0f172a" />
                            <rect x="54" y="58" width="6" height="6" fill="#0f172a" />
                            <rect x="66" y="54" width="6" height="6" fill="#0f172a" />
                            <rect x="78" y="60" width="6" height="6" fill="#0f172a" />
                            <rect x="38" y="70" width="6" height="6" fill="#0f172a" />
                            <rect x="52" y="74" width="6" height="6" fill="#0f172a" />
                            <rect x="64" y="70" width="6" height="6" fill="#0f172a" />
                            <rect x="78" y="76" width="6" height="6" fill="#0f172a" />
                            <rect x="44" y="86" width="6" height="6" fill="#0f172a" />
                            <rect x="58" y="90" width="6" height="6" fill="#0f172a" />
                            <rect x="72" y="86" width="6" height="6" fill="#0f172a" />
                            <rect x="84" y="90" width="6" height="6" fill="#0f172a" />
                          </svg>
                        ) : (
                          <div className="w-14 h-14 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-1 text-center bg-slate-50/60 text-[7.5px] text-slate-400 shrink-0 leading-tight">
                            <QrCode size={18} className="text-slate-400 mb-0.5" />
                            <span>Mã QR CQT</span>
                            <span className="text-[6.5px] text-slate-400">(Chưa cấp)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CQT Code Line */}
                    <div className="text-[9.5px] border-b border-slate-300 pb-1.5">
                      <span>Mã CQT : </span>
                      {isModalInvoiceIssued && selectedInvoice.cqtCode ? (
                        <b className="font-mono text-slate-900 tracking-wider">
                          {selectedInvoice.cqtCode}
                        </b>
                      ) : (
                        <span className="text-slate-500 italic font-sans">
                          (Chưa cấp — Cơ quan Thuế sẽ cấp mã sau khi xác nhận thanh toán &amp; phát hành)
                        </span>
                      )}
                    </div>

                    {/* Seller Info */}
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
                          <span>{settings.sellerPhone || ""}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Số tài khoản: </span>
                          <span className="font-mono">{settings.sepayAccountNumber || ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="text-[9.5px] space-y-0.5 border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-slate-600">Họ tên người mua hàng: </span>
                        <span className="font-medium text-slate-900">
                          {selectedInvoice.customerName || "Bán cho người tiêu dùng"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Tên đơn vị: </span>
                        <span>{selectedInvoice.buyerType === "BUSINESS" ? (selectedInvoice.invoiceCompanyName || "") : ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Địa chỉ: </span>
                        <span>{selectedInvoice.invoiceAddress || ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Mã số thuế: </span>
                        <b className="font-mono">{selectedInvoice.buyerType === "BUSINESS" ? (selectedInvoice.invoiceTaxCode || "") : ""}</b>
                      </div>
                      <div>
                        <span className="text-slate-600">CCCD: </span>
                        <span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-600">Hình thức thanh toán: </span>
                          <b>CK (VietQR Napas247)</b>
                        </div>
                        <div>
                          <span className="text-slate-600">Tài khoản: </span>
                          <span></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-600">Đơn vị tiền tệ : </span>
                          <b>VND</b>
                        </div>
                        <div>
                          <span className="text-slate-600">Tỷ giá: </span>
                          <b>1 VNĐ</b>
                        </div>
                      </div>
                    </div>

                    {/* Clean 6-Column Table matching official invoice */}
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
                            {selectedInvoice.productName || "Đóng học phí đào tạo IELTS"}
                          </td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-center">Khóa</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-center font-bold">1</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right tabular-nums">
                            {selectedInvoice.amount.toLocaleString("vi-VN")}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-bold text-slate-900 tabular-nums">
                            {selectedInvoice.amount.toLocaleString("vi-VN")}
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
                            {selectedInvoice.amount.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Money in Words */}
                    <div className="text-[9.5px] pt-1">
                      <span className="font-bold text-slate-800">Số tiền viết bằng chữ: </span>
                      <span className="italic font-medium text-slate-900">
                        {formatVietnameseMoneyWords(selectedInvoice.amount)}.
                      </span>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-4 pt-4 text-[9.5px]">
                      <div className="text-center">
                        <div className="font-bold text-slate-900">Người mua hàng</div>
                        <div className="text-[8px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <div className="font-bold text-slate-900">Người bán hàng</div>

                        {isModalInvoiceIssued ? (
                          /* Red Stamp matching official invoice */
                          <div className="mt-1.5 border border-[#d32f2f] p-2 text-left bg-white text-[#c62828] text-[8.5px] w-52 relative">
                            <div className="font-bold">Chữ ký có hiệu lực</div>
                            <div className="mt-0.5">
                              Ký bởi: {settings.sellerName || "HỘ KINH DOANH LUYỆN NÓI"}
                            </div>
                            <div className="font-mono text-[8px] mt-0.5">
                              {(() => {
                                const dateObj = new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt || Date.now());
                                const d = String(dateObj.getDate()).padStart(2, "0");
                                const m = String(dateObj.getMonth() + 1).padStart(2, "0");
                                const y = dateObj.getFullYear();
                                return `Ký ngày: ${d}/${m}/${y}`;
                              })()}
                            </div>
                            {/* Big Green Checkmark */}
                            <div className="absolute right-3 top-2 bottom-2 flex items-center">
                              <span className="text-emerald-600 font-black text-2xl leading-none">&#x2713;</span>
                            </div>
                          </div>
                        ) : (
                          /* Pending signature placeholder */
                          <div className="mt-1.5 border border-dashed border-slate-300 p-2 text-left bg-slate-50 text-slate-500 text-[8.5px] w-52 rounded space-y-0.5 font-sans">
                            <div className="font-bold text-slate-700">Chữ ký số Người bán</div>
                            <div className="text-[8px] text-slate-500">
                              (Sẽ tự động ký số khi SePay phát hành)
                            </div>
                            <div className="text-[8px] text-amber-700 dark:text-amber-400 font-medium">
                              Trạng thái: Chưa ký số
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Legal Notice matching official invoice */}
                    <div className="border-t border-slate-200 pt-2 mt-4 text-center text-[8px] text-slate-500 space-y-0.5">
                      <div className="italic">
                        (Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn)
                      </div>
                      <div>
                        Tra cứu trực tuyến tại: <a href="https://sepay.vn/tra-cuu-hoa-don-dien-tu" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://sepay.vn/tra-cuu-hoa-don-dien-tu</a>
                      </div>
                      <div>
                        Mã tra cứu:{" "}
                        {isModalInvoiceIssued && (selectedInvoice.lookupCode || selectedInvoice.referenceCode) ? (
                          <b className="font-mono text-slate-800">{selectedInvoice.lookupCode || selectedInvoice.referenceCode}</b>
                        ) : (
                          <span className="text-slate-500 italic font-sans">
                            (Sẽ được cấp sau khi phát hành chính thức)
                          </span>
                        )}
                      </div>
                      <div className="text-[7.5px] text-slate-400 pt-1">
                        Trang 1/1
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Modal Bottom Action Bar */}
            <div className="px-4 py-3 border-t border-outline-variant/20 bg-surface-container-low/80 shrink-0 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedInvoice.status === "FAILED" && selectedInvoice.errorCategory !== "REQUIRES_ACTION" && selectedInvoice.errorCategory !== "NON_RETRYABLE" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRetryInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    disabled={retryingInvoiceId === selectedInvoice.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                  >
                    <span>Lập đề nghị hủy HĐ</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePdf(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-2xs cursor-pointer"
                >
                  <Printer size={15} weight="bold" />
                  <span>{isModalInvoiceIssued ? "In / Lưu PDF" : "In bản xem trước"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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

      {isStaticQrModalOpen && staticQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-on-background/50 backdrop-blur-xs"
          onClick={() => setIsStaticQrModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/25 bg-cyan-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                  <QrCode size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">QR tĩnh · Thu học phí linh hoạt</h3>
                  <p className="text-[11px] text-on-surface-variant">Không tạo đơn · Không gắn khóa học · Tự động lập hóa đơn từng giao dịch</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsStaticQrModalOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-container">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 p-5">
              <div className="p-4 rounded-2xl border border-outline-variant/30 bg-white text-center">
                <img src={staticQr.qrCodeUrl} alt="QR tĩnh thu học phí IELTS" className="w-full max-w-60 mx-auto" />
                <div className="mt-2 text-[11px] text-slate-600">Học viên tự nhập số tiền muốn đóng</div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 text-emerald-900 dark:text-emerald-200">
                  <div className="font-bold mb-1">Luồng này luôn sẵn sàng nhận học phí</div>
                  <div className="leading-relaxed">Mỗi giao dịch tiền vào không có mã đơn được ghi nhận là khoản thu QR tĩnh hợp lệ và tự xếp hàng phát hành một hóa đơn riêng. Không cần kế toán khớp đơn.</div>
                </div>

                <div className="space-y-2 rounded-xl border border-outline-variant/30 p-3">
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Ngân hàng</span><b>{staticQr.bankName}</b></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Số tài khoản</span><b className="font-mono">{staticQr.accountNumber}</b></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Chủ tài khoản</span><b className="text-right">{staticQr.accountName}</b></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Nội dung gợi ý</span><b className="text-right">{staticQr.suggestedTransferContent}</b></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Tên hàng hóa</span><b className="text-right">{staticQr.productName}</b></div>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-amber-900 dark:text-amber-200 leading-relaxed">
                  Yêu cầu học viên nhập <b>họ và tên</b> trong nội dung chuyển khoản. QR tĩnh chỉ thu tiền và xuất hóa đơn; không tự biết khóa học, không tạo tài khoản và không kích hoạt quyền học.
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`Ngân hàng: ${staticQr.bankName}\nSố tài khoản: ${staticQr.accountNumber}\nChủ tài khoản: ${staticQr.accountName}\nNội dung: ${staticQr.suggestedTransferContent}`, "static_info")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary font-bold"
                  >
                    {copiedText === "static_info" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedText === "static_info" ? "Đã sao chép" : "Sao chép thông tin"}
                  </button>
                  <a href={staticQr.qrCodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/50 font-bold">
                    <DownloadSimple size={14} /> Xem / tải QR
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ALL-IN-ONE SPLIT-SCREEN WORKSPACE (TẠO ĐƠN & XEM TRƯỚC HĐĐT) */}
      {/* ======================================================================= */}
      {isCreateModalOpen && (() => {
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-on-background/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
            onClick={() => {
              if (!createOrderSubmitting) setIsCreateModalOpen(false);
            }}
          >
            <div
              className={`w-full ${
                createdOrderResult ? "max-w-2xl max-h-[96vh]" : "max-w-7xl 2xl:max-w-[1550px] h-[92vh] max-h-[94vh]"
              } rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl space-y-0 flex flex-col overflow-hidden transition-all duration-300 my-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {!createdOrderResult ? (
                <EinvoiceSplitPreview
                  coursesSummary={coursesSummary}
                  coursesLoading={coursesLoading}
                  settings={settings}
                  onSubmitOrder={handleCreateOrderFromSplitPreview}
                  isSubmitting={createOrderSubmitting}
                  errorMessage={createOrderError}
                  onClose={() => setIsCreateModalOpen(false)}
                  formatVnd={formatVnd}
                  formatVietnameseMoneyWords={formatVietnameseMoneyWords}
                />
              ) : (
                /* STEP 2: VIETQR NAPAS247 PAYMENT & AUTOMATION READY SCREEN */
                <>
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
                          Đơn Hàng &amp; Mã VietQR Sẵn Sàng
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
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      Đơn hàng <strong className="font-mono text-sm">{createdOrderResult.orderCode}</strong> đã được tạo thành công. QR động đã điền sẵn toàn bộ học phí và mã đơn để hệ thống tự kích hoạt khóa học.
                    </div>
                  </div>

                  {/* Status Indicator Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant font-medium">Trạng thái đơn hàng:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <Clock size={13} weight="bold" />
                        Đang chờ thanh toán
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant font-medium">Hóa đơn điện tử:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                        Chưa phát hành
                      </span>
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
                        <strong className="text-on-surface text-right">{createdOrderResult.courseTitle || createdOrderResult.courseName}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Tổng học phí dự kiến:</span>
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
                          <span>{createdOrderResult.transferContent}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdOrderResult.transferContent, "code")}
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
                      <div className="font-bold">Tự động đăng ký và vào học:</div>
                      <div className="text-[11px] opacity-90 leading-relaxed">
                        QR chứa sẵn số tiền và mã đơn. SePay đối chiếu giao dịch, hệ thống lập hóa đơn với sản phẩm <b>Đóng học phí đào tạo IELTS</b>, chuyển đơn sang PAID và tự động ghi danh hoặc gửi email tạo tài khoản khi đã thu đủ.
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
                </>
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

      {/* ======================================================================= */}
      {/* MODAL: GO-LIVE READINESS 10-POINT HEALTH CHECK */}
      {/* ======================================================================= */}
      {showReadinessModal && readinessReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowReadinessModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-xl space-y-4 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">SePay eInvoice Production Checklist</span>
                <h3 className="text-lg font-bold text-on-surface">Đánh giá 15 Tiêu Chí Sẵn Sàng Go-Live & Pilot</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReadinessModal(false)}
                className="p-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Overall Verdict Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              readinessReport.overallStatus === "READY"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : readinessReport.overallStatus === "READY_WITH_WARNINGS"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
            }`}>
              <div className="flex items-center gap-3">
                {readinessReport.overallStatus === "READY" ? (
                  <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : readinessReport.overallStatus === "READY_WITH_WARNINGS" ? (
                  <WarningCircle size={28} className="text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <WarningCircle size={28} className="text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {readinessReport.overallStatus === "READY"
                      ? "Hệ thống ĐỦ ĐIỀU KIỆN TUYỆT ĐỐI chuyển sang Production (READY)"
                      : readinessReport.overallStatus === "READY_WITH_WARNINGS"
                      ? "Hệ thống ĐỦ ĐIỀU KIỆN CÓ LƯU Ý (READY WITH WARNINGS)"
                      : "CHƯA ĐỦ ĐIỀU KIỆN chuyển sang Production (NOT READY)"}
                  </div>
                  <div className="text-xs opacity-90">
                    {readinessReport.overallStatus === "READY"
                      ? "Tất cả các tiêu chí trọng yếu đã được xác thực an toàn tuyệt đối với cổng SePay eInvoice."
                      : readinessReport.overallStatus === "READY_WITH_WARNINGS"
                      ? "Có thể chuyển sang Production, nhưng cần chú ý các cảnh báo bên dưới (VD: hạn ngạch sắp hết hoặc chưa đặt secret token)."
                      : `Còn ${readinessReport.failCount} tiêu chí bắt buộc cần hoàn thiện trước khi phát hành hóa đơn thật.`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {readinessReport.passCount} Đạt
                </span>
                {readinessReport.warnCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {readinessReport.warnCount} Lưu ý
                  </span>
                )}
                {readinessReport.failCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                    {readinessReport.failCount} Lỗi
                  </span>
                )}
              </div>
            </div>

            {/* Checklist Items */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {readinessReport.checks.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 flex items-start gap-3 text-xs"
                >
                  <div className="shrink-0 mt-0.5">
                    {item.status === "PASS" ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px]">
                        ✓
                      </span>
                    ) : item.status === "WARN" ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                        !
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                        ✕
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-on-surface">
                        {idx + 1}. {item.title}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "PASS"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : item.status === "WARN"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-on-surface-variant leading-relaxed">
                      {item.details}
                    </div>
                    {item.recommendation && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded-lg font-medium">
                        💡 Khuyến nghị: {item.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowReadinessModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
