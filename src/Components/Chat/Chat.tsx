import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import RecivedMSG from "./Message/RecivedMSG";
import SendMSG from "./Message/SendMSG";
import EmojiPicker from "./EmojiPicker";
import api from "../../utils/API";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

interface Message {
  _id: string;
  content: string;
  sender: { _id: string; name: string; phone: string };
  receiver?: { _id: string; name: string; phone: string };
  createdAt: string;
}

interface ChatInfo {
  _id: string;
  name: string;
  phone: string;
  lastSeen?: string;
}

interface ChatResponse {
  chatInfo: ChatInfo;
  messages: Message[];
  type: string;
  totalMessages: number;
}

const Chat = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "direct";
  const { user } = useAuth();
  const { socket, isConnected, joinRoom, sendMessage: socketSendMessage } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getChatMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      const { data } = await api.get<ChatResponse>(`/chat/${chatId}?type=${type}`);
      setMessages(data.messages || []);
      setChatInfo(data.chatInfo);
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    } finally {
      setLoading(false);
    }
  }, [chatId, type]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      
      if (data.message && data.message._id) {
        setMessages(prevMessages => {
          // التأكد من عدم تكرار الرسالة
          const messageExists = prevMessages.some(msg => msg._id === data.message._id);
          if (!messageExists) {
            return [...prevMessages, data.message];
          }
          return prevMessages;
        });
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !chatId || !user || sending) return;

    try {
      setSending(true);
      
      const payload = {
        content: newMessage.trim(),
        type: 'text',
        ...(type === 'direct' ? { receiverId: chatId } : { groupId: chatId })
      };
      
      
      const response = await api.post('/chat/send', payload);
      
      // إضافة الرسالة مباشرة للـ state
      if (response.data && response.data.message) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg._id === response.data.message._id);
          if (!messageExists) {
            return [...prevMessages, response.data.message];
          }
          return prevMessages;
        });
      }
      
      // إرسال عبر Socket للـ real-time
      if (socket && isConnected) {
        socketSendMessage(chatId, newMessage.trim(), type === 'direct' ? chatId : undefined);
      }
      
      setNewMessage("");
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [newMessage, chatId, user, sending, type, socket, isConnected, socketSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  useEffect(() => {
    if (chatId && socket && isConnected) {
      joinRoom(chatId);
    }
  }, [chatId, socket, isConnected, joinRoom]);

  useEffect(() => {
    getChatMessages();
  }, [getChatMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0">
            <img
              src={`https://avatar.iran.liara.run/username?username=${chatInfo?.name || 'User'}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {chatInfo?.name || 'Loading...'}
            </h1>
            <p className="text-sm text-gray-500 truncate">
              {isConnected ? 'متصل' : 'غير متصل'}
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v-40c11.046 0 20 8.954 20 20z'/%3E%3C/g%3E%3C/svg%3E')"}}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-lg font-medium">لا توجد رسائل بعد</p>
            <p className="text-sm">ابدأ محادثة جديدة!</p>
          </div>
        ) : (
          messages
            .filter(msg => msg && msg.sender && msg._id)
            .map((msg) => {
              const isMyMessage = msg.sender?._id === user?.id;
              return isMyMessage ? (
                <SendMSG key={msg._id} content={msg.content || ''} />
              ) : (
                <RecivedMSG 
                  key={msg._id} 
                  content={msg.content || ''} 
                  sender={msg.sender?.name || 'Unknown User'} 
                />
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="bg-white border-t border-gray-200 p-2 sm:p-4 relative">
        <EmojiPicker 
          isOpen={showEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            disabled={!isConnected}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"></path>
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || !isConnected}
              className="w-full p-2 sm:p-3 pr-3 sm:pr-12 rounded-full border border-gray-300 focus:outline-none focus:border-green-500 disabled:opacity-50 transition-colors bg-gray-50 text-sm sm:text-base"
            />
          </div>
          <button 
            onClick={sendMessage}
            disabled={sending || !newMessage.trim() || !isConnected}
            className="bg-green-500 hover:bg-green-600 text-white p-2 sm:p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
