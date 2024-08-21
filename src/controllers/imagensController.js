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
