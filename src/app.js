const express = require('express');
const routes = require('./routes/routes');
const pool = require('../config/db');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');  // Ajuste o caminho conforme necessário

const app = express();

// Configuração do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

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
