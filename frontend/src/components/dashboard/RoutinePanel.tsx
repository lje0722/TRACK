import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RoutineItem {
  id: string;
  label: string;
  checked: boolean;
}

interface RoutinePanelProps {
  selfCheckItems: RoutineItem[];
  autoCheckItems: RoutineItem[];
  onSelfCheckToggle: (id: string) => void;
  onAutoCheckToggle: (id: string) => void;
  disableAutoCheck?: boolean;
}

const RoutinePanel = ({ 
  selfCheckItems, 
  autoCheckItems, 
  onSelfCheckToggle, 
  onAutoCheckToggle,
  disableAutoCheck = false,
}: RoutinePanelProps) => {
  // Always use today's date
  const today = new Date();
  const getDayOfWeek = () => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[today.getDay()];
  };
  const getDateString = () => {
    return `${today.getMonth() + 1}월 ${today.getDate()}일`;
  };

  return (
    <Card className="bg-card border-border overflow-hidden h-full">
      {/* Date Header with arrows */}
      <CardHeader className="bg-[hsl(var(--dark-navy))] text-white p-3 flex flex-row items-center justify-between">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-7 w-7">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-bold">
          {getDateString()} ({getDayOfWeek()})
        </h3>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-7 w-7">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Info Banner */}
        <div className="bg-amber-50 px-6 py-3 flex items-center gap-2">
          <span className="text-sm">🙌</span>
          <p className="text-xs text-amber-900">
            루틴 트래킹은 평일(월-금) 위주로 진행됩니다. 주말은 자유롭게!
          </p>
        </div>
        
        {/* Self Check Section */}
        <div className="px-6 py-5 border-b border-border">
          <h4 className="text-sm font-bold text-primary mb-1">
            직접 체크 (Self Check)
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            * 완료 후 직접 체크해주세요
          </p>
          <ul className="space-y-4">
            {selfCheckItems.map(item => (
              <li key={item.id} className="flex items-center gap-4">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={() => onSelfCheckToggle(item.id)}
                  className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
                />
                <label
                  htmlFor={item.id}
                  className={cn(
                    "text-sm cursor-pointer",
                    item.checked && "line-through text-muted-foreground/50"
                  )}
                >
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Auto Check Section */}
        <div className="px-6 py-5">
          <h4 className="text-sm font-bold text-foreground mb-1">
            자동 체크 (Auto Check)
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            (시스템 활동 시 자동으로 완료됩니다)
          </p>
          <ul className="space-y-4">
            {autoCheckItems.map(item => (
              <li key={item.id} className="flex items-center gap-4">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={() => !disableAutoCheck && onAutoCheckToggle(item.id)}
                  disabled={disableAutoCheck}
                  className={cn(
                    "h-5 w-5 rounded-md border-2 border-muted-foreground/30 data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground",
                    disableAutoCheck && "cursor-not-allowed opacity-60"
                  )}
                />
                <label
                  htmlFor={item.id}
                  className={cn(
                    "text-sm",
                    disableAutoCheck && "cursor-default",
                    !disableAutoCheck && "cursor-pointer",
                    item.checked && "line-through text-muted-foreground/50"
                  )}
                >
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoutinePanel;
