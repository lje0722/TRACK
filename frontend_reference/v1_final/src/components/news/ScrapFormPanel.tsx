import { useState, useRef, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "./RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScrapFormData {
  url: string;
  headline: string;
  content: string;
  insight: string;
  question: string;
  industry: string;
  company: string;
}

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
  "금융/은행",
  "기타",
];

interface ScrapFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScrapFormData) => void;
}

const ScrapFormPanel = ({ isOpen, onClose, onSubmit }: ScrapFormPanelProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ScrapFormData>({
    url: "",
    headline: "",
    content: "",
    insight: "",
    question: "",
    industry: "",
    company: "",
  });

  // Refs for auto-resize textareas
  const insightRef = useRef<HTMLTextAreaElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const autoResize = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Auto-resize on content change
  useEffect(() => {
    autoResize(insightRef.current);
  }, [formData.insight]);

  useEffect(() => {
    autoResize(questionRef.current);
  }, [formData.question]);

  const steps = [
    { number: 1, label: "경제신문 스크랩하기" },
    { number: 2, label: "추가 조사하기" },
    { number: 3, label: "적용점 발견하기" },
  ];

  // Check if step 1 required fields are filled
  const isStep1Valid = formData.url.trim() !== "" && 
                       formData.headline.trim() !== "" && 
                       formData.content.trim() !== "";

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid) return;
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
      resetForm();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      url: "",
      headline: "",
      content: "",
      insight: "",
      question: "",
      industry: "",
      company: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
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
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
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
                <p className="text-xs text-muted-foreground mt-1">
                  예시: 삼성전자-SK, 반도체 경쟁 심화 (원문: 정부 승인...)
                </p>
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
                <span>스크랩한 경제신문을 보고 내가 조사하고 싶은 키워드를 찾아 추가로 조사해보세요.</span>
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

                {/* Right side - Additional research */}
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
                    ref={insightRef}
                    placeholder="인사이트 중 관심있는 키워드 2-3개를 선정해 추가 조사 후 정리해보세요"
                    className="min-h-[300px] resize-none overflow-hidden"
                    value={formData.insight}
                    onChange={(e) =>
                      setFormData({ ...formData, insight: e.target.value })
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
              
              <div className="grid grid-cols-2 gap-6">
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
                  <p className="text-xs text-muted-foreground mb-3 invisible">
                    &nbsp;
                  </p>
                  <div 
                    className="bg-background border border-border rounded-md p-4 min-h-[250px] text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formData.content || "<p class='text-muted-foreground'>스크랩한 내용이 없습니다.</p>" 
                    }}
                  />
                </div>

                {/* Right side - Interview/Summary */}
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
                    ref={questionRef}
                    placeholder="스크랩한 경제신문 내용에서 • 지원 동기에 활용할 기업의 제품, 기술, 사업 특징을 요약하거나 • 기사로 알기 어려운 내용을 현직자에게 묻고 싶은 질문 1-2가지로 정리해보세요"
                    className="min-h-[250px] resize-none overflow-hidden"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Tags section */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  태그
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  스크랩한 경제신문을 구분할 수 있도록 산업과 기업명 등을 태그(카테고리)로 작성해주세요.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      setFormData({ ...formData, industry: value })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="산업 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="기업명 작성"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
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
            <Button variant="outline" onClick={handlePrev}>
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={currentStep === 1 && !isStep1Valid}
            className={currentStep === 3 
              ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {currentStep === 3 ? "저장" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScrapFormPanel;
