import { useState, memo, useEffect } from "react"
import FriendsList from "./FriendsList"
import ChatsList from "./ChatsList"

import { IoHome, IoPerson, IoChatbubbles, IoMenu, IoClose } from "react-icons/io5";
import { FaUserGroup } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
import { FaSignOutAlt } from "react-icons/fa";
import { logout } from "../../utils/authService";

const Aside = memo(() => {
  const [activeSection, setActiveSection] = useState('chats')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setIsExpanded(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleLogout = () => {
    logout()
  }

  const renderContent = () => {
    switch(activeSection) {
      case 'chats':
        return <ChatsList />
      case 'friends':
        return <FriendsList />
      case 'groups':
        return <p className="p-4 text-gray-500 text-center">Coming soon..</p>
      case 'settings':
        return <p className="p-4 text-gray-500 text-center">Coming soon..</p>
      default:
        return <ChatsList />
    }
  }

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        >
          {isExpanded ? <IoClose className="text-xl" /> : <IoMenu className="text-xl" />}
        </button>
      )}

      <div className={`bg-white border-r border-gray-200 h-screen flex transition-all duration-300 ${
        isExpanded ? 'w-80 min-w-80' : 'w-16 min-w-16'
      } max-w-80 ${
        isMobile 
          ? `fixed ${isExpanded ? 'translate-x-0' : '-translate-x-64'} z-40` 
          : 'relative'
      }`}>
        <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Toggle sidebar"
            >
              <IoHome className="text-xl text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 py-4">
            <ul className="space-y-2 px-2">
              <li>
                <button
                  onClick={() => setActiveSection('chats')}
                  className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${
                    activeSection === 'chats' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title="المحادثات"
                >
                  <IoChatbubbles className="text-xl" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('friends')}
                  className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${
                    activeSection === 'friends' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title="الأصدقاء"
                >
                  <IoPerson className="text-xl" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('groups')}
                  className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${
                    activeSection === 'groups' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title="المجموعات"
                >
                  <FaUserGroup className="text-xl" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${
                    activeSection === 'settings' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title="الإعدادات"
                >
                  <IoIosSettings className="text-xl" />
                </button>
              </li>
            </ul>
          </nav>

          <div className="p-2 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
              title="تسجيل الخروج"
            >
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-16 bg-gray-50 border-b border-gray-200 flex items-center px-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800 capitalize truncate">
                {activeSection === 'chats' ? 'المحادثات' : 
                 activeSection === 'friends' ? 'الأصدقاء' :
                 activeSection === 'groups' ? 'المجموعات' : 'الإعدادات'}
              </h2>
            </div>

            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
      
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
})

Aside.displayName = 'Aside'

export default Aside
