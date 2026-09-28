const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);
router.get('/register', authController.renderRegister);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

// Rota genérica de redirecionamento baseada no cargo
router.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role === 'motorista') return res.redirect('/motorista');
    res.redirect('/gestor');
});

module.exports = router;