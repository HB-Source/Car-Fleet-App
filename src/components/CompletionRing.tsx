export function CompletionRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute text-xs font-bold">{percent}%</span>
    </div>
  );
}
