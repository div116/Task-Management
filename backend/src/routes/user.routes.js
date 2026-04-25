const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getTeamLeadsWithMembers,
  getMyTeam,
  createUser,
  updateUser,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.use(protect);

router.get('/', authorize('manager'), getAllUsers);
router.get('/team-leads', authorize('manager'), getTeamLeadsWithMembers);
router.post('/', authorize('manager', 'teamlead'), createUser);
router.put('/:id', authorize('manager'), updateUser);

router.get('/my-team', authorize('teamlead'), getMyTeam);

module.exports = router;
