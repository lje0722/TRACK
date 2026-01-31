import { useState, useMemo } from "react";
import { Trash2, Filter, Plus, ChevronUp } from "lucide-react";
import { useJobContext } from "@/contexts/JobContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Sidebar from "@/components/dashboard/Sidebar";
import ScrapFormPanel from "@/components/news/ScrapFormPanel";


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

interface NewsItem {
  id: number;
  date: string;
  headline: string;
  url: string;
  insight: string;
  industry: string;
  company: string;
}

interface ScrapFormData {
  url: string;
  headline: string;
  content: string;
  insight: string;
  question: string;
  industry: string;
  company: string;
}

const initialNewsData: NewsItem[] = [
  {
    id: 1,
    date: "26-01-27",
    headline: "삼성전자, AI 가전 2라운드 시작",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "IT",
    company: "삼성전자",
  },
  {
    id: 2,
    date: "26-01-26",
    headline: "다이소 연매출 3조원 돌파 비결",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "판매,유통(백화점,무역,물류 등)",
    company: "아성다이소",
  },
  {
    id: 3,
    date: "26-01-22",
    headline: "한미약품 4분기 실적 분석",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "의료,제약(보건,바이오,사회복지 등)",
    company: "한미약품",
  },
  {
    id: 4,
    date: "26-01-21",
    headline: "금값 상승과 비트코인 상관관계",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "금융,은행",
    company: "-",
  },
  {
    id: 5,
    date: "26-01-20",
    headline: "현대차 전기차 판매량 급증",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "제조,생산,화학(반도체,자동차,디스플레이 등)",
    company: "현대자동차",
  },
  {
    id: 6,
    date: "26-01-19",
    headline: "네이버 AI 검색 서비스 출시",
    url: "https://news.naver.com",
    insight: "아직 작성된 노트가 없습니다...",
    industry: "IT",
    company: "네이버",
  },
];

const NewsScrap = () => {
  const { markNewsScrapAdded } = useJobContext();
  const [newsData, setNewsData] = useState<NewsItem[]>(initialNewsData);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const itemsPerPage = 10;

  // Get unique industries and companies that have values
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(newsData.map((item) => item.industry))];
    return uniqueIndustries.filter((ind): ind is string => ind !== undefined && ind !== "-" && ind !== "");
  }, [newsData]);

  const companies = useMemo(() => {
    const uniqueCompanies = [...new Set(newsData.map((item) => item.company))];
    return uniqueCompanies.filter((comp): comp is string => comp !== undefined && comp !== "-" && comp !== "");
  }, [newsData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return newsData.filter((item) => {
      // When filtering, only show items that have the selected industry/company
      if (selectedIndustry !== "all" && item.industry !== selectedIndustry) {
        return false;
      }
      if (selectedCompany !== "all" && item.company !== selectedCompany) {
        return false;
      }
      
      return true;
    });
  }, [newsData, selectedIndustry, selectedCompany]);

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

  const handleDelete = (id: number) => {
    setNewsData(newsData.filter(item => item.id !== id));
  };

  const handleUpdateIndustry = (id: number, newIndustry: string) => {
    setNewsData(newsData.map(item => 
      item.id === id ? { ...item, industry: newIndustry } : item
    ));
  };

  const handleUpdateCompany = (id: number, newCompany: string) => {
    setNewsData(newsData.map(item => 
      item.id === id ? { ...item, company: newCompany } : item
    ));
  };

  const handleFormSubmit = (data: ScrapFormData) => {
    const today = new Date();
    const dateStr = `${String(today.getFullYear()).slice(2)}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newItem: NewsItem = {
      id: Date.now(),
      date: dateStr,
      headline: data.headline,
      url: data.url,
      insight: data.question || "아직 작성된 노트가 없습니다...",
      industry: data.industry || "-",
      company: data.company || "-",
    };
    
    setNewsData([newItem, ...newsData]);
    markNewsScrapAdded();
    setIsFormOpen(false);
  };

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Content Area */}
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
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                필터 초기화
              </Button>
            </div>
          </div>

          {/* News Table */}
          <div className="bg-card rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">작성일자</TableHead>
                  <TableHead className="w-[220px]">헤드라인</TableHead>
                  <TableHead className="w-[200px]">적용점 / 현직자 인터뷰 질문</TableHead>
                  <TableHead className="w-[140px] text-left px-4">산업</TableHead>
                  <TableHead className="w-[100px] text-left px-4">기업명</TableHead>
                  <TableHead className="w-[60px] text-center">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {item.date}
                    </TableCell>
                    <TableCell className="font-medium">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline cursor-pointer hover:text-primary"
                      >
                        {item.headline}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.insight}
                    </TableCell>
                    <TableCell className="text-left px-4 py-2">
                      <Select 
                        value={item.industry === "-" ? undefined : item.industry} 
                        onValueChange={(value) => handleUpdateIndustry(item.id, value)}
                      >
                        <SelectTrigger className="h-auto w-full border-none bg-transparent shadow-none hover:bg-secondary/50 focus:ring-0 text-muted-foreground text-sm justify-start p-0 [&>span]:truncate [&>span]:max-w-[120px]">
                          <SelectValue placeholder="산업 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((ind) => (
                            <SelectItem key={ind} value={ind} className="text-sm">
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-left px-4 py-2">
                      <Input 
                        value={item.company}
                        onChange={(e) => handleUpdateCompany(item.id, e.target.value)}
                        className="h-auto border-none bg-transparent hover:bg-secondary/50 focus:ring-1 text-sm p-0"
                        placeholder="기업명 입력"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

          {/* Floating Action Button - positioned relative to content */}
          <div className="flex justify-end mt-4 mb-4">
            <Button
              className="rounded-full px-6 py-3 shadow-lg"
              size="lg"
              onClick={() => setIsFormOpen(!isFormOpen)}
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

          {/* Scrap Form Panel - inline below content */}
          {isFormOpen && (
            <ScrapFormPanel
              isOpen={isFormOpen}
              onClose={() => setIsFormOpen(false)}
              onSubmit={handleFormSubmit}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default NewsScrap;
