const pool = require('../../config/db');

exports.addEndereco = async (req, res) => {
    const { cep, logradouro, bairro, uf, pais, complemento, numero, cidade } = req.body;

    if (!cep || !logradouro || !bairro || !uf || !pais || !complemento || !numero || !cidade) {
        return res.status(400).json({
            error: 'Todos os campos obrigatórios devem ser preenchidos.',
            dados: req.body
        });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            INSERT INTO endereco (cep, logradouro, bairro, uf, pais, complemento, numero, cidade)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const result = await client.query(queryText, [cep, logradouro, bairro, uf, pais, complemento, numero, cidade]);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar endereço:', err);
        return res.status(500).json({ error: 'Erro ao adicionar endereço' });
    }
};

exports.editEndereco = async (req, res) => {
    const { id } = req.params;
    const { cep, logradouro, bairro, uf, pais, complemento, numero, cidade } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do endereço é obrigatório' });
    }

    const allowedUpdates = ['cep', 'logradouro', 'bairro', 'uf', 'pais', 'complemento', 'numero', 'cidade'];
    const updates = Object.keys(req.body).filter(update => allowedUpdates.includes(update));

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    let queryText = 'UPDATE endereco SET ';
    const queryValues = [];
    updates.forEach((field, index) => {
        queryValues.push(req.body[field]);
        queryText += `${field} = $${index + 1}, `;
    });
    queryText = queryText.slice(0, -2);
    queryText += ' WHERE id = $' + (updates.length + 1) + ' RETURNING *;';
    queryValues.push(id);

    try {
        const client = await pool.connect();

        const result = await client.query(queryText, queryValues);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao editar endereço:', err);
        return res.status(500).json({ error: 'Erro ao editar endereço' });
    }
};

exports.deleteEndereco = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID do endereço é obrigatório' });
    }

    try {
        const client = await pool.connect();

        const queryText = 'UPDATE endereco SET deletado = true WHERE id = $1 RETURNING *;';

        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar endereço:', err);
        return res.status(500).json({ error: 'Erro ao deletar endereço' });
    }
};
