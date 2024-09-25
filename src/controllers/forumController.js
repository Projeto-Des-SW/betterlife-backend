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
       SELECT 
            f.*, 
            cf.nome AS nomeCategoria, 
            cf.descricao AS descricaoCategoria
        FROM forum f
        INNER JOIN 
            categoriaforums cf ON f.categoriaforumid = cf.id
        WHERE f.deletado = false OR f.deletado IS NULL;
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
       SELECT 
            f.*, 
            cf.nome AS nomeCategoria, 
            cf.descricao AS descricaoCategoria
        FROM forum f
        INNER JOIN 
            categoriaforums cf ON f.categoriaforumid = cf.id
        WHERE (f.deletado = false OR f.deletado IS NULL) 
        AND f.usuarioidpergunta = $1;
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
       SELECT 
            f.*, 
            cf.nome AS nomeCategoria, 
            cf.descricao AS descricaoCategoria
        FROM forum f
        INNER JOIN 
            categoriaforums cf ON f.categoriaforumid = cf.id
        WHERE f.deletado = false OR f.deletado IS NULL AND f.usuarioidresposta = $1;
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
        SELECT 
            f.*, 
            cf.nome AS nomeCategoria, 
            cf.descricao AS descricaoCategoria
        FROM forum f
        INNER JOIN 
            categoriaforums cf ON f.categoriaforumid = cf.id
        WHERE f.id = $1 AND (f.deletado = false OR f.deletado IS NULL);
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

exports.addRespostaToPost = async (req, res) => {
    const { id } = req.params; // ID do post ao qual adicionar resposta
    const { usuarioidresposta, resposta } = req.body;

    // Verifique se os dados estão corretos
    console.log("Dados recebidos no backend:", { usuarioidresposta, resposta });

    if (!resposta || !usuarioidresposta) {
        return res.status(400).json({ error: 'Usuário e resposta são obrigatórios' });
    }

    const queryText = `
        INSERT INTO respostas (postid, usuarioidresposta, resposta)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const queryValues = [id, usuarioidresposta, resposta];

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, queryValues);
        client.release();

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar resposta:', err);
        return res.status(500).json({ error: 'Erro ao adicionar resposta' });
    }
};



exports.listarRespostasPorPost = async (req, res) => {
    const { id } = req.params; // ID do post para o qual queremos listar as respostas

    const queryText = `
        SELECT r.*, u.nome AS nomeUsuario
        FROM respostas r
        INNER JOIN usuario u ON r.usuarioidresposta = u.id
        WHERE r.postid = $1
        ORDER BY r.dataresposta ASC;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);
        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar respostas:', err);
        return res.status(500).json({ error: 'Erro ao listar respostas' });
    }
};

