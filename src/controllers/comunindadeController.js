const pool = require('../../config/db');
require('dotenv').config();

exports.cadastrarComunidade = async (req, res) => {
    const { nome, descricao, enderecoid, responsavel, telefone, usuarioid } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !usuarioid) {
        return res.status(400).json({ error: 'Os campos obrigatórios não foram preenchidos' });
    }

    const queryText = `
        INSERT INTO comunidade (nome, descricao, enderecoid, responsavel, telefone, usuarioid, deletado)
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING *;
    `;
    const queryValues = [nome, descricao, enderecoid, responsavel, telefone, usuarioid];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao cadastrar comunidade:', err);
        return res.status(500).json({ error: 'Erro ao cadastrar comunidade' });
    }
};

exports.listarComunidades = async (req, res) => {
    const queryText = `
        SELECT * FROM comunidade
        WHERE deletado = false
        ORDER BY id ASC;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar comunidades:', err);
        return res.status(500).json({ error: 'Erro ao listar comunidades' });
    }
};

exports.deletarComunidade = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'O ID da comunidade é obrigatório' });
    }

    const queryText = `
        UPDATE comunidade
        SET deletado = true
        WHERE id = $1
        RETURNING *;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Comunidade não encontrada' });
        }

        return res.status(200).json({ message: 'Comunidade deletada com sucesso', comunidade: result.rows[0] });
    } catch (err) {
        console.error('Erro ao deletar comunidade:', err);
        return res.status(500).json({ error: 'Erro ao deletar comunidade' });
    }
};
