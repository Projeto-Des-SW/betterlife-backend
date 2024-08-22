const pool = require('../../config/db'); 
require('dotenv').config(); 

// Função para salvar um novo som
exports.salvarSom = async (req, res) => {
  const { arquivosom, nomearquivo } = req.body;

  if (!arquivosom || !nomearquivo) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    const query = `
      INSERT INTO public.sons (arquivosom, nomearquivo)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const values = [
      arquivosom,
      nomearquivo,
    ];

    const result = await pool.query(query, values);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao salvar o som', error: error.message });
  }
};

// Deleção lógica de um som (definindo o campo "deletado" como true)
exports.deleteSom = async (req, res) => {
  const { id } = req.params;

  if (!id) {
      return res.status(400).json({ error: 'ID do som é obrigatório' });
  }

  const queryText = `
      UPDATE public.sons
      SET deletado = true
      WHERE id = $1
      RETURNING *;
  `;

  try {
      const result = await pool.query(queryText, [id]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Som não encontrado' });
      }

      return res.status(200).json(result.rows[0]);
  } catch (err) {
      console.error('Erro ao deletar som:', err);
      return res.status(500).json({ error: 'Erro ao deletar som' });
  }
};

// Atualização de um som existente
exports.updateSom = async (req, res) => {
  const { id } = req.params;
  const { arquivosom, nomearquivo } = req.body;

  if (!id) {
      return res.status(400).json({ error: 'ID do som é obrigatório' });
  }

  const fieldsToUpdate = { arquivosom, nomearquivo };
  const validFields = {};

  for (let field in fieldsToUpdate) {
      if (fieldsToUpdate[field] !== undefined) {
          validFields[field] = fieldsToUpdate[field];
      }
  }

  if (Object.keys(validFields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
  }

  const setClause = Object.keys(validFields)
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');

  const queryText = `UPDATE public.sons SET ${setClause} WHERE id = $${Object.keys(validFields).length + 1} RETURNING *;`;
  const queryValues = [...Object.values(validFields), id];

  try {
      const result = await pool.query(queryText, queryValues);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Som não encontrado' });
      }

      return res.status(200).json(result.rows[0]);
  } catch (err) {
      console.error('Erro ao atualizar som:', err);
      return res.status(500).json({ error: 'Erro ao atualizar som' });
  }
};
