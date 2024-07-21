const express = require('express');
const router = new express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');
const cors = require('cors')

router.use(cors())
router.options('*',  cors())

router.post('/api/register', userController.registerUser);
router.post('/api/login', userController.loginUser);
router.get('/users', auth, userController.getAllUsers);
router.get('/users/:id', auth, userController.getUserById);
router.patch('/users/:id', auth, userController.updateUser);
router.delete('/users/:id', auth, userController.deleteUser);

module.exports = router;