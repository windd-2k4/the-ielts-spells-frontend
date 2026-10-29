type FilterOption = "ALL" | "ACTIVE" | "COMPLETED" | "PAUSED" | "WITHDRAWN";

type Props = {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  pausedCourses: number;
  currentBand: number | null;
  targetBand: number | null;
  pendingRequests: number;
  selectedFilter: FilterOption;
  onSelectFilter: (f: FilterOption) => void;
};

export default function StudentStatisticsRow({
  totalCourses,
  activeCourses,
  completedCourses,
  pausedCourses,
  currentBand,
  targetBand,
  pendingRequests,
  selectedFilter,
  onSelectFilter,
}: Props) {
  return (
    <section aria-label="Thống kê học viên" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Tổng khóa */}
      <button
        type="button"
        onClick={() => onSelectFilter("ALL")}
        className={`text-left rounded-xl border px-3.5 py-2.5 transition cursor-pointer ${
          selectedFilter === "ALL"
            ? "border-[#8B3F56] bg-[#8B3F56]/5 ring-1 ring-[#8B3F56]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
        }`}
      >
        <span className="text-[11px] font-semibold text-slate-500 block">
          Tổng khóa
        </span>
        <strong className="mt-0.5 block text-xl font-bold text-slate-900 tabular-nums">
          {totalCourses}
        </strong>
      </button>

      {/* 2. Đang học */}
      <button
        type="button"
        onClick={() => onSelectFilter("ACTIVE")}
        className={`text-left rounded-xl border px-3.5 py-2.5 transition cursor-pointer ${
          selectedFilter === "ACTIVE"
            ? "border-[#8B3F56] bg-[#8B3F56]/5 ring-1 ring-[#8B3F56]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
        }`}
      >
        <span className="text-[11px] font-semibold text-slate-500 block">
          Đang học
        </span>
        <strong className="mt-0.5 block text-xl font-bold text-emerald-700 tabular-nums">
          {activeCourses}
        </strong>
      </button>

      {/* 3. Hoàn thành */}
      <button
        type="button"
        onClick={() => onSelectFilter("COMPLETED")}
        className={`text-left rounded-xl border px-3.5 py-2.5 transition cursor-pointer ${
          selectedFilter === "COMPLETED"
            ? "border-[#8B3F56] bg-[#8B3F56]/5 ring-1 ring-[#8B3F56]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
        }`}
      >
        <span className="text-[11px] font-semibold text-slate-500 block">
          Đã hoàn thành
        </span>
        <strong className="mt-0.5 block text-xl font-bold text-slate-700 tabular-nums">
          {completedCourses}
        </strong>
      </button>

      {/* 4. Bảo lưu */}
      <button
        type="button"
        onClick={() => onSelectFilter("PAUSED")}
        className={`text-left rounded-xl border px-3.5 py-2.5 transition cursor-pointer ${
          selectedFilter === "PAUSED"
            ? "border-[#8B3F56] bg-[#8B3F56]/5 ring-1 ring-[#8B3F56]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
        }`}
      >
        <span className="text-[11px] font-semibold text-slate-500 block">
          Đang bảo lưu
        </span>
        <strong className="mt-0.5 block text-xl font-bold text-amber-700 tabular-nums">
          {pausedCourses}
        </strong>
      </button>

      {/* 5. Mục tiêu Band */}
      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <span className="text-[11px] font-semibold text-slate-500 block">
          Mục tiêu Band
        </span>
        <div className="mt-0.5 flex items-baseline gap-1.5 font-bold">
          <span className="text-sm text-slate-400">
            {currentBand != null ? currentBand : "—"}
          </span>
          <span className="text-xs text-slate-300">→</span>
          <strong className="text-xl text-[#8B3F56]">
            {targetBand != null ? targetBand : "5.5"}
          </strong>
        </div>
      </div>

      {/* 6. Chờ xử lý */}
      <button
        type="button"
        onClick={() => {
          if (pendingRequests > 0) {
            onSelectFilter("WITHDRAWN");
          }
        }}
        className={`text-left rounded-xl border px-3.5 py-2.5 transition cursor-pointer ${
          pendingRequests > 0
            ? "border-amber-300 bg-amber-50/60 hover:bg-amber-100/50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <span
          className={`text-[11px] font-semibold block ${
            pendingRequests > 0 ? "text-amber-800 font-bold" : "text-slate-500"
          }`}
        >
          Chờ xử lý
        </span>
        <strong
          className={`mt-0.5 block text-xl font-bold tabular-nums ${
            pendingRequests > 0 ? "text-amber-900" : "text-slate-700"
          }`}
        >
          {pendingRequests}
        </strong>
      </button>
    </section>
  );
}
