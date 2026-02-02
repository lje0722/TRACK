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

// Activity tracking for all routines (both self-check and auto-check)
export interface ActivityTracking {
  // Self-check routines
  hasCompletedWakeUp: boolean;
  hasCompletedExercise: boolean;
  // Auto-check routines
  hasAddedTimeBlock: boolean;
  hasAddedNewsScrap: boolean;
  hasAddedJobListing: boolean;
}

const initialListings: JobListing[] = [];

const initialApplications: Application[] = [];

interface JobContextType {
  listings: JobListing[];
  applications: Application[];
  activities: ActivityTracking;
  setListings: React.Dispatch<React.SetStateAction<JobListing[]>>;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  moveToApplications: (listing: JobListing) => void;
  toggleWakeUp: () => void;
  toggleExercise: () => void;
  markTimeBlockAdded: () => void;
  markNewsScrapAdded: () => void;
  markJobListingAdded: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<JobListing[]>(initialListings);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activities, setActivities] = useState<ActivityTracking>({
    hasCompletedWakeUp: false,
    hasCompletedExercise: false,
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

  const toggleWakeUp = () => {
    setActivities((prev) => ({ ...prev, hasCompletedWakeUp: !prev.hasCompletedWakeUp }));
  };

  const toggleExercise = () => {
    setActivities((prev) => ({ ...prev, hasCompletedExercise: !prev.hasCompletedExercise }));
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
        toggleWakeUp,
        toggleExercise,
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
