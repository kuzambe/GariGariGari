interface HealthScoreProps {
  score?: number;
}

export function HealthScore({ score = 82 }: HealthScoreProps) {
  const radius = 56;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI; // half arc
  const arc = (score / 100) * circumference;

  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: radius * 2, height: radius + 12 }}>
        <svg
          width={radius * 2}
          height={radius + 12}
          viewBox={`0 0 ${radius * 2} ${radius + 12}`}
          style={{ overflow: "visible" }}
        >
          {/* Background arc */}
          <path
            d={`M ${stroke / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke / 2} ${radius}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d={`M ${stroke / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke / 2} ${radius}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
