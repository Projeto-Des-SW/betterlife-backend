const express = require('express');
const routes = require('./routes/routes');
const pool = require('../config/db');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

// Configuração do Swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Limite da requisição
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conexão com o banco de dados para teste
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão bem-sucedida:', res.rows[0]);
  }
});

// Usando as rotas definidas em outro arquivo
app.use(routes);

module.exports = app;
