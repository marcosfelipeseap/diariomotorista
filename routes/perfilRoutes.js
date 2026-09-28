const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Protege a rota para apenas usuários logados acessarem
router.use(isAuthenticated);

// Rotas de Perfil
router.get('/', perfilController.renderPerfil);
router.post('/atualizar', perfilController.atualizarPerfil);
router.post('/senha', perfilController.atualizarSenha);

module.exports = router;