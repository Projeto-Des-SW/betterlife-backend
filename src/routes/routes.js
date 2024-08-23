const express = require('express');
const router = new express.Router();
const userController = require('../controllers/userController');
const taxonomiaController = require('../controllers/taxonomiaController');
const animalController = require('../controllers/animalController');
const imagemController = require('../controllers/imagensController');
const somController = require('../controllers/somController');
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

// Rotas para animal
router.post('/api/registerAnimal', animalController.addAnimal);
router.put('/api/updateAnimal/:id', animalController.editAnimal);
router.put('/api/deleteAnimal/:id', animalController.deleteAnimal);
router.get('/api/getAllAnimals', animalController.getAllAnimals);

//Definindo a rota para registrar uma nova imagem
router.post('/api/registerImagem', imagemController.salvarFotos);
router.put('/api/updateImagem/:id', imagemController.editaImagem);
router.put('/api/deleteImagem/:id', imagemController.deletaImagem);


//Rotas para registrar som de um animal
router.post('/api/registerSom', somController.salvarSom);
router.put('/api/updateSom/:id', somController.updateSom);
router.put('/api/deleteSom/:id', somController.deleteSom);

module.exports = router;
