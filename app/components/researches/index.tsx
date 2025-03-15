"use client";

import { useEffect, useState } from "react";

interface ResearchHeaderProps{
  onAddResearchClick: () => void;
}


interface Research {
  id: number;
  status: string;
  title: string;
  researcher: string;
  year: string;
  progress_status: string;//ie. ongoing, completed
  created_at: string;
  hashed_id: string;
}

interface Analytics {
  total_researches: number,
  pending_researches: number,
  total_rejected: number,
  total_onhold: number,
  total_published: number,
  total_downloads: number,
  percentage_change: {
    total_researches: number,
    pending_researches: number | 0,
    total_rejected: number,
    total_onhold: number | 0,
    total_published: number,
    total_downloads: number,
  }
}

interface ResearchListProprs{
  onResearchView: (researchId: string) => void;
}



const Header = ({onAddResearchClick}: ResearchHeaderProps) => {
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null);


  

  // Fetch Researches
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    let department_id = "";
    if(userSession && userSession.department_id){
      department_id = userSession.department_id;
    }
    const fetchResearches = async () => {
      try {
        const response = await fetch(`/api/analytics/researches`, { 
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ department_id: department_id }),});
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.log("An error occurred while fetching researches.");
      }
    };
    fetchResearches();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-gray-600">Research Materials</h1>
        <div className="flex items-center px-2 cursor-pointer">
          <div className="flex justify-center border rounded-md py-1 px-3 mx-3" title="Download research summary">
            <i className="bi bi-download"></i>
          </div>
          <div onClick={onAddResearchClick} className="flex border rounded-md py-1 px-3 bg-teal-600 text-white cursor-pointer" >
            <i className="bi bi-plus-circle mr-2"></i>
            <span>Add research</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center my-3 space-x-2">
        
        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-search text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Total researches</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-2 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_researches} </div>
            <div className={`mx-1 ${Number(analytics?.percentage_change.total_researches) > 0 ? 'bg-teal-200 text-teal-600 border-teal-300' : 'bg-red-100 text-red-500 border-red-200'} px-[2px] text-xs border  rounded text-center`}>
              <i className="bi bi-caret-up-fill mr-[2px] text-xs"></i> {analytics?.percentage_change.total_researches}%
            </div>
            <div className="text-xs text-slate-400 mx-[2px]"> from last month</div>
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-search text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Downloads</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-2 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_downloads} </div>
            <div className={`mx-1 ${Number(analytics?.percentage_change.total_downloads) > 0 ? 'bg-teal-200 text-teal-600 border-teal-300' : 'bg-red-100 text-red-500 border-red-200'} px-[2px] text-xs border  rounded text-center`}><i className="bi bi-caret-up-fill mr-[2px] text-xs"></i> {analytics?.percentage_change.total_downloads}%</div>
            <div className="text-xs text-slate-400 mx-[2px]"> from last month</div>
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-search text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Pending</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-2 flex items-center">
            <div className="text-3xl text-slate-600"> {(Number(analytics?.total_onhold) + Number(analytics?.pending_researches))} </div>
            <div className={`mx-1 ${(Number(analytics?.percentage_change.total_onhold) + Number(analytics?.percentage_change.pending_researches)) > 0 ? 'bg-teal-200 text-teal-600 border-teal-300' : 'bg-red-100 text-red-500 border-red-200'} px-[2px] text-xs border  rounded text-center`}>
              <i className="bi bi-caret-up-fill mr-[2px] text-xs"></i> {Number(analytics?.percentage_change.total_onhold) + Number(analytics?.percentage_change.pending_researches)}%
            </div>
            <div className="text-xs text-slate-400 mx-[2px]"> from last month</div>
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-search text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Total published</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-2 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_published} </div>
            <div className={`mx-1 ${Number(analytics?.percentage_change.total_published) > 0 ? 'bg-teal-200 text-teal-600 border-teal-300' : 'bg-red-100 text-red-500 border-red-200'} px-[2px] text-xs border  rounded text-center`}>
              <i className="bi bi-caret-down-fill mr-[2px] text-xs"></i> {analytics?.percentage_change.total_published}%
            </div>
            <div className="text-xs text-slate-400 mx-[2px]"> from last month</div>
          </div>
        </div>

        <div className="border rounded-lg w-full bg-white">
          <div className="flex p-4 justify-between items-center py-2 border-b">
            <h4>
              <i className="bi bi-search text-sm border border-teal-300 px-1 py-[2px] bg-teal-100 text-teal-600 rounded-md mr-3"></i>
              <span className="font-normal">Total rejection</span>
            </h4>
            <i className="bi bi-three-dots"></i>
          </div>
          <div className="p-2 flex items-center">
            <div className="text-3xl text-slate-600"> {analytics?.total_rejected} </div>
            <div className={`mx-1 ${Number(analytics?.percentage_change.total_rejected) > 0 ? 'bg-teal-200 text-teal-600 border-teal-300' : 'bg-red-100 text-red-500 border-red-200'} px-[2px] text-xs border  rounded text-center`}>
              <i className="bi bi-caret-down-fill mr-[2px] text-xs"></i> {analytics?.percentage_change.total_rejected}%
            </div>
            <div className="text-xs text-slate-400 mx-[2px]"> from last month</div>
          </div>
        </div>


      </div>
    </div>
  );
}

const buttons = [
  {"id":1, "name": ""},
  {"id":3, "name": "Rejected"},
  {"id":4, "name": "On hold"},
  {"id":5, "name": "Under review"},
  {"id":7, "name": "Published"},
  {"id":8, "name": "Draft"},
  {"id":9, "name": "Pending"},
];

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

const ResearchesList = ({onResearchView}: ResearchListProprs) => {
   const [activeId, setActiveId] = useState(1);
   const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
   const [Researches, setResearches] = useState<Research[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);
   const [sort, setSort] = useState("");
   const [search, setSearch] = useState("");
   const [filter, setFilter] =useState("");

   const handleActive = (id: number) => {
    setActiveId(id);
   }

   const toggleDropdown = (id: number) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
   };
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



  // Fetch Researches
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    let department_id = "";
    if(userSession && userSession.department_id){
      department_id = userSession.department_id;
    }
    const fetchResearches = async () => {
      try {
        const response = await fetch(`/api/research?sort=${sort}&search=${search}&filter=${filter}&department_id=${department_id}`);
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setResearches(data);
        console.log(data)
      } catch (error) {
        setError("An error occurred while fetching researches.");
      }
    };
    fetchResearches();
  }, [sort, filter, search]);

   
  return (
    <div className="border rounded-lg p-4 bg-white">

      <h4 className="text-slate-500 text-lg">Researches list</h4>


      <div className="flex justify-between my-1 items-center">
        <div className="flex items-center space-x-1 space-y-1">
          {buttons.map((btn) => (
            <button key={btn.id}  className={`${activeId === btn.id ? 'bg-slate-200 border-slate-400 ' : ''} px-2 py-1 capitalize border rounded-md text-slate-500 font-normal text-sm`} onClick={() => {handleActive(btn.id); handleFilter(btn.name)}}>{btn.name === "" ? 'All': btn.name}</button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <i className="bi bi-funnel text-sm border px-2 py-1 rounded-md text-slate-500 cursor-pointer border-slate-300"></i>
          <div className="border py-1 px-2 bg-white rounded-md flex items-center">
            <i className="bi bi-search text-slate-400"></i>
            <input type="search" name="search" id="search" onChange={handleSearch} placeholder="Search ..." className="bg-transparent outline-none w-[15vw] px-3 text-sm"/>
          </div>
        </div>
      </div>
      {Researches.length <= 0 ? (
<div className="w-full min-h-[30vh] flex items-center justify-center">
 <div className="flex flex-col justify-center items-center opacity-65">
   <div className="img w-[150px] h-[150px]">
    <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
   </div>
   <i>No researches yet.</i>
 </div>
</div>
) : ( <>
      <table className="w-full mt-5">
        <thead className="space-x-2 border-t-2 border-b-2 border-slate-100 text-sm text-slate-400 p-2 text-left">
          <th className="py-2 px-2 font-normal"><input type="checkbox" name="" id="" /></th>
          <th className="py-2 px-2 font-normal">Status</th>
          <th className="py-2 px-2 font-normal">Title</th>
          <th className="py-2 px-2 font-normal">Researcher</th>
          <th className="py-2 px-2 font-normal">Year</th>
          <th className="py-2 px-2 font-normal">Material Status</th>
          <th className="py-2 px-2 font-normal">Uploaded at</th>
          <th className="py-2 px-2 font-normal">Actions</th>
        </thead>
        <tbody className="odd odd:bg-slate-500">
         {Researches.map((research) => (
           <tr key={research.id} className="text-sm text-slate-800 border-b ">
            <td className="py-2 px-2"><input type="checkbox" name="selected" id="selected" value={research.id} className="text-slate-500"/></td>
            <td className="py-2 px-2 text-nowrap">
              <span className={`
                ${research.status === 'Published' || research.status === 'Approved' ? 'bg-green-100 text-green-600 border-green-300 '
                : research.status === 'Under review' || research.status === 'On hold' 
                ? 'bg-yellow-100 text-yellow-600 border-yellow-300' 
                : research.status === 'Rejected' 
                ? 'bg-amber-800 bg-opacity-30 text-amber-900 border-amber-800'
                : 'bg-slate-100 text-slate-600 border-slate-300 '
                } rounded px-1 border`}>{research.status}</span></td>
            <td className="py-2 px-2">{research.title}</td>
            <td className="py-2 px-2">{research.researcher}</td>
            <td className="py-2 px-2">{research.year}</td>
            <td className="py-2 px-2">{research.progress_status}</td>
            <td className="py-2 px-2">{timeAgo(research.created_at)}</td>
            <td className="py-2 px-6 text-center relative">
              <i
                className="bi bi-three-dots cursor-pointer text-xl"
                onClick={() => toggleDropdown(research.id)}
              ></i>
              {dropdownOpen === research.id && (
                <div className="absolute right-0 mt-1 mr-1 w-36 bg-white border rounded-md shadow-lg z-10">
                  <ul className="py-1 text-gray-700">
                    <li 
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        onResearchView(research.hashed_id); // Assign the Order
                        toggleDropdown(research.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-eye mr-2 text-teal-500 hover:bg-slate-100"></i> Review
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
export {ResearchesList};