import { useState } from "react";
import { 
  ArrowClockwise, 
  Phone, 
  Envelope, 
  CalendarBlank, 
  UserPlus, 
  Funnel,
  Sparkle,
  PlusCircle,
  Trash,
  CheckCircle,
  Tag
} from "@phosphor-icons/react";

export interface ConsultingLead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  targetBand: string;
  preferredTime: string;
  status: "PENDING" | "CONTACTED" | "TEST_SCHEDULED" | "CONVERTED" | "CANCELLED";
  notes: string;
  createdAt: string;
  source: string;
}

interface AdmissionsLeadsProps {
  onConvert: (lead: ConsultingLead) => void;
}

export default function AdmissionsLeads({ onConvert }: AdmissionsLeadsProps) {
  const [leads, setLeads] = useState<ConsultingLead[]>([
    {
      id: "LEAD-101",
      fullName: "Nguyễn Minh Anh",
      phone: "0987 654 321",
      email: "minhanh.ng@gmail.com",
      targetBand: "7.5",
      preferredTime: "Sáng Thứ 2, 4, 6",
      status: "CONVERTED",
      notes: "Nhu cầu học chuyên sâu Writing để đi du học, muốn đăng ký Intensive.",
      createdAt: "2026-07-22T08:15:00Z",
      source: "Landing Page IELTS 7.5+",
    },
    {
      id: "LEAD-102",
      fullName: "Trần Tuấn Kiệt",
      phone: "0912 345 678",
      email: "tuankiet.tran@gmail.com",
      targetBand: "6.5",
      preferredTime: "Tối Thứ 3, 5, 7",
      status: "PENDING",
      notes: "Học sinh lớp 11 muốn thi IELTS trước kỳ 2 để xét tuyển đại học.",
      createdAt: "2026-07-22T09:30:00Z",
      source: "Facebook Ads Form",
    },
    {
      id: "LEAD-103",
      fullName: "Lê Thị Hồng Nhung",
      phone: "0905 111 222",
      email: "nhung.lh@gmail.com",
      targetBand: "5.5",
      preferredTime: "Cuối tuần (Sáng T7, CN)",
      status: "CONTACTED",
      notes: "Mất gốc ngữ pháp, cần ôn thi từ Foundation.",
      createdAt: "2026-07-21T14:20:00Z",
      source: "Landing Page Foundation",
    },
    {
      id: "LEAD-104",
      fullName: "Phạm Quốc Huy",
      phone: "0888 777 999",
      email: "huypham99@gmail.com",
      targetBand: "8.0",
      preferredTime: "Tối Thứ 2, 4, 6",
      status: "TEST_SCHEDULED",
      notes: "Đã có nền tảng tốt (~6.5), muốn test để vào thẳng lớp Master.",
      createdAt: "2026-07-20T10:05:00Z",
      source: "Landing Page Test Online",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncLeads = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate adding a new lead from landing page
      const newLead: ConsultingLead = {
        id: `LEAD-${Date.now().toString().slice(-3)}`,
        fullName: "Vũ Hoàng My",
        phone: "0977 444 888",
        email: "hoangmy.vu@gmail.com",
        targetBand: "7.0",
        preferredTime: "Tối Thứ 3, 5",
        status: "PENDING",
        notes: "Mới đăng ký tư vấn qua nút 'Đăng ký tư vấn ngay' ở Landing Page.",
        createdAt: new Date().toISOString(),
        source: "Landing Page Campaign July",
      };
      setLeads(prev => [newLead, ...prev]);
      setIsSyncing(false);
      alert("Đồng bộ Leads mới từ Landing Page thành công!");
    }, 1200);
  };

  const handleStatusChange = (id: string, newStatus: ConsultingLead["status"]) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === "ALL" || lead.status === filterStatus;
    const matchesSearch = `${lead.fullName} ${lead.phone} ${lead.email} ${lead.notes}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ConsultingLead["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Mới đăng ký</span>;
      case "CONTACTED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Đã liên hệ</span>;
      case "TEST_SCHEDULED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Lịch test đầu vào</span>;
      case "CONVERTED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã nhập học</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">Đã hủy bỏ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, SĐT, nội dung tư vấn..."
              className="w-full pl-9 pr-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-semibold focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-on-surface-variant" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-bold text-on-surface-variant focus:outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Mới đăng ký (Pending)</option>
              <option value="CONTACTED">Đã liên hệ</option>
              <option value="TEST_SCHEDULED">Đã xếp lịch test</option>
              <option value="CONVERTED">Đã chuyển đổi</option>
              <option value="CANCELLED">Đã hủy bỏ</option>
            </select>
          </div>
        </div>

        {/* Sync Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncLeads}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 border border-primary/20 hover:bg-primary-container/10 text-primary rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <ArrowClockwise size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Đang đồng bộ..." : "Đồng bộ Landing Page"}
          </button>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredLeads.map(lead => (
          <div
            key={lead.id}
            className={`bg-surface border border-outline-variant/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
              lead.status === "PENDING" ? "border-l-4 border-l-blue-500" : ""
            }`}
          >
            <div>
              {/* Header card info */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-base text-on-surface">
                      {lead.fullName}
                    </h3>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {lead.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} />
                    Nguồn: {lead.source}
                  </p>
                </div>
                {getStatusBadge(lead.status)}
              </div>

              {/* Lead contact details */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-on-surface-variant font-semibold">
                <p className="flex items-center gap-1.5 truncate">
                  <Phone size={14} />
                  {lead.phone}
                </p>
                <p className="flex items-center gap-1.5 truncate">
                  <Envelope size={14} />
                  {lead.email}
                </p>
                <p className="col-span-2">
                  🎯 Band mục tiêu: <strong>IELTS {lead.targetBand}+</strong>
                </p>
                <p className="col-span-2">
                  🕒 Ca học mong muốn: <strong>{lead.preferredTime}</strong>
                </p>
              </div>

              {/* Consultation notes */}
              {lead.notes && (
                <div className="mt-4 p-3 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>Nội dung đăng ký:</strong> {lead.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Business Operations Action Block */}
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[10px] text-on-surface-variant italic">
                Đăng ký: {new Date(lead.createdAt).toLocaleDateString("vi-VN")}
              </span>

              <div className="flex gap-2">
                {lead.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange(lead.id, "CONTACTED")}
                    className="px-2.5 py-1.5 border border-outline-variant/60 hover:bg-surface-container rounded-lg text-xs font-bold text-on-surface-variant flex items-center gap-1"
                  >
                    Đã liên hệ
                  </button>
                )}
                
                {(lead.status === "PENDING" || lead.status === "CONTACTED") && (
                  <button
                    onClick={() => {
                      handleStatusChange(lead.id, "TEST_SCHEDULED");
                      alert(`Đã xếp lịch kiểm tra đầu vào (Placement Test) cho ${lead.fullName}!`);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <CalendarBlank size={14} />
                    Lịch Test
                  </button>
                )}

                {lead.status !== "CONVERTED" && lead.status !== "CANCELLED" && (
                  <button
                    onClick={() => {
                      handleStatusChange(lead.id, "CONVERTED");
                      onConvert(lead);
                    }}
                    className="px-2.5 py-1.5 bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <UserPlus size={14} />
                    Ghi danh & Xếp lớp
                  </button>
                )}

                {lead.status !== "CONVERTED" && lead.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleStatusChange(lead.id, "CANCELLED")}
                    title="Hủy bỏ yêu cầu"
                    className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                )}

                {lead.status === "CONVERTED" && (
                  <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" />
                    Đã chuyển đổi thành học viên
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="bg-surface border border-outline-variant/40 p-8 rounded-2xl text-center text-on-surface-variant text-sm font-semibold">
          Không tìm thấy yêu cầu tư vấn nào phù hợp.
        </div>
      )}
    </div>
  );
}
