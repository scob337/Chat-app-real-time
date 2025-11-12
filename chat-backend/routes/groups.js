const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');

// Create group
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const group = new Group({ name, description: description || '', createdBy: req.user._id });
    group.admins.push(req.user._id);
    group.members.push(req.user._id);
    // add initial members by phone (optional)
    if (Array.isArray(members)) {
      for (const phone of members) {
        const u = await User.findOne({ phone });
        if (u && !group.members.includes(u._id)) {
          group.members.push(u._id);
        }
      }
    }
    await group.save();
    return res.json({ message: 'Group created', group });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get my groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).select('name description members admins createdBy updatedAt createdAt');
    return res.json({ groups });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add member by phone (admins only)
router.post('/:id/add-member', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(String(req.user._id))) return res.status(403).json({ message: 'Only admins can add members' });
    const u = await User.findOne({ phone });
    if (!u) return res.status(404).json({ message: 'phone not registered' });
    if (group.members.map(String).includes(String(u._id))) return res.status(400).json({ message: 'User already member' });
    group.members.push(u._id);
    await group.save();
    return res.json({ message: 'Member added', member: { id: u._id, name: u.name, phone: u.phone } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Remove member (admins only)
router.delete('/:id/remove-member/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(String(req.user._id))) return res.status(403).json({ message: 'Only admins can remove members' });
    const userId = req.params.userId;
    if (!group.members.map(String).includes(String(userId))) return res.status(400).json({ message: 'User not a member' });
    group.members = group.members.filter(m => String(m) !== String(userId));
    group.admins = group.admins.filter(a => String(a) !== String(userId));
    await group.save();
    return res.json({ message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Promote to admin (admins only)
router.post('/:id/promote', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(String(req.user._id))) return res.status(403).json({ message: 'Only admins can promote' });
    if (!group.members.map(String).includes(String(userId))) return res.status(400).json({ message: 'User not a member' });
    if (!group.admins.map(String).includes(String(userId))) group.admins.push(userId);
    await group.save();
    return res.json({ message: 'User promoted to admin' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update group (admins only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(String(req.user._id))) return res.status(403).json({ message: 'Only admins can update group' });
    if (name) group.name = name;
    if (description) group.description = description;
    if (image) group.image = image;
    await group.save();
    return res.json({ message: 'Group updated', group });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete group (only creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (String(group.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only creator can delete group' });
    await group.remove();
    return res.json({ message: 'Group deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get group members
router.get('/:id/members', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name phone');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    return res.json({ members: group.members });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
