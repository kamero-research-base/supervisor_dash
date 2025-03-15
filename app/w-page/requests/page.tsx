"use client";
import RequestList from "@/app/components/requests";
import ViewRequest from "@/app/components/toggles/viewRequest";
import { useState } from "react";

export default function Requests(){
    const [setupRequestId, setSetupRequestId] = useState<string | null>(null);
  
  const handleRequestViewClick = (RequestId: string) => {
    setSetupRequestId(RequestId); // Set the ID for the setup form
  };

  const closeRequestView = () => {
    setSetupRequestId(null); // Close the setup product form
  };

  return (
    <>
    <RequestList onRequestView={handleRequestViewClick}/>
    {setupRequestId !== null && (
      <ViewRequest RequestId={setupRequestId} onClose={closeRequestView} />
    )}
    </>
  );
}