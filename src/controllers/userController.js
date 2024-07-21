const User = require('../models/userModel');
const crypto = require('crypto');
const pool = require('../../config/db');

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
        pool.closet();
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
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
