import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import heroImage from "@/assets/hero-track.png";

const Index = () => {
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    navigate("/preview");
  };

  const handleGoogleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div
        className="relative hidden lg:block lg:w-1/2 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden
      />

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8 lg:p-16 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">당신의 성장을 기록할 준비가 되셨나요?</p>
          </div>

          <div className="space-y-5">
            <Button 
              variant="outline" 
              className="w-full h-12 text-sm gap-3 rounded-lg border-border hover:bg-muted/50"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              Google 계정으로 계속하기
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-sm rounded-full bg-dark-navy hover:bg-dark-navy/90 text-white"
              onClick={handleGuestLogin}
            >
              게스트로 둘러보기 (기능 미리보기)
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            계속 진행함으로써 TRACK의{" "}
            <a href="#" className="underline hover:text-foreground">이용약관</a>
            {" "}및{" "}
            <a href="#" className="underline hover:text-foreground">개인정보처리방침</a>
            에 동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
