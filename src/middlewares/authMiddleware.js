const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', ''); // Pegando o token do cabeçalho
        const decoded = jwt.verify(token, 'your_jwt_secret'); // Decodificando o token com a chave secreta
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }); // Verificando o usuário

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

module.exports = auth;
