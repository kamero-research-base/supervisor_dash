"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);


  const showSideBar = () => {
    setIsOpen(!isOpen);
  }
 const closeSideBar = () => {
  setIsOpen(false);
 }

  return (
    <>
     
    </>
  );
}
export default App;