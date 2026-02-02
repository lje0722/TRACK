import { Link } from "react-router-dom";

interface TrackLogoProps {
  variant?: "light" | "dark";
  className?: string;
}

const TrackLogo = ({ variant = "dark", className = "" }: TrackLogoProps) => {
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  
  return (
    <Link to="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <span className={`text-xl font-bold tracking-tight ${textColor}`}>TRACK</span>
    </Link>
  );
};

export default TrackLogo;
