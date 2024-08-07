const User = require('../models/userModel');
const crypto = require('crypto');
const pool = require('../../config/db');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.registerUser = async (req, res) => {
    const { email, senha, nome, documento, telefone, tipousuarioid, endereco } = req.body;
    if (!email || !senha || !nome || !documento || !telefone || !tipousuarioid || !endereco) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const senhaCriptografada = crypto.createHash('md5').update(senha).digest('hex');

    try {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const enderecoQuery = `
                INSERT INTO endereco (cep, logradouro, bairro, uf, pais, complemento, numero, cidade)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id;
            `;

            const enderecoResult = await client.query(enderecoQuery, [
                endereco.cep,
                endereco.logradouro,
                endereco.bairro,
                endereco.uf,
                endereco.pais,
                endereco.complemento,
                endereco.numero,
                endereco.cidade
            ]);

            const enderecoId = enderecoResult.rows[0].id;

            const usuarioQuery = `
                INSERT INTO usuario (email, senha, nome, telefone, tipousuarioid, documento, enderecoid)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;

            const userResult = await client.query(usuarioQuery, [email, senhaCriptografada, nome, telefone, tipousuarioid, documento, enderecoId]);

            await client.query('COMMIT');

            return res.status(201).json(userResult.rows[0]);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            return res.status(500).json({ error: 'Erro ao cadastrar usuário e endereço' });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const senhaCriptografada = crypto.createHash('md5').update(senha).digest('hex');

    try {
        const client = await pool.connect();

        const queryText = `
          SELECT 
                u.id, 
                u.email, 
                u.nome, 
                u.documento, 
                u.telefone, 
                u.deletado, 
                u.tipousuarioid, 
                u.enderecoid,
                t.nome AS tipoUsuario,
                e.cep, 
                e.logradouro, 
                e.bairro, 
                e.uf, 
                e.pais, 
                e.complemento, 
                e.numero, 
                e.cidade
            FROM 
                usuario u
            INNER JOIN 
                tipousuario t ON u.tipousuarioid = t.id
            INNER JOIN 
                endereco e ON u.enderecoid = e.id
            WHERE 
                u.email = $1 AND u.senha = $2;
        `;

        const result = await client.query(queryText, [email, senhaCriptografada]);
        client.release();

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const user = result.rows[0];

        if (user.deletado) {
            return res.status(403).json({ error: 'Usuário desativado.' });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Erro ao fazer login.' });
    }
};

exports.sendEmailReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
    }

    try {
        const client = await pool.connect();

        const queryText = `
            SELECT *
            FROM usuario
            WHERE email = $1;
        `;

        const result = await client.query(queryText, [email]);

        if (result.rows.length === 0) {
            client.release();
            return res.status(401).json({ error: 'Email não encontrado.' });
        }

        const token = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
        const dataValidade = new Date(Date.now() + 30 * 60 * 1000);

        const queryInsertRecuperacao = `
            INSERT INTO recuperarcredenciais (token, datavalidade, usuarioid)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const resultInsert = await client.query(queryInsertRecuperacao, [token, dataValidade, result.rows[0].id]);

        const urlRedefinirSenha = `http://localhost:3000/redefinirSenha?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de senha',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Recuperação de Senha</h2>
                    <p>Você solicitou a recuperação de senha. Clique no botão abaixo para seguir com a redefinição:</p>
                    <a href="${urlRedefinirSenha}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
                    <p style="margin-top: 20px;">Se você não solicitou esta recuperação, por favor ignore este e-mail.</p>
                    <p>Atenciosamente,<br/>Sua Equipe de Suporte</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar email:', error);
                return res.status(500).json({ error: 'Erro ao enviar email de recuperação.' });
            }
            console.log('Email enviado:', info.response);
            client.release();
            return res.status(200).json(resultInsert.rows[0]);
        });

    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Erro ao solicitar recuperação de senha.' });
    }
};


exports.resetPasswordUser = async (req, res) => {
    const { senha, confirmacaoSenha, token } = req.body;

    if (senha !== confirmacaoSenha) {
        return res.status(400).json({ error: 'Senhas não coincidem.' });
    }

    try {
        const client = await pool.connect();

        const queryToken = `
            SELECT *
            FROM recuperarcredenciais
            WHERE token = $1
              AND datavalidade > NOW();
        `;

        const resultToken = await client.query(queryToken, [token]);

        if (resultToken.rows.length === 0) {
            client.release();
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        if (resultToken.rows[0].datautilizacao) {
            client.release();
            return res.status(400).json({ error: 'Token já utilizado.' });
        }

        const userId = resultToken.rows[0].usuarioid;

        const senhaHash = crypto.createHash('md5').update(senha).digest('hex');

        const queryUpdatePassword = `
            UPDATE usuario
            SET senha = $1
            WHERE id = $2;
        `;

        await client.query(queryUpdatePassword, [senhaHash, userId]);

        const queryUpdateDataUtilizacao = `
            UPDATE recuperarcredenciais
            SET datautilizacao = NOW()
            WHERE token = $1;
        `;

        await client.query(queryUpdateDataUtilizacao, [token]);

        client.release();

        return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Erro ao solicitar recuperação de senha.' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, nome, documento, telefone, endereco } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const allowedUpdates = ['email', 'nome', 'documento', 'telefone'];
    const updates = Object.keys(req.body).filter(update => allowedUpdates.includes(update));

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    let queryText = 'UPDATE usuario SET ';
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

        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = result.rows[0];

        const tipoUsuarioQuery = `
            SELECT u.id, u.email, u.nome, u.documento, u.telefone, u.deletado, u.tipousuarioid, t.nome AS tipoUsuario
            FROM usuario u
            INNER JOIN tipousuario t ON u.tipousuarioid = t.id
            WHERE u.id = $1;
        `;

        const tipoUsuarioResult = await client.query(tipoUsuarioQuery, [id]);
        client.release();

        if (tipoUsuarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Erro ao recuperar informações do tipo de usuário' });
        }

        return res.status(200).json(tipoUsuarioResult.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};

exports.deleteUser = async (req, res) => {

    const { senha, id } = req.body;
    if (!id || !senha) {
        return res.status(400).json({ error: 'ID e Senha do usuário são obrigatórias' });
    }
    const senhaCriptografada = crypto.createHash('md5').update(senha).digest('hex');
    const queryText = 'UPDATE usuario SET deletado = true WHERE id = $1 RETURNING *;';
    const querySenha = 'SELECT senha FROM usuario WHERE id = $1';
    try {
        const client = await pool.connect();
        const senhaUserResult = await client.query(querySenha, [id]);

        if (senhaUserResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const senhaHashDoBanco = senhaUserResult.rows[0].senha;
        if (senhaCriptografada === senhaHashDoBanco) {
            const result = await client.query(queryText, [id]);

            if (result.rows.length === 0) {
                client.release();
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            client.release();
            return res.status(200).json(result.rows[0]);
        } else {
            client.release();
            return res.status(401).json({ error: 'Senha incorreta' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
};

exports.consultCep = async (req, res) => {
    const { cep } = req.params;

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch CEP information', message: err.message });
    }
};