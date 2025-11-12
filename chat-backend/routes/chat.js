const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../middlewares/authMiddleware');

// Get chat messages (both 1-to-1 and group)
router.get('/:chatId', auth, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { type } = req.query; // 'direct' or 'group'
        const userId = req.user.id;
        
        let messages;
        let chatInfo;

        if (type === 'direct') {
            // Check if users are friends before showing messages
            const currentUser = await User.findById(userId);
            const targetUser = await User.findById(chatId);
            
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Check if they are mutual friends
            const areFriends = currentUser.friends.includes(chatId) || targetUser.friends.includes(userId);
            
            if (!areFriends) {
                return res.status(403).json({ message: 'You can only chat with friends' });
            }
            
            // Get 1-to-1 chat messages
            messages = await Message.find({
                $or: [
                    { sender: userId, receiver: chatId },
                    { sender: chatId, receiver: userId }
                ]
            })
            .sort({ createdAt: 1 })
            .populate('sender', 'name phone')
            .populate('receiver', 'name phone');

            // Get chat participant info
            chatInfo = await User.findById(chatId).select('name phone lastSeen');

        } else if (type === 'group') {
            // Get group chat messages
            messages = await Message.find({
                group: chatId
            })
            .sort({ createdAt: 1 })
            .populate('sender', 'name phone')
            .populate('group', 'name description');

            // Get group info
            chatInfo = await Group.findById(chatId)
                .populate('members', 'name phone lastSeen')
                .populate('admins', 'name phone');
                
            // Check if user is member of the group
            if (!chatInfo || !chatInfo.members.some(member => member._id.toString() === userId)) {
                return res.status(403).json({ message: 'You are not a member of this group' });
            }
        }

        if (!chatInfo) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json({
            chatInfo,
            messages: messages || [],
            type,
            totalMessages: messages ? messages.length : 0
        });

    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's all chats list (both direct and groups)
router.get('/list/all', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's friends list first
        const currentUser = await User.findById(userId).populate('friends', '_id');
        const friendIds = currentUser.friends.map(friend => friend._id.toString());
        
        // Also get users who have added current user as friend
        const usersWhoAddedMe = await User.find({ friends: userId }).select('_id');
        const usersWhoAddedMeIds = usersWhoAddedMe.map(user => user._id.toString());
        
        // Combine both lists to get all mutual friends
        const allFriendIds = [...new Set([...friendIds, ...usersWhoAddedMeIds])];

        // Get direct chats only with friends
        const directMessages = await Message.find({
            $and: [
                {
                    $or: [{ sender: userId }, { receiver: userId }]
                },
                {
                    $or: [
                        { sender: { $in: allFriendIds }, receiver: userId },
                        { sender: userId, receiver: { $in: allFriendIds } }
                    ]
                }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name phone lastSeen')
        .populate('receiver', 'name phone lastSeen');

        // Get unique chat partners (only friends)
        const chatPartners = new Map();
        directMessages.forEach(msg => {
            const partnerId = msg.sender._id.toString() === userId ? 
                msg.receiver._id : msg.sender._id;
            const partnerIdStr = partnerId.toString();
            
            // Only include if partner is a friend
            if (allFriendIds.includes(partnerIdStr) && !chatPartners.has(partnerIdStr)) {
                chatPartners.set(partnerIdStr, {
                    _id: partnerId,
                    type: 'direct',
                    lastMessage: msg,
                    user: msg.sender._id.toString() === userId ? msg.receiver : msg.sender
                });
            }
        });

        // Get groups
        const groups = await Group.find({
            members: userId
        })
        .populate('members', 'name phone lastSeen')
        .populate('admins', 'name phone')
        .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name phone' }
        });

        const groupChats = groups.map(group => ({
            _id: group._id,
            type: 'group',
            name: group.name,
            description: group.description,
            members: group.members,
            admins: group.admins,
            lastMessage: group.lastMessage
        }));

        res.json({
            direct: Array.from(chatPartners.values()),
            groups: groupChats
        });

    } catch (error) {
        console.error('Error fetching chats list:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send message (both direct and group)
router.post('/send', auth, async (req, res) => {
    try {
        const { content, receiverId, groupId, type = 'text' } = req.body;
        const userId = req.user.id;
        
        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        
        if (!receiverId && !groupId) {
            return res.status(400).json({ message: 'Receiver ID or Group ID is required' });
        }
        
        const message = new Message({
            content,
            sender: userId,
            type
        });
        
        if (receiverId) {
            // Direct message
            message.receiver = receiverId;
        } else if (groupId) {
            // Group message
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }
            
            if (!group.members.includes(userId)) {
                return res.status(403).json({ message: 'You are not a member of this group' });
            }
            
            message.group = groupId;
        }
        
        await message.save();
        
        // Populate sender info
        await message.populate('sender', 'name phone');
        
        res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add member to group
router.post('/group/:groupId/members', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const { groupId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is admin
        if (!group.admins.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }
        
        // Check if user already in group
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'User already in group' });
        }
        
        group.members.push(userId);
        await group.save();
        
        res.json({ message: 'Member added successfully', group });
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove member from group
router.delete('/group/:groupId/members/:userId', auth, async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is admin
        if (!group.admins.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only admins can remove members' });
        }
        
        // Check if user is in group
        if (!group.members.includes(userId)) {
            return res.status(400).json({ message: 'User not in group' });
        }
        
        // Remove user from members
        group.members = group.members.filter(member => member.toString() !== userId);
        
        // If user is admin, remove from admins too
        if (group.admins.includes(userId)) {
            group.admins = group.admins.filter(admin => admin.toString() !== userId);
        }
        
        await group.save();
        
        res.json({ message: 'Member removed successfully', group });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Edit group
router.put('/group/:groupId', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is admin
        if (!group.admins.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only admins can edit group' });
        }
        
        if (name) group.name = name;
        if (description) group.description = description;
        
        await group.save();
        
        res.json({ message: 'Group updated successfully', group });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete group
router.delete('/group/:groupId', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is creator (assuming createdBy field exists)
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only group creator can delete group' });
        }
        
        await Group.findByIdAndDelete(groupId);
        
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;