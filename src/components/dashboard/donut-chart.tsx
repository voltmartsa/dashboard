const SIZE = 168;
const RADIUS = 66;
const STROKE = 18;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4;

export function DonutChart({
  done,
  inProgress,
  todo,
}: {
  done: number;
  inProgress: number;
  todo: number;
}) {
  const total = done + inProgress + todo;
  const safeTotal = total || 1;
  const pctDone = Math.round((done / safeTotal) * 100);

  const doneLen = Math.max((done / safeTotal) * CIRCUMFERENCE - GAP, 0);
  const inProgressLen = Math.max((inProgress / safeTotal) * CIRCUMFERENCE - GAP, 0);
  const inProgressOffset = -(doneLen + GAP);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <defs>
            <pattern
              id="donut-hatch"
              width="6"
              height="6"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="var(--border)" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="var(--muted-foreground)"
                strokeWidth="1.5"
                opacity="0.35"
              />
            </pattern>
          </defs>

          {/* base ring: remaining / to-do, hatched */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="url(#donut-hatch)"
            strokeWidth={STROKE}
          />

          {inProgressLen > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--chart-secondary)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${inProgressLen} ${CIRCUMFERENCE}`}
              strokeDashoffset={inProgressOffset}
            />
          )}

          {doneLen > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${doneLen} ${CIRCUMFERENCE}`}
              strokeDashoffset={0}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{pctDone}%</span>
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <LegendDot color="var(--primary)" label="Completed" />
        <LegendDot color="var(--chart-secondary)" label="In progress" />
        <LegendDot color="var(--border)" label="To do" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
