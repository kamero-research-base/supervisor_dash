import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TopBarProps {
    page: String
}
interface Session{
  id: string;
  name: string;
  session_id: string;
  profile: string;
}

const TopBar = ({page}: TopBarProps) => {

    const [sessionData, setSessionData] = useState<Session | null>(null);
    const router = useRouter();

    useEffect(() => {
         const loadUserSession = () => {
            const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
            if (userSession && userSession.name) {
              setSessionData(userSession);
             // alert(userSession.school_id)
            }
          };
     loadUserSession();
   }, []);
    return (
       <div className="w-full flex justify-between items-center transition-transform duration-300 ease-in-out">
         <h1 className="text-2xl ">{page}</h1>
         <div className="flex">
            <div className="flex mx-7 py-2 border rounded-full w-10 h-10 items-center justify-center">
                <i className="bi bi-bell text-xl text-slate-500"></i>
                <span className="bg-red-500 w-2 h-2 rounded-full absolute ml-3 mt-[-12px]"></span>
            </div>
            <div className="flex mr-7 py-2 border rounded-full w-10 h-10 items-center justify-center">
                <i className="bi bi-chat-dots text-xl text-slate-500"></i>
                <span className="bg-red-500 w-2 h-2 rounded-full absolute ml-4 mt-[-10px]"></span>
            </div>
            <div className="flex mr-3 p-1 border rounded-full w-10 h-10 items-center justify-center">
                {sessionData?.profile ? (
                    <img src={sessionData.profile} alt="" className="w-full h-full object-cover rounded-full"/>
                ): (
                    <i className="bi bi-person text-xl text-slate-500"></i>
                )}
                
            </div>
         </div>
       </div>
       
    );
}
export default TopBar;