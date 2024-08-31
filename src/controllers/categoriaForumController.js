const pool = require('../../config/db');
require('dotenv').config();

exports.createCategoriaForum = async (req, res) => {
    const { nome, descricao } = req.body;

    if (!nome || !descricao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const queryText = `
        INSERT INTO categoriaforums (nome, descricao)
        VALUES ($1, $2)
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
        return res.status(500).json({ error: 'Erro ao cadastrar taxonomia' });
    }
};

// exports.deleteCategoriaForum = async (req, res) => {
//     const { id } = req.params;

//     if (!id) {
//         return res.status(400).json({ error: 'ID da taxonomia é obrigatório' });
//     }

//     const queryText = `
//         UPDATE taxonomia
//         SET deletado = true
//         WHERE id = $1
//         RETURNING *;
//     `;

//     try {
//         const client = await pool.connect();
//         const result = await client.query(queryText, [id]);

//         client.release();

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'Taxonomia não encontrada' });
//         }

//         return res.status(200).json(result.rows[0]);
//     } catch (err) {
//         console.error('Erro ao deletar taxonomia:', err);
//         return res.status(500).json({ error: 'Erro ao deletar taxonomia' });
//     }
// };

// exports.updateCategoriaForum = async (req, res) => {
//     const { id } = req.params;
//     const { classe, ordem, subordem, filo, reino } = req.body;

//     if (!id) {
//         return res.status(400).json({ error: 'ID da taxonomia é obrigatório' });
//     }

//     // Cria um objeto com os campos que podem ser atualizados
//     const fieldsToUpdate = { classe, ordem, subordem, filo, reino };
//     const validFields = {};

//     // Filtra apenas os campos válidos que foram fornecidos no corpo da requisição
//     for (let field in fieldsToUpdate) {
//         if (fieldsToUpdate[field] !== undefined) {
//             validFields[field] = fieldsToUpdate[field];
//         }
//     }

//     // Se nenhum campo válido foi fornecido, retorna um erro
//     if (Object.keys(validFields).length === 0) {
//         return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
//     }

//     // Constrói a query dinamicamente
//     const setClause = Object.keys(validFields)
//         .map((field, index) => `${field} = $${index + 1}`)
//         .join(', ');

//     const queryText = `UPDATE taxonomia SET ${setClause} WHERE id = $${Object.keys(validFields).length + 1} RETURNING *;`;
//     const queryValues = [...Object.values(validFields), id];

//     try {
//         const client = await pool.connect();
//         const result = await client.query(queryText, queryValues);

//         client.release();

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'Taxonomia não encontrada' });
//         }

//         return res.status(200).json(result.rows[0]);
//     } catch (err) {
//         console.error('Erro ao atualizar taxonomia:', err);
//         return res.status(500).json({ error: 'Erro ao atualizar taxonomia' });
//     }
// };

// exports.getAllCategoriaForum = async (req, res) => {
//     const queryText = `
//         SELECT * FROM taxonomia
//         WHERE deletado = false;
//     `;

//     try {
//         const client = await pool.connect();
//         const result = await client.query(queryText);

//         client.release();

//         return res.status(200).json(result.rows);
//     } catch (err) {
//         console.error('Erro ao buscar taxonomias:', err);
//         return res.status(500).json({ error: 'Erro ao buscar taxonomias' });
//     }
// };
