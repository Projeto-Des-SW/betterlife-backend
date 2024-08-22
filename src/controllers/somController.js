const pool = require('../../config/db'); 
require('dotenv').config(); 

// Função para salvar um novo som
exports.salvarSom = async (req, res) => {
  const { arquivosom, nomearquivo, animalid, datacriacao, deletado } = req.body;

  // Verifica se os campos obrigatórios estão presentes
  if (!arquivosom || !nomearquivo || !animalid) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    // Query SQL para inserir o som na tabela sons
    const query = `
      INSERT INTO public.sons (arquivosom, nomearquivo, datacriacao, animalid, deletado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    // Parâmetros para a query
    const values = [
      arquivosom,
      nomearquivo,
      datacriacao || new Date(), // Define a data atual se não for fornecida
      animalid,
      deletado || false, // Define deletado como false por padrão
    ];

    // Executa a query no banco de dados
    const result = await pool.query(query, values);

    // Retorna o som salvo na resposta
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Em caso de erro, retorna uma mensagem de erro
    res.status(400).json({ message: 'Erro ao salvar o som', error: error.message });
  }
};
