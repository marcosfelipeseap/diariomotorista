const express = require('express');
const router = express.Router();
const multer = require('multer');
const motoristaController = require('../controllers/motoristaController');
const { isAuthenticated, isMotorista } = require('../middlewares/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(isAuthenticated, isMotorista);

router.get('/', motoristaController.dashboard);
router.get('/historico', motoristaController.historico);
router.post('/km-inicial', motoristaController.salvarKmInicial);

router.get('/abastecimento', motoristaController.renderAbastecimento);
router.post('/abastecimento', upload.fields([
    { name: 'foto_bomba', maxCount: 1 },
    { name: 'foto_nota', maxCount: 1 },
    { name: 'foto_painel', maxCount: 1 }
]), motoristaController.salvarAbastecimento);

router.get('/manutencao', motoristaController.renderManutencao);
router.post('/manutencao', upload.array('fotos', 5), motoristaController.salvarManutencao);

module.exports = router;