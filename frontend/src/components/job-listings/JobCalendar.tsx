import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface JobListing {
  id: string;
  company: string;
  deadline: string | null;
}

interface JobCalendarProps {
  listings: JobListing[];
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const JobCalendar = ({ listings }: JobCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Parse deadline string (YYYY-MM-DD from database) to get jobs per day
  const getJobsForDate = (day: number): string[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return listings
      .filter((listing) => listing.deadline && listing.deadline === dateStr)
      .map((listing) => listing.company);
  };

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays: {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    jobs: string[];
  }[] = [];

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false,
      jobs: [],
    });
  }

  // Current month days
  const realToday = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === realToday.getFullYear() && month === realToday.getMonth() && day === realToday.getDate();
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday,
      jobs: getJobsForDate(day),
    });
  }

  const renderDateCell = (dateInfo: typeof calendarDays[0], index: number) => {
    const cellContent = (
      <div
        className={cn(
          "min-h-[60px] p-1 text-xs rounded border border-transparent cursor-default",
          !dateInfo.isCurrentMonth && "bg-transparent",
          dateInfo.isCurrentMonth && "bg-muted/30",
          dateInfo.isToday && "border-primary bg-primary/5",
          dateInfo.jobs.length > 0 && "hover:bg-muted/50 transition-colors"
        )}
      >
        {dateInfo.day > 0 && (
          <>
            <div
              className={cn(
                "text-[9px] text-muted-foreground mb-0.5",
                dateInfo.isToday && "text-primary font-medium",
                index % 7 === 0 && !dateInfo.isToday && "text-destructive"
              )}
            >
              {dateInfo.day}
            </div>
            <div className="space-y-0.5">
              {dateInfo.jobs.slice(0, 2).map((company, idx) => (
                <div
                  key={idx}
                  className="text-[8px] bg-rose-100/60 text-rose-400 px-0.5 py-0.5 rounded truncate leading-tight"
                >
                  {company}
                </div>
              ))}
              {dateInfo.jobs.length > 2 && (
                <div className="text-[8px] text-muted-foreground">
                  +{dateInfo.jobs.length - 2}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );

    // If there are jobs, wrap with HoverCard
    if (dateInfo.jobs.length > 0) {
      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            {cellContent}
          </HoverCardTrigger>
          <HoverCardContent className="w-48 p-2" side="top">
            <div className="text-xs font-medium text-foreground mb-1.5">
              {month + 1}월 {dateInfo.day}일 마감
            </div>
            <div className="space-y-1">
              {dateInfo.jobs.map((company, idx) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground"
                >
                  • {company}
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return cellContent;
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="text-muted-foreground hover:text-foreground h-6 w-6"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <h3 className="text-sm font-semibold text-foreground">
            {year} / {String(month + 1).padStart(2, "0")}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="text-muted-foreground hover:text-foreground h-6 w-6"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS_OF_WEEK.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center text-[10px] font-medium py-0.5",
                index === 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((dateInfo, index) => (
            <div key={index}>
              {renderDateCell(dateInfo, index)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCalendar;
