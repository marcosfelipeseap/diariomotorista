const express = require('express');
const router = express.Router();
const gestorController = require('../controllers/gestorController');
const { isAuthenticated, isGestor } = require('../middlewares/authMiddleware');

// Aplica a proteção em todas as rotas
router.use(isAuthenticated, isGestor);

// Novo Dashboard (Cards de Motoristas)
router.get('/', gestorController.dashboard);
router.get('/monitorar/:id', gestorController.monitorarMotorista);

// Gestão de Veículos
router.get('/veiculos', gestorController.listarVeiculos);
router.post('/veiculos', gestorController.criarVeiculo);
router.post('/veiculos/editar', gestorController.editarVeiculo);
router.post('/veiculos/excluir', gestorController.excluirVeiculo);

// Gestão de Usuários e Vínculos
router.get('/usuarios', gestorController.listarUsuarios);
router.post('/usuarios/status', gestorController.atualizarStatus);
router.post('/usuarios/vincular', gestorController.vincularVeiculo);

module.exports = router;