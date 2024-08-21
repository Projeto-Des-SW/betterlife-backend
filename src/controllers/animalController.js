const pool = require('../../config/db');

// Adicionar animal
exports.addAnimal = async (req, res) => {
    const { nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, imagemid, somid, taxonomiaid } = req.body;

    if (!nome || !nomecientifico || !sexo || !peso || !idade || !descricao || !observacaodaespecie || !usuarioid || !taxonomiaid) {
        return res.status(400).json({ 
            error: 'Todos os campos obrigatórios devem ser preenchidos.',
            dados: req.body
        });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            INSERT INTO animal (nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, taxonomiaid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const result = await client.query(queryText, [nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, taxonomiaid]);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar animal:', err);
        return res.status(500).json({ error: 'Erro ao adicionar animal' });
    }
};

// Editar animal
exports.editAnimal = async (req, res) => {
    const { id } = req.params;
    const { nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, imagensid, somid, taxonomiaid } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do animal é obrigatório' });
    }

    const allowedUpdates = ['nome', 'nomecientifico', 'sexo', 'peso', 'idade', 'descricao', 'observacaodaespecie', 'usuarioid', 'imagensid', 'somid', 'taxonomiaid'];
    const updates = Object.keys(req.body).filter(update => allowedUpdates.includes(update));

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    let queryText = 'UPDATE animal SET ';
    const queryValues = [];
    updates.forEach((field, index) => {
        queryValues.push(req.body[field]);
        queryText += `${field} = $${index + 1}, `;
    });
    queryText = queryText.slice(0, -2); // Remove a última vírgula
    queryText += ' WHERE id = $' + (updates.length + 1) + ' RETURNING *;';
    queryValues.push(id);

    try {
        const client = await pool.connect();

        const result = await client.query(queryText, queryValues);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao editar animal:', err);
        return res.status(500).json({ error: 'Erro ao editar animal' });
    }
};

// Deletar animal
exports.deleteAnimal = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do animal é obrigatório' });
    }

    try {
        const client = await pool.connect();

        const queryText = 'UPDATE animal SET deletado = true WHERE id = $1 RETURNING *;';

        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar animal:', err);
        return res.status(500).json({ error: 'Erro ao deletar animal' });
    }
};
