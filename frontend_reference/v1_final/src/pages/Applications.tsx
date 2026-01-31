import { useMemo } from "react";
import { useState } from "react";
import { Plus, MoreHorizontal, Building2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/dashboard/Sidebar";
import { useJobContext } from "@/contexts/JobContext";

import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

const PROGRESS_STAGES = [
  { label: "서류합격", progress: 25 },
  { label: "1차면접 합격", progress: 50 },
  { label: "2차면접 합격", progress: 75 },
  { label: "최종합격", progress: 100 },
];

const Applications = () => {
  const { applications, setApplications } = useJobContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newCompany, setNewCompany] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);

  // Sort applications: active first, then rejected at the bottom
  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      if (a.status === "rejected" && b.status !== "rejected") return 1;
      if (a.status !== "rejected" && b.status === "rejected") return -1;
      return 0;
    });
  }, [applications]);

  const handleReject = (id: number) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === id ? { ...app, status: "rejected" as const } : app
      )
    );
  };

  const handleRestore = (id: number) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === id ? { ...app, status: "active" as const } : app
      )
    );
  };

  const handleProgressUpdate = (id: number, progress: number, stage: string) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === id ? { ...app, progress, stage, status: "active" as const } : app
      )
    );
  };

  const handleDeadlineUpdate = (id: number, deadline: Date | null, isReviewing: boolean) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === id 
          ? { 
              ...app, 
              deadline, 
              status: isReviewing ? "reviewing" as const : "active" as const 
            } 
          : app
      )
    );
  };

  const handleAddApplication = () => {
    if (!newCompany || !newPosition || !newDeadline) return;

    const newApp = {
      id: Date.now(),
      company: newCompany,
      position: newPosition,
      stage: "서류 접수",
      progress: 10,
      deadline: newDeadline,
      appliedAt: new Date(),
      status: "active" as const,
    };

    setApplications([...applications, newApp]);
    setNewCompany("");
    setNewPosition("");
    setNewDeadline(undefined);
    setIsDialogOpen(false);
  };

  const getInitial = (company: string) => {
    // Get Korean initial or first letter
    const first = company.charAt(0);
    return first;
  };

  const getDdayText = (app: typeof applications[0]) => {
    if (app.status === "rejected") {
      return "";
    }
    if (app.status === "reviewing" || app.deadline === null) {
      return "심사 중";
    }
    const daysLeft = differenceInDays(app.deadline, new Date());
    if (daysLeft < 0) return "마감";
    return `D-${daysLeft}`;
  };

  const getDdayColor = (app: typeof applications[0]) => {
    if (app.status === "rejected") {
      return "bg-transparent";
    }
    if (app.status === "reviewing" || app.deadline === null) {
      return "bg-amber-100 text-amber-700";
    }
    const daysLeft = differenceInDays(app.deadline, new Date());
    if (daysLeft < 0) {
      return "bg-muted text-muted-foreground";
    }
    if (daysLeft <= 3) {
      return "bg-rose-100 text-rose-600";
    }
    if (daysLeft <= 7) {
      return "bg-orange-100 text-orange-600";
    }
    return "bg-sky-100 text-sky-600";
  };

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 px-32 py-6 overflow-auto">
          {/* Page Header - Title and Button */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                지원 현황 (Application Status)
              </h1>
              <p className="text-sm text-muted-foreground">
                현재 진행 중인 채용 전형을 한눈에 파악하고 다음 단계를 준비하세요.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-medium rounded-lg h-auto">
                  <Plus className="w-4 h-4 mr-1.5" />
                  새 지원 추가
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Application Cards */}
          <div className="space-y-3 mb-6">
            {sortedApplications.map((app) => (
              <div key={app.id} className="group">
                <Card
                  className={cn(
                    "px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md",
                    app.status === "rejected" && "opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Company Initial */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                      {getInitial(app.company)}
                    </div>

                    {/* Company Info */}
                    <div className="w-44 shrink-0">
                      <h3 className="text-base font-bold text-foreground">{app.company}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {app.position}
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="flex-1 min-w-0 relative">
                      <div className="text-xs font-medium text-primary mb-1.5">
                        {app.stage}
                        {app.status === "rejected" && (
                          <span className="ml-1 text-muted-foreground">(불합격)</span>
                        )}
                      </div>
                      <Progress value={app.progress} className="h-1.5" />
                    </div>

                    {/* D-Day Badge */}
                    {app.status === "rejected" ? (
                      <div className="w-20 shrink-0" />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-20 text-center px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity",
                              getDdayColor(app)
                            )}
                          >
                            {getDdayText(app)}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="end">
                          <div className="p-2 border-b">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm"
                              onClick={() => handleDeadlineUpdate(app.id, null, true)}
                            >
                              심사 중
                            </Button>
                          </div>
                          <Calendar
                            mode="single"
                            selected={app.deadline || undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleDeadlineUpdate(app.id, date, false);
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        {app.status === "rejected" ? (
                          <DropdownMenuItem onClick={() => handleRestore(app.id)}>
                            복원하기
                          </DropdownMenuItem>
                        ) : (
                          <>
                            {PROGRESS_STAGES.map((stage) => (
                              <DropdownMenuItem
                                key={stage.label}
                                onClick={() => handleProgressUpdate(app.id, stage.progress, stage.label)}
                              >
                                {stage.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem 
                              onClick={() => handleReject(app.id)}
                              className="text-destructive"
                            >
                              불합격
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
                {/* Applied Date - shown on hover */}
                <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                  <div className="px-4 pt-2 text-xs text-muted-foreground">
                    <span>지원일: {format(app.appliedAt, "yyyy년 MM월 dd일")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dialog Content - moved outside the header */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 지원 내역 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">기업명</label>
                  <Input
                    placeholder="기업명을 입력하세요"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">직무</label>
                  <Input
                    placeholder="지원 직무를 입력하세요"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">마감일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={newDeadline ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {newDeadline ? format(newDeadline, "yyyy-MM-dd") : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={newDeadline}
                        onSelect={setNewDeadline}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddApplication}
                  disabled={!newCompany || !newPosition || !newDeadline}
                >
                  추가하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Applications;
