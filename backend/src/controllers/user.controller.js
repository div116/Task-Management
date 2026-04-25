const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password')
      .populate('teamLead', 'username email role')
      .populate('manager', 'username email role');

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeamLeadsWithMembers = async (req, res) => {
  try {
    const teamLeads = await User.find({ role: 'teamlead' }).select('-password');

    const teamLeadsWithMembers = await Promise.all(
      teamLeads.map(async (tl) => {
        const members = await User.find({ teamLead: tl._id, role: 'employee' }).select(
          '-password'
        );
        return { ...tl.toObject(), members };
      })
    );

    res.json({ success: true, teamLeads: teamLeadsWithMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTeam = async (req, res) => {
  try {
    const members = await User.find({
      teamLead: req.user.id,
      role: 'employee',
    }).select('-password');

    res.json({ success: true, count: members.length, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, role, teamLeadId } = req.body;

    if (req.user.role === 'teamlead' && role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Team leads can only create employee accounts.',
      });
    }

    if (req.user.role === 'manager' && !['teamlead', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Managers can create teamlead or employee accounts.',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res
        .status(409)
        .json({ success: false, message: `${field} already in use.` });
    }

    const userData = { username, email, password, role };

    if (role === 'employee') {
      if (req.user.role === 'teamlead') {
        userData.teamLead = req.user.id;
        userData.manager = req.user.manager;
      } else if (req.user.role === 'manager' && teamLeadId) {
        userData.teamLead = teamLeadId;
        userData.manager = req.user.id;
      }
    } else if (role === 'teamlead') {
      userData.manager = req.user.id;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { teamLeadId, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (teamLeadId !== undefined) user.teamLead = teamLeadId || null;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({ success: true, message: 'User updated successfully.', user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getTeamLeadsWithMembers,
  getMyTeam,
  createUser,
  updateUser,
};
