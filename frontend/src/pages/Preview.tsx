import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrackLogo from "@/components/TrackLogo";
import { Check, FileText, Briefcase, ChevronDown, ArrowRight, Lock } from "lucide-react";

const Preview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <TrackLogo />
          <Button variant="nav-dark" onClick={() => navigate("/")}>
            로그인하고 시작하기
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-6">
          Preview Mode
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2">
          당신의 합격 데이터는
        </h1>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-muted mb-8">
          아직 비어있습니다.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-4">
          TRACK은 단순한 플래너가 아닙니다.<br />
          불안한 취업 과정을 뇌과학적 설계를 통해<br />
          '눈에 보이는 데이터'로 치환하는 시스템입니다.
        </p>
        
        <div className="mt-12 animate-bounce-slow">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </div>
      </section>

      {/* Feature 1: Routine Checklist */}
      <section className="py-24 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {/* Green check icon */}
              <div className="w-16 h-16 bg-icon-green-bg rounded-2xl flex items-center justify-center">
                <Check className="w-8 h-8 text-icon-green" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                작은 성취를 뇌에 각인시키세요.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                막연한 불안감은 '통제할 수 없는 상태'에서 옵니다.<br />
                기상, 운동, 학습 등 스스로 통제 가능한 루틴을 수행하고 체크하세요.<br />
                도파민 보상 시스템이 당신을 책상 앞으로 이끕니다.
              </p>
            </div>
            
            <div className="relative">
              {/* Checklist Card - 더 얇게 */}
              <div className="bg-card rounded-3xl shadow-lg p-6 space-y-3 border border-border/50">
                <ChecklistItem text="08:00 기상 및 이불 정리" />
                <ChecklistItem text="경제 신문 스크랩 1건" />
                <ChecklistItem text="직무 관련 강의 수강" />
                <div className="pt-3 flex justify-center">
                  {/* 파스텔 핑크 톤으로 변경 */}
                  <span className="px-5 py-1.5 bg-[hsl(350,100%,97%)] text-[hsl(350,60%,70%)] text-sm font-medium rounded-full">
                    아직 달성률 0%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Scrap */}
      <section className="py-24 px-6 bg-soft-blue">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              {/* Scrap Card with Lock - 실제 글씨가 흐릿하게 보이는 효과 */}
              <div className="bg-card rounded-3xl shadow-lg p-8 border border-border/50 relative overflow-hidden">
                {/* 실제 텍스트를 블러 처리 */}
                <div className="space-y-6">
                  {/* 제목 부분 - 블러된 텍스트 */}
                  <div className="blur-[6px] select-none pointer-events-none">
                    <p className="text-foreground/60 text-lg font-medium leading-relaxed">
                      삼성전자, AI 반도체 투자 확대 발표
                    </p>
                    <p className="text-foreground/40 text-base mt-2">
                      국내 반도체 산업 경쟁력 강화
                    </p>
                  </div>

                  {/* 본문 부분 - 더 흐릿한 블러 */}
                  <div className="blur-[5px] select-none pointer-events-none border-t border-border/30 pt-4">
                    <p className="text-muted-foreground/50 text-sm leading-relaxed">
                      주요내용: 향후 5년간 300조 투자 계획...
                    </p>
                  </div>
                </div>

                {/* Only for Members 버튼 - 중앙 배치 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-background border border-border rounded-full text-base font-semibold text-foreground shadow-lg">
                    <Lock className="w-5 h-5" />
                    Only for Members
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              {/* Blue document icon */}
              <div className="w-16 h-16 bg-icon-blue-bg rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-icon-blue" strokeWidth={2} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                정보를 당신만의 인사이트로.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                단순히 기사를 읽는 것은 도움이 되지 않습니다.<br />
                TRACK의 구조화된 스크랩 기능을 통해<br />
                '요약-인사이트-적용점'을 정리하고 면접 필살기로 만드세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Application Status */}
      <section className="py-24 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {/* Purple briefcase icon */}
              <div className="w-16 h-16 bg-icon-purple-bg rounded-2xl flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-icon-purple" strokeWidth={2} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                지원 현황을 한눈에 장악하세요.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                어디에 지원했는지, 다음 단계는 무엇인지 잊지 마세요.<br />
                서류부터 면접까지 파이프라인을 시각화하여<br />
                '다음 할 일(Next Action)'에만 집중할 수 있게 돕습니다.
              </p>
            </div>
            
            <div className="relative">
              {/* Application Status Cards - Stacked */}
              <div className="space-y-3">
                {/* Top card (dimmed) - 회색을 더 진하게 */}
                <div className="bg-card rounded-3xl shadow-md p-5 border border-border/50">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 bg-muted rounded-full w-24" />
                    <div className="h-3.5 bg-muted/70 rounded-full w-14" />
                  </div>
                  <div className="mt-3 h-2.5 bg-muted/60 rounded-full w-full" />
                </div>

                {/* Bottom card (main) - 검정색을 더 연하게 */}
                <div className="relative bg-card rounded-3xl shadow-lg p-5 border-2 border-primary/20">
                  {/* D-Day Badge */}
                  <div className="absolute -top-3 right-6">
                    <span className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full shadow-md">
                      D-Day Check
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 mb-4">
                    <div className="w-12 h-12 bg-muted/70 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      {/* 검정색을 더 연하게 (회색 톤으로) */}
                      <div className="h-3.5 bg-[hsl(222,20%,30%)] rounded-full w-36" />
                      <div className="h-2.5 bg-muted/70 rounded-full w-20" />
                    </div>
                  </div>
                  
                  {/* Next action row */}
                  <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm font-medium">다음: 모의 면접 스터디 (2/1)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-dark-navy">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            이제, 당신의 데이터를 쌓을 시간입니다.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            망설이는 시간에도 경쟁자들은 기록하고 있습니다.<br />
            TRACK과 함께 합격의 확률을 높이세요.
          </p>
          <Button 
            variant="cta" 
            size="xl"
            onClick={() => navigate("/")}
            className="group"
          >
            지금 무료로 시작하기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

const ChecklistItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-4 py-3.5 px-4 bg-background rounded-2xl border border-border/40 shadow-sm">
    <div className="w-7 h-7 border-2 border-muted-foreground/15 rounded-lg flex-shrink-0" />
    <span className="text-muted-foreground/80 text-base">{text}</span>
  </div>
);

export default Preview;
