const User = require('../models/userModel');
const crypto = require('crypto');
const pool = require('../../config/db');
const nodemailer = require('nodemailer');
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
    const { email, senha, nome, documento, telefone, tipousuarioid } = req.body;
    if (!email || !senha || !nome || !documento || !telefone || !tipousuarioid) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const senhaCriptografada = crypto.createHash('md5').update(senha).digest('hex');

    try {
        const client = await pool.connect();
        const queryText = `
            INSERT INTO usuario (email, senha, nome, telefone, tipousuarioid, documento)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const result = await client.query(queryText, [email, senhaCriptografada, nome, telefone, tipousuarioid, documento]);
        client.release();

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
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
            SELECT u.email, u.nome, u.documento, u.telefone, t.nome AS tipoUsuario
            FROM usuario u
            INNER JOIN tipousuario t ON u.tipousuarioid = t.id
            WHERE u.email = $1 AND u.senha = $2;
        `;

        const result = await client.query(queryText, [email, senhaCriptografada]);
        client.release();

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        return res.status(200).json(result.rows[0]);
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
            html: `Você solicitou a recuperação de senha. Clique no <a href="${urlRedefinirSenha}">link ao lado</a> para seguir com a redefinição.`
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

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.updateUser = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }

        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};
