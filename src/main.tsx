import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { SocketProvider } from './context/SocketContext.tsx'
import LoginPage from './Pages/Login.tsx'
import ChatLayout from './Layouts/ChatLayout.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Chat from './Components/Chat/Chat.tsx'
import Register from './Pages/Register.tsx'

const Router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
    {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <ChatLayout />,
    children: [
      {
        index: true,
        element: <div className="flex items-center justify-center h-full bg-gray-50 p-4">
          <div className="text-center max-w-md mx-auto">
            <img
              src='https://ai.updf.com/images/web/chat-image-01-img.png'
              alt='chat'
              className='w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-6 object-contain'
            />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3">مرحباً بك في تطبيق المحادثات</h2>
            <p className="text-gray-500 text-sm sm:text-base">اختر محادثة من القائمة الجانبية للبدء</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">أو اضغط على زر القائمة في الشاشات الصغيرة</p>
          </div>
        </div>,
      },
      {
        path: "chat/:chatId", // 👈 هنا عملنا param ديناميك
        element: <Chat />,
      },
    ],
  },
]);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={Router} />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>
)
