"use client";
import Header, { DepartmentList } from "@/app/components/departments";
import AddDepartment from "@/app/components/toggles/addDepartment";
import { useState } from "react";

export default function Departments(){
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const toggleAddDepartment = () => {
    setShowAddDepartment(true);
  }
  const closeAddDepartment = () => {
    setShowAddDepartment(false);
  }
  return (
    <>
    <Header onAddDepartmentClick={toggleAddDepartment}/>
    <DepartmentList />
    {showAddDepartment && (
      <AddDepartment onClose={closeAddDepartment} />
    )}
    </>
  );
}