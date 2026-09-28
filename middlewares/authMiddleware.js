const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

const isGestor = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'gestor' || req.session.user.role === 'admin')) {
        return next();
    }
    res.status(403).send('Acesso negado. Apenas gestores.');
};

const isMotorista = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'motorista') {
        return next();
    }
    res.status(403).send('Acesso negado. Apenas motoristas.');
};

module.exports = { isAuthenticated, isGestor, isMotorista };