// app/students/page.tsx

"use client";

import Header, { StudentList } from "@/app/components/students";

export default function Students() {
  return (
    <>
      <Header />
      <StudentList />
    </>
  );
}