"use client";
import Header, { ResearchList } from "@/app/components/researches";
import ViewResearch from "@/app/components/toggles/viewResearch";
import { useState } from "react";

export default function Researches(){
  const [setupResearchId, setSetupResearchId] = useState<string | null>(null);

  const handleResearchViewClick = (ResearchId: string) => {
    setSetupResearchId(ResearchId); // Set the ID for the setup form
  };

  const closeResearchView = () => {
    setSetupResearchId(null); // Close the setup product form
  };

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