interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  subtitle: string;
  comment?: string;
  variant?: "default" | "warning" | "progress";
  percentage?: number; // 0-100 numeric value
}

// Static color map for Tailwind JIT to detect all classes
const COLOR_CLASS_MAP = {
  red: {
    border: "border-rose-400/30",
    text: "text-rose-400",
    circle: "bg-rose-400/10",
  },
  yellow: {
    border: "border-amber-400/30",
    text: "text-amber-400",
    circle: "bg-amber-400/10",
  },
  green: {
    border: "border-green-500/30",
    text: "text-green-500",
    circle: "bg-green-500/10",
  },
  warning: {
    border: "border-[#E91E63]/20",
    text: "text-[#E91E63]",
    circle: "bg-[#E91E63]/10",
  },
  default: {
    border: "border-primary/20",
    text: "text-primary",
    circle: "bg-primary/10",
  },
} as const;

const StatCard = ({
  title,
  value,
  unit = "%",
  subtitle,
  comment,
  variant = "default",
  percentage = 0,
}: StatCardProps) => {
  const isWarning = variant === "warning";
  const isProgress = variant === "progress";

  // Calculate color level based ONLY on numeric percentage (0-100)
  const getColorLevel = (): "red" | "yellow" | "green" => {
    if (percentage <= 30) return "red";
    if (percentage <= 70) return "yellow";
    return "green"; // 71-100
  };

  const colorLevel = getColorLevel();

  // Get color classes from static map
  const colors = !isProgress
    ? (isWarning ? COLOR_CLASS_MAP.warning : COLOR_CLASS_MAP.default)
    : COLOR_CLASS_MAP[colorLevel];

  return (
    <div className={`bg-white relative overflow-hidden rounded-2xl border-2 shadow-sm ${colors.border}`}>
      <div className="p-6">
        <p className="text-sm font-medium text-[hsl(222,47%,11%)] mb-4">{title}</p>

        {isWarning && (
          <span className="absolute top-4 right-4 text-xs font-semibold text-[#E91E63]">
            ACTION NEEDED
          </span>
        )}

        <div className="flex items-baseline gap-0.5 mb-3">
          <span className={`text-4xl font-bold tracking-tight ${colors.text}`}>
            {value}
          </span>
          {unit && (
            <span className={`text-xl font-medium ${colors.text}`}>
              {unit}
            </span>
          )}
        </div>

        <p className="text-sm text-[hsl(215,16%,47%)]">
          {subtitle}
          {comment && (
            <span className={`ml-1 text-base font-bold ${isProgress ? colors.text : ""}`}>
              {comment}
            </span>
          )}
        </p>

        <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full ${colors.circle}`} />
      </div>
    </div>
  );
};

export default StatCard;
