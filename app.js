const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// IMPORTANTE PARA A VERCEL: Confia no proxy reverso para aceitar os cookies HTTPS
app.set('trust proxy', 1);

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de Sessão Otimizada para Produção/Vercel
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
app.use(session({
    secret: 'chave_secreta_diario_motorista', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: thirtyDays,
        secure: true, // Obrigatório true na Vercel (HTTPS)
        httpOnly: true,
        sameSite: 'lax'
    } 
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