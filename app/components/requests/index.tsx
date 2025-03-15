"use client";

import { useEffect, useState } from "react";
import AlertNotification from "../app/notify";

interface Request {
  id: number;
  status: string;
  title: string;
  first_name: string;
  last_name: string;
  content: string;
  created_at: string;
  hashed_id: string;
};

interface RequestListProprs{
  onRequestView: (requestId: string) => void;
};


const buttons = [
  {"id":1, "name": ""},
  {"id":2, "name": "Pending"},
  {"id":3, "name": "Approved"},
  {"id":4, "name": "Rejected"},
];

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds}`;
}

const RequestList = ({onRequestView}: RequestListProprs) => {
  const [activeId, setActiveId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] =useState("");


  
    // Function to clear messages after a few seconds
    useEffect(() => {
      if (error || success) {
        const timer = setTimeout(() => {
          setError(null);
          setSuccess(null);
        }, 10000); // Hide after 4 seconds
        return () => clearTimeout(timer);
      }
    }, [error, success]);


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

  const handleActivity = async (id: any, action: string) => {
    setLoading(true);

    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    if (!userSession || !userSession.id) {
        setError("User session is missing. Please log in again.");
        setLoading(false);
        return;
    }

    const session_id = userSession.id;

    const response = await fetch(`/api/requests/${action}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ change_id: id, supervisor_id: session_id }),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (err) {
            setError(`Failed to ${action}. ${err}`);
            return;
        }
        setLoading(false);
        setError(errorData.message || "Failed to "+action);
        return;
    }

    const result= await response.json();
    setSuccess(`${result.message}`);
};

   // Fetch Researches
    useEffect(() => {
      const userSession = JSON.parse(localStorage.getItem('studentSession') || '{}');
      let session_id = "";
      if(userSession && userSession.id){
        session_id = userSession.id;
      }
      const fetchResearches = async () => {
        try {
          const response = await fetch(`/api/requests?sort=${sort}&search=${search}&filter=${filter}&department_id=${2}`);
          if (!response.ok) throw new Error("Failed to fetch researches");
          const data = await response.json();
          setRequests(data);
          console.log(data)
        } catch (error) {
          setError("An error occurred while fetching researches.");
        }
      };
      fetchResearches();
    }, [sort, filter, search]);

  return (
    <> 
      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
    <div className="border rounded-lg p-4 bg-white">
     
      <h4 className="text-slate-500 text-lg">Requests list</h4>


      <div className="flex justify-between my-1 items-center">
        <div className="flex items-center space-x-1 space-y-1">
          {buttons.map((btn) => (
            <button key={btn.id}  className={`${activeId === btn.id ? 'bg-slate-200 border-slate-400 ' : ''} px-2 py-1 capitalize border rounded-md text-slate-500 font-normal text-sm`} onClick={() => {handleActive(btn.id); handleFilter(btn.name)}}>{btn.name === "" ? 'All' : btn.name}</button>
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
      {requests.length <= 0 ? (

<div className="w-full min-h-[30vh] flex items-center justify-center">
 <div className="flex flex-col justify-center items-center opacity-65">
   <div className="img w-[150px] h-[150px]">
    <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
   </div>
   <i>No requestes yet.</i>
 </div>
</div>
) : (
<>

      <table className="w-full mt-5">
        <thead className="space-x-2 border-t-2 border-b-2 border-slate-100 text-sm text-slate-400 p-2 text-left">
          <th className="py-2 px-2 font-normal"><input type="checkbox" name="" id="" /></th>
          <th className="py-2 px-2 font-normal">Status</th>
          <th className="py-2 px-2 font-normal">Title</th>
          <th className="py-2 px-2 font-normal">Content</th>
          <th className="py-2 px-2 font-normal">Student</th>
          <th className="py-2 px-2 font-normal">Date</th>
          <th className="py-2 px-2 font-normal">Actions</th>
        </thead>
        <tbody className="odd odd:bg-slate-500">
         {requests.map((request) => (
           <tr key={request.id} className="text-sm text-slate-800 border-b ">
            <td className="py-2 px-2"><input type="checkbox" name="selected" id="selected" value={request.id} className="text-slate-500"/></td>
            <td className="py-2 px-2 text-nowrap">
              <span className={`
                ${request.status === 'Published' || request.status === 'Completed' 
                  ? 'bg-green-100 text-green-600 border-green-300 '
                  : request.status === 'Pending' || request.status === 'On hold'
                  ? 'bg-yellow-100 text-yellow-600 border-yellow-300'
                  : request.status === 'Rejected' 
                  ? 'bg-amber-800 bg-opacity-30 text-amber-900 border-amber-800'
                  : request.status === 'Approved' 
                  ? 'bg-orange-100 text-orange-600 border-orange-300' 
                  :'bg-slate-100 text-slate-600 border-slate-300 '
                } rounded px-1 border`}>{request.status}</span></td>
            <td className="py-2 px-2">{request.title}</td>
            <td className="py-2 px-2">{request.content}</td>
            <td className="py-2 px-2">{request.first_name+" "+request.last_name}</td>
            <td className="py-2 px-2">{formatDate(request.created_at)}</td>
            <td className="py-2 px-2 text-center flex items-center relative">
              {request.status === "Pending" && (
               <button className="px-4 py-1 cursor-pointer  bg-amber-800 bg-opacity-30 text-amber-900 border-amber-800 hover:bg-gray-100 flex items-center" onClick={() =>handleActivity(request.id, "reject")}>{loading ? 'Rejecting...' : 'Reject'}</button>
              )}
              {request.status === "Pending" || request.status === "Rejected" && (
                <button className="px-4 py-1 cursor-pointer bg-orange-100 text-orange-600 border-orange-300 hover:bg-gray-100 flex items-center" onClick={() =>handleActivity(request.id, "approve")}>{loading ? 'Approving...' : 'Approve'}</button>
              )} 
              <i
                className="bi bi-three-dots cursor-pointer text-lg text-teal-500 border mx-1 border-slate-300 px-1 rounded"
                onClick={() => toggleDropdown(request.id)}
              ></i>
              {dropdownOpen === request.id && (
                <div className="absolute right-0 mt-14 mr-1 w-36 bg-white border rounded-md shadow-lg z-10">
                  <ul className="text-gray-700">
                    <li 
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        onRequestView(""+request.id);
                        toggleDropdown(request.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-info-circle mr-2 text-teal-500 hover:bg-slate-100"></i> Details
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
    </>
  );
}
export default RequestList;