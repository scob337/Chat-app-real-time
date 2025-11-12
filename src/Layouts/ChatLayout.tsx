import { Outlet, useNavigate } from 'react-router-dom'
import Aside from '../Components/Aside/Aside'
import { useEffect } from 'react';

const ChatLayout = () => {
const navigate = useNavigate();

useEffect(() => {
      const user = localStorage.getItem("user")

    if (!user) {
        navigate('/login');
    }
}, [navigate]);

  return (
    <div className="flex h-[100vh] overflow-hidden bg-gray-100">
      <Aside/>
      
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Outlet/>
      </div>
    </div>
  )
}

export default ChatLayout
