const pool = require('../../config/db');


exports.salvarFotos = async (req, res) => {
    const { animalId, arquivofoto, nomearquivo } = req.body;

    if (!animalId || !arquivofoto || !nomearquivo) {
        return res.status(400).json({ 
            error: 'ID do animal, arquivo da foto e nome do arquivo são obrigatórios.', 
            dados: req.body 
        });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            INSERT INTO imagens (animalid, arquivofoto, nomearquivo, datacriacao)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;

        const result = await client.query(queryText, [animalId, arquivofoto, nomearquivo]);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao salvar fotos:', err);
        return res.status(500).json({ error: 'Erro ao salvar fotos' });
    }
};

//editar 
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

        const queryText = `
            UPDATE imagens
            SET animalid = $2, arquivofoto = $3, nomearquivo = $4, datacriacao = NOW()
            WHERE id = $1 AND deletado = false
            RETURNING *;
        `;

        const result = await client.query(queryText, [id, animalId, arquivofoto, nomearquivo]);

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

//deletar
exports.deletaImagem = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ 
            error: 'ID da imagem é obrigatório.', 
            dados: req.body 
        });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            UPDATE imagens
            SET deletado = true
            WHERE id = $1
            RETURNING *;
        `;

        const result = await client.query(queryText, [id]);

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