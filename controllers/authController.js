const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.renderLogin = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('auth/login', { error: null });
};

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*, veiculos(placa)')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.render('auth/login', { error: 'E-mail ou senha incorretos.' });
        }

        const validPassword = await bcrypt.compare(senha, usuario.senha);
        if (!validPassword) {
            return res.render('auth/login', { error: 'E-mail ou senha incorretos.' });
        }

        if (usuario.role === 'motorista' && usuario.status !== 'aprovado') {
            return res.render('auth/login', { error: `Seu cadastro está: ${usuario.status.toUpperCase()}. Aguarde a aprovação do gestor.` });
        }

        // Salva na sessão
        req.session.user = {
            id: usuario.id,
            nome: usuario.nome,
            role: usuario.role,
            veiculo_id: usuario.veiculo_id,
            placa_veiculo: usuario.veiculos ? usuario.veiculos.placa : null
        };

        return res.redirect(usuario.role === 'motorista' ? '/motorista' : '/gestor');
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Erro interno no servidor.' });
    }
};

exports.renderRegister = (req, res) => {
    res.render('auth/register', { error: null, success: null });
};

exports.register = async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const { error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha: hashedPassword, role: 'motorista', status: 'pendente' }]);

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.render('auth/register', { error: 'Este e-mail já está em uso.', success: null });
            }
            throw error;
        }

        res.render('auth/register', { error: null, success: 'Cadastro realizado! Aguarde a aprovação do gestor para fazer login.' });
    } catch (err) {
        console.error(err);
        res.render('auth/register', { error: 'Erro ao cadastrar. Tente novamente.', success: null });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};