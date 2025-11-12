import { useEffect, useState, useCallback, useMemo, memo } from "react";
import api from "../../utils/API";
import { NavLink } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

interface ChatUser {
  _id: string;
  name: string;
  phone: string;
  lastSeen?: string;
}

interface ChatGroup {
  _id: string;
  name: string;
  description: string;
  members: ChatUser[];
  admins: ChatUser[];
}

interface LastMessage {
  _id: string;
  content: string;
  sender: ChatUser;
  createdAt: string;
}

interface DirectChat {
  _id: string;
  type: 'direct';
  user: ChatUser;
  lastMessage: LastMessage;
}

interface GroupChat {
  _id: string;
  type: 'group';
  name: string;
  description: string;
  members: ChatUser[];
  admins: ChatUser[];
  lastMessage: LastMessage;
}

interface ChatsResponse {
  direct: DirectChat[];
  groups: GroupChat[];
}

const ChatItem = memo(({ chat, formatTime }: { 
  chat: {chatId: string; type: string; displayName: string; displayInfo: string; lastMessage?: LastMessage; avatar: string}; 
  formatTime: (dateString: string) => string; 
}) => {
  return (
    <NavLink
      to={`/chat/${chat.chatId}?type=${chat.type}`}
      className={({ isActive }) => 
        `block border-b border-gray-100 transition-colors ${
          isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'
        }`
      }
    >
      <div className="flex items-center p-3 cursor-pointer">
        <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 flex-shrink-0 relative">
          <img
            src={chat.avatar}
            alt="Avatar"
            className="w-12 h-12 rounded-full"
          />
          {chat.type === 'group' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs">👥</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {chat.displayName}
            </h3>
            {chat.lastMessage && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatTime(chat.lastMessage.createdAt)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 truncate">
            {chat.displayInfo}
          </p>
          
          {chat.lastMessage && (
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 mr-1">
                {chat.lastMessage.sender.name.substring(0, 10)}:
              </span>
              <p className="text-sm text-gray-700 truncate flex-1">
                {chat.lastMessage.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavLink>
  );
});

ChatItem.displayName = 'ChatItem';

const ChatsList = memo(() => {
  const [chats, setChats] = useState<{
    direct: DirectChat[];
    groups: GroupChat[];
  }>({ direct: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  const getChats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ChatsResponse>("/chat/list/all");
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    getChats();
  }, [getChats]);

  const handleNewMessage = useCallback((data:any) => {
    setChats(prevChats => {
      const updatedChats = { ...prevChats };
      
      if (data.message) {
        const msg = data.message;
        const isDirectMessage = msg.receiver;
        
        if (isDirectMessage) {
          const chatPartnerId = msg.sender._id === user?.id ? msg.receiver._id : msg.sender._id;
          const existingChatIndex = updatedChats.direct.findIndex(
            chat => chat.user._id === chatPartnerId
          );
          
          if (existingChatIndex !== -1) {
            updatedChats.direct[existingChatIndex] = {
              ...updatedChats.direct[existingChatIndex],
              lastMessage: msg
            };
            
            const updatedChat = updatedChats.direct.splice(existingChatIndex, 1)[0];
            updatedChats.direct.unshift(updatedChat);
          } else {
            const partnerInfo = msg.sender._id === user?.id ? msg.receiver : msg.sender;
            const newChat: DirectChat = {
              _id: partnerInfo._id,
              type: 'direct',
              user: partnerInfo,
              lastMessage: msg
            };
            updatedChats.direct.unshift(newChat);
          }
        } else if (msg.group) {
          const existingGroupIndex = updatedChats.groups.findIndex(
            chat => chat._id === msg.group._id
          );
          
          if (existingGroupIndex !== -1) {
            updatedChats.groups[existingGroupIndex] = {
              ...updatedChats.groups[existingGroupIndex],
              lastMessage: msg
            };
            
            const updatedGroup = updatedChats.groups.splice(existingGroupIndex, 1)[0];
            updatedChats.groups.unshift(updatedGroup);
          }
        }
      }
      
      return updatedChats;
    });
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, user, handleNewMessage]);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('ar-EG', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }, []);

  const allChats = useMemo(() => {
    return [
      ...chats.direct.map(chat => ({
        ...chat,
        displayName: chat.user.name,
        displayInfo: chat.user.phone,
        avatar: `https://avatar.iran.liara.run/username?username=${chat.user.name}`,
        chatId: chat.user._id
      })),
      ...chats.groups.map(chat => ({
        ...chat,
        displayName: chat.name,
        displayInfo: `${chat.members.length} أعضاء`,
        avatar: `https://avatar.iran.liara.run/username?username=${chat.name}`,
        chatId: chat._id
      }))
    ].sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats.direct, chats.groups]);

  if (loading) {
    return (
      <div className="flex flex-col bg-white w-[100%]">
        <div className="p-4 text-center text-gray-500">
          جاري تحميل المحادثات...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white w-[100%]">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">المحادثات</h2>
      </div>
      
      <div className="overflow-y-auto h-[85vh] w-full">
        {allChats.map((chat) => (
          <ChatItem 
            key={`${chat.type}-${chat.chatId}`}
            chat={chat} 
            formatTime={formatTime}
          />
        ))}
        
        {allChats.length === 0 && (
          <div className="text-center text-gray-500 mt-8 p-4">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-lg mb-2">لا توجد محادثات بعد</p>
            <p className="text-sm">ابدأ محادثة جديدة مع أصدقائك</p>
          </div>
        )}
      </div>
    </div>
  );
});

ChatsList.displayName = 'ChatsList';

export default ChatsList;