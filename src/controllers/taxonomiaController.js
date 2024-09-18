const pool = require('../../config/db');
require('dotenv').config();

exports.createTaxonomia = async (req, res) => {
    const { classe, ordem, subordem, filo, reino, especie } = req.body;

    if (!classe || !ordem || !subordem || !filo || !reino || !especie) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const queryText = `
        INSERT INTO taxonomia (classe, ordem, subordem, filo, reino, especie)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const queryValues = [classe, ordem, subordem, filo, reino, especie];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao cadastrar taxonomia:', err);
        return res.status(500).json({ error: 'Erro ao cadastrar taxonomia' });
    }
};

exports.deleteTaxonomia = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID da taxonomia é obrigatório' });
    }

    const queryText = `
        UPDATE taxonomia
        SET deletado = true
        WHERE id = $1
        RETURNING *;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Taxonomia não encontrada' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar taxonomia:', err);
        return res.status(500).json({ error: 'Erro ao deletar taxonomia' });
    }
};

exports.updateTaxonomia = async (req, res) => {
    const { id } = req.params;
    const { classe, ordem, subordem, filo, reino, especie } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID da taxonomia é obrigatório' });
    }

    const fieldsToUpdate = { classe, ordem, subordem, filo, reino, especie };
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

    const queryText = `UPDATE taxonomia SET ${setClause} WHERE id = $${Object.keys(validFields).length + 1} RETURNING *;`;
    const queryValues = [...Object.values(validFields), id];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Taxonomia não encontrada' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar taxonomia:', err);
        return res.status(500).json({ error: 'Erro ao atualizar taxonomia' });
    }
};

exports.getAllTaxonomia = async (req, res) => {
    const queryText = `
        SELECT * FROM taxonomia
        WHERE deletado = false;
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
