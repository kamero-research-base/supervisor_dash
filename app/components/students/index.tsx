"use client";

import { useEffect, useState } from "react";
interface StudentHeaderProps{
  onAddStudentClick: () => void;
}

interface Analytics{
  total_students: number;
  total_active: number;
  total_pending: number;
  total_unverified: number;
  total_inactive: number;
}
const Header = ({onAddStudentClick}: StudentHeaderProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    let school_id = "";
    if(userSession && userSession.school_id){
      school_id = userSession.school_id;
    }
    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/analytics/students`, { 
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ school_id: school_id }),});
                if (!response.ok) throw new Error("Failed to fetch Institutions");
                const data = await response.json();
                setAnalytics(data);
              } catch (error) {
                console.log("An error occurred while fetching Institutions.");
              }
            };
            fetchStudents();
          }, []);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-gray-600">Students</h1>
        <div className="flex items-center px-2 cursor-pointer">
          <div className="flex justify-center border rounded-md py-1 px-3 mx-3" title="Download Student summary">
            <i className="bi bi-download"></i>
          </div>
          <div onClick={onAddStudentClick} className="flex border rounded-md py-1 px-3 bg-teal-600 text-white cursor-pointer" >
            <i className="bi bi-plus-circle mr-2"></i>
            <span>Add Student</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center my-3 space-x-2">
        
        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-people text-sm border border-orange-300 px-1 py-[2px] bg-orange-100 text-orange-600 rounded-md mr-3"></i>
              <span className="font-normal">Total Students</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-4 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_students} </div>
            
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-people text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Total Active</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-4 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_active} </div>
            
          </div>
        </div>
        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-people text-sm border border-red-300 px-1 py-[2px] bg-red-100 text-red-600 rounded-md mr-3"></i>
              <span className="font-normal">Total unverified</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-4 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_unverified} </div>
            
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-people text-sm border border-gray-300 px-1 py-[2px] bg-gray-100 text-gray-600 rounded-md mr-3"></i>
              <span className="font-normal">Inactive</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-4 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_inactive} </div>
            
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-people text-sm border border-yellow-300 px-1 py-[2px] bg-yellow-100 text-yellow-600 rounded-md mr-3"></i>
              <span className="font-normal">Account request</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-4 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_pending}</div>
          </div>
        </div>

      </div>
    
    </div>
  );
}

const buttons = [
  {"id":1, "name": ""},
  {"id":2, "name": "Active"},
  {"id":3, "name": "Inactive"},
  {"id":4, "name": "Blocked"},
  {"id":5, "name": "Unverified"},
  {"id":6, "name": "Pending"},
]
interface Student{
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  institute: string;
  status: string;
  created_at: string;
  profile_picture: string;
  hashed_id: string;
}
const timeAgo = (createdDate: string): string => {
  const now = new Date();
  const created = new Date(createdDate);

  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffInSeconds < 60) {
      return `Now`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

const StudentList = () => {
     const [activeId, setActiveId] = useState(1);
     const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
     const [Students, setStudents] = useState<Student[]>([]);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
  
     const [sort, setSort] = useState("");
     const [search, setSearch] = useState("");
     const [filter, setFilter] =useState("");
  
     const handleActive = (id: number) => {
      setActiveId(id);
     }
  
     
  const handleSort = (text: string) => {
    setSort(text);
  }
  const handleFilter = (text: string) => {
    setFilter(text);
  }
  
   const handleSearch = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const { value } = e.target;
      setSearch((value));
    };
  
  
     const toggleDropdown = (id: number) => {
      setDropdownOpen(dropdownOpen === id ? null : id);
     };
  
  const handleApprove = async (id: number) => {
    const response = await fetch(`/api/students/approve`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });
  
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (err) {
            setError("Failed to approve Order: Server returned an error without JSON.");
            return;
        }
        
        setError(errorData.message || "Failed to approve Order");
        return;
    }
  
    // Update the Student list to set the approved status
    setStudents((prevStudents) => 
        prevStudents.map(Student => 
            Student.id === id ? { ...Student, status: 'Approved' } : Student
        )
    );
  };
  const handleBlock = async (id: number) => {
    const response = await fetch(`/api/students/block`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });
  
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (err) {
            setError("Failed to approve Order: Server returned an error without JSON.");
            return;
        }
        
        setError(errorData.message || "Failed to approve Order");
        return;
    }
  
    // Update the Student list to set the approved status
    setStudents((prevStudents) => 
        prevStudents.map(Student => 
            Student.id === id ? { ...Student, status: 'Locked' } : Student
        )
    );
  };
  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/students/delete`, {
        method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: id }),
    });
  
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (err) {
            setError("Failed to delete Order: Server returned an error without JSON.");
            return;
        }
        
        setError(errorData.message || "Failed to delete Order");
        return;
    }
  
    // Update the Student list to remove the deleted Order
    setStudents((prevStudents) => 
        prevStudents.filter(Student => Student.id !== id)
    );
  };
    // Fetch Students
    // Fetch Researches
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    let school_id = "";
    if(userSession && userSession.school_id){
      school_id = userSession.school_id;
    }
    const fetchResearches = async () => {
      try {
        const response = await fetch(`/api/students?sort=${sort}&search=${search}&filter=${filter}&school_id=${school_id}`);
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setStudents(data);
        console.log(data)
      } catch (error) {
        setError("An error occurred while fetching researches.");
      }
    };
    fetchResearches();
  }, [sort, filter, search]);

    
  return (
    <div className="border rounded-lg p-4 bg-white">

      <h4 className="text-slate-500 text-lg">Student list</h4>
      <div className="flex justify-between my-1 items-center">
        <div className="flex items-center space-x-1 space-y-1">
          {buttons.map((btn) => (
            <button key={btn.id} className={`${activeId === btn.id ? 'bg-slate-200 border-slate-400 ' : ''} px-2 py-1 capitalize border rounded-md text-slate-500 font-normal text-sm`} onClick={() => {handleActive(btn.id); handleFilter(btn.name)}}>{btn.name === "" ? 'All' : btn.name}</button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <i className="bi bi-funnel text-sm border px-2 py-1 rounded-md text-slate-500 cursor-pointer border-slate-300"></i>
          <div className="border py-1 px-2 bg-white rounded-md flex items-center">
            <i className="bi bi-search text-slate-400"></i>
            <input type="search" name="search" onChange={handleSearch} id="search" placeholder="Search ..." className="bg-transparent outline-none w-[15vw] px-3 text-sm"/>
          </div>
        </div>
      </div>
      {Students.length <= 0 ? (

<div className="w-full min-h-[30vh] flex items-center justify-center">
   <div className="flex flex-col justify-center items-center opacity-65">
     <div className="img w-[150px] h-[150px]">
        <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
     </div>
     <i>No Student yet.</i>
   </div>
</div>
) : (
<>
      <table className="w-full mt-5">
        <thead className="space-x-2 border-t-2 border-b-2 border-slate-100 text-sm text-slate-400 p-2 text-left">
          <th className="py-2 px-2 font-normal">Profile</th>
          <th className="py-2 px-2 font-normal">Status</th>
          <th className="py-2 px-2 font-normal">Name</th>
          <th className="py-2 px-2 font-normal">Email</th>
          <th className="py-2 px-2 font-normal">Institution</th>
          <th className="py-2 px-2 font-normal">Phone number</th>
          <th className="py-2 px-2 font-normal">Created at</th>
          <th className="py-2 px-2 font-normal">Actions</th>
        </thead>
        <tbody className="odd odd:bg-slate-500">
        {Students.map((Student) => (
          <tr key={Student.id} className="text-sm text-slate-800 border-b ">
            <td className="py-2 px-2">
              <div className="h-12 w-12 rounded-full border border-teal-400 p-1">
                <img src={Student.profile_picture} alt="profile" className="w-full h-full object-cover rounded-full"/>
              </div>
            </td>
            <td className="py-2 px-2"><span className={`${Student.status === 'Active' ? 'bg-green-100 text-green-600 border-green-300 ': Student.status === 'Pending' ? 'bg-yellow-100 text-yellow-600 border-yellow-300 ' : Student.status === 'Approved' ? 'bg-orange-100 text-orange-600 border-orange-300 ' : Student.status === 'Locked' ? 'bg-red-100 text-red-600 border-red-300 ' :'bg-slate-100 text-slate-600 border-slate-300 '} rounded px-1 border`}>{Student.status}</span></td>
            <td className="py-2 px-2">{Student.first_name+" "+Student.last_name}</td>
            <td className="py-2 px-2">{Student.email}</td>
            <td className="py-2 px-2">{Student.institute}</td>
            <td className="py-2 px-2">{Student.phone}</td>
            <td className="py-2 px-2">{timeAgo(Student.created_at)}</td>
            <td className="py-2 px-6 text-center relative">
              <i
                className="bi bi-three-dots cursor-pointer text-xl"
                onClick={() => toggleDropdown(Student.id)}
              ></i>
              {dropdownOpen === Student.id && (
                <div className="absolute right-0 mt-1 mr-1 w-36 bg-white border rounded-md shadow-lg z-10">
                  <ul className="py-1 text-gray-700">
                  
                    <li
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        handleApprove(Student.id); // approve for payment the Order
                        toggleDropdown(Student.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-check-circle-fill mr-2 text-orange-500 hover:bg-slate-100"></i> Approve
                    </li>
                    <li
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        handleBlock(Student.id); // approve for payment the Order
                        toggleDropdown(Student.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-check-circle-fill mr-2 text-orange-500 hover:bg-slate-100"></i> Lock
                    </li>
                    <li
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        handleDelete(Student.id); // Delete the Order
                        toggleDropdown(Student.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-trash mr-2 text-red-500 hover:bg-slate-100"></i> Delete
                    </li>
                  </ul>
                </div>
              )}
            </td>
          </tr>
          ))}
        </tbody>
       
      </table>
        <div className="flex space-x-1 my-2 justify-self-end text-slate-500">
          <button className="px-2 py-1 border border-slate-300 rounded-md text-sm">Previous</button>
          <button className="px-3 py-1 border border-red-500 bg-red-400 text-white rounded-md text-sm">1</button>
          <button className="px-3 py-1 border border-slate-300 rounded-md text-sm">2</button>
          <button className="px-2 py-1 border border-slate-300 rounded-md text-sm">Next</button>
        </div>
        </>
      )} 
    </div>
  );
}
export default Header;
export {StudentList};