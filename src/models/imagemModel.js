const mongoose = require('mongoose');

const imagemSchema = new mongoose.Schema({
    arquivofoto: {
        type: String,
        required: true,
        trim: true
    },
    nomearquivo: {
        type: String,
        required: true,
        trim: true
    },
    datacriacao: {
        type: Date,
        default: Date.now
    },
    animalid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
        required: true
    },
    deletado: {
        type: Boolean,
        default: false
    }
});


imagemSchema.pre('save', async function (next) {
    const imagem = this;
    next();
});

const Imagem = mongoose.model('Imagem', imagemSchema);

module.exports = Imagem;
