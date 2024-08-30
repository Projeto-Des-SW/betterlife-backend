const pool = require('../../config/db');

exports.salvarFotos = async (req, res) => {
    const {arquivofoto, nomearquivo } = req.body;

    if (!arquivofoto || !nomearquivo) {
        return res.status(400).json({ 
            error: 'Arquivo da foto e nome do arquivo são obrigatórios.', 
            dados: req.body 
        });
    }

    try {
        const client = await pool.connect();

        const dataCriacao = new Date();

        const queryText = `
            INSERT INTO imagens (arquivofoto, nomearquivo, datacriacao)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const result = await client.query(queryText, [arquivofoto, nomearquivo, dataCriacao]);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao salvar fotos:', err);
        return res.status(500).json({ error: 'Erro ao salvar fotos' });
    }
};

exports.editaImagem = async (req, res) => {
    const { id, animalId, arquivofoto, nomearquivo } = req.body;

    if (!id || !animalId || !arquivofoto || !nomearquivo) {
        return res.status(400).json({ 
            error: 'ID da imagem, ID do animal, arquivo da foto e nome do arquivo são obrigatórios.', 
            dados: req.body 
        });
    }

    try {
        const client = await pool.connect();

        const dataAlteracao = new Date();

        const queryText = `
            UPDATE imagens
            SET animalid = $2, arquivofoto = $3, nomearquivo = $4, dataalteracao = $5
            WHERE id = $1 AND deletado = false
            RETURNING *;
        `;

        const result = await client.query(queryText, [id, animalId, arquivofoto, nomearquivo, dataAlteracao]);

        client.release();

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada ou já deletada.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao editar imagem:', err);
        return res.status(500).json({ error: 'Erro ao editar imagem' });
    }
};

exports.deletaImagem = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ 
            error: 'ID da imagem é obrigatório.', 
            dados: req.body 
        });
    }

    try {
        const client = await pool.connect();

        const dataAlteracao = new Date();

        const queryText = `
            UPDATE imagens
            SET deletado = true, dataalteracao = $1
            WHERE id = $2
            RETURNING *;
        `;

        const result = await client.query(queryText, [dataAlteracao, id]);

        client.release();

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada ou já deletada.' });
        }

        return res.status(200).json({ message: 'Imagem deletada com sucesso.', imagem: result.rows[0] });
    } catch (err) {
        console.error('Erro ao deletar imagem:', err);
        return res.status(500).json({ error: 'Erro ao deletar imagem' });
    }
};