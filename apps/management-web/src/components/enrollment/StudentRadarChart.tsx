import { Info } from "@phosphor-icons/react";
import { useMemo } from "react";

export interface SkillBreakdown {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

interface StudentRadarChartProps {
  currentBand: number | null;
  targetBand: number | null;
  customSkills?: Partial<SkillBreakdown>;
  className?: string;
}

interface SkillAxis {
  key: keyof SkillBreakdown;
  label: string;
  shortLabel: string;
}

const AXES: SkillAxis[] = [
  { key: "listening", label: "Listening", shortLabel: "Nghe" },
  { key: "reading", label: "Reading", shortLabel: "Đọc" },
  { key: "writing", label: "Writing", shortLabel: "Viết" },
  { key: "speaking", label: "Speaking", shortLabel: "Nói" },
];

const MAX_BAND = 9;
const WIDTH = 640;
const HEIGHT = 430;
const CENTER = { x: 320, y: 214 };
const RADIUS = 142;

export function StudentRadarChart({
  currentBand,
  targetBand,
  customSkills,
  className = "",
}: StudentRadarChartProps) {
  const target = targetBand ?? null;
  const skillScores = useMemo(
    () =>
      Object.fromEntries(
        AXES.map(axis => {
          const value = customSkills?.[axis.key];
          return [axis.key, typeof value === "number" ? clampBand(value) : null];
        }),
      ) as Record<keyof SkillBreakdown, number | null>,
    [customSkills],
  );
  const availableCount = AXES.filter(axis => skillScores[axis.key] !== null).length;
  const hasCompleteBreakdown = availableCount === AXES.length;

  const currentSkillPoints = hasCompleteBreakdown
    ? AXES.map((axis, index) => point(index, skillScores[axis.key] ?? 0)).map(({ x, y }) => `${x},${y}`).join(" ")
    : "";
  const overallPoints = currentBand !== null
    ? AXES.map((_, index) => point(index, currentBand)).map(({ x, y }) => `${x},${y}`).join(" ")
    : "";
  const targetPoints = target !== null
    ? AXES.map((_, index) => point(index, target)).map(({ x, y }) => `${x},${y}`).join(" ")
    : "";

  return (
    <section className={`rounded-[22px] border border-outline-variant/35 bg-surface p-5 shadow-sm md:p-6 ${className}`}>
      <header className="flex flex-col gap-4 border-b border-outline-variant/25 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Năng lực 4 kỹ năng IELTS</h2>
          <p className="mt-1 text-sm text-on-surface-variant">So sánh điểm từng kỹ năng trên thang Band 0.0 đến 9.0.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-on-surface-variant" aria-label="Chú giải biểu đồ">
          <Legend swatch="solid" label="Điểm kỹ năng" />
          <Legend swatch="overall" label={`Band tổng${currentBand !== null ? ` ${formatBand(currentBand)}` : " chưa có"}`} />
          <Legend swatch="target" label={`Mục tiêu${target !== null ? ` ${formatBand(target)}` : " chưa có"}`} />
        </div>
      </header>

      {!hasCompleteBreakdown && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/55 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <Info className="mt-0.5 shrink-0" size={18} weight="fill" />
          <p>
            <strong>Chưa đủ điểm theo từng kỹ năng.</strong>{" "}
            Đường Band tổng chỉ dùng làm mốc tham chiếu, không được xem là điểm Listening, Reading, Writing và Speaking.
          </p>
        </div>
      )}

      <div className="mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="mx-auto block h-auto min-w-[560px] max-w-[720px] select-none"
          role="img"
          aria-labelledby="student-radar-title student-radar-description"
        >
          <title id="student-radar-title">Biểu đồ năng lực bốn kỹ năng IELTS</title>
          <desc id="student-radar-description">
            {hasCompleteBreakdown
              ? "Điểm Listening, Reading, Writing và Speaking được đối chiếu với Band tổng và mục tiêu."
              : "Chưa có đủ điểm từng kỹ năng. Biểu đồ chỉ hiển thị Band tổng và mục tiêu làm mốc tham chiếu."}
          </desc>

          {[1.5, 3, 4.5, 6, 7.5, 9].map(level => (
            <polygon
              key={level}
              points={AXES.map((_, index) => point(index, level)).map(({ x, y }) => `${x},${y}`).join(" ")}
              fill={level === 9 ? "rgba(247, 245, 244, 0.55)" : "none"}
              stroke="currentColor"
              strokeWidth={level === 9 ? 1.4 : 1}
              className="text-outline-variant/45"
            />
          ))}

          {AXES.map((axis, index) => {
            const outer = point(index, MAX_BAND);
            const label = labelPosition(index);
            return (
              <g key={axis.key}>
                <line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-outline-variant/45"
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={label.anchor}
                  className="fill-on-surface text-[15px] font-extrabold"
                >
                  {axis.label}
                </text>
                <text
                  x={label.x}
                  y={label.y + 18}
                  textAnchor={label.anchor}
                  className="fill-on-surface-variant text-[12px] font-semibold"
                >
                  {axis.shortLabel}
                </text>
              </g>
            );
          })}

          {[3, 6, 9].map(level => {
            const y = CENTER.y - (level / MAX_BAND) * RADIUS;
            return (
              <g key={`scale-${level}`}>
                <rect x={CENTER.x + 8} y={y - 9} width="38" height="18" rx="5" className="fill-surface" />
                <text x={CENTER.x + 14} y={y + 4} className="fill-on-surface-variant text-[11px] font-bold">
                  {level}.0
                </text>
              </g>
            );
          })}

          {target !== null && (
            <polygon
              points={targetPoints}
              fill="rgba(180, 135, 21, 0.04)"
              stroke="#9A7410"
              strokeWidth="2.2"
              strokeDasharray="8 6"
            />
          )}

          {currentBand !== null && (
            <polygon
              points={overallPoints}
              fill="none"
              stroke="#9A5264"
              strokeWidth="2"
              strokeDasharray="3 6"
              opacity="0.9"
            />
          )}

          {hasCompleteBreakdown && (
            <>
              <polygon
                points={currentSkillPoints}
                fill="rgba(154, 82, 100, 0.20)"
                stroke="#9A5264"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {AXES.map((axis, index) => {
                const value = skillScores[axis.key] ?? 0;
                const current = point(index, value);
                const badge = badgePosition(index, current.x, current.y);
                return (
                  <g key={`score-${axis.key}`}>
                    <circle cx={current.x} cy={current.y} r="5" fill="#9A5264" stroke="white" strokeWidth="2.5" />
                    <rect x={badge.x - 17} y={badge.y - 11} width="34" height="22" rx="7" fill="#9A5264" />
                    <text x={badge.x} y={badge.y + 4} textAnchor="middle" className="fill-white text-[11px] font-extrabold">
                      {formatBand(value)}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AXES.map(axis => {
          const value = skillScores[axis.key];
          const gap = value !== null && target !== null ? Math.max(0, target - value) : null;
          return (
            <div key={axis.key} className="rounded-xl border border-outline-variant/35 bg-surface-container-low/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-on-surface">{axis.label}</span>
                <strong className={value !== null ? "text-xl tabular-nums text-primary" : "text-sm text-on-surface-variant"}>
                  {value !== null ? formatBand(value) : "Chưa có"}
                </strong>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-outline-variant/25 pt-3 text-xs text-on-surface-variant">
                <span>Mục tiêu {target !== null ? formatBand(target) : "—"}</span>
                <span className="font-bold text-on-surface">{gap !== null ? `Còn ${formatBand(gap)}` : "Chờ đánh giá"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function point(axisIndex: number, value: number) {
  const angle = (Math.PI * 2 * axisIndex) / AXES.length - Math.PI / 2;
  const distance = (clampBand(value) / MAX_BAND) * RADIUS;
  return {
    x: CENTER.x + distance * Math.cos(angle),
    y: CENTER.y + distance * Math.sin(angle),
  };
}

function labelPosition(index: number): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  if (index === 0) return { x: CENTER.x, y: 34, anchor: "middle" };
  if (index === 1) return { x: CENTER.x + RADIUS + 50, y: CENTER.y - 6, anchor: "start" };
  if (index === 2) return { x: CENTER.x, y: CENTER.y + RADIUS + 48, anchor: "middle" };
  return { x: CENTER.x - RADIUS - 50, y: CENTER.y - 6, anchor: "end" };
}

function badgePosition(index: number, x: number, y: number) {
  if (index === 0) return { x, y: y - 20 };
  if (index === 1) return { x: x + 24, y };
  if (index === 2) return { x, y: y + 20 };
  return { x: x - 24, y };
}

function Legend({ swatch, label }: { swatch: "solid" | "overall" | "target"; label: string }) {
  const style = swatch === "target"
    ? "border-[#9A7410] border-dashed"
    : swatch === "overall"
      ? "border-primary border-dotted"
      : "border-primary bg-primary/20";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-6 rounded-sm border-2 ${style}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function clampBand(value: number) {
  return Math.min(MAX_BAND, Math.max(0, value));
}

function formatBand(value: number) {
  return Number.isInteger(value) ? value.toFixed(1) : value.toString();
}
