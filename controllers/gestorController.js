const supabase = require('../config/supabase');

// ================= DASHBOARD & MONITORAMENTO =================
exports.dashboard = async (req, res) => {
    try {
        // Busca todos os motoristas e seus veículos vinculados
        const { data: motoristas } = await supabase
            .from('usuarios')
            .select('*, veiculos(placa, modelo)')
            .eq('role', 'motorista')
            .order('nome', { ascending: true });

        res.render('gestor/dashboard', { 
            motoristas: motoristas || [],
            error: req.query.error, 
            success: req.query.success 
        });
    } catch (err) {
        console.error(err);
        res.send('Erro ao carregar o dashboard.');
    }
};

exports.monitorarMotorista = async (req, res) => {
    const { id } = req.params;
    let { data_inicio, data_fim } = req.query;

    try {
        // Busca os dados do motorista
        const { data: motorista } = await supabase
            .from('usuarios')
            .select('*, veiculos(*)')
            .eq('id', id)
            .single();

        if (!motorista) return res.redirect('/gestor?error=Motorista não encontrado.');

        // Queries base para histórico
        let queryAbastecimentos = supabase.from('abastecimentos').select('*').eq('usuario_id', id).order('created_at', { ascending: false });
        let queryManutencoes = supabase.from('manutencoes').select('*').eq('usuario_id', id).order('created_at', { ascending: false });

        // Aplica filtros de data se foram informados
        if (data_inicio && data_fim) {
            queryAbastecimentos = queryAbastecimentos.gte('created_at', `${data_inicio} 00:00:00`).lte('created_at', `${data_fim} 23:59:59`);
            queryManutencoes = queryManutencoes.gte('created_at', `${data_inicio} 00:00:00`).lte('created_at', `${data_fim} 23:59:59`);
        }

        const { data: abastecimentos } = await queryAbastecimentos;
        const { data: manutencoes } = await queryManutencoes;

        // Cálculos (Métricas do Gestor)
        const qtdAbastecimentos = abastecimentos.length;
        const totalGastoAbastecimento = abastecimentos.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
        
        const qtdManutencoes = manutencoes.length;
        const totalGastoManutencao = manutencoes.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

        res.render('gestor/monitorar', {
            motorista,
            abastecimentos: abastecimentos || [],
            manutencoes: manutencoes || [],
            filtros: { data_inicio, data_fim },
            metricas: {
                qtdAbastecimentos,
                totalGastoAbastecimento,
                qtdManutencoes,
                totalGastoManutencao
            }
        });
    } catch (err) {
        console.error(err);
        res.redirect('/gestor?error=Erro ao carregar histórico do motorista.');
    }
};

// ================= VEÍCULOS =================
exports.listarVeiculos = async (req, res) => {
    const { data: veiculos, error } = await supabase.from('veiculos').select('*').order('created_at', { ascending: false });
    res.render('gestor/veiculos', { veiculos: veiculos || [], error: req.query.error, success: req.query.success });
};

exports.criarVeiculo = async (req, res) => {
    const { placa, modelo, marca, tipo } = req.body;
    try {
        const { error } = await supabase.from('veiculos').insert([{ placa: placa.toUpperCase().trim(), modelo, marca, tipo }]);
        if (error && error.code === '23505') return res.redirect('/gestor/veiculos?error=Placa já cadastrada.');
        res.redirect('/gestor/veiculos?success=Veículo cadastrado!');
    } catch (err) { res.redirect('/gestor/veiculos?error=Erro ao cadastrar.'); }
};

exports.editarVeiculo = async (req, res) => {
    const { id, placa, marca, modelo, tipo } = req.body;
    try {
        await supabase.from('veiculos').update({ placa: placa.toUpperCase().trim(), marca, modelo, tipo }).eq('id', id);
        res.redirect('/gestor/veiculos?success=Veículo atualizado com sucesso!');
    } catch (err) {
        res.redirect('/gestor/veiculos?error=Erro ao editar veículo.');
    }
};

exports.excluirVeiculo = async (req, res) => {
    const { id } = req.body;
    try {
        const { error } = await supabase.from('veiculos').delete().eq('id', id);
        if (error) {
            // Se o veículo tiver histórico, o banco bloqueia a exclusão por segurança (foreign key)
            if (error.code === '23503') return res.redirect('/gestor/veiculos?error=Não é possível excluir um veículo que já possui histórico de abastecimento/manutenção.');
            throw error;
        }
        res.redirect('/gestor/veiculos?success=Veículo excluído com sucesso!');
    } catch (err) {
        res.redirect('/gestor/veiculos?error=Erro ao excluir veículo.');
    }
};

// ================= USUÁRIOS E VÍNCULOS =================
exports.listarUsuarios = async (req, res) => {
    try {
        const { data: motoristas } = await supabase.from('usuarios').select('*, veiculos(placa, modelo)').eq('role', 'motorista').order('created_at', { ascending: false });
        const { data: todosVeiculos } = await supabase.from('veiculos').select('*');
        const veiculosVinculados = motoristas.map(m => m.veiculo_id).filter(id => id !== null);
        const veiculosDisponiveis = todosVeiculos.filter(v => !veiculosVinculados.includes(v.id));
        res.render('gestor/usuarios', { motoristas: motoristas || [], veiculosDisponiveis: veiculosDisponiveis || [], error: req.query.error, success: req.query.success });
    } catch (err) { res.send('Erro ao carregar usuários.'); }
};

exports.atualizarStatus = async (req, res) => {
    const { id, status } = req.body;
    try {
        await supabase.from('usuarios').update({ status }).eq('id', id);
        res.redirect('/gestor/usuarios?success=Status atualizado!');
    } catch (err) { res.redirect('/gestor/usuarios?error=Erro ao atualizar status.'); }
};

exports.vincularVeiculo = async (req, res) => {
    const { usuario_id, veiculo_id } = req.body;
    try {
        const veiculoToLink = veiculo_id === '' ? null : veiculo_id;
        const { error } = await supabase.from('usuarios').update({ veiculo_id: veiculoToLink }).eq('id', usuario_id);
        if (error && error.code === '23505') return res.redirect('/gestor/usuarios?error=Este veículo já está vinculado a outro motorista!');
        res.redirect('/gestor/usuarios?success=Vínculo atualizado!');
    } catch (err) { res.redirect('/gestor/usuarios?error=Erro ao vincular.'); }
};