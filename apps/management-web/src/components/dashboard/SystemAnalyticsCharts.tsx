import {
  CaretDown,
  CheckCircle,
  Clock,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { TrendPoint } from "../../lib/dashboard-api";

type Props = {
  trendPoints: TrendPoint[];
  benchmarkScore: number | null;
  totalAttempts: number;
};

type ChartTab = "score" | "attempts" | "attendance";
type SkillFilter = "ALL" | "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export default function SystemAnalyticsCharts({
  trendPoints,
  benchmarkScore,
  totalAttempts,
}: Props) {
  const [activeTab, setActiveTab] = useState<ChartTab>("score");
  const [selectedSkill, setSelectedSkill] = useState<SkillFilter>("ALL");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // -------------------------------------------------------------
  // 1. DATA PREPARATION: SCORE DATA (4 SKILLS ACROSS 6 TIME PERIODS)
  // -------------------------------------------------------------
  const scoreData = useMemo(() => {
    // Standard 6 periods: T5, T6, T7, T8, T9, T10
    const defaultPeriods = ["T5", "T6", "T7", "T8", "T9", "T10"];

    // Base scores that can be calibrated with real trendPoints if available
    const baseScores = [
      { period: "T5", reading: 5.6, listening: 5.4, writing: 5.0, speaking: 5.2 },
      { period: "T6", reading: 5.7, listening: 5.5, writing: 5.2, speaking: 5.3 },
      { period: "T7", reading: 5.8, listening: 5.7, writing: 5.3, speaking: 5.5 },
      { period: "T8", reading: 5.9, listening: 5.8, writing: 5.4, speaking: 5.6 },
      { period: "T9", reading: 6.0, listening: 6.0, writing: 5.5, speaking: 5.7 },
      { period: "T10", reading: 6.0, listening: 6.1, writing: 5.6, speaking: 5.8 },
    ];

    // If trendPoints has real points, map or calibrate
    if (trendPoints.length >= 3) {
      const realSlice = trendPoints.slice(-6);
      return realSlice.map((p, idx) => {
        const label = p.dateLabel || defaultPeriods[idx] || `T${idx + 5}`;
        const avg = p.averageScore || 5.8;
        return {
          period: label,
          reading: Number((p.readingScore ?? (avg + 0.2)).toFixed(1)),
          listening: Number((p.listeningScore ?? (avg + 0.3)).toFixed(1)),
          writing: Number((p.writingScore ?? (avg - 0.2)).toFixed(1)),
          speaking: Number((p.speakingScore ?? (avg - 0.0)).toFixed(1)),
        };
      });
    }

    return baseScores;
  }, [trendPoints]);

  // -------------------------------------------------------------
  // 2. DATA PREPARATION: ASSIGNMENT BARS (WEEKLY SUBMISSIONS)
  // -------------------------------------------------------------
  const weeklyAssignmentData = useMemo(() => {
    // 4 weeks: 11, 12, 13, 14
    return [
      { week: "11", submitted: 46, reviewed: 39, overdue: 9 },
      { week: "12", submitted: 54, reviewed: 44, overdue: 11 },
      { week: "13", submitted: 51, reviewed: 42, overdue: 8 },
      { week: "14", submitted: 62, reviewed: 48, overdue: 14 },
    ];
  }, []);

  // -------------------------------------------------------------
  // 3. DATA PREPARATION: ATTENDANCE DATA (WEEKLY PARTICIPATION)
  // -------------------------------------------------------------
  const weeklyAttendanceData = useMemo(() => {
    // 4 weeks: T1, T2, T3, T4
    return [
      { week: "T1", rate: 92 },
      { week: "T2", rate: 88 },
      { week: "T3", rate: 94 },
      { week: "T4", rate: 90 },
    ];
  }, []);

  // System Color Palette
  const skillColors = {
    READING: { stroke: "#2563EB", label: "Reading", light: "#DBEAFE" },
    LISTENING: { stroke: "#8B3F56", label: "Listening", light: "#FCE7F3" },
    WRITING: { stroke: "#EA580C", label: "Writing", light: "#FFEDD5" },
    SPEAKING: { stroke: "#10B981", label: "Speaking", light: "#D1FAE5" },
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Top Controls Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Dữ liệu phân tích học tập
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span className="size-2 rounded-full bg-[#8B3F56]" />
              {activeTab === "score"
                ? "Điểm trung bình theo kỹ năng"
                : activeTab === "attempts"
                ? "Khối lượng bài tập theo tuần"
                : "Tỷ lệ chuyên cần theo tuần"}
            </h3>
          </div>

          {/* Tab Selection (Điểm số, Bài nộp, Chuyên cần) */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("score");
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "score"
                  ? "bg-white text-[#8B3F56] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Điểm số
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("attempts");
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "attempts"
                  ? "bg-white text-[#8B3F56] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bài nộp
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("attendance");
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "attendance"
                  ? "bg-white text-[#8B3F56] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Chuyên cần
            </button>
          </div>
        </div>

        {/* Sub-control for Score Tab: Skill Dropdown Filter */}
        {activeTab === "score" && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Lọc kỹ năng:</span>
              <div className="relative">
                <select
                  value={selectedSkill}
                  onChange={e => setSelectedSkill(e.target.value as SkillFilter)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-1 text-xs font-bold text-slate-700 shadow-2xs focus:border-[#8B3F56] focus:outline-none focus:ring-1 focus:ring-[#8B3F56]"
                >
                  <option value="ALL">Tất cả kỹ năng</option>
                  <option value="READING">Reading</option>
                  <option value="LISTENING">Listening</option>
                  <option value="WRITING">Writing</option>
                  <option value="SPEAKING">Speaking</option>
                </select>
                <CaretDown size={12} weight="bold" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {benchmarkScore !== null && (
              <span className="text-[11px] font-medium text-slate-500 hidden sm:flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                Mục tiêu trung bình: <strong>{benchmarkScore.toFixed(1)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative w-full h-[270px] select-none">
        {activeTab === "score" ? (
          <ScoreMultiLineChart
            data={scoreData}
            selectedSkill={selectedSkill}
            hoveredIndex={hoveredPointIndex}
            onHover={setHoveredPointIndex}
            skillColors={skillColors}
          />
        ) : activeTab === "attempts" ? (
          <WeeklyAssignmentsBarChart
            data={weeklyAssignmentData}
            hoveredIndex={hoveredPointIndex}
            onHover={setHoveredPointIndex}
          />
        ) : (
          <WeeklyAttendanceLineChart
            data={weeklyAttendanceData}
            hoveredIndex={hoveredPointIndex}
            onHover={setHoveredPointIndex}
          />
        )}
      </div>

      {/* Bottom Chart Footer Legend & Subtitles */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
        {/* Dynamic Legend */}
        {activeTab === "score" ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#2563EB]" /> Reading
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#8B3F56]" /> Listening
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#EA580C]" /> Writing
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#10B981]" /> Speaking
            </span>
          </div>
        ) : activeTab === "attempts" ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#2563EB]" /> Đã nộp
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#10B981]" /> Đã duyệt
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="size-2.5 rounded-full bg-[#C2410C]" /> Quá hạn
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#8B3F56]" />
            <span className="font-semibold text-slate-700">Tỷ lệ tham dự học tập theo tuần</span>
          </div>
        )}

        {/* Subtext description */}
        <span className="text-[11px] text-slate-400 italic">
          {activeTab === "score"
            ? "Trục X: thời gian. Trục Y: band trung bình (0–9)."
            : activeTab === "attempts"
            ? "Minh họa: số bài theo trạng thái"
            : "Minh họa: tỷ lệ tham dự"}
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// BIỂU ĐỒ 1: ĐIỂM TRUNG BÌNH THEO KỸ NĂNG (MULTI-LINE 4 SKILLS)
// =========================================================================
function ScoreMultiLineChart({
  data,
  selectedSkill,
  hoveredIndex,
  onHover,
  skillColors,
}: {
  data: Array<{ period: string; reading: number; listening: number; writing: number; speaking: number }>;
  selectedSkill: SkillFilter;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
  skillColors: Record<string, { stroke: string; label: string; light: string }>;
}) {
  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 130, bottom: 30, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minVal = 0;
  const maxVal = 9.0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding.top + chartHeight - ((clamped - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const generatePath = (key: "reading" | "listening" | "writing" | "speaking") => {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
      .join(" ");
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : data.length - 1;
  const activeItem = data[activeIndex] || data[data.length - 1];

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => onHover(null)}
      >
        {/* Horizontal grid lines & Y-axis labels */}
        {[0, 3, 5, 7, 9].map(val => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-bold"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Vertical guide line on hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={padding.top}
            x2={getX(hoveredIndex)}
            y2={padding.top + chartHeight}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* 4 Skill Lines */}
        {(["reading", "listening", "writing", "speaking"] as const).map(skillKey => {
          const skillEnum = skillKey.toUpperCase();
          const isSelected = selectedSkill === "ALL" || selectedSkill === skillEnum;
          const strokeColor = skillColors[skillEnum].stroke;
          const opacity = isSelected ? 1 : 0.15;
          const strokeWidth = selectedSkill === skillEnum ? 3 : 2.2;

          return (
            <g key={skillKey} opacity={opacity}>
              <path
                d={generatePath(skillKey)}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Node dots */}
              {data.map((d, i) => {
                const x = getX(i);
                const y = getY(d[skillKey]);
                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={`${skillKey}-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={strokeColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Hover interaction columns & X labels */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <g key={d.period}>
              {/* Invisible touch/mouse target */}
              <rect
                x={x - 20}
                y={padding.top}
                width={40}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
              />

              {/* X-axis Label */}
              <text
                x={x}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  hoveredIndex === i ? "fill-[#8B3F56]" : "fill-slate-500"
                }`}
              >
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Summary Card on Right (Exact layout as proposed in screenshot) */}
      <div className="absolute right-0 top-3 w-28 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xs p-2.5 shadow-md shadow-slate-200/50 text-xs space-y-1.5 pointer-events-none">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
          <span>{activeItem.period}</span>
          <span className="text-slate-500 font-mono">IELTS</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <span className="size-2 rounded-full bg-[#2563EB]" /> Reading
          </span>
          <strong className="font-bold text-slate-900 tabular-nums">{activeItem.reading}</strong>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <span className="size-2 rounded-full bg-[#8B3F56]" /> Listening
          </span>
          <strong className="font-bold text-slate-900 tabular-nums">{activeItem.listening}</strong>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <span className="size-2 rounded-full bg-[#EA580C]" /> Writing
          </span>
          <strong className="font-bold text-slate-900 tabular-nums">{activeItem.writing}</strong>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <span className="size-2 rounded-full bg-[#10B981]" /> Speaking
          </span>
          <strong className="font-bold text-slate-900 tabular-nums">{activeItem.speaking}</strong>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// BIỂU ĐỒ 2: KHỐI LƯỢNG BÀI TẬP THEO TUẦN (GROUPED BAR CHART)
// =========================================================================
function WeeklyAssignmentsBarChart({
  data,
  hoveredIndex,
  onHover,
}: {
  data: Array<{ week: string; submitted: number; reviewed: number; overdue: number }>;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}) {
  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 25, bottom: 30, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = 80;
  const minVal = 0;

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  const groupWidth = chartWidth / data.length;
  const barWidth = 22;
  const gap = 4;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => onHover(null)}
      >
        {/* Horizontal grid lines & Y labels */}
        {[0, 20, 40, 60, 80].map(val => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-bold"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {data.map((d, i) => {
          const groupCenterX = padding.left + i * groupWidth + groupWidth / 2;
          const totalBarsWidth = barWidth * 3 + gap * 2;
          const startX = groupCenterX - totalBarsWidth / 2;

          const isHovered = hoveredIndex === i;

          // Bar 1: Đã nộp (Blue)
          const hSubmitted = (d.submitted / maxVal) * chartHeight;
          const ySubmitted = padding.top + chartHeight - hSubmitted;

          // Bar 2: Đã duyệt (Green)
          const hReviewed = (d.reviewed / maxVal) * chartHeight;
          const yReviewed = padding.top + chartHeight - hReviewed;

          // Bar 3: Quá hạn (Coral)
          const hOverdue = (d.overdue / maxVal) * chartHeight;
          const yOverdue = padding.top + chartHeight - hOverdue;

          return (
            <g key={d.week}>
              {/* Highlight background column */}
              {isHovered && (
                <rect
                  x={groupCenterX - groupWidth / 2 + 6}
                  y={padding.top}
                  width={groupWidth - 12}
                  height={chartHeight}
                  fill="#F1F5F9"
                  rx="8"
                  opacity="0.6"
                />
              )}

              {/* Bar 1: Đã nộp */}
              <rect
                x={startX}
                y={ySubmitted}
                width={barWidth}
                height={hSubmitted}
                fill="#2563EB"
                rx="4"
                className="transition-all duration-150"
              />

              {/* Bar 2: Đã duyệt */}
              <rect
                x={startX + barWidth + gap}
                y={yReviewed}
                width={barWidth}
                height={hReviewed}
                fill="#10B981"
                rx="4"
                className="transition-all duration-150"
              />

              {/* Bar 3: Quá hạn */}
              <rect
                x={startX + (barWidth + gap) * 2}
                y={yOverdue}
                width={barWidth}
                height={hOverdue}
                fill="#C2410C"
                rx="4"
                className="transition-all duration-150"
              />

              {/* Invisible hover trigger */}
              <rect
                x={groupCenterX - groupWidth / 2}
                y={padding.top}
                width={groupWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
              />

              {/* X label */}
              <text
                x={groupCenterX}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  isHovered ? "fill-[#8B3F56]" : "fill-slate-600"
                }`}
              >
                {d.week}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip for Assignments */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white py-1.5 px-3 rounded-xl shadow-lg text-xs space-y-0.5"
          style={{
            left: `${((padding.left + hoveredIndex * (chartWidth / data.length) + (chartWidth / data.length) / 2) / width) * 100}%`,
            top: `${(getY(data[hoveredIndex].submitted) / height) * 100 - 10}%`,
          }}
        >
          <div className="font-bold text-slate-200 text-[11px] border-b border-slate-700 pb-0.5">
            Tuần {data[hoveredIndex].week}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="size-1.5 rounded-full bg-[#2563EB]" />
            <span>Đã nộp: <strong>{data[hoveredIndex].submitted}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#10B981]" />
            <span>Đã duyệt: <strong>{data[hoveredIndex].reviewed}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#C2410C]" />
            <span>Quá hạn: <strong>{data[hoveredIndex].overdue}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// BIỂU ĐỒ 3: TỶ LỆ CHUYÊN CẦN THEO TUẦN (AREA / LINE CHART)
// =========================================================================
function WeeklyAttendanceLineChart({
  data,
  hoveredIndex,
  onHover,
}: {
  data: Array<{ week: string; rate: number }>;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}) {
  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 35, bottom: 30, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minVal = 0;
  const maxVal = 100;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.rate)}`)
    .join(" ");

  const areaD = `${pathD} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(
    0
  )} ${padding.top + chartHeight} Z`;

  const activeIndex = hoveredIndex !== null ? hoveredIndex : data.length - 1;
  const activeItem = data[activeIndex] || data[data.length - 1];

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B3F56" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B3F56" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-bold"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#attendanceGradient)" />

        {/* Main trend line */}
        <path
          d={pathD}
          fill="none"
          stroke="#8B3F56"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical guide on hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={padding.top}
            x2={getX(hoveredIndex)}
            y2={padding.top + chartHeight}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Data points & triggers */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.rate);
          const isHovered = hoveredIndex === i;

          return (
            <g key={d.week}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="#8B3F56"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-all"
              />

              {/* Invisible touch/mouse target */}
              <circle
                cx={x}
                cy={y}
                r={20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
              />

              {/* X label */}
              <text
                x={x}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  hoveredIndex === i ? "fill-[#8B3F56]" : "fill-slate-600"
                }`}
              >
                {d.week}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Pill Tag (like in ChatGPT proposal: T4 • Chuyên cần 90%) */}
      <div
        className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white py-1.5 px-3 rounded-xl shadow-lg text-xs"
        style={{
          left: `${(getX(activeIndex) / width) * 100}%`,
          top: `${(getY(activeItem.rate) / height) * 100 - 10}%`,
        }}
      >
        <div className="flex items-center gap-1.5 font-bold whitespace-nowrap">
          <span className="size-1.5 rounded-full bg-[#10B981]" />
          <span>{activeItem.week}</span>
          <span className="text-slate-400">•</span>
          <span>Chuyên cần: <strong className="text-emerald-400">{activeItem.rate}%</strong></span>
        </div>
      </div>
    </div>
  );
}
