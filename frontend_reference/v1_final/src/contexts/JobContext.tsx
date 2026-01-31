import { createContext, useContext, useState, ReactNode } from "react";

export interface JobListing {
  id: number;
  company: string;
  position: string;
  location: string;
  industry: string;
  scale: "대기업" | "중견기업" | "중소기업" | "스타트업";
  status: "Not applied" | "Applied";
  url: string;
  deadline: string;
}

export interface Application {
  id: number;
  company: string;
  position: string;
  stage: string;
  progress: number;
  deadline: Date | null;
  appliedAt: Date;
  status: "active" | "reviewing" | "rejected";
  url?: string;
}

// Activity tracking for auto-check routines
export interface ActivityTracking {
  hasAddedTimeBlock: boolean;
  hasAddedNewsScrap: boolean;
  hasAddedJobListing: boolean;
}

const initialListings: JobListing[] = [
  {
    id: 1,
    company: "진학사",
    position: "DA",
    location: "서울(종로)",
    industry: "교육",
    scale: "중소기업",
    status: "Not applied",
    url: "https://www.catch.co.kr/NCS/RecruitInfoDetails/534820",
    deadline: "01/19/2026",
  },
  {
    id: 2,
    company: "블록스퀘어랩스",
    position: "DA",
    location: "서울(송파)",
    industry: "금융,은행",
    scale: "중소기업",
    status: "Not applied",
    url: "https://www.jobkorea.co.kr/Recruit/GI_Read/48302525",
    deadline: "01/25/2026",
  },
  {
    id: 3,
    company: "채널코퍼레이션",
    position: "DA(인턴)",
    location: "서울(강남)",
    industry: "IT",
    scale: "스타트업",
    status: "Not applied",
    url: "https://www.wanted.co.kr/wd/331341",
    deadline: "",
  },
  {
    id: 4,
    company: "페이타랩",
    position: "DA",
    location: "서울, 부산",
    industry: "서비스(호텔,외식,여행,식품 등)",
    scale: "스타트업",
    status: "Not applied",
    url: "https://www.wanted.co.kr/wd/249290",
    deadline: "",
  },
  {
    id: 5,
    company: "Q 클래스 101",
    position: "DA(인턴)",
    location: "서울(강남)",
    industry: "교육",
    scale: "스타트업",
    status: "Not applied",
    url: "https://www.wanted.co.kr/wd/330552",
    deadline: "",
  },
];

const initialApplications: Application[] = [
  { id: 1, company: "네이버", position: "서비스 기획 (Junior)", stage: "서류 접수", progress: 10, deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: "active" },
  { id: 2, company: "카카오", position: "비즈니스 플랫폼 운영", stage: "서류 접수", progress: 10, deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: "active" },
  { id: 3, company: "LG에너지솔루션", position: "해외 영업", stage: "서류 접수", progress: 10, deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: "active" },
  { id: 4, company: "SK텔레콤", position: "마케팅 전략", stage: "1차면접 합격", progress: 50, deadline: null, appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: "reviewing" },
];

interface JobContextType {
  listings: JobListing[];
  applications: Application[];
  activities: ActivityTracking;
  setListings: React.Dispatch<React.SetStateAction<JobListing[]>>;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  moveToApplications: (listing: JobListing) => void;
  markTimeBlockAdded: () => void;
  markNewsScrapAdded: () => void;
  markJobListingAdded: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<JobListing[]>(initialListings);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activities, setActivities] = useState<ActivityTracking>({
    hasAddedTimeBlock: false,
    hasAddedNewsScrap: false,
    hasAddedJobListing: false,
  });

  const moveToApplications = (listing: JobListing) => {
    // Remove from listings
    setListings((prev) => prev.filter((item) => item.id !== listing.id));

    // Parse deadline string to Date
    let deadlineDate: Date | null = null;
    if (listing.deadline) {
      const [month, day, year] = listing.deadline.split("/");
      deadlineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Add to applications
    const newApplication: Application = {
      id: Date.now(),
      company: listing.company,
      position: listing.position,
      stage: "서류 접수",
      progress: 10,
      deadline: deadlineDate,
      appliedAt: new Date(),
      status: deadlineDate ? "active" : "reviewing",
      url: listing.url,
    };

    setApplications((prev) => [...prev, newApplication]);
  };

  const markTimeBlockAdded = () => {
    setActivities((prev) => ({ ...prev, hasAddedTimeBlock: true }));
  };

  const markNewsScrapAdded = () => {
    setActivities((prev) => ({ ...prev, hasAddedNewsScrap: true }));
  };

  const markJobListingAdded = () => {
    setActivities((prev) => ({ ...prev, hasAddedJobListing: true }));
  };

  return (
    <JobContext.Provider
      value={{
        listings,
        applications,
        activities,
        setListings,
        setApplications,
        moveToApplications,
        markTimeBlockAdded,
        markNewsScrapAdded,
        markJobListingAdded,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobContext must be used within a JobProvider");
  }
  return context;
};
