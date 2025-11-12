const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  // مصادقة Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // استخدام نفس المفتاح المستخدم في auth.js
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'mySuperAccessSecretKey123!');
      socket.userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    
    // انضمام تلقائي لغرفة المستخدم الشخصية
    socket.join(socket.userId);

    // انضمام لغرفة
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // مغادرة غرفة
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    // إرسال رسالة
    socket.on('send_message', async (data) => {
      try {
        const messageData = {
          content: data.content,
          sender: socket.userId
        };
        
        if (data.toUserId) {
          messageData.receiver = data.toUserId;
        } else if (data.groupId) {
          messageData.group = data.groupId;
        } else {
          // افتراض أن roomId هو receiverId للمحادثات المباشرة
          messageData.receiver = data.roomId;
        }
        
        const message = new Message(messageData);
        
        await message.save();
        await message.populate('sender', 'name phone');
        if (message.receiver) {
          await message.populate('receiver', 'name phone');
        }
        if (message.group) {
          await message.populate('group', 'name description');
        }
        
        // إرسال الرسالة لجميع المستخدمين في الغرفة
        io.to(data.roomId).emit('receive_message', {
          message: message,
          roomId: data.roomId
        });
        
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
      console.log(' User disconnected:', socket.userId);
    });
  });
};

// إضافة وظيفة لإرسال إشعار حذف صديق
const emitFriendRemoved = (userId, friendId, removedFriendData) => {
  if (io) {
    // إرسال إشعار للمستخدم الذي تم حذفه
    io.to(friendId).emit('friend_removed', {
      removedBy: userId,
      message: 'تم حذفك من قائمة الأصدقاء'
    });
    
    // إرسال إشعار للمستخدم الذي قام بالحذف
    io.to(userId).emit('friend_removed_success', {
      removedFriend: removedFriendData,
      message: 'تم حذف الصديق بنجاح'
    });
    
  }
};

const emitFriendAdded = (userId, friendId, friendData) => {
  if (io) {
    // إرسال إشعار للصديق الجديد
    io.to(friendId).emit('friend_added', {
      newFriend: {
        _id: userId,
        name: friendData.requesterName,
        phone: friendData.requesterPhone
      },
      message: `${friendData.requesterName} أضافك كصديق`
    });
    
    // إرسال إشعار للمستخدم الذي أضاف الصديق
    io.to(userId).emit('friend_added_success', {
      newFriend: friendData,
      message: 'تم إضافة الصديق بنجاح'
    });
    
  }
};

module.exports = { initSocket, emitFriendRemoved, emitFriendAdded };
