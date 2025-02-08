"use client"
import Header, { DepartmentList } from "@/app/components/departments";
import AddDepartment from "@/app/components/toggles/addDepartment";
import { useState } from "react";

export default function Departments(){
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [setupDepartmentId, setSetupDepartmentId] = useState<number | null>(null);

  const toggleAddDepartment = () => {
    setShowAddDepartment(true);
  }
  const closeAddDepartment = () => {
    setShowAddDepartment(false);
  }
  const handleDepartmentViewClick = (DepartmentId: number) => {
    setSetupDepartmentId(DepartmentId); // Set the ID for the setup form
  };
  const closeDepartmentView = () => {
    setSetupDepartmentId(null); // Close the setup product form
  };
  return (
    <>
    <Header onAddDepartmentClick={toggleAddDepartment}/>
    <DepartmentList onDepartmentView={handleDepartmentViewClick} />
    {showAddDepartment && (
      <AddDepartment onClose={closeAddDepartment} />
    )}
    </>
  );
}