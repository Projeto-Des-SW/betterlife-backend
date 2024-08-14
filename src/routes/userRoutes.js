const express = require('express');
const router = new express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');
const cors = require('cors');

router.use(cors())
router.options('*',  cors())

router.post('/api/register', userController.registerUser);
router.post('/api/login', userController.loginUser);
router.post('/api/sendEmailReset', userController.sendEmailReset)
router.post('/api/resetPassword', userController.resetPasswordUser)
router.put('/api/updateUser/:id', userController.updateUser);
router.put('/api/deleteUser/:id', userController.deleteUser);
router.get('/api/consultCep/:cep', userController.consultCep);
router.put('/api/deleteTaxonomia/:id', userController.deleteTaxonomia);
router.put('/api/updateTaxonomia/:id', userController.updateTaxonomia);

module.exports = router;