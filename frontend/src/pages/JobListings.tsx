import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, MoreHorizontal, Pencil, CalendarIcon, ChevronDown, ChevronUp, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/dashboard/Sidebar";
import JobCalendar from "@/components/job-listings/JobCalendar";
import { useJobContext } from "@/contexts/JobContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getAllJobListings,
  createJobListing,
  updateJobListing,
  deleteJobListing as deleteJobListingFromDb,
  type JobListing,
} from "@/lib/job-listings";
import { createApplication } from "@/lib/applications";
import { markAutoCheckRoutine } from "@/lib/daily-routines";
import { toast } from "sonner";

const INDUSTRY_OPTIONS = [
  "IT",
  "미디어,광고",
  "문화,예술,디자인",
  "판매,유통(백화점,무역,물류 등)",
  "제조,생산,화학(반도체,자동차,디스플레이 등)",
  "금융,은행",
  "서비스(호텔,외식,여행,식품 등)",
  "공공기관 / 공기업",
  "교육",
  "의료,제약(보건,바이오,사회복지 등)",
  "건설",
  "기타",
];

const SCALES = ["대기업", "중견기업", "중소기업", "스타트업"] as const;
const STATUSES = ["Not applied", "Applied"] as const;

const JobListings = () => {
  const { markJobListingAdded } = useJobContext();
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Filter states
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedScale, setSelectedScale] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const COLLAPSED_ROWS = 15;

  // Load job listings on mount
  useEffect(() => {
    loadJobListings();
  }, []);

  const loadJobListings = async () => {
    try {
      setLoading(true);
      const data = await getAllJobListings();
      setListings(data);
    } catch (error: any) {
      console.error("Failed to load job listings:", error);
      toast.error(`채용 공고를 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // Form state
  const [newCompany, setNewCompany] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newScale, setNewScale] = useState<string>("");
  const [newUrl, setNewUrl] = useState("");
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);

  // Edit form state
  const [editCompany, setEditCompany] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editScale, setEditScale] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(undefined);

  // Get unique positions for filter
  const positions = useMemo(() => {
    const uniquePositions = [...new Set(listings.map((item) => item.position))];
    return uniquePositions.filter((pos): pos is string => pos !== undefined && pos !== "");
  }, [listings]);

  // Filter data based on selections and search query
  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return listings.filter((item) => {
      if (query && !item.company.toLowerCase().includes(query)) {
        return false;
      }
      if (selectedPosition !== "all" && item.position !== selectedPosition) {
        return false;
      }
      if (selectedScale !== "all" && item.company_size !== selectedScale) {
        return false;
      }
      return true;
    });
  }, [listings, selectedPosition, selectedScale, searchQuery]);

  const resetFilters = () => {
    setSelectedPosition("all");
    setSelectedScale("all");
    setSearchQuery("");
  };

  const handleAddListing = async () => {
    if (!newCompany || !newPosition) return;
    if (loading) return; // 이미 처리 중이면 무시

    try {
      setLoading(true);
      await createJobListing({
        company: newCompany,
        position: newPosition,
        location: newLocation,
        industry: newIndustry,
        company_size: (newScale as JobListing["company_size"]) || null,
        deadline: newDeadline || null,
        job_post_url: newUrl,
      });
      await loadJobListings();

      // Mark routine as completed (JobContext - legacy)
      markJobListingAdded();

      // Auto-check routine for today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await markAutoCheckRoutine(todayStr, "job_listing");

      toast.success("채용 공고가 추가되었습니다.");
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to add job listing:", error);
      toast.error(`추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewCompany("");
    setNewPosition("");
    setNewLocation("");
    setNewIndustry("");
    setNewScale("");
    setNewUrl("");
    setNewDeadline(undefined);
  };

  const handleEditClick = (listing: JobListing) => {
    setEditingId(listing.id);
    setEditCompany(listing.company);
    setEditPosition(listing.position);
    setEditLocation(listing.location);
    setEditIndustry(listing.industry);
    setEditScale(listing.company_size || "");
    setEditStatus(listing.status);
    setEditUrl(listing.job_post_url);
    // Parse deadline string (YYYY-MM-DD) to Date
    if (listing.deadline) {
      setEditDeadline(new Date(listing.deadline));
    } else {
      setEditDeadline(undefined);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (loading) return; // 이미 처리 중이면 무시

    try {
      setLoading(true);
      await updateJobListing(editingId, {
        company: editCompany,
        position: editPosition,
        location: editLocation,
        industry: editIndustry,
        company_size: (editScale as JobListing["company_size"]) || null,
        status: editStatus as JobListing["status"],
        deadline: editDeadline || null,
        job_post_url: editUrl,
      });
      await loadJobListings();
      toast.success("채용 공고가 수정되었습니다.");
      setEditingId(null);
    } catch (error: any) {
      console.error("Failed to update job listing:", error);
      toast.error(`수정에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteJobListingFromDb(id);
      await loadJobListings();
      toast.success("채용 공고가 삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete job listing:", error);
      toast.error(`삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (listing: JobListing, newStatus: string) => {
    if (newStatus === "Applied" && listing.status === "Not applied") {
      setSelectedListing(listing);
      setConfirmDialogOpen(true);
    } else {
      // Just update status without moving
      updateJobListing(listing.id, { status: newStatus as JobListing["status"] })
        .then(() => loadJobListings())
        .catch((error) => {
          console.error("Failed to update status:", error);
          toast.error("상태 업데이트에 실패했습니다.");
        });
    }
  };

  const handleConfirmMove = async () => {
    if (!selectedListing) return;
    if (loading) return; // 이미 처리 중이면 무시

    try {
      setLoading(true);

      // 1. Create application
      await createApplication({
        company: selectedListing.company,
        position: selectedListing.position,
        stage: "서류 접수",
        progress: 10,
        deadline: selectedListing.deadline ? new Date(selectedListing.deadline) : null,
        applied_at: new Date(),
        status: "active",
        url: selectedListing.job_post_url,
      });

      // 2. Delete from job listings
      await deleteJobListingFromDb(selectedListing.id);

      // 3. Reload listings
      await loadJobListings();

      toast.success("지원 현황에 추가되었습니다!");
      setConfirmDialogOpen(false);
      setSelectedListing(null);
    } catch (error: any) {
      console.error("Failed to move to applications:", error);
      toast.error(`지원 현황 추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const getScaleColor = (scale: JobListing["company_size"]) => {
    switch (scale) {
      case "대기업":
        return "text-green-500";
      case "중견기업":
        return "text-orange-600";
      case "중소기업":
        return "text-amber-400";
      case "스타트업":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusColor = (status: JobListing["status"]) => {
    switch (status) {
      case "Applied":
        return "text-teal-400";
      case "Not applied":
        return "text-rose-300";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 px-32 py-6 overflow-auto">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                기업 지원 리스트 (Job Listings)
              </h1>
              <p className="text-sm text-muted-foreground">
                관심 있는 채용 공고를 저장하고 관리하세요.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-medium rounded-lg h-auto">
                  <Plus className="w-4 h-4 mr-1.5" />
                  공고 추가
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

              <Select value={selectedScale} onValueChange={setSelectedScale}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="규모 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">규모 선택</SelectItem>
                  {SCALES.map((scale) => (
                    <SelectItem key={scale} value={scale}>
                      {scale}
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

          {/* Two Column Layout - 5:4 ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
            {/* Left - Job Table (5/9) */}
            <Card className="overflow-hidden h-fit lg:col-span-5">
              <Table>
                <TableHeader>
                <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold text-foreground">기업</TableHead>
                    <TableHead className="font-semibold text-foreground">직무</TableHead>
                    <TableHead className="font-semibold text-foreground">규모</TableHead>
                    <TableHead className="font-semibold text-foreground">단계</TableHead>
                    <TableHead className="font-semibold text-foreground">마감일</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isTableExpanded ? filteredListings : filteredListings.slice(0, COLLAPSED_ROWS)).map((listing) => (
                    <TableRow key={listing.id} className="hover:bg-muted/20 group">
                      <TableCell className="font-medium py-2">
                        {listing.job_post_url ? (
                          <a
                            href={listing.job_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline cursor-pointer hover:text-primary text-sm"
                          >
                            {listing.company}
                          </a>
                        ) : (
                          <span className="text-sm">{listing.company}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm py-2">{listing.position}</TableCell>
                      <TableCell className="py-2">
                        <span className={cn("text-xs", getScaleColor(listing.company_size))}>
                          {listing.company_size || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Select
                          value={listing.status}
                          onValueChange={(value) => handleStatusChange(listing, value)}
                        >
                          <SelectTrigger className={cn(
                            "h-7 w-fit gap-1 border-0 bg-transparent p-0 text-xs focus:ring-0",
                            getStatusColor(listing.status)
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status === "Not applied" ? "NA" : status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">
                        {listing.deadline ? format(new Date(listing.deadline), "MM/dd/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(listing)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(listing.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredListings.length > COLLAPSED_ROWS && (
                <div className="border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsTableExpanded(!isTableExpanded)}
                  >
                    {isTableExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        {filteredListings.length - COLLAPSED_ROWS}개 더 보기
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Right - Calendar (4/9) */}
            <div className="lg:col-span-4">
              <JobCalendar listings={listings} />
            </div>
          </div>

          {/* Add Dialog Content */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>새 공고 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">기업명 *</label>
                    <Input
                      placeholder="기업명"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">포지션 *</label>
                    <Input
                      placeholder="포지션"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">위치</label>
                    <Input
                      placeholder="예: 서울(강남)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">산업/분야</label>
                    <Select value={newIndustry} onValueChange={setNewIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="산업 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">규모</label>
                    <Select value={newScale} onValueChange={setNewScale}>
                      <SelectTrigger>
                        <SelectValue placeholder="규모 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALES.map((scale) => (
                          <SelectItem key={scale} value={scale}>
                            {scale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">마감일</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {newDeadline ? format(newDeadline, "yyyy-MM-dd") : "날짜 선택"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newDeadline}
                          onSelect={setNewDeadline}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">채용 공고 링크</label>
                  <Input
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddListing}
                  disabled={!newCompany || !newPosition}
                >
                  추가하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>공고 수정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">기업명</label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">포지션</label>
                    <Input
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">위치</label>
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">산업/분야</label>
                    <Select value={editIndustry} onValueChange={setEditIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="산업 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">규모</label>
                    <Select value={editScale} onValueChange={setEditScale}>
                      <SelectTrigger>
                        <SelectValue placeholder="규모 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALES.map((scale) => (
                          <SelectItem key={scale} value={scale}>
                            {scale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">상태</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "Not applied" ? "NA" : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">마감일</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {editDeadline ? format(editDeadline, "yyyy-MM-dd") : "날짜 선택"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editDeadline}
                          onSelect={setEditDeadline}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">채용 공고 링크</label>
                    <Input
                      placeholder="https://..."
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSaveEdit}
                >
                  저장하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Confirm Move Dialog */}
          <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>지원 현황에 추가하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedListing?.company} - {selectedListing?.position} 공고가 지원 현황으로 이동됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmMove}>확인</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default JobListings;
