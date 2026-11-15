import { useMemo, useState } from "react";
import {
  CalendarBlank,
  ChartBar,
  CurrencyCircleDollar,
  GraduationCap,
  Info,
} from "@phosphor-icons/react";
import type { TrendPoint } from "../../lib/dashboard-api";
import type { OrderAdminDto } from "../billing/BillingWorkspace";

export type DailyDataMode = "SALES" | "ACADEMIC";

export type DailyChartItem = {
  dateKey: string;      // "2026-11-05"
  dateLabel: string;    // "05/11"
  fullDateLabel: string;// "05/11/2026"
  // Primary (Bar) metric
  barValue: number;     // e.g. Doanh thu in Million VND OR Lượt làm bài
  barDisplay: string;   // e.g. "0.066 tr" OR "12 bài"
  // Secondary (Line) metric
  lineValue: number;    // e.g. Số đơn hoàn tất OR Điểm TB / Tỷ lệ
  lineDisplay: string;  // e.g. "1 đơn" OR "6.5 Band"
};

type Props = {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  trendPoints: TrendPoint[];
  orders?: OrderAdminDto[];
  totalInvoicedAmount?: number;
  onRefresh?: () => void;
};

export default function DailyAnalyticsComboChart({
  timeRange,
  onTimeRangeChange,
  trendPoints,
  orders = [],
  totalInvoicedAmount = 0,
  onRefresh,
}: Props) {
  const [dataMode, setDataMode] = useState<DailyDataMode>("SALES");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Date range picker states (defaults aligned with system dates)
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // ---------------------------------------------------------------------------
  // 1. DATA PREPARATION: AGGREGATE DAILY POINTS FROM REAL SYSTEM DATA
  // ---------------------------------------------------------------------------
  const chartItems: DailyChartItem[] = useMemo(() => {
    // Generate base dates from trendPoints
    if (!trendPoints || trendPoints.length === 0) {
      return [];
    }

    // Index orders by date (YYYY-MM-DD)
    const ordersByDate = new Map<string, { revenue: number; count: number }>();
    orders.forEach((ord) => {
      const rawDate = ord.paidAt || ord.createdAt;
      if (!rawDate) return;
      const key = rawDate.slice(0, 10);
      const current = ordersByDate.get(key) || { revenue: 0, count: 0 };
      if (ord.status === "PAID") {
        current.revenue += ord.amount || 0;
        current.count += 1;
      }
      ordersByDate.set(key, current);
    });

    return trendPoints.map((tp) => {
      const key = tp.date ? String(tp.date).slice(0, 10) : "";
      const dateParts = key.split("-");
      const fullDateLabel =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : tp.dateLabel;

      if (dataMode === "SALES") {
        const ordData = ordersByDate.get(key) || { revenue: 0, count: 0 };
        // Value in Million VND for clean bar chart representation (e.g. 66.000 -> 0.066)
        const revMillion = ordData.revenue / 1_000_000;
        const formattedRev =
          ordData.revenue >= 1_000_000
            ? `${(ordData.revenue / 1_000_000).toFixed(2)} tr`
            : ordData.revenue > 0
            ? `${ordData.revenue.toLocaleString("vi-VN")} đ`
            : "0 đ";

        return {
          dateKey: key,
          dateLabel: tp.dateLabel,
          fullDateLabel,
          barValue: revMillion,
          barDisplay: formattedRev,
          lineValue: ordData.count,
          lineDisplay: `${ordData.count} đơn`,
        };
      } else {
        // Academic mode: Completed test attempts + Average Band Score
        const attempts = tp.completedAttempts || 0;
        const avgScore = tp.averageScore || 0;

        return {
          dateKey: key,
          dateLabel: tp.dateLabel,
          fullDateLabel,
          barValue: attempts,
          barDisplay: `${attempts} bài`,
          lineValue: avgScore,
          lineDisplay: avgScore > 0 ? `${avgScore.toFixed(1)} Band` : "—",
        };
      }
    });
  }, [trendPoints, orders, dataMode]);

  // If there are no points or custom range requested, fallback gracefully
  const displayItems = useMemo(() => {
    return chartItems;
  }, [chartItems]);

  // ---------------------------------------------------------------------------
  // 2. SUMMARY METRICS COMPUTATION (FOR THE 4 SQUARED BOXES IN CARD)
  // ---------------------------------------------------------------------------
  const summaryMetrics = useMemo(() => {
    if (dataMode === "SALES") {
      const totalRevVnd = displayItems.reduce((acc, it) => acc + it.barValue * 1_000_000, 0);
      const totalOrders = displayItems.reduce((acc, it) => acc + it.lineValue, 0);
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevVnd / totalOrders) : 0;

      // Find highest day
      let maxRev = -1;
      let highestDate = "—";
      displayItems.forEach((it) => {
        if (it.barValue > maxRev && it.barValue > 0) {
          maxRev = it.barValue;
          highestDate = it.fullDateLabel;
        }
      });

      // If no revenue in trend points, fallback to latest known order date or today
      if (highestDate === "—" && displayItems.length > 0) {
        highestDate = displayItems[displayItems.length - 1].fullDateLabel;
      }

      return {
        box1Label: "Doanh thu kỳ",
        box1Value: totalRevVnd > 0 ? `${totalRevVnd.toLocaleString("vi-VN")} đ` : `${totalInvoicedAmount.toLocaleString("vi-VN")} đ`,
        box2Label: "Đơn hoàn tất",
        box2Value: String(totalOrders),
        box3Label: "Giá trị đơn TB",
        box3Value: avgOrderValue > 0 ? `${avgOrderValue.toLocaleString("vi-VN")} đ` : "0 đ",
        box4Label: "Ngày cao nhất",
        box4Value: highestDate,
      };
    } else {
      const totalAttempts = displayItems.reduce((acc, it) => acc + it.barValue, 0);
      const validScores = displayItems.filter((it) => it.lineValue > 0);
      const avgBand =
        validScores.length > 0
          ? (validScores.reduce((acc, it) => acc + it.lineValue, 0) / validScores.length).toFixed(1)
          : "—";

      let maxAttempts = -1;
      let highestDate = "—";
      displayItems.forEach((it) => {
        if (it.barValue > maxAttempts && it.barValue > 0) {
          maxAttempts = it.barValue;
          highestDate = it.fullDateLabel;
        }
      });
      if (highestDate === "—" && displayItems.length > 0) {
        highestDate = displayItems[displayItems.length - 1].fullDateLabel;
      }

      return {
        box1Label: "Tổng lượt nộp",
        box1Value: `${totalAttempts} bài`,
        box2Label: "Bài đạt chuẩn",
        box2Value: String(totalAttempts),
        box3Label: "Điểm TB kỳ",
        box3Value: avgBand !== "—" ? `${avgBand} Band` : "—",
        box4Label: "Ngày tích cực nhất",
        box4Value: highestDate,
      };
    }
  }, [displayItems, dataMode, totalInvoicedAmount]);

  // Date range display text
  const dateRangeSubtitle = useMemo(() => {
    if (displayItems.length >= 2) {
      return `Từ ${displayItems[0].fullDateLabel} đến ${displayItems[displayItems.length - 1].fullDateLabel} · chỉ tính ${
        dataMode === "SALES" ? "đơn hoàn thành hợp lệ" : "lượt nộp bài chính thức"
      }`;
    }
    return `Dữ liệu thời gian thực từ hệ thống The IELTS Spells`;
  }, [displayItems, dataMode]);

  // ---------------------------------------------------------------------------
  // 3. SVG COORDINATE CALCULATIONS (DUAL-AXIS COMBO CHART)
  // ---------------------------------------------------------------------------
  const svgWidth = 980;
  const svgHeight = 280;
  const padLeft = 56;
  const padRight = 50;
  const padTop = 24;
  const padBottom = 42;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Max calculations for dual axes
  const maxBarVal = useMemo(() => {
    const vals = displayItems.map((d) => d.barValue);
    const m = Math.max(0.08, ...vals);
    return m === 0 ? 0.1 : m * 1.15;
  }, [displayItems]);

  const maxLineVal = useMemo(() => {
    if (dataMode === "SALES") {
      const vals = displayItems.map((d) => d.lineValue);
      const m = Math.max(1, ...vals);
      return Math.ceil(m * 1.25);
    } else {
      // Band score up to 9.0
      return 9.0;
    }
  }, [displayItems, dataMode]);

  const pointCount = Math.max(displayItems.length, 1);
  const stepX = chartWidth / (pointCount > 1 ? pointCount - 1 : 1);
  const barWidth = Math.min(36, Math.max(16, Math.floor(chartWidth / (pointCount * 2.8))));

  const getX = (idx: number) => {
    if (pointCount === 1) return padLeft + chartWidth / 2;
    return padLeft + idx * stepX;
  };

  const getYBar = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxBarVal));
    return padTop + chartHeight * (1 - ratio);
  };

  const getYLine = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxLineVal));
    return padTop + chartHeight * (1 - ratio);
  };

  // Generate smooth line path
  const linePoints = useMemo(() => {
    return displayItems.map((it, idx) => ({
      x: getX(idx),
      y: getYLine(it.lineValue),
      val: it.lineValue,
      idx,
    }));
  }, [displayItems, maxLineVal]);

  const linePath = useMemo(() => {
    if (linePoints.length === 0) return "";
    return linePoints.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ""
    );
  }, [linePoints]);

  // Left axis tick values (5 ticks)
  const leftTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const v = (maxBarVal * i) / 4;
      ticks.push(v);
    }
    return ticks;
  }, [maxBarVal]);

  // Right axis tick values (5 ticks)
  const rightTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const v = (maxLineVal * i) / 4;
      ticks.push(v);
    }
    return ticks;
  }, [maxLineVal]);

  const activeHover = hoveredIdx !== null ? displayItems[hoveredIdx] : null;

  return (
    <div className="bg-white border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col justify-between">
      {/* ===================================================================== */}
      {/* 1. HEADER ROW WITH TITLE, SUBTITLE & CONTROLS                        */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Title & Mode Tabs */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-none bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <ChartBar size={18} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {dataMode === "SALES"
                    ? "Thống kê Doanh số & Đơn hàng theo ngày"
                    : "Thống kê Lượt làm bài & Điểm số theo ngày"}
                </h2>
                {/* Mode toggle badge */}
                <div className="inline-flex border border-slate-200 rounded-none bg-slate-50 text-[11px] font-bold p-0.5">
                  <button
                    type="button"
                    onClick={() => setDataMode("SALES")}
                    className={`px-2 py-0.5 transition-colors ${
                      dataMode === "SALES"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Doanh thu
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataMode("ACADEMIC")}
                    className={`px-2 py-0.5 transition-colors ${
                      dataMode === "ACADEMIC"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Học tập
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{dateRangeSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Date Inputs & Quick Range Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Quick Filter Buttons */}
          <div className="inline-flex border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => onTimeRangeChange("7d")}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                timeRange === "7d"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-r border-slate-200"
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => onTimeRangeChange("30d")}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                timeRange === "30d"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              30 ngày
            </button>
          </div>

          {/* Date Picker Range Inputs (Clean Square Inputs) */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="flex items-center border border-slate-200 px-2 py-1 bg-white">
              <span className="text-slate-400 mr-1.5 font-medium">Từ ngày:</span>
              <input
                type="text"
                placeholder={displayItems[0]?.fullDateLabel || "dd/mm/yyyy"}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-24 border-none p-0 text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
              />
              <CalendarBlank size={14} className="text-slate-400 ml-1" />
            </div>

            <div className="flex items-center border border-slate-200 px-2 py-1 bg-white">
              <span className="text-slate-400 mr-1.5 font-medium">Đến ngày:</span>
              <input
                type="text"
                placeholder={displayItems[displayItems.length - 1]?.fullDateLabel || "dd/mm/yyyy"}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-24 border-none p-0 text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
              />
              <CalendarBlank size={14} className="text-slate-400 ml-1" />
            </div>
          </div>

          {/* Action button: Xem dữ liệu */}
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer border border-slate-900"
          >
            Xem dữ liệu
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. THE 4 SQUARE METRIC BOXES INSIDE THE CARD (MATCHING REFERENCE)    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {/* Box 1 */}
        <div className="border border-slate-200 p-3 bg-white">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {summaryMetrics.box1Label}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            {summaryMetrics.box1Value}
          </p>
        </div>

        {/* Box 2 */}
        <div className="border border-slate-200 p-3 bg-white">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {summaryMetrics.box2Label}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            {summaryMetrics.box2Value}
          </p>
        </div>

        {/* Box 3 */}
        <div className="border border-slate-200 p-3 bg-white">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {summaryMetrics.box3Label}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            {summaryMetrics.box3Value}
          </p>
        </div>

        {/* Box 4: Highlighted red date like reference */}
        <div className="border border-slate-200 p-3 bg-white">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {summaryMetrics.box4Label}
          </p>
          <p className="text-lg font-bold text-[#dc2626] mt-1 tracking-tight">
            {summaryMetrics.box4Value}
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. DUAL-AXIS COMBO CHART (BARS + LINE WITH DOTS)                      */}
      {/* ===================================================================== */}
      <div className="relative mt-2">
        {/* Chart Legends */}
        <div className="flex items-center justify-between mb-2 text-xs font-medium text-slate-600 px-1">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="size-3 bg-[#264653] inline-block border border-[#1b323c]" />
              <span className="text-slate-700">
                {dataMode === "SALES" ? "Doanh thu (triệu VND)" : "Lượt làm bài nộp"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#d97706] inline-block ring-2 ring-amber-200" />
              <span className="text-slate-700">
                {dataMode === "SALES" ? "Đơn hoàn tất" : "Điểm TB Band"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {displayItems.length} mốc thời gian ghi nhận
          </div>
        </div>

        {/* SVG Viewport */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none min-w-[620px]"
          >
            {/* Horizontal Gridlines */}
            {leftTicks.map((tick, i) => {
              const y = getYBar(tick);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "3,3"}
                  />
                  {/* Left Axis Label (Triệu VND / Lượt) */}
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {dataMode === "SALES" ? tick.toFixed(2) : Math.round(tick)}
                  </text>
                </g>
              );
            })}

            {/* Right Axis Labels (Đơn hàng / Điểm) */}
            {rightTicks.map((tick, i) => {
              const y = getYLine(tick);
              return (
                <text
                  key={i}
                  x={svgWidth - padRight + 10}
                  y={y + 4}
                  textAnchor="start"
                  fontSize="11"
                  fill="#b45309"
                  fontFamily="monospace"
                >
                  {dataMode === "SALES" ? tick.toFixed(1) : tick.toFixed(1)}
                </text>
              );
            })}

            {/* Left Y Axis Title */}
            <text
              x={padLeft}
              y={padTop - 10}
              fontSize="10"
              fill="#64748b"
              fontWeight="bold"
            >
              {dataMode === "SALES" ? "Triệu VNĐ" : "Số lượt bài"}
            </text>

            {/* Right Y Axis Title */}
            <text
              x={svgWidth - padRight}
              y={padTop - 10}
              textAnchor="end"
              fontSize="10"
              fill="#b45309"
              fontWeight="bold"
            >
              {dataMode === "SALES" ? "Đơn hàng" : "Điểm Band"}
            </text>

            {/* Bars Series (Squared dark/teal bars) */}
            {displayItems.map((item, idx) => {
              const xCenter = getX(idx);
              const xLeft = xCenter - barWidth / 2;
              const yTop = getYBar(item.barValue);
              const height = Math.max(0, chartHeight - (yTop - padTop));
              const isHovered = hoveredIdx === idx;

              return (
                <g key={`bar-${idx}`}>
                  {/* Invisible hit area for hover */}
                  <rect
                    x={xCenter - stepX / 2}
                    y={padTop}
                    width={stepX}
                    height={chartHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  />
                  {/* Visible Bar (Square) */}
                  <rect
                    x={xLeft}
                    y={yTop}
                    width={barWidth}
                    height={height}
                    fill={isHovered ? "#1b323c" : "#264653"}
                    className="transition-colors duration-150 pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Line Series (Amber/orange line) */}
            {linePoints.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none"
              />
            )}

            {/* Line Dots */}
            {linePoints.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={`dot-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  className="pointer-events-none transition-all duration-150"
                />
              );
            })}

            {/* Bottom X-Axis line & labels */}
            <line
              x1={padLeft}
              y1={padTop + chartHeight}
              x2={svgWidth - padRight}
              y2={padTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {displayItems.map((item, idx) => {
              const x = getX(idx);
              const isHovered = hoveredIdx === idx;
              return (
                <g key={`xlab-${idx}`}>
                  <line
                    x1={x}
                    y1={padTop + chartHeight}
                    x2={x}
                    y2={padTop + chartHeight + 5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={padTop + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered ? "bold" : "normal"}
                    fill={isHovered ? "#0f172a" : "#64748b"}
                  >
                    {item.dateLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip (Crisp square box) */}
        {activeHover && hoveredIdx !== null && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900 text-white text-xs p-2.5 shadow-lg border border-slate-700"
            style={{
              left: `${Math.min(80, Math.max(10, (hoveredIdx / (pointCount - 1 || 1)) * 85))}%`,
              top: "15%",
            }}
          >
            <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-slate-200">
              {activeHover.fullDateLabel}
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">
                  {dataMode === "SALES" ? "Doanh số:" : "Lượt nộp:"}
                </span>
                <span className="font-bold text-emerald-400">{activeHover.barDisplay}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">
                  {dataMode === "SALES" ? "Đơn hoàn tất:" : "Điểm TB:"}
                </span>
                <span className="font-bold text-amber-300">{activeHover.lineDisplay}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
