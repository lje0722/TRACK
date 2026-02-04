import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAllApplications, type Application } from "@/lib/applications";
import {
  getSchedulesByMonth,
  createSchedule,
  deleteSchedule,
  type Schedule,
} from "@/lib/schedules";
import { toast } from "sonner";

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

interface DayInfo {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
  dDay?: { label: string; company: string };
  schedules: Schedule[];
  applicationEvents: { company: string; stage: string }[];
}

const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [applications, setApplications] = useState<Application[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load applications and schedules
  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [year, month]);

  const loadApplications = async () => {
    try {
      const data = await getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error("Failed to load applications:", error);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await getSchedulesByMonth(year, month);
      console.log("Loaded schedules:", data);
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  // Get D-day map from applications
  const getDDayMap = (): Map<string, { label: string; company: string }> => {
    const map = new Map<string, { label: string; company: string; diffDays: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    applications.forEach(app => {
      // Include all active statuses (exclude rejected and accepted)
      if (app.deadline && app.status !== "rejected" && app.status !== "accepted") {
        const deadline = new Date(app.deadline);
        deadline.setHours(0, 0, 0, 0);
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          const dateStr = app.deadline;
          const label = diffDays === 0 ? "D-Day" : `D-${diffDays}`;
          // Truncate company name to 3 chars + ".." if longer
          const company = app.company.length > 3
            ? app.company.slice(0, 3) + ".."
            : app.company;

          const existing = map.get(dateStr);
          if (!existing || diffDays < existing.diffDays) {
            map.set(dateStr, { label, company, diffDays });
          }
        }
      }
    });

    return map;
  };

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate number of rows needed
  const totalCells = firstDayOfMonth + daysInMonth;
  const numRows = Math.ceil(totalCells / 7);

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const dDayMap = getDDayMap();
  const calendarDays: DayInfo[] = [];
  const realToday = new Date();

  // Helper function to get stage label from application status
  const getStageLabel = (status: Application["status"]): string | null => {
    switch (status) {
      case "인적성":
      case "AI면접":
      case "1차면접":
      case "2차면접":
        return status;
      default:
        return null;
    }
  };

  // Get application events for a specific date
  const getApplicationEvents = (dateStr: string): { company: string; stage: string }[] => {
    return applications
      .filter(app => app.deadline === dateStr && app.status !== "rejected" && app.status !== "accepted")
      .map(app => {
        const stageLabel = getStageLabel(app.status);
        return {
          company: app.company,
          stage: stageLabel || "마감",
        };
      });
  };

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false,
      dateStr: "",
      schedules: [],
      applicationEvents: [],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === realToday.getFullYear() && month === realToday.getMonth() && day === realToday.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = schedules.filter(s => s.date === dateStr);

    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday,
      dateStr,
      dDay: dDayMap.get(dateStr),
      schedules: daySchedules,
      applicationEvents: getApplicationEvents(dateStr),
    });
  }

  // Fill remaining cells
  const remainingCells = numRows * 7 - calendarDays.length;
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false,
      dateStr: "",
      schedules: [],
      applicationEvents: [],
    });
  }

  const handleAddSchedule = async (dateStr: string) => {
    if (!newScheduleTitle.trim() || !dateStr) {
      toast.error("일정 내용을 입력해주세요");
      return;
    }

    try {
      await createSchedule(newScheduleTitle, dateStr);
      await loadSchedules();
      setNewScheduleTitle("");
      toast.success("일정이 추가되었습니다");
    } catch (error: any) {
      console.error("Failed to add schedule:", error);
      toast.error(`일정 추가 실패: ${error.message || "알 수 없는 오류"}`);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      await loadSchedules();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  return (
    <Card className="bg-card border-border h-full flex flex-col overflow-hidden">
      {/* Header - bg-muted/30, px-4 py-3, border-b */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="text-muted-foreground hover:text-foreground h-7 w-7"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-bold text-foreground">
          {year}년 {month + 1}월
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="text-muted-foreground hover:text-foreground h-7 w-7"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Days of week header - bg-muted/20 */}
      <div className="grid grid-cols-7 bg-muted/20">
        {DAYS_OF_WEEK.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center text-[11px] font-semibold py-2",
              index === 0 ? "text-destructive/70" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - flex-1 */}
      <div
        className="grid grid-cols-7 flex-1"
        style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
      >
        {calendarDays.map((dateInfo, index) => (
          <Popover
            key={index}
            open={popoverOpen && selectedDate === dateInfo.dateStr}
            onOpenChange={(open) => {
              if (!open) {
                setPopoverOpen(false);
                setSelectedDate(null);
                setNewScheduleTitle("");
              }
            }}
          >
            <PopoverTrigger asChild>
              <div
                className={cn(
                  "relative p-1.5 border-t border-border/50 transition-colors group cursor-pointer",
                  !dateInfo.isCurrentMonth && "bg-muted/10",
                  dateInfo.isCurrentMonth && "hover:bg-muted/50",
                  dateInfo.isToday && "bg-primary/5"
                )}
                onClick={() => {
                  if (dateInfo.isCurrentMonth) {
                    setSelectedDate(dateInfo.dateStr);
                    setPopoverOpen(true);
                  }
                }}
              >
                {/* Day number - text-xs */}
                {dateInfo.isCurrentMonth && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      dateInfo.isToday && "text-primary font-bold",
                      !dateInfo.isToday && index % 7 === 0 && "text-destructive",
                      !dateInfo.isToday && index % 7 !== 0 && "text-foreground"
                    )}
                  >
                    {dateInfo.day}
                  </span>
                )}

                {/* Schedule badges - mt-1, space-y-0.5 */}
                {dateInfo.isCurrentMonth && (dateInfo.dDay || dateInfo.schedules.length > 0) && (
                  <div className="mt-1 space-y-0.5">
                    {/* D-day label with company name */}
                    {dateInfo.dDay && (
                      <div className="text-[10px] leading-tight text-primary bg-primary/15 px-1.5 py-0.5 rounded truncate">
                        {dateInfo.dDay.company} {dateInfo.dDay.label}
                      </div>
                    )}
                    {/* Schedule previews - max 2 */}
                    {dateInfo.schedules.slice(0, 2).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-[10px] leading-tight text-primary bg-primary/15 px-1.5 py-0.5 rounded truncate"
                      >
                        {schedule.title}
                      </div>
                    ))}
                    {/* +N more */}
                    {dateInfo.schedules.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{dateInfo.schedules.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Hover plus icon */}
                {dateInfo.isCurrentMonth && !dateInfo.dDay && dateInfo.schedules.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Plus className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </PopoverTrigger>

            {/* Popover - w-64, p-3 */}
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                {/* Title - text-sm font-bold */}
                <div className="text-sm font-bold text-foreground">
                  {dateInfo.isCurrentMonth && `${month + 1}월 ${dateInfo.day}일`}
                </div>

                {/* Application events (기업명 + 단계) */}
                {dateInfo.applicationEvents.length > 0 && (
                  <div className="space-y-1.5">
                    {dateInfo.applicationEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">{event.company} {event.stage}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing schedules */}
                {dateInfo.schedules.length > 0 ? (
                  <div className="space-y-1.5">
                    {dateInfo.schedules.map(schedule => (
                      <div key={schedule.id} className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm text-foreground flex-1">{schedule.title}</span>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : dateInfo.applicationEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">등록된 일정이 없습니다</p>
                ) : null}

                {/* Add new schedule - h-8 */}
                <div className="flex gap-2">
                  <Input
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    placeholder="일정 추가..."
                    className="text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddSchedule(dateInfo.dateStr);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddSchedule(dateInfo.dateStr)}
                    className="bg-primary hover:bg-primary/90 h-8 px-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </Card>
  );
};

export default DashboardCalendar;
