const express = require('express');
const router = new express.Router();
const userController = require('../controllers/userController');
const taxonomiaController = require('../controllers/taxonomiaController');
const animalController = require('../controllers/animalController');
const imagemController = require('../controllers/imagensController');
const auth = require('../middlewares/authMiddleware');
const cors = require('cors');

router.use(cors());
router.options('*', cors());

// Rotas para usuários
router.post('/api/register', userController.registerUser);
router.post('/api/login', userController.loginUser);
router.post('/api/sendEmailReset', userController.sendEmailReset);
router.post('/api/resetPassword', userController.resetPasswordUser);
router.put('/api/updateUser/:id', userController.updateUser);
router.put('/api/deleteUser/:id', userController.deleteUser);
router.get('/api/consultCep/:cep', userController.consultCep);

// Rotas para taxonomia
router.post('/api/taxonomia', taxonomiaController.createTaxonomia);
router.put('/api/deleteTaxonomia/:id', taxonomiaController.deleteTaxonomia);
router.put('/api/updateTaxonomia/:id', taxonomiaController.updateTaxonomia);
router.get('/api/getAllTaxonomia', taxonomiaController.getAllTaxonomia);

// Rotas para taxonomia
router.post('/api/registerAnimal', animalController.addAnimal);
router.put('/api/updateAnimal/:id', animalController.editAnimal);
router.delete('/api/deleteAnimal/:id', animalController.deleteAnimal);

//Definindo a rota para registrar uma nova imagem
router.post('/api/registerImagem', imagemController.salvarFotos);

module.exports = router;
