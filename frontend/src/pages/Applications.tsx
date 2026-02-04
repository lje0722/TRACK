import { useMemo, useState, useEffect } from "react";
import { Plus, MoreHorizontal, Building2, CalendarIcon, ChevronDown, ChevronUp, Search, X, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  calculateDDay,
  formatDDay,
  type Application,
} from "@/lib/applications";
import { toast } from "sonner";

const PROGRESS_STAGES = [
  { label: "서류합격", progress: 25 },
  { label: "1차면접 합격", progress: 50 },
  { label: "2차면접 합격", progress: 75 },
  { label: "최종합격", progress: 100 },
];

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAccepted, setShowAccepted] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  // Form state
  const [newCompany, setNewCompany] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);

  // Pending stage for D-day selection (which stage is selected before picking a date)
  const [pendingStage, setPendingStage] = useState<{ appId: string; stage: Application["status"] } | null>(null);

  // Load applications on mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getAllApplications();
      setApplications(data);
    } catch (error: any) {
      console.error("Failed to load applications:", error);
      toast.error(`지원 내역을 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // Get unique positions for filter
  const positions = useMemo(() => {
    const uniquePositions = [...new Set(applications.map((app) => app.position))];
    return uniquePositions.filter((pos): pos is string => pos !== undefined && pos !== "");
  }, [applications]);

  // Separate active, accepted, and rejected applications with search and position filtering
  const { activeApplications, acceptedApplications, rejectedApplications } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = applications.filter(app => {
      if (query && !app.company.toLowerCase().includes(query)) {
        return false;
      }
      if (selectedPosition !== "all" && app.position !== selectedPosition) {
        return false;
      }
      return true;
    });
    const active = filtered.filter(app => app.status !== "rejected" && app.status !== "accepted");
    const accepted = filtered.filter(app => app.status === "accepted");
    const rejected = filtered.filter(app => app.status === "rejected");
    return { activeApplications: active, acceptedApplications: accepted, rejectedApplications: rejected };
  }, [applications, searchQuery, selectedPosition]);

  const resetFilters = () => {
    setSelectedPosition("all");
    setSearchQuery("");
  };

  // Determine which active applications to show (max 10, or all if expanded)
  const displayedActiveApplications = useMemo(() => {
    if (showAllActive || activeApplications.length <= 10) {
      return activeApplications;
    }
    return activeApplications.slice(0, 10);
  }, [activeApplications, showAllActive]);

  const handleReject = async (id: string) => {
    try {
      setLoading(true);
      await updateApplication(id, { status: "rejected" });
      await loadApplications();
      toast.success("불합격 처리되었습니다.");
    } catch (error: any) {
      console.error("Failed to reject application:", error);
      toast.error(`처리에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setLoading(true);
      await updateApplication(id, { status: "active" });
      await loadApplications();
      toast.success("복원되었습니다.");
    } catch (error: any) {
      console.error("Failed to restore application:", error);
      toast.error(`복원에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteApplication(id);
      await loadApplications();
      toast.success("삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete application:", error);
      toast.error(`삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (id: string, progress: number, stage: string) => {
    try {
      setLoading(true);
      // 최종합격이면 status를 "accepted"로 변경
      const status = stage === "최종합격" ? "accepted" : "active";
      await updateApplication(id, { progress, stage, status });
      await loadApplications();
      toast.success("진행 상태가 업데이트되었습니다.");
    } catch (error: any) {
      console.error("Failed to update progress:", error);
      toast.error(`업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlineUpdate = async (id: string, deadline: Date) => {
    try {
      setLoading(true);
      // Use pending stage if selected, otherwise just set deadline with active status
      const status = pendingStage?.appId === id ? pendingStage.stage : "active";
      await updateApplication(id, { deadline, status });
      await loadApplications();
      setPendingStage(null);
      toast.success("마감일이 업데이트되었습니다.");
    } catch (error: any) {
      console.error("Failed to update deadline:", error);
      toast.error(`업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewingStatus = async (id: string) => {
    // "심사중" only - directly set status without date
    try {
      setLoading(true);
      await updateApplication(id, { status: "reviewing", deadline: null });
      await loadApplications();
      setPendingStage(null);
      toast.success("상태가 업데이트되었습니다.");
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(`업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStage = (appId: string, stage: Application["status"]) => {
    // Select stage first, then pick date from calendar
    setPendingStage({ appId, stage });
  };

  const handleAddApplication = async () => {
    if (!newCompany || !newPosition || !newDeadline) return;
    if (loading) return; // 이미 처리 중이면 무시

    try {
      setLoading(true);
      await createApplication({
        company: newCompany,
        position: newPosition,
        stage: "서류 접수",
        progress: 10,
        deadline: newDeadline,
        applied_at: new Date(),
        status: "active",
      });
      await loadApplications();
      toast.success("새 지원 내역이 추가되었습니다.");
      setNewCompany("");
      setNewPosition("");
      setNewDeadline(undefined);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to add application:", error);
      toast.error(`추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (company: string) => {
    // Get Korean initial or first letter
    const first = company.charAt(0);
    return first;
  };

  const getDdayText = (app: Application) => {
    if (app.status === "rejected") {
      return "";
    }
    if (app.status === "reviewing") {
      return "심사중";
    }
    // 면접 단계인데 deadline이 없으면 단계명만 표시
    const isInterviewStage = app.status === "인적성" || app.status === "AI면접" || app.status === "1차면접" || app.status === "2차면접";
    if (isInterviewStage && app.deadline === null) {
      return app.status;
    }
    if (app.deadline === null) {
      return "심사중";
    }
    // deadline이 있으면 D-day 표시 (배경색으로 단계 구분)
    const dday = calculateDDay(app.deadline);
    if (dday === null) return "-";
    if (dday < 0) return "마감";
    if (dday === 0) return "D-Day";
    return `D-${dday}`;
  };

  const getDdayColor = (app: Application) => {
    if (app.status === "rejected") {
      return "bg-transparent";
    }
    if (app.status === "reviewing") {
      return "bg-amber-100 text-amber-700";
    }
    // 면접 단계는 deadline 유무와 관계없이 해당 색상 유지
    if (app.status === "인적성") {
      return "bg-purple-100 text-purple-700";
    }
    if (app.status === "AI면접") {
      return "bg-cyan-100 text-cyan-700";
    }
    if (app.status === "1차면접") {
      return "bg-blue-100 text-blue-700";
    }
    if (app.status === "2차면접") {
      return "bg-indigo-100 text-indigo-700";
    }
    if (app.deadline === null) {
      return "bg-amber-100 text-amber-700";
    }
    const dday = calculateDDay(app.deadline);
    if (dday === null || dday < 0) {
      return "bg-muted text-muted-foreground";
    }
    if (dday <= 3) {
      return "bg-rose-100 text-rose-600";
    }
    if (dday <= 7) {
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

          {/* Filter Section */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <div className="flex items-center gap-3">
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="직무 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">직무 선택</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                필터 초기화
              </Button>

              <div className="relative ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="기업명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 w-[200px] h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Application Cards */}
          <div className="space-y-6 mb-6">
            {loading && applications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                로딩 중...
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                지원 내역이 없습니다. 새 지원을 추가해보세요!
              </div>
            ) : (
              <>
                {/* Active Applications Section */}
                {activeApplications.length > 0 && (
                  <div className="space-y-3">
                    {displayedActiveApplications.map((app) => (
                      <div key={app.id} className="group">
                        <Card className="px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md">
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
                              </div>
                              <Progress value={app.progress} className="h-1.5" />
                            </div>

                            {/* D-Day Badge */}
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
                              <PopoverContent className="w-[280px] p-0 bg-background" align="center">
                                <div className="p-2 border-b flex flex-wrap gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm px-2"
                                    onClick={() => handleReviewingStatus(app.id)}
                                    disabled={loading}
                                  >
                                    심사중
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "text-sm px-2",
                                      (pendingStage?.appId === app.id ? pendingStage?.stage === "인적성" : app.status === "인적성") && "bg-purple-100"
                                    )}
                                    onClick={() => handleSelectStage(app.id, "인적성")}
                                    disabled={loading}
                                  >
                                    인적성
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "text-sm px-2",
                                      (pendingStage?.appId === app.id ? pendingStage?.stage === "AI면접" : app.status === "AI면접") && "bg-cyan-100"
                                    )}
                                    onClick={() => handleSelectStage(app.id, "AI면접")}
                                    disabled={loading}
                                  >
                                    AI면접
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "text-sm px-2",
                                      (pendingStage?.appId === app.id ? pendingStage?.stage === "1차면접" : app.status === "1차면접") && "bg-blue-100"
                                    )}
                                    onClick={() => handleSelectStage(app.id, "1차면접")}
                                    disabled={loading}
                                  >
                                    1차면접
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "text-sm px-2",
                                      (pendingStage?.appId === app.id ? pendingStage?.stage === "2차면접" : app.status === "2차면접") && "bg-indigo-100"
                                    )}
                                    onClick={() => handleSelectStage(app.id, "2차면접")}
                                    disabled={loading}
                                  >
                                    2차면접
                                  </Button>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={app.deadline ? new Date(app.deadline) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      handleDeadlineUpdate(app.id, date);
                                    }
                                  }}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className="p-2 pointer-events-auto w-full"
                                />
                              </PopoverContent>
                            </Popover>

                            {/* Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={loading}>
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background">
                                {PROGRESS_STAGES.map((stage) => (
                                  <DropdownMenuItem
                                    key={stage.label}
                                    onClick={() => handleProgressUpdate(app.id, stage.progress, stage.label)}
                                    disabled={loading}
                                  >
                                    {stage.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  onClick={() => handleReject(app.id)}
                                  className="text-destructive"
                                  disabled={loading}
                                >
                                  불합격
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(app.id)}
                                  className="text-destructive"
                                  disabled={loading}
                                >
                                  삭제하기
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                        {/* Applied Date - shown on hover */}
                        <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                          <div className="px-4 pt-2 text-xs text-muted-foreground">
                            <span>지원일: {format(new Date(app.applied_at), "yyyy년 MM월 dd일")}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show More/Less Button for Active Applications */}
                    {activeApplications.length > 10 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllActive(!showAllActive)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {showAllActive ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              접기
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              더보기 ({activeApplications.length - 10}개 더)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Accepted Applications Section */}
                {acceptedApplications.length > 0 && (
                  <div className="space-y-3">
                    {/* Always show first accepted application */}
                    <div className="space-y-3">
                      {acceptedApplications.slice(0, 1).map((app) => (
                        <div key={app.id} className="group">
                          <Card className="px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md bg-green-50/40 border-green-100">
                            <div className="flex items-center gap-4">
                              {/* Company Initial */}
                              <div className="w-10 h-10 rounded-full bg-green-100/50 flex items-center justify-center text-sm font-bold text-green-600/70 shrink-0">
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
                                <div className="text-xs font-medium text-green-500/70 mb-1.5">
                                  {app.stage}
                                  <span className="ml-1 text-green-400/70">(최종합격)</span>
                                </div>
                                <Progress value={app.progress} className="h-1.5 opacity-40" />
                              </div>

                              {/* Badge */}
                              <div className="w-20 text-center px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 bg-green-100/50 text-green-600/70">
                                합격
                              </div>

                              {/* Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={loading}>
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background">
                                  <DropdownMenuItem onClick={() => handleRestore(app.id)} disabled={loading}>
                                    복원하기
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(app.id)}
                                    className="text-destructive"
                                    disabled={loading}
                                  >
                                    삭제하기
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                          {/* Applied Date - shown on hover */}
                          <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                            <div className="px-4 pt-2 text-xs text-muted-foreground">
                              <span>지원일: {format(new Date(app.applied_at), "yyyy년 MM월 dd일")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show More/Less Button for remaining accepted applications */}
                    {acceptedApplications.length > 1 && (
                      <>
                        {showAccepted && (
                          <div className="space-y-3">
                            {acceptedApplications.slice(1).map((app) => (
                              <div key={app.id} className="group">
                                <Card className="px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md bg-green-50/40 border-green-100">
                                  <div className="flex items-center gap-4">
                                    {/* Company Initial */}
                                    <div className="w-10 h-10 rounded-full bg-green-100/50 flex items-center justify-center text-sm font-bold text-green-600/70 shrink-0">
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
                                      <div className="text-xs font-medium text-green-500/70 mb-1.5">
                                        {app.stage}
                                        <span className="ml-1 text-green-400/70">(최종합격)</span>
                                      </div>
                                      <Progress value={app.progress} className="h-1.5 opacity-40" />
                                    </div>

                                    {/* Badge */}
                                    <div className="w-20 text-center px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 bg-green-100/50 text-green-600/70">
                                      합격
                                    </div>

                                    {/* Menu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={loading}>
                                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-background">
                                        <DropdownMenuItem onClick={() => handleRestore(app.id)} disabled={loading}>
                                          복원하기
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(app.id)}
                                          className="text-destructive"
                                          disabled={loading}
                                        >
                                          삭제하기
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </Card>
                                {/* Applied Date - shown on hover */}
                                <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                                  <div className="px-4 pt-2 text-xs text-muted-foreground">
                                    <span>지원일: {format(new Date(app.applied_at), "yyyy년 MM월 dd일")}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-center pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAccepted(!showAccepted)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {showAccepted ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                접기
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                더보기 ({acceptedApplications.length - 1}개 더)
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Rejected Applications Section */}
                {rejectedApplications.length > 0 && (
                  <div className="space-y-3">
                    {/* Always show first rejected application */}
                    <div className="space-y-3">
                      {rejectedApplications.slice(0, 1).map((app) => (
                        <div key={app.id} className="group">
                          <Card className="px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md opacity-50 grayscale">
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
                                  <span className="ml-1 text-muted-foreground">(불합격)</span>
                                </div>
                                <Progress value={app.progress} className="h-1.5" />
                              </div>

                              {/* Empty space for D-Day */}
                              <div className="w-20 shrink-0" />

                              {/* Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={loading}>
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background">
                                  <DropdownMenuItem onClick={() => handleRestore(app.id)} disabled={loading}>
                                    복원하기
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(app.id)}
                                    className="text-destructive"
                                    disabled={loading}
                                  >
                                    삭제하기
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                          {/* Applied Date - shown on hover */}
                          <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                            <div className="px-4 pt-2 text-xs text-muted-foreground">
                              <span>지원일: {format(new Date(app.applied_at), "yyyy년 MM월 dd일")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show More/Less Button for remaining rejected applications */}
                    {rejectedApplications.length > 1 && (
                      <>
                        {showRejected && (
                          <div className="space-y-3">
                            {rejectedApplications.slice(1).map((app) => (
                              <div key={app.id} className="group">
                                <Card className="px-5 py-4 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md opacity-50 grayscale">
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
                                        <span className="ml-1 text-muted-foreground">(불합격)</span>
                                      </div>
                                      <Progress value={app.progress} className="h-1.5" />
                                    </div>

                                    {/* Empty space for D-Day */}
                                    <div className="w-20 shrink-0" />

                                    {/* Menu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={loading}>
                                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-background">
                                        <DropdownMenuItem onClick={() => handleRestore(app.id)} disabled={loading}>
                                          복원하기
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(app.id)}
                                          className="text-destructive"
                                          disabled={loading}
                                        >
                                          삭제하기
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </Card>
                                {/* Applied Date - shown on hover */}
                                <div className="overflow-hidden max-h-0 group-hover:max-h-8 transition-all duration-200 ease-out">
                                  <div className="px-4 pt-2 text-xs text-muted-foreground">
                                    <span>지원일: {format(new Date(app.applied_at), "yyyy년 MM월 dd일")}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-center pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRejected(!showRejected)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {showRejected ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                접기
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                더보기 ({rejectedApplications.length - 1}개 더)
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
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
                  disabled={!newCompany || !newPosition || !newDeadline || loading}
                >
                  {loading ? "추가 중..." : "추가하기"}
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
