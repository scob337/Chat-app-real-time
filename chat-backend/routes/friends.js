const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/User');
const { emitFriendAdded, emitFriendRemoved } = require('../sockets/socket');

// Get friends - جلب جميع الأصدقاء (المضافين والذين أضافوا المستخدم)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // البحث عن جميع المستخدمين الذين أضافوا المستخدم الحالي أو أضافهم المستخدم الحالي
    const allFriends = await User.find({
      $or: [
        { _id: { $in: (await User.findById(userId)).friends } }, // الأصدقاء الذين أضافهم المستخدم
        { friends: userId } // المستخدمين الذين أضافوا المستخدم الحالي
      ]
    }).select('name phone');
    
    // إزالة التكرارات
    const uniqueFriends = allFriends.filter((friend, index, self) => 
      index === self.findIndex(f => f._id.toString() === friend._id.toString())
    );
    
    return res.json({ friends: uniqueFriends });
  } catch (err) {
    console.error('Error fetching friends:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add friend by phone
router.post('/add', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone required' });
    const toAdd = await User.findOne({ phone });
    if (!toAdd) return res.status(404).json({ message: 'phone not registered' });
    const me = await User.findById(req.user._id);
    if (me.friends.includes(toAdd._id)) return res.status(400).json({ message: 'Already friends' });
    
    // إضافة الصديق للطرفين
    me.friends.push(toAdd._id);
    toAdd.friends.push(me._id);
    
    await me.save();
    await toAdd.save();
    
    // إرسال إشعار Socket.IO
    emitFriendAdded(me._id.toString(), toAdd._id.toString(), {
      _id: toAdd._id,
      name: toAdd.name,
      phone: toAdd.phone,
      requesterName: me.name,
      requesterPhone: me.phone
    });
    
    return res.json({ message: 'Friend added', friend: { _id: toAdd._id, name: toAdd.name, phone: toAdd.phone } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete friend
router.delete('/remove/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    if (!friendId) return res.status(400).json({ message: 'friendId required' });
    
    const me = await User.findById(req.user._id);
    const friend = await User.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    // إزالة الصديق من الطرفين
    me.friends = me.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== me._id.toString());
    
    await me.save();
    await friend.save();
    
    // إرسال إشعار Socket.IO
    emitFriendRemoved(me._id.toString(), friendId, {
      _id: friend._id,
      name: friend.name,
      phone: friend.phone
    });
    
    return res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
