import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JobProvider } from "./contexts/JobContext";
import { useDashboardStore } from "./stores/dashboardStore";
import Index from "./pages/Index";
import Preview from "./pages/Preview";
import Dashboard from "./pages/Dashboard";
import TimeManagement from "./pages/TimeManagement";
import NewsScrap from "./pages/NewsScrap";
import Applications from "./pages/Applications";
import JobListings from "./pages/JobListings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const preloadData = useDashboardStore(state => state.preloadData);

  // Preload all dashboard data on mount
  useEffect(() => {
    preloadData();
  }, [preloadData]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <JobProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/preview" element={<Preview />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/time" element={<TimeManagement />} />
              <Route path="/news" element={<NewsScrap />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/job-listings" element={<JobListings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </JobProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
