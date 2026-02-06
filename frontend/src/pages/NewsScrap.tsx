import { useState, useEffect, useMemo } from "react";
import { Trash2, Plus, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/dashboard/Sidebar";
import RichTextEditor from "@/components/news/RichTextEditor";
import {
  getAllNewsScraps,
  createNewsScrap,
  updateNewsScrap,
  deleteNewsScrap,
  type NewsScrap as NewsScrapType,
} from "@/lib/news-scraps";
import { useJobContext } from "@/contexts/JobContext";
import { markAutoCheckRoutine } from "@/lib/daily-routines";
import { useDashboardStore } from "@/stores/dashboardStore";
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

const NewsScrap = () => {
  const { markNewsScrapAdded } = useJobContext();
  const [newsScraps, setNewsScraps] = useState<NewsScrapType[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 3-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    article_url: "",
    headline: "",
    content: "",
    additional_research: "", // 2번 페이지: 추가 조사 내용 (임시, DB 저장 안 함)
    applied_role: "", // 3번 페이지: 적용점/인터뷰 질문 (최종, DB 저장)
    industry: "",
    company_name: "",
  });

  const itemsPerPage = 10;

  // Load news scraps on mount
  useEffect(() => {
    loadNewsScraps();
  }, []);

  const loadNewsScraps = async () => {
    try {
      setLoading(true);
      const scraps = await getAllNewsScraps();
      setNewsScraps(scraps);
    } catch (error: any) {
      console.error("Failed to load news scraps:", error);
      toast.error(`뉴스 스크랩을 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // Get unique industries and companies
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(newsScraps.map((item) => item.industry).filter(Boolean))];
    return uniqueIndustries as string[];
  }, [newsScraps]);

  const companies = useMemo(() => {
    const uniqueCompanies = [...new Set(newsScraps.map((item) => item.company_name).filter(Boolean))];
    return uniqueCompanies as string[];
  }, [newsScraps]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return newsScraps.filter((item) => {
      if (selectedIndustry !== "all" && item.industry !== selectedIndustry) {
        return false;
      }
      if (selectedCompany !== "all" && item.company_name !== selectedCompany) {
        return false;
      }
      return true;
    });
  }, [newsScraps, selectedIndustry, selectedCompany]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSelectedIndustry("all");
    setSelectedCompany("all");
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteNewsScrap(id);
      await loadNewsScraps();
      toast.success("뉴스 스크랩이 삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete news scrap:", error);
      toast.error(`뉴스 스크랩 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: NewsScrapType) => {
    setEditingId(item.id);
    setFormData({
      article_url: item.article_url,
      headline: item.headline,
      content: item.content,
      additional_research: "",
      applied_role: item.applied_role || "",
      industry: item.industry || "",
      company_name: item.company_name || "",
    });
    setCurrentStep(1);
    setIsFormOpen(true);
  };

  // Form validation
  const isStep1Valid = formData.article_url.trim() !== "" &&
                       formData.headline.trim() !== "" &&
                       formData.content.trim() !== "";

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid) return;

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (loading) return; // 이미 처리 중이면 무시

    try {
      setLoading(true);
      // additional_research는 임시 작업용이므로 DB에 저장하지 않음
      const { additional_research, ...dataToSave } = formData;

      if (editingId) {
        // 수정 모드
        await updateNewsScrap(editingId, dataToSave);
        toast.success("뉴스 스크랩이 수정되었습니다.");
      } else {
        // 새로 작성 모드
        await createNewsScrap(dataToSave);

        // Mark routine as completed (JobContext - legacy)
        markNewsScrapAdded();

        // Auto-check routine for today
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        await markAutoCheckRoutine(todayStr, "news_scrap");
        await useDashboardStore.getState().refreshTodayRoutines();

        toast.success("뉴스 스크랩이 저장되었습니다.");
      }

      await loadNewsScraps();
      resetForm();
    } catch (error: any) {
      console.error("Failed to save news scrap:", error);
      toast.error(`뉴스 스크랩 저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      article_url: "",
      headline: "",
      content: "",
      additional_research: "",
      applied_role: "",
      industry: "",
      company_name: "",
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const steps = [
    { number: 1, label: "경제신문 스크랩하기" },
    { number: 2, label: "추가 조사하기" },
    { number: 3, label: "적용점 발견하기" },
  ];

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 px-32 py-6 overflow-auto">
          {/* Page Title */}
          <div className="mb-5 text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">
              경제 뉴스 스크랩 (News Scrap)
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              산업 트렌드와 기업 경쟁력을 스크랩으로 축적하세요.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              취업 준비를 넘어 경영자의 시각을 기르는 데이터가 됩니다.
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                variant="default"
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => window.open("https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&oid=015&listType=paper", "_blank")}
              >
                경제 뉴스 바로가기
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => window.open("https://www.bigkinds.or.kr/v2/news/index.do", "_blank")}
              >
                산업 리포트 보기
              </Button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <div className="flex items-center gap-3">
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="산업군 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">산업군 선택</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="기업 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">기업 선택</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                필터 초기화
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">작성일자</TableHead>
                  <TableHead className="w-[220px]">헤드라인</TableHead>
                  <TableHead className="w-[200px]">적용점 / 현직자 인터뷰 질문</TableHead>
                  <TableHead className="w-[140px] text-left px-4">산업</TableHead>
                  <TableHead className="w-[100px] text-left px-4">기업명</TableHead>
                  <TableHead className="w-[100px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      스크랩한 뉴스가 없습니다. 새 스크랩을 추가해보세요!
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <a
                          href={item.article_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline cursor-pointer hover:text-primary"
                        >
                          {item.headline}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applied_role && item.applied_role.length > 20 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="cursor-pointer hover:text-foreground">
                                {truncateText(item.applied_role)}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3">
                              <p className="text-sm whitespace-pre-wrap">{item.applied_role}</p>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          item.applied_role || "아직 작성된 노트가 없습니다..."
                        )}
                      </TableCell>
                      <TableCell className="text-left px-4 py-2">
                        {item.industry || "-"}
                      </TableCell>
                      <TableCell className="text-left px-4 py-2">
                        {item.company_name || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(item)}
                            disabled={loading}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4 border-t border-border">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <div className="flex justify-end mt-4 mb-4">
            <Button
              className="rounded-full px-6 py-3 shadow-lg"
              size="lg"
              onClick={() => {
                if (isFormOpen) {
                  resetForm();
                } else {
                  setIsFormOpen(true);
                }
              }}
              disabled={loading}
            >
              {isFormOpen ? (
                <>
                  <ChevronUp className="w-5 h-5 mr-1" />
                  닫기
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-1" />
                  새 스크랩 작성
                </>
              )}
            </Button>
          </div>

          {/* 3-Step Form Panel */}
          {isFormOpen && (
            <div className="bg-card rounded-lg border border-border mb-4 overflow-hidden">
              {/* Step Indicator */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-center">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= step.number
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step.number}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            currentStep >= step.number
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-24 h-px bg-border mx-6" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 pb-6">
                <div className="bg-muted/30 rounded-lg p-5">
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          기사 링크 (URL)
                        </label>
                        <Input
                          placeholder="기사 주소를 여기에 붙여넣으세요"
                          value={formData.article_url}
                          onChange={(e) =>
                            setFormData({ ...formData, article_url: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          헤드라인 (직접 요약)
                        </label>
                        <Input
                          placeholder="기사 내용을 한 줄로 요약해보세요"
                          value={formData.headline}
                          onChange={(e) =>
                            setFormData({ ...formData, headline: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          본문 내용 (복사 & 붙여넣기)
                        </label>
                        <RichTextEditor
                          value={formData.content}
                          onChange={(value) =>
                            setFormData({ ...formData, content: value })
                          }
                          placeholder="중요한 내용을 여기에 정리하거나 붙여넣으세요..."
                          className="min-h-[180px]"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-foreground mb-4">
                        <input type="checkbox" checked readOnly className="w-4 h-4 accent-primary" />
                        <span>스크랩한 경제신문을 보고 지원동기에 적용할 점을 찾아 요약하거나 현직자에게 질문할 거리를 찾아보세요.</span>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {/* Left side - Scraped content (read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            스크랩한 경제신문
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">
                            기사에서 해당되는 내용을 드래그 한 후 다음과 같이 구분해주세요.
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                            빨간색: 숫자와 관련된 부분 /
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2 mr-1" />
                            파란색: 기사를 통해 내가 새롭게 알게된 부분(인사이트)
                          </p>
                          <div
                            className="bg-background border border-border rounded-md p-4 min-h-[300px] text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formData.content || "<p class='text-muted-foreground'>스크랩한 내용이 없습니다.</p>"
                            }}
                          />
                        </div>

                        {/* Right side - Additional Research */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            추가 조사할 내용
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">
                            인사이트 중 관심있는 키워드 2-3개를 선정해 추가 조사 후 정리해보세요
                          </p>
                          <p className="text-xs text-muted-foreground mb-3 invisible">
                            &nbsp;
                          </p>
                          <Textarea
                            placeholder="인사이트 중 관심있는 키워드 2-3개를 선정해 추가 조사 후 정리해보세요"
                            className="min-h-[300px] resize-none overflow-hidden"
                            value={formData.additional_research}
                            onChange={(e) =>
                              setFormData({ ...formData, additional_research: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <input type="checkbox" checked readOnly className="w-4 h-4 accent-primary" />
                          <span>스크랩한 경제신문을 보고 지원동기에 적용할 점을 찾아 요약하거나 현직자에게 질문할 거리를 찾아보세요.</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <input type="checkbox" checked readOnly className="w-4 h-4 accent-primary" />
                          <span>마지막으로 스크랩한 경제신문을 구분할 수 있도록 기업명과 산업명을 태그(카테고리)로 작성해주세요.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Left side - Scraped content (read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            스크랩한 경제신문
                          </label>
                          <p className="text-xs text-muted-foreground mb-1">
                            기사에서 해당되는 내용을 드래그 한 후 다음과 같이 구분해주세요.
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                            빨간색: 숫자와 관련된 부분 /
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2 mr-1" />
                            파란색: 기사를 통해 내가 새롭게 알게된 부분(인사이트)
                          </p>
                          <p className="text-xs text-muted-foreground mb-3 invisible">&nbsp;</p>
                          <div
                            className="bg-background border border-border rounded-md p-4 min-h-[250px] text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formData.content || "<p class='text-muted-foreground'>스크랩한 내용이 없습니다.</p>"
                            }}
                          />
                        </div>

                        {/* Right side - Application points / Interview questions */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            신문스크랩 적용점 혹은 현직자 인터뷰 질문
                          </label>
                          <p className="text-xs text-muted-foreground mb-1">
                            스크랩한 경제신문 내용에서
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            • 지원 동기에 활용할 기업의 제품, 기술, 사업 특징을 요약하거나
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            • 기사로 알기 어려운 내용을 현직자에게 묻고 싶은 질문 1-2가지로 정리해보세요
                          </p>
                          <Textarea
                            placeholder="스크랩한 경제신문 내용에서 • 지원 동기에 활용할 기업의 제품, 기술, 사업 특징을 요약하거나 • 기사로 알기 어려운 내용을 현직자에게 묻고 싶은 질문 1-2가지로 정리해보세요"
                            className="min-h-[250px] resize-none overflow-hidden"
                            value={formData.applied_role}
                            onChange={(e) =>
                              setFormData({ ...formData, applied_role: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Tags Section - Below the grid */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            산업 태그
                          </label>
                          <Select
                            value={formData.industry}
                            onValueChange={(value) =>
                              setFormData({ ...formData, industry: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="산업군을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRY_OPTIONS.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            기업명
                          </label>
                          <Input
                            placeholder="기업명을 입력하세요"
                            value={formData.company_name}
                            onChange={(e) =>
                              setFormData({ ...formData, company_name: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handlePrev} disabled={loading}>
                      이전
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button
                      onClick={handleNext}
                      disabled={(currentStep === 1 && !isStep1Valid) || loading}
                      className="bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                    >
                      다음
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading ? "저장 중..." : editingId ? "수정" : "저장"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NewsScrap;
