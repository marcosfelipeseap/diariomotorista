const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de Sessão Persistente (30 dias para não deslogar toda hora)
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
app.use(session({
    secret: 'chave_secreta_diario_motorista', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: thirtyDays,
        secure: false // Mudar para true no futuro se for rodar com HTTPS
    } 
}));

// Disponibilizar a sessão (usuário logado) para todas as views do EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Importação das Rotas
const authRoutes = require('./routes/authRoutes');
const gestorRoutes = require('./routes/gestorRoutes');
const motoristaRoutes = require('./routes/motoristaRoutes');
const perfilRoutes = require('./routes/perfilRoutes'); // Nova rota de perfil

// Definição dos caminhos das Rotas
app.use('/', authRoutes);
app.use('/gestor', gestorRoutes);
app.use('/motorista', motoristaRoutes);
app.use('/perfil', perfilRoutes);

module.exports = app;