const supabase = require('../config/supabase');
const path = require('path');

const uploadToSupabase = async (file) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    
    const { error } = await supabase.storage
        .from('uploadsdiariomotorista') 
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
        .from('uploadsdiariomotorista')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};

exports.dashboard = async (req, res) => {
    try {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*, veiculos(placa, modelo)')
            .eq('id', req.session.user.id)
            .single();

        res.render('motorista/dashboard', { 
            usuario, 
            error: req.query.error, 
            success: req.query.success 
        });
    } catch (err) {
        res.send('Erro ao carregar painel.');
    }
};

exports.historico = async (req, res) => {
    const usuario_id = req.session.user.id;
    let { data_inicio, data_fim } = req.query;

    try {
        let queryAbast = supabase.from('abastecimentos').select('*').eq('usuario_id', usuario_id).order('created_at', { ascending: false });
        let queryManut = supabase.from('manutencoes').select('*').eq('usuario_id', usuario_id).order('created_at', { ascending: false });

        if (data_inicio && data_fim) {
            queryAbast = queryAbast.gte('created_at', `${data_inicio} 00:00:00`).lte('created_at', `${data_fim} 23:59:59`);
            queryManut = queryManut.gte('created_at', `${data_inicio} 00:00:00`).lte('created_at', `${data_fim} 23:59:59`);
        }

        const { data: abastecimentos } = await queryAbast;
        const { data: manutencoes } = await queryManut;

        res.render('motorista/historico', {
            abastecimentos: abastecimentos || [],
            manutencoes: manutencoes || [],
            filtros: { data_inicio, data_fim },
            error: req.query.error
        });
    } catch (err) {
        res.redirect('/motorista?error=Erro ao carregar histórico.');
    }
};

exports.salvarKmInicial = async (req, res) => {
    const { km_inicial } = req.body;
    try {
        await supabase
            .from('usuarios')
            .update({ km_inicial: km_inicial, ultimo_km: km_inicial })
            .eq('id', req.session.user.id);
        res.redirect('/motorista?success=KM inicial registrado!');
    } catch (err) {
        res.redirect('/motorista?error=Erro ao salvar KM.');
    }
};

exports.renderAbastecimento = async (req, res) => {
    const { data: usuario } = await supabase.from('usuarios').select('ultimo_km, veiculo_id').eq('id', req.session.user.id).single();
    if (!usuario.veiculo_id) return res.redirect('/motorista?error=Você não tem veículo vinculado.');
    res.render('motorista/abastecimento', { ultimo_km: usuario.ultimo_km, error: req.query.error });
};

exports.salvarAbastecimento = async (req, res) => {
    const { tipo_1, tipo_2, litros, valor, km, estabelecimento, cidade, estado } = req.body;
    try {
        const { data: usuario } = await supabase.from('usuarios').select('ultimo_km, veiculo_id').eq('id', req.session.user.id).single();
        
        if (parseInt(km) < usuario.ultimo_km) {
            return res.redirect(`/motorista/abastecimento?error=O KM informado (${km}) não pode ser menor que o último (${usuario.ultimo_km}).`);
        }

        const files = req.files;
        if (!files.foto_bomba || !files.foto_nota || !files.foto_painel) {
            return res.redirect('/motorista/abastecimento?error=As 3 fotos são obrigatórias.');
        }

        const urlBomba = await uploadToSupabase(files.foto_bomba[0]);
        const urlNota = await uploadToSupabase(files.foto_nota[0]);
        const urlPainel = await uploadToSupabase(files.foto_painel[0]);

        await supabase.from('abastecimentos').insert([{
            usuario_id: req.session.user.id,
            veiculo_id: usuario.veiculo_id,
            tipo_1, tipo_2: tipo_2 || null, litros, valor, km, estabelecimento, cidade, estado,
            foto_bomba: urlBomba, foto_nota: urlNota, foto_painel: urlPainel
        }]);

        await supabase.from('usuarios').update({ ultimo_km: km }).eq('id', req.session.user.id);
        res.redirect('/motorista?success=Abastecimento registrado com sucesso!');
    } catch (err) {
        res.redirect('/motorista/abastecimento?error=Erro ao salvar abastecimento.');
    }
};

exports.renderManutencao = async (req, res) => {
    const { data: usuario } = await supabase.from('usuarios').select('ultimo_km, veiculo_id').eq('id', req.session.user.id).single();
    if (!usuario.veiculo_id) return res.redirect('/motorista?error=Você não tem veículo vinculado.');
    res.render('motorista/manutencao', { ultimo_km: usuario.ultimo_km, error: req.query.error });
};

exports.salvarManutencao = async (req, res) => {
    const { tipo, valor, km, estabelecimento, cidade, estado } = req.body;
    try {
        const { data: usuario } = await supabase.from('usuarios').select('ultimo_km, veiculo_id').eq('id', req.session.user.id).single();
        
        if (parseInt(km) < usuario.ultimo_km) {
            return res.redirect(`/motorista/manutencao?error=O KM não pode ser menor que o último (${usuario.ultimo_km}).`);
        }

        // Validação estrita de quantidade de fotos no Back-end (5 a 15)
        if (!req.files || req.files.length < 5 || req.files.length > 15) {
            return res.redirect('/motorista/manutencao?error=Você deve enviar entre 5 e 15 fotos.');
        }

        const fotosUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = await uploadToSupabase(file);
                fotosUrls.push(url);
            }
        }

        await supabase.from('manutencoes').insert([{
            usuario_id: req.session.user.id,
            veiculo_id: usuario.veiculo_id,
            tipo, valor, km, estabelecimento, cidade, estado,
            fotos: JSON.stringify(fotosUrls)
        }]);

        await supabase.from('usuarios').update({ ultimo_km: km }).eq('id', req.session.user.id);
        res.redirect('/motorista?success=Manutenção registrada com sucesso!');
    } catch (err) {
        res.redirect('/motorista/manutencao?error=Erro ao salvar manutenção.');
    }
};