import { useMemo, useState } from "react";
import { ChartBar } from "@phosphor-icons/react";
import type { TrendPoint } from "../../lib/dashboard-api";

type Props = {
  trendPoints: TrendPoint[];
  benchmarkScore: number | null;
  totalAttempts: number;
};

type SeriesFilter = "ALL" | "ATTEMPTS" | "ATTENDANCE" | "SCORE";

export default function PastelAnalyticsChart({
  trendPoints,
  benchmarkScore,
  totalAttempts,
}: Props) {
  const [activeSeries, setActiveSeries] = useState<SeriesFilter>("ALL");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Canvas dimensions
  const svgWidth = 1500;
  const svgHeight = 300;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 42;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Real data normalization
  const validPoints = useMemo(() => {
    return trendPoints.filter(
      (p) =>
        (p.completedAttempts && p.completedAttempts > 0) ||
        (p.attendanceRate !== null && p.attendanceRate > 0) ||
        (p.averageScore !== null && p.averageScore > 0)
    );
  }, [trendPoints]);

  // Points to render: if validPoints has items use it; else fallback to raw trendPoints
  const displayPoints = useMemo(() => {
    return validPoints.length > 0 ? validPoints : trendPoints;
  }, [validPoints, trendPoints]);

  const maxAttempts = useMemo(() => {
    const vals = displayPoints.map((p) => p.completedAttempts || 0);
    return Math.max(10, ...vals);
  }, [displayPoints]);

  const pointCount = Math.max(displayPoints.length, 1);
  const stepX = chartWidth / (pointCount > 1 ? pointCount - 1 : 1);
  const barWidth = Math.min(32, Math.max(14, Math.floor(chartWidth / (pointCount * 2.4))));

  const getX = (idx: number) => {
    if (pointCount === 1) return padLeft + chartWidth / 2;
    return padLeft + idx * stepX;
  };

  // Y for attempts (bar): 0 to maxAttempts
  const getYAttempts = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxAttempts));
    return padTop + chartHeight * (1 - ratio);
  };

  // Y for attendance (0 to 100%)
  const getYAttendance = (rate: number) => {
    const ratio = Math.max(0, Math.min(1, rate / 100));
    return padTop + chartHeight * (1 - ratio);
  };

  // Y for band score (0 to 9.0)
  const getYScore = (score: number) => {
    const ratio = Math.max(0, Math.min(1, score / 9.0));
    return padTop + chartHeight * (1 - ratio);
  };

  // Cubic bezier path generator
  const createBezierPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(
        1
      )}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // Attendance Line Points
  const attendanceLinePts = useMemo(() => {
    return displayPoints
      .map((p, idx) => {
        if (p.attendanceRate === null || p.attendanceRate <= 0) return null;
        return {
          x: getX(idx),
          y: getYAttendance(p.attendanceRate),
          val: Math.round(p.attendanceRate),
          idx,
        };
      })
      .filter((p): p is { x: number; y: number; val: number; idx: number } => p !== null);
  }, [displayPoints]);

  const attendancePath = useMemo(() => createBezierPath(attendanceLinePts), [attendanceLinePts]);

  // Score Line Points
  const scoreLinePts = useMemo(() => {
    return displayPoints
      .map((p, idx) => {
        if (p.averageScore === null || p.averageScore <= 0) return null;
        return {
          x: getX(idx),
          y: getYScore(p.averageScore),
          val: Number(p.averageScore.toFixed(1)),
          idx,
        };
      })
      .filter((p): p is { x: number; y: number; val: number; idx: number } => p !== null);
  }, [displayPoints]);

  const scorePath = useMemo(() => createBezierPath(scoreLinePts), [scoreLinePts]);

  const hoveredPoint = hoveredIndex !== null ? displayPoints[hoveredIndex] : null;

  return (
    <div className="min-w-0 rounded-3xl border border-[#eadfe3] bg-white/95 p-5 shadow-[0_10px_30px_rgba(91,49,63,0.07)]">
      {/* Top Header & Compact Switcher */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#eee7ea] pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-[#f8e8ed] text-[#b2385b]">
            <ChartBar size={19} weight="duotone" />
          </div>
          <h3 className="font-display text-base font-extrabold text-[#211a1d]">
            Xu hướng học tập & nộp bài
          </h3>
        </div>

        <div className="flex items-center rounded-2xl bg-[#f7f1f3] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSeries("ALL")}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSeries === "ALL"
                ? "bg-[#ad3d60] text-white shadow-sm"
                : "text-[#6f6670] hover:text-[#ad3d60]"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("ATTEMPTS")}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSeries === "ATTEMPTS"
                ? "bg-[#ad3d60] text-white shadow-sm"
                : "text-[#6f6670] hover:text-[#ad3d60]"
            }`}
          >
            Bài nộp
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("ATTENDANCE")}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSeries === "ATTENDANCE"
                ? "bg-[#ad3d60] text-white shadow-sm"
                : "text-[#6f6670] hover:text-[#ad3d60]"
            }`}
          >
            Chuyên cần
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("SCORE")}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSeries === "SCORE"
                ? "bg-[#ad3d60] text-white shadow-sm"
                : "text-[#6f6670] hover:text-[#ad3d60]"
            }`}
          >
            Điểm TB
          </button>
        </div>
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-4">
          {(activeSeries === "ALL" || activeSeries === "ATTEMPTS") && (
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#ad3d60]" />
              <span className="text-[#5f5760]">Lượt bài tập nộp</span>
            </div>
          )}
          {(activeSeries === "ALL" || activeSeries === "ATTENDANCE") && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#ed8098]" />
              <span className="text-[#5f5760]">Tỷ lệ chuyên cần (%)</span>
            </div>
          )}
          {(activeSeries === "ALL" || activeSeries === "SCORE") && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#8e8a99]" />
              <span className="text-[#5f5760]">Điểm trung bình (Band)</span>
            </div>
          )}
        </div>

        <span className="font-mono text-[11px] font-bold text-[#9b5268]">
          {displayPoints.length} ngày ghi nhận dữ liệu
        </span>
      </div>

      {/* SVG Multi-Series Canvas */}
      <div className="relative flex h-[230px] w-full items-center justify-center sm:h-[250px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-full w-full select-none overflow-visible"
          role="img"
          aria-label={`Biểu đồ xu hướng học tập trong ${displayPoints.length} ngày ghi nhận dữ liệu`}
        >
          <defs>
            {/* Pastel Rose Bar Gradient */}
            <linearGradient id="barPastelRoseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a9365a" />
              <stop offset="100%" stopColor="#d87993" />
            </linearGradient>

            <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#862744" />
              <stop offset="100%" stopColor="#b94b6d" />
            </linearGradient>
          </defs>

          {/* Y-axis labels and grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const ratio = value / 100;
            const y = padTop + chartHeight * (1 - ratio);
            return (
              <g key={value}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#eee7ea"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 14}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#8a818a] text-[10px] font-semibold"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* 1. ATTEMPTS BARS (REAL DATA) */}
          {(activeSeries === "ALL" || activeSeries === "ATTEMPTS") &&
            displayPoints.map((p, idx) => {
              const x = getX(idx);
              const attempts = p.completedAttempts || 0;
              const y = getYAttempts(attempts);
              const height = Math.max(attempts > 0 ? 4 : 0, padTop + chartHeight - y);
              const isHovered = hoveredIndex === idx;

              if (attempts === 0) return null;

              return (
                <rect
                  key={idx}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={Math.min(barWidth / 2, 4)}
                  fill={isHovered ? "url(#barHoverGrad)" : "url(#barPastelRoseGrad)"}
                  className="transition-all"
                />
              );
            })}

          {/* 2. ATTENDANCE LINE (REAL DATA) */}
          {(activeSeries === "ALL" || activeSeries === "ATTENDANCE") && attendancePath && (
            <g>
              <path
                d={attendancePath}
                fill="none"
                stroke="#ed8098"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
              {attendanceLinePts.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === pt.idx ? "5" : "3"}
                  fill="#ffffff"
                  stroke="#ed8098"
                  strokeWidth="2"
                  className="transition-all"
                />
              ))}
            </g>
          )}

          {/* 3. SCORE LINE (REAL DATA) */}
          {(activeSeries === "ALL" || activeSeries === "SCORE") && scorePath && (
            <g>
              <path
                d={scorePath}
                fill="none"
                stroke="#8e8a99"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
              {scoreLinePts.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === pt.idx ? "5" : "3"}
                  fill="#ffffff"
                  stroke="#8e8a99"
                  strokeWidth="2"
                  className="transition-all"
                />
              ))}
            </g>
          )}

          {/* X Axis Date Labels */}
          {displayPoints.map((p, idx) => (
            <text
              key={idx}
              x={getX(idx)}
              y={svgHeight - 12}
              textAnchor="middle"
              className={`text-[10px] font-mono transition-colors ${
                hoveredIndex === idx ? "fill-[#ad3d60] font-bold" : "fill-[#7d747e] font-semibold"
              }`}
            >
              {p.dateLabel}
            </text>
          ))}

          {/* Interactive Mouse Hover Rectangles */}
          {displayPoints.map((_, idx) => {
            const x = getX(idx);
            const w = pointCount > 1 ? stepX : chartWidth;
            return (
              <rect
                key={idx}
                x={x - w / 2}
                y={padTop}
                width={w}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Soft Neumorphic Floating Tooltip on Hover */}
        {hoveredPoint && (
          <div
            className="absolute top-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-[4px_4px_12px_rgba(163,177,198,0.25)] text-xs pointer-events-none transition-all z-20 min-w-[140px]"
            style={{
              left: `${Math.min(
                75,
                Math.max(10, (getX(hoveredIndex!) / svgWidth) * 100)
              )}%`,
            }}
          >
            <div className="font-extrabold text-[#1b1b21] border-b border-slate-100 pb-1 mb-1">
              {hoveredPoint.dateLabel}
            </div>
            <div className="space-y-0.5 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-3 text-[#ad3d60]">
                <span>Bài nộp:</span>
                <span className="font-bold">{hoveredPoint.completedAttempts || 0} bài</span>
              </div>
              {hoveredPoint.attendanceRate !== null && (
                <div className="flex items-center justify-between gap-3 text-[#d9637f]">
                  <span>Chuyên cần:</span>
                  <span className="font-bold">{Math.round(hoveredPoint.attendanceRate)}%</span>
                </div>
              )}
              {hoveredPoint.averageScore !== null && (
                <div className="flex items-center justify-between gap-3 text-[#777381]">
                  <span>Điểm TB:</span>
                  <span className="font-bold">{hoveredPoint.averageScore.toFixed(1)} Band</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state overlay when no attempts exist */}
        {displayPoints.length === 0 && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center p-4 text-center rounded-2xl pointer-events-none">
            <span className="text-xs font-bold text-[#1b1b21]">Chưa có dữ liệu trong kỳ</span>
            <span className="text-[11px] text-[#64748b] mt-0.5">
              Vui lòng chọn khoảng thời gian 30 ngày qua hoặc Toàn thời gian
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
