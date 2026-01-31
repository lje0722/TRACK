import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useJobContext } from "@/contexts/JobContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/dashboard/Sidebar";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// Category options with pastel colors - sorted by Korean alphabetical order
const CATEGORIES = [
  { id: "personal_study", label: "개인공부", color: "bg-emerald-200" },
  { id: "other", label: "기타", color: "bg-gray-200" },
  { id: "routine", label: "루틴", color: "bg-pink-200" },
  { id: "interview", label: "면접", color: "bg-purple-200" },
  { id: "meal", label: "식사", color: "bg-yellow-200" },
  { id: "exercise", label: "운동", color: "bg-lime-200" },
  { id: "sleep", label: "잠", color: "bg-slate-200" },
  { id: "resume", label: "자소서", color: "bg-blue-200" },
  { id: "certificate", label: "자격증", color: "bg-teal-200" },
];

// Generate hour options (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const label = hour < 12 
    ? `오전 ${hour === 0 ? 12 : hour}시` 
    : `오후 ${hour === 12 ? 12 : hour - 12}시`;
  return { value: hour, label };
});

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

interface TimeBlock {
  id: number;
  category: string;
  content: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
}

interface WeeklyGoal {
  week: number;
  goal: string;
}

const TimeManagement = () => {
  const { markTimeBlockAdded } = useJobContext();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { id: 1, category: "routine", content: "기상", date: "2026-01-27", startHour: 7, endHour: 8 },
    { id: 2, category: "exercise", content: "change up", date: "2026-01-27", startHour: 8, endHour: 9 },
  ]);
  
  // Weekly goals state
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([
    { week: 1, goal: "" },
    { week: 2, goal: "" },
    { week: 3, goal: "" },
    { week: 4, goal: "" },
  ]);
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState<string>("");
  const [endHour, setEndHour] = useState<string>("");
  
  // Week navigation
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    return new Date(today.setDate(diff));
  });

  // Get week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  const goToPrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStart(new Date(today.setDate(diff)));
  };

  const handleAddTimeBlock = () => {
    if (!selectedCategory || !content || !startHour || !endHour || !selectedDate) return;
    
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    const newBlock: TimeBlock = {
      id: Date.now(),
      category: selectedCategory,
      content,
      date: dateStr,
      startHour: parseInt(startHour),
      endHour: parseInt(endHour),
    };
    
    setTimeBlocks([...timeBlocks, newBlock]);
    markTimeBlockAdded();
    setSelectedCategory("");
    setContent("");
    setStartHour("");
    setEndHour("");
  };

  const handleWeeklyGoalChange = (week: number, value: string) => {
    setWeeklyGoals(goals =>
      goals.map(g => g.week === week ? { ...g, goal: value } : g)
    );
  };

  const formatDateRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  // Get blocks that START at this specific hour (for rendering multi-hour blocks)
  const getBlocksStartingAtHour = (date: Date, hour: number) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return timeBlocks.filter(block => 
      block.date === dateStr && 
      block.startHour === hour
    );
  };

  // Check if this hour is occupied by a block that started earlier
  const isHourOccupiedByPreviousBlock = (date: Date, hour: number) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return timeBlocks.some(block => 
      block.date === dateStr && 
      block.startHour < hour && 
      block.endHour > hour
    );
  };

  const getCategoryColor = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.color || "bg-gray-200";
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 px-32 py-6 overflow-auto">
          {/* Page Title */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">
              시간 관리 (Time Management)
            </h1>
            <p className="text-sm text-muted-foreground">
              하루를 효율적으로 계획하고 관리하세요.
            </p>
          </div>

          {/* Weekly Goals Section */}
          <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-bold">주간 목표 작성하기</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyGoals.map((weekGoal) => (
                <div key={weekGoal.week} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                    {weekGoal.week}주차
                  </span>
                  <Input
                    value={weekGoal.goal}
                    onChange={(e) => handleWeeklyGoalChange(weekGoal.week, e.target.value)}
                    placeholder={`${weekGoal.week}주차 목표를 작성해 주세요`}
                    className="flex-1 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Add Form */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-bold text-center">시간 기록 추가하기</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">구분</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full",
                        selectedCategory ? getCategoryColor(selectedCategory) : "bg-pink-200"
                      )} 
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", cat.color)} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium mb-2 block">내용</label>
                  <Input 
                    placeholder="내용을 입력하세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">날짜</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko }) : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">시작 시간</label>
                    <Select 
                      value={startHour} 
                      onValueChange={(value) => {
                        setStartHour(value);
                        // Reset end hour if it's less than or equal to new start hour
                        if (endHour && parseInt(endHour) <= parseInt(value)) {
                          setEndHour("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((hour) => (
                          <SelectItem key={hour.value} value={String(hour.value)}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">끝난 시간</label>
                    <Select 
                      value={endHour} 
                      onValueChange={setEndHour}
                      disabled={!startHour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={startHour ? "시간 선택" : "시작 시간을 먼저 선택"} />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.filter((hour) => hour.value > parseInt(startHour || "0")).map((hour) => (
                          <SelectItem key={hour.value} value={String(hour.value)}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Button */}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleAddTimeBlock}
                  disabled={!selectedCategory || !content || !startHour || !endHour || !selectedDate}
                >
                  추가하기
                </Button>
              </CardContent>
            </Card>

            {/* Right Panel - Weekly Calendar */}
            <Card className="bg-card border-border lg:col-span-2 overflow-hidden">
              <CardContent className="p-4">
                {/* Calendar Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={goToToday}
                  >
                    오늘
                  </Button>
                  <div className="flex">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-r-none"
                      onClick={goToPrevWeek}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-l-none"
                      onClick={goToNextWeek}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-lg font-bold ml-2">{formatDateRange()}</span>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr>
                        <th className="border border-border p-2 w-20"></th>
                        {weekDays.map((day, i) => (
                          <th 
                            key={i} 
                            className={cn(
                              "border border-border p-2 text-center min-w-[80px]",
                              isToday(day) && "bg-yellow-50"
                            )}
                          >
                            <div className="text-xs text-muted-foreground">{DAY_NAMES[i]}</div>
                            <div>{day.getMonth() + 1}. {day.getDate()}.</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* All day row */}
                      <tr>
                        <td className="border border-border p-2 text-muted-foreground text-xs">
                          하루 종일
                        </td>
                        {weekDays.map((day, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "border border-border p-1 h-8",
                              isToday(day) && "bg-yellow-50"
                            )}
                          />
                        ))}
                      </tr>
                      {/* Hour rows */}
                      {HOURS.map((hour) => (
                        <tr key={hour.value}>
                          <td className="border border-border p-2 text-muted-foreground text-xs whitespace-nowrap">
                            {hour.label}
                          </td>
                          {weekDays.map((day, i) => {
                            const blocksStartingHere = getBlocksStartingAtHour(day, hour.value);
                            const isOccupied = isHourOccupiedByPreviousBlock(day, hour.value);
                            
                            return (
                              <td 
                                key={i} 
                                className={cn(
                                  "border border-border p-0 h-10 relative",
                                  isToday(day) && "bg-yellow-50"
                                )}
                              >
                                {blocksStartingHere.map((block) => {
                                  const duration = block.endHour - block.startHour;
                                  const heightPx = duration * 40; // 40px per hour (h-10)
                                  
                                  return (
                                    <div 
                                      key={block.id}
                                      className={cn(
                                        "absolute left-1 right-1 top-0 rounded text-xs p-1 overflow-hidden z-10",
                                        getCategoryColor(block.category)
                                      )}
                                      style={{ height: `${heightPx - 4}px` }}
                                    >
                                      <span className="font-medium truncate block">
                                        {block.content}
                                      </span>
                                    </div>
                                  );
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TimeManagement;
