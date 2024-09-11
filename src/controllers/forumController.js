const pool = require('../../config/db');
require('dotenv').config();

exports.cadastrarPost = async (req, res) => {
    const { usuarioidpergunta, usuarioidresposta, pergunta, resposta, categoriaforumid } = req.body;

    if (!usuarioidpergunta || !pergunta || !categoriaforumid) {
        return res.status(400).json({ error: 'Os campos obrigatórios não foram preenchidos' });
    }

    const queryText = `
        INSERT INTO forum (usuarioidpergunta, usuarioidresposta, pergunta, resposta, datacriacao, categoriaforumid)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *;
    `;
    const queryValues = [usuarioidpergunta, usuarioidresposta, pergunta, resposta, categoriaforumid];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao cadastrar post:', err);
        return res.status(500).json({ error: 'Erro ao cadastrar post' });
    }
};

exports.listarPosts = async (req, res) => {
    const queryText = `
        SELECT * FROM forum
        WHERE deletado = false OR deletado IS NULL;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar posts:', err);
        return res.status(500).json({ error: 'Erro ao listar posts' });
    }
};

exports.editarPost = async (req, res) => {
    const { id } = req.params;
    const { usuarioidpergunta, usuarioidresposta, pergunta, resposta, categoriaforumid } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do post é obrigatório' });
    }

    const fieldsToUpdate = { usuarioidpergunta, usuarioidresposta, pergunta, resposta, categoriaforumid, dataatualizacao: 'NOW()' };
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

    const queryText = `UPDATE forum SET ${setClause} WHERE id = $${Object.keys(validFields).length + 1} RETURNING *;`;
    const queryValues = [...Object.values(validFields), id];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar post:', err);
        return res.status(500).json({ error: 'Erro ao atualizar post' });
    }
};

exports.deletarPost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID do post é obrigatório' });
    }

    const queryText = `
        UPDATE forum
        SET deletado = true
        WHERE id = $1
        RETURNING *;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar post:', err);
        return res.status(500).json({ error: 'Erro ao deletar post' });
    }
};

exports.listarPostsPorUsuario = async (req, res) => {
    
    const { id } = req.params;
    
    const queryText = `
        SELECT * FROM forum
        WHERE (deletado = false OR deletado IS NULL)
        AND usuarioidpergunta = $1;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar posts por usuário:', err);
        return res.status(500).json({ error: 'Erro ao listar posts por usuário' });
    }
};

exports.listarRespostasForum = async (req, res) => {
    const { id } = req.params;
    
    const queryText = `
        SELECT * FROM forum
        WHERE (deletado = false OR deletado IS NULL)
        AND usuarioidresposta = $1;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar posts por usuário:', err);
        return res.status(500).json({ error: 'Erro ao listar posts por usuário' });
    }
};

exports.buscarPostPorId = async (req, res) => {
    const postId = req.params.id;  
    const queryText = `
        SELECT * FROM forum
        WHERE id = $1 AND (deletado = false OR deletado IS NULL);
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [postId]);

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar post por ID:', err);
        return res.status(500).json({ error: 'Erro ao buscar post por ID' });
    }
};
