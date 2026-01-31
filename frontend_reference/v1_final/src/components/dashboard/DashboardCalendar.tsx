import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  // Generate calendar days (no previous/next month days)
  const calendarDays: {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Current month days
  const realToday = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === realToday.getFullYear() && month === realToday.getMonth() && day === realToday.getDate();
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday
    });
  }
  return <Card className="bg-card border-border h-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-base font-bold text-foreground">
            {year} / {String(month + 1).padStart(2, "0")}
          </h3>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {DAYS_OF_WEEK.map((day, index) => <div key={day} className={cn("text-center text-xs font-medium py-1", index === 0 ? "text-destructive" : "text-muted-foreground")}>
              {day}
            </div>)}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dateInfo, index) => <div key={index} className={cn("h-8 w-8 mx-auto text-sm font-medium flex items-center justify-center text-secondary-foreground", !dateInfo.isCurrentMonth && "text-transparent", dateInfo.isCurrentMonth && "text-foreground", dateInfo.isToday && "bg-primary text-white rounded-full", index % 7 === 0 && dateInfo.isCurrentMonth && !dateInfo.isToday && "text-destructive")}>
              {dateInfo.day > 0 ? dateInfo.day : ""}
            </div>)}
        </div>
      </CardContent>
    </Card>;
};
export default DashboardCalendar;