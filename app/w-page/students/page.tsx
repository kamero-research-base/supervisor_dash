"use client";
import Header, { StudentList } from "@/app/components/students";
import AddStudent from "@/app/components/toggles/addStudent";
import { useState } from "react";

export default function Students(){
  const [showAddStudent, setShowAddStudent] = useState(false);

  const toggleAddStudent = () => {
    setShowAddStudent(true);
  }
  const closeAddStudent = () => {
    setShowAddStudent(false);
  }
  return (
    <>
    <Header onAddStudentClick={toggleAddStudent}/>
    <StudentList />
    {showAddStudent && (
      <AddStudent onClose={closeAddStudent} />
    )}
    </>
  );
}