import { ChartLineUp } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { TrendPoint } from "../../lib/dashboard-api";

type Props = {
  trendPoints: TrendPoint[];
  benchmarkScore: number | null;
  totalAttempts: number;
};

const width = 1200;
const height = 320;
const padding = { top: 24, right: 58, bottom: 48, left: 58 };

export default function SystemAnalyticsCharts({
  trendPoints,
  benchmarkScore,
  totalAttempts,
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const hasData = trendPoints.some(
    (point) => point.completedAttempts > 0 || point.averageScore !== null,
  );

  const maxAttempts = useMemo(
    () => Math.max(1, ...trendPoints.map((point) => point.completedAttempts)),
    [trendPoints],
  );
  const scoredDays = useMemo(
    () => trendPoints.filter((point) => point.averageScore !== null),
    [trendPoints],
  );
  const periodAverage = scoredDays.length
    ? scoredDays.reduce((sum, point) => sum + (point.averageScore ?? 0), 0) /
      scoredDays.length
    : null;
  const stepX = trendPoints.length > 1 ? chartWidth / (trendPoints.length - 1) : 0;
  const barWidth = Math.min(28, Math.max(10, chartWidth / Math.max(18, trendPoints.length * 2.2)));
  const getX = (index: number) =>
    trendPoints.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + index * stepX;
  const getAttemptY = (value: number) =>
    padding.top + chartHeight - (value / maxAttempts) * chartHeight;
  const getScoreY = (value: number) =>
    padding.top + chartHeight - (Math.max(0, Math.min(9, value)) / 9) * chartHeight;

  const scorePath = useMemo(() => {
    let started = false;
    return trendPoints
      .map((point, index) => {
        if (point.averageScore === null) {
          started = false;
          return "";
        }
        const command = started ? "L" : "M";
        started = true;
        return `${command} ${getX(index).toFixed(1)} ${getScoreY(point.averageScore).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [trendPoints, stepX]);

  const hoveredPoint = hoveredIndex === null ? null : trendPoints[hoveredIndex];

  return (
    <section className="flex h-full min-h-[360px] flex-col rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(91,49,63,0.05)] lg:min-h-0">
      <div className="flex shrink-0 flex-col gap-3 border-b border-outline-variant/40 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ChartLineUp aria-hidden="true" size={19} weight="bold" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-on-surface">
              Hoạt động học tập theo ngày
            </h2>
            <p className="mt-0.5 text-[11px] leading-4 text-on-surface-variant">
              Lượt bài hoàn tất và điểm IELTS trung bình từ dữ liệu bài làm chính thức.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:text-right">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant">Tổng lượt hoàn tất</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-on-surface">{totalAttempts}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant">Điểm TB trong kỳ</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-primary">
              {periodAverage === null ? "—" : periodAverage.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 py-2.5 text-[11px] font-semibold text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[2px] bg-primary" />
          Lượt bài hoàn tất
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[#C85F78]" />
          Điểm trung bình
        </span>
        {benchmarkScore !== null && (
          <span className="inline-flex items-center gap-2">
            <span className="w-5 border-t border-dashed border-on-surface-variant" />
            Mục tiêu {benchmarkScore.toFixed(1)}
          </span>
        )}
      </div>

      <div className="relative min-h-[260px] flex-1 overflow-x-auto lg:min-h-0">
        {hasData ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full min-h-[250px] w-full min-w-[680px] select-none"
            role="img"
            aria-label="Biểu đồ lượt bài hoàn tất và điểm IELTS trung bình theo ngày"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#DED7DA"
                  />
                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    fill="currentColor"
                    className="text-[10px] font-semibold text-on-surface-variant"
                  >
                    {Math.round(maxAttempts * ratio)}
                  </text>
                  <text
                    x={width - padding.right + 12}
                    y={y + 4}
                    fill="currentColor"
                    className="text-[10px] font-semibold text-on-surface-variant"
                  >
                    {(9 * ratio).toFixed(1)}
                  </text>
                </g>
              );
            })}

            <text x={padding.left} y={14} fill="currentColor" className="text-[10px] font-bold text-on-surface-variant">
              Lượt bài
            </text>
            <text
              x={width - padding.right}
              y={14}
              textAnchor="end"
              fill="currentColor"
              className="text-[10px] font-bold text-on-surface-variant"
            >
              Band IELTS
            </text>

            {benchmarkScore !== null && (
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={getScoreY(benchmarkScore)}
                y2={getScoreY(benchmarkScore)}
                stroke="currentColor"
                strokeDasharray="5 5"
                className="text-on-surface-variant/70"
              />
            )}

            {trendPoints.map((point, index) => {
              const x = getX(index);
              const y = getAttemptY(point.completedAttempts);
              const hitWidth = Math.max(stepX, 44);
              return (
                <g key={`${point.date}-${index}`}>
                  <rect
                    x={x - hitWidth / 2}
                    y={padding.top}
                    width={hitWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                  />
                  {point.completedAttempts > 0 && (
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={padding.top + chartHeight - y}
                      rx="2"
                      fill="#894C5B"
                      opacity={hoveredIndex === index ? 1 : 0.78}
                    />
                  )}
                  <text
                    x={x}
                    y={height - 16}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-medium text-on-surface-variant"
                  >
                    {point.dateLabel}
                  </text>
                </g>
              );
            })}

            {scorePath && (
              <path
                d={scorePath}
                fill="none"
                stroke="#C85F78"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {trendPoints.map((point, index) =>
              point.averageScore === null ? null : (
                <circle
                  key={`score-${point.date}-${index}`}
                  cx={getX(index)}
                  cy={getScoreY(point.averageScore)}
                  r={hoveredIndex === index ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke="#C85F78"
                  strokeWidth="2.5"
                />
              ),
            )}
          </svg>
        ) : (
          <div className="grid h-full min-h-[260px] place-items-center border border-dashed border-outline-variant/70 bg-surface-container-low/50 px-6 text-center lg:min-h-0">
            <div>
              <p className="text-sm font-bold text-on-surface">Chưa có bài làm hoàn tất trong kỳ</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Thử đổi khoảng thời gian hoặc chọn tất cả khóa học.
              </p>
            </div>
          </div>
        )}

        {hoveredPoint && hasData && (
          <div className="pointer-events-none absolute left-4 top-4 min-w-40 rounded-md border border-outline-variant bg-surface px-3 py-2 text-xs shadow-lg sm:left-auto sm:right-5">
            <p className="font-bold text-on-surface">{hoveredPoint.dateLabel}</p>
            <dl className="mt-1.5 space-y-1 text-on-surface-variant">
              <div className="flex justify-between gap-6">
                <dt>Bài hoàn tất</dt>
                <dd className="font-bold tabular-nums text-on-surface">{hoveredPoint.completedAttempts}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Điểm TB</dt>
                <dd className="font-bold tabular-nums text-primary">
                  {hoveredPoint.averageScore === null ? "—" : hoveredPoint.averageScore.toFixed(1)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>Dữ liệu hoạt động học tập theo ngày</caption>
        <thead>
          <tr><th>Ngày</th><th>Lượt bài hoàn tất</th><th>Điểm trung bình</th></tr>
        </thead>
        <tbody>
          {trendPoints.map((point) => (
            <tr key={point.date}>
              <td>{point.dateLabel}</td>
              <td>{point.completedAttempts}</td>
              <td>{point.averageScore ?? "Không có dữ liệu"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
