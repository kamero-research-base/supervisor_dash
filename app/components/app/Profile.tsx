"use client";
import Link from "next/link";
import { useState } from "react";

interface ProfileProps {
  menuCollapsed: boolean;
  toggleMenu: () => void;
}

const Profile = ({ menuCollapsed, toggleMenu }: ProfileProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  return (
    <>
      <div className={`flex items-center justify-between  ${menuCollapsed ? 'flex-col py-1 mb-1 mx-1' : 'py-1 mb-2 mx-2'}`}>
        <div className="flex items-center">
          <div className="w-[30px] h-[30px] rounded-full mx-1 transition-all duration-300 ease-in-out hover:scale-110">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h4 className={`text-teal-200  ml-1 text-base font-medium transition-all duration-300 ${menuCollapsed ? 'hidden' : ''}`}>
            KRB SUPERVISOR
          </h4>
        </div>
        <i className="bi bi-list text-xl cursor-pointer text-gray-500 hover:text-gray-300" onClick={toggleMenu}></i>
      </div>
    </>
  );
};

export default Profile;
