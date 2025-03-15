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
          <div className="w-[40px] h-[40px] rounded-full mx-1 transition-all duration-300 ease-in-out hover:scale-110">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h4 className={`text-teal-400 uppercase  ml-1 text-lg font-medium transition-all duration-300 ${menuCollapsed ? 'hidden' : ''}`}>
            Supervisor
          </h4>
        </div>
        <i className={`bi bi-${menuCollapsed ? 'arrows-fullscreen' : 'arrows-angle-contract'} text-xl cursor-pointer text-gray-200 hover:text-gray-100`} onClick={toggleMenu}></i>
      </div>
    </>
  );
};

export default Profile;
