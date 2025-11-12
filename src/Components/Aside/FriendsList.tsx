import { useEffect, useState, useCallback, memo } from "react";
import api from "../../utils/API";
import { NavLink } from "react-router-dom";
import { FaPlus, FaTrash, FaUserPlus } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";

interface Friend {
  _id: string;
  name: string;
  phone: string;
}

interface FriendsResponse {
  friends: Friend[];
}

const FriendItem = memo(({ friend, onRemove }: { friend: Friend; onRemove: (id: string, name: string) => void }) => {
  return (
    <div className="group relative">
      <NavLink
        to={`/chat/${friend._id}`}
        className={({ isActive }) => 
          `block hover:bg-gray-50 transition-colors ${
            isActive ? 'bg-green-50 border-r-4 border-green-500' : ''
          }`
        }
      >
        <div className="flex items-center p-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 overflow-hidden flex-shrink-0">
            <img
              src={`https://avatar.iran.liara.run/username?username=${friend.name}`}
              alt="User Avatar"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">{friend.name}</h3>
            <p className="text-sm text-gray-500 truncate">{friend.phone}</p>
          </div>
          <div className="text-xs text-gray-400 flex-shrink-0">
            متصل
          </div>
        </div>
      </NavLink>
      
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove(friend._id, friend.name);
        }}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg z-10"
        title={`حذف ${friend.name}`}
      >
        <FaTrash size={12} />
      </button>
    </div>
  );
});

FriendItem.displayName = 'FriendItem';

const FriendsList = memo(() => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { socket } = useSocket();

  const getFriends = useCallback(async () => {
    try {
      const { data } = await api.get<FriendsResponse>("/friends");
      setFriends(data.friends);
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  }, []); 

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  useEffect(() => {
    if (!socket) return;

    const handleFriendAdded = (data: any) => {
      console.log('Friend added notification:', data);
      setMessage({ type: 'success', text: data.message });
      getFriends();
    };

    const handleFriendAddedSuccess = (data: any) => {
      console.log('Friend added successfully:', data);
      setMessage({ type: 'success', text: data.message });
      getFriends();
    };

    const handleFriendRemoved = (data: any) => {
      console.log('Friend removed notification:', data);
      setMessage({ type: 'error', text: data.message });
      getFriends();
    };

    const handleFriendRemovedSuccess = (data: any) => {
      console.log('Friend removed successfully:', data);
      setMessage({ type: 'success', text: data.message });
      getFriends();
    };

    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_added_success', handleFriendAddedSuccess);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_removed_success', handleFriendRemovedSuccess);

    return () => {
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_added_success', handleFriendAddedSuccess);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_removed_success', handleFriendRemovedSuccess);
    };
  }, [socket, getFriends]);

  const addFriend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await api.post("/friends/add", { phone: phoneNumber });
      setMessage({ type: 'success', text: response.data.message });
      setPhoneNumber("");
      setShowAddForm(false);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to add friend' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  const removeFriend = useCallback(async (friendId: string, friendName: string) => {
    if (!confirm(`هل أنت متأكد من حذف ${friendName} من قائمة الأصدقاء؟`)) return;
    
    try {
      await api.delete(`/friends/remove/${friendId}`);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to remove friend' 
      });
    }
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex-shrink-0"
          >
            <FaUserPlus size={14} />
            إضافة صديق
          </button>
        </div>
        
        {showAddForm && (
          <form onSubmit={addFriend} className="mt-3 flex flex-col gap-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="رقم الهاتف"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !phoneNumber.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors text-sm flex-1"
              >
                {isLoading ? 'جاري الإضافة...' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setPhoneNumber("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex-1"
                disabled={isLoading}
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
        
        {message && (
          <div className={`mt-2 p-2 rounded text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {friends.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaUserPlus size={48} className="mx-auto mb-4 text-gray-300" />
            <p>لا توجد أصدقاء بعد</p>
            <p className="text-sm mt-1">اضغط على "إضافة صديق" لبدء إضافة الأصدقاء</p>
          </div>
        ) : (
          friends.map((friend) => (
            <FriendItem 
              key={friend._id} 
              friend={friend} 
              onRemove={removeFriend}
            />
          ))
        )}
      </div>
    </div>
  );
});

FriendsList.displayName = 'FriendsList';

export default FriendsList;
