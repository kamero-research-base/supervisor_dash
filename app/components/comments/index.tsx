"use client";

import { useEffect, useState } from "react";

interface CommentHeaderProps{
  onAddCommentClick: () => void;
}


interface Comment {
  id: number;
  status: string;
  comment: string;
  sender: string;
  replies: string[];
  research_id: string;
  updated_at: string;
  created_at: string;
}

interface CommentListProprs{
  onCommentView: (CommentId: number) => void;
}


const comments: Comment[] = [
  {
    id: 1,
    status: "Visible",
    comment: "This research provides valuable insights into AI applications.",
    sender: "John Doe",
    replies: [
      "I agree! The case studies were very informative.",
      "Could you elaborate on the ethical concerns discussed?",
    ],
    research_id: "1",
    updated_at: "2024-01-20T12:30:00Z",
    created_at: "2024-01-18T09:15:00Z",
  },
  {
    id: 2,
    status: "Hidden",
    comment: "There are some inconsistencies in the data analysis.",
    sender: "Dr. Alice Kayitesi",
    replies: ["Can you specify which sections need clarification?"],
    research_id: "2",
    updated_at: "2024-02-02T14:45:00Z",
    created_at: "2024-02-01T10:10:00Z",
  },
  {
    id: 3,
    status: "Visible",
    comment: "This study on climate change is very well-structured.",
    sender: "Samuel Nkurunziza",
    replies: [
      "Thanks! We are working on adding more recent data.",
      "Will there be a follow-up study next year?",
    ],
    research_id: "5",
    updated_at: "2023-08-15T11:50:00Z",
    created_at: "2023-08-12T08:30:00Z",
  },
  {
    id: 4,
    status: "Pending Review",
    comment: "How reliable are the sources cited in this paper?",
    sender: "Fatima Mugisha",
    replies: [],
    research_id: "3",
    updated_at: "2023-11-10T17:20:00Z",
    created_at: "2023-11-09T15:40:00Z",
  },
  {
    id: 5,
    status: "Visible",
    comment: "This research could benefit from more case studies.",
    sender: "Jean Habimana",
    replies: [
      "Good point! We are considering adding additional examples.",
      "Are there specific case studies you'd recommend?",
    ],
    research_id: "4",
    updated_at: "2022-09-05T16:30:00Z",
    created_at: "2022-09-02T13:20:00Z",
  }
];



const buttons = [
  {"id":1, "name": "all"},
  {"id":3, "name": "rejected"},
  {"id":4, "name": "on hold"},
  {"id":5, "name": "under review"},
  {"id":7, "name": "published"},
  {"id":8, "name": "draft"},
];



const CommentList = () => {
   const [activeId, setActiveId] = useState(1);
   const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
   const [Comments, setComments] = useState<Comment[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);

 useEffect(() => {
  setComments(comments);
 }, []);

  return (
    <div className="border rounded-lg p-4 bg-white">

     
      {Comments.length <= 0 ? (

<div className="w-full min-h-[30vh] flex items-center justify-center">
 <div className="flex flex-col justify-center items-center opacity-65">
   <div className="img w-[150px] h-[150px]">
    <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
   </div>
   <i>No Commentes yet.</i>
 </div>
</div>
) : (
<>
      <div className="flex justify-between my-1 items-center border-b pb-3">
        <h4 className="text-slate-500 text-lg">Comments</h4>
      
        <div className="flex items-center space-x-2">
          <i className="bi bi-funnel text-sm border px-2 py-1 rounded-md text-slate-500 cursor-pointer border-slate-300"></i>
          <div className="border py-1 px-2 bg-white rounded-md flex items-center">
            <i className="bi bi-search text-slate-400"></i>
            <input type="search" name="search" id="search" placeholder="Search ..." className="bg-transparent outline-none w-[15vw] px-3 text-sm"/>
          </div>
        </div>
      </div>
         
      <div className="container">
        <div className="w-full py-1 px-3">
          <div className="flex items-center justify-between">
            <button className="border border-teal-300 py-1 px-5 text-sm rounded">Previous</button>
            <button className="border border-teal-300 py-1 px-5 text-sm rounded">Next</button>
          </div>
          <div className="flex items-center px-1 py-3 space-x-2 ">
            <h4 className="text-sm text-slate-500">Research: </h4>
            <div className="font-medium text-lg">The Impact of AI on Modern Education</div>
          </div>
        </div>
        {/** comments */}
        <div className="w-full p-2">

          <div className="comments space-y-2">
          {Comments.map((comment) => (
            <div key={comment.id} className="comment  border py-2 px-4 rounded-md">
              <div className="flex items-center spaxe-x-2 text-sm">
                <div className="flex justify-center items-center w-9 h-9 rounded-full border border-slate-300 p-1">
                  <i className="bi bi-person text-xl text-slate-500"></i>
                </div> 
                <h1 className="font-medium text-slate-500 mx-2">{comment.sender}</h1>
                <div className="date text-xs text-slate-300">
                  . {comment.created_at}
                </div>
              </div>
              <div className="text-base text-slate-600 p-2">
                <div className="block">
                  <span>
                    {comment.comment}
                  </span> 
                  {comment.replies.map((reply, index) => (
                     <div key={index} className="w-max border-l border-teal-600 py-2 px-5 ml-10 bg-slate-100 my-2">
                      {reply}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end px-5">
                  <button className="text-xs text-teal-500">Reply</button>
                </div>
              </div>
            </div>
            ))}
            

          </div>
        </div>
      </div>
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
export default CommentList;