const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Superadmin sees/manages staff across every gym; owner sees/manages only
// their own gym's staff (enforced inside the controller).
router.get('/', authorize('owner', 'manager', 'superadmin'), getUsers);
router.post('/', authorize('owner', 'superadmin'), createUser);
router.put('/:id', authorize('owner', 'superadmin'), updateUser);
router.delete('/:id', authorize('owner', 'superadmin'), deleteUser);

module.exports = router;