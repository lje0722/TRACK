import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Clock, Newspaper, Briefcase, List, LogOut } from "lucide-react";
import TrackLogo from "@/components/TrackLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
  { id: "time", label: "시간 관리", icon: Clock, path: "/time" },
  { id: "news", label: "뉴스 스크랩", icon: Newspaper, path: "/news" },
  { id: "applications", label: "지원 현황", icon: Briefcase, path: "/applications" },
  { id: "job-listings", label: "기업 지원 리스트", icon: List, path: "/job-listings" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Extract user info
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "사용자";
  const userEmail = user?.email || "";
  const userAvatar = user?.user_metadata?.avatar_url || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <TrackLogo />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <Avatar className="w-10 h-10">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate" title={userEmail}>
              {userEmail}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate" title={userName}>
                {userName}
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs">로그아웃</span>
              </button>
            </div>
            <p className="text-xs text-primary">Lv.1 시작하는 러너</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
