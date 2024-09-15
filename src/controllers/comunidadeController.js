const pool = require('../../config/db');
require('dotenv').config();

exports.cadastrarComunidade = async (req, res) => {
    const { nome, descricao, enderecoid, responsavel, telefone, usuarioid } = req.body;

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
         SELECT 
            c.id,
            c.nome,
            c.descricao,
            c.responsavel,
            c.telefone,
            c.deletado as deletadoComunidade,
            c.enderecoid,
            e.cep, 
            e.logradouro, 
            e.bairro, 
            e.uf, 
            e.pais, 
            e.complemento, 
            e.numero, 
            e.cidade,
            e.deletado as deletadoEndereco
        FROM comunidade c
        INNER JOIN 
            endereco e ON c.enderecoid = e.id
        WHERE c.deletado = false
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

exports.atualizarComunidade = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, responsavel, telefone } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'O ID da comunidade é obrigatório' });
    }

    const allowedUpdates = ['nome', 'descricao', 'responsavel', 'telefone'];
    const updates = Object.keys(req.body).filter(update => allowedUpdates.includes(update));

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    let queryText = 'UPDATE comunidade SET ';
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

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Comunidade não encontrada' });
        }

        return res.status(200).json({ message: 'Comunidade deletada com sucesso', comunidade: result.rows[0] });
    } catch (err) {
        console.error('Erro ao deletar comunidade:', err);
        return res.status(500).json({ error: 'Erro ao deletar comunidade' });
    }
};

exports.listarComunidadesCriadaPorUsuario = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const queryText = `
          SELECT 
            c.id,
            c.nome,
            c.descricao,
            c.responsavel,
            c.telefone,
            c.deletado as deletadoComunidade,
            c.enderecoid,
            e.cep, 
            e.logradouro, 
            e.bairro, 
            e.uf, 
            e.pais, 
            e.complemento, 
            e.numero, 
            e.cidade,
            e.deletado as deletadoEndereco
        FROM comunidade c
        INNER JOIN 
            endereco e ON c.enderecoid = e.id
        WHERE c.deletado = false and c.usuarioid = $1
        ORDER BY id ASC;
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText, [id]);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar comunidades:', err);
        return res.status(500).json({ error: 'Erro ao listar comunidades' });
    }
};


