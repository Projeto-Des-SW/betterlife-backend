const pool = require('../../config/db');
require('dotenv').config();

exports.createCategoriaForum = async (req, res) => {
    const { nome, descricao } = req.body;

    if (!nome || !descricao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const queryText = `
        INSERT INTO categoriaforums (nome, descricao, deletado)
        VALUES ($1, $2, false)
        RETURNING *;
    `;
    const queryValues = [nome, descricao];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao cadastrar categoria de fórum:', err);
        return res.status(500).json({ error: 'Erro ao cadastrar categoria de fórum' });
    }
};

exports.deleteCategoriaForum = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID da categoria de fórum é obrigatório' });
    }

    const queryText = `
        UPDATE categoriaforums
        SET deletado = true
        WHERE id = $1
        RETURNING *;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria de fórum não encontrada' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar categoria de fórum:', err);
        return res.status(500).json({ error: 'Erro ao deletar categoria de fórum' });
    }
};

exports.updateCategoriaForum = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID da categoria é obrigatório' });
    }

    const fieldsToUpdate = { nome, descricao };
    const validFields = {};

    for (let field in fieldsToUpdate) {
        if (fieldsToUpdate[field] !== undefined) {
            validFields[field] = fieldsToUpdate[field];
        }
    }

    if (Object.keys(validFields).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    const setClause = Object.keys(validFields)
        .map((field, index) => `${field} = $${index + 1}`)
        .join(', ');

    const queryText = `UPDATE categoriaforums SET ${setClause} WHERE id = $${Object.keys(validFields).length + 1} RETURNING *;`;
    const queryValues = [...Object.values(validFields), id];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria de fórum não encontrada' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar categoria de fórum:', err);
        return res.status(500).json({ error: 'Erro ao atualizar categoria de fórum' });
    }
};

exports.getAllCategoriaForum = async (req, res) => {
    const queryText = `
        SELECT * FROM categoriaforums
        WHERE deletado = false OR deletado is null;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar taxonomias:', err);
        return res.status(500).json({ error: 'Erro ao buscar taxonomias' });
    }
};
