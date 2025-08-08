// app/students/page.tsx

"use client";

import Header, { StudentList } from "@/app/components/students";
import AddStudent from "@/app/components/toggles/addStudent";
import { useState } from "react";

export default function Students() {
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleAddStudent = () => {
    setShowAddStudent(true);
  };

  const closeAddStudent = () => {
    setShowAddStudent(false);
    setRefreshKey(prev => prev + 1);
  };

  // No need for a separate handleStudentAdded function
  // We will pass closeAddStudent directly to the onStudentAdded prop

  return (
    <>
      <Header onAddStudentClick={toggleAddStudent} key={`header-${refreshKey}`} />
      <StudentList key={`list-${refreshKey}`} />
      {showAddStudent && (
        <AddStudent 
          onClose={closeAddStudent} 
          // Passing the same function to refresh the list on success
          onStudentAdded={closeAddStudent} 
        />
      )}
    </>
  );
}