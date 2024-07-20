const express = require('express');
const userRouter = require('./routes/userRoutes');
const pool = require('../config/db');

const app = express();

app.use(express.json());

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão bem-sucedida:', res.rows[0]);
  }
});

app.use(userRouter);

module.exports = app;