const pool = require('../../config/db');

// Adicionar animal
exports.addAnimal = async (req, res) => {
    const { nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, imagemid, somid, taxonomiaid } = req.body;

    if (!nome || !nomecientifico || !sexo || !peso || !idade || !descricao || !observacaodaespecie || !usuarioid || !taxonomiaid || !imagemid || !somid) {
        return res.status(400).json({ 
            error: 'Todos os campos obrigatórios devem ser preenchidos.',
            dados: req.body
        });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            INSERT INTO animal (nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, taxonomiaid, imagensid, somid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;

        const result = await client.query(queryText, [nome, nomecientifico, sexo, peso, idade, descricao, observacaodaespecie, usuarioid, taxonomiaid, imagemid, somid]);

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
    queryText = queryText.slice(0, -2);
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
    const { id } = req.params;

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

//Listar animais cadastrados
exports.getAllAnimals = async (req, res) => {
    const queryText = `
         SELECT 
                a.id AS idAnimal, 
                a.nome, 
                a.nomecientifico, 
                a.sexo, 
                a.peso, 
                a.idade, 
                a.descricao,
                a.observacaodaespecie,
                s.id AS IdSom,
                s.arquivosom, 
                s.nomearquivo AS nomeArquivoSom,
                i.arquivofoto,
                i.id AS IdFoto,
                i.nomearquivo AS nomeArquivoFoto,
                t.id AS IdTaxonomia,
                t.classe, 
                t.ordem, 
                t.subordem, 
                t.filo, 
                t.reino
            FROM 
                animal a
            INNER JOIN 
                sons s ON a.somid = s.id
            INNER JOIN 
                imagens i ON a.imagensid = i.id
            INNER JOIN 
                taxonomia t ON a.taxonomiaid = t.id
            WHERE a.deletado = false;
        `;

    try {
        const client = await pool.connect();
        const result = await client.query(queryText);

        client.release();

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar animais:', err);
        return res.status(500).json({ error: 'Erro ao buscar animais' });
    }
};
