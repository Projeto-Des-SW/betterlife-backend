const mongoose = require('mongoose');
const { Schema } = mongoose;

const SonsSchema = new Schema({
  arquivosom: {
    type: String, // Equivalente ao tipo `text` no PostgreSQL
    required: true, // Se quiser que seja obrigatório, pode remover se não for o caso
    trim: true
  },
  nomearquivo: {
    type: String, // Equivalente ao tipo `character varying(255)` no PostgreSQL
    maxlength: 255, // Limita o tamanho do string
    trim: true
  },
  datacriacao: {
    type: Date, // Equivalente ao tipo `timestamp without time zone`
    default: Date.now, // Insere a data e hora atuais por padrão
  },
  animalid: {
    type: mongoose.Schema.Types.ObjectId, // Relacionamento com a coleção `animal`
    ref: 'Animal', // Referência ao model `Animal`
    required: true, // Se a referência for obrigatória
  },
  deletado: {
    type: Boolean, // Equivalente ao tipo `boolean` no PostgreSQL
    default: false, // Valor padrão
  }
});

SonsSchema.pre('save', async function (next) {
    const sons = this;
    next();
});

// Define o model com o nome 'Sons' baseado no schema
const Sons = mongoose.model('Sons', SonsSchema);

module.exports = Sons;
