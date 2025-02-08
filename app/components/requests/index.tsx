"use client";

import { useEffect, useState } from "react";

interface RequestHeaderProps{
  onAddRequestClick: () => void;
}


interface Request {
  id: number;
  status: string;
  content: string;
  request_type: string;
  created_at: string;
}



const buttons = [
  {"id":1, "name": "all"},
  {"id":3, "name": "rejected"},
  {"id":4, "name": "approved"},
  {"id":5, "name": "accepted"},
  {"id":6, "name": "on hold"},
];

const requests: Request[] = [
  {
    id: 1,
    status: "Pending",
    content: "Request for access to AI research data.",
    request_type: "Data Access",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    status: "Approved",
    content: "Permission to publish findings in an international journal.",
    request_type: "Publication",
    created_at: "2023-12-20T14:00:00Z",
  },
  {
    id: 3,
    status: "Rejected",
    content: "Funding request for a new research project on climate change.",
    request_type: "Funding",
    created_at: "2024-02-01T09:45:00Z",
  },
  {
    id: 4,
    status: "Pending",
    content: "Collaboration request for a multi-institution study.",
    request_type: "Collaboration",
    created_at: "2024-01-28T16:15:00Z",
  },
  {
    id: 5,
    status: "Completed",
    content: "Ethical review request for human subject research.",
    request_type: "Ethical Review",
    created_at: "2023-11-05T08:20:00Z",
  }
];


const RequestList = () => {
   const [activeId, setActiveId] = useState(1);
   const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
   const [Requests, setRequests] = useState<Request[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);

   const handleActive = (id: number) => {
    setActiveId(id);
   }

   const toggleDropdown = (id: number) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
   };

   const handleArchive = async (id: number) => {
    const response = await fetch(`/api/request/archive/${id}`, {
        method: 'GET',
    });

    if (!response.ok) {
      let errorData;
      try {
          errorData = await response.json(); // Try to parse JSON
      } catch (err) {
          // If parsing fails, handle it here
          setError("Failed to cancel Order: Server returned an error without JSON.");
          return;
      }
      
      setError(errorData.message || "Failed to cancel Order");
      return;
  }

    // Update the Orders list to remove the archived Order or update its status
    setRequests((prevOrders) => 
        prevOrders.map(Request => 
            Request.id === id ? { ...Request, status: 'Archived' } : Request
        )
    );
};
const handleApprove = async (id: number) => {
  const response = await fetch(`/api/request/approve/${id}`, {
      method: 'GET',
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

  // Update the Orders list to set the approved status
  setRequests((prevRequests) => 
      prevRequests.map(Request => 
          Request.id === id ? { ...Request, status: 'Approved' } : Request
      )
  );
};

const handleDelete = async (id: number) => {
  const response = await fetch(`/api/request/delete/${id}`, {
      method: 'DELETE',
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

  // Update the Orders list to remove the deleted Order
  setRequests((prevRequests) => 
      prevRequests.filter(Request => Request.id !== id)
  );
};
 useEffect(() => {
  setRequests(requests);
 }, [])
  return (
    <div className="border rounded-lg p-4 bg-white">

      <h4 className="text-slate-500 text-lg">Requests list</h4>
      {Requests.length <= 0 ? (

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
      <div className="flex justify-between my-1 items-center">
        <div className="flex items-center space-x-1 space-y-1">
          {buttons.map((btn) => (
            <button key={btn.id} className={`${activeId === btn.id ? 'bg-slate-200 border-slate-400 ' : ''} px-2 py-1 capitalize border rounded-md text-slate-500 font-normal text-sm`} onClick={() => handleActive(btn.id)}>{btn.name}</button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <i className="bi bi-funnel text-sm border px-2 py-1 rounded-md text-slate-500 cursor-pointer border-slate-300"></i>
          <div className="border py-1 px-2 bg-white rounded-md flex items-center">
            <i className="bi bi-quest text-slate-400"></i>
            <input type="quest" name="quest" id="quest" placeholder="quest ..." className="bg-transparent outline-none w-[15vw] px-3 text-sm"/>
          </div>
        </div>
      </div>

      <table className="w-full mt-5">
        <thead className="space-x-2 border-t-2 border-b-2 border-slate-100 text-sm text-slate-400 p-2 text-left">
          <th className="py-2 px-2 font-normal"><input type="checkbox" name="" id="" /></th>
          <th className="py-2 px-2 font-normal">Status</th>
          <th className="py-2 px-2 font-normal">Content</th>
          <th className="py-2 px-2 font-normal">Request type</th>
          <th className="py-2 px-2 font-normal">Date</th>
          <th className="py-2 px-2 font-normal">Actions</th>
        </thead>
        <tbody className="odd odd:bg-slate-500">
         {Requests.map((request) => (
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
            <td className="py-2 px-2">{request.content}</td>
            <td className="py-2 px-2">{request.request_type}</td>
            <td className="py-2 px-2">{request.created_at}</td>
            <td className="py-2 px-6 text-center relative">
              <i
                className="bi bi-three-dots cursor-pointer text-xl"
                onClick={() => toggleDropdown(request.id)}
              ></i>
              {dropdownOpen === request.id && (
                <div className="absolute right-0 mt-1 mr-1 w-36 bg-white border rounded-md shadow-lg z-10">
                  <ul className="py-1 text-gray-700">
                    <li 
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        toggleDropdown(request.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-eye mr-2 text-green-500 hover:bg-slate-100"></i> Approve
                    </li>
                                       
                    <li
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        handleArchive(request.id); // Archive the Order
                        toggleDropdown(request.id); // Close the dropdown
                      }}
                    >
                      <i className="bi bi-archive-fill mr-2 text-orange-500 hover:bg-slate-100"></i> Reject
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
export default RequestList;