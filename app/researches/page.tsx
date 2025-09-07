"use client";
import Header, { ResearchList, SkeletonLoader } from "@/app/components/researches";
import ViewResearch from "@/app/components/toggles/viewResearch";
import { useState, useEffect } from "react";

export default function Researches(){
  const [setupResearchId, setSetupResearchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleResearchViewClick = (ResearchId: string) => {
    setSetupResearchId(ResearchId); // Set the ID for the setup form
  };

  const closeResearchView = () => {
    setSetupResearchId(null); // Close the setup product form
  };

  // Simulate initial loading time for both components to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Give time for both components to fetch their data

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <>
    <Header />
    <ResearchList />

    {setupResearchId !== null && (
      <ViewResearch ResearchId={setupResearchId} onClose={closeResearchView} />
    )}
    </>
  );
}