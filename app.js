const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
require('dotenv').config();

const app = express();

// IMPORTANTE PARA A VERCEL: Confia no proxy reverso
app.set('trust proxy', 1);

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de Sessão baseada em Cookie (Perfeita para Vercel e Localhost)
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
app.use(cookieSession({
    name: 'session_diario',
    keys: ['chave_secreta_super_segura_motorista'],
    maxAge: thirtyDays,
    secure: process.env.NODE_ENV === 'production', // true na Vercel, false no localhost
    httpOnly: true,
    sameSite: 'lax'
}));

// Disponibilizar a sessão para todas as views do EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Importação das Rotas
const authRoutes = require('./routes/authRoutes');
const gestorRoutes = require('./routes/gestorRoutes');
const motoristaRoutes = require('./routes/motoristaRoutes');
const perfilRoutes = require('./routes/perfilRoutes');

// Definição dos caminhos das Rotas
app.use('/', authRoutes);
app.use('/gestor', gestorRoutes);
app.use('/motorista', motoristaRoutes);
app.use('/perfil', perfilRoutes);

module.exports = app;