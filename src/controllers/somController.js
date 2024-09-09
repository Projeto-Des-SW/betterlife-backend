const pool = require('../../config/db');
require('dotenv').config();

exports.salvarSom = async (req, res) => {
  const { arquivosom, nomearquivo } = req.body;

  if (!arquivosom || !nomearquivo) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  const dataCriacao = new Date();
  
  try {
    const query = `
      INSERT INTO public.sons (arquivosom, nomearquivo, datacriacao)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const values = [
      arquivosom,
      nomearquivo,
      dataCriacao
    ];

    const result = await pool.query(query, values);
    res.status(200).json({ id: result.rows[0].id });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao salvar o som', error: error.message });
  }
};

exports.deleteSom = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID do som é obrigatório' });
  }

  const dataAlteracao = new Date();

  const queryText = `
      DELETE FROM sons
      WHERE id = $1
      RETURNING *;
  `;

  try {
    const result = await pool.query(queryText, [dataAlteracao, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Som não encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao deletar som:', err);
    return res.status(500).json({ error: 'Erro ao deletar som' });
  }
};

exports.updateSom = async (req, res) => {
  const { id } = req.params;
  const { arquivosom, nomearquivo } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID do som é obrigatório' });
  }

  const dataalteracao = new Date();

  const fieldsToUpdate = { arquivosom, nomearquivo, dataalteracao };
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

