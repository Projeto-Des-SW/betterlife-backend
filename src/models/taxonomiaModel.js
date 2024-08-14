const mongoose = require('mongoose');

const taxonomiaSchema = new mongoose.Schema({
    classe: {
        type: String,
        trim: true
    },
    ordem: {
        type: String,
        trim: true
    },
    subordem: {
        type: String,
        trim: true
    },
    filo: {
        type: String,
        trim: true
    },
    reino: {
        type: String,
        trim: true
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

// Middleware para manipular a lógica antes de salvar, se necessário
taxonomiaSchema.pre('save', async function (next) {
    const taxonomia = this;
    // Adicionar aqui qualquer lógica necessária antes de salvar, por exemplo, validações ou formatação de dados
    next();
});

// Funções de instância podem ser adicionadas aqui, se necessário
taxonomiaSchema.methods.customMethod = function () {
    // Adicionar métodos personalizados para a instância aqui, se necessário
};

const Taxonomia = mongoose.model('Taxonomia', taxonomiaSchema);

module.exports = Taxonomia;
