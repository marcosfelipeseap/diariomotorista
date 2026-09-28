const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.renderPerfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*, veiculos(placa, modelo)')
            .eq('id', req.session.user.id)
            .single();

        res.render('perfil/index', { 
            usuario, 
            error: req.query.error, 
            success: req.query.success 
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard?error=Erro ao carregar perfil.');
    }
};

exports.atualizarPerfil = async (req, res) => {
    const { nome, email } = req.body;
    const userId = req.session.user.id;

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ nome, email })
            .eq('id', userId);

        if (error) {
            if (error.code === '23505') return res.redirect('/perfil?error=Este e-mail já está em uso por outro usuário.');
            throw error;
        }

        // Atualiza o nome na sessão atual
        req.session.user.nome = nome;

        res.redirect('/perfil?success=Perfil atualizado com sucesso!');
    } catch (err) {
        console.error(err);
        res.redirect('/perfil?error=Erro ao atualizar dados.');
    }
};

exports.atualizarSenha = async (req, res) => {
    const { senha_atual, nova_senha } = req.body;
    const userId = req.session.user.id;

    try {
        // Busca a senha atual no banco
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('senha')
            .eq('id', userId)
            .single();

        const validPassword = await bcrypt.compare(senha_atual, usuario.senha);
        if (!validPassword) {
            return res.redirect('/perfil?error=A senha atual está incorreta.');
        }

        // Criptografa a nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nova_senha, salt);

        await supabase
            .from('usuarios')
            .update({ senha: hashedPassword })
            .eq('id', userId);

        res.redirect('/perfil?success=Senha alterada com sucesso!');
    } catch (err) {
        console.error(err);
        res.redirect('/perfil?error=Erro ao alterar senha.');
    }
};