import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  subtitle: string;
  comment?: string;
  variant?: "default" | "warning" | "progress";
  progressLevel?: "red" | "yellow" | "green";
}

const StatCard = ({ 
  title, 
  value, 
  unit = "%",
  subtitle, 
  comment,
  variant = "default",
  progressLevel,
}: StatCardProps) => {
  const isWarning = variant === "warning";
  const isProgress = variant === "progress";
  
  const getProgressColors = () => {
    switch (progressLevel) {
      case "red":
        return {
          border: "border-rose-400/30",
          text: "text-rose-400",
          bg: "bg-rose-400/10",
        };
      case "yellow":
        return {
          border: "border-amber-400/30",
          text: "text-amber-400",
          bg: "bg-amber-400/10",
        };
      case "green":
        return {
          border: "border-emerald-400/30",
          text: "text-emerald-400",
          bg: "bg-emerald-400/10",
        };
      default:
        return {
          border: "border-primary/20",
          text: "text-primary",
          bg: "bg-primary/10",
        };
    }
  };
  
  const progressColors = isProgress ? getProgressColors() : null;
  
  return (
    <Card className={cn(
      "bg-card relative overflow-hidden rounded-2xl",
      isWarning && "border-2 border-[#E91E63]/20",
      isProgress && progressColors && `border-2 ${progressColors.border}`,
      !isWarning && !isProgress && "border-2 border-primary/20"
    )}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-foreground mb-4">{title}</p>
        
        {isWarning && (
          <span className="absolute top-4 right-4 text-xs font-semibold text-destructive">
            ACTION NEEDED
          </span>
        )}
        
        <div className="flex items-baseline gap-0.5 mb-3">
          <span className={cn(
            "text-4xl font-bold tracking-tight",
            isWarning && "text-[#E91E63]",
            isProgress && progressColors && progressColors.text,
            !isWarning && !isProgress && "text-primary"
          )}>
            {value}
          </span>
          {unit && (
            <span className={cn(
              "text-xl font-medium",
              isWarning && "text-[#E91E63]",
              isProgress && progressColors && progressColors.text,
              !isWarning && !isProgress && "text-primary"
            )}>
              {unit}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          {subtitle}
          {comment && (
            <span className={cn(
              "ml-1 text-base font-bold",
              isProgress && progressColors && progressColors.text
            )}>
              {comment}
            </span>
          )}
        </p>
        
        {/* Decorative circle */}
        <div className={cn(
          "absolute -bottom-6 -right-6 w-20 h-20 rounded-full",
          isWarning && "bg-[#E91E63]/10",
          isProgress && progressColors && progressColors.bg,
          !isWarning && !isProgress && "bg-primary/10"
        )} />
      </CardContent>
    </Card>
  );
};

export default StatCard;
