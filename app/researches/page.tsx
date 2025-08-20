"use client";
import Header, { ResearchList } from "@/app/components/researches";
import AddResearch from "@/app/components/toggles/addResearch";
import ViewResearch from "@/app/components/toggles/viewResearch";
import { useState } from "react";

export default function Researches(){
  const [showAddResearch, setShowAddResearch] = useState(false);
  const [setupResearchId, setSetupResearchId] = useState<string | null>(null);


  const toggleAddResearch = () => {
    setShowAddResearch(true);
  }
  const closeAddResearch = () => {
    setShowAddResearch(false);
  }

  const handleResearchViewClick = (ResearchId: string) => {
    setSetupResearchId(ResearchId); // Set the ID for the setup form
  };

  const closeResearchView = () => {
    setSetupResearchId(null); // Close the setup product form
  };

  return (
    <>
    <Header onAddResearchClick={toggleAddResearch}/>
    <ResearchList />
    {showAddResearch && (
      <AddResearch onClose={closeAddResearch} />
    )}

    {setupResearchId !== null && (
      <ViewResearch ResearchId={setupResearchId} onClose={closeResearchView} />
    )}
    </>
  );
}